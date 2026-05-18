import { UserRole } from "@prisma/client";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  tenantId: string;
  role: UserRole;
};
