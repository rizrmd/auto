-- Rollback script for super admin system

-- Drop the super_admins table
DROP TABLE IF EXISTS "super_admins" CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_super_admins_updated_at() CASCADE;

-- Drop the enum types
DROP TYPE IF EXISTS "SuperAdminRole" CASCADE;
DROP TYPE IF EXISTS "AdminStatus" CASCADE;