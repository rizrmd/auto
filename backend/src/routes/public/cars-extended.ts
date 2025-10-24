/**
 * Extended Public Cars Routes - Additional endpoints for search and featured
 *
 * Add these routes to the existing public/cars.ts file
 */

/**
 * GET /api/cars/search
 * Search cars with autocomplete
 */
/*
publicCars.get(
  '/search',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();
    const search = c.req.query('search');
    const limit = Math.min(
      parseInt(c.req.query('limit') || '5'),
      10
    );

    if (!search) {
      return c.json({ success: true, data: { cars: [] } });
    }

    const filters = {
      page: 1,
      limit,
      offset: 0,
      search,
    };

    const result = await carService.getPublicCars(tenant.id, filters);

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
      photos: car.photos,
      primaryPhotoIndex: car.primaryPhotoIndex,
    }));

    return c.json({ success: true, data: { cars: formattedCars } });
  })
);
*/

/**
 * GET /api/cars/featured
 * Get featured cars for homepage
 */
/*
publicCars.get(
  '/featured',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();
    const limit = Math.min(
      parseInt(c.req.query('limit') || '6'),
      12
    );

    const filters = {
      page: 1,
      limit,
      offset: 0,
    };

    const result = await carService.getPublicCars(tenant.id, filters);

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
      keyFeatures: car.keyFeatures,
      photos: car.photos,
      primaryPhotoIndex: car.primaryPhotoIndex,
      status: car.status,
    }));

    return c.json({ success: true, data: { cars: formattedCars } });
  })
);
*/

// Note: Add these routes BEFORE the '/:slug' route in public/cars.ts
// The order matters because Hono matches routes in the order they are defined
