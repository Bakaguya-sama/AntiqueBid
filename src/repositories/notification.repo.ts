import { Prisma } from "generated/prisma/client";
import { prisma } from "@/config/db.connection";
import { PrismaTransactionClient } from "@/types/transaction.types";
import { paginationInput } from "@/types/pagination.types";
import { NotificationType, NotificationScope } from "generated/prisma/client";

export class NotificationRepository {
  async findNotificationsByUser(
    userId: string,
    filter: paginationInput,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;

    const [data, total] = await Promise.all([
      client.notification.findMany({
        where: {
          OR: [{ userId }, { scope: NotificationScope.system }],
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          readReceipts: {
            where: { userId },
          },
        },
        skip: filter.skip,
        take: filter.take,
      }),
      client.notification.count({
        where: {
          OR: [{ userId }, { scope: NotificationScope.system }],
        },
      }),
    ]);

    return {
      data: data.map((noti) => ({
        ...noti,
        isRead: noti.readReceipts.length > 0,
        readReceipts: undefined,
      })),
      metadata: {
        total,
        skip: filter.skip,
        take: filter.take,
      },
    };
  }

  async findNotificationById(
    id: string,
    userId: string,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    const data = await client.notification.findUnique({
      where: {
        id,
      },
      include: {
        readReceipts: {
          where: { userId },
        },
      },
    });

    if (!data) return null;

    return {
      ...data,
      isRead: data.readReceipts ? data.readReceipts.length > 0 : false,
      readReceipts: undefined,
    };
  }

  async findManyNotificationByIds(
    ids: Array<string>,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    return await client.notification.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  async createNotification(
    message: string,
    scope: NotificationScope,
    type: NotificationType,
    userId?: string,
    meta?: Record<string, unknown>,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    return await client.notification.create({
      data: {
        userId: userId ? userId : undefined,
        message,
        type,
        scope,
        meta: meta ?? undefined,
      },
    });
  }

  async createOneNotificationForManyRecipients(
    message: string,
    scope: NotificationScope,
    type: NotificationType,
    userIds: Array<string>,
    meta?: Record<string, unknown>,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    return await client.notification.createManyAndReturn({
      data: userIds.map((userId) => ({
        userId,
        message,
        type,
        scope,
        meta: meta ?? undefined,
      })),
    });
  }

  async markOneNotificationRead(
    notificationId: string,
    userId: string,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    return await prisma.notificationReadReceipt.upsert({
      where: { notificationId_userId: { notificationId, userId } },
      update: {},
      create: {
        notificationId,
        userId,
      },
    });
  }

  async markManyNotificationsRead(
    notificationIds: Array<string>,
    userId: string,
    tx?: PrismaTransactionClient,
  ) {
    const client = tx ?? prisma;
    return await client.notificationReadReceipt.createMany({
      data: notificationIds.map((notificationId) => ({
        notificationId,
        userId,
      })),
      skipDuplicates: true,
    });
  }

  async countUnreadNotificationsByUserId(userId: string) {
    const all = await prisma.notification.count({
      where: {
        OR: [{ userId }, { scope: NotificationScope.system }],
      },
    });

    const read = await prisma.notificationReadReceipt.count({
      where: {
        userId,
      },
    });

    return all - read;
  }
}

export const notificationRepository = new NotificationRepository();
