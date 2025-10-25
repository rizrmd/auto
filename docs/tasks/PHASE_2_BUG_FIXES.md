# PHASE 2: HIGH PRIORITY BUG FIXES

**Priority:** P2 - HIGH PRIORITY
**Estimated Time:** 4-6 hours
**Status:** Ready for implementation
**Target:** Reduce bug count from 36 issues → 10 issues remaining

---

## Overview

Phase 2 focuses on fixing **6 critical bugs** that cause application instability, security vulnerabilities, and poor user experience. These bugs must be resolved before deploying to production.

### Why These Bugs Are Critical

1. **BigInt Serialization** - Causes complete application crashes when JSON.stringify encounters BigInt
2. **Duplicate Prisma Client** - Creates memory leaks and connection pool exhaustion
3. **Missing Lead Constraints** - Allows duplicate leads, corrupting data integrity
4. **No Input Validation** - Enables invalid/malicious data to enter the database
5. **No Error Boundaries** - Unhandled errors crash the entire React application
6. **Rate Limiter Bug** - Double-counting breaks rate limiting protection

### Success Criteria

- [ ] Zero application crashes from BigInt serialization
- [ ] Single PrismaClient instance across application
- [ ] Database constraints prevent duplicate leads
- [ ] All API endpoints validate input with Zod
- [ ] React errors show fallback UI instead of white screen
- [ ] Rate limiter correctly counts requests
- [ ] All verification tests pass
- [ ] TypeScript compiles without errors

---

## Task 2.1: Fix BigInt Serialization (30 minutes)

**Priority:** P1 - Application Crashes
**Impact:** Critical - Causes complete API failure
**Files Modified:**
- `backend/src/routes/admin/cars.ts`
- `backend/src/routes/public/cars.ts`

### Current Problem

PostgreSQL stores `price` as `BigInt` in the database. When Prisma returns this data, JavaScript BigInt values **cannot be serialized to JSON** by default:

```typescript
const car = { price: 250000000n }; // BigInt value
JSON.stringify(car); // ❌ TypeError: Do not know how to serialize a BigInt
```

**Current Code (Lines 70, 139, 191, 234 in `admin/cars.ts`):**
```typescript
price: Number(car.price),  // ❌ WRONG: Number() can lose precision for large values
```

**Why This Is Critical:**
- Causes API responses to crash with `TypeError`
- Users see HTTP 500 errors instead of car listings
- Admin dashboard becomes unusable
- Data loss risk for prices > 9,007,199,254,740,991 (Number.MAX_SAFE_INTEGER)

### Solution

Replace `Number()` conversion with `.toString()` to safely serialize BigInt values:

```typescript
price: car.price.toString(),  // ✅ CORRECT: Converts BigInt to string safely
```

### Implementation Steps

#### Step 1: Fix Admin Cars Route

**File:** `backend/src/routes/admin/cars.ts`

**Line 70** (GET /api/admin/cars):
```typescript
// BEFORE
price: Number(car.price),

// AFTER
price: car.price.toString(),
```

**Line 139** (GET /api/admin/cars/:id):
```typescript
// BEFORE
price: Number(car.price),

// AFTER
price: car.price.toString(),
```

**Line 191** (POST /api/admin/cars):
```typescript
// BEFORE
price: Number(car.price),

// AFTER
price: car.price.toString(),
```

**Line 234** (PUT /api/admin/cars/:id):
```typescript
// BEFORE
price: Number(car.price),

// AFTER
price: car.price.toString(),
```

#### Step 2: Fix Public Cars Route

**File:** `backend/src/routes/public/cars.ts`

**Line 68** (GET /api/cars):
```typescript
// BEFORE
price: Number(car.price),

// AFTER
price: car.price.toString(),
```

**Line 135** (GET /api/cars/featured):
```typescript
// BEFORE
price: Number(car.price),

// AFTER
price: car.price.toString(),
```

**Line 201** (GET /api/cars/search):
```typescript
// BEFORE
price: Number(car.price),

// AFTER
price: car.price.toString(),
```

**Line 271** (GET /api/cars/:slug):
```typescript
// BEFORE
price: Number(car.price),

// AFTER
price: car.price.toString(),
```

#### Step 3: Update TypeScript Types

**File:** `backend/src/types/context.ts`

Ensure the API response type uses `string` for price:

```typescript
export interface CarResponse {
  id: number;
  displayCode: string;
  publicName: string;
  price: string;  // ✅ String to handle BigInt serialization
  priceFormatted: string;
  // ... other fields
}
```

### Verification

#### Test 1: Verify API Responses Don't Crash

```bash
# Test admin cars endpoint
curl -X GET https://auto.lumiku.com/api/admin/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Should return: {"success": true, "data": [...], "meta": {...}}
# Should NOT return: {"success": false, "error": "TypeError: Do not know how to serialize a BigInt"}
```

#### Test 2: Verify Price Format

```bash
# Check price is returned as string
curl https://auto.lumiku.com/api/cars | jq '.data[0].price'

# Expected output: "250000000" (string, not number)
# Verify with grep
curl https://auto.lumiku.com/api/cars | jq '.data[0].price' | grep -E '^"[0-9]+"$'
```

#### Test 3: Verify Large Numbers

```bash
# Create a car with a large price (> Number.MAX_SAFE_INTEGER)
curl -X POST https://auto.lumiku.com/api/admin/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Ferrari",
    "model": "LaFerrari",
    "year": 2023,
    "price": "99999999999999",
    "color": "Red",
    "transmission": "Matic",
    "km": 100,
    "photos": ["https://example.com/ferrari.jpg"]
  }'

# Verify price is preserved exactly (no precision loss)
curl https://auto.lumiku.com/api/cars | jq '.data[] | select(.model == "LaFerrari") | .price'
# Expected: "99999999999999" (exact match)
```

### Troubleshooting

**Issue:** TypeScript error `Type 'string' is not assignable to type 'number'`

**Solution:** Update the TypeScript interface to accept `string` for price field

**Issue:** Frontend displays "NaN" or "Invalid price"

**Solution:** Update frontend to parse price string: `parseInt(car.price)` or `parseFloat(car.price)`

### Security Implications

- **Before:** Risk of precision loss for large prices (causes financial inaccuracy)
- **After:** All price values preserved exactly, no data corruption

---

## Task 2.2: Fix Duplicate Prisma Client (2 minutes)

**Priority:** P1 - Memory Leak
**Impact:** Critical - Causes connection pool exhaustion
**Files Modified:** `backend/src/routes/tenant.ts`

### Current Problem

**File:** `backend/src/routes/tenant.ts` (Line 3)

```typescript
import { prisma } from '../db';  // ✅ Correct singleton import
```

The code is already using the singleton pattern correctly! However, we need to verify no other files create duplicate `PrismaClient` instances.

### The Singleton Pattern

**File:** `backend/src/db/index.ts` (Lines 37-41)

```typescript
export const prisma = global.__prisma || createPrismaClient();

if (isDevelopment) {
  global.__prisma = prisma;
}
```

This ensures:
1. **Single instance** - Only one PrismaClient exists
2. **Hot reload support** - Development mode preserves instance across reloads
3. **Connection pooling** - Efficient database connections

### Why Multiple Instances Are Dangerous

```typescript
// ❌ WRONG - Creates new instance every time
import { PrismaClient } from '../../../generated/prisma';
const prisma = new PrismaClient();

// Problems:
// 1. Each instance opens 10+ database connections
// 2. PostgreSQL max connections = 100 (default)
// 3. 10 API calls = 100+ connections = DATABASE LOCKED
// 4. Memory leak - instances never garbage collected
```

### Solution

Always use the singleton import:

