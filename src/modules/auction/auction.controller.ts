import { trendingService } from "@/services/redis/trending.service";
import { auctionService } from "./auction.service";
import { Request, Response, NextFunction } from "express";

export class AuctionController {
  async getAuctionById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const auction = await auctionService.getAuctionById(id);

      res.status(200).json({
        success: true,
        data: auction,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async createAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user?.sub;
      const { antiques, ...data } = req.body;
      const auction = await auctionService.createAuction(
        sellerId as string,
        data,
        antiques,
      );

      res.status(201).json({
        success: true,
        message: "Auction created successfully",
        data: auction,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user?.sub;
      const { antiques, ...data } = req.body;
      const auctionId = req.params.id;

      const auction = await auctionService.updateAuction(
        sellerId as string,
        auctionId as string,
        data,
        antiques,
      );

      res.status(200).json({
        success: true,
        message: "Auction updated successfully",
        data: auction,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async cancelAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.user?.sub;
      const auctionId = req.params.id;
      const auction = await auctionService.cancelAuction(
        auctionId as string,
        sellerId as string,
      );

      res.status(200).json({
        success: true,
        message: "Auction cancelled successfully",
        data: auction,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAuctionBySellerId(req: Request, res: Response, next: NextFunction) {
    try {
      const sellerId = req.params.id as string;
      const auctions = await auctionService.getAuctionBySeller(sellerId, {
        skip: req.query.skip as unknown as number,
        take: req.query.take as unknown as number,
      });

      res.status(200).json({
        success: true,
        data: auctions,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async finishAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const auctionId = req.params.id as string;
      const finishedAuction = await auctionService.finishAuction(auctionId);
      res.status(200).json({
        success: true,
        message: "Auction finished successfully",
        data: finishedAuction,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async placeBid(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub;
      const auctionId = req.params.id;
      const price = req.body.price;
      const bid = await auctionService.placeBid(
        userId as string,
        auctionId as string,
        price as number,
      );

      res.status(200).json({
        success: true,
        message: "Bid placed successfully",
        data: bid,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getBidsOfAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const auctionId = req.params.id;

      const bidList = await auctionService.getBidsOfAuction(
        auctionId as string,
        {
          take: req.query.take as unknown as number,
          skip: req.query.skip as unknown as number,
        },
      );

      res.status(200).json({
        success: true,
        data: bidList,
      });
    } catch (error: any) {
      next(error);
    }
  }

  //   async deleteAuction(req: Request, res: Response, next: NextFunction) {
  //     try {
  //     } catch (error: any) {
  //       next(error);
  //     }
  //   }

  async getTopTrendingAuctions(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const top = req.query.top;
      const auctions = await auctionService.getTopTrendingAuctionsInDetail(
        top ? (top as unknown as number) : undefined,
      );

      res.status(200).json({
        success: true,
        data: auctions,
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const auctionController = new AuctionController();
