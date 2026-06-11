import z from "zod";
import { paginationSchema } from "@/types/pagination.types";
const antiqueStatus = ["available", "unavailable"] as const;

export const getAntiqueSchema = z.object({
  params: z.object({
    id: z.string({ error: "Empty antiqueId" }),
  }),
});

export const getAntiqueByCreatorSchema = z.object({
  params: z.object({
    id: z.string({ error: "Empty creatorId" }),
  }),
  query: paginationSchema.optional(),
});

export const listAntiqueSchema = z.object({
  query: paginationSchema
    .extend({
      status: z.enum(["available", "unavailable"]).optional(),
    })
    .optional(),
});

export const deleteAntiqueSchema = z.object({
  params: z.object({
    id: z.string({ error: "Empty antiqueId" }),
  }),
});

export const createAntiqueSchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Antique's name is required" })
      .min(3, "Antique's name must be at least 3 characters")
      .max(50),
    description: z
      .string({ error: "Description is required" })
      .min(3, "Antique's name must be at least 3 characters")
      .max(1000),
  }),
});

export const updateAntiqueSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z
      .string()
      .min(3, "Antique's name must be at least 3 characters")
      .max(50)
      .optional(),
    description: z
      .string()
      .min(3, "Antique's name must be at least 3 characters")
      .max(1000)
      .optional(),
    status: z.enum(antiqueStatus, { error: "Invalid status" }).optional(),
  }),
});
