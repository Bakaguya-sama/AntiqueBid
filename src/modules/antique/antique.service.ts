import { antiqueRepository } from "@/repositories/antique.repo";
import { userRepository } from "@/repositories/user.repo";
import { paginationInput } from "@/types/pagination.types";
import { AppError } from "@/utils/app-error.utils";
import { Prisma } from "generated/prisma/client";
import { antiqueCategoryRepository } from "@/repositories/antique-category.repo";

export class AntiqueService {
  async createAntique(
    creatorId: string,
    categoryId: string,
    data: Prisma.AntiqueCreateInput,
  ) {
    const existingCategory =
      await antiqueCategoryRepository.findAntiqueCategoryById(categoryId);
    if (!existingCategory) throw new AppError(400, "Category does not exist");

    const newAntique = await antiqueRepository.createOneAntique({
      ...data,
      antiqueCreator: {
        connect: { id: creatorId },
      },
      antiqueCategory: {
        connect: { id: categoryId },
      },
    });

    return newAntique;
  }

  async updateAntique(
    antiqueId: string,
    creatorId: string,
    data: Prisma.AntiqueUpdateInput,
    categoryId?: string,
  ) {
    const existingAntique = await antiqueRepository.findById(antiqueId);
    if (!existingAntique) throw new AppError(400, "Antique does not exist");
    if (existingAntique.deletedAt) {
      throw new AppError(400, "This antique has already been deleted");
    }
    if (existingAntique.createdBy !== creatorId) {
      throw new AppError(
        403,
        "You do not have permission to update this antique",
      );
    }

    if (categoryId) {
      const existingCategory =
        await antiqueCategoryRepository.findAntiqueCategoryById(categoryId);
      if (!existingCategory)
        throw new AppError(400, "Category to update to does not exist");
    }

    // delete (data as any).antiqueCreator;
    // delete (data as any).antiqueCategory;
    // delete (data as any).createdBy;

    const updatedAntique = await antiqueRepository.updateAntique(antiqueId, {
      ...data,
      ...(categoryId && {
        antiqueCategory: { connect: { id: categoryId } },
      }),
    });

    return updatedAntique;
  }

  async deleteAntique(antiqueId: string, creatorId: string) {
    if (!creatorId) throw new AppError(401, "Empty creatorId");

    const existingCreator = await userRepository.findById(creatorId);
    if (!existingCreator) throw new AppError(401, "Creator does not exist");

    const existingAntique = await antiqueRepository.findById(antiqueId);
    if (!existingAntique) throw new AppError(404, "Antique not found");

    if (existingAntique.createdBy !== creatorId) {
      throw new AppError(
        403,
        "You do not have permission to delete this antique",
      );
    }

    if (existingAntique.deletedAt) {
      throw new AppError(400, "This antique has already been deleted");
    }

    if (existingAntique.status === "sold") {
      throw new AppError(400, "This antique was sold!");
    }

    const isInActiveAuction =
      await antiqueRepository.findInActiveAuction(antiqueId);

    if (isInActiveAuction) {
      throw new Error("Cannot delete sold antique was in active auction");
    }

    return await antiqueRepository.deleteAntique(antiqueId);
  }

  async getAntique(antiqueId: string) {
    const existingAntique = await antiqueRepository.findById(antiqueId);

    if (!existingAntique)
      throw new AppError(400, "This antique does not exist");

    if (existingAntique.deletedAt) {
      throw new AppError(400, "This antique has already been deleted");
    }

    return existingAntique;
  }

  async getAntiquesByCreator(creatorId: string, filter: paginationInput) {
    const existingCreator = await userRepository.findById(creatorId);

    if (!existingCreator) throw new AppError(400, "Creator does not exist");

    if (existingCreator.deletedAt)
      throw new AppError(400, "Creator account is deleted");

    const res = await antiqueRepository.findByCreatorID(creatorId, filter);
    return res;
  }
}

export const antiqueService = new AntiqueService();
