import z, { email } from "zod";

export const loginSchema = z.object({
  body: z.object({
    username: z.string({ error: "username is required" }),
    password: z
      .string({ error: "password is required" })
      .min(6, "Password must be at least 6 characters"),
  }),
});

export const registerSchema = z.object({
  body: z
    .object({
      email: z.email({ error: "Invalid email format" }).toLowerCase(),
      username: z
        .string({ error: "username is required" })
        .min(3, "username must be at least 3 characters")
        .max(50)
        .regex(
          /^[a-zA-Z0-9_]+$/,
          "Username can only contain letters, numbers, underscore",
        ),
      fullname: z
        .string({ error: "fullname is required" })
        .min(2, "fullname must be at least 3 characters")
        .max(100),
      password: z
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string({ error: "Please confirm password" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      error: "Passwords do not match",
      path: ["confirm"],
    }),
});

export type LoginInput = z.infer<typeof loginSchema>["body"];
export type RegisterInput = z.infer<typeof registerSchema>["body"];
