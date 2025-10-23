# Backend File Structure

Complete list of all backend files created for AutoLeads.

## Configuration (2 files)

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\config\env.ts
Environment variable validation with type safety. Validates DATABASE_URL, JWT_SECRET, FONNTE credentials, rate limiting, and cache configuration.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\config\constants.ts
Application-wide constants including HTTP status codes, messages, pagination defaults, car limits, cache keys, JWT config, and CORS settings.

## Type Definitions (1 file)

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\types\context.ts
TypeScript type definitions for Hono context, API responses, request/response types, JWT payload, car/lead filters, and validation errors.

## Database (1 file)

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\db\index.ts
Prisma client singleton with connection pooling, health checks, transaction helpers, and graceful shutdown.

## Utilities (2 files)

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\utils\slug-generator.ts
SEO-friendly URL slug generation from car details (brand, model, year, color, display code). Includes unique slug generation and sanitization.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\utils\price-formatter.ts
Indonesian Rupiah price formatting with short format support (Jt, M, T). Includes parsing, range formatting, and discount calculations.

## Middleware (4 files)

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\middleware\error-handler.ts
Global error handling with custom error classes (AppError, ValidationError, NotFoundError, UnauthorizedError, etc.). Maps errors to standardized JSON responses.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\middleware\rate-limiter.ts
In-memory rate limiting with configurable limits per endpoint. Includes strict limiter for login, public limiter, and tenant-based limiting.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\middleware\tenant.ts
Tenant identification by domain/subdomain with status validation. Extracts tenant from host header or X-Tenant-Domain header. Includes caching.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\middleware\auth.ts
JWT authentication with role-based access control. Includes requireOwner, requireAdmin, requireSales middleware and API key auth for webhooks.

## Services (4 files)

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\services\tenant.service.ts
Tenant lookup by domain/ID with in-memory caching. Includes tenant validation, settings management, and statistics.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\services\auth.service.ts
JWT generation/verification and password hashing using Bun.password. Handles user authentication with tenant scoping.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\services\car.service.ts
Car CRUD operations with tenant scoping. Automatic slug generation, duplicate checking, validation, and public/admin list views.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\services\lead.service.ts
Lead management with phone normalization and duplicate prevention. Includes assignment, status updates, tag management, and statistics.

## Routes (7 files)

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\routes\health.ts
Health check endpoint with database connectivity test and uptime reporting.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\routes\public\cars.ts
Public API for browsing car inventory. GET /api/cars (list) and GET /api/cars/:slug (detail). Only shows available cars.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\routes\webhook\fonnte.ts
WhatsApp webhook handler for Fonnte. Processes incoming messages, creates/updates leads, stores message history.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\routes\admin\auth.ts
Admin authentication endpoints. POST /api/admin/auth/login and POST /api/admin/auth/verify.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\routes\admin\cars.ts
Car management CRUD. GET, POST, PUT, DELETE /api/admin/cars with full admin features (drafts, sold cars, internal codes).

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\routes\admin\leads.ts
Lead management. List, detail, update, assign, status change. Includes statistics endpoint.

## Main Server (1 file)

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\index.tsx
Hono application with all routes mounted, CORS, logging, error handling, and graceful shutdown. Serves frontend for non-API routes.

## Documentation (2 files)

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\README.md
Comprehensive documentation covering architecture, API endpoints, environment variables, security features, and best practices.

### C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\STRUCTURE.md
This file - complete index of all backend files.

## Total: 19 Files

- **Config**: 2 files
- **Types**: 1 file
- **Database**: 1 file
- **Utilities**: 2 files
- **Middleware**: 4 files
- **Services**: 4 files
- **Routes**: 7 files (1 health, 1 public, 1 webhook, 3 admin)
- **Main**: 1 file
- **Docs**: 2 files

## Key Features Implemented

1. **Multi-tenancy**: Domain-based tenant identification with caching
2. **Authentication**: JWT with bcrypt password hashing
3. **Authorization**: Role-based access control (owner/admin/sales)
4. **Rate Limiting**: In-memory rate limiter with configurable limits
5. **Error Handling**: Standardized error responses with proper HTTP codes
6. **Validation**: Input validation with detailed error messages
7. **SEO**: Automatic slug generation for car listings
8. **Formatting**: Indonesian Rupiah price formatting
9. **Pagination**: All list endpoints support pagination
10. **Filtering**: Comprehensive filtering for cars and leads
11. **WhatsApp Integration**: Webhook handler for Fonnte
12. **Lead Management**: Full lead lifecycle tracking
13. **Car Inventory**: CRUD with status tracking (draft/available/sold)
14. **Message History**: Store all WhatsApp conversations
15. **Health Monitoring**: Database connectivity checks

## Architecture Principles

- **Separation of Concerns**: Clear layering (routes → services → database)
- **Tenant Isolation**: All queries scoped to tenant
- **Type Safety**: Full TypeScript typing throughout
- **Error Handling**: Consistent error format across all endpoints
- **Security First**: Authentication, rate limiting, input validation
- **Performance**: Caching, indexing, pagination
- **Maintainability**: Clean code, comprehensive documentation
