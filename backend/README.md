# AutoLeads Backend

Multi-tenant car dealership management system with WhatsApp integration.

## Architecture Overview

```
auto/backend/
├── index.tsx                 # Main server entry point
└── src/
    ├── config/              # Configuration
    │   ├── env.ts          # Environment variables with validation
    │   └── constants.ts    # Application constants
    │
    ├── middleware/          # Middleware layer
    │   ├── tenant.ts       # Tenant identification by domain/subdomain
    │   ├── auth.ts         # JWT authentication
    │   ├── error-handler.ts # Global error handling
    │   └── rate-limiter.ts # Rate limiting
    │
    ├── db/                  # Database layer
    │   └── index.ts        # Prisma client singleton
    │
    ├── services/            # Business logic layer
    │   ├── tenant.service.ts   # Tenant lookup & caching
    │   ├── car.service.ts      # Car CRUD with tenant scoping
    │   ├── lead.service.ts     # Lead management
    │   └── auth.service.ts     # JWT generation/verification
    │
    ├── routes/              # API routes
    │   ├── health.ts       # Health check endpoint
    │   ├── public/
    │   │   └── cars.ts     # Public car listing API
    │   ├── webhook/
    │   │   └── fonnte.ts   # WhatsApp webhook handler
    │   └── admin/
    │       ├── auth.ts     # Admin authentication
    │       ├── cars.ts     # Car CRUD operations
    │       └── leads.ts    # Lead management
    │
    ├── utils/               # Utility functions
    │   ├── slug-generator.ts   # SEO slug generation
    │   └── price-formatter.ts  # Price formatting utilities
    │
    └── types/               # TypeScript types
        └── context.ts      # Request context & API types
```

## Technology Stack

- **Runtime**: Bun
- **Framework**: Hono (lightweight, fast web framework)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Bun.password for bcrypt hashing
- **Language**: TypeScript

## Key Features

### 1. Multi-Tenancy
- **Domain-based tenant identification**: Each dealership has a unique subdomain or custom domain
- **Tenant isolation**: All database queries are automatically scoped to the tenant
- **Tenant caching**: Reduces database queries for tenant lookups

### 2. Authentication & Authorization
- **JWT-based authentication**: Secure token-based auth for admin routes
- **Role-based access control**: Owner, Admin, and Sales roles
- **Rate limiting**: Protects against brute force attacks

### 3. Car Inventory Management
- **CRUD operations**: Full create, read, update, delete for car listings
- **SEO-friendly slugs**: Automatic generation of URL-safe slugs
- **Status tracking**: Draft, Available, Booking, Sold
- **Rich metadata**: Photos, features, specs, condition notes

### 4. Lead Management
- **Customer tracking**: Phone-based customer identification
- **Lead lifecycle**: New → Hot → Warm → Cold → Closed/Lost
- **Assignment**: Assign leads to sales team members
- **Message history**: Full conversation tracking

### 5. WhatsApp Integration
- **Webhook handling**: Receives messages from Fonnte API
- **Automatic lead creation**: Creates leads from WhatsApp conversations
- **Message persistence**: Stores all conversations in database

## API Endpoints

### Public API

#### GET /api/cars
List all available cars for the current tenant.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `brand` (optional): Filter by brand
- `model` (optional): Filter by model (partial match)
- `minYear`, `maxYear` (optional): Year range filter
- `minPrice`, `maxPrice` (optional): Price range filter
- `transmission` (optional): Manual or Matic
- `search` (optional): Search across multiple fields

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "displayCode": "A01",
      "publicName": "Toyota Avanza 2020 Hitam A01",
      "slug": "toyota-avanza-2020-hitam-a01",
      "brand": "Toyota",
      "model": "Avanza",
      "year": 2020,
      "color": "Hitam",
      "transmission": "Manual",
      "km": 50000,
      "price": 150000000,
      "priceFormatted": "Rp 150.000.000",
      "priceFormattedShort": "Rp 150 Jt",
      "photos": ["url1.jpg", "url2.jpg"],
      "primaryPhoto": "url1.jpg"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### GET /api/cars/:slug
Get detailed information about a specific car.

### Admin API (Requires Authentication)

