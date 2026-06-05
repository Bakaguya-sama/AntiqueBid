import { Request } from "express";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: "user" | "admin";
  jti: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenFamily: string;
}

export interface AuthRequest extends Request {
  user?: AccessTokenPayload;
}
