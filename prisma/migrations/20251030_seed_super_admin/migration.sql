-- Seed initial super admin user
-- Password: admin123 (hashed with bcrypt using Bun.password.hash)
INSERT INTO "super_admins" (
    "name",
    "email",
    "password_hash",
    "role",
    "status",
    "updated_at"
) VALUES (
    E'Super Admin',
    E'admin@autoleads.com',
    E'$2b$10$2X9E1/80ar4QQ9y2Vm9P6OwSQSCEXpG8fdzE5Jbi.DnEjo6518UjW',
    E'super_admin',
    E'active',
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;

-- Create support admin user as well
-- Password: support123 (hashed with bcrypt using Bun.password.hash)
INSERT INTO "super_admins" (
    "name",
    "email",
    "password_hash",
    "role",
    "status",
    "updated_at"
) VALUES (
    E'Support Admin',
    E'support@autoleads.com',
    E'$2b$10$XSYz0il0EvEVmRcg9uvEyOImpSOdIgYkZVKuEXx0ct/PL0dP3b4hC',
    E'support',
    E'active',
    CURRENT_TIMESTAMP
) ON CONFLICT ("email") DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE "super_admins" IS 'Seeded with initial super admin and support users. Default credentials: admin@autoleads.com / admin123 and support@autoleads.com / support123';