import { userService } from "./user.service";
import { Request, Response, NextFunction } from "express";

export class UserController {
  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub as string;

      const updated = await userService.updateProfile(userId, req.body);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.sub as string;

      const profile = await userService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id as string;

      const user = await userService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const userIds = req.query.ids as string[];

      const users = await userService.getManyUsers(userIds);

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
