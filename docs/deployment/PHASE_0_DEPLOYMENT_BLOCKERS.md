# PHASE 0: DEPLOYMENT BLOCKERS

**Priority:** P0 - CRITICAL
**Estimated Time:** 3-4 hours
**Status:** ❌ MUST COMPLETE BEFORE DEPLOY

---

## Overview

Phase 0 addresses 8 critical issues that will prevent the application from starting or functioning. These are **deployment blockers** - the application CANNOT be deployed until all 8 are resolved.

**Dependencies:** None - can start immediately
**Blocks:** All other phases

---

## Task 0.1: Create Database Migrations

**Priority:** P0 (Highest)
**Time:** 30 minutes
**Files:** `prisma/migrations/` (currently DOES NOT EXIST)

### Problem
- No migrations directory exists
- `start.sh` runs `prisma migrate deploy` but there are no migrations
- Application will crash with "relation does not exist" errors
- Database tables will NOT be created

### Solution
```bash
cd C:\Users\yoppi\Downloads\Lumiku Auto\auto
bunx prisma migrate dev --name init_autoleads_platform
```

This will:
1. Create `prisma/migrations/` directory
2. Generate initial migration SQL from schema.prisma
3. Apply migration to local database
4. Generate Prisma client types

### Verification
```bash
# Check migration files created
ls C:\Users\yoppi\Downloads\Lumiku Auto\auto\prisma\migrations

# Should see:
# migrations/
#   └── 20250124XXXXXX_init_autoleads_platform/
#       └── migration.sql

# Verify migration SQL contains CREATE TABLE statements
cat C:\Users\yoppi\Downloads\Lumiku Auto\auto\prisma\migrations\*/migration.sql | grep "CREATE TABLE"
```

### Commit
```bash
git add prisma/migrations/
git commit -m "feat: add initial database migrations"
```

**Dependencies:** None
**Blocks:** Application startup

---

## Task 0.2: Add Image Serving Route

**Priority:** P0 (Highest)
**Time:** 1 hour
**Files:** `C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\index.tsx`

### Problem
- Backend has NO route to serve files from `/uploads` directory
- Frontend requests `/uploads/tenant-1/car-123.jpg`
- Backend catchall route returns `index.html` instead of image
- Result: ALL car images show as broken

### Solution
Add this code to `backend/index.tsx` at **line 105** (BEFORE the wildcard route at line 106):

```typescript
// ========================================
// IMAGE SERVING - Must be BEFORE wildcard
// ========================================
app.get('/uploads/*', async (c) => {
  const requestPath = c.req.path.replace('/uploads/', '');
  const filepath = `./uploads/${requestPath}`;

  // Security: Prevent path traversal attacks
  const normalizedPath = path.normalize(filepath);
  if (!normalizedPath.startsWith('./uploads/')) {
    console.error('[SECURITY] Path traversal attempt blocked:', requestPath);
    return c.text('Forbidden', 403);
  }

  try {
    // Check if file exists
    const file = Bun.file(filepath);
    if (!(await file.exists())) {
      console.error('[IMAGE] File not found:', filepath);
      return c.notFound();
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    const ext = filepath.split('.').pop()?.toLowerCase() || '';

    // Determine MIME type
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      svg: 'image/svg+xml',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Return image with proper headers
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[IMAGE] Error serving file:', error);
    return c.text('Internal Server Error', 500);
  }
});
```

### Also add import at top of file
```typescript
import path from 'node:path';
```

### Verification
```bash
# 1. Create test image
mkdir -p C:\Users\yoppi\Downloads\Lumiku\ Auto\auto\uploads\tenant-1
echo "test" > C:\Users\yoppi\Downloads\Lumiku\ Auto\auto\uploads\tenant-1\test.jpg

# 2. Start server
cd C:\Users\yoppi\Downloads\Lumiku\ Auto\auto
bun run dev

# 3. Test endpoint (in another terminal)
curl -I http://localhost:3000/uploads/tenant-1/test.jpg

# Expected response:
# HTTP/1.1 200 OK
# Content-Type: image/jpeg
# Cache-Control: public, max-age=86400
```

