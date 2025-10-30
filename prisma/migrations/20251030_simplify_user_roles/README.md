# User Role Simplification Migration

**Migration Date**: 2025-10-30
**Purpose**: Simplify User role system to only include tenant_admin role

## Changes

### Before
- **UserRole**: `owner`, `admin`, `sales` (3 different roles)
- Complex role hierarchy across different tenant access levels

### After
- **UserRole**: `tenant_admin` (single role)
- Simplified permissions: all tenant users are administrators of their own tenant

### Migration Strategy
- Creates new enum type with only `tenant_admin`
- Converts all existing users to `tenant_admin` role
- Maintains data integrity during the transition
- Preserves existing user accounts and permissions

## Impact

### Benefits
- **Simplified Security Model**: Clear separation between Super Admin and Tenant Admin
- **Easier Development**: Single role to manage for tenant users
- **Consistent Permissions**: All tenant users have same access level within their tenant

### Breaking Changes
- Frontend code that checks for `owner`, `admin`, or `sales` roles must be updated
- Any role-based UI differentiation needs to be removed or reimplemented
- API endpoints that filter by user role may need adjustment

## Rollback

Run `rollback.sql` to restore original role system:
- Recreates `owner`, `admin`, `sales` enum values
- Converts all users to `admin` role by default
- Maintains backward compatibility

## Notes

This migration is part of the Super Admin system implementation. It simplifies the role hierarchy to create a clear 2-tier system: Super Admin (global) and Tenant Admin (tenant-specific).