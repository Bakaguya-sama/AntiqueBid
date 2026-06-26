import { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";
import { jwtConfig } from "@/config/jwt.config";
import { jwtService, JwtService } from "@/services/jwt.service";
import passport from "@/config/passport.config";

export class AuthController {
  async sendRegisterOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await authService.sendVerifyEmail(email, "register");

      res.status(201).json({
        success: true,
        message: "OTP was send to email successfully.",
      });
    } catch (error: any) {
      next(error);
    }
  }

  async verifyRegisterOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const token = await authService.verifyEmail(email, otp, "register", 600);

      res.status(201).json({
        success: true,
        message: "Email was verified.",
        data: {
          token,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { verifiedToken, ...data } = req.body;
      delete data.confirmPassword;
      const user = await authService.register(data, verifiedToken);

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

  async sendChangePasswordOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await authService.sendVerifyEmail(email, "reset_password");

      res.status(201).json({
        success: true,
        message: "OTP was send to email successfully.",
      });
    } catch (error: any) {
      next(error);
    }
  }

  async verifyChangePasswordOtp(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { email, otp } = req.body;
      const token = await authService.verifyEmail(
        email,
        otp,
        "reset_password",
        300,
      );

      res.status(201).json({
        success: true,
        message: "Email was verified.",
        data: {
          token,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, verifiedToken, oldPassword, newPassword } = req.body;
      await authService.changePassword(
        email,
        verifiedToken,
        oldPassword,
        newPassword,
      );

      res.status(201).json({
        success: true,
        message: "Password has been changed successfully.",
      });
    } catch (error: any) {
      next(error);
    }
  }

  googleLogin = passport.authenticate("google", {
    session: false,
    scope: ["email", "profile"],
  });

  googleCallback = [
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`,
    }),

    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user;

        const { accessToken, refreshToken } = await authService.oauthLogin(
          user as any,
        );

        res.cookie("refreshToken", refreshToken, jwtConfig.cookie);

        // res.redirect(
        //   `${process.env.CLIENT_URL}/oauth/callback?accessToken=${accessToken}`,
        // );
        res.status(200).json({ success: true, data: { accessToken } });
      } catch (error) {
        next(error);
      }
    },
  ];
}

export const authController = new AuthController();