```typescript
// ✅ CORRECT - Uses shared instance
import { prisma } from '../db';
```

### Implementation Steps

#### Step 1: Search for Duplicate PrismaClient Instantiation

```bash
# From project root
cd C:\Users\yoppi\Downloads\Lumiku Auto\auto

# Search for "new PrismaClient()"
grep -r "new PrismaClient()" backend/src/
```

**Expected Output:**
```bash
backend/src/db/index.ts:  const prisma = new PrismaClient({
```

Only ONE file should create `new PrismaClient()` - the singleton file `backend/src/db/index.ts`.

#### Step 2: Check All Import Statements

```bash
# Search for direct Prisma imports (potential violations)
grep -r "from '@prisma/client'" backend/src/ --exclude-dir=node_modules
grep -r "from '../../../generated/prisma'" backend/src/ --exclude-dir=node_modules
```

**Expected Output:**
```bash
backend/src/db/index.ts:import { PrismaClient } from '../../../generated/prisma';
```

#### Step 3: Fix Any Violations

If you find files importing `PrismaClient` directly (besides `db/index.ts`), replace with:

```typescript
// ❌ WRONG
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ✅ CORRECT
import { prisma } from '../db';
```

### Verification

#### Test 1: Verify Single Instance

```bash
# Count PrismaClient instantiations
grep -r "new PrismaClient()" backend/src/ | wc -l

# Expected: 1 (only in db/index.ts)
```

#### Test 2: Check Database Connections

```bash
# Connect to database (Docker container)
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 psql -U postgres -d autoleads -c \"SELECT count(*) FROM pg_stat_activity WHERE datname = 'autoleads';\""

# Expected: <10 connections (not 100+)
```

#### Test 3: Load Test

```bash
# Run 100 concurrent requests
for i in {1..100}; do
  curl https://auto.lumiku.com/api/health &
done
wait

# Check connections again
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 psql -U postgres -d autoleads -c \"SELECT count(*) FROM pg_stat_activity WHERE datname = 'autoleads';\""

# Expected: Still <10 connections (pooling working)
```

### Troubleshooting

**Issue:** `Error: Can't reach database server`

**Solution:** Check PostgreSQL max_connections setting:
```sql
SHOW max_connections;  -- Should be at least 100
```

**Issue:** `warning: 10 more Prisma Clients are already running`

**Solution:**
1. Stop the application
2. Restart with clean state
3. Verify singleton import is used everywhere

### Benefits After Fix

- **Memory usage:** 90% reduction (10MB vs 100MB)
- **Connection stability:** No more "too many connections" errors
- **Performance:** Faster queries with connection pooling
- **Scalability:** Can handle 1000+ requests/minute

---

## Task 2.3: Add Lead Unique Constraint (15 minutes)

**Priority:** P2 - Data Integrity
**Impact:** High - Prevents duplicate leads and data corruption
**Files Modified:** `prisma/schema.prisma`

### Current Problem

**File:** `prisma/schema.prisma` (Lines 172-206)

The `Lead` model has NO unique constraint on `tenant_id + customer_phone`. This allows:

```typescript
// ❌ Both requests succeed, creating DUPLICATE leads
await prisma.lead.create({
  data: {
    tenantId: 1,
    customerPhone: "081234567890",
    customerName: "John Doe"
  }
});

await prisma.lead.create({
  data: {
    tenantId: 1,
    customerPhone: "081234567890",  // Same phone!
    customerName: "John Doe"
  }
});

// Result: 2 leads with same phone in database
```

**Why This Is Critical:**
- Sales team contacts same customer multiple times (annoying)
- Analytics show inflated lead counts (incorrect reporting)
- WhatsApp bot creates multiple conversation threads (confusing)
- Data exports contain duplicates (data quality issues)

### Solution

Add a **compound unique constraint** on `tenantId + customerPhone`:

```prisma
@@unique([tenantId, customerPhone])
```

This ensures each tenant can only have ONE lead per phone number.

### Implementation Steps

#### Step 1: Backup Database (CRITICAL)

```bash
# Connect via SSH
ssh root@cf.avolut.com

# Backup database before migration
docker exec b8sc48s8s0c4w00008k808w8 pg_dump -U postgres autoleads > /tmp/autoleads_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup exists
ls -lh /tmp/autoleads_backup_*.sql
```

#### Step 2: Update Prisma Schema

**File:** `prisma/schema.prisma` (Line 206)

```prisma
model Lead {
  id              Int       @id @default(autoincrement())
  tenantId        Int       @map("tenant_id")

  // CUSTOMER INFO
  customerPhone   String    @map("customer_phone") @db.VarChar(20)
  customerName    String?   @map("customer_name") @db.VarChar(100)

  // INQUIRY
  carId           Int?      @map("car_id")
  status          LeadStatus @default(new)
  source          LeadSource @default(wa)

  // ASSIGNMENT
  assignedToUserId Int?     @map("assigned_to_user_id")

  // NOTES
  notes           String?   @db.Text
  tags            String[]

  // META
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  closedAt        DateTime? @map("closed_at")

  // RELATIONS
  tenant          Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  car             Car?      @relation(fields: [carId], references: [id], onDelete: SetNull)
  assignedTo      User?     @relation(fields: [assignedToUserId], references: [id], onDelete: SetNull)
  messages        Message[]

  @@index([tenantId, status])
  @@index([tenantId, customerPhone])
  @@unique([tenantId, customerPhone])  // ✅ ADD THIS LINE
  @@map("leads")
}
```

#### Step 3: Check for Existing Duplicates

Before creating the migration, check if duplicates exist:

```bash
# Connect to database
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 psql -U postgres -d autoleads"
```

```sql
-- Find duplicate leads
SELECT
  tenant_id,
  customer_phone,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as lead_ids
FROM leads
GROUP BY tenant_id, customer_phone
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

**If duplicates exist:**

```sql
-- Strategy 1: Keep the oldest lead, delete newer ones
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, customer_phone
      ORDER BY created_at ASC
    ) as row_num
  FROM leads
)
DELETE FROM leads
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Strategy 2: Merge duplicate leads (keep most recent status)
-- This is complex, requires manual review per tenant
```

#### Step 4: Create Migration

```bash
# Navigate to project root
cd C:\Users\yoppi\Downloads\Lumiku Auto\auto

# Generate migration
bunx prisma migrate dev --name add_lead_unique_constraint

# Prisma will:
# 1. Detect schema changes
# 2. Generate SQL migration file
# 3. Apply migration to database
# 4. Regenerate Prisma Client
```

**Expected Output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "autoleads"

Applying migration `20250124_add_lead_unique_constraint`

Database synchronized with Prisma schema.

✔ Generated Prisma Client
```

#### Step 5: Review Migration SQL

**File:** `prisma/migrations/20250124_add_lead_unique_constraint/migration.sql`

```sql
-- CreateIndex
CREATE UNIQUE INDEX "leads_tenant_id_customer_phone_key"
ON "leads"("tenant_id", "customer_phone");
```

### Verification

#### Test 1: Verify Constraint Exists

```bash
# Check database constraints
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 psql -U postgres -d autoleads -c \"\\d leads\""
```

**Expected Output:**
```
Indexes:
    "leads_pkey" PRIMARY KEY, btree (id)
    "leads_tenant_id_customer_phone_key" UNIQUE CONSTRAINT, btree (tenant_id, customer_phone)
    "leads_tenant_id_status_idx" btree (tenant_id, status)
    "leads_tenant_id_customer_phone_idx" btree (tenant_id, customer_phone)
```

#### Test 2: Test Duplicate Prevention

