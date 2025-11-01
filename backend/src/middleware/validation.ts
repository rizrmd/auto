/**
 * Validation Middleware using Zod
 *
 * Provides middleware functions for validating request data against Zod schemas.
 * Supports validation of body, query parameters, and URL parameters.
 */

import { Context, Next } from 'hono';
import { z, ZodSchema, ZodError } from 'zod';
import { HTTP_STATUS } from '../config/constants';
import type { ApiResponse } from '../types/context';

/**
 * Validation middleware factory
 *
 * @param schema - Zod schema to validate against
 * @param source - Where to get data from: 'body', 'query', or 'params'
 * @returns Hono middleware function
 */
export function validate(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (c: Context, next: Next) => {
    try {
      let data: unknown;

      // Extract data from specified source
      if (source === 'body') {
        data = await c.req.json();
      } else if (source === 'query') {
        // Convert URLSearchParams to plain object
        const searchParams = new URL(c.req.url).searchParams;
        data = Object.fromEntries(searchParams.entries());
      } else if (source === 'params') {
        data = c.req.param();
      }

      // Validate data against schema
      const validated = schema.parse(data);

      // Store validated data in context for handlers to use
      c.set('validatedData', validated);

      return next();
    } catch (error) {
      if (error instanceof ZodError && error.errors && Array.isArray(error.errors)) {
        // Format Zod validation errors into user-friendly messages
        const issues = error.errors.map((err) => ({
          path: err.path.join('.') || 'root',
          message: err.message,
          code: err.code,
        }));

        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: issues,
          },
        };

        return c.json(response, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      }

      // Handle other errors (e.g., JSON parse errors)
      console.error('Validation middleware error:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request data',
        },
      };

      return c.json(response, HTTP_STATUS.BAD_REQUEST);
    }
  };
}

/**
 * Type-safe helper to retrieve validated data from context
 *
 * @param c - Hono context
 * @returns Validated data with proper type inference
 */
export function getValidatedData<T>(c: Context): T {
  const data = c.get('validatedData');
  if (!data) {
    throw new Error('No validated data found in context. Did you use validate() middleware?');
  }
  return data as T;
}

/**
 * Validate query parameters with automatic type coercion
 *
 * This is a specialized validator for query parameters that handles
 * common transformations like string to number conversion.
 */
export function validateQuery(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const searchParams = new URL(c.req.url).searchParams;
      const queryObject: Record<string, string | string[]> = {};

      // Build query object, handling multiple values
      for (const [key, value] of searchParams.entries()) {
        const existing = queryObject[key];
        if (existing) {
          if (Array.isArray(existing)) {
            existing.push(value);
          } else {
            queryObject[key] = [existing, value];
          }
        } else {
          queryObject[key] = value;
        }
      }

      // Validate and transform
      const validated = schema.parse(queryObject);
      c.set('validatedData', validated);

      return next();
    } catch (error) {
      if (error instanceof ZodError && error.errors && Array.isArray(error.errors)) {
        const issues = error.errors.map((err) => ({
          path: err.path.join('.') || 'root',
          message: err.message,
          code: err.code,
        }));

        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: issues,
          },
        };

        return c.json(response, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      }

      console.error('Query validation error:', error);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid query parameters',
        },
      };

      return c.json(response, HTTP_STATUS.BAD_REQUEST);
    }
  };
}

/**
 * Validate URL parameters (e.g., :id, :slug)
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}

/**
 * Optional validation wrapper
 *
 * If validation fails, continues without error but doesn't set validatedData.
 * Useful for optional query parameters.
 */
export function validateOptional(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return async (c: Context, next: Next) => {
    try {
      let data: unknown;

      if (source === 'body') {
        data = await c.req.json();
      } else if (source === 'query') {
        const searchParams = new URL(c.req.url).searchParams;
        data = Object.fromEntries(searchParams.entries());
      } else if (source === 'params') {
        data = c.req.param();
      }

      const validated = schema.parse(data);
      c.set('validatedData', validated);
    } catch (error) {
      // Silently continue on validation error
      console.warn('Optional validation failed:', error instanceof ZodError ? error.errors : error);
    }

    return next();
  };
}
