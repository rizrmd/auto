/**
 * Application Constants
 *
 * Centralized configuration for business rules, limits, and app-wide constants.
 */

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * API Response Messages
 */
export const MESSAGES = {
  // Success
  SUCCESS: 'Operation successful',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',

  // Authentication
  UNAUTHORIZED: 'Authentication required',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid or malformed token',

  // Tenant
  TENANT_NOT_FOUND: 'Showroom not found',
  TENANT_SUSPENDED: 'Showroom account is suspended',
  TENANT_EXPIRED: 'Showroom subscription has expired',

  // Car
  CAR_NOT_FOUND: 'Car not found',
  CAR_ALREADY_SOLD: 'Car has already been sold',
  DUPLICATE_DISPLAY_CODE: 'Display code already exists',
  DUPLICATE_SLUG: 'URL slug already exists',

  // Lead
  LEAD_NOT_FOUND: 'Lead not found',
  INVALID_PHONE: 'Invalid phone number format',

  // General
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  FORBIDDEN: 'Access forbidden',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Car Listing Limits
 */
export const CAR_LIMITS = {
  MAX_PHOTOS: 20,
  MAX_KEY_FEATURES: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_YEAR: 1980,
  MAX_YEAR: new Date().getFullYear() + 1,
  MIN_PRICE: 0,
  MAX_PRICE: 999999999999, // 1 trillion
  MIN_KM: 0,
  MAX_KM: 9999999,
} as const;

/**
 * Slug Generation
 */
export const SLUG_CONFIG = {
  MAX_LENGTH: 200,
  SEPARATOR: '-',
  LOWERCASE: true,
} as const;

/**
 * Price Formatting
 */
export const PRICE_FORMAT = {
  LOCALE: 'id-ID',
  CURRENCY: 'IDR',
  SHOW_DECIMALS: false,
} as const;

/**
 * Tenant Status Checks
 */
export const TENANT_ACTIVE_STATUSES = ['active', 'trial'] as const;

/**
 * Car Visible Statuses (for public listing)
 */
export const CAR_VISIBLE_STATUSES = ['available'] as const;

/**
 * Lead Priorities
 */
export const LEAD_PRIORITY = {
  HOT: 'hot',
  WARM: 'warm',
  COLD: 'cold',
  NEW: 'new',
} as const;

/**
 * Default Tenant Settings
 */
export const DEFAULT_TENANT_SETTINGS = {
  primaryColor: '#FF5722',
  secondaryColor: '#000000',
  whatsappBotEnabled: true,
  businessHours: {
    mon: '09:00-18:00',
    tue: '09:00-18:00',
    wed: '09:00-18:00',
    thu: '09:00-18:00',
    fri: '09:00-18:00',
    sat: '09:00-15:00',
    sun: 'closed',
  },
} as const;

/**
 * Cache Keys
 */
export const CACHE_KEYS = {
  TENANT_BY_DOMAIN: (domain: string) => `tenant:domain:${domain}`,
  TENANT_BY_ID: (id: number) => `tenant:id:${id}`,
  CAR_BY_SLUG: (tenantId: number, slug: string) => `car:${tenantId}:${slug}`,
  CARS_LIST: (tenantId: number, page: number, limit: number) =>
    `cars:${tenantId}:page:${page}:limit:${limit}`,
} as const;

/**
 * Webhook Sources
 */
export const WEBHOOK_SOURCES = {
  WHATSAPP: 'whatsapp',
} as const;

/**
 * JWT Configuration
 */
export const JWT_CONFIG = {
  ALGORITHM: 'HS256',
  ISSUER: 'autoleads',
  AUDIENCE: 'autoleads-admin',
} as const;

/**
 * Phone Number Validation
 */
export const PHONE_REGEX = /^(\+62|62|0)[0-9]{9,12}$/;

/**
 * Conversation State Expiry
 */
export const CONVERSATION_STATE_TTL_HOURS = 24;

/**
 * Default Admin User
 */
export const DEFAULT_ADMIN = {
  EMAIL: process.env.DEFAULT_ADMIN_EMAIL || 'admin@localhost',
  PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
  NAME: process.env.DEFAULT_ADMIN_NAME || 'System Admin',
  ROLE: process.env.DEFAULT_ADMIN_ROLE || 'owner',
} as const;

/**
 * File Upload Limits
 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const;

/**
 * CORS Configuration
 */
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
        'https://auto.lumiku.com',
        'https://admin.lumiku.com',
      ])
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],

  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'] as string[],

  ALLOWED_HEADERS: [
    'Content-Type',
    'Authorization',
    'X-Tenant-Domain',
    'X-Requested-With',
  ] as string[],

  EXPOSED_HEADERS: [
    'X-Total-Count',
    'X-Page',
    'X-Per-Page',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
  ] as string[],

  CREDENTIALS: true,
  MAX_AGE: 86400, // 24 hours
};
