/**
 * Type Definitions for Request Context
 *
 * Defines TypeScript types for Hono context and custom variables.
 */

import type { Context } from 'hono';
import type { Tenant, User } from '../../../generated/prisma';

/**
 * Custom variables available in Hono context
 */
export interface ContextVariables {
  tenant: Tenant;
  user?: User;
  requestId: string;
}

/**
 * Extended Hono Context with custom variables
 */
export type AppContext = Context<{ Variables: ContextVariables }>;

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

/**
 * API Error Structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * Response Metadata
 */
export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  requestId?: string;
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Car Filter Parameters
 */
export interface CarFilterParams extends PaginationParams {
  status?: string;
  brand?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  transmission?: string;
  search?: string;
}

/**
 * Lead Filter Parameters
 */
export interface LeadFilterParams extends PaginationParams {
  status?: string;
  source?: string;
  carId?: number;
  assignedToUserId?: number;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Tenant Lookup Result
 */
export interface TenantLookupResult {
  tenant: Tenant | null;
  lookupKey: string;
  lookupType: 'subdomain' | 'customDomain';
}

/**
 * JWT Payload
 */
export interface JwtPayload {
  userId: number;
  tenantId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  sub: string;
}

/**
 * Login Request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  tenant: {
    id: number;
    name: string;
    slug: string;
    subdomain: string;
    customDomain?: string;
    whatsappNumber: string;
    whatsappBotEnabled: boolean;
  };
}

/**
 * Create Car Request
 */
export interface CreateCarRequest {
  // Basic Info
  brand: string;
  model: string;
  year: number;
  color: string;
  transmission: 'Manual' | 'Matic';

  // Specs
  km: number;
  price: number;
  fuelType?: string;

  // Identity
  displayCode: string;
  plateNumber?: string;
  stockCode?: string;

  // Differentiators
  keyFeatures?: string[];
  conditionNotes?: string;

  // Content
  photos?: string[];
  primaryPhotoIndex?: number;
  description?: string;

  // Status
  status?: 'available' | 'sold' | 'booking' | 'draft';
}

/**
 * Update Car Request
 */
export interface UpdateCarRequest extends Partial<CreateCarRequest> {}

/**
 * Create Lead Request
 */
export interface CreateLeadRequest {
  customerPhone: string;
  customerName?: string;
  carId?: number;
  status?: string;
  source?: string;
  notes?: string;
  tags?: string[];
}

/**
 * Update Lead Request
 */
export interface UpdateLeadRequest extends Partial<CreateLeadRequest> {
  assignedToUserId?: number;
}

/**
 * WhatsApp Webhook Payload
 */
export interface WhatsAppWebhookPayload {
  device: string;
  sender: string;
  message: string;
  member: {
    jid: string;
    name: string;
  };
  pushname: string;
  timestamp: number;
  type: 'text' | 'image' | 'video' | 'document' | 'audio';
  file?: string;
  url?: string;
}

/**
 * Validation Error Detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
}

/**
 * Rate Limit Info
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  database: {
    connected: boolean;
    responseTime?: number;
  };
  version: string;
}
