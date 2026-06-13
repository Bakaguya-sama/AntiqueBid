import { Prisma } from "@prisma/client/extension";
import { prisma } from "@/config/db.connection";
import { PrismaTransactionClient } from "@/types/transaction.types";

export class BidRepository {
  async getAllBidsByAuctionId(auctionId: string) {
    const pageSize = 10;
    let cursor: { id: string } | undefined = undefined;
    let hasMore = true;
    const resultIds = [];

    while (hasMore) {
      const records = await prisma.bid.findMany({
        where: {
          deletedAt: null,
          auctionId,
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

      resultIds.push(...records);

      if (records.length < pageSize) {
        hasMore = false;
      } else {
        const lastItem = records[records.length - 1];
        cursor = { id: lastItem.id };
      }
    }

    return resultIds;
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
}

export const bidRepository = new BidRepository();