### Route Order is Critical
The `/uploads/*` route MUST come BEFORE the wildcard `/*` route. If wildcard is first, it will catch all requests.

**Current line 106:**
```typescript
app.get('/*', serveStatic({ root: './frontend/dist' }))
```

**Correct order:**
```typescript
// Line 105: /uploads/* (NEW)
// Line 106: /*          (EXISTING)
```

**Dependencies:** None
**Blocks:** Car catalog images

---

## Task 0.3: Fix Production Migrations Logic

**Priority:** P0 (Critical)
**Time:** 2 minutes
**Files:** `C:\Users\yoppi\Downloads\Lumiku Auto\auto\start.sh`

### Problem
```bash
# Line 44 - WRONG LOGIC
if [ "$NODE_ENV" != "production" ]; then
    bunx prisma migrate deploy
fi
```

This means migrations ONLY run in development, NOT in production!

### Solution
Change line 44 from:
```bash
if [ "$NODE_ENV" != "production" ]; then
```

To:
```bash
if [ "$NODE_ENV" = "production" ]; then
```

### Full corrected section (lines 42-48):
```bash
# Run database migrations in production
if [ "$NODE_ENV" = "production" ]; then
    echo "✓ Running production database migrations..."
    bunx prisma migrate deploy || {
        echo "❌ Migration failed!"
        exit 1
    }
fi
```

### Verification
```bash
# Check the file
cat C:\Users\yoppi\Downloads\Lumiku\ Auto\auto\start.sh | grep -A 5 "Run database migrations"

# Should show:
# if [ "$NODE_ENV" = "production" ]; then
```

**Dependencies:** Task 0.1 (migrations must exist)
**Blocks:** Production deployment

---

## Task 0.4: Configure Docker Volume

**Priority:** P0 (Critical)
**Time:** 15 minutes
**Files:**
- `C:\Users\yoppi\Downloads\Lumiku Auto\auto\Dockerfile`
- Coolify configuration

### Problem
- Images saved to `./uploads/` are stored in container filesystem
- Container restart → filesystem reset → **ALL IMAGES DELETED**
- Database still references deleted image URLs
- Result: Broken images after every deploy/restart

### Solution Part 1: Update Dockerfile

Add these lines after `WORKDIR /app` (around line 6):

```dockerfile
# Create uploads directory and declare as volume
RUN mkdir -p /app/uploads && chmod 755 /app/uploads
VOLUME ["/app/uploads"]
```

### Full Dockerfile context:
```dockerfile
FROM oven/bun:latest

WORKDIR /app

# Add these 2 lines:
RUN mkdir -p /app/uploads && chmod 755 /app/uploads
VOLUME ["/app/uploads"]

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
# ... rest of Dockerfile
```

### Solution Part 2: Configure Coolify Volume

In Coolify dashboard:
1. Open AutoLeads application
2. Go to "Volumes" tab
3. Add new volume:
   - **Name:** `autoleads-uploads`
   - **Host Path:** `/var/lib/coolify/volumes/autoleads-uploads`
   - **Container Path:** `/app/uploads`
   - **Read Only:** NO (unchecked)
4. Save configuration

### Verification After Deployment
```bash
# 1. SSH into server
ssh root@cf.avolut.com

# 2. Upload test image
docker exec <container-id> sh -c "echo 'test' > /app/uploads/test.txt"

# 3. Verify file exists on host
ls /var/lib/coolify/volumes/autoleads-uploads/test.txt

# 4. Restart container
docker restart <container-id>

# 5. Verify file still exists
docker exec <container-id> cat /app/uploads/test.txt

# Should output: test
```

**Dependencies:** None
**Blocks:** Image persistence

---

## Task 0.5: Register /api/tenant Route

**Priority:** P0 (Critical)
**Time:** 30 minutes
**Files:**
- `C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\routes\tenant.ts`
- `C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\index.tsx`

### Problem
- Frontend calls `GET /api/tenant` to load branding
- Backend has `tenant.ts` file but it's NOT registered in main app
- Response: 404
- Result: No logo, colors, WhatsApp number

