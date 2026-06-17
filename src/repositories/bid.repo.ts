import { Prisma } from "generated/prisma/client";
import { prisma } from "@/config/db.connection";
import { PrismaTransactionClient } from "@/types/transaction.types";
import { paginationInput } from "@/types/pagination.types";

export class BidRepository {
  async getAllBidsByAuctionId(auctionId: string) {
    const pageSize = 10;
    let cursor: { id: string } | undefined = undefined;
    let hasMore = true;
    const results = [];

    while (hasMore) {
      const records = await prisma.bid.findMany({
        where: {
          deletedAt: null,
          auctionId,
          isValid: true,
        },
        take: pageSize,
        skip: cursor ? 1 : 0,
        cursor: cursor,
        orderBy: {
          id: "asc",
        },
      });

      if (records.length === 0) {
        hasMore = false;
        break;
      }

      results.push(...records);

      if (records.length < pageSize) {
        hasMore = false;
      } else {
        const lastItem = records[records.length - 1];
        cursor = { id: lastItem.id };
      }
    }

    return results;
  }

  async getBidsByAuctionIdWithPagination(
    auctionId: string,
    filter: paginationInput,
  ) {
    const [data, total] = await Promise.all([
      prisma.bid.findMany({
        where: {
          auctionId,
          deletedAt: null,
          isValid: true,
        },
        take: filter.take,
        skip: filter.skip,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.bid.count({
        where: {
          auctionId,
          deletedAt: null,
          isValid: true,
        },
      }),
    ]);

    return {
      data,
      metadata: {
        total,
        skip: filter.skip,
        take: filter.take,
      },
    };
  }

  async hasBids(
    auctionId: string,
    tx?: PrismaTransactionClient,
  ): Promise<boolean> {
    const client = tx ?? prisma;
    const bidCount = await client.bid.count({
      where: {
        auctionId,
        deletedAt: null,
      },
    });
    return bidCount > 0;
  }

  async findHighestBidByAuction(
    auctionId: string,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    return await client.bid.findFirst({
      where: {
        auctionId,
        deletedAt: null,
        isValid: true,
      },
      orderBy: {
        price: "desc",
      },
    });
  }

  /*
  SELECT * FROM Bid b JOIN Auction a ON b.auctionId = a.id
  GROUP BY auctionId
  ORDER BY price DESC
  LIMIT 
  */

  async createBid(data: Prisma.BidCreateInput, tx?: PrismaTransactionClient) {
    const client = tx ?? prisma;
    return await client.bid.create({
      data,
    });
  }

  async updateBid(
    id: string,
    data: Prisma.BidUpdateInput,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    return await client.bid.update({
      where: {
        id,
      },
      data,
    });
  }
}

export const bidRepository = new BidRepository();