#### POST /api/admin/auth/login
Authenticate and get JWT token.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "owner"
    },
    "tenant": {
      "id": 1,
      "name": "My Dealership",
      "slug": "my-dealership"
    }
  }
}
```

#### GET /api/admin/cars
List all cars (including drafts and sold).

**Headers:**
- `Authorization: Bearer <token>`

#### POST /api/admin/cars
Create a new car listing.

**Request:**
```json
{
  "brand": "Toyota",
  "model": "Avanza",
  "year": 2020,
  "color": "Hitam",
  "transmission": "Manual",
  "km": 50000,
  "price": 150000000,
  "displayCode": "A01",
  "photos": ["url1.jpg", "url2.jpg"],
  "keyFeatures": ["Velg Racing", "Audio Premium"],
  "description": "Mobil terawat, siap pakai",
  "status": "available"
}
```

#### PUT /api/admin/cars/:id
Update a car listing.

#### DELETE /api/admin/cars/:id
Delete a car listing.

#### GET /api/admin/leads
List all leads with filters.

**Query Parameters:**
- `status`: new, hot, warm, cold, closed, lost
- `source`: web, wa, direct, referral
- `carId`: Filter by specific car
- `assignedTo`: Filter by assigned user
- `search`: Search in phone, name, notes

#### GET /api/admin/leads/:id
Get lead details with message history.

#### PUT /api/admin/leads/:id
Update lead information.

#### PUT /api/admin/leads/:id/assign
Assign lead to a user.

#### PUT /api/admin/leads/:id/status
Update lead status.

### Webhooks

#### POST /webhook/fonnte
Receive WhatsApp messages from Fonnte.

**Payload:**
```json
{
  "device": "6281234567890",
  "sender": "6289876543210",
  "message": "Halo, mau tanya mobil A01",
  "pushname": "Customer Name",
  "timestamp": 1234567890,
  "type": "text"
}
```

### Health Check

#### GET /health
Check system health and database connectivity.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T10:30:00Z",
  "uptime": 12345.67,
  "database": {
    "connected": true,
    "responseTime": 15
  },
  "version": "1.0.0"
}
```

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/autoleads"

# JWT Authentication
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Fonnte WhatsApp Integration (optional)
FONNTE_API_KEY=""
FONNTE_WEBHOOK_SECRET=""

# Rate Limiting (optional)
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Cache TTL (optional)
CACHE_TTL_SECONDS=300
```

## Development

### Install Dependencies
```bash
bun install
```

### Generate Prisma Client
```bash
bun run db:generate
```

### Run Migrations
```bash
bun run db:migrate
```

### Start Development Server
```bash
bun run dev
```

The server will start at `http://localhost:3000` with hot reloading enabled.

## Production

### Start Production Server
```bash
bun run start
```

## Database Schema

The application uses the following main models:

- **Tenant**: Showroom/dealership (multi-tenant isolation)
- **Car**: Vehicle inventory with SEO-optimized slugs
- **Lead**: Customer inquiries and tracking
- **User**: Admin and sales team members
- **Message**: WhatsApp conversation history
- **ConversationState**: Bot state machine for WhatsApp flows

All models include tenant isolation - every query automatically filters by `tenantId`.

## Security Features

1. **Tenant Isolation**: All database queries are scoped to tenant
2. **JWT Authentication**: Secure token-based authentication
3. **Rate Limiting**: Prevents API abuse
4. **Input Validation**: Comprehensive validation on all inputs
5. **Error Handling**: Sanitized error messages (no stack traces in production)
6. **Password Hashing**: Bcrypt hashing via Bun.password
7. **CORS Configuration**: Controlled cross-origin access

## Performance Optimizations

1. **Tenant Caching**: In-memory cache for tenant lookups (5-minute TTL)
2. **Database Indexing**: Optimized indexes on frequently queried fields
3. **Pagination**: All list endpoints support pagination
4. **Selective Field Loading**: Only necessary fields are queried
5. **Connection Pooling**: Prisma connection pooling

## Error Handling

All errors return a standardized JSON format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: Authentication required or failed
- `FORBIDDEN`: Access denied
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Duplicate resource
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Middleware Stack

Request flow:
1. **CORS**: Enable cross-origin requests
2. **Logger**: Log requests (development only)
3. **Request ID**: Add unique request identifier
4. **Tenant Middleware**: Identify tenant from domain
5. **Auth Middleware**: Verify JWT token (admin routes only)
6. **Rate Limiter**: Enforce rate limits
7. **Route Handler**: Process request
8. **Error Handler**: Catch and format errors

## Best Practices

1. **Always filter by tenantId**: Never query without tenant scope
2. **Use services**: Business logic belongs in service layer
3. **Validate inputs**: Use ValidationError for user input errors
4. **Handle errors**: Wrap async handlers with asyncHandler
5. **Use typed responses**: Utilize ApiResponse interface
6. **Cache tenant lookups**: Reduce database load
7. **Log appropriately**: Different log levels for dev/prod

## Testing

The backend can be tested using:
- Health check: `curl http://localhost:3000/health`
- API info: `curl http://localhost:3000/api`
- Cars API: `curl http://localhost:3000/api/cars`

For authenticated endpoints, include JWT token:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/cars
```

## Monitoring

Key metrics to monitor:
- Request rate and latency
- Error rate by endpoint
- Database query performance
- Tenant cache hit rate
- Rate limit violations
- Authentication failures

## Future Enhancements

- [ ] Redis caching for improved performance
- [ ] Background job processing (e.g., image optimization)
- [ ] Email notifications
- [ ] SMS integration
- [ ] Analytics and reporting
- [ ] File upload handling
- [ ] WebSocket support for real-time updates
- [ ] API versioning
- [ ] OpenAPI/Swagger documentation
- [ ] Comprehensive test suite
