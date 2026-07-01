import z from "zod";
const uuidSchema = z.uuidv4("Invalid ID format");

export const updateProfileSchema = z.object({
  body: z
    .object({
      fullName: z
        .string()
        .min(3, "Fullname must be at least 3 characters")
        .max(200)
        .optional(),
      userName: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(100)
        .optional(),
    })
    .strict(),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});
