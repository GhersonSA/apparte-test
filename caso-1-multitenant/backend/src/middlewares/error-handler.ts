import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "../shared/app-error";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      code: error.code,
      message: error.message
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Invalid request payload",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
    return;
  }

  console.error(error);

  res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected error"
  });
}
