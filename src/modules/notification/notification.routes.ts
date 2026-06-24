import { Router } from "express";
import { notificationController } from "./notification.controller";
import { validate } from "@/middlewares/validate.middleware";
import {
  findNotificationByIdSchema,
  findNotificationsByUserIdSchema,
  markManyNotificationsReadSchema,
  markOneNotificationReadSchema,
  sendNotificationToManyUsersSchema,
  sendPersonalNotificationSchema,
  sendSystemNotificationSchema,
} from "./notification.schema";

const route = Router();

route.get(
  "/",
  validate(findNotificationsByUserIdSchema),
  notificationController.getNotificationsByUserId,
);

route.get("/unread", notificationController.countUnreadNotifications);

route.get(
  "/:id",
  validate(findNotificationByIdSchema),
  notificationController.getNotificationById,
);

route.patch(
  "/read",
  validate(markManyNotificationsReadSchema),
  notificationController.markManyNotificationRead,
);

route.patch(
  "/:id",
  validate(markOneNotificationReadSchema),
  notificationController.markOneNotificationRead,
);

route.post(
  "/personal-send",
  validate(sendPersonalNotificationSchema),
  notificationController.sendPersonalNotification,
);
route.post(
  "/system-send",
  validate(sendSystemNotificationSchema),
  notificationController.sendSystemNotification,
);
route.post(
  "/multiple-send",
  validate(sendNotificationToManyUsersSchema),
  notificationController.sendNotificationToManyUsers,
);

export default route;
