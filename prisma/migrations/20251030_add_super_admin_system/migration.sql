-- Create SuperAdminRole enum
DO $$ BEGIN
    CREATE TYPE "SuperAdminRole" AS ENUM ('super_admin', 'support');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create AdminStatus enum
DO $$ BEGIN
    CREATE TYPE "AdminStatus" AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create super_admins table
CREATE TABLE IF NOT EXISTS "super_admins" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "SuperAdminRole" NOT NULL DEFAULT E'super_admin',
    "status" "AdminStatus" NOT NULL DEFAULT E'active',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on email
ALTER TABLE "super_admins" ADD CONSTRAINT "super_admins_email_key" UNIQUE ("email");

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "super_admins_email_idx" ON "super_admins"("email");
CREATE INDEX IF NOT EXISTS "super_admins_role_status_idx" ON "super_admins"("role", "status");

-- Add comments for documentation
COMMENT ON TABLE "super_admins" IS 'Global system administrators with multi-tenant access';
COMMENT ON COLUMN "super_admins"."role" IS 'Role within super admin system: super_admin (full access) or support (limited access)';
COMMENT ON COLUMN "super_admins"."status" IS 'Account status: active (can login), inactive (disabled), suspended (temporarily blocked)';
COMMENT ON COLUMN "super_admins"."last_login_at" IS 'Timestamp of last successful login';

-- Create trigger for updated_at (similar to other tables)
CREATE OR REPLACE FUNCTION update_super_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_super_admins_updated_at_trigger
    BEFORE UPDATE ON "super_admins"
    FOR EACH ROW
    EXECUTE FUNCTION update_super_admins_updated_at();