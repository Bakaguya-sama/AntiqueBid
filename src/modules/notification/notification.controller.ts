import { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service";
import { NotificationType } from "generated/prisma/enums";

export class NotificationController {
  async getNotificationById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user?.sub as string;

      const data = await notificationService.getOneNotificationById(id, userId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getNotificationsByUserId(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.sub as string;

      const data = await notificationService.getNotificationsByUser(userId, {
        take: req.query.take as unknown as number,
        skip: req.query.skip as unknown as number,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async markOneNotificationRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.sub as string;
      const id = req.params.id as string;

      const data = await notificationService.markOneNotificationRead(
        id,
        userId,
      );

      res.status(200).json({
        success: true,
        message: "This notification is marked read successfully",
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async markManyNotificationRead(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.sub as string;
      const ids = req.body.ids as string[];

      const data = await notificationService.markManyNotificationsRead(
        ids,
        userId,
      );

      res.status(200).json({
        success: true,
        message: "These notifications are marked read successfully",
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async countUnreadNotifications(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.sub as string;
      console.log("userId: ", userId);

      const data = await notificationService.countUnreadNotifications(userId);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async sendPersonalNotification(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { title, userId, message, type } = req.body;
      console.log(userId, message, type);
      const data = await notificationService.createPersonalNotification(
        title,
        userId,
        message,
        type as NotificationType,
      );

      res.status(201).json({
        success: true,
        message: "Notification is sent successfully",
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async sendSystemNotification(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { title, message, type } = req.body;
      const data = await notificationService.createSystemNotification(
        title,
        message,
        type as NotificationType,
      );

      res.status(201).json({
        success: true,
        message: "Notification is sent successfully",
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async sendNotificationToManyUsers(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { title, userIds, message, type } = req.body;
      const data =
        await notificationService.createPersonalNotificationForManyRecipients(
          title,
          userIds as string[],
          message,
          type as NotificationType,
        );

      res.status(201).json({
        success: true,
        message: "Notification is sent successfully",
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
