-- Rollback script for user role simplification

-- Create old UserRole enum with all original values
DO $$ BEGIN
    CREATE TYPE "UserRole_old" AS ENUM ('owner', 'admin', 'sales');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop default value
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- Convert back to old enum - default existing users to 'admin' role
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_old"
USING 'admin'::text::"UserRole_old";

-- Set default back to 'admin'
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin';

-- Drop current UserRole
DROP TYPE IF EXISTS "UserRole";

-- Rename old enum back
ALTER TYPE "UserRole_old" RENAME TO "UserRole";