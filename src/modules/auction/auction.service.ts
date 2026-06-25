import { antiqueRepository } from "@/repositories/antique.repo";
import { auctionRepository } from "@/repositories/auction.repo";
import { userRepository } from "@/repositories/user.repo";
import { paginationInput } from "@/types/pagination.types";
import { AppError } from "@/utils/app-error.utils";
import {
  Prisma,
  AuctionStatus,
  AntiqueStatus,
  NotificationType,
} from "generated/prisma/client";
import { prisma } from "@/config/db.connection";
import { auctionAntiqueReposistory } from "@/repositories/auction-antique.repo";
import { bidRepository } from "@/repositories/bid.repo";
import {
  scheduleAuctionFinish,
  rescheduleAuctionFinish,
  scheduleAuctionStart,
  rescheduleAuctionStart,
  removeJobFromAuctionQueue,
} from "@/queues/auction.queue";
import util from "util";
import { redisService } from "@/services/redis.service";
import { notificationService } from "../notification/notification.service";
import { getIO } from "@/config/socket.config";

interface AntiqueWithAuctionResult {
  id: string;
  auctionId: string;
  auctionStatus: AuctionStatus;
}

export class AuctionService {
  async getAuctionById(id: string) {
    const existingAuction = await auctionRepository.findById(id);

    if (!existingAuction)
      throw new AppError(400, "This auction does not exist");

    if (existingAuction.deletedAt)
      throw new AppError(400, "This auction has already been deleted");

    return existingAuction;
  }

  async getAuctionBySeller(sellerId: string, filter: paginationInput) {
    const existingSeller = await userRepository.findById(sellerId);

    if (!existingSeller) throw new AppError(400, "This seller does not exist");

    if (existingSeller.deletedAt)
      throw new AppError(400, "This seller has already been deleted");

    const auctionList = await auctionRepository.findBySellerId(
      sellerId,
      filter,
    );

    return auctionList;
  }

  async createAuction(
    sellerId: string,
    data: Prisma.AuctionCreateInput,
    antiqueIds: Array<string>,
  ) {
    const existingSeller = await userRepository.findById(sellerId);

    if (!existingSeller) throw new AppError(400, "This seller does not exist");

    if (existingSeller.deletedAt)
      throw new AppError(400, "This seller has already been deleted");

    return await prisma.$transaction(async (tx) => {
      const antiquesToValidate = await antiqueRepository.findByIdList(
        antiqueIds,
        tx,
      );

      console.log(
        util.inspect(antiquesToValidate, {
          depth: null,
          colors: true,
          maxArrayLength: null,
        }),
      );

      if (antiquesToValidate.length !== antiqueIds.length) {
        const foundIds = antiquesToValidate.map((a) => a.id);
        const notFoundIds = antiqueIds.filter((id) => !foundIds.includes(id));
        throw new AppError(
          404,
          `Antiques not found or deleted: ${notFoundIds.join(", ")}`,
        );
      }

      for (const antique of antiquesToValidate) {
        if (antique.status !== AntiqueStatus.available || antique.deletedAt) {
          throw new AppError(
            400,
            `Antique '${antique.name}' (${antique.id}) is not available for auction.`,
          );
        }

        const auctionStatusOfUpdatedAntiques = antique.auctionAntiques.map(
          (el) => el.auction.status,
        );

        const isInActiveOrFinishedAuction = auctionStatusOfUpdatedAntiques.some(
          (aa) =>
            aa === AuctionStatus.active ||
            aa === AuctionStatus.finished ||
            aa === AuctionStatus.not_started,
        );

        if (isInActiveOrFinishedAuction) {
          throw new AppError(
            400,
            `Antique '${antique.name}' (${antique.id}) is already part of other auction.`,
          );
        }
      }

      const auction = await auctionRepository.createOneAuction(
        sellerId,
        data,
        tx,
      );

      await auctionAntiqueReposistory.createMany(auction.id, antiqueIds, tx);

      await scheduleAuctionFinish(auction.id, auction.endsAt);
      await scheduleAuctionStart(auction.id, auction.startsAt);

      return tx.auction.findUnique({
        where: { id: auction.id },
        include: {
          auctionAntiques: {
            include: { antique: true },
          },
        },
      });
    });
  }

  isSameArray(current: Array<string>, updated: Array<string>) {
    const currentSet = new Set(current);
    const updatedSet = new Set(updated);
    return (
      currentSet.size === updatedSet.size &&
      current.every((val) => updatedSet.has(val))
    );
  }