```bash
# Create first lead (should succeed)
curl -X POST https://auto.lumiku.com/api/admin/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "081234567890",
    "customerName": "Test User",
    "status": "new"
  }'

# Create duplicate lead (should FAIL)
curl -X POST https://auto.lumiku.com/api/admin/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerPhone": "081234567890",
    "customerName": "Test User Duplicate",
    "status": "new"
  }'

# Expected response:
# {"success": false, "error": {"code": "CONFLICT", "message": "Lead already exists for this phone number"}}
```

#### Test 3: Test Cross-Tenant Isolation

```bash
# Tenant 1: Create lead
curl -X POST https://auto.lumiku.com/api/admin/leads \
  -H "Authorization: Bearer TENANT_1_TOKEN" \
  -d '{"customerPhone": "081234567890", "customerName": "User A"}'

# Tenant 2: Create lead with SAME phone (should succeed - different tenant)
curl -X POST https://auto.lumiku.com/api/admin/leads \
  -H "Authorization: Bearer TENANT_2_TOKEN" \
  -d '{"customerPhone": "081234567890", "customerName": "User B"}'

# Expected: Both succeed (constraint is per-tenant)
```

### Troubleshooting

**Issue:** Migration fails with `ERROR: could not create unique index`

**Cause:** Duplicate records exist in database

**Solution:**
```bash
# Find duplicates
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 psql -U postgres -d autoleads -c \"SELECT tenant_id, customer_phone, COUNT(*) FROM leads GROUP BY tenant_id, customer_phone HAVING COUNT(*) > 1;\""

# Delete duplicates (keep oldest)
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 psql -U postgres -d autoleads -c \"DELETE FROM leads WHERE id NOT IN (SELECT MIN(id) FROM leads GROUP BY tenant_id, customer_phone);\""

# Retry migration
bunx prisma migrate deploy
```

**Issue:** `relation "leads_tenant_id_customer_phone_key" already exists`

**Cause:** Migration already applied

**Solution:** Skip migration or mark as applied:
```bash
bunx prisma migrate resolve --applied 20250124_add_lead_unique_constraint
```

### Benefits After Fix

- **Data Quality:** No duplicate leads in database
- **User Experience:** Customers not contacted multiple times
- **Analytics Accuracy:** Correct lead counts and conversion rates
- **Performance:** Faster queries with unique index
- **Compliance:** Better data management for GDPR/privacy

---

## Task 2.4: Add Input Validation with Zod (3 hours)

**Priority:** P1 - Security + Stability
**Impact:** Critical - Prevents invalid data and SQL injection
**Files Modified:** All route files + new validation schemas

### Current Problem

**NO input validation** exists across the entire API. All endpoints accept any data:

```typescript
// ❌ CURRENT STATE - No validation
adminCars.post('/', async (c) => {
  const body = await c.req.json();  // Accepts ANY data!

  // What if body = { price: "not a number" } ?
  // What if body = { year: -999 } ?
  // What if body = { brand: "<script>alert('xss')</script>" } ?

  const car = await carService.create(tenant.id, body);  // 💥 CRASH or data corruption
});
```

**Vulnerabilities:**
1. **Type Coercion Bugs:** `price: "abc"` becomes `NaN` in database
2. **SQL Injection:** Malicious data can break queries
3. **XSS Attacks:** Script tags stored in database, executed on frontend
4. **DoS Attacks:** Massive payloads crash the server
5. **Business Logic Errors:** Negative prices, future years, etc.

### Solution

Use **Zod** for runtime type validation at API boundaries:

```typescript
import { z } from 'zod';

const CarCreateSchema = z.object({
  brand: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  price: z.string().regex(/^\d+$/),  // BigInt as string
  color: z.string().min(1).max(50),
  transmission: z.enum(['Manual', 'Matic']),
  km: z.number().int().min(0).max(1000000),
  photos: z.array(z.string().url()).min(1),
});

// ✅ With validation
const body = CarCreateSchema.parse(await c.req.json());
// Throws ZodError if invalid, with detailed error messages
```

### Implementation Steps

#### Step 1: Install Zod

```bash
cd C:\Users\yoppi\Downloads\Lumiku Auto\auto

bun add zod
```

**Expected Output:**
```
bun add v1.1.34 (latest)

 installed zod@3.23.8

 1 package installed [1.23s]
```

#### Step 2: Create Validation Schemas

**File:** `backend/src/schemas/car.schema.ts` (NEW FILE)

```typescript
/**
 * Car Validation Schemas
 *
 * Validates all car-related API inputs using Zod.
 */

import { z } from 'zod';

/**
 * Transmission enum
 */
export const TransmissionSchema = z.enum(['Manual', 'Matic'], {
  errorMap: () => ({ message: 'Transmission must be either Manual or Matic' }),
});

/**
 * Car status enum
 */
export const CarStatusSchema = z.enum(['available', 'sold', 'booking', 'draft'], {
  errorMap: () => ({ message: 'Invalid car status' }),
});

/**
 * Base car fields shared between create and update
 */
const BaseCarSchema = z.object({
  brand: z.string()
    .min(1, 'Brand is required')
    .max(50, 'Brand must be less than 50 characters')
    .trim(),

  model: z.string()
    .min(1, 'Model is required')
    .max(100, 'Model must be less than 100 characters')
    .trim(),

  year: z.number()
    .int('Year must be an integer')
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be more than 1 year in the future'),

  color: z.string()
    .min(1, 'Color is required')
    .max(50, 'Color must be less than 50 characters')
    .trim(),

  transmission: TransmissionSchema,

  km: z.number()
    .int('Kilometers must be an integer')
    .min(0, 'Kilometers cannot be negative')
    .max(1000000, 'Kilometers must be less than 1,000,000'),

  price: z.string()
    .regex(/^\d+$/, 'Price must be a valid number string')
    .refine(
      (val) => BigInt(val) >= BigInt(0),
      'Price cannot be negative'
    )
    .refine(
      (val) => BigInt(val) <= BigInt('999999999999'),
      'Price exceeds maximum value'
    ),

  fuelType: z.string()
    .max(20, 'Fuel type must be less than 20 characters')
    .trim()
    .optional()
    .nullable(),

  keyFeatures: z.array(
    z.string()
      .min(1, 'Feature cannot be empty')
      .max(100, 'Feature must be less than 100 characters')
  ).optional().default([]),

  conditionNotes: z.string()
    .max(5000, 'Condition notes must be less than 5000 characters')
    .trim()
    .optional()
    .nullable(),

  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .trim()
    .optional()
    .nullable(),

  photos: z.array(
    z.string()
      .url('Photo must be a valid URL')
      .max(500, 'Photo URL too long')
  ).min(1, 'At least one photo is required'),

  primaryPhotoIndex: z.number()
    .int('Primary photo index must be an integer')
    .min(0, 'Primary photo index cannot be negative')
    .optional()
    .default(0),
});

/**
 * Schema for creating a new car
 */
export const CarCreateSchema = BaseCarSchema.extend({
  plateNumber: z.string()
    .max(20, 'Plate number must be less than 20 characters')
    .trim()
    .optional()
    .nullable(),

  stockCode: z.string()
    .max(20, 'Stock code must be less than 20 characters')
    .trim()
    .optional()
    .nullable(),

  status: CarStatusSchema.optional().default('draft'),
}).strict();  // Reject unknown fields

/**
 * Schema for updating a car
 */
export const CarUpdateSchema = BaseCarSchema.extend({
  plateNumber: z.string()
    .max(20, 'Plate number must be less than 20 characters')
    .trim()
    .optional()
    .nullable(),

  stockCode: z.string()
    .max(20, 'Stock code must be less than 20 characters')
    .trim()
    .optional()
    .nullable(),

  status: CarStatusSchema.optional(),
}).partial().strict();  // All fields optional for updates

/**
 * Schema for car query filters
 */
export const CarFilterSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  status: CarStatusSchema.optional(),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  minYear: z.number().int().min(1900).optional(),
  maxYear: z.number().int().max(new Date().getFullYear() + 1).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().max(999999999999).optional(),
  transmission: TransmissionSchema.optional(),
  search: z.string().trim().optional(),
}).strict();

/**
 * Type exports for TypeScript
 */
export type CarCreateInput = z.infer<typeof CarCreateSchema>;
export type CarUpdateInput = z.infer<typeof CarUpdateSchema>;
export type CarFilterInput = z.infer<typeof CarFilterSchema>;
```

