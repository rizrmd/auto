-- Add 'deleted' status to CarStatus enum
ALTER TYPE "CarStatus" ADD VALUE IF NOT EXISTS 'deleted';

-- Add deletedAt column to cars table
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Create index for better query performance on deleted cars
CREATE INDEX IF NOT EXISTS "cars_tenant_id_status_idx" ON "cars"("tenant_id", "status");

-- Comment for documentation
COMMENT ON COLUMN "cars"."deleted_at" IS 'Timestamp when car was soft-deleted via /delete command';
