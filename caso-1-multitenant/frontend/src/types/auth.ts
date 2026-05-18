export type UserRole = "USER" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
  createdAt?: string;
};

export type AuthTenant = {
  id: string;
  name: string;
  slug: string;
};

export type LoginResponse = {
  token: string;
  tenant: AuthTenant;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
};

export type LoginRequest = {
  tenantSlug: string;
  email: string;
  password: string;
};
