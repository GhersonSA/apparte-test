import { Prisma } from "@prisma/client";

export async function setTenantContext(
  tx: Prisma.TransactionClient,
  tenantId: string
) {
  await tx.$executeRaw`SELECT set_config('app.current_tenant', ${tenantId}, true)`;
}
