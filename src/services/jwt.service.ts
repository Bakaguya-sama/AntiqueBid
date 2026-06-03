import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { jwtConfig } from "@/config/jwt.config";
import { AccessTokenPayload, RefreshTokenPayload } from "@/types/jwt.types";
import { prisma } from "@/config/db.connection";
import bcript from "bcrypt";

export class JwtService {
  generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, jwtConfig.access.secret, jwtConfig.access.options);
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
    expiresAt: Date,
  ) {
    const encryptedToken = await bcript.hash(refreshToken, 10);

    // Upsert theo userId + tokenFamily
    // await prisma.refreshToken.upsert({
    //   where: { userId_tokenFamily: { userId, tokenFamily } },
    //   create: { userId, tokenFamily, token: hashedToken, expiresAt },
    //   update: { token: hashedToken, expiresAt },
    // });
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

    // look up token in redis

    // const stored = await prisma.refreshToken.findUnique({
    //   where: { userId_tokenFamily: { userId, tokenFamily } },
    //   include: { user: true },
    // });

    // if (!stored || stored.expiresAt < new Date()) {
    //   await this.revokeAllTokensByUser(userId);
    //   return null;
    // }

    // const isValid = await bcrypt.compare(oldRefreshToken, stored.token);
    // if (!isValid) {
    //   await this.revokeAllTokensByUser(userId);
    //   return null;
    // }

    const newAccessToken = this.generateAccessToken({
      sub: userId,
      email: stored.user.email,
      role: stored.user.role,
    });
    const newRefreshToken = this.generateRefreshToken(userId, tokenFamily);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.saveRefreshToken(
      userId,
      tokenFamily,
      newRefreshToken,
      expiresAt,
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async revokeTokenFamily(userId: string, tokenFamily: string): Promise<void> {}

  async revokeAllTokensByUser(userId: string): Promise<void> {}
}

export const jwtService = new JwtService();
