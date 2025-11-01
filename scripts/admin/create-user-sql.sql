-- Create Admin User for AutoLeads Tenant
-- Run this SQL script in the database to create admin user

-- First, check if tenant exists
INSERT INTO tenants (
    name,
    slug,
    subdomain,
    phone,
    whatsapp_number,
    whatsapp_bot_enabled,
    primary_color,
    secondary_color,
    status,
    plan,
    created_at,
    updated_at
) VALUES (
    'AutoLeads Motors',
    'autolumiku',
    'autolumiku',
    '+628123456789',
    '+6283134446903',
    true,
    '#FF5722',
    '#000000',
    'active',
    'pro',
    NOW(),
    NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Get the tenant ID
DO $$
DECLARE
    tenant_id INTEGER;
BEGIN
    SELECT id INTO tenant_id FROM tenants WHERE slug = 'autolumiku';

    -- Insert admin user
    INSERT INTO users (
        tenant_id,
        name,
        email,
        phone,
        whatsapp_number,
        password_hash,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        tenant_id,
        'Admin AutoLeads',
        'admin@autolumiku.com',
        '+628123456789',
        '+628123456789',
        'admin123456', -- Plain text for testing (use bcrypt in production)
        'admin',
        'active',
        NOW(),
        NOW()
    ) ON CONFLICT (tenant_id, email) DO NOTHING;

    -- Insert sales users
    INSERT INTO users (
        tenant_id,
        name,
        email,
        phone,
        whatsapp_number,
        password_hash,
        role,
        status,
        created_at,
        updated_at
    ) VALUES
        (
            tenant_id,
            'Sales Person 1',
            'sales1@autolumiku.com',
            '+628123456780',
            '+628123456780',
            'sales123456',
            'sales',
            'active',
            NOW(),
            NOW()
        ),
        (
            tenant_id,
            'Sales Person 2',
            'sales2@autolumiku.com',
            '+628123456781',
            '+628123456781',
            'sales123456',
            'sales',
            'active',
            NOW(),
            NOW()
        )
    ON CONFLICT (tenant_id, email) DO NOTHING;

    RAISE NOTICE 'Admin user created successfully';
END $$;