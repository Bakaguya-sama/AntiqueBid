import z from "zod";
import { paginationSchema } from "@/types/pagination.types";

const uuidSchema = z.uuidv4("Invalid ID format");

const auctionTimeRefinement = (data: { startsAt: Date; endsAt: Date }) =>
  data.endsAt > data.startsAt;

export const createAuctionSchema = z.object({
  body: z
    .object({
      title: z
        .string({ error: "Auction's title is required" })
        .min(3, "Auction's title must be at least 3 characters")
        .max(50),
      description: z
        .string()
        .min(3, "Auction's description must be at least 3 characters")
        .max(1000)
        .optional(),
      startingPrice: z
        .number({ error: "Starting price is required" })
        .min(0, "Starting price must be non-negative")
        .multipleOf(0.01, "Max 2 decimal places"),

      stepPrice: z
        .number({ error: "Step price is required" })
        .min(1, "Step price must be greater than 0")
        .multipleOf(0.01, "Max 2 decimal places"),

      startsAt: z.coerce
        .date({ error: "Start time is required" })
        .refine((val) => val > new Date(), "Start time must be in the future"),

      endsAt: z.coerce.date({ error: "End time is required" }),

      maxExtendCount: z.number().int().min(0).max(20).default(10),
      extendWindowSec: z.number().int().min(60).default(300),
      extendDurationSec: z.number().int().min(60).default(300),

      antiques: z
        .array(uuidSchema)
        .min(1, "Auction must have at least 1 antique"),
    })
    .refine(auctionTimeRefinement, {
      message: "End time must be after start time",
      path: ["endsAt"],
    }),
});

export const updateAuctionSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z
    .object({
      title: z
        .string({ error: "Auction's title is required" })
        .min(3, "Auction's title must be at least 3 characters")
        .max(50)
        .optional(),
      description: z
        .string()
        .min(3, "Auction's description must be at least 3 characters")
        .max(1000)
        .optional(),
      startingPrice: z.number().min(0).multipleOf(0.01).optional(),
      stepPrice: z
        .number()
        .min(1, "Step price must be greater than 0")
        .multipleOf(0.01)
        .optional(),

      startsAt: z.coerce
        .date()
        .refine((val) => val > new Date(), "Start time must be in the future")
        .optional(),

      endsAt: z.coerce.date().optional(),

      maxExtendCount: z.number().int().min(0).max(20).optional(),
      extendWindowSec: z.number().int().min(60).optional(),
      extendDurationSec: z.number().int().min(60).optional(),

      antiques: z
        .array(uuidSchema)
        .min(1, "Auction must have at least 1 antique"),
    })
    .refine(
      (data) => {
        if (data.startsAt && data.endsAt) {
          return auctionTimeRefinement({
            startsAt: data.startsAt,
            endsAt: data.endsAt,
          });
        }
        return true;
      },
      { message: "End time must be after start time", path: ["endsAt"] },
    )
    .strict(),
});

export const cancelAuctionSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const getAuctionByIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const deleteAuctionSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const finishAuctionSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const getAuctionBySellerSchema = z.object({
  params: z.object({
    id: z.string({ error: "Empty sellerId" }),
  }),
  query: paginationSchema.optional(),
});

export const placeBidSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    price: z
      .number({ error: "Can not submit empty bid" })
      .min(0, "Your bid must be greater than 0")
      .multipleOf(0.01),
  }),
});

export const updateBidSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    price: z
      .number({ error: "Can not submit empty bid" })
      .min(0, "Your bid must be greater than 0")
      .multipleOf(0.01),
  }),
});

export const getBidsOfAuctionSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  query: paginationSchema.optional(),
});

export const getTopTrendingAuctionsSchema = z.object({
  query: z.object({
    top: z
      .number()
      .min(10, "The value of top trending has to be at least 10.")
      .optional(),
  }),
});

export type CreateAuctionInput = z.infer<typeof createAuctionSchema>["body"];
export type UpdateAuctionInput = z.infer<typeof updateAuctionSchema>["body"];
