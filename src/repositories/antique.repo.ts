import { Prisma, AntiqueStatus } from "generated/prisma/client";
import { prisma } from "@/config/db.connection";
import { paginationInput } from "@/types/pagination.types";
import { PrismaTransactionClient } from "@/types/transaction.types";

export class AntiqueRepository {
  async findById(antiqueId: string) {
    return await prisma.antique.findUnique({ where: { id: antiqueId } });
  }

  async findByIdList(antiqueIds: Array<string>, tx?: PrismaTransactionClient) {
    const client = tx ?? prisma;
    return await client.antique.findMany({
      where: {
        id: { in: antiqueIds },
      },
      include: {
        auctionAntiques: {
          include: {
            auction: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });
  }

  /*
  SELECT a.id, b.auctionId
  FROM ANTIQUE a JOIN  AuctionAntique b
  ON a.id = b.antiqueId
  WHERE a.id IN [antiqueIds] AND a.deleted = null AND a.status = "available"
  */

  async findByManyIds(antiqueIds: Array<string>) {
    return await prisma.antique.findMany({
      where: {
        id: {
          in: antiqueIds,
        },
      },
    });
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

  async findByAuctionId(
    auctionId: string,
    filter: paginationInput,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    const [data, total] = await Promise.all([
      client.antique.findMany({
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

  async findAllByAuctionId(auctionId: string, tx?: PrismaTransactionClient) {
    const client = tx ?? prisma;
    const records = await client.antique.findMany({
      where: {
        deletedAt: null,
        auctionAntiques: {
          some: {
            auctionId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    return records.map((record) => record.id);
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

  async updateManyAntiques(
    ids: Array<string>,
    data: Prisma.AntiqueUpdateInput,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    return await client.antique.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data,
    });
  }
}

export const antiqueRepository = new AntiqueRepository();
