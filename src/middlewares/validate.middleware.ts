import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ParamsDictionary } from "express-serve-static-core";

export const validate = <
  T extends z.ZodType<{
    body?: unknown;
    params?: ParamsDictionary;
    query?: unknown;
  }>,
>(
  schema: T,
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
      return;
    }

    const data = result.data as z.infer<T>;
    req.body = data.body;
    if (data.params) {
      req.params = data.params as ParamsDictionary;
    }
    if (data.query) {
      Object.defineProperty(req, "query", {
        value: data.query,
        writable: true,
      });
    }

    next();
  };
};
