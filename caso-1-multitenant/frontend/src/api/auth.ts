import { apiRequest } from "./http";
import { LoginRequest, LoginResponse, MeResponse } from "../types/auth";

export function loginRequest(input: LoginRequest) {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: input
  });
}

export function meRequest(token: string) {
  return apiRequest<MeResponse>("/api/auth/me", {
    method: "GET",
    token
  });
}
