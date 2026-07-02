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

export const getManyUserByIdsSchema = z.object({
  query: z.object({
    ids: z.preprocess(
      (value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string") {
          return value.split(",").map((id) => id.trim());
        }

        return value;
      },
      z.array(uuidSchema).min(1, "The query must have at least 1 userId"),
    ),
  }),
});
