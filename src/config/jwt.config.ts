import { SignOptions } from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT secrets in environment variables");
}

export const jwtConfig = {
  access: {
    secret: process.env.JWT_SECRET,
    options: {
      expiresIn: "15m",
      issuer: "antique-bid-app",
      audience: "antique-bid-client",
    } satisfies SignOptions,
  },
  refresh: {
    secret: process.env.JWT_SECRET,
    options: {
      expiresIn: "7d",
      issuer: "antique-bid-app",
      audience: "antique-bid-client",
    } satisfies SignOptions,
  },
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};
