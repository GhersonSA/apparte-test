import { apiRequest } from "./http";
import {
  CreateReportRequest,
  CreateReportResponse,
  ListReportsResponse
} from "../types/report";

export function createReportRequest(token: string, input: CreateReportRequest) {
  return apiRequest<CreateReportResponse>("/api/reports", {
    method: "POST",
    token,
    body: input
  });
}

export function listReportsRequest(token: string) {
  return apiRequest<ListReportsResponse>("/api/reports", {
    method: "GET",
    token
  });
}
