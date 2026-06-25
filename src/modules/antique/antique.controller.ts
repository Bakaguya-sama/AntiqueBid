import { Request, Response, NextFunction } from "express";
import { antiqueService } from "./antique.service";

export class AntiqueController {
  async getAntiqueById(req: Request, res: Response, next: NextFunction) {
    try {
      const antique = await antiqueService.getAntique(req.params.id as string);

      res.status(200).json({
        success: true,
        data: antique,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAntiqueByCreator(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await antiqueService.getAntiquesByCreator(
        req.params.id as string,
        {
          skip: req.query.skip as unknown as number,
          take: req.query.take as unknown as number,
        },
      );

      res.status(200).json({
        success: true,
        data: list,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async createAntique(req: Request, res: Response, next: NextFunction) {
    try {
      const creatorId = req.user?.sub;
      const { categoryId, ...data } = req.body;
      const antique = await antiqueService.createAntique(
        creatorId as string,
        categoryId as string,
        data,
      );

      res.status(201).json({
        success: true,
        message: "Antique created successfully",
        data: antique,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAntique(req: Request, res: Response, next: NextFunction) {
    try {
      const creatorId = req.user?.sub;
      const antiqueId = req.params.id;
      const { categoryId, ...data } = req.body;
      const antique = await antiqueService.updateAntique(
        antiqueId as string,
        creatorId as string,
        data,
        categoryId,
      );

      res.status(200).json({
        success: true,
        message: "Antique updated successfully",
        data: antique,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAntique(req: Request, res: Response, next: NextFunction) {
    try {
      const creatorId = req.user?.sub;
      const antiqueId = req.params.id;
      await antiqueService.deleteAntique(
        antiqueId as string,
        creatorId as string,
      );

      res.status(200).json({
        success: true,
        message: "Antique deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const antiqueController = new AntiqueController();
