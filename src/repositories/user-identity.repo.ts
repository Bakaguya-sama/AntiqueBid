import { prisma } from "@/config/db.connection";
import { Prisma } from "../../generated/prisma/client";

export class UserIdentityRepository {
  async countProviderByUserId(userId: string) {
    return await prisma.userIdentity.count({
      where: {
        userId,
      },
    });
  }
}

export const userIdentityRepository = new UserIdentityRepository();