### Solution Part 1: Refactor tenant.ts

**Replace entire contents** of `backend/src/routes/tenant.ts` with:

```typescript
import { Hono } from 'hono';
import { asyncHandler } from '../middleware/error-handler';
import { prisma } from '../db';
import { NotFoundError } from '../middleware/error-handler';

const tenantRoutes = new Hono();

// GET /api/tenant - Get tenant by domain
tenantRoutes.get('/', asyncHandler(async (c) => {
  const hostname = c.req.header('host') || '';
  const domain = hostname.split(':')[0]; // Remove port if present

  console.log('[TENANT] Looking up tenant for domain:', domain);

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { subdomain: { equals: domain, mode: 'insensitive' } },
        { customDomain: { equals: domain, mode: 'insensitive' } },
      ],
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      slug: true,
      subdomain: true,
      customDomain: true,
      logo: true,
      primaryColor: true,
      secondaryColor: true,
      phone: true,
      whatsappNumber: true,
      email: true,
      address: true,
      businessHours: true,
      description: true,
    },
  });

  if (!tenant) {
    console.error('[TENANT] Tenant not found for domain:', domain);
    throw new NotFoundError(`Tenant not found for domain: ${domain}`);
  }

  console.log('[TENANT] Found tenant:', tenant.slug);

  return c.json({
    success: true,
    data: tenant,
  });
}));

// GET /api/tenant/:id - Get tenant by ID (for admin)
tenantRoutes.get('/:id', asyncHandler(async (c) => {
  const id = parseInt(c.req.param('id'));

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      subdomain: true,
      customDomain: true,
      logo: true,
      primaryColor: true,
      secondaryColor: true,
      phone: true,
      whatsappNumber: true,
      email: true,
      address: true,
      businessHours: true,
      description: true,
      status: true,
      plan: true,
    },
  });

  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  return c.json({
    success: true,
    data: tenant,
  });
}));

export default tenantRoutes;
```

### Solution Part 2: Register Route in index.tsx

In `backend/index.tsx`, add after line 22:

```typescript
import tenantRoutes from './src/routes/tenant';
```

Then add after line 66 (BEFORE admin routes):

```typescript
// Tenant routes (public)
app.route('/api/tenant', tenantRoutes);
```

### Full context (lines 66-72):
```typescript
// API Routes
// Health check
app.route('/health', healthRoutes);

// Tenant routes (public) - ADD THIS
app.route('/api/tenant', tenantRoutes);

// Admin routes (protected)
app.route('/api/admin', adminRoutes);
```

### Verification
```bash
# 1. Start server
cd C:\Users\yoppi\Downloads\Lumiku\ Auto\auto
bun run dev

# 2. Test endpoint
curl http://localhost:3000/api/tenant \
  -H "Host: localhost"

# Expected response:
# {
#   "success": true,
#   "data": {
#     "id": 1,
#     "name": "...",
#     "logo": "...",
#     "primaryColor": "...",
#     ...
#   }
# }

# 3. Check frontend loads tenant
# Open browser: http://localhost:3000
# Open DevTools → Network → Look for /api/tenant request
# Should return 200 with tenant data
```

**Dependencies:** None
**Blocks:** Tenant branding, WhatsApp integration

---

## Task 0.6: Fix CarDetailPage Props Mismatch

**Priority:** P0 (Critical)
**Time:** 2 minutes
**Files:** `C:\Users\yoppi\Downloads\Lumiku Auto\auto\frontend\App.tsx`

### Problem
```typescript
// App.tsx line 26 - Passes "slug"
pageProps = { slug };

// CarDetailPage.tsx line 17 - Expects "carSlug"
interface CarDetailPageProps {
  carSlug: string;
}
```

When user navigates to `/cars/avanza-2020-hitam-a01`:
- `slug = "avanza-2020-hitam-a01"`
- Props passed: `{ slug: "avanza-2020-hitam-a01" }`
- Component receives: `{ carSlug: undefined }`
- Hook calls: `useCarDetail(undefined)`
- API request: `GET /api/cars/undefined`
- Result: 404 error, page fails to load

