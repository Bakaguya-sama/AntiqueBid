import { prisma } from "@/config/db.connection";
import { Prisma } from "../../generated/prisma/client";
import { paginationInput } from "@/types/pagination.types";
export class UserRepository {
  async findByEmailAuth(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async findByUsernameAuth(username: string) {
    return await prisma.user.findUnique({ where: { userName: username } });
  }

  async findByIdAuth(id: string) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      omit: {
        password: true,
      },
    });
  }

  async findByUsername(username: string) {
    return await prisma.user.findUnique({
      where: { userName: username },
      omit: {
        password: true,
      },
    });
  }

  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      omit: {
        password: true,
      },
    });
  }

  async findByManyIds(ids: Array<string>) {
    return await prisma.user.findMany({
      where: {
        id: {
          in: ids,
        },
        deletedAt: null,
      },
      omit: {
        password: true,
      },
    });
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

  async updateByEmail(email: string, data: Prisma.UserUpdateInput) {
    const user = await prisma.user.update({
      where: { email },
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
      omit: {
        password: true,
      },
    });
    return res;
  }
}

export const userRepository = new UserRepository();
