import { antiqueRepository } from "@/repositories/antique.repo";
import { auctionRepository } from "@/repositories/auction.repo";
import { userRepository } from "@/repositories/user.repo";
import { paginationInput } from "@/types/pagination.types";
import { AppError } from "@/utils/app-error.utils";
import { Prisma, AuctionStatus, AntiqueStatus } from "generated/prisma/client";
import { prisma } from "@/config/db.connection";
import { auctionAntiqueReposistory } from "@/repositories/auction-antique.repo";
import { bidRepository } from "@/repositories/bid.repo";

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

        const isInActiveOrFinishedAuction = antique.auctionAntiques.some(
          (aa) =>
            aa.auction.status === AuctionStatus.active ||
            aa.auction.status === AuctionStatus.finished,
        );

        if (isInActiveOrFinishedAuction) {
          throw new AppError(
            400,
            `Antique '${antique.name}' (${antique.id}) is already part of an active or finished auction.`,
          );
        }
      }

      const auction = await auctionRepository.createOneAuction(
        sellerId,
        data,
        tx,
      );

      await auctionAntiqueReposistory.createMany(auction.id, antiqueIds, tx);

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

    return await prisma.$transaction(async (tx) => {
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

      const hasBids = await bidRepository.hasBids(auctionId, tx);
      const currentAntiqueIds = (
        await auctionAntiqueReposistory.findByAuctionId(auctionId)
      ).map((aa) => aa.antiqueId);

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

          const isInOtherActiveAuction = antique.auctionAntiques.some(
            (aa) =>
              aa.auctionId !== auctionId &&
              (aa.auction.status === AuctionStatus.active ||
                aa.auction.status === AuctionStatus.finished),
          );

          if (isInOtherActiveAuction) {
            throw new AppError(
              400,
              `Antique '${antique.name}' (${antique.id}) is already part of an active or finished auction.`,
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
}

export const auctionService = new AuctionService();
