/**
 * Admin Cars Routes
 *
 * CRUD operations for car inventory management.
 */

import { Hono } from 'hono';
import { CarService } from '../../services/car.service';
import { tenantMiddleware, getTenant } from '../../middleware/tenant';
import { authMiddleware, requireAdmin } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/error-handler';
import { PAGINATION, HTTP_STATUS, MESSAGES } from '../../config/constants';
import { formatPrice } from '../../utils/price-formatter';
import type { ApiResponse, CreateCarRequest, UpdateCarRequest } from '../../types/context';

const adminCars = new Hono();

// Apply tenant and auth middleware to all routes
adminCars.use('*', tenantMiddleware);
adminCars.use('*', authMiddleware);
adminCars.use('*', requireAdmin);

/**
 * GET /api/admin/cars
 * List all cars (including drafts and sold)
 */
adminCars.get(
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
      status: c.req.query('status'),
      brand: c.req.query('brand'),
      model: c.req.query('model'),
      minYear: c.req.query('minYear') ? parseInt(c.req.query('minYear')!) : undefined,
      maxYear: c.req.query('maxYear') ? parseInt(c.req.query('maxYear')!) : undefined,
      minPrice: c.req.query('minPrice') ? parseInt(c.req.query('minPrice')!) : undefined,
      maxPrice: c.req.query('maxPrice') ? parseInt(c.req.query('maxPrice')!) : undefined,
      transmission: c.req.query('transmission'),
      search: c.req.query('search'),
    };

    // Get all cars (admin can see all statuses)
    const result = await carService.list(tenant.id, filters);

    // Format response
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
      price: Number(car.price),
      priceFormatted: formatPrice(car.price),
      priceFormattedShort: formatPrice(car.price, { short: true }),
      fuelType: car.fuelType,
      plateNumber: car.plateNumber,
      stockCode: car.stockCode,
      keyFeatures: car.keyFeatures,
      conditionNotes: car.conditionNotes,
      photos: car.photos,
      primaryPhoto: car.photos[car.primaryPhotoIndex] || car.photos[0],
      photoCount: car.photos.length,
      description: car.description,
      status: car.status,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
      soldAt: car.soldAt,
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

    return c.json(response);
  })
);

/**
 * GET /api/admin/cars/:id
 * Get car details by ID
 */
adminCars.get(
  '/:id',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();
    const carId = parseInt(c.req.param('id'));

    const car = await carService.findById(tenant.id, carId);

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
      price: Number(car.price),
      priceFormatted: formatPrice(car.price),
      fuelType: car.fuelType,
      plateNumber: car.plateNumber,
      stockCode: car.stockCode,
      keyFeatures: car.keyFeatures,
      conditionNotes: car.conditionNotes,
      photos: car.photos,
      primaryPhotoIndex: car.primaryPhotoIndex,
      description: car.description,
      status: car.status,
      createdAt: car.createdAt,
      updatedAt: car.updatedAt,
      soldAt: car.soldAt,
    };

    const response: ApiResponse = {
      success: true,
      data: formattedCar,
    };

    return c.json(response);
  })
);

/**
 * POST /api/admin/cars
 * Create a new car
 */
adminCars.post(
  '/',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();

    const body: CreateCarRequest = await c.req.json();

    // Create car
    const car = await carService.create(tenant.id, body);

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
      price: Number(car.price),
      priceFormatted: formatPrice(car.price),
      status: car.status,
      createdAt: car.createdAt,
    };

    const response: ApiResponse = {
      success: true,
      data: formattedCar,
    };

    return c.json(response, HTTP_STATUS.CREATED);
  })
);

/**
 * PUT /api/admin/cars/:id
 * Update a car
 */
adminCars.put(
  '/:id',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();
    const carId = parseInt(c.req.param('id'));

    const body: UpdateCarRequest = await c.req.json();

    // Update car
    const car = await carService.update(tenant.id, carId, body);

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
      price: Number(car.price),
      priceFormatted: formatPrice(car.price),
      status: car.status,
      updatedAt: car.updatedAt,
    };

    const response: ApiResponse = {
      success: true,
      data: formattedCar,
    };

    return c.json(response);
  })
);

/**
 * DELETE /api/admin/cars/:id
 * Delete a car
 */
adminCars.delete(
  '/:id',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();
    const carId = parseInt(c.req.param('id'));

    await carService.delete(tenant.id, carId);

    const response: ApiResponse = {
      success: true,
      data: {
        message: MESSAGES.DELETED,
      },
    };

    return c.json(response);
  })
);

export default adminCars;
