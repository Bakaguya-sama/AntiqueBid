import z from "zod";
import { paginationSchema } from "@/types/pagination.types";
const uuidSchema = z.uuidv4("Invalid ID format");

export const getAntiqueCategoryByIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const getAllAntiqueCategoriesSchema = z.object({
  query: paginationSchema.optional(),
});

export const createOneAntiqueCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Category's name is required" })
      .min(3, "Category's name must be at least 3 characters"),
    slug: z
      .string({ error: "Category's slug is required" })
      .min(3, "Category's slug must be at least 3 characters"),
    description: z
      .string()
      .min(3, "Antique's description must be at least 3 characters")
      .optional(),
  }),
});

export const updateOneAntiqueCategorySchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z
      .string()
      .min(3, "Category's name must be at least 3 characters")
      .optional(),
    slug: z
      .string()
      .min(3, "Category's slug must be at least 3 characters")
      .optional(),
    description: z
      .string()
      .min(3, "Category's description must be at least 3 characters")
      .optional(),
  }),
});

export const deleteAntiqueCategorySchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});
