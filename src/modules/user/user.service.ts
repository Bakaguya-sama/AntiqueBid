import { userRepository } from "@/repositories/user.repo";
import { Prisma } from "generated/prisma/client";
import { userCacheService } from "@/services/redis/user-cache.service";
import { AppError } from "@/utils/app-error.utils";

export class UserService {
  async updateProfile(userId: string, data: Prisma.UserUpdateInput) {
    const updated = await userRepository.update(userId, data);

    await userCacheService.invalidate(userId);

    return updated;
  }

  async getProfile(userId: string) {
    const existingUser = await userCacheService.getOrFetch(userId, async () => {
      const user = await userRepository.findById(userId);

      if (!user || user.deletedAt) {
        return null;
      }

      return user;
    });

    if (!existingUser) throw new AppError(400, "This user does not exist");

    return existingUser;
  }
}

export const userService = new UserService();
