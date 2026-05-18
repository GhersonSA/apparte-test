import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";

export async function setTenantContext(
  tx: Prisma.TransactionClient,
  tenantId: string
) {
  await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
}

export async function withTenantContext<T>(
  tenantId: string,
  operation: (tx: Prisma.TransactionClient) => Promise<T>
) {
  return prisma.$transaction(async (tx) => {
    await setTenantContext(tx, tenantId);
    return operation(tx);
  });
}

