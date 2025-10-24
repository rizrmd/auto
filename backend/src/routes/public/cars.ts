/**
 * Public Cars Routes
 *
 * Public-facing API for browsing car inventory.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { CarService } from '../../services/car.service';
import { tenantMiddleware, getTenant } from '../../middleware/tenant';
import { asyncHandler } from '../../middleware/error-handler';
import { publicRateLimiter } from '../../middleware/rate-limiter';
import { PAGINATION, HTTP_STATUS, MESSAGES } from '../../config/constants';
import { formatPrice } from '../../utils/price-formatter';
import type { ApiResponse } from '../../types/context';

const publicCars = new Hono();

// Apply tenant middleware and rate limiting to all routes
publicCars.use('*', tenantMiddleware);
publicCars.use('*', publicRateLimiter());

/**
 * GET /api/cars
 * List all available cars for a tenant
 */
publicCars.get(
  '/',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();

    // Parse query parameters
    const page = parseInt(c.req.query('page') || String(PAGINATION.DEFAULT_PAGE));
    const limit = Math.min(
      parseInt(c.req.query('limit') || String(PAGINATION.DEFAULT_LIMIT)),
      PAGINATION.MAX_LIMIT
    );

    const filters = {
      page,
      limit,
      offset: (page - 1) * limit,
      brand: c.req.query('brand'),
      model: c.req.query('model'),
      minYear: c.req.query('minYear') ? parseInt(c.req.query('minYear')!) : undefined,
      maxYear: c.req.query('maxYear') ? parseInt(c.req.query('maxYear')!) : undefined,
      minPrice: c.req.query('minPrice') ? parseInt(c.req.query('minPrice')!) : undefined,
      maxPrice: c.req.query('maxPrice') ? parseInt(c.req.query('maxPrice')!) : undefined,
      transmission: c.req.query('transmission'),
      search: c.req.query('search'),
    };

    // Get public cars (only available status)
    const result = await carService.getPublicCars(tenant.id, filters);

    // Format response with price formatting
    const formattedCars = result.cars.map((car) => ({
      id: car.id,
      displayCode: car.displayCode,
      publicName: car.publicName,
      slug: car.slug,
      brand: car.brand,
      model: car.model,
      year: car.year,
      color: car.color,
      transmission: car.transmission,
      km: car.km,
      price: car.price.toString(),
      priceFormatted: formatPrice(car.price),
      priceFormattedShort: formatPrice(car.price, { short: true }),
      fuelType: car.fuelType,
      keyFeatures: car.keyFeatures,
      photos: car.photos,
      primaryPhoto: car.photos[car.primaryPhotoIndex] || car.photos[0],
      photoCount: car.photos.length,
      description: car.description,
      createdAt: car.createdAt,
    }));

    const response: ApiResponse = {
      success: true,
      data: formattedCars,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };

    // Add pagination headers
    c.header('X-Total-Count', result.total.toString());
    c.header('X-Page', result.page.toString());
    c.header('X-Per-Page', result.limit.toString());

    return c.json(response);
  })
);

/**
 * GET /api/cars/featured
 * Get featured cars for homepage
 */
publicCars.get(
  '/featured',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();

    // Parse limit (default 6, max 12)
    const limit = Math.min(
      parseInt(c.req.query('limit') || '6'),
      12
    );

    // Get latest available cars as featured
    const result = await carService.getPublicCars(tenant.id, {
      page: 1,
      limit,
      offset: 0,
    });

    // Format response with price formatting
    const formattedCars = result.cars.map((car) => ({
      id: car.id,
      displayCode: car.displayCode,
      publicName: car.publicName,
      slug: car.slug,
      brand: car.brand,
      model: car.model,
      year: car.year,
      color: car.color,
      transmission: car.transmission,
      km: car.km,
      price: car.price.toString(),
      priceFormatted: formatPrice(car.price),
      priceFormattedShort: formatPrice(car.price, { short: true }),
      fuelType: car.fuelType,
      keyFeatures: car.keyFeatures,
      photos: car.photos,
      primaryPhotoIndex: car.primaryPhotoIndex,
      primaryPhoto: car.photos[car.primaryPhotoIndex] || car.photos[0],
      photoCount: car.photos.length,
      description: car.description,
      createdAt: car.createdAt,
    }));

    const response: ApiResponse = {
      success: true,
      data: {
        cars: formattedCars,
        total: result.total,
      },
    };

    return c.json(response);
  })
);

/**
 * GET /api/cars/search
 * Search autocomplete endpoint
 * IMPORTANT: Must be BEFORE /:slug route to avoid matching "search" as a slug
 */
publicCars.get(
  '/search',
  asyncHandler(async (c) => {
    const query = c.req.query('search')?.trim() || '';
    const limit = Math.min(parseInt(c.req.query('limit') || '5'), 20);

    // Return empty if query too short
    if (query.length < 2) {
      return c.json({
        success: true,
        data: { cars: [], total: 0 },
      });
    }

    const tenant = getTenant(c);
    const carService = new CarService();

    console.log('[SEARCH] Autocomplete query:', query, 'limit:', limit);

    // Search in multiple fields
    const result = await carService.getPublicCars(tenant.id, {
      page: 1,
      limit,
      offset: 0,
      search: query,
    });

    // Format response with price formatting
    const formattedCars = result.cars.map((car) => ({
      id: car.id,
      displayCode: car.displayCode,
      publicName: car.publicName,
      slug: car.slug,
      brand: car.brand,
      model: car.model,
      year: car.year,
      price: car.price.toString(),
      priceFormatted: formatPrice(car.price, { short: true }),
      transmission: car.transmission,
      km: car.km,
      primaryPhoto: car.photos[car.primaryPhotoIndex] || car.photos[0] || null,
    }));

    console.log('[SEARCH] Found', formattedCars.length, 'results');

    const response: ApiResponse = {
      success: true,
      data: {
        cars: formattedCars,
        total: formattedCars.length,
      },
    };

    return c.json(response);
  })
);

/**
 * GET /api/cars/:slug
 * Get car details by slug
 */
publicCars.get(
  '/:slug',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();
    const slug = c.req.param('slug');

    // Find car by slug
    const car = await carService.findBySlug(tenant.id, slug);

    if (!car) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: MESSAGES.CAR_NOT_FOUND,
        },
      };
      return c.json(response, HTTP_STATUS.NOT_FOUND);
    }

    // Only show available cars to public
    if (car.status !== 'available') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: MESSAGES.CAR_NOT_FOUND,
        },
      };
      return c.json(response, HTTP_STATUS.NOT_FOUND);
    }

    // Format response
    const formattedCar = {
      id: car.id,
      displayCode: car.displayCode,
      publicName: car.publicName,
      slug: car.slug,
      brand: car.brand,
      model: car.model,
      year: car.year,
      color: car.color,
      transmission: car.transmission,
      km: car.km,
      price: car.price.toString(),
      priceFormatted: formatPrice(car.price),
      priceFormattedShort: formatPrice(car.price, { short: true }),
      fuelType: car.fuelType,
      keyFeatures: car.keyFeatures,
      conditionNotes: car.conditionNotes,
      photos: car.photos,
      primaryPhoto: car.photos[car.primaryPhotoIndex] || car.photos[0],
      description: car.description,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
    };

    const response: ApiResponse = {
      success: true,
      data: formattedCar,
    };

    return c.json(response);
  })
);

export default publicCars;
