# AutoLeads Backend Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Browser    │  │  Mobile App  │  │  WhatsApp (Fonnte)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
          │ HTTP/HTTPS       │ HTTP/HTTPS          │ Webhook
          │                  │                     │
┌─────────▼──────────────────▼─────────────────────▼──────────────┐
│                      HONO WEB FRAMEWORK                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  MIDDLEWARE STACK                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │   CORS   │→│  Logger  │→│RequestID │→│ Error Handler│ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │ │
│  │  ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐  │ │
│  │  │Tenant Lookup │→│ Auth (JWT)  │→│ Rate Limiter     │  │ │
│  │  └──────────────┘ └─────────────┘ └──────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                      ROUTE LAYER                           │ │
│  │                                                            │ │
│  │  PUBLIC ROUTES        ADMIN ROUTES         WEBHOOKS       │ │
│  │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐ │ │
│  │  │ GET /cars   │     │ /admin/auth │     │  /webhook/  │ │ │
│  │  │ GET /cars/  │     │ /admin/cars │     │   fonnte    │ │ │
│  │  │     :slug   │     │ /admin/leads│     └─────────────┘ │ │
│  │  └─────────────┘     └─────────────┘                     │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    SERVICE LAYER                           │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │ │
│  │  │TenantService │ │ CarService   │ │  LeadService     │  │ │
│  │  │- findByDomain│ │- create()    │ │- create()        │  │ │
│  │  │- cache       │ │- update()    │ │- findByPhone()   │  │ │
│  │  │- validate    │ │- list()      │ │- assign()        │  │ │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘  │ │
│  │  ┌──────────────┐                                        │ │
│  │  │ AuthService  │                                        │ │
│  │  │- authenticate│                                        │ │
│  │  │- generateJWT │                                        │ │
│  │  │- hashPassword│                                        │ │
│  │  └──────────────┘                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  DATABASE LAYER (Prisma)                   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │ │
│  │  │ Tenant   │ │   Car    │ │  Lead    │ │   Message    │ │ │
│  │  │ Model    │ │  Model   │ │  Model   │ │    Model     │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  PostgreSQL Database │
                    │  - Multi-tenant data │
                    │  - Indexed queries   │
                    └──────────────────────┘
```

## Request Flow

### Public Car Listing Request

```
1. Browser requests: GET https://dealer1.autoleads.com/api/cars
                                      ↓
2. CORS Middleware: Allow origin
                                      ↓
3. Logger Middleware: Log request
                                      ↓
4. Request ID: Add unique ID
                                      ↓
5. Tenant Middleware:
   - Extract domain: "dealer1.autoleads.com"
   - Extract subdomain: "dealer1"
   - Check cache for tenant
   - If not cached, query database
   - Validate tenant status (active/trial)
   - Attach tenant to context
                                      ↓
6. Rate Limiter:
   - Check request count for IP
   - Increment counter
   - Reject if limit exceeded
                                      ↓
7. Public Cars Route Handler:
   - Parse query parameters (page, limit, filters)
   - Call CarService.getPublicCars()
                                      ↓
8. CarService:
   - Build where clause with tenantId filter
   - Query database: prisma.car.findMany({ where: { tenantId, status: 'available' }})
   - Format prices
   - Return paginated results
                                      ↓
9. Response Formatter:
   - Wrap in ApiResponse format
   - Add pagination headers (X-Total-Count, X-Page)
   - Return JSON
                                      ↓
10. Client receives: { success: true, data: [...], meta: {...} }
```

### Admin Car Creation Request

```
1. Admin sends: POST https://dealer1.autoleads.com/api/admin/cars
   Headers: Authorization: Bearer <JWT>
   Body: { brand: "Toyota", model: "Avanza", ... }
                                      ↓
2-5. Same middleware as above (CORS, Logger, Request ID, Tenant, Rate Limiter)
                                      ↓
6. Auth Middleware:
   - Extract JWT from Authorization header
   - Verify signature
   - Check expiration
   - Load user from database
   - Verify user belongs to tenant
   - Verify user status is active
   - Attach user to context
                                      ↓
7. Role Check (requireAdmin):
   - Verify user.role in ['owner', 'admin']
   - Reject if not authorized
                                      ↓
8. Admin Cars Route Handler:
   - Parse request body
   - Call CarService.create()
                                      ↓
9. CarService.create():
   - Validate input (year, price, km ranges)
   - Check duplicate displayCode for tenant
   - Generate publicName
   - Generate SEO slug
   - Ensure unique slug
   - Clean plate number
   - Insert into database with tenantId
   - Return created car
                                      ↓
10. Response: { success: true, data: { id, displayCode, slug, ... } }
```

### WhatsApp Webhook Request

```
1. Fonnte sends: POST https://autoleads.com/webhook/fonnte
   Body: { sender: "6281234567890", message: "Halo", ... }
                                      ↓
2-4. Middleware (CORS, Logger, Request ID)
                                      ↓
5. Webhook Handler:
   - Extract sender phone
   - Extract customer name
   - Determine tenant (from device number)
   - Call LeadService.findOrCreateByPhone()
                                      ↓
6. LeadService.findOrCreateByPhone():
   - Normalize phone to +62 format
   - Search for existing active lead
   - If not found, create new lead
   - Return lead
                                      ↓
