/**
 * Tenant Identification Middleware
 *
 * Identifies tenant by domain/subdomain and attaches to request context.
 * Implements caching for performance.
 */

import type { Context, Next } from 'hono';
import { TenantService } from '../services/tenant.service';
import { NotFoundError, ForbiddenError } from './error-handler';
import { MESSAGES, TENANT_ACTIVE_STATUSES } from '../config/constants';
import type { Tenant } from '../../../generated/prisma';

/**
 * Extracts domain/subdomain from request
 */
function extractDomain(c: Context): { domain: string; type: 'subdomain' | 'customDomain' } {
  const host = c.req.header('host') || '';

  // Remove port if present
  const hostname = host.split(':')[0];

  // Check for custom header override (useful for testing)
  const customDomain = c.req.header('x-tenant-domain');
  if (customDomain) {
    return {
      domain: customDomain,
      type: 'customDomain',
    };
  }

  // In development, you might use localhost with subdomain simulation
  // e.g., dealer1.localhost:3000
  if (hostname.includes('localhost')) {
    const subdomain = hostname.split('.')[0];
    if (subdomain && subdomain !== 'localhost') {
      return {
        domain: subdomain,
        type: 'subdomain',
      };
    }
  }

  // Check domain structure
  const parts = hostname.split('.');

  // Known custom domains (in production, you'd check against database)
  const knownCustomDomains = ['auto.lumiku.com'];
  if (knownCustomDomains.includes(hostname)) {
    return {
      domain: hostname,
      type: 'customDomain',
    };
  }

  // Check if it's a subdomain of autoleads.id
  if (hostname.endsWith('.autoleads.id')) {
    return {
      domain: hostname,
      type: 'subdomain',
    };
  }

  // If 2 parts (e.g., example.com), treat as custom domain
  if (parts.length === 2) {
    return {
      domain: hostname,
      type: 'customDomain',
    };
  }

  // If 3+ parts but not autoleads.id, treat as custom domain
  // This handles cases like: auto.lumiku.com, www.example.com
  if (parts.length >= 3) {
    return {
      domain: hostname,
      type: 'customDomain',
    };
  }

  // Fallback - treat as subdomain
  return {
    domain: hostname,
    type: 'subdomain',
  };
}

/**
 * Validates tenant status
 */
function validateTenantStatus(tenant: Tenant): void {
  // Check if tenant is active or in trial
  if (!TENANT_ACTIVE_STATUSES.includes(tenant.status as any)) {
    if (tenant.status === 'suspended') {
      throw new ForbiddenError(MESSAGES.TENANT_SUSPENDED);
    }
    if (tenant.status === 'expired') {
      throw new ForbiddenError(MESSAGES.TENANT_EXPIRED);
    }
    throw new ForbiddenError('Tenant account is not active');
  }

  // Check trial expiry
  if (tenant.status === 'trial' && tenant.trialEndsAt) {
    if (new Date(tenant.trialEndsAt) < new Date()) {
      throw new ForbiddenError('Trial period has expired');
    }
  }

  // Check subscription expiry
  if (tenant.planExpiresAt) {
    if (new Date(tenant.planExpiresAt) < new Date()) {
      throw new ForbiddenError(MESSAGES.TENANT_EXPIRED);
    }
  }
}

/**
 * Tenant identification middleware
 *
 * Identifies tenant from domain/subdomain and attaches to context.
 * Validates tenant status and subscription.
 */
export async function tenantMiddleware(c: Context, next: Next) {
  const tenantService = new TenantService();

  try {
    const { domain, type } = extractDomain(c);

    // Look up tenant
    const tenant = await tenantService.findByDomain(domain, type);

    if (!tenant) {
      throw new NotFoundError('Showroom');
    }

    // Validate tenant status
    validateTenantStatus(tenant);

    // Attach tenant to context
    c.set('tenant', tenant);

    // Add tenant info to response headers (useful for debugging)
    c.header('X-Tenant-Id', tenant.id.toString());
    c.header('X-Tenant-Slug', tenant.slug);

    await next();
  } catch (error) {
    throw error;
  }
}

/**
 * Optional tenant middleware
 *
 * Tries to identify tenant but doesn't fail if not found.
 * Useful for routes that work with or without tenant context.
 */
export async function optionalTenantMiddleware(c: Context, next: Next) {
  const tenantService = new TenantService();

  try {
    const { domain, type } = extractDomain(c);
    const tenant = await tenantService.findByDomain(domain, type);

    if (tenant) {
      validateTenantStatus(tenant);
      c.set('tenant', tenant);
      c.header('X-Tenant-Id', tenant.id.toString());
      c.header('X-Tenant-Slug', tenant.slug);
    }
  } catch (error) {
    // Silently fail for optional tenant
    console.warn('Optional tenant middleware failed:', error);
  }

  await next();
}

/**
 * Helper to get tenant from context
 */
export function getTenant(c: Context): Tenant {
  const tenant = c.get('tenant');
  if (!tenant) {
    throw new Error('Tenant not found in context. Did you forget to use tenantMiddleware?');
  }
  return tenant;
}

/**
 * Helper to get optional tenant from context
 */
export function getOptionalTenant(c: Context): Tenant | undefined {
  return c.get('tenant');
}
