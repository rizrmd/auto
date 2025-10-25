# Premium Car Catalog UI - AutoLeads

A mobile-first, premium car catalog UI built with React 19, TypeScript, and Tailwind CSS.

## Components Created

### API Client (`src/api/`)
- **`client.ts`** - Fetch wrapper with error handling and type safety
- **`cars.ts`** - Car API endpoints (getCars, getCarDetail, searchCars, getFeaturedCars, getTenant)

### Custom Hooks (`src/hooks/`)
- **`useCars.ts`** - Fetch cars with filters and pagination
- **`useCarDetail.ts`** - Fetch single car details
- **`useTenant.ts`** - Fetch tenant branding information
- **`useDebounce.ts`** - Debounce hook for search inputs

### Context (`src/context/`)
- **`TenantContext.tsx`** - Provides tenant branding (logo, colors) throughout the app

### Shared Components (`src/components/shared/`)
- **`SearchBar.tsx`** - Premium search with autocomplete dropdown
- **`Pagination.tsx`** - Pagination controls with page numbers
- **`EmptyState.tsx`** - No results/empty state component

### Car Components (`src/components/car/`)
- **`CarCard.tsx`** - Premium car thumbnail card with image, specs, and badges
- **`CarGrid.tsx`** - Responsive grid layout for car cards
- **`CarGallery.tsx`** - Swipeable photo gallery with thumbnails and fullscreen mode
- **`CarSpecs.tsx`** - Specifications table with icons
- **`CarFeatures.tsx`** - Key features with checkmarks and condition notes
- **`CarFilters.tsx`** - Filter sidebar/modal (brand, year, price, transmission, sort)
- **`WhatsAppButton.tsx`** - Sticky WhatsApp CTA button with pre-filled message

### Layout Components (`src/components/layout/`)
- **`Header.tsx`** - Site header with tenant logo, search, and navigation
- **`Footer.tsx`** - Site footer with contact info, location, and business hours

### Pages (`src/pages/`)
- **`HomePage.tsx`** - Landing page with hero section, features, and featured cars
- **`CarListingPage.tsx`** - Car catalog with filters and pagination
- **`CarDetailPage.tsx`** - Single car detail page with gallery and WhatsApp CTA

### Backend Routes (`backend/src/routes/`)
- **`public/cars.ts`** - Public car API routes (updated with search and featured endpoints)
- **`tenant.ts`** - Tenant information endpoints

## Design Features

### Mobile-First Design
- Optimized for 375px width and up
- Touch-friendly interactions
- Swipe gestures on gallery
- Mobile filter modal

### Premium Visual Elements
- Smooth animations and transitions
- Micro-interactions on hover
- Gradient overlays on images
- Premium typography and spacing
- Custom shadows and depth
- Status badges (Available, Sold, Booking)

### Performance Optimizations
- Lazy loading images
- Debounced search
- Skeleton loaders
- Optimized re-renders with React hooks
- Efficient pagination

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader friendly

### Tenant Branding
- Dynamic primary/secondary colors
- Custom logo support
- CSS custom properties for theming
- Brand-consistent UI elements

## Filter Options

### Available Filters
- **Brand** - Filter by car manufacturer
- **Year Range** - Min and max year
- **Price Range** - Min and max price in IDR
- **Transmission** - Manual or Automatic
- **Search** - Text search across brand, model, and display code

### Sort Options
- Newest first
- Price: Low to High
- Price: High to Low
- Lowest Mileage

## API Integration

### Response Handling
The frontend properly handles the backend's response structure:
```typescript
{
  success: boolean;
  data: any;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Error Handling
- Network errors
- 404 Not Found
- 500 Server errors
- Empty states
- Loading states

## Usage

### Basic Setup
```tsx
import { TenantProvider } from './context/TenantContext';
import { HomePage } from './pages/HomePage';

function App() {
  return (
    <TenantProvider>
      <HomePage />
    </TenantProvider>
  );
}
```

### Car Listing
```tsx
import { CarListingPage } from './pages/CarListingPage';

// Navigate to /cars
<CarListingPage />
```

### Car Detail
```tsx
import { CarDetailPage } from './pages/CarDetailPage';

// Navigate to /cars/:slug
<CarDetailPage carSlug="avanza-2020-hitam-a01" />
```

## Component Dependencies

### UI Components (Already Available)
- `Button` - From `components/ui/button`
- `Card` - From `components/ui/card`
- `Input` - From `components/ui/input`
- `Label` - From `components/ui/label`
- `Select` - From `components/ui/select`

### Icons
- Using `lucide-react` for all icons
- Consistent icon sizing (h-4 w-4, h-5 w-5)
- Proper accessibility labels

## Color System

### Dynamic Theming
The app uses CSS custom properties for dynamic theming:
```css
:root {
  --color-primary: /* from tenant.primaryColor */
  --color-secondary: /* from tenant.secondaryColor */
}
```

### Tailwind Configuration
All components use Tailwind's utility classes:
- `text-primary` - Uses tenant primary color
- `bg-primary` - Primary background
- `border-primary` - Primary border

## WhatsApp Integration

### Features
- Pre-filled message with car details
- Sticky button on mobile
- Opens in new tab
- Includes:
  - Car name and details
  - Price
  - Display code
  - Specs (year, color, transmission, km)

### Message Format
```
Halo, saya tertarik dengan mobil [Car Name]

Detail:
- Tahun: [Year]
- Warna: [Color]
- Transmisi: [Transmission]
- KM: [Mileage]
- Harga: Rp [Price]
- Kode: [Display Code]

Apakah masih tersedia?
```

## File Structure

```
auto/frontend/src/
├── api/
│   ├── client.ts
│   └── cars.ts
├── hooks/
│   ├── useCars.ts
│   ├── useCarDetail.ts
│   ├── useTenant.ts
│   └── useDebounce.ts
├── context/
│   └── TenantContext.tsx
├── components/
│   ├── shared/
│   │   ├── SearchBar.tsx
│   │   ├── Pagination.tsx
│   │   └── EmptyState.tsx
│   ├── car/
│   │   ├── CarCard.tsx
│   │   ├── CarGrid.tsx
│   │   ├── CarGallery.tsx
│   │   ├── CarSpecs.tsx
│   │   ├── CarFeatures.tsx
│   │   ├── CarFilters.tsx
│   │   └── WhatsAppButton.tsx
│   └── layout/
│       ├── Header.tsx
│       └── Footer.tsx
└── pages/
    ├── HomePage.tsx
    ├── CarListingPage.tsx
    └── CarDetailPage.tsx
```

## Backend Integration Notes

### Missing Endpoints
The backend currently has most endpoints, but you may need to add:
1. `/api/cars/search` - For autocomplete search
2. `/api/cars/featured` - For featured cars on homepage

Add these to `backend/src/routes/public/cars.ts` BEFORE the `/:slug` route.

### Tenant Route
Add tenant route to the main backend index if not already present:
```typescript
import { getTenant, getTenantById } from './src/routes/tenant';

app.get('/api/tenant', getTenant);
app.get('/api/tenant/:id', getTenantById);
```

## Next Steps

1. **Test the API endpoints** - Ensure search and featured endpoints work
2. **Add seed data** - Create sample cars in the database
3. **Test mobile responsiveness** - Verify all components work on mobile
4. **Add routing** - Integrate with React Router or your routing solution
5. **SEO optimization** - Add meta tags and structured data
6. **Image optimization** - Implement image CDN or optimization
7. **Analytics** - Add tracking for user interactions
8. **Performance monitoring** - Track Core Web Vitals

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Built for AutoLeads - Lumiku Auto project
