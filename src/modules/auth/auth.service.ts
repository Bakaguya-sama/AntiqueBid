import bcrypt from "bcrypt";
import { userRepository } from "../../repositories/user.repo";
import { AppError } from "@/utils/app-error.utils";
import { jwtService } from "@/services/jwt.service";
import { Prisma, User } from "../../../generated/prisma/client";
import { loginInput } from "@/types/auth.types";
import { redisService } from "@/services/redis.service";

const MAX_LOGIN_ATTEMPTS = 5;

export class AuthService {
  async register(data: Prisma.UserCreateInput) {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) throw new Error("This email is used!");

    const username = await userRepository.findByUsername(data.userName);
    if (username) throw new Error("This username is used!");

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password!, saltRounds);

    const newUser = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    return newUser;
  }

  async login(data: loginInput) {
    const attempts = await redisService.getLoginAttempts(data.clientIp);
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      throw new AppError(
        429,
        "Too many login attempts. Try again in 15 minutes.",
      );
    }

    if (!data.username) throw new AppError(400, "Empty username");

    const user = await userRepository.findByUsername(data.username);

    if (!user) {
      await redisService.incrementLoginAttempts(data.clientIp);
      throw new AppError(401, "Invalid username");
    }

    if (!(await bcrypt.compare(data.password, user.password!))) {
      await redisService.incrementLoginAttempts(data.clientIp);
      throw new AppError(401, "Invalid password");
    }

    if (!user.isActive) throw new AppError(403, "Account is disabled");

    await redisService.resetLoginAttempts(data.clientIp);

    const { accessToken, refreshToken, tokenFamily } =
      await jwtService.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
      });

    await redisService.saveRefreshToken(user.id, refreshToken, tokenFamily);

    await userRepository.update(user.id, { lastLoginAt: new Date() });

    return {
      accessToken,
      refreshToken,
    };
  }

  async oauthLogin(user?: User) {
    if (!user) {
      throw new AppError(401, "OAuth login failed");
    }

    const { accessToken, refreshToken, tokenFamily } =
      await jwtService.generateTokenPair({
        id: user.id,
        email: user.email,
        role: user.role,
      });

    await redisService.saveRefreshToken(user.id, refreshToken, tokenFamily);

    await userRepository.update(user.id, { lastLoginAt: new Date() });

    return {
      accessToken,
      refreshToken,
    };
  }

  async logOut(
    userId: string,
    tokenFamily: string,
    accessJti: string,
    accessExp: number,
  ) {
    const remainingTTL = accessExp - Math.floor(Date.now() / 1000);

    await Promise.all([
      jwtService.revokeRefreshToken(userId, tokenFamily),
      redisService.blacklistAccessToken(accessJti, accessExp),
    ]);
  }

  async logOutAll(userId: string, accessJti: string, accessExp: number) {
    const remainingTTL = accessExp - Math.floor(Date.now() / 1000);

    await Promise.all([
      jwtService.revokeAllTokensByUser(userId),
      redisService.blacklistAccessToken(accessJti, accessExp),
    ]);
  }

  async refreshToken(oldRefreshToken: string) {
    const res = await jwtService.rotateRefreshToken(oldRefreshToken);

    if (!res) {
      throw new AppError(401, "Invalid or expired refresh token");
    }

    return res;
  }
}

export const authService = new AuthService();
