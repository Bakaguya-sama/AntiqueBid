import { AuthRequest } from "@/types/jwt.types";
import { AppError } from "@/utils/app-error.utils";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Prisma } from "../../generated/prisma/client";
import { Response, NextFunction, Request } from "express";

const isDev = process.env.NODE_ENV === "development";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const { statusCode, message, shouldLog } = normalizeError(err);

  if (shouldLog) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(isDev && err instanceof Error && { stack: err.stack }),
  });
};

function normalizeError(err: unknown): {
  statusCode: number;
  message: string;
  shouldLog: boolean;
} {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      message: err.message,
      shouldLog: err.statusCode >= 500,
    };
  }

  if (err instanceof TokenExpiredError) {
    return { statusCode: 401, message: "Token expired", shouldLog: false };
  }
  if (err instanceof JsonWebTokenError) {
    return { statusCode: 401, message: "Invalid token", shouldLog: false };
  }

  if (err instanceof SyntaxError && "body" in err) {
    return { statusCode: 400, message: "Invalid JSON body", shouldLog: false };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return normalizePrismaError(err);
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: 400,
      message: "Invalid data format",
      shouldLog: false,
    };
  }

  return {
    statusCode: 500,
    message:
      isDev && err instanceof Error ? err.message : "Internal Server Error",
    shouldLog: true,
  };
}

function normalizePrismaError(err: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
  shouldLog: boolean;
} {
  switch (err.code) {
    case "P2002": // Unique constraint (trùng email, username...)
      const field = (err.meta?.target as string[])?.join(", ") ?? "field";
      return {
        statusCode: 409,
        message: `${field} already exists`,
        shouldLog: false,
      };

    case "P2025": // Record not found
      return { statusCode: 404, message: "Record not found", shouldLog: false };

    case "P2003": // Foreign key constraint
      return {
        statusCode: 400,
        message: "Related record not found",
        shouldLog: false,
      };

    default:
      return { statusCode: 500, message: "Database error", shouldLog: true };
  }
}
