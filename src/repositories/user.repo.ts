import { prisma } from "@/config/db.connection";
import { Prisma } from "../../generated/prisma/client";
import { paginationInput } from "@/types/pagination.types";
export class UserRepository {
  async findByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return await prisma.user.findUnique({ where: { userName: username } });
  }

  async findById(id: string) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async create(userData: Prisma.UserCreateInput) {
    const user = await prisma.user.create({
      data: userData,
    });

    return user;
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return user;
  }

  async getAllUsers(filter: paginationInput) {
    const res = await prisma.user.findMany({
      skip: filter.skip,
      take: filter.take,
      orderBy: {
        userName: "asc",
      },
    });
    return res;
  }
}

export const userRepository = new UserRepository();
