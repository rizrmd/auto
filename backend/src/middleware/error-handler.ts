/**
 * Global Error Handler Middleware
 *
 * Catches and formats all errors with standardized JSON responses.
 */

import type { Context } from 'hono';
import { HTTP_STATUS, MESSAGES } from '../config/constants';
import { isDevelopment } from '../config/env';
import type { ApiResponse, ApiError } from '../types/context';

/**
 * Custom Application Error
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(HTTP_STATUS.NOT_FOUND, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = MESSAGES.UNAUTHORIZED) {
    super(HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = MESSAGES.FORBIDDEN) {
    super(HTTP_STATUS.FORBIDDEN, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

/**
 * Bad Request Error
 */
export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', message, details);
    this.name = 'BadRequestError';
  }
}

/**
 * Conflict Error (duplicate resources)
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(HTTP_STATUS.CONFLICT, 'CONFLICT', message, details);
    this.name = 'ConflictError';
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends AppError {
  constructor(message: string = MESSAGES.RATE_LIMIT_EXCEEDED) {
    super(HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED', message);
    this.name = 'RateLimitError';
  }
}

/**
 * Timeout Error
 */
export class TimeoutError extends AppError {
  constructor(operation: string, timeout: number) {
    super(
      HTTP_STATUS.REQUEST_TIMEOUT, 
      'TIMEOUT', 
      `Operation "${operation}" timed out after ${timeout}ms`
    );
    this.name = 'TimeoutError';
  }
}

/**
 * Maps known error types to status codes and error codes
 */
function mapErrorToResponse(error: Error): {
  statusCode: number;
  code: string;
  message: string;
  details?: Record<string, any>;
} {
  // Handle AppError and its subclasses
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  // Handle Prisma errors
  if (error.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    switch (prismaError.code) {
      case 'P2002':
        return {
          statusCode: HTTP_STATUS.CONFLICT,
          code: 'DUPLICATE_RESOURCE',
          message: 'A resource with these values already exists',
          details: { fields: prismaError.meta?.target },
        };
      case 'P2025':
        return {
          statusCode: HTTP_STATUS.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'Resource not found',
        };
      case 'P2003':
        return {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          code: 'FOREIGN_KEY_CONSTRAINT',
          message: 'Referenced resource does not exist',
          details: { field: prismaError.meta?.field_name },
        };
      default:
        return {
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
        };
    }
  }

  // Handle Prisma validation errors
  if (error.constructor.name === 'PrismaClientValidationError') {
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      code: 'VALIDATION_ERROR',
      message: 'Invalid data provided',
    };
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: 'INVALID_TOKEN',
      message: MESSAGES.INVALID_TOKEN,
    };
  }

  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      code: 'TOKEN_EXPIRED',
      message: MESSAGES.TOKEN_EXPIRED,
    };
  }

  // Default to internal server error
  return {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_ERROR',
    message: MESSAGES.INTERNAL_ERROR,
  };
}

/**
 * Global error handler middleware
 */
export function errorHandler(error: Error, c: Context) {
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: isDevelopment ? error.stack : undefined,
    url: c.req.url,
    method: c.req.method,
  });

  const { statusCode, code, message, details } = mapErrorToResponse(error);

  const apiError: ApiError = {
    code,
    message,
    details,
    stack: isDevelopment ? error.stack : undefined,
  };

  const response: ApiResponse = {
    success: false,
    error: apiError,
  };

  return c.json(response, statusCode);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler<T>(
  handler: (c: Context) => Promise<T>
): (c: Context) => Promise<T | Response> {
  return async (c: Context) => {
    try {
      return await handler(c);
    } catch (error) {
      return errorHandler(error as Error, c);
    }
  };
}

/**
 * Assert helper for validation
 */
export function assert(
  condition: boolean,
  message: string,
  statusCode: number = HTTP_STATUS.BAD_REQUEST
): asserts condition {
  if (!condition) {
    throw new AppError(statusCode, 'ASSERTION_FAILED', message);
  }
}

/**
 * Assert that a value is not null/undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string = 'Resource not found'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(message);
  }
}