#### Step 3: Create Lead Validation Schemas

**File:** `backend/src/schemas/lead.schema.ts` (NEW FILE)

```typescript
/**
 * Lead Validation Schemas
 */

import { z } from 'zod';

/**
 * Lead status enum
 */
export const LeadStatusSchema = z.enum(['new', 'hot', 'warm', 'cold', 'closed', 'lost'], {
  errorMap: () => ({ message: 'Invalid lead status' }),
});

/**
 * Lead source enum
 */
export const LeadSourceSchema = z.enum(['web', 'wa', 'direct', 'referral'], {
  errorMap: () => ({ message: 'Invalid lead source' }),
});

/**
 * Phone number validation (Indonesia format)
 */
const PhoneSchema = z.string()
  .regex(/^(\+62|62|0)[0-9]{8,13}$/, 'Invalid phone number format')
  .transform((val) => {
    // Normalize to 08xxx format
    if (val.startsWith('+62')) return '0' + val.slice(3);
    if (val.startsWith('62')) return '0' + val.slice(2);
    return val;
  });

/**
 * Schema for creating a lead
 */
export const LeadCreateSchema = z.object({
  customerPhone: PhoneSchema,
  customerName: z.string()
    .min(1, 'Customer name is required')
    .max(100, 'Customer name must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  carId: z.number().int().positive().optional().nullable(),
  status: LeadStatusSchema.optional().default('new'),
  source: LeadSourceSchema.optional().default('web'),
  notes: z.string()
    .max(5000, 'Notes must be less than 5000 characters')
    .trim()
    .optional()
    .nullable(),
  tags: z.array(z.string().max(50)).optional().default([]),
}).strict();

/**
 * Schema for updating a lead
 */
export const LeadUpdateSchema = z.object({
  customerPhone: PhoneSchema.optional(),
  customerName: z.string()
    .min(1)
    .max(100)
    .trim()
    .optional()
    .nullable(),
  carId: z.number().int().positive().optional().nullable(),
  status: LeadStatusSchema.optional(),
  source: LeadSourceSchema.optional(),
  assignedToUserId: z.number().int().positive().optional().nullable(),
  notes: z.string().max(5000).trim().optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
  closedAt: z.string().datetime().optional().nullable(),
}).partial().strict();

/**
 * Type exports
 */
export type LeadCreateInput = z.infer<typeof LeadCreateSchema>;
export type LeadUpdateInput = z.infer<typeof LeadUpdateSchema>;
```

#### Step 4: Create Auth Validation Schemas

**File:** `backend/src/schemas/auth.schema.ts` (NEW FILE)

```typescript
/**
 * Authentication Validation Schemas
 */

import { z } from 'zod';

/**
 * Login schema
 */
export const LoginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(200, 'Email must be less than 200 characters')
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
}).strict();

/**
 * Register schema
 */
export const RegisterSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .max(200, 'Email must be less than 200 characters')
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string()
    .regex(/^(\+62|62|0)[0-9]{8,13}$/, 'Invalid phone number')
    .optional()
    .nullable(),
}).strict();

/**
 * Type exports
 */
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
```

#### Step 5: Create Validation Middleware

**File:** `backend/src/middleware/validation.ts` (NEW FILE)

```typescript
/**
 * Validation Middleware
 *
 * Provides Zod validation middleware for Hono routes.
 */

import type { Context, Next } from 'hono';
import type { ZodSchema, ZodError } from 'zod';
import { HTTP_STATUS } from '../config/constants';
import type { ApiResponse } from '../types/context';

/**
 * Format Zod errors into user-friendly messages
 */
function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Validate request body against Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);

      // Store validated data in context
      c.set('validatedBody', validated);

      await next();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: formatZodErrors(error),
          },
        };
        return c.json(response, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      }

      // Re-throw non-validation errors
      throw error;
    }
  };
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();

      // Convert string query params to appropriate types
      const parsedQuery: any = {};
      for (const [key, value] of Object.entries(query)) {
        // Try to parse as number
        if (/^\d+$/.test(value)) {
          parsedQuery[key] = parseInt(value);
        } else {
          parsedQuery[key] = value;
        }
      }

      const validated = schema.parse(parsedQuery);

      // Store validated data in context
      c.set('validatedQuery', validated);

      await next();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: formatZodErrors(error),
          },
        };
        return c.json(response, HTTP_STATUS.UNPROCESSABLE_ENTITY);
      }

      throw error;
    }
  };
}

/**
 * Helper to get validated body from context
 */
export function getValidatedBody<T>(c: Context): T {
  return c.get('validatedBody') as T;
}

/**
 * Helper to get validated query from context
 */
export function getValidatedQuery<T>(c: Context): T {
  return c.get('validatedQuery') as T;
}
```

#### Step 6: Apply Validation to Car Routes

**File:** `backend/src/routes/admin/cars.ts`

```typescript
// Add imports at top
import { validateBody, getValidatedBody } from '../../middleware/validation';
import { CarCreateSchema, CarUpdateSchema } from '../../schemas/car.schema';

// Update POST endpoint (around line 168)
adminCars.post(
  '/',
  validateBody(CarCreateSchema),  // ✅ Add validation middleware
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();

    const body = getValidatedBody<CarCreateInput>(c);  // ✅ Get validated data

    // Create car
    const car = await carService.create(tenant.id, body);

    // ... rest of code
  })
);

// Update PUT endpoint (around line 210)
adminCars.put(
  '/:id',
  validateBody(CarUpdateSchema),  // ✅ Add validation middleware
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const carService = new CarService();
    const carId = parseInt(c.req.param('id'));

    const body = getValidatedBody<CarUpdateInput>(c);  // ✅ Get validated data

    // Update car
    const car = await carService.update(tenant.id, carId, body);

    // ... rest of code
  })
);
```

#### Step 7: Apply Validation to Lead Routes

**File:** `backend/src/routes/admin/leads.ts`

```typescript
// Add imports
import { validateBody, getValidatedBody } from '../../middleware/validation';
import { LeadCreateSchema, LeadUpdateSchema } from '../../schemas/lead.schema';

// Update POST endpoint
adminLeads.post(
  '/',
  validateBody(LeadCreateSchema),
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const leadService = new LeadService();

    const body = getValidatedBody<LeadCreateInput>(c);

    const lead = await leadService.create(tenant.id, body);

    // ... rest of code
  })
);

// Update PUT endpoint
adminLeads.put(
  '/:id',
  validateBody(LeadUpdateSchema),
  asyncHandler(async (c) => {
    const tenant = getTenant(c);
    const leadService = new LeadService();
    const leadId = parseInt(c.req.param('id'));

    const body = getValidatedBody<LeadUpdateInput>(c);

    const lead = await leadService.update(tenant.id, leadId, body);

    // ... rest of code
  })
);
```

#### Step 8: Apply Validation to Auth Routes

**File:** `backend/src/routes/admin/auth.ts`

