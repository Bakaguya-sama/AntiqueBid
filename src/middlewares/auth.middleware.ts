import { Response, NextFunction, Request } from "express";
import { jwtService } from "@/services/jwt.service";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { redisService } from "@/services/redis/redis.service";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwtService.verifyAccessToken(token);

    const isBlacklisted = await redisService.isAccessTokenBlacklisted(
      payload.jti,
    );

    if (isBlacklisted) {
      res
        .status(401)
        .json({ success: false, message: "Token has been revoked" });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      res.status(401).json({ success: false, message: "Token expired" });
      return;
    }
    if (error instanceof JsonWebTokenError) {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }
    next(error);
  }
};
