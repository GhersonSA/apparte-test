import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { AppError } from "../../shared/app-error";
import { AuthTokenPayload } from "./auth.types";

type JwtPayload = {
  sub?: string;
  email?: string;
  tenantId?: string;
  role?: AuthTokenPayload["role"];
};

export function createAuthToken(payload: AuthTokenPayload) {
  return jwt.sign(
    {
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role
    },
    env.JWT_SECRET,
    {
      subject: payload.sub,
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
    }
  );
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  let decoded: string | jwt.JwtPayload;

  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError(401, "Invalid or expired token", "AUTH_INVALID_TOKEN");
  }

  if (typeof decoded === "string") {
    throw new AppError(401, "Invalid token payload", "AUTH_INVALID_TOKEN");
  }

  const payload = decoded as JwtPayload;

  if (!payload.sub || !payload.email || !payload.tenantId || !payload.role) {
    throw new AppError(401, "Invalid token payload", "AUTH_INVALID_TOKEN");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    tenantId: payload.tenantId,
    role: payload.role
  };
}
