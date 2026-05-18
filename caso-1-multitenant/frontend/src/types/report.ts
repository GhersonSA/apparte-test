export type InterventionType =
  | "ACCIDENT_TIME"
  | "FIRE_ASSISTANCE"
  | "MEDICAL_ASSISTANCE"
  | "VEHICLE_REMOVAL";

export type Report = {
  id: string;
  firstName: string;
  lastName: string;
  location: string;
  interventionType: InterventionType;
  userId: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateReportRequest = {
  firstName: string;
  lastName: string;
  location: string;
  interventionType: InterventionType;
};

export type CreateReportResponse = {
  report: Report;
};

export type ListReportsResponse = {
  reports: Report[];
};
