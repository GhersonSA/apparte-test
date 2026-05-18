import { NextFunction, Request, Response } from "express";

import { verifyAuthToken } from "../modules/auth/auth.jwt";
import { AppError } from "../shared/app-error";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    next(new AppError(401, "Missing Bearer token", "AUTH_MISSING_TOKEN"));
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    next(new AppError(401, "Missing Bearer token", "AUTH_MISSING_TOKEN"));
    return;
  }

  req.auth = verifyAuthToken(token);
  next();
}
