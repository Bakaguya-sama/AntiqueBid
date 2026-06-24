import { antiqueCategoryService } from "./antique-category.service";
import { Request, Response, NextFunction } from "express";

export class AntiqueCategoryController {
  async findCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await antiqueCategoryService.getAntiqueCategoryById(id);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await antiqueCategoryService.getAllAntiqueCategories({
        skip: req.query.skip as unknown as number,
        take: req.query.take as unknown as number,
      });

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async createOneCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await antiqueCategoryService.createOneAntiqueCategory(
        req.body,
      );

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateOneCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await antiqueCategoryService.updateAntiqueCategory(
        id,
        req.body,
      );

      res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteOneCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await antiqueCategoryService.deleteAntiqueCategory(id);

      res.status(200).json({
        success: true,
        message: "Category deleted successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }
}

export const antiqueCategoryController = new AntiqueCategoryController();
