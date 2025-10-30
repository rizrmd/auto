# Super Admin System Migration

**Migration Date**: 2025-10-30
**Purpose**: Add Super Admin model and required enums for multi-tenant management system

## Changes

### New Models
- **SuperAdmin**: Global system administrators with cross-tenant access
  - Fields: id, name, email, passwordHash, role, status, lastLoginAt, createdAt, updatedAt
  - Indexes: email (unique), role + status (composite)

### New Enums
- **SuperAdminRole**: `super_admin`, `support`
- **AdminStatus**: `active`, `inactive`, `suspended`

### Security Features
- Unique email constraint
- Password hashing with bcrypt
- Role-based access control
- Audit trail with timestamps

### Performance Features
- Optimized indexes for common queries
- Composite index for role + status filtering
- Trigger-based updated_at management

## Rollback

Run `rollback.sql` to revert all changes:
- Drops super_admins table
- Removes trigger functions
- Deletes enum types

## Notes

This migration is part of the Super Admin implementation for AutoLeads multi-tenant system. It enables global administration across all tenants while maintaining tenant isolation for regular users.