7. Save Message:
   - Create message record with:
     * tenantId
     * leadId
     * sender: 'customer'
     * message text
     * metadata
                                      ↓
8. Response: { success: true, data: { leadId, status: 'processed' } }
```

## Data Flow

### Multi-Tenant Data Isolation

```
┌──────────────────────────────────────────────────────────────┐
│                         Database                             │
│                                                              │
│  Tenant 1 (dealer1.autoleads.com)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Cars: [A01, A02, A03]                               │   │
│  │ Leads: [Lead1, Lead2]                               │   │
│  │ Users: [Admin1, Sales1]                             │   │
│  │ Messages: [Msg1, Msg2, Msg3]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Tenant 2 (dealer2.autoleads.com)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Cars: [B01, B02]                                    │   │
│  │ Leads: [Lead3]                                      │   │
│  │ Users: [Admin2]                                     │   │
│  │ Messages: [Msg4, Msg5]                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ALL QUERIES FILTERED BY: WHERE tenantId = ?                │
└──────────────────────────────────────────────────────────────┘
```

## Caching Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    Tenant Cache (In-Memory)                  │
│                                                              │
│  Key: "tenant:domain:dealer1"                               │
│  Value: { id: 1, name: "Dealer 1", slug: "dealer1", ... }  │
│  TTL: 300 seconds (5 minutes)                               │
│                                                              │
│  Key: "tenant:id:1"                                         │
│  Value: { id: 1, name: "Dealer 1", slug: "dealer1", ... }  │
│  TTL: 300 seconds (5 minutes)                               │
└──────────────────────────────────────────────────────────────┘

Benefits:
- Reduces database queries for tenant lookup
- Improves response time for all requests
- Automatic expiration prevents stale data

Note: In production with multiple servers, use Redis instead
```

## Security Layers

```
┌──────────────────────────────────────────────────────────────┐
│                      Security Stack                          │
│                                                              │
│  Layer 1: CORS                                              │
│  └─ Restrict origins, methods, headers                      │
│                                                              │
│  Layer 2: Rate Limiting                                     │
│  └─ Prevent abuse (100 req/min public, 5 req/15min login)  │
│                                                              │
│  Layer 3: Input Validation                                  │
│  └─ Validate all inputs, sanitize data                      │
│                                                              │
│  Layer 4: Authentication (JWT)                              │
│  └─ Verify identity, check token expiration                 │
│                                                              │
│  Layer 5: Authorization (RBAC)                              │
│  └─ Check user roles (owner, admin, sales)                  │
│                                                              │
│  Layer 6: Tenant Isolation                                  │
│  └─ Every query scoped to tenantId                          │
│                                                              │
│  Layer 7: Error Sanitization                                │
│  └─ No stack traces or sensitive data in responses          │
└──────────────────────────────────────────────────────────────┘
```

## Technology Stack Justification

### Why Bun?
- **Performance**: Faster than Node.js
- **Built-in features**: Native TypeScript, test runner, package manager
- **Modern APIs**: Bun.password for bcrypt, built-in fetch

### Why Hono?
- **Lightweight**: Minimal overhead, fast routing
- **TypeScript-first**: Excellent type inference
- **Middleware support**: Easy to extend
- **Bun optimized**: Works seamlessly with Bun.serve

### Why Prisma?
- **Type safety**: Auto-generated TypeScript types
- **Migrations**: Database schema versioning
- **Developer experience**: Intuitive API, great debugging
- **Multi-database**: Easy to switch databases if needed

### Why JWT?
- **Stateless**: No server-side session storage
- **Scalable**: Works across multiple servers
- **Standard**: Widely adopted, many libraries available
- **Flexible**: Can include custom claims (role, tenantId)

## Performance Considerations

### Database Queries
- **Indexing**: All frequently queried columns indexed
- **Connection pooling**: Prisma manages connections efficiently
- **Selective loading**: Only fetch needed fields
- **Pagination**: Limit result set size

### Caching
- **Tenant cache**: Reduces database load by 80%+ for tenant lookups
- **TTL**: 5-minute expiration balances freshness and performance

### Rate Limiting
- **Memory-efficient**: In-memory store with automatic cleanup
- **Per-IP limiting**: Prevents single source abuse
- **Configurable**: Adjust limits per endpoint

## Error Handling Philosophy

1. **Fail Fast**: Validate early, fail quickly
2. **Clear Messages**: User-friendly error messages
3. **Detailed Logging**: Log full errors server-side
4. **Sanitized Responses**: Never expose internals to client
5. **Consistent Format**: All errors use ApiResponse structure

## Deployment Architecture

```
Production Setup (Recommended):

┌─────────────────────────────────────────────────────────────┐
│                         CDN / WAF                           │
│                    (Cloudflare / AWS)                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer                            │
│                  (Nginx / AWS ALB)                          │
└───────┬─────────────────────────────────┬───────────────────┘
        │                                 │
        ▼                                 ▼
┌──────────────────┐            ┌──────────────────┐
│  Bun Server 1    │            │  Bun Server 2    │
│  (AutoLeads)     │            │  (AutoLeads)     │
└────────┬─────────┘            └────────┬─────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Redis Cluster      │
              │ (Cache + Rate Limit) │
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  PostgreSQL Primary  │
              │   + Read Replicas    │
              └──────────────────────┘
```

---

**Note**: This architecture is designed for scalability, maintainability, and security. All components can be independently scaled based on load.
