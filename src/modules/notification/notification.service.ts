import { notificationRepository } from "@/repositories/notification.repo";
import { userRepository } from "@/repositories/user.repo";
import { paginationInput } from "@/types/pagination.types";
import { AppError } from "@/utils/app-error.utils";
import { NotificationScope, NotificationType } from "generated/prisma/enums";
import { getIO } from "@/config/socket.config";

export class NotificationService {
  async getOneNotificationById(id: string, userId: string) {
    const existingUser = await userRepository.findById(userId);

    if (!existingUser || existingUser.deletedAt)
      throw new AppError(400, "This user does not exist");

    const existingNoti = await notificationRepository.findNotificationById(
      id,
      userId,
    );

    if (!existingNoti)
      throw new AppError(400, "This notification does not exist");

    if (existingNoti.userId && existingNoti.userId !== userId)
      throw new AppError(
        403,
        "You do not have permission to view this notification",
      );

    return existingNoti;
  }

  async getNotificationsByUser(userId: string, filter: paginationInput) {
    const existingUser = await userRepository.findById(userId);

    if (!existingUser || existingUser.deletedAt)
      throw new AppError(400, "This user does not exist");

    return await notificationRepository.findNotificationsByUser(userId, filter);
  }

  async markOneNotificationRead(id: string, userId: string) {
    const existingUser = await userRepository.findById(userId);

    if (!existingUser || existingUser.deletedAt)
      throw new AppError(400, "This user does not exist");

    const existingNoti = await notificationRepository.findNotificationById(
      id,
      userId,
    );

    if (!existingNoti)
      throw new AppError(400, "This notification does not exist");

    if (
      existingNoti.scope === NotificationScope.personal &&
      existingNoti.userId !== userId
    )
      throw new AppError(
        403,
        "You do not have permission to modify this notification",
      );

    const readNoti = await notificationRepository.markOneNotificationRead(
      id,
      userId,
    );

    const io = getIO();

    const unreadCount = await this.countUnreadNotifications(userId);

    io.to(`notification:${userId}`).emit("notification:marked_read", {
      notificationIds: [id],
      unreadCount,
    });

    return readNoti;
  }

  async markManyNotificationsRead(ids: Array<string>, userId: string) {
    const existingUser = await userRepository.findById(userId);

    if (!existingUser || existingUser.deletedAt)
      throw new AppError(400, "This user does not exist");

    const existingNotis =
      await notificationRepository.findManyNotificationByIds(ids);

    if (existingNotis.length !== ids.length) {
      const foundIds = existingNotis.map((n) => n.id);
      const notFoundIds = ids.filter((id) => !foundIds.includes(id));
      throw new AppError(
        404,
        `Notifications not found: ${notFoundIds.join(", ")}`,
      );
    }

    for (const noti of existingNotis) {
      if (noti.scope === NotificationScope.personal && noti.userId !== userId) {
        throw new AppError(
          403,
          `You do not have permission to modify notification ${noti.id}.`,
        );
      }
    }

    const readNotis = await notificationRepository.markManyNotificationsRead(
      ids,
      userId,
    );

    const io = getIO();
    const unreadCount = await this.countUnreadNotifications(userId);
    io.to(`notification:${userId}`).emit("notification:marked_read", {
      notificationIds: ids,
      unreadCount,
    });

    return readNotis;
  }

  async createPersonalNotification(
    title: string,
    userId: string,
    message: string,
    type: NotificationType,
    meta?: Record<string, unknown>,
  ) {
    const existingUser = await userRepository.findById(userId);

    if (!existingUser || existingUser.deletedAt)
      throw new AppError(
        400,
        "The recipient of this notification does not exist",
      );

    const noti = await notificationRepository.createNotification(
      title,
      message,
      NotificationScope.personal,
      type,
      userId,
      meta,
    );

    const io = getIO();
    io.to(`notification:${userId}`).emit("notification:new", {
      id: noti.id,
      title,
      message,
      type,
      scope: "personal",
      isRead: false,
      meta,
    });

    return noti;
  }

  async createSystemNotification(
    title: string,
    message: string,
    type: NotificationType,
    meta?: Record<string, unknown>,
  ) {
    const noti = await notificationRepository.createNotification(
      title,
      message,
      NotificationScope.system,
      type,
      undefined,
      meta,
    );

    const io = getIO();
    io.emit("notification:new", {
      id: noti.id,
      title,
      message,
      type,
      scope: "system",
      isRead: false,
      meta,
    });

    return noti;
  }

  async createPersonalNotificationForManyRecipients(
    title: string,
    userIds: Array<string>,
    message: string,
    type: NotificationType,
    meta?: Record<string, unknown>,
  ) {
    const existingUsers = await userRepository.findByManyIds(userIds);

    const foundIds = existingUsers.map((user) => user.id);

    if (!this.isSameArray(userIds, foundIds)) {
      const notFoundIds = userIds.filter((id) => !foundIds.includes(id));
      throw new AppError(404, `User not found: ${notFoundIds.join(", ")}`);
    }

    const notis =
      await notificationRepository.createOneNotificationForManyRecipients(
        title,
        message,
        NotificationScope.personal,
        type,
        userIds,
        meta,
      );

    const io = getIO();

    notis.forEach((ele) => {
      io.to(`notification:${ele.userId}`).emit("notification:new", {
        id: ele.id,
        title,
        message,
        type,
        scope: "personal",
        isRead: false,
        meta,
      });
    });

    return notis;
  }

  async countUnreadNotifications(userId: string) {
    const existingUser = await userRepository.findById(userId);

    if (!existingUser || existingUser.deletedAt)
      throw new AppError(400, "This user does not exist");

    return await notificationRepository.countUnreadNotificationsByUserId(
      userId,
    );
  }

  isSameArray(current: Array<string>, updated: Array<string>) {
    const currentSet = new Set(current);
    const updatedSet = new Set(updated);
    return (
      currentSet.size === updatedSet.size &&
      current.every((val) => updatedSet.has(val))
    );
  }
}

export const notificationService = new NotificationService();
