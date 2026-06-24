import z from "zod";
import { paginationSchema } from "@/types/pagination.types";

const uuidSchema = z.uuidv4("Invalid ID format");
const notificationTypeSchema = z.enum([
  "outbid",
  "win",
  "lose",
  "auction_update",
  "system_announcement",
]);

export const findNotificationByIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const findNotificationsByUserIdSchema = z.object({
  query: paginationSchema.optional(),
});

export const markOneNotificationReadSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const markManyNotificationsReadSchema = z.object({
  body: z.object({
    ids: z
      .array(uuidSchema)
      .min(1, "There must have been at least 1 notification"),
  }),
});

export const sendPersonalNotificationSchema = z.object({
  body: z.object({
    userId: uuidSchema,
    message: z.string().min(1, "Message is required"),
    type: notificationTypeSchema,
  }),
});

export const sendSystemNotificationSchema = z.object({
  body: z.object({
    message: z.string().min(1, "Message is required"),
    type: notificationTypeSchema,
  }),
});

export const sendNotificationToManyUsersSchema = z.object({
  body: z.object({
    userIds: z
      .array(uuidSchema)
      .min(1, "There must have been at least 1 recipient"),
    message: z.string().min(1, "Message is required"),
    type: notificationTypeSchema,
  }),
});
