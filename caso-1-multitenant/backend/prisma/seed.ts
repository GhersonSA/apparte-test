/// <reference types="node" />

import { InterventionType, PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedUserConfig = {
  email: string;
  role: UserRole;
};

type SeedTenantConfig = {
  name: string;
  slug: string;
  users: SeedUserConfig[];
  report: {
    firstName: string;
    lastName: string;
    location: string;
    interventionType: InterventionType;
  };
};

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function upsertTenantReport(params: {
  tenantId: string;
  userId: string;
  report: SeedTenantConfig["report"];
}) {
  const { tenantId, userId, report } = params;

  const existingReport = await prisma.accidentReport.findFirst({
    where: {
      tenantId,
      firstName: report.firstName,
      lastName: report.lastName,
      location: report.location,
      interventionType: report.interventionType
    }
  });

  if (existingReport) {
    await prisma.accidentReport.update({
      where: { id: existingReport.id },
      data: {
        userId
      }
    });
    return;
  }

  await prisma.accidentReport.create({
    data: {
      firstName: report.firstName,
      lastName: report.lastName,
      location: report.location,
      interventionType: report.interventionType,
      userId,
      tenantId
    }
  });
}

async function main() {
  const seedPassword = requiredEnv("SEED_DEFAULT_PASSWORD");
  const defaultPasswordHash = await bcrypt.hash(seedPassword, 10);

  const seedConfig: SeedTenantConfig[] = [
    {
      name: process.env.SEED_TENANT_ALPHA_NAME ?? "Tenant Alpha",
      slug: process.env.SEED_TENANT_ALPHA_SLUG ?? "tenant-alpha",
      users: [
        {
          email: process.env.SEED_TENANT_ALPHA_ADMIN_EMAIL ?? "admin@tenant-alpha.com",
          role: UserRole.ADMIN
        },
        {
          email: process.env.SEED_TENANT_ALPHA_USER_EMAIL ?? "user@tenant-alpha.com",
          role: UserRole.USER
        }
      ],
      report: {
        firstName: process.env.SEED_TENANT_ALPHA_REPORT_FIRST_NAME ?? "John",
        lastName: process.env.SEED_TENANT_ALPHA_REPORT_LAST_NAME ?? "Doe",
        location: process.env.SEED_TENANT_ALPHA_REPORT_LOCATION ?? "Madrid",
        interventionType: InterventionType.ACCIDENT_TIME
      }
    },
    {
      name: process.env.SEED_TENANT_BETA_NAME ?? "Tenant Beta",
      slug: process.env.SEED_TENANT_BETA_SLUG ?? "tenant-beta",
      users: [
        {
          email: process.env.SEED_TENANT_BETA_ADMIN_EMAIL ?? "admin@tenant-beta.com",
          role: UserRole.ADMIN
        },
        {
          email: process.env.SEED_TENANT_BETA_USER_EMAIL ?? "user@tenant-beta.com",
          role: UserRole.USER
        }
      ],
      report: {
        firstName: process.env.SEED_TENANT_BETA_REPORT_FIRST_NAME ?? "Jane",
        lastName: process.env.SEED_TENANT_BETA_REPORT_LAST_NAME ?? "Smith",
        location: process.env.SEED_TENANT_BETA_REPORT_LOCATION ?? "Barcelona",
        interventionType: InterventionType.MEDICAL_ASSISTANCE
      }
    }
  ];

  for (const tenantConfig of seedConfig) {
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantConfig.slug },
      update: {
        name: tenantConfig.name
      },
      create: {
        name: tenantConfig.name,
        slug: tenantConfig.slug
      }
    });

    let adminUserId = "";

    for (const userConfig of tenantConfig.users) {
      const user = await prisma.user.upsert({
        where: {
          tenantId_email: {
            tenantId: tenant.id,
            email: userConfig.email
          }
        },
        update: {
          passwordHash: defaultPasswordHash,
          role: userConfig.role
        },
        create: {
          email: userConfig.email,
          passwordHash: defaultPasswordHash,
          role: userConfig.role,
          tenantId: tenant.id
        }
      });

      if (userConfig.role === UserRole.ADMIN && !adminUserId) {
        adminUserId = user.id;
      }
    }

    if (!adminUserId) {
      throw new Error(`No admin user found for tenant ${tenant.slug}`);
    }

    await upsertTenantReport({
      tenantId: tenant.id,
      userId: adminUserId,
      report: tenantConfig.report
    });
  }

  console.log("Seed completed successfully.");
  console.log("Seed users password read from SEED_DEFAULT_PASSWORD.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