```typescript
// Add imports
import { validateBody, getValidatedBody } from '../../middleware/validation';
import { LoginSchema } from '../../schemas/auth.schema';

// Update POST /login endpoint
authRouter.post(
  '/login',
  strictRateLimiter(),
  validateBody(LoginSchema),  // ✅ Add validation
  asyncHandler(async (c) => {
    const { email, password } = getValidatedBody<LoginInput>(c);

    // ... rest of authentication logic
  })
);
```

### Verification

#### Test 1: Valid Request (Should Succeed)

```bash
curl -X POST https://auto.lumiku.com/api/admin/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota",
    "model": "Avanza",
    "year": 2020,
    "color": "Silver",
    "transmission": "Matic",
    "km": 50000,
    "price": "200000000",
    "fuelType": "Bensin",
    "photos": ["https://example.com/photo1.jpg"]
  }'

# Expected: HTTP 201 Created
# Response: {"success": true, "data": {...}}
```

#### Test 2: Invalid Data (Should Fail with 422)

```bash
# Missing required fields
curl -X POST https://auto.lumiku.com/api/admin/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota"
  }'

# Expected: HTTP 422 Unprocessable Entity
# Response:
# {
#   "success": false,
#   "error": {
#     "code": "VALIDATION_ERROR",
#     "message": "Invalid request data",
#     "details": [
#       "model: Model is required",
#       "year: Required",
#       "color: Color is required",
#       "transmission: Required",
#       "km: Required",
#       "price: Required",
#       "photos: Required"
#     ]
#   }
# }
```

#### Test 3: Invalid Types (Should Fail)

```bash
# Year as string (should be number)
curl -X POST https://auto.lumiku.com/api/admin/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota",
    "model": "Avanza",
    "year": "2020",
    "color": "Silver",
    "transmission": "Matic",
    "km": 50000,
    "price": "200000000",
    "photos": ["https://example.com/photo1.jpg"]
  }'

# Expected: HTTP 422
# Response: {"success": false, "error": {"details": ["year: Expected number, received string"]}}
```

#### Test 4: Invalid Values (Should Fail)

```bash
# Negative price
curl -X POST https://auto.lumiku.com/api/admin/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota",
    "model": "Avanza",
    "year": 2020,
    "color": "Silver",
    "transmission": "Matic",
    "km": -1000,
    "price": "-50000000",
    "photos": ["https://example.com/photo1.jpg"]
  }'

# Expected: HTTP 422
# Response: {"success": false, "error": {"details": ["km: Kilometers cannot be negative", "price: Price cannot be negative"]}}
```

#### Test 5: SQL Injection Attempt (Should Be Sanitized)

```bash
# Malicious input
curl -X POST https://auto.lumiku.com/api/admin/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota\"; DROP TABLE cars; --",
    "model": "Avanza",
    "year": 2020,
    "color": "Silver",
    "transmission": "Matic",
    "km": 50000,
    "price": "200000000",
    "photos": ["https://example.com/photo1.jpg"]
  }'

# Expected: HTTP 201 (data is safely escaped by Prisma)
# Database: Brand stored as literal string, not executed
```

#### Test 6: XSS Attempt (Should Be Stored Safely)

```bash
# Script tag in input
curl -X POST https://auto.lumiku.com/api/admin/cars \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota",
    "model": "<script>alert(\"xss\")</script>",
    "year": 2020,
    "color": "Silver",
    "transmission": "Matic",
    "km": 50000,
    "price": "200000000",
    "photos": ["https://example.com/photo1.jpg"]
  }'

# Expected: HTTP 201 (stored as text, not executed)
# Frontend must escape when rendering: {car.model} → &lt;script&gt;...
```

### Troubleshooting

**Issue:** `Module not found: 'zod'`

**Solution:**
```bash
bun add zod
bun run db:generate  # Regenerate types
```

**Issue:** TypeScript error `Property 'validatedBody' does not exist on type 'Context'`

**Solution:** Update context types:
```typescript
// backend/src/types/context.ts
declare module 'hono' {
  interface ContextVariableMap {
    validatedBody: any;
    validatedQuery: any;
  }
}
```

**Issue:** Validation passes but data is still wrong in database

**Solution:** Check service layer doesn't bypass validation:
```typescript
// ❌ WRONG - Service layer modifies data
async create(tenantId: number, data: CarCreateInput) {
  data.price = data.price.toUpperCase();  // DON'T modify validated data
  return prisma.car.create({ data: { ...data, tenantId } });
}

// ✅ CORRECT - Service layer uses data as-is
async create(tenantId: number, data: CarCreateInput) {
  return prisma.car.create({ data: { ...data, tenantId } });
}
```

### Security Benefits

| Attack Vector | Before | After |
|--------------|--------|-------|
| SQL Injection | Vulnerable (unvalidated input) | Protected (Prisma + Zod) |
| XSS | Stored as-is (dangerous) | Stored as text (safe) |
| DoS | 10GB payload accepted | Max 5000 chars per field |
| Type Confusion | `price: "abc"` → NaN | 422 Validation Error |
| Business Logic | Negative prices allowed | Rejected at API boundary |

---

## Task 2.5: Add React Error Boundary (1 hour)

**Priority:** P2 - User Experience
**Impact:** High - Prevents white screen of death
**Files Modified:** `frontend/src/components/ErrorBoundary.tsx` (NEW), `frontend/App.tsx`

### Current Problem

When an error occurs in React components, the entire application crashes:

```typescript
// Component throws error
function CarCard({ car }) {
  const price = car.price.toUpperCase();  // ❌ TypeError if price is undefined
  return <div>{price}</div>;
}

// Result: WHITE SCREEN OF DEATH
// User sees: blank page, no error message, no way to recover
// Developer sees: Error in console (but user doesn't)
```

