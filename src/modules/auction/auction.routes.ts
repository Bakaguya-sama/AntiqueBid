import { Router } from "express";
import {
  getAuctionByIdSchema,
  getAuctionBySellerSchema,
  updateAuctionSchema,
  createAuctionSchema,
  cancelAuctionSchema,
  placeBidSchema,
  getBidsOfAuctionSchema,
  getTopTrendingAuctionsSchema,
  finishAuctionSchema,
} from "./auction.schema";
import { validate } from "@/middlewares/validate.middleware";
import { auctionController } from "./auction.controller";

const route = Router();

route.get(
  "/trending",
  validate(getTopTrendingAuctionsSchema),
  auctionController.getTopTrendingAuctions,
);

route.post(
  "/create",
  validate(createAuctionSchema),
  auctionController.createAuction,
);

route.get(
  "/:id",
  validate(getAuctionByIdSchema),
  auctionController.getAuctionById,
);

route.get(
  "/seller/:id",
  validate(getAuctionBySellerSchema),
  auctionController.getAuctionBySellerId,
);

route.patch(
  "/:id",
  validate(updateAuctionSchema),
  auctionController.updateAuction,
);

route.patch(
  "/:id/cancel",
  validate(cancelAuctionSchema),
  auctionController.cancelAuction,
);

route.patch(
  "/:id/finish",
  validate(finishAuctionSchema),
  auctionController.finishAuction,
);

route.get(
  "/:id/bids",
  validate(getBidsOfAuctionSchema),
  auctionController.getBidsOfAuction,
);

route.post("/:id/bids", validate(placeBidSchema), auctionController.placeBid);

export default route;
