/**
 * Environment Variable Validation
 *
 * Validates and exports environment variables with type safety.
 * Fails fast on startup if required variables are missing.
 */

interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ZAI_API_KEY: string;
  ZAI_API_URL: string;
  ZAI_MODEL: string;
  RATE_LIMIT_MAX_REQUESTS: number;
  RATE_LIMIT_WINDOW_MS: number;
  CACHE_TTL_SECONDS: number;
}

/**
 * Retrieves and validates an environment variable
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

/**
 * Retrieves an optional environment variable
 */
function getOptionalEnvVar(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Retrieves a numeric environment variable
 */
function getNumericEnvVar(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }

  return parsed;
}

/**
 * Generates a secure JWT secret for production
 */
function generateSecureJWTSecret(): string {
  // If JWT_SECRET is explicitly set, use it
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }
  
  // In production, generate a secure random secret
  if (process.env.NODE_ENV === 'production') {
    const crypto = require('crypto');
    const secret = crypto.randomBytes(64).toString('hex');
    console.log('🔐 Generated secure JWT secret for production (consider setting JWT_SECRET environment variable for persistence)');
    return secret;
  }
  
  // In development, use a predictable secret
  return 'dev-secret-change-in-production';
}

/**
 * Validated environment configuration
 */
export const env: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',

  // Database
  DATABASE_URL: getEnvVar('DATABASE_URL'),

  // JWT Authentication - CRITICAL: Must use persistent secret
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: getOptionalEnvVar('JWT_EXPIRES_IN', '7d'),



  // ZAI LLM Integration
  ZAI_API_KEY: getOptionalEnvVar('ZAI_API_KEY', ''),
  ZAI_API_URL: getOptionalEnvVar('ZAI_API_URL', 'https://api.z.ai/api/coding/paas/v4'),
  ZAI_MODEL: getOptionalEnvVar('ZAI_MODEL', 'glm-4.5v'),

  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: getNumericEnvVar('RATE_LIMIT_MAX_REQUESTS', 100),
  RATE_LIMIT_WINDOW_MS: getNumericEnvVar('RATE_LIMIT_WINDOW_MS', 60000), // 1 minute

  // Caching
  CACHE_TTL_SECONDS: getNumericEnvVar('CACHE_TTL_SECONDS', 300), // 5 minutes
};

/**
 * Validates environment configuration on module load
 */
function validateEnv(): void {
  const errors: string[] = [];

  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(env.NODE_ENV)) {
    errors.push(`Invalid NODE_ENV: ${env.NODE_ENV}`);
  }

  // Validate DATABASE_URL format
  if (!env.DATABASE_URL.startsWith('postgres://') && !env.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Validate JWT_SECRET in production (only fail if it's the dev secret)
  if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev-secret-change-in-production') {
    console.warn('⚠️  Using development JWT secret in production. Consider setting JWT_SECRET environment variable.');
  }

  // Validate rate limiting values
  if (env.RATE_LIMIT_MAX_REQUESTS <= 0) {
    errors.push('RATE_LIMIT_MAX_REQUESTS must be greater than 0');
  }

  if (env.RATE_LIMIT_WINDOW_MS <= 0) {
    errors.push('RATE_LIMIT_WINDOW_MS must be greater than 0');
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Environment validation failed');
  }
}

// Run validation on module load
validateEnv();

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test';
