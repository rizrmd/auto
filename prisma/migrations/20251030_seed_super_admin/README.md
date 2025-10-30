# Super Admin Seed Data Migration

**Migration Date**: 2025-10-30
**Purpose**: Seed initial super admin users for system bootstrap

## Seeded Users

### Super Admin User
- **Email**: admin@autoleads.com
- **Password**: admin123
- **Role**: super_admin
- **Status**: active

### Support Admin User
- **Email**: support@autoleads.com
- **Password**: support123
- **Role**: support
- **Status**: active

## Security Notes

### Password Hashing
- Uses bcrypt with cost factor 10
- Hashes are pre-computed for initial deployment
- Passwords should be changed immediately after first login

### Default Credentials
⚠️ **IMPORTANT**: Change these passwords immediately after deployment!
- The default passwords are provided for initial setup only
- Use strong, unique passwords for production environments
- Consider implementing password expiration policies

## Access Levels

### Super Admin (admin@autoleads.com)
- Full system access across all tenants
- Can create, edit, suspend tenants
- Access to global analytics and monitoring
- System configuration management

### Support Admin (support@autoleads.com)
- Limited system access for support tasks
- Can view tenant information (read-only)
- Access to system monitoring and logs
- Cannot modify tenant data or system settings

## Rollback

Run `rollback.sql` to remove seeded users:
- Deletes both admin and support users
- Preserves any manually created super admin users
- Safe to run without affecting other data

## Next Steps

1. **First Login**: Login with admin@autoleads.com / admin123
2. **Change Password**: Immediately update the default password
3. **Create Additional Admins**: Add other super admin users as needed
4. **Configure Access**: Set up appropriate permissions for support staff