import { Response, NextFunction } from "express";
import { AuthRequest } from "@/types/jwt.types";

export const authorize = (...allowedRole: Array<"user" | "admin">) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!allowedRole.includes(req.user.role)) {
      res
        .status(403)
        .json({ success: false, message: "Forbidden: insufficient role" });
      return;
    }

    next();
  };
};

export const adminOnly = authorize("admin");
export const userOnly = authorize("user");
export const anyUser = authorize("admin", "user");
