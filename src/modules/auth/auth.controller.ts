import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { jwtConfig } from "@/config/jwt.config";
import { jwtService, JwtService } from "@/services/jwt.service";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);

      res.status(201).json({
        message: "Register successfully!.",
        data: user,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      const { accessToken, refreshToken } = await authService.login({
        username,
        password,
        clientIp,
      });

      res.cookie("refreshToken", refreshToken, jwtConfig.cookie);
      res
        .status(200)
        .json({ success: true, data: { accessToken, refreshToken } });
    } catch (error: any) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const { sub: userId, jti, exp } = req.body.user!;

      if (refreshToken) {
        const rtPayload = jwtService.verifyRefreshToken(refreshToken);
        await authService.logOut(userId, rtPayload.tokenFamily, jti, exp!);
      }

      res.clearCookie("refreshToken");
      res.status(200).json({ success: true, message: "Logged out" });
    } catch (error: any) {
      next(error);
    }
  }

  async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { sub: userId, jti, exp } = req.body.user!;

      await authService.logOutAll(userId, jti, exp);

      res.clearCookie("refreshToken");
      res.status(200).json({ success: true, message: "Logged out" });
    } catch (error: any) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const oldRefreshToken = req.cookies?.refreshToken;

      const { accessToken, refreshToken } =
        await authService.refreshToken(oldRefreshToken);

      res.cookie("refreshToken", refreshToken, jwtConfig.cookie);
      res.status(201).json({
        success: true,
        message: "Refreshed!",
        data: { accessToken, refreshToken },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
