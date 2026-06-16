import { Router } from "express";
import {
  getAuctionByIdSchema,
  getAuctionBySellerSchema,
  updateAuctionSchema,
  createAuctionSchema,
  cancelAuctionSchema,
} from "./auction.schema";
import { validate } from "@/middlewares/validate.middleware";
import { auctionController } from "./auction.controller";

const route = Router();

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

route.post(
  "/create",
  validate(createAuctionSchema),
  auctionController.createAuction,
);

route.patch(
  "/:id",
  validate(updateAuctionSchema),
  auctionController.updateAuction,
);

route.patch(
  "/cancel/:id",
  validate(cancelAuctionSchema),
  auctionController.cancelAuction,
);

export default route;
