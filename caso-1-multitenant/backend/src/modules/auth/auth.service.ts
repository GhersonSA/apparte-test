import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { withTenantContext } from "../../lib/tenant-context";
import { AppError } from "../../shared/app-error";
import { createAuthToken } from "./auth.jwt";
import { LoginInput, RegisterInput } from "./auth.schemas";
import { AuthTokenPayload } from "./auth.types";

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  tenantId: true,
  createdAt: true
} as const;

export class AuthService {
  async login(input: LoginInput) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: input.tenantSlug },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    if (!tenant) {
      throw new AppError(401, "Invalid credentials", "AUTH_INVALID_CREDENTIALS");
    }

    const user = await withTenantContext(tenant.id, (tx) =>
      tx.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: tenant.id,
            email: input.email
          }
        }
      })
    );

    if (!user) {
      throw new AppError(401, "Invalid credentials", "AUTH_INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(401, "Invalid credentials", "AUTH_INVALID_CREDENTIALS");
    }

    const token = createAuthToken({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role
    });

    return {
      token,
      tenant,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    };
  }

  async me(auth: AuthTokenPayload) {
    const user = await withTenantContext(auth.tenantId, (tx) =>
      tx.user.findUnique({
        where: { id: auth.sub },
        select: publicUserSelect
      })
    );

    if (!user) {
      throw new AppError(401, "User not found", "AUTH_USER_NOT_FOUND");
    }

    return user;
  }

  async register(auth: AuthTokenPayload, input: RegisterInput) {
    if (auth.role !== UserRole.ADMIN) {
      throw new AppError(403, "Insufficient permissions", "AUTH_FORBIDDEN");
    }

    const existing = await withTenantContext(auth.tenantId, (tx) =>
      tx.user.findUnique({
        where: {
          tenantId_email: {
            tenantId: auth.tenantId,
            email: input.email
          }
        },
        select: { id: true }
      })
    );

    if (existing) {
      throw new AppError(409, "User already exists", "AUTH_USER_EXISTS");
    }

    const passwordHash = await bcrypt.hash(input.password, env.PASSWORD_SALT_ROUNDS);

    const createdUser = await withTenantContext(auth.tenantId, (tx) =>
      tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: input.role ?? UserRole.USER,
          tenantId: auth.tenantId
        },
        select: publicUserSelect
      })
    );

    return createdUser;
  }
}