  async updateAuction(
    sellerId: string,
    auctionId: string,
    data: Prisma.AuctionUpdateInput,
    updatedAntiqueIds?: Array<string>,
  ) {
    const seller = await userRepository.findById(sellerId);
    if (!seller) throw new AppError(404, "Seller does not exist");

    const newEndsAt =
      data.endsAt instanceof Date
        ? data.endsAt
        : (data.endsAt as { set?: Date } | undefined)?.set;

    const newStartsAt =
      data.startsAt instanceof Date
        ? data.startsAt
        : (data.startsAt as { set?: Date } | undefined)?.set;

    let currentEndsAt: Date | undefined;
    let currentStartsAt: Date | undefined;

    const updatedAuction = await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction) throw new AppError(404, "Auction does not exist");

      if (auction.sellerId !== sellerId) {
        throw new AppError(
          403,
          "You do not have permission to update this auction",
        );
      }

      if (
        auction.status === AuctionStatus.finished ||
        auction.status === AuctionStatus.cancelled
      ) {
        throw new AppError(
          400,
          `Cannot update auction in '${auction.status}' status`,
        );
      }

      if (new Date() > auction.endsAt) {
        throw new AppError(
          400,
          "Cannot update an auction that has already ended",
        );
      }

      currentEndsAt = auction.endsAt;
      currentStartsAt = auction.startsAt;

      const hasBids = await bidRepository.hasBids(auctionId, tx);
      const currentAntiqueIds = (
        (await auctionAntiqueReposistory.findByAuctionId(
          auctionId,
          tx,
        )) as Array<{
          antiqueId: string;
        }>
      ).map((aa: { antiqueId: string }) => aa.antiqueId);

      if (hasBids) {
        if (
          data.hasOwnProperty("startingPrice") ||
          data.hasOwnProperty("stepPrice") ||
          data.hasOwnProperty("startsAt") ||
          data.hasOwnProperty("endsAt") ||
          (updatedAntiqueIds &&
            !this.isSameArray(currentAntiqueIds, updatedAntiqueIds))
        ) {
          throw new AppError(
            400,
            "Cannot update startingPrice, stepPrice, dates, or antiques for an auction that already has bids",
          );
        }
      }

      if (auction.status === AuctionStatus.active) {
        if (
          data.hasOwnProperty("startingPrice") ||
          data.hasOwnProperty("stepPrice") ||
          data.hasOwnProperty("startsAt") ||
          (updatedAntiqueIds &&
            !this.isSameArray(currentAntiqueIds, updatedAntiqueIds))
        ) {
          throw new AppError(
            400,
            "Cannot update startingPrice, stepPrice, startsAt, or antiques for an active auction",
          );
        }
      }

      if (updatedAntiqueIds) {
        const antiquesToValidate = await antiqueRepository.findByIdList(
          updatedAntiqueIds,
          tx,
        );

        if (antiquesToValidate.length !== updatedAntiqueIds.length) {
          const foundIds = antiquesToValidate.map((a) => a.id);
          const notFoundIds = updatedAntiqueIds.filter(
            (id) => !foundIds.includes(id),
          );
          throw new AppError(
            404,
            `Antiques not found: ${notFoundIds.join(", ")}`,
          );
        }

        for (const antique of antiquesToValidate) {
          if (antique.status !== AntiqueStatus.available || antique.deletedAt) {
            throw new AppError(
              400,
              `Antique '${antique.name}' (${antique.id}) is not available for auction.`,
            );
          }

          const isInAnotherAuction = antique.auctionAntiques.some(
            (aa) =>
              aa.auctionId !== auction.id &&
              aa.auction.status !== AuctionStatus.cancelled,
          );

          if (isInAnotherAuction) {
            throw new AppError(
              400,
              `Antique '${antique.name}' (${antique.id}) is already part of other auction.`,
            );
          }
        }

        await auctionAntiqueReposistory.deleteByAuctionId(auctionId, tx);
        await auctionAntiqueReposistory.createMany(
          auctionId,
          updatedAntiqueIds,
          tx,
        );
      }

      await auctionRepository.updateAuction(auctionId, data, tx);