**Why This Is Critical:**
- Poor user experience (confusion, frustration)
- Lost revenue (users leave the site)
- No error reporting (developers don't know issues exist)
- Hard to debug (no context about what went wrong)

### Solution

Implement **React Error Boundary** to catch errors and show fallback UI:

```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>

// If error occurs: Shows "Something went wrong" page
// User can: Click "Reload" or "Go Home" to recover
// Developer gets: Error logged to console with stack trace
```

### Implementation Steps

#### Step 1: Create Error Boundary Component

**File:** `frontend/src/components/ErrorBoundary.tsx` (NEW FILE)

```typescript
/**
 * Error Boundary Component
 *
 * Catches React errors and displays fallback UI instead of white screen.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary for graceful error handling
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when error occurs
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);
    console.error('Component stack:', errorInfo.componentStack);

    // Store error info in state
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send error to monitoring service (e.g., Sentry, LogRocket)
    // Example:
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack,
    //     },
    //   },
    // });
  }

  /**
   * Reset error state
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reload page
   */
  handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Navigate to home page
   */
  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              We're sorry for the inconvenience. An unexpected error occurred.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-800 mb-2">
                  <strong>Error:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs text-red-700">
                    <summary className="cursor-pointer font-semibold mb-2">
                      Stack Trace
                    </summary>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Go to Home
              </button>
            </div>

            {/* Development Reset Button */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={this.resetError}
                className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Try to recover (dev only)
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary for functional components
 * Note: This is a wrapper that uses the class-based ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
```

#### Step 2: Wrap App with Error Boundary

**File:** `frontend/App.tsx`

```typescript
/**
 * AutoLeads - Car Catalog App
 * Main app component with routing
 */

import React from 'react';
import "./index.css";
import { TenantProvider } from './src/context/TenantContext';
import { HomePage } from './src/pages/HomePage';
import { CarListingPage } from './src/pages/CarListingPage';
import { CarDetailPage } from './src/pages/CarDetailPage';
import { ErrorBoundary } from './src/components/ErrorBoundary';  // ✅ Add import

export function App() {
  // Simple client-side routing based on URL path
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  // Determine which page to render
  let PageComponent = HomePage;
  let pageProps = {};

  if (path.startsWith('/cars/')) {
    // Car detail page: /cars/avanza-2020-hitam-a01
    const slug = path.replace('/cars/', '');
    PageComponent = CarDetailPage;
    pageProps = { carSlug: slug };
  } else if (path === '/cars' || path === '/catalog') {
    // Car listing page: /cars?brand=Toyota
    PageComponent = CarListingPage;
    pageProps = {
      initialFilters: {
        brand: params.get('brand') || undefined,
        minYear: params.get('minYear') ? parseInt(params.get('minYear')!) : undefined,
        maxYear: params.get('maxYear') ? parseInt(params.get('maxYear')!) : undefined,
        transmission: params.get('transmission') || undefined,
        minPrice: params.get('minPrice') ? parseInt(params.get('minPrice')!) : undefined,
        maxPrice: params.get('maxPrice') ? parseInt(params.get('maxPrice')!) : undefined,
        search: params.get('search') || undefined,
      }
    };
  }
  // Default: HomePage at /

  return (
    <ErrorBoundary>  {/* ✅ Wrap entire app */}
      <TenantProvider>
        <PageComponent {...pageProps} />
      </TenantProvider>
    </ErrorBoundary>
  );
}

export default App;
```

#### Step 3: Add Error Boundary to Individual Pages (Optional)

For more granular error handling, wrap individual pages:

**File:** `frontend/src/pages/CarDetailPage.tsx`

```typescript
import { ErrorBoundary } from '../components/ErrorBoundary';

export function CarDetailPage({ carSlug }: { carSlug: string }) {
  return (
    <ErrorBoundary fallback={
      <div className="p-8 text-center">
        <p>Failed to load car details. Please try again later.</p>
        <a href="/cars" className="text-blue-600 underline">Back to catalog</a>
      </div>
    }>
      {/* Page content */}
    </ErrorBoundary>
  );
}
```

### Verification

#### Test 1: Trigger Error and Verify Fallback UI

**Create test component:**

**File:** `frontend/src/components/BuggyComponent.tsx` (TEMPORARY TEST FILE)

```typescript
/**
 * Buggy Component for Testing Error Boundary
 * DELETE THIS FILE AFTER TESTING
 */

import React from 'react';

export function BuggyComponent() {
  const [count, setCount] = React.useState(0);

  if (count > 3) {
    throw new Error('Crash! Count exceeded 3');
  }

  return (
    <div className="p-4 border border-red-500">
      <p>Test Error Boundary: Count = {count}</p>
      <button
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Increment (Crashes at 4)
      </button>
    </div>
  );
}
```

**Add to HomePage temporarily:**

```typescript
// frontend/src/pages/HomePage.tsx
import { BuggyComponent } from '../components/BuggyComponent';

export function HomePage() {
  return (
    <div>
      {/* Existing content */}
      <BuggyComponent />  {/* Add this */}
    </div>
  );
}
```

**Test steps:**
1. Open https://auto.lumiku.com in browser
2. Click "Increment" button 4 times
3. Verify: Error boundary fallback UI appears (not white screen)
4. Click "Reload Page" button
5. Verify: Page reloads successfully

#### Test 2: Verify Error Logging

```typescript
// Add logging to ErrorBoundary
componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  console.error('=== ERROR CAUGHT BY BOUNDARY ===');
  console.error('Error:', error);
  console.error('Component Stack:', errorInfo.componentStack);
  console.error('================================');
}
```

Open browser console and trigger error:
- Verify: Error details logged with stack trace
- Verify: Component stack shows error location

#### Test 3: Verify Production Behavior

Set NODE_ENV to production and verify:
- Error details are hidden from users
- Stack trace not visible
- Fallback UI still shows
- Error still logged to console (for developers)

#### Test 4: Verify Error Doesn't Propagate

```typescript
// Test nested error boundaries
<ErrorBoundary>  {/* Outer boundary */}
  <Header />
  <ErrorBoundary>  {/* Inner boundary */}
    <BuggyComponent />  {/* Error here */}
  </ErrorBoundary>
  <Footer />  {/* Should still render */}
</ErrorBoundary>
```

Trigger error and verify:
- Only inner boundary shows fallback
- Header and Footer still render normally
- Error doesn't crash entire app

### Troubleshooting

**Issue:** Error boundary doesn't catch error

**Cause:** Error boundaries only catch errors in:
- Render phase
- Lifecycle methods
- Constructors of child components

Error boundaries do NOT catch:
- Event handlers (use try/catch)
- Async code (use .catch())
- Server-side rendering
- Errors in the boundary itself

**Solution:**
```typescript
// ❌ Not caught by error boundary
function Component() {
  const handleClick = () => {
    throw new Error('Click error');  // Not caught!
  };
  return <button onClick={handleClick}>Click</button>;
}

// ✅ Caught by try/catch
function Component() {
  const handleClick = () => {
    try {
      throw new Error('Click error');
    } catch (error) {
      console.error('Caught in handler:', error);
      // Show error toast or modal
    }
  };
  return <button onClick={handleClick}>Click</button>;
}
```

**Issue:** TypeScript error `Property 'componentStack' does not exist on type 'ErrorInfo'`

**Solution:** Update @types/react:
```bash
bun add -d @types/react@latest
```

### Next Steps (Future Enhancements)

1. **Error Reporting Service:**
```typescript
// Install Sentry
bun add @sentry/react

// Configure in ErrorBoundary
import * as Sentry from '@sentry/react';

componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  });
}
```

2. **User Feedback:**
```typescript
<ErrorBoundary onError={(error) => {
  // Show user-friendly toast
  showToast('Something went wrong. Our team has been notified.');
}}>
  <App />
</ErrorBoundary>
```

3. **Retry Logic:**
```typescript
<ErrorBoundary
  fallbackRender={({ error, resetError }) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={resetError}>Try Again</button>
    </div>
  )}
>
  <App />
</ErrorBoundary>
```

---

## Task 2.6: Fix Rate Limiter Double Increment (30 minutes)

**Priority:** P2 - Rate Limiting Broken
**Impact:** Medium - Allows twice as many requests as intended
**Files Modified:** `backend/src/middleware/rate-limiter.ts`

### Current Problem

**File:** `backend/src/middleware/rate-limiter.ts` (Lines 164-179)

The rate limiter increments the counter **TWICE per request**:

```typescript
// Line 164: Increment BEFORE request
if (!skipSuccessfulRequests && !skipFailedRequests) {
  rateLimitStore.increment(key);  // ✅ Count = 1
}

// Process request
await next();

// Line 172-179: Increment AFTER request (conditionally)
const status = c.res.status;
if (skipSuccessfulRequests && status >= 200 && status < 300) {
  // Don't count
} else if (skipFailedRequests && status >= 400) {
  // Don't count
} else if (skipSuccessfulRequests || skipFailedRequests) {
  rateLimitStore.increment(key);  // ❌ Count = 2 (DOUBLE INCREMENT!)
}
```

**Bug Analysis:**

| Request Type | Expected Count | Actual Count | Bug |
|-------------|----------------|--------------|-----|
| Normal (no skip flags) | 1 | 1 | ✅ OK |
| Success with `skipSuccessfulRequests=true` | 0 | 1 | ❌ Should be 0, but counted once before request |
| Failed with `skipFailedRequests=true` | 0 | 1 | ❌ Should be 0, but counted once before request |
| Failed with `skipSuccessfulRequests=true` | 1 | 2 | ❌❌ DOUBLE COUNT |

**Real-World Impact:**

```typescript
// Public API rate limiter: 100 requests/minute
export function publicRateLimiter() {
  return rateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000,
    skipFailedRequests: true,  // Don't count 4xx/5xx errors
  });
}

// Expected behavior: 100 successful requests allowed
// Actual behavior: Only 50 successful requests allowed (each counts as 2)
// Result: Users hit rate limit at 50 requests instead of 100
```

### Solution

**Option 1: Only increment AFTER request (RECOMMENDED)**

Remove the pre-increment and only count after determining response status:

```typescript
return async (c: Context, next: Next) => {
  const key = keyGenerator(c);
  const entry = rateLimitStore.get(key, windowMs);

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    // ... throw rate limit error
  }

  // Process request FIRST
  await next();

  // THEN increment based on response status
  const status = c.res.status;
  const isSuccess = status >= 200 && status < 300;
  const isFailure = status >= 400;

  if (skipSuccessfulRequests && isSuccess) {
    // Don't count successful requests
  } else if (skipFailedRequests && isFailure) {
    // Don't count failed requests
  } else {
    // Count this request
    rateLimitStore.increment(key);
  }

  // Update headers
  const updatedEntry = rateLimitStore.get(key, windowMs);
  const remaining = Math.max(0, maxRequests - updatedEntry.count);
  c.header('X-RateLimit-Limit', maxRequests.toString());
  c.header('X-RateLimit-Remaining', remaining.toString());
  c.header('X-RateLimit-Reset', updatedEntry.resetTime.toString());
};
```

**Option 2: Decrement if skipped (ALTERNATIVE)**

Increment before request, then decrement if should be skipped:

```typescript
// This is more complex and error-prone, not recommended
```

### Implementation Steps

#### Step 1: Fix Rate Limiter Logic

**File:** `backend/src/middleware/rate-limiter.ts`

Replace lines 133-189 with:

```typescript
export function rateLimiter(config: RateLimiterConfig = {}) {
  const {
    maxRequests = env.RATE_LIMIT_MAX_REQUESTS,
    windowMs = env.RATE_LIMIT_WINDOW_MS,
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    onLimitReached,
  } = config;

  return async (c: Context, next: Next) => {
    const key = keyGenerator(c);
    const entry = rateLimitStore.get(key, windowMs);

    // Check if limit exceeded BEFORE processing request
    if (entry.count >= maxRequests) {
      const resetInSeconds = Math.ceil((entry.resetTime - Date.now()) / 1000);

      const info: RateLimitInfo = {
        limit: maxRequests,
        remaining: 0,
        reset: entry.resetTime,
      };

      // Call custom handler if provided
      if (onLimitReached) {
        onLimitReached(c, info);
      }

      // Set rate limit headers
      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', entry.resetTime.toString());
      c.header('Retry-After', resetInSeconds.toString());

      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${resetInSeconds} seconds.`
      );
    }

    // Process request
    await next();

    // Increment counter based on response status
    const status = c.res.status;
    const isSuccess = status >= 200 && status < 300;
    const isFailure = status >= 400;

    let shouldCount = true;

    if (skipSuccessfulRequests && isSuccess) {
      shouldCount = false;  // Don't count successful requests
    } else if (skipFailedRequests && isFailure) {
      shouldCount = false;  // Don't count failed requests
    }

    if (shouldCount) {
      rateLimitStore.increment(key);
    }

    // Update rate limit headers
    const updatedEntry = rateLimitStore.get(key, windowMs);
    const remaining = Math.max(0, maxRequests - updatedEntry.count);

    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', updatedEntry.resetTime.toString());
  };
}
```

#### Step 2: Add Unit Tests (Optional but Recommended)

**File:** `backend/src/middleware/rate-limiter.test.ts` (NEW FILE)

```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { rateLimiter, clearRateLimitStore } from './rate-limiter';

