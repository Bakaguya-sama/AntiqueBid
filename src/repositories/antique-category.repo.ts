import { Prisma, AntiqueStatus } from "generated/prisma/client";
import { prisma } from "@/config/db.connection";
import { paginationInput } from "@/types/pagination.types";
import { PrismaTransactionClient } from "@/types/transaction.types";

class AntiqueCategoryRepository {
  async findAntiqueCategoryById(id: string, tx?: PrismaTransactionClient) {
    const client = tx ?? prisma;
    return await client.antiqueCategory.findUnique({
      where: {
        id,
      },
    });
  }

  async getAllAntiqueCategories(
    filter: paginationInput,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    const [data, total] = await Promise.all([
      client.antiqueCategory.findMany({
        skip: filter.skip,
        take: filter.take,
        orderBy: {
          slug: "asc",
        },
      }),
      client.antiqueCategory.count({}),
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

  async createOneAntiqueCategory(data: Prisma.AntiqueCategoryCreateInput) {
    return await prisma.antiqueCategory.create({
      data,
    });
  }

  async updateOneAntiqueCategory(
    id: string,
    data: Prisma.AntiqueCategoryUpdateInput,
  ) {
    return await prisma.antiqueCategory.update({
      where: {
        id,
      },
      data,
    });
  }

  async deleteOneAntiqueCategory(id: string) {
    return await prisma.antiqueCategory.delete({
      where: {
        id,
      },
    });
  }

  async countAntiqueHasOneSpecificCategory(id: string) {
    return await prisma.antique.count({
      where: {
        categoryId: id,
        deletedAt: null,
      },
    });
  }
}

export const antiqueCategoryRepository = new AntiqueCategoryRepository();