### Solution

In `frontend/App.tsx`, change line 26 from:
```typescript
pageProps = { slug };
```

To:
```typescript
pageProps = { carSlug: slug };
```

### Full context (lines 20-30):
```typescript
if (pathname.startsWith('/cars/') && slug) {
  PageComponent = CarDetailPage;
  pageProps = { carSlug: slug };  // CHANGED THIS LINE
} else if (pathname === '/cars' || pathname === '/cars/') {
  PageComponent = CarListingPage;
  pageProps = {};
} else {
  PageComponent = HomePage;
  pageProps = {};
}
```

### Verification
```bash
# 1. Start dev server
cd C:\Users\yoppi\Downloads\Lumiku\ Auto\auto
bun run dev

# 2. Open browser
# Navigate to: http://localhost:3000/cars/avanza-2020-hitam-a01

# 3. Check DevTools console
# Should NOT see error about undefined slug

# 4. Verify API call is correct
# DevTools → Network → Should see: GET /api/cars/avanza-2020-hitam-a01
# NOT: GET /api/cars/undefined
```

**Dependencies:** None
**Blocks:** Car detail page functionality

---

## Task 0.7: Add Search Autocomplete Endpoint

**Priority:** P0 (Critical)
**Time:** 20 minutes
**Files:** `C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\routes\public\cars.ts`

### Problem
- SearchBar component calls `GET /api/cars/search?search=...&limit=5`
- Endpoint doesn't exist (commented out in cars-extended.ts)
- Response: 404
- Result: Search autocomplete doesn't work

### Solution

Add this route to `backend/src/routes/public/cars.ts` at line 140 (BEFORE the `/:idOrSlug` route):

```typescript
// ========================================
// SEARCH AUTOCOMPLETE
// Must be BEFORE /:idOrSlug route
// ========================================
publicCars.get('/search', asyncHandler(async (c) => {
  const query = c.req.query('search')?.trim() || '';
  const limit = Math.min(parseInt(c.req.query('limit') || '5'), 20);

  // Return empty if query too short
  if (query.length < 2) {
    return c.json({
      success: true,
      data: { cars: [], total: 0 },
    });
  }

  console.log('[SEARCH] Autocomplete query:', query, 'limit:', limit);

  // Search in multiple fields
  const cars = await prisma.car.findMany({
    where: {
      status: 'available',
      OR: [
        { publicName: { contains: query, mode: 'insensitive' } },
        { brand: { contains: query, mode: 'insensitive' } },
        { model: { contains: query, mode: 'insensitive' } },
        { displayCode: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      displayCode: true,
      publicName: true,
      brand: true,
      model: true,
      year: true,
      price: true,
      slug: true,
      photos: true,
      primaryPhotoIndex: true,
      transmission: true,
      km: true,
    },
  });

  // Format response
  const formattedCars = cars.map(car => ({
    ...car,
    price: car.price.toString(), // Convert BigInt to string
    primaryPhoto: car.photos[car.primaryPhotoIndex] || car.photos[0] || null,
  }));

  console.log('[SEARCH] Found', formattedCars.length, 'results');

  return c.json({
    success: true,
    data: {
      cars: formattedCars,
      total: formattedCars.length,
    },
  });
}));
```

### Route Order is Critical

The `/search` route MUST come BEFORE `/:idOrSlug` route, otherwise `:idOrSlug` will match "search" as a slug.

**Correct order in cars.ts:**
```typescript
// Line 140: GET /search       (NEW - specific route)
// Line 180: GET /:idOrSlug    (EXISTING - dynamic route)
```

### Verification
```bash
# 1. Start server
cd C:\Users\yoppi\Downloads\Lumiku\ Auto\auto
bun run dev

# 2. Test search endpoint
curl "http://localhost:3000/api/cars/search?search=Toyota&limit=5"

# Expected response:
# {
#   "success": true,
#   "data": {
#     "cars": [...],
#     "total": 5
#   }
# }

# 3. Test in browser
# Type "Toyota" in search bar
# Should see dropdown with autocomplete results
```