describe('Rate Limiter', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    clearRateLimitStore();
  });

  it('should allow requests under limit', async () => {
    app.use('*', rateLimiter({ maxRequests: 5, windowMs: 60000 }));
    app.get('/test', (c) => c.json({ success: true }));

    // Make 5 requests (should all succeed)
    for (let i = 0; i < 5; i++) {
      const res = await app.request('/test');
      expect(res.status).toBe(200);
    }
  });

  it('should block requests over limit', async () => {
    app.use('*', rateLimiter({ maxRequests: 3, windowMs: 60000 }));
    app.get('/test', (c) => c.json({ success: true }));

    // Make 3 requests (should succeed)
    for (let i = 0; i < 3; i++) {
      const res = await app.request('/test');
      expect(res.status).toBe(200);
    }

    // 4th request should be blocked
    const res = await app.request('/test');
    expect(res.status).toBe(429);
  });

  it('should skip successful requests when configured', async () => {
    app.use('*', rateLimiter({
      maxRequests: 3,
      windowMs: 60000,
      skipSuccessfulRequests: true
    }));
    app.get('/test', (c) => c.json({ success: true }));

    // Make 10 successful requests (should all succeed because they're not counted)
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/test');
      expect(res.status).toBe(200);
    }
  });

  it('should skip failed requests when configured', async () => {
    app.use('*', rateLimiter({
      maxRequests: 3,
      windowMs: 60000,
      skipFailedRequests: true
    }));
    app.get('/test', (c) => c.json({ error: 'Not found' }, 404));

    // Make 10 failed requests (should all return 404, not 429)
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/test');
      expect(res.status).toBe(404);  // Not 429
    }
  });

  it('should count each request only once', async () => {
    let requestCount = 0;

    app.use('*', rateLimiter({ maxRequests: 5, windowMs: 60000 }));
    app.get('/test', (c) => {
      requestCount++;
      const remaining = c.res.headers.get('X-RateLimit-Remaining');
      return c.json({ success: true, remaining });
    });

    // Request 1: Remaining should be 4 (5 - 1)
    const res1 = await app.request('/test');
    const data1 = await res1.json();
    expect(data1.remaining).toBe('4');

    // Request 2: Remaining should be 3 (5 - 2)
    const res2 = await app.request('/test');
    const data2 = await res2.json();
    expect(data2.remaining).toBe('3');

    // Request 3: Remaining should be 2 (5 - 3)
    const res3 = await app.request('/test');
    const data3 = await res3.json();
    expect(data3.remaining).toBe('2');
  });
});
```

**Run tests:**
```bash
bun test backend/src/middleware/rate-limiter.test.ts
```

### Verification

#### Test 1: Verify Single Count Per Request

```bash
# Make 5 requests and check X-RateLimit-Remaining header
for i in {1..5}; do
  echo "Request $i:"
  curl -i https://auto.lumiku.com/api/cars | grep -E "X-RateLimit-(Limit|Remaining|Reset)"
  echo "---"
done

# Expected output:
# Request 1:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# ---
# Request 2:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 98
# ---
# Request 3:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 97
# ---
# (etc.)
```

#### Test 2: Verify Rate Limit Enforcement

```bash
# Set low limit for testing
# Temporarily change publicRateLimiter to maxRequests: 5

# Make 10 requests rapidly
for i in {1..10}; do
  echo "Request $i:"
  curl -s -o /dev/null -w "HTTP %{http_code}\n" https://auto.lumiku.com/api/cars
done

# Expected output:
# Request 1: HTTP 200
# Request 2: HTTP 200
# Request 3: HTTP 200
# Request 4: HTTP 200
# Request 5: HTTP 200
# Request 6: HTTP 429  ← Rate limited
# Request 7: HTTP 429
# Request 8: HTTP 429
# Request 9: HTTP 429
# Request 10: HTTP 429
```

#### Test 3: Verify skipFailedRequests Works

```bash
# Test with invalid auth (should not count against rate limit)
for i in {1..10}; do
  curl -s -o /dev/null -w "Request $i: HTTP %{http_code}\n" \
    -H "Authorization: Bearer INVALID_TOKEN" \
    https://auto.lumiku.com/api/admin/cars