      return tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          auctionAntiques: {
            include: { antique: true },
          },
        },
      });
    });

    console.log("data.endsAt raw:", data.endsAt);
    console.log("data.endsAt instanceof Date:", data.endsAt instanceof Date);

    console.log("Current endsAt raw:", currentEndsAt);
    console.log(
      "Current endsAt instanceof Date:",
      currentEndsAt instanceof Date,
    );

    const shouldRescheduleFinish =
      newEndsAt !== undefined &&
      currentEndsAt !== undefined &&
      newEndsAt.getTime() !== currentEndsAt.getTime();

    const shouldRescheduleStart =
      newStartsAt !== undefined &&
      currentStartsAt !== undefined &&
      newStartsAt.getTime() !== currentStartsAt.getTime();

    if (shouldRescheduleFinish) {
      await rescheduleAuctionFinish(auctionId, newEndsAt!);
    }
    if (shouldRescheduleStart) {
      await rescheduleAuctionStart(auctionId, newStartsAt!);
    }

    return updatedAuction;
  }

  async cancelAuction(auctionId: string, sellerId: string) {
    const seller = await userRepository.findById(sellerId);
    if (!seller) throw new AppError(404, "Seller does not exist");

    return await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction) throw new AppError(404, "Auction does not exist");

      if (auction.sellerId !== sellerId) {
        throw new AppError(
          403,
          "You do not have permission to cancel this auction",
        );
      }

      if (
        auction.status === AuctionStatus.finished ||
        auction.status === AuctionStatus.cancelled
      ) {
        throw new AppError(
          400,
          "Cannot cancel an auction that has already finished or been cancelled",
        );
      }

      if (new Date() > auction.endsAt) {
        throw new AppError(
          400,
          "Cannot cancel an auction that has already ended",
        );
      }

      const hasBids = await bidRepository.hasBids(auctionId, tx);
      if (hasBids) {
        throw new AppError(
          400,
          "Cannot cancel an auction that already has bids",
        );
      }

      await auctionRepository.updateAuction(
        auctionId,
        { status: AuctionStatus.cancelled },
        tx,
      );

      await removeJobFromAuctionQueue("finish", auctionId);

      if (auction.status === AuctionStatus.not_started) {
        await removeJobFromAuctionQueue("start", auctionId);
      }

      return tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          auctionAntiques: {
            include: { antique: true },
          },
        },
      });
    });
  }

  async finishAuction(auctionId: string) {
    const finished = await prisma.$transaction(async (tx) => {
      const existingAuction = await auctionRepository.findById(auctionId, tx);

      if (!existingAuction)
        throw new AppError(400, "This auction does not exist");
      if (existingAuction.status !== AuctionStatus.active)
        throw new AppError(400, "This auction is no longer active.");
      if (existingAuction.endsAt > new Date())
        throw new AppError(400, "This auction has not ended yet..");

      const highestBid = await bidRepository.findHighestBidByAuction(
        auctionId,
        tx,
      );

      const winnerId = highestBid?.userId ?? null;

      const finishedAuction = await auctionRepository.updateAuction(
        auctionId,
        {
          status: AuctionStatus.finished,
          auctionWinner: winnerId ? { connect: { id: winnerId } } : undefined,
        },
        tx,
      );

      if (finishedAuction.winnerId) {
        const soldAntiques = await antiqueRepository.findAllByAuctionId(
          auctionId,
          tx,
        );

        await antiqueRepository.updateManyAntiques(
          soldAntiques,
          {
            status: AntiqueStatus.sold,
          },
          tx,
        );
      }

      return {
        finishedAuction,
        title: finishedAuction.title,
        winner: finishedAuction.winnerId,
        seller: finishedAuction.sellerId,
        highestBid: highestBid.price,
        auction: auctionId,
      };
    });

    await this.postAuctionFinish(
      finished.title,
      finished.auction,
      finished.winner,
      finished.seller,
      finished.highestBid,
    );

    return finished.finishedAuction;
  }

  async startAuction(auctionId: string) {
    return await prisma.$transaction(async (tx) => {
      const existingAuction = await auctionRepository.findById(auctionId, tx);

      if (!existingAuction)
        throw new AppError(400, "This auction does not exist");
      if (existingAuction.status !== AuctionStatus.not_started)
        throw new AppError(
          400,
          "Can not activate this auction because of its status.",
        );
      if (existingAuction.startsAt > new Date())
        throw new AppError(400, "It's not time to activate this auction.");

      const activeAuction = await auctionRepository.updateAuction(
        auctionId,
        {
          status: AuctionStatus.active,
        },
        tx,
      );

      return activeAuction;
    });
  }

  async placeBid(userId: string, auctionId: string, bidPrice: number) {
    // Rate limit
    const allowed = await redisService.acquireBidLock(auctionId, userId);
    if (!allowed) {
      throw new AppError(
        429,
        "You're bidding too fast! Please wait 2 seconds before bidding again.",
      );
    }

    try {
      const bid = await prisma.$transaction(
        async (tx) => {
          const existingAuction = await auctionRepository.findById(
            auctionId,
            tx,
          );

          if (!existingAuction)
            throw new AppError(404, "This auction does not exist");
          if (existingAuction.status !== AuctionStatus.active)
            throw new AppError(400, "This auction is not active");
          if (existingAuction.endsAt < new Date())
            throw new AppError(400, "This auction has been already finished");
          if (userId === existingAuction.sellerId)
            throw new AppError(400, "Seller cannot bid on their own auction");

          const minBid =
            Number(existingAuction.currentPrice) +
            Number(existingAuction.stepPrice);

          if (bidPrice < minBid) {
            throw new AppError(400, `Bid must be at least ${minBid}`);
          }

          // Sliding window
          const now = new Date();
          const timeLeft = existingAuction!.endsAt.getTime() - now.getTime();
          const windowMs = existingAuction!.extendWindowSec * 1000;
          const isInLastWindow = timeLeft <= windowMs;
          const canExtend =
            existingAuction!.extendCount < existingAuction!.maxExtendCount;

          let newEndsAt: Date | null = null;

          if (isInLastWindow && canExtend) {
            newEndsAt = new Date(
              existingAuction!.endsAt.getTime() +
                existingAuction!.extendDurationSec * 1000,
            );
          }
          const newBid = await bidRepository.createBid(
            {
              price: bidPrice,
              isValid: true,
              auctionBid: {
                connect: {
                  id: auctionId,
                },
              },
              auctionBidder: {
                connect: {
                  id: userId,
                },
              },
            },
            tx,
          );

          await auctionRepository.updateAuction(
            auctionId,
            {
              currentPrice: bidPrice,
              lastBidAt: now,
              ...(newEndsAt && {
                endsAt: newEndsAt,
                extendCount: { increment: 1 },
              }),
            },
            tx,
          );

          return { newBid, newEndsAt };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      console.log(bid.newEndsAt);
      if (bid.newEndsAt) {
        await rescheduleAuctionFinish(auctionId, bid.newEndsAt);
      }

      const io = getIO();
      io.to(`auction:${auctionId}`).emit("auction:price_updated", {
        auctionId,
        currentPrice: bidPrice,
        bidderId: userId,
        bidTime: new Date().toISOString(),
        newEndsAt: bid.newEndsAt?.toISOString(),
      });

      return bid.newBid;
    } catch (error: any) {
      if (error?.code === "P2034") {
        throw new AppError(409, "Bid conflict, please try again.");
      }
      throw error;
    }
  }

  async getBidsOfAuction(auctionId: string, filter: paginationInput) {
    const existingAuction = await auctionRepository.findById(auctionId);

    if (!existingAuction)
      throw new AppError(404, "This auction does not exist");

    return await bidRepository.getBidsByAuctionIdWithPagination(
      auctionId,
      filter,
    );
  }

  async validateAuctionJoinable(auctionId: string) {
    const auction = await auctionRepository.findById(auctionId);

    if (!auction || auction.deletedAt) {
      return {
        valid: false,
        message: "Auction not found",
      };
    }

    const blockedStatuses: AuctionStatus[] = ["finished", "cancelled"];
    if (blockedStatuses.includes(auction.status)) {
      return {
        valid: false,
        message: `This auction has ${auction.status} status`,
      };
    }

    return { valid: true };
  }

  async postAuctionFinish(
    title: string,
    auctionId: string,
    winner: string | null,
    seller: string,
    highestBid: number | null,
  ) {
    await Promise.all([
      winner
        ? notificationService.createPersonalNotification(
            "Auction update",
            winner,
            `Congratulations! You have won the auction with a bid of ${highestBid}`,
            NotificationType.win,
          )
        : null,
      notificationService.createPersonalNotification(
        "Auction update",
        seller,
        winner
          ? `Your auction ${title} has ended. A winner was found.`
          : `Your auction ${title} has ended. There was no winner.`,
        NotificationType.auction_update,
      ),
    ]);
  }
}

export const auctionService = new AuctionService();
