import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { jwtConfig } from "@/config/jwt.config";
import { AccessTokenPayload, RefreshTokenPayload } from "@/types/jwt.types";
import { prisma } from "@/config/db.connection";
import { redisService } from "./redis.service";
import bcript from "bcrypt";

export class JwtService {
  generateAccessToken(payload: Omit<AccessTokenPayload, "jti">): string {
    return jwt.sign(
      { ...payload, jti: uuidv4() },
      jwtConfig.access.secret,
      jwtConfig.access.options,
    );
  }

  generateRefreshToken(userId: string, tokenFamily: string): string {
    const payload: RefreshTokenPayload = {
      sub: userId,
      tokenFamily,
    };
    return jwt.sign(
      payload,
      jwtConfig.refresh.secret,
      jwtConfig.refresh.options,
    );
  }

  generateTokenPair(user: {
    id: string;
    email: string;
    role: "user" | "admin";
  }) {
    const tokenFamily = uuidv4();

    const accessToken = this.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = this.generateRefreshToken(user.id, tokenFamily);

    return { accessToken, refreshToken, tokenFamily };
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, jwtConfig.access.secret, {
      issuer: jwtConfig.access.options.issuer,
      audience: jwtConfig.access.options.audience,
    }) as AccessTokenPayload;
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, jwtConfig.refresh.secret, {
      issuer: jwtConfig.refresh.options.issuer,
      audience: jwtConfig.refresh.options.audience,
    }) as RefreshTokenPayload;
  }

  async saveRefreshToken(
    userId: string,
    refreshToken: string,
    tokenFamily: string,
  ) {
    await redisService.saveRefreshToken(userId, refreshToken, tokenFamily);
  }

  async rotateRefreshToken(
    oldRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    let payload: RefreshTokenPayload;

    try {
      payload = this.verifyRefreshToken(oldRefreshToken);
    } catch (err) {
      return null;
    }

    const { sub: userId, tokenFamily } = payload;

    const isValid = await redisService.validateRefreshToken(
      userId,
      oldRefreshToken,
      tokenFamily,
    );

    if (!isValid) {
      await redisService.revokeAllRefreshTokens(userId);
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) return null;

    const newAccessToken = this.generateAccessToken({
      sub: userId,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = this.generateRefreshToken(userId, tokenFamily);

    await this.saveRefreshToken(userId, tokenFamily, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async revokeRefreshToken(userId: string, tokenFamily: string): Promise<void> {
    await redisService.revokeRefreshToken(userId, tokenFamily);
  }

  async revokeAllTokensByUser(userId: string): Promise<void> {
    await redisService.revokeAllRefreshTokens(userId);
  }
}

export const jwtService = new JwtService();