**Dependencies:** None
**Blocks:** Search functionality

---

## Task 0.8: Create Upload Directory on Startup

**Priority:** P0 (Medium)
**Time:** 5 minutes
**Files:** `C:\Users\yoppi\Downloads\Lumiku Auto\auto\start.sh`

### Problem
Current code creates wrong directory:
```bash
mkdir -p ./uploads/cars  # Creates cars/ subdirectory (never used)
```

MediaDownloader creates: `./uploads/tenant-{id}/`

### Solution

Change lines 25-29 in `start.sh` from:
```bash
if [ ! -d "./uploads/cars" ]; then
    echo "✓ Creating uploads directory..."
    mkdir -p ./uploads/cars
    chmod 755 ./uploads
fi
```

To:
```bash
# Create uploads directory structure
if [ ! -d "./uploads" ]; then
    echo "✓ Creating uploads directory..."
    mkdir -p ./uploads
    chmod 755 ./uploads
    echo "  Directory created: ./uploads"
fi
```

### Verification
```bash
# Check start.sh
cat C:\Users\yoppi\Downloads\Lumiku\ Auto\auto\start.sh | grep -A 5 "Creating uploads directory"

# Should show:
# mkdir -p ./uploads
# chmod 755 ./uploads
```

**Dependencies:** None
**Blocks:** Image uploads

---

## Phase 0 Completion Checklist

### Before Starting
- [ ] Backup current codebase: `git commit -am "backup before Phase 0"`
- [ ] Ensure no uncommitted changes: `git status`
- [ ] Verify bun installed: `bun --version`

### Task Execution Order
1. [ ] Task 0.1: Create database migrations (30m)
2. [ ] Task 0.3: Fix production migrations logic (2m)
3. [ ] Task 0.8: Create upload directory (5m)
4. [ ] Task 0.2: Add image serving route (1h)
5. [ ] Task 0.5: Register tenant route (30m)
6. [ ] Task 0.6: Fix CarDetailPage props (2m)
7. [ ] Task 0.7: Add search endpoint (20m)
8. [ ] Task 0.4: Configure Docker volume (15m)

**Total Time:** 3h 4min

### After Completion
- [ ] All 8 tasks completed
- [ ] Code compiles: `bun run build`
- [ ] Local tests pass (see verification sections)
- [ ] Git commit: `git commit -am "feat: Phase 0 - deployment blockers fixed"`
- [ ] Ready to proceed to Phase 1

---

## Common Issues & Troubleshooting

### Issue: Prisma migration fails
```bash
# Error: Database connection failed
# Solution: Check DATABASE_URL in .env

# Error: Migration already exists
# Solution: Delete prisma/migrations/ and recreate

# Error: Permission denied
# Solution: Run with appropriate permissions
```

### Issue: Image serving returns 404
```bash
# Check route order in index.tsx
# /uploads/* MUST be before /*

# Check file exists
ls ./uploads/tenant-1/

# Check file permissions
chmod 644 ./uploads/tenant-1/*.jpg
```

### Issue: Tenant route returns 404
```bash
# Check import in index.tsx
# Check route registration
# Check database has active tenant

# Test directly:
bunx prisma studio
# Navigate to Tenant table
# Verify status = 'active'
```

---

## Dependencies Graph

```
0.1 (Migrations)
  ↓
0.3 (Fix migration logic)

0.2 (Image serving) → Independent
0.4 (Docker volume)  → Independent
0.5 (Tenant route)   → Independent
0.6 (Props fix)      → Independent
0.7 (Search)         → Independent
0.8 (Upload dir)     → Independent
```

**Parallel execution possible:** Tasks 0.2, 0.4, 0.5, 0.6, 0.7, 0.8 can run simultaneously

---

## Next Phase

After Phase 0 completion, proceed to:
- **Phase 1: Security Hardening** (6-8 hours)
  - JWT implementation
  - CORS restrictions
  - Security headers
  - Input validation

See: `PHASE_1_SECURITY_HARDENING.md`
