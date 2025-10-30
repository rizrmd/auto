-- Note: PostgreSQL doesn't support removing enum values directly
-- We need to create a new enum type and migrate the data

-- Create new UserRole enum with only tenant_admin
DO $$ BEGIN
    CREATE TYPE "UserRole_new" AS ENUM ('tenant_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing users to set their role to tenant_admin
-- This ensures all existing users are converted to tenant_admin role
UPDATE "users"
SET "role" = 'tenant_admin'::text::"UserRole_new"
WHERE "role" IN ('owner', 'admin', 'sales');

-- Drop the default value constraint temporarily
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- Convert the column to the new enum type
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new"
USING 'tenant_admin'::text::"UserRole_new";

-- Set the default value
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'tenant_admin';

-- Drop the old enum type (this might fail if there are dependencies)
DROP TYPE IF EXISTS "UserRole";

-- Rename the new enum type to the original name
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Add comment for documentation
COMMENT ON COLUMN "users"."role" IS 'User role simplified to tenant_admin only - all tenant users are administrators';
COMMENT ON TABLE "users" IS 'Tenant administrators with access to their own showroom data only';