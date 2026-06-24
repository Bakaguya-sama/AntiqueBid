import { PrismaTransactionClient } from "@/types/transaction.types";
import { antiqueCategoryRepository } from "@/repositories/antique-category.repo";
import { AppError } from "@/utils/app-error.utils";
import { paginationInput } from "@/types/pagination.types";
import { Prisma } from "generated/prisma/client";

export class AntiqueCategoryService {
  async getAntiqueCategoryById(id: string) {
    const existing =
      await antiqueCategoryRepository.findAntiqueCategoryById(id);

    if (!existing) throw new AppError(401, "Antique category does not exist");
    return existing;
  }

  async getAllAntiqueCategories(filter: paginationInput) {
    return await antiqueCategoryRepository.getAllAntiqueCategories(filter);
  }

  async createOneAntiqueCategory(data: Prisma.AntiqueCategoryCreateInput) {
    return await antiqueCategoryRepository.createOneAntiqueCategory(data);
  }

  async updateAntiqueCategory(
    id: string,
    data: Prisma.AntiqueCategoryUpdateInput,
  ) {
    const existing =
      await antiqueCategoryRepository.findAntiqueCategoryById(id);

    if (!existing) throw new AppError(401, "Antique category does not exist");

    return await antiqueCategoryRepository.updateOneAntiqueCategory(id, data);
  }

  async deleteAntiqueCategory(id: string) {
    const existing =
      await antiqueCategoryRepository.findAntiqueCategoryById(id);

    if (!existing) throw new AppError(401, "Antique category does not exist");

    const count =
      await antiqueCategoryRepository.countAntiqueHasOneSpecificCategory(id);

    if (count > 0)
      throw new AppError(
        400,
        "Cannot delete this category because it is being used by existing antiques.",
      );

    await antiqueCategoryRepository.deleteOneAntiqueCategory(id);
  }
}

export const antiqueCategoryService = new AntiqueCategoryService();
