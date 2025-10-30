-- Rollback script for super admin seed data

-- Remove seeded super admin users
DELETE FROM "super_admins"
WHERE "email" IN ('admin@autoleads.com', 'support@autoleads.com');