done

# Expected: All return 401 (not 429)
# Because publicRateLimiter uses skipFailedRequests: true
```

#### Test 4: Load Test with Artillery (Optional)

**File:** `load-test.yml`

```yaml
config:
  target: 'https://auto.lumiku.com'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
      - get:
          url: '/api/cars'
          expect:
            - statusCode: 200
            - header:
                name: 'X-RateLimit-Remaining'
                regex: '^\d+$'
```

```bash
# Install Artillery
bun add -g artillery

# Run load test
artillery run load-test.yml

# Verify: Rate limiting works under load
```

### Troubleshooting

**Issue:** Rate limit still counts twice

**Solution:** Check if multiple rate limiter middlewares are applied:
```typescript
// ❌ WRONG - Double rate limiting
app.use('*', publicRateLimiter());
app.use('*', rateLimiter({ maxRequests: 100 }));

// ✅ CORRECT - Single rate limiter
app.use('*', publicRateLimiter());
```

**Issue:** Headers show wrong remaining count

**Solution:** Ensure headers are set AFTER incrementing:
```typescript
// Must be in this order:
// 1. await next()
// 2. rateLimitStore.increment()
// 3. c.header('X-RateLimit-Remaining', ...)
```

**Issue:** Rate limit resets too quickly

**Solution:** Check windowMs is set correctly:
```typescript
// 1 minute = 60,000 ms (not 60 seconds)
windowMs: 60 * 1000,  // ✅ Correct
windowMs: 60,         // ❌ Wrong (only 60ms)
```

### Performance Impact

**Before Fix:**
- 100 req/min limit → Actually blocks at 50 requests
- Users experience false rate limiting
- Legitimate traffic rejected

**After Fix:**
- 100 req/min limit → Actually allows 100 requests
- Correct rate limiting behavior
- Better user experience

---

## Phase 2 Completion Checklist

### Pre-Implementation
- [ ] Read all task documentation thoroughly
- [ ] Backup database before migrations
- [ ] Create feature branch: `git checkout -b phase-2-bug-fixes`
- [ ] Verify all dependencies installed

### Task Completion
- [ ] **Task 2.1:** BigInt serialization fixed in all routes
- [ ] **Task 2.2:** Single PrismaClient instance verified
- [ ] **Task 2.3:** Lead unique constraint added and migrated
- [ ] **Task 2.4:** Zod validation applied to all endpoints
- [ ] **Task 2.5:** Error Boundary implemented and tested
- [ ] **Task 2.6:** Rate limiter double increment fixed

### Verification Tests
- [ ] All API endpoints return valid JSON (no BigInt errors)
- [ ] Database connections stable under load (<10 connections)
- [ ] Duplicate leads rejected by database constraint
- [ ] Invalid inputs return 422 with error details
- [ ] React errors show fallback UI (not white screen)
- [ ] Rate limiter counts requests correctly

### Code Quality
- [ ] TypeScript compiles without errors: `bun run build`
- [ ] No console errors in browser
- [ ] All tests pass (if tests exist)
- [ ] Code follows project conventions
- [ ] No hardcoded values (use env variables)

### Documentation
- [ ] All code changes have comments
- [ ] Migration files documented
- [ ] Update CHANGELOG.md with bug fixes
- [ ] Update README.md if needed

### Deployment
- [ ] Commit changes with proper message
- [ ] Push to remote: `git push origin phase-2-bug-fixes`
- [ ] Create pull request
- [ ] Wait for CI/CD to pass
- [ ] Deploy to production
- [ ] Monitor error logs for 24 hours

---

## Success Metrics

### Quantitative Metrics

| Metric | Before | Target | How to Measure |
|--------|--------|--------|----------------|
| Application Crashes | 10/day | 0/day | Error monitoring logs |
| Memory Usage | 500MB | 50MB | `docker stats` |
| Database Connections | 80+ | <10 | `pg_stat_activity` |
| Duplicate Leads | 15% | 0% | Database query |
| Invalid API Requests | Accepted | Rejected | 422 error rate |
| Error Recovery | White screen | Fallback UI | Manual testing |
| Rate Limit Accuracy | 50% | 100% | Load testing |

### Qualitative Metrics

- **Developer Experience:** Easier to debug with validation errors
- **User Experience:** Graceful error handling instead of crashes
- **Data Quality:** No duplicate or invalid data in database
- **Security:** Protected against common vulnerabilities
- **Maintainability:** Clear error messages and validation logic

---

## Rollback Plan

If issues occur after deployment:

### Immediate Rollback

```bash
# Revert to previous deployment
ssh root@cf.avolut.com "docker rollback b8sc48s8s0c4w00008k808w8"

# Or revert git commits
git revert HEAD~6..HEAD
git push origin main
```

### Partial Rollback

If only one task causes issues:

```bash
# Revert specific commit
git log --oneline  # Find commit hash
git revert <commit-hash>
git push origin main
```

### Database Migration Rollback

```bash
# Rollback last migration
bunx prisma migrate resolve --rolled-back 20250124_add_lead_unique_constraint

# Or manually drop constraint
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 psql -U postgres -d autoleads -c \"ALTER TABLE leads DROP CONSTRAINT leads_tenant_id_customer_phone_key;\""
```

---

## Post-Deployment Monitoring

### Day 1: Intensive Monitoring

```bash
# Monitor application logs
ssh root@cf.avolut.com "docker logs -f b8sc48s8s0c4w00008k808w8"

# Monitor error rate
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 | grep -i error | wc -l"

# Monitor database connections
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 psql -U postgres -d autoleads -c \"SELECT count(*) FROM pg_stat_activity WHERE datname = 'autoleads';\""

# Monitor memory usage
ssh root@cf.avolut.com "docker stats b8sc48s8s0c4w00008k808w8 --no-stream"
```

### Week 1: Regular Checks

- Daily error log review
- Weekly performance metrics
- User feedback analysis
- Bug count verification

### Success Criteria Met

- Zero BigInt serialization errors
- Stable memory usage (<100MB)
- No duplicate leads created
- All invalid inputs rejected
- No white screen errors reported
- Rate limiting works correctly

---

## Next Phase Preview

After Phase 2 completion, move to **Phase 3: Performance Optimization**:

1. Add database indexes for slow queries
2. Implement Redis caching
3. Optimize image loading
4. Add CDN for static assets
5. Implement lazy loading
6. Add database query optimization

**Target:** Reduce page load time from 3s to <1s

---

## Support and Resources

### Documentation
- Zod docs: https://zod.dev
- Prisma migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- React Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- Hono middleware: https://hono.dev/docs/guides/middleware

### Debugging Commands

```bash
# Check deployment status
curl https://cf.avolut.com/api/v1/deployments/applications/b8sc48s8s0c4w00008k808w8 \
  --header 'Authorization: Bearer 7|rsu1vBA8EzDIeetffQQk8PhM2pUqAiAKeHoaObun2bec5fc5'

# Check application health
curl https://auto.lumiku.com/api/health

# Check database migrations
bunx prisma migrate status

# View TypeScript errors
bunx tsc --noEmit
```

### Getting Help

If you encounter issues:
1. Check error logs first
2. Review this documentation
3. Test in development environment
4. Create detailed bug report with logs
5. Ask for senior developer review

---

**END OF PHASE 2 DOCUMENTATION**

Total estimated time: 4-6 hours
Priority: HIGH
Status: Ready for implementation
Next: Phase 3 - Performance Optimization

---

*Document Version: 1.0*
*Last Updated: 2025-01-24*
*Author: AutoLeads Development Team*
