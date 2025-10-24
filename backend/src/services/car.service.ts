/**
 * Car Service
 *
 * Handles car CRUD operations with tenant scoping.
 */

import { prisma } from '../db';
import type { Car } from '../../../generated/prisma';
import type { CarFilterParams, CreateCarRequest, UpdateCarRequest } from '../types/context';
import { NotFoundError, ConflictError, ValidationError } from '../middleware/error-handler';
import { generateCarSlug, generateUniqueSlug } from '../utils/slug-generator';
import { CAR_LIMITS, CAR_VISIBLE_STATUSES, MESSAGES } from '../config/constants';

/**
 * Car Service Class
 */
export class CarService {
  /**
   * Create a new car
   */
  async create(tenantId: number, data: CreateCarRequest): Promise<Car> {
    // Validate input
    this.validateCarData(data);

    // Check for duplicate display code
    const existingCode = await prisma.car.findUnique({
      where: {
        tenantId_displayCode: {
          tenantId,
          displayCode: data.displayCode,
        },
      },
    });

    if (existingCode) {
      throw new ConflictError(MESSAGES.DUPLICATE_DISPLAY_CODE);
    }

    // Generate public name
    const publicName = `${data.brand} ${data.model} ${data.year} ${data.color} ${data.displayCode}`;

    // Generate slug
    const baseSlug = generateCarSlug(
      data.brand,
      data.model,
      data.year,
      data.color,
      data.displayCode
    );

    // Ensure unique slug
    const slug = await generateUniqueSlug(baseSlug, async (s) => {
      const existing = await prisma.car.findUnique({
        where: { tenantId_slug: { tenantId, slug: s } },
      });
      return existing !== null;
    });

    // Clean plate number
    const plateNumberClean = data.plateNumber
      ? data.plateNumber.replace(/[^A-Z0-9]/g, '').toUpperCase()
      : null;

    // Create car
    const car = await prisma.car.create({
      data: {
        tenantId,
        brand: data.brand,
        model: data.model,
        year: data.year,
        color: data.color,
        transmission: data.transmission,
        km: data.km,
        price: BigInt(data.price),
        fuelType: data.fuelType,
        displayCode: data.displayCode,
        publicName,
        slug,
        plateNumber: data.plateNumber,
        plateNumberClean,
        stockCode: data.stockCode,
        keyFeatures: data.keyFeatures || [],
        conditionNotes: data.conditionNotes,
        photos: data.photos || [],
        primaryPhotoIndex: data.primaryPhotoIndex || 0,
        description: data.description,
        status: data.status || 'draft',
      },
    });

    return car;
  }

  /**
   * Update a car
   */
  async update(
    tenantId: number,
    carId: number,
    data: UpdateCarRequest
  ): Promise<Car> {
    // Get existing car
    const existingCar = await this.findById(tenantId, carId);

    if (!existingCar) {
      throw new NotFoundError('Car');
    }

    // Validate input
    if (Object.keys(data).length > 0) {
      this.validateCarData(data as CreateCarRequest, true);
    }

    // Check for duplicate display code if changing
    if (data.displayCode && data.displayCode !== existingCar.displayCode) {
      const existingCode = await prisma.car.findUnique({
        where: {
          tenantId_displayCode: {
            tenantId,
            displayCode: data.displayCode,
          },
        },
      });

      if (existingCode) {
        throw new ConflictError(MESSAGES.DUPLICATE_DISPLAY_CODE);
      }
    }

    // Generate new slug if relevant fields changed
    let slug = existingCar.slug;
    const slugFields = ['brand', 'model', 'year', 'color', 'displayCode'];
    const shouldRegenerateSlug = slugFields.some((field) => field in data);

    if (shouldRegenerateSlug) {
      const brand = data.brand || existingCar.brand;
      const model = data.model || existingCar.model;
      const year = data.year || existingCar.year;
      const color = data.color || existingCar.color;
      const displayCode = data.displayCode || existingCar.displayCode;

      const baseSlug = generateCarSlug(brand, model, year, color, displayCode);

      if (baseSlug !== existingCar.slug) {
        slug = await generateUniqueSlug(baseSlug, async (s) => {
          if (s === existingCar.slug) return false;
          const existing = await prisma.car.findUnique({
            where: { tenantId_slug: { tenantId, slug: s } },
          });
          return existing !== null;
        });
      }
    }

    // Generate new public name if relevant fields changed
    let publicName = existingCar.publicName;
    const publicNameFields = ['brand', 'model', 'year', 'color', 'displayCode'];
    const shouldRegeneratePublicName = publicNameFields.some((field) => field in data);

    if (shouldRegeneratePublicName) {
      const brand = data.brand || existingCar.brand;
      const model = data.model || existingCar.model;
      const year = data.year || existingCar.year;
      const color = data.color || existingCar.color;
      const displayCode = data.displayCode || existingCar.displayCode;

      publicName = `${brand} ${model} ${year} ${color} ${displayCode}`;
    }

    // Clean plate number if provided
    const plateNumberClean = data.plateNumber
      ? data.plateNumber.replace(/[^A-Z0-9]/g, '').toUpperCase()
      : existingCar.plateNumberClean;

    // Update car
    const updateData: any = {
      ...data,
      slug,
      publicName,
      plateNumberClean,
    };

    // Convert price to BigInt if provided
    if (data.price !== undefined) {
      updateData.price = BigInt(data.price);
    }

    // Set soldAt timestamp if status changed to sold
    if (data.status === 'sold' && existingCar.status !== 'sold') {
      updateData.soldAt = new Date();
    }

    const car = await prisma.car.update({
      where: { id: carId },
      data: updateData,
    });

    return car;
  }

