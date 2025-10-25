# AutoLeads Car Catalog - Integration Guide

## Quick Start Integration

### Step 1: Update Backend Routes

Add the missing search and featured endpoints to `backend/src/routes/public/cars.ts`:

```typescript
// Add BEFORE the '/:slug' route (order matters!)

/**
 * GET /api/cars/search
 * Search cars with autocomplete
 */
publicCars.get(
  '/search',
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();
    const search = c.req.query('search');
    const limit = Math.min(parseInt(c.req.query('limit') || '5'), 10);

    if (!search) {
      return c.json({ success: true, data: { cars: [] } });
    }

    const filters = { page: 1, limit, offset: 0, search };
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
      price: Number(car.price),
      photos: car.photos,
      primaryPhotoIndex: car.primaryPhotoIndex,
    }));

    return c.json({ success: true, data: { cars: formattedCars } });
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
    const limit = Math.min(parseInt(c.req.query('limit') || '6'), 12);

    const filters = { page: 1, limit, offset: 0 };
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
      price: Number(car.price),
      keyFeatures: car.keyFeatures,
      photos: car.photos,
      primaryPhotoIndex: car.primaryPhotoIndex,
      status: car.status,
    }));

    return c.json({ success: true, data: { cars: formattedCars } });
  })
);
```

### Step 2: Add Tenant Route to Backend

In `backend/index.tsx`, ensure tenant routes are registered:

```typescript
import { Hono } from 'hono';
import { getTenant, getTenantById } from './src/routes/tenant';

// ... existing code ...

// Add these routes
app.get('/api/tenant', getTenant);
app.get('/api/tenant/:id', getTenantById);
```

### Step 3: Wrap Your App with TenantProvider

Update your main `frontend/App.tsx` or entry point:

```tsx
import React from 'react';
import { TenantProvider } from './src/context/TenantContext';
import { HomePage } from './src/pages/HomePage';
import { CarListingPage } from './src/pages/CarListingPage';
import { CarDetailPage } from './src/pages/CarDetailPage';

export default function App() {
  // Simple routing logic (replace with your router)
  const path = window.location.pathname;
  const slug = path.split('/').pop();

  let PageComponent;
  if (path === '/' || path === '/home') {
    PageComponent = HomePage;
  } else if (path === '/cars' || path.startsWith('/cars?')) {
    PageComponent = CarListingPage;
  } else if (path.startsWith('/cars/')) {
    PageComponent = () => <CarDetailPage carSlug={slug || ''} />;
  } else {
    PageComponent = HomePage;
  }

  return (
    <TenantProvider>
      <PageComponent />
    </TenantProvider>
  );
}
```

### Step 4: Add Sample Data (Optional)

Create a seed script to add sample cars:

```sql
-- Insert sample tenant
INSERT INTO tenants (name, slug, subdomain, phone, whatsapp_number, primary_color, secondary_color, status)
VALUES ('AutoLeads Demo', 'demo', 'demo', '081234567890', '6281234567890', '#FF5722', '#000000', 'active');

-- Insert sample cars
INSERT INTO cars (
  tenant_id, display_code, public_name, slug, brand, model, year, color,
  transmission, km, price, fuel_type, key_features, photos, status
) VALUES
(1, '#A01', 'Toyota Avanza 2020 Hitam #A01', 'toyota-avanza-2020-hitam-a01',
 'Toyota', 'Avanza', 2020, 'Hitam', 'Matic', 45000, 180000000, 'Bensin',
 ARRAY['Velg Racing', 'Audio Premium', 'Camera Parkir'],
 ARRAY['https://example.com/car1.jpg'], 'available'),

(1, '#A02', 'Honda Jazz 2019 Putih #A02', 'honda-jazz-2019-putih-a02',
 'Honda', 'Jazz', 2019, 'Putih', 'Manual', 32000, 220000000, 'Bensin',
 ARRAY['Keyless', 'Sunroof', 'Paddle Shift'],
 ARRAY['https://example.com/car2.jpg'], 'available');
```

## Routing Integration

### With React Router

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TenantProvider } from './src/context/TenantContext';
import { HomePage } from './src/pages/HomePage';
import { CarListingPage } from './src/pages/CarListingPage';
import { CarDetailPage } from './src/pages/CarDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <TenantProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cars" element={<CarListingPage />} />
          <Route path="/cars/:slug" element={
            <CarDetailPage carSlug={window.location.pathname.split('/').pop() || ''} />
          } />
        </Routes>
      </TenantProvider>
    </BrowserRouter>
  );
}
```

### With Bun's Built-in Routing (Server-side)

Update `backend/index.tsx`:

```tsx
import index from '../frontend/index.html';
import { HomePage } from '../frontend/src/pages/HomePage';
import { CarListingPage } from '../frontend/src/pages/CarListingPage';
import { CarDetailPage } from '../frontend/src/pages/CarDetailPage';

