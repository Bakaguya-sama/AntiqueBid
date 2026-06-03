import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const user = await AuthService.register(req.body);

      res.status(201).json({
        message: "Register successfully!.",
        data: user,
      });
    } catch (error: any) {
      res.status(500).json({
        message: error.message || "Internal server error.",
      });
    }
  }
}