  /**
   * Delete a car
   */
  async delete(tenantId: number, carId: number): Promise<void> {
    const car = await this.findById(tenantId, carId);

    if (!car) {
      throw new NotFoundError('Car');
    }

    await prisma.car.delete({
      where: { id: carId },
    });
  }

  /**
   * Find car by ID
   */
  async findById(tenantId: number, carId: number): Promise<Car | null> {
    return await prisma.car.findFirst({
      where: {
        id: carId,
        tenantId,
      },
    });
  }

  /**
   * Find car by slug
   */
  async findBySlug(tenantId: number, slug: string): Promise<Car | null> {
    return await prisma.car.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
    });
  }

  /**
   * List cars with filters and pagination
   */
  async list(tenantId: number, filters: CarFilterParams): Promise<{
    cars: Car[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page,
      limit,
      offset,
      status,
      brand,
      model,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      transmission,
      search,
    } = filters;

    // Build where clause
    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (brand) {
      where.brand = brand;
    }

    if (model) {
      where.model = { contains: model, mode: 'insensitive' };
    }

    if (minYear || maxYear) {
      where.year = {};
      if (minYear) where.year.gte = minYear;
      if (maxYear) where.year.lte = maxYear;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = BigInt(minPrice);
      if (maxPrice) where.price.lte = BigInt(maxPrice);
    }

    if (transmission) {
      where.transmission = transmission;
    }

    if (search) {
      where.OR = [
        { publicName: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { displayCode: { contains: search, mode: 'insensitive' } },
        { color: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.car.count({ where });

    // Get cars
    const cars = await prisma.car.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: [
        { status: 'asc' }, // Available first
        { createdAt: 'desc' },
      ],
    });

    const totalPages = Math.ceil(total / limit);

    return {
      cars,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get public cars (available only)
   */
  async getPublicCars(tenantId: number, filters: CarFilterParams): Promise<{
    cars: Car[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.list(tenantId, {
      ...filters,
      status: 'available',
    });
  }

  /**
   * Validate car data
   */
  private validateCarData(data: Partial<CreateCarRequest>, isUpdate = false): void {
    const errors: Record<string, string> = {};

    // Year validation
    if (data.year !== undefined) {
      if (data.year < CAR_LIMITS.MIN_YEAR || data.year > CAR_LIMITS.MAX_YEAR) {
        errors.year = `Year must be between ${CAR_LIMITS.MIN_YEAR} and ${CAR_LIMITS.MAX_YEAR}`;
      }
    }

    // Price validation
    if (data.price !== undefined) {
      if (data.price < CAR_LIMITS.MIN_PRICE || data.price > CAR_LIMITS.MAX_PRICE) {
        errors.price = `Price must be between ${CAR_LIMITS.MIN_PRICE} and ${CAR_LIMITS.MAX_PRICE}`;
      }
    }

    // KM validation
    if (data.km !== undefined) {
      if (data.km < CAR_LIMITS.MIN_KM || data.km > CAR_LIMITS.MAX_KM) {
        errors.km = `Mileage must be between ${CAR_LIMITS.MIN_KM} and ${CAR_LIMITS.MAX_KM}`;
      }
    }

    // Photos validation
    if (data.photos !== undefined) {
      if (data.photos.length > CAR_LIMITS.MAX_PHOTOS) {
        errors.photos = `Maximum ${CAR_LIMITS.MAX_PHOTOS} photos allowed`;
      }
    }

    // Key features validation
    if (data.keyFeatures !== undefined) {
      if (data.keyFeatures.length > CAR_LIMITS.MAX_KEY_FEATURES) {
        errors.keyFeatures = `Maximum ${CAR_LIMITS.MAX_KEY_FEATURES} key features allowed`;
      }
    }

    // Description validation
    if (data.description !== undefined && data.description) {
      if (data.description.length > CAR_LIMITS.MAX_DESCRIPTION_LENGTH) {
        errors.description = `Description must not exceed ${CAR_LIMITS.MAX_DESCRIPTION_LENGTH} characters`;
      }
    }

    // Required fields for creation
    if (!isUpdate) {
      const requiredFields = ['brand', 'model', 'year', 'color', 'transmission', 'km', 'price', 'displayCode'];
      for (const field of requiredFields) {
        if (!(field in data) || (data as any)[field] === undefined) {
          errors[field] = `${field} is required`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(MESSAGES.VALIDATION_ERROR, errors);
    }
  }
}
