import { Prisma } from "generated/prisma/client";
import { prisma } from "@/config/db.connection";
import { paginationInput } from "@/types/pagination.types";
import { PrismaTransactionClient } from "@/types/transaction.types";

export class AntiqueRepository {
  async findById(antiqueId: string) {
    return await prisma.antique.findUnique({ where: { id: antiqueId } });
  }

  async findInActiveAuction(antiqueId: string) {
    return await prisma.auctionAntique.findFirst({
      where: {
        antiqueId,
        auction: {
          status: "active",
        },
      },
    });
  }

  async findByAuctionId(auctionId: string, filter: paginationInput) {
    const [data, total] = await Promise.all([
      prisma.antique.findMany({
        where: {
          deletedAt: null,
          auctionAntiques: {
            some: {
              auctionId,
            },
          },
        },
        skip: filter.skip,
        take: filter.take,
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.antique.count({
        where: {
          deletedAt: null,
          auctionAntiques: {
            some: {
              auctionId,
            },
          },
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        skip: filter.skip,
        take: filter.take,
      },
    };
  }

  async findByCreatorID(creatorId: string, filter: paginationInput) {
    const [data, total] = await Promise.all([
      prisma.antique.findMany({
        where: { createdBy: creatorId, deletedAt: null },
        skip: filter.skip,
        take: filter.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.antique.count({
        where: { createdBy: creatorId, deletedAt: null },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        skip: filter.skip,
        take: filter.take,
      },
    };
  }

  async createOneAntique(
    data: Prisma.AntiqueCreateInput,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;

    return await client.antique.create({
      data,
    });
  }

  async updateAntique(
    id: string,
    data: Prisma.AntiqueUpdateInput,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    return await client.antique.update({
      where: { id },
      data,
    });
  }

  async deleteAntique(id: string) {
    return await prisma.antique.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export const antiqueRepository = new AntiqueRepository();
