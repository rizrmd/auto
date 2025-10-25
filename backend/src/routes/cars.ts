/**
 * Car API Routes
 */

import type { Context } from 'hono';
import { prisma } from '../db';

/**
 * GET /api/cars - Get cars with filters and pagination
 */
export async function getCars(c: Context) {
  try {
    const {
      brand,
      minYear,
      maxYear,
      minPrice,
      maxPrice,
      transmission,
      search,
      sortBy = 'newest',
      page = '1',
      limit = '12',
    } = c.req.query();

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      status: 'available', // Only show available cars by default
    };

    if (brand) {
      where.brand = brand;
    }

    if (minYear || maxYear) {
      where.year = {};
      if (minYear) where.year.gte = parseInt(minYear);
      if (maxYear) where.year.lte = parseInt(maxYear);
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
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { publicName: { contains: search, mode: 'insensitive' } },
        { displayCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' }; // Default: newest

    if (sortBy === 'price_asc') {
      orderBy = { price: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderBy = { price: 'desc' };
    } else if (sortBy === 'km_asc') {
      orderBy = { km: 'asc' };
    }

    // Fetch cars and total count
    const [cars, total] = await Promise.all([
      prisma.car.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.car.count({ where }),
    ]);

    // Get filter metadata based on current filters (excluding pagination)
    const filterWhere = { ...where };
    delete (filterWhere as any).skip;
    delete (filterWhere as any).take;
    
    const [brands, availableYears, priceData] = await Promise.all([
      prisma.car.findMany({
        where: { ...filterWhere, status: 'available' },
        select: { brand: true },
        distinct: ['brand'],
      }),
      prisma.car.findMany({
        where: { ...filterWhere, status: 'available' },
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'asc' },
      }),
      prisma.car.aggregate({
        where: { ...filterWhere, status: 'available' },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    // Format response
    const response = {
      cars: cars.map((car) => ({
        ...car,
        price: car.price.toString(),
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      brands: brands.map((b) => b.brand).sort(),
      availableYears: availableYears.map(y => y.year),
      yearRange: {
        min: availableYears.length > 0 ? availableYears[0] : new Date().getFullYear() - 20,
        max: availableYears.length > 0 ? availableYears[availableYears.length - 1] : new Date().getFullYear(),
      },
      priceRange: {
        min: Number(priceData._min.price || 0),
        max: Number(priceData._max.price || 1000000000),
      },
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching cars:', error);
    return c.json({ error: 'Failed to fetch cars' }, 500);
  }
}

/**
 * GET /api/cars/:idOrSlug - Get single car by ID or slug
 */
export async function getCarDetail(c: Context) {
  try {
    const idOrSlug = c.req.param('idOrSlug');

    let car;

    // Try to find by ID first
    if (!isNaN(Number(idOrSlug))) {
      car = await prisma.car.findUnique({
        where: { id: parseInt(idOrSlug) },
      });
    }

    // If not found, try by slug
    if (!car) {
      car = await prisma.car.findFirst({
        where: { slug: idOrSlug },
      });
    }

    if (!car) {
      return c.json({ error: 'Car not found' }, 404);
    }

    return c.json({
      ...car,
      price: car.price.toString(),
    });
  } catch (error) {
    console.error('Error fetching car detail:', error);
    return c.json({ error: 'Failed to fetch car details' }, 500);
  }
}

/**
 * GET /api/cars/search - Search cars with autocomplete
 */
export async function searchCars(c: Context) {
  try {
    const { search, limit = '5' } = c.req.query();

    if (!search) {
      return c.json({ cars: [] });
    }

    const cars = await prisma.car.findMany({
      where: {
        status: 'available',
        OR: [
          { brand: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { publicName: { contains: search, mode: 'insensitive' } },
          { displayCode: { contains: search, mode: 'insensitive' } },
        ],
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    return c.json({
      cars: cars.map((car) => ({
        ...car,
        price: car.price.toString(),
      })),
    });
  } catch (error) {
    console.error('Error searching cars:', error);
    return c.json({ error: 'Failed to search cars' }, 500);
  }
}

/**
 * GET /api/cars/featured - Get featured cars
 */
export async function getFeaturedCars(c: Context) {
  try {
    const { limit = '6' } = c.req.query();

    const cars = await prisma.car.findMany({
      where: { status: 'available' },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    return c.json({
      cars: cars.map((car) => ({
        ...car,
        price: car.price.toString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching featured cars:', error);
    return c.json({ error: 'Failed to fetch featured cars' }, 500);
  }
}
