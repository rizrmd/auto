/**
 * Validation Schemas using Zod
 *
 * Comprehensive input validation for all API endpoints.
 * Protects against:
 * - SQL injection
 * - XSS attacks
 * - Type confusion bugs
 * - Buffer overflow attacks
 * - Invalid data submissions
 */

import { z } from 'zod';

// ============================================
// CAR VALIDATION SCHEMAS
// ============================================

export const CarCreateSchema = z.object({
  plateNumber: z
    .string()
    .min(1, 'Plate number required')
    .max(20, 'Plate number too long')
    .regex(/^[A-Z0-9\s-]+$/i, 'Invalid plate number format'),

  stockCode: z
    .string()
    .min(1, 'Stock code required')
    .max(50, 'Stock code too long')
    .optional(),

  displayCode: z
    .string()
    .min(1, 'Display code required')
    .max(50, 'Display code too long'),

  publicName: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(200, 'Name too long'),

  brand: z
    .string()
    .min(2, 'Brand required')
    .max(50, 'Brand name too long'),

  model: z
    .string()
    .min(1, 'Model required')
    .max(100, 'Model name too long'),

  year: z
    .number()
    .int('Year must be integer')
    .min(1900, 'Invalid year')
    .max(new Date().getFullYear() + 1, 'Year cannot be in future'),

  color: z
    .string()
    .min(2, 'Color required')
    .max(50, 'Color name too long'),

  transmission: z
    .enum(['manual', 'automatic', 'cvt', 'dct'], {
      errorMap: () => ({ message: 'Invalid transmission type' }),
    }),

  km: z
    .number()
    .int('Kilometers must be integer')
    .min(0, 'Kilometers cannot be negative')
    .max(1000000, 'Invalid kilometer reading'),

  price: z
    .string()
    .regex(/^\d+$/, 'Price must be numeric string')
    .refine((val) => BigInt(val) >= 0, 'Price cannot be negative')
    .refine((val) => BigInt(val) <= BigInt('9999999999999'), 'Price too large'),

  fuelType: z
    .string()
    .min(2, 'Fuel type required')
    .max(50, 'Fuel type too long')
    .optional(),

  keyFeatures: z
    .array(z.string().max(200, 'Feature description too long'))
    .max(20, 'Too many features')
    .optional(),

  conditionNotes: z
    .string()
    .max(2000, 'Condition notes too long')
    .optional(),

  photos: z
    .array(z.string().url('Invalid photo URL'))
    .min(1, 'At least one photo required')
    .max(20, 'Too many photos'),

  primaryPhotoIndex: z
    .number()
    .int('Index must be integer')
    .min(0, 'Index cannot be negative')
    .optional(),

  description: z
    .string()
    .max(5000, 'Description too long')
    .optional(),

  status: z
    .enum(['available', 'reserved', 'sold'], {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .optional()
    .default('available'),
});

export const CarUpdateSchema = CarCreateSchema.partial();

export const CarSearchSchema = z.object({
  search: z
    .string()
    .min(2, 'Search query too short')
    .max(200, 'Search query too long')
    .optional(),

  brand: z.string().max(50, 'Brand name too long').optional(),

  model: z.string().max(100, 'Model name too long').optional(),

  transmission: z
    .enum(['manual', 'automatic', 'cvt', 'dct'], {
      errorMap: () => ({ message: 'Invalid transmission type' }),
    })
    .optional(),

  minYear: z
    .number()
    .int('Year must be integer')
    .min(1900, 'Invalid year')
    .optional(),

  maxYear: z
    .number()
    .int('Year must be integer')
    .max(new Date().getFullYear() + 1, 'Year cannot be in future')
    .optional(),

  minPrice: z
    .string()
    .regex(/^\d+$/, 'Price must be numeric string')
    .optional(),

  maxPrice: z
    .string()
    .regex(/^\d+$/, 'Price must be numeric string')
    .optional(),

  minKm: z
    .number()
    .int('Kilometers must be integer')
    .min(0, 'Kilometers cannot be negative')
    .optional(),

  maxKm: z
    .number()
    .int('Kilometers must be integer')
    .max(1000000, 'Invalid kilometer reading')
    .optional(),

  status: z
    .enum(['available', 'reserved', 'sold'], {
      errorMap: () => ({ message: 'Invalid status' }),
    })
    .optional(),

  page: z
    .number()
    .int('Page must be integer')
    .min(1, 'Page must be at least 1')
    .optional()
    .default(1),

  limit: z
    .number()
    .int('Limit must be integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(10),

  sortBy: z
    .enum(['price', 'year', 'km', 'createdAt'], {
      errorMap: () => ({ message: 'Invalid sort field' }),
    })
    .optional(),

  sortOrder: z
    .enum(['asc', 'desc'], {
      errorMap: () => ({ message: 'Invalid sort order' }),
    })
    .optional(),
});

// ============================================
// LEAD VALIDATION SCHEMAS
// ============================================

export const LeadCreateSchema = z.object({
  customerPhone: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian phone number')
    .transform((val) => {
      // Normalize to 08xxx format
      if (val.startsWith('+62')) return '0' + val.substring(3);
      if (val.startsWith('62')) return '0' + val.substring(2);
      return val;
    }),

  customerName: z
    .string()
    .min(2, 'Name too short')
    .max(200, 'Name too long')
    .optional(),

  carId: z
    .number()
    .int('Car ID must be integer')
    .positive('Invalid car ID')
    .optional(),

  source: z
    .enum(['whatsapp', 'web', 'phone', 'walk_in', 'referral', 'other'], {
      errorMap: () => ({ message: 'Invalid lead source' }),
    })
    .optional()
    .default('web'),

  notes: z
    .string()
    .max(2000, 'Notes too long')
    .optional(),

  tags: z
    .array(z.string().max(50, 'Tag too long'))
    .max(10, 'Too many tags')
    .optional(),
});

export const LeadUpdateSchema = z.object({
  customerName: z
    .string()
    .min(2, 'Name too short')
    .max(200, 'Name too long')
    .optional(),

  carId: z
    .number()
    .int('Car ID must be integer')
    .positive('Invalid car ID')
    .optional(),

  status: z
    .enum(['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'], {
      errorMap: () => ({ message: 'Invalid lead status' }),
    })
    .optional(),

  assignedToUserId: z
    .number()
    .int('User ID must be integer')
    .positive('Invalid user ID')
    .optional(),

  notes: z
    .string()
    .max(2000, 'Notes too long')
    .optional(),

  tags: z
    .array(z.string().max(50, 'Tag too long'))
    .max(10, 'Too many tags')
    .optional(),
});

export const LeadAssignSchema = z.object({
  userId: z
    .number()
    .int('User ID must be integer')
    .positive('Invalid user ID'),
});

export const LeadStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'], {
    errorMap: () => ({ message: 'Invalid lead status' }),
  }),
});

// ============================================
// AUTH VALIDATION SCHEMAS
// ============================================

export const LoginSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .toLowerCase(),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
});

export const UserCreateSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .toLowerCase(),

  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),

  name: z
    .string()
    .min(2, 'Name too short')
    .max(200, 'Name too long'),

  role: z.enum(['owner', 'admin', 'sales'], {
    errorMap: () => ({ message: 'Invalid role' }),
  }),

  phone: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian phone number')
    .optional(),

  whatsappNumber: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Invalid Indonesian phone number')
    .optional(),
});

export const UserUpdateSchema = UserCreateSchema.partial().omit({ email: true });

// ============================================
// QUERY PARAMETER SCHEMAS
// ============================================

export const PaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, 'Page must be at least 1'),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100'),
});

export const IdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID must be a number')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'ID must be positive'),
});

export const SlugParamSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug required')
    .max(200, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
});
