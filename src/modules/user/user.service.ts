import { userRepository } from "@/repositories/user.repo";
import { Prisma } from "generated/prisma/client";

export class UserService {
  async updateProfile(userId: string, data: Prisma.UserUpdateInput) {
    return await userRepository.update(userId, data);
  }

  async getProfile(userId: string) {
    return await userRepository.findById(userId);
  }
}

export const userService = new UserService();
