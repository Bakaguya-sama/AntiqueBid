import { Prisma } from "generated/prisma/client";
import { prisma } from "@/config/db.connection";
import { paginationInput } from "@/types/pagination.types";
import { PrismaTransactionClient } from "@/types/transaction.types";

export class AuctionRepository {
  async findById(auctionId: string) {
    return await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        auctionAntiques: {
          include: {
            antique: true,
          },
        },
      },
    });
  }

  async findBySellerId(sellerId: string, filter: paginationInput) {
    const [data, total] = await Promise.all([
      prisma.auction.findMany({
        where: { sellerId, deletedAt: null },
        orderBy: {
          createdAt: "asc",
        },
        skip: filter.skip,
        take: filter.take,
      }),
      prisma.auction.count({
        where: {
          sellerId,
          deletedAt: null,
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

  async createOneAuction(data: Prisma.AuctionCreateInput) {
    return await prisma.auction.create({
      data,
    });
  }

  async updateAuction(
    id: string,
    data: Prisma.AuctionUpdateInput,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    return await client.auction.update({
      where: { id },
      data,
    });
  }

  async deleteAuction(id: string) {
    return await prisma.auction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const auctionRepository = new AuctionRepository();
