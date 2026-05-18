import { UserRole } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

import { AppError } from "../shared/app-error";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new AppError(401, "Authentication required", "AUTH_REQUIRED"));
      return;
    }

    if (!allowedRoles.includes(req.auth.role)) {
      next(new AppError(403, "Insufficient permissions", "AUTH_FORBIDDEN"));
      return;
    }

    next();
  };
}