const server = serve({
  routes: {
    '/': index,
    '/cars': index,
    '/cars/:slug': index,

    // API routes...
    '/api/cars': { GET: getCars },
    '/api/cars/search': { GET: searchCars },
    '/api/cars/featured': { GET: getFeaturedCars },
    '/api/cars/:slug': { GET: getCarDetail },
    '/api/tenant': { GET: getTenant },
  },
});
```

## Customization Examples

### Custom Colors

```tsx
// In your component
import { useTenantContext } from './src/context/TenantContext';

function MyComponent() {
  const { primaryColor, secondaryColor } = useTenantContext();

  return (
    <button
      style={{ backgroundColor: primaryColor }}
      className="px-4 py-2 rounded text-white"
    >
      Custom Button
    </button>
  );
}
```

### Custom Car Card Layout

```tsx
import { CarCard } from './src/components/car/CarCard';

// Override default styling
<CarCard
  car={car}
  onClick={() => handleClick(car)}
  className="hover:shadow-2xl transform hover:scale-105"
/>
```

### Custom Filters

```tsx
import { CarFilters } from './src/components/car/CarFilters';

const [filters, setFilters] = useState({
  brand: 'Toyota',
  minYear: 2018,
  transmission: 'Matic',
  sortBy: 'price_asc',
});

<CarFilters
  filters={filters}
  onFiltersChange={setFilters}
  brands={['Toyota', 'Honda', 'Daihatsu']}
  yearRange={{ min: 2015, max: 2024 }}
  priceRange={{ min: 100000000, max: 500000000 }}
/>
```

### Custom WhatsApp Message

```tsx
import { WhatsAppButton } from './src/components/car/WhatsAppButton';

<WhatsAppButton
  car={car}
  message="Custom message here"
  sticky={true}
/>
```

## Advanced Features

### Adding Loading Skeleton

```tsx
function CarLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[4/3] bg-muted rounded-xl animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
        </div>
      ))}
    </div>
  );
}
```

### Adding Image Optimization

```tsx
// In CarCard.tsx or CarGallery.tsx
<img
  src={photo}
  alt={car.publicName}
  className="w-full h-full object-cover"
  loading="lazy"
  srcSet={`
    ${photo}?w=400 400w,
    ${photo}?w=800 800w,
    ${photo}?w=1200 1200w
  `}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

### Adding Analytics Tracking

```tsx
import { useEffect } from 'react';

function CarDetailPage({ carSlug }: { carSlug: string }) {
  const { data: car } = useCarDetail(carSlug);

  useEffect(() => {
    if (car) {
      // Track page view
      gtag('event', 'page_view', {
        page_title: car.publicName,
        page_path: `/cars/${car.slug}`,
        car_id: car.id,
        car_brand: car.brand,
        car_price: car.price,
      });
    }
  }, [car]);

  // ... rest of component
}
```

### Adding Share Functionality

```tsx
// Already built into CarDetailPage
const handleShare = async () => {
  const url = window.location.href;
  const text = `Check out this ${car.publicName}`;

  if (navigator.share) {
    await navigator.share({ title: text, url });
  } else {
    await navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  }
};
```

## Performance Tips

1. **Lazy Load Images**: Already implemented with `loading="lazy"`
2. **Debounce Search**: Already implemented with `useDebounce(300)`
3. **Pagination**: Load 12 cars per page (adjustable)
4. **Cache API Responses**: Consider adding React Query
5. **Image CDN**: Use Cloudinary or similar for car photos

## Testing Checklist

- [ ] Homepage loads with featured cars
- [ ] Search autocomplete works
- [ ] Car listing filters work
- [ ] Pagination navigates correctly
- [ ] Car detail page loads
- [ ] Gallery swipe gestures work
- [ ] WhatsApp button opens with correct message
- [ ] Mobile responsive on all pages
- [ ] Touch interactions work on mobile
- [ ] Loading states display correctly
- [ ] Error states handled gracefully
- [ ] Empty states show when no results
- [ ] Tenant branding applies correctly

## Troubleshooting

### Cars Not Loading
- Check backend is running
- Verify `/api/cars` endpoint returns data
- Check browser console for errors
- Verify tenant exists in database

### Tenant Branding Not Applying
- Check `/api/tenant` endpoint returns data
- Verify TenantProvider wraps your app
- Check CSS custom properties are set

### WhatsApp Button Not Working
- Verify tenant has `whatsappNumber` in database
- Check phone number format (should start with country code)
- Test WhatsApp URL in browser

### Search Not Working
- Add `/api/cars/search` endpoint to backend
- Place it BEFORE `/:slug` route
- Verify search parameter is passed correctly

## Support

For issues or questions:
- Check the components in `frontend/src/components/`
- Review API calls in `frontend/src/api/cars.ts`
- Check backend routes in `backend/src/routes/`

Built with React 19, TypeScript, Tailwind CSS, and Bun.
