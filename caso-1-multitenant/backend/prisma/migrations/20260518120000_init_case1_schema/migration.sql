-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "InterventionType" AS ENUM (
  'ACCIDENT_TIME',
  'FIRE_ASSISTANCE',
  'MEDICAL_ASSISTANCE',
  'VEHICLE_REMOVAL'
);

-- CreateTable
CREATE TABLE "tenants" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "tenant_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accident_reports" (
  "id" TEXT NOT NULL,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "intervention_type" "InterventionType" NOT NULL,
  "user_id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "accident_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "accident_reports_tenant_id_idx" ON "accident_reports"("tenant_id");

-- CreateIndex
CREATE INDEX "accident_reports_user_id_idx" ON "accident_reports"("user_id");

-- AddForeignKey
ALTER TABLE "users"
ADD CONSTRAINT "users_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accident_reports"
ADD CONSTRAINT "accident_reports_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accident_reports"
ADD CONSTRAINT "accident_reports_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- RLS Setup
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" FORCE ROW LEVEL SECURITY;
ALTER TABLE "accident_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accident_reports" FORCE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "users_tenant_select" ON "users"
FOR SELECT
USING ("tenant_id" = current_setting('app.current_tenant', true));

CREATE POLICY "users_tenant_insert" ON "users"
FOR INSERT
WITH CHECK ("tenant_id" = current_setting('app.current_tenant', true));

CREATE POLICY "users_tenant_update" ON "users"
FOR UPDATE
USING ("tenant_id" = current_setting('app.current_tenant', true))
WITH CHECK ("tenant_id" = current_setting('app.current_tenant', true));

CREATE POLICY "users_tenant_delete" ON "users"
FOR DELETE
USING ("tenant_id" = current_setting('app.current_tenant', true));

-- Policies for accident_reports table
CREATE POLICY "accident_reports_tenant_select" ON "accident_reports"
FOR SELECT
USING ("tenant_id" = current_setting('app.current_tenant', true));

CREATE POLICY "accident_reports_tenant_insert" ON "accident_reports"
FOR INSERT
WITH CHECK ("tenant_id" = current_setting('app.current_tenant', true));

CREATE POLICY "accident_reports_tenant_update" ON "accident_reports"
FOR UPDATE
USING ("tenant_id" = current_setting('app.current_tenant', true))
WITH CHECK ("tenant_id" = current_setting('app.current_tenant', true));

CREATE POLICY "accident_reports_tenant_delete" ON "accident_reports"
FOR DELETE
USING ("tenant_id" = current_setting('app.current_tenant', true));
