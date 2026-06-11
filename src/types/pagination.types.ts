import z from "zod";

export const paginationSchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),

  take: z.coerce.number().int().min(1).max(50).default(10),
});

export type paginationInput = z.infer<typeof paginationSchema>;
