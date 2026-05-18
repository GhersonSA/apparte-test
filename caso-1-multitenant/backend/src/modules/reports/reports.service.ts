import { prisma } from "../../lib/prisma";
import { withTenantContext } from "../../lib/tenant-context";
import { AppError } from "../../shared/app-error";
import { AuthTokenPayload } from "../auth/auth.types";
import { CreateReportInput } from "./reports.schemas";

const reportSelect = {
  id: true,
  firstName: true,
  lastName: true,
  location: true,
  interventionType: true,
  userId: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true
} as const;

export class ReportsService {
  async create(auth: AuthTokenPayload, input: CreateReportInput) {
    return withTenantContext(auth.tenantId, (tx) =>
      tx.accidentReport.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          location: input.location,
          interventionType: input.interventionType,
          userId: auth.sub,
          tenantId: auth.tenantId
        },
        select: reportSelect
      })
    );
  }

  async list(auth: AuthTokenPayload) {
    return withTenantContext(auth.tenantId, (tx) =>
      tx.accidentReport.findMany({
        where: {
          tenantId: auth.tenantId
        },
        orderBy: {
          createdAt: "desc"
        },
        select: reportSelect
      })
    );
  }

  async findById(auth: AuthTokenPayload, reportId: string) {
    const report = await withTenantContext(auth.tenantId, (tx) =>
      tx.accidentReport.findFirst({
        where: {
          id: reportId,
          tenantId: auth.tenantId
        },
        select: reportSelect
      })
    );

    if (!report) {
      throw new AppError(404, "Report not found", "REPORT_NOT_FOUND");
    }

    return report;
  }

  async getStats(auth: AuthTokenPayload) {
    const [totalReports, reportsByInterventionType] = await withTenantContext(
      auth.tenantId,
      async (tx) => {
        const total = await tx.accidentReport.count({
          where: {
            tenantId: auth.tenantId
          }
        });

        const grouped = await tx.accidentReport.groupBy({
          by: ["interventionType"],
          where: {
            tenantId: auth.tenantId
          },
          _count: {
            _all: true
          }
        });

        return [total, grouped] as const;
      }
    );

    return {
      totalReports,
      reportsByInterventionType: reportsByInterventionType.map((entry) => ({
        interventionType: entry.interventionType,
        total: entry._count._all
      }))
    };
  }

  async delete(auth: AuthTokenPayload, reportId: string) {
    const existing = await withTenantContext(auth.tenantId, (tx) =>
      tx.accidentReport.findFirst({
        where: {
          id: reportId,
          tenantId: auth.tenantId
        },
        select: {
          id: true,
          userId: true
        }
      })
    );

    if (!existing) {
      throw new AppError(404, "Report not found", "REPORT_NOT_FOUND");
    }

    if (existing.userId !== auth.sub && auth.role !== "ADMIN") {
      throw new AppError(
        403,
        "You can only delete your own reports",
        "REPORT_DELETE_FORBIDDEN"
      );
    }

    await withTenantContext(auth.tenantId, (tx) =>
      tx.accidentReport.delete({
        where: {
          id: reportId
        }
      })
    );
  }
}
