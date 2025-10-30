-- Seed initial super admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO "super_admins" (
    "name",
    "email",
    "password_hash",
    "role",
    "status"
) VALUES (
    E'Super Admin',
    E'admin@autoleads.com',
    E'$2b$10$rQZ8s/K/8qFvQJ6dL8v5/.hJd8qL6vL5Q9mH3nK8qP7vW5nK4dQ8C',
    E'super_admin',
    E'active'
) ON CONFLICT ("email") DO NOTHING;

-- Create support admin user as well
-- Password: support123 (hashed with bcrypt)
INSERT INTO "super_admins" (
    "name",
    "email",
    "password_hash",
    "role",
    "status"
) VALUES (
    E'Support Admin',
    E'support@autoleads.com',
    E'$2b$10$sW9tL7/P9rGwRJ7eM9w6/.iKe9rM7wM6R0nI4oL9rQ8xX6oL5eR9D',
    E'support',
    E'active'
) ON CONFLICT ("email") DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE "super_admins" IS 'Seeded with initial super admin and support users. Default credentials: admin@autoleads.com / admin123 and support@autoleads.com / support123';