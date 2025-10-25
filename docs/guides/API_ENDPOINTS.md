# AutoLeads Backend API Documentation

**Base URL:** `https://auto.lumiku.com/api`
**Version:** 1.0.0
**Authentication:** JWT Bearer Token

---

## Quick Access Summary

### Production Backend
- **URL:** https://auto.lumiku.com
- **API Base:** https://auto.lumiku.com/api
- **Health:** https://auto.lumiku.com/health

### Default Credentials
```
Owner:  owner@showroom-surabaya.com / password123
Admin:  admin@showroom-surabaya.com / password123
Sales:  sales@showroom-surabaya.com / password123
```

---

## Public Endpoints (No Auth Required)

### 1. Health Check
```bash
GET /health

curl https://auto.lumiku.com/health
```

**Response:**
```json
{
  "status": "ok",
  "database": { "connected": true, "responseTime": 7 },
  "uptime": 668.29
}
```

---

### 2. Tenant Info
```bash
GET /api/tenant

curl https://auto.lumiku.com/api/tenant
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Showroom Mobil Surabaya",
    "domain": "auto.lumiku.com",
    "logo": "/uploads/tenant-1/logo.png",
    "primaryColor": "#DC2626",
    "whatsappNumber": "6281234567890"
  }
}
```

---

### 3. Car Catalog

#### List All Cars
```bash
GET /api/cars?page=1&limit=10&brand=Toyota

curl "https://auto.lumiku.com/api/cars?page=1&limit=10"
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 12, max: 50)
- `brand` (string)
- `minPrice` / `maxPrice` (string)
- `year` (number)
- `transmission` (MANUAL | AUTOMATIC)
- `fuelType` (GASOLINE | DIESEL | ELECTRIC | HYBRID)
- `status` (AVAILABLE | SOLD | RESERVED)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "brand": "Toyota",
      "model": "Avanza",
      "year": 2023,
      "price": "200000000",
      "slug": "toyota-avanza-2023-b1234xyz",
      "photos": ["/uploads/tenant-1/cars/car1-1.jpg"],
      "status": "AVAILABLE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPages": 2
  }
}
```

#### Search Cars
```bash
GET /api/cars/search?search=Avanza&limit=5

curl "https://auto.lumiku.com/api/cars/search?search=Avanza"
```

#### Get Car Detail
```bash
GET /api/cars/:slugOrId

curl https://auto.lumiku.com/api/cars/toyota-avanza-2023-b1234xyz
curl https://auto.lumiku.com/api/cars/1
```

---

### 4. Lead Submission
```bash
POST /api/leads

curl -X POST https://auto.lumiku.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "08123456789",
    "customerEmail": "john@example.com",
    "carId": 1,
    "message": "Tertarik test drive"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Lead berhasil dikirim",
  "data": { "id": 42, "status": "NEW" }
}
```

---

## Admin Endpoints (Auth Required)

**Header Required:**
```
Authorization: Bearer <your_jwt_token>
```

---

### 1. Authentication

#### Login
```bash
POST /api/admin/auth/login

curl -X POST https://auto.lumiku.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@showroom-surabaya.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "owner@showroom-surabaya.com",
    "name": "Budi Santoso",
    "role": "OWNER"
  }
}
```

#### Get Current User
```bash
GET /api/admin/auth/me

curl https://auto.lumiku.com/api/admin/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

### 2. Car Management

#### List Cars (Admin)
```bash
GET /api/admin/cars?page=1&limit=20

TOKEN="your_jwt_token"
curl https://auto.lumiku.com/api/admin/cars \
  -H "Authorization: Bearer $TOKEN"
```

#### Create Car
```bash
POST /api/admin/cars

curl -X POST https://auto.lumiku.com/api/admin/cars \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plateNumber": "B 5678 ABC",
    "brand": "Honda",
    "model": "CR-V",
    "year": 2022,
    "price": "450000000",
    "mileage": 25000,
    "transmission": "AUTOMATIC",
    "fuelType": "GASOLINE",
    "color": "White",
    "status": "AVAILABLE"
  }'
```

#### Update Car
```bash
PUT /api/admin/cars/:id

curl -X PUT https://auto.lumiku.com/api/admin/cars/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price": "440000000"}'
```

#### Delete Car
```bash
DELETE /api/admin/cars/:id

curl -X DELETE https://auto.lumiku.com/api/admin/cars/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3. Lead Management

#### List All Leads
```bash
GET /api/admin/leads?page=1&status=NEW

curl https://auto.lumiku.com/api/admin/leads \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters:**
- `page` (number)
- `limit` (number)
- `status` (NEW | CONTACTED | QUALIFIED | NEGOTIATION | WON | LOST)
- `source` (WEB_CATALOG | WHATSAPP | PHONE | WALK_IN)

#### Get Lead Detail
```bash
GET /api/admin/leads/:id

curl https://auto.lumiku.com/api/admin/leads/42 \
  -H "Authorization: Bearer $TOKEN"
```

#### Update Lead
```bash
PATCH /api/admin/leads/:id

curl -X PATCH https://auto.lumiku.com/api/admin/leads/42 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONTACTED", "assignedToUserId": 3}'
```

---

## Image Serving

```bash
GET /uploads/:tenantId/:category/:filename

curl https://auto.lumiku.com/uploads/tenant-1/cars/car1-1.jpg
```

**Supported formats:** JPG, PNG, WebP, GIF

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

---

## Rate Limiting

- **Public endpoints:** 100 requests / 15 minutes per IP
- **Admin endpoints:** 500 requests / 15 minutes per token
- **Lead submission:** 10 requests / 15 minutes per IP

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1698156000
```

---

## CORS Policy

**Allowed Origins (Production):**
- https://auto.lumiku.com
- https://admin.lumiku.com

**Allowed Methods:**
- GET, POST, PUT, PATCH, DELETE, OPTIONS

---

## Quick Test Script

```bash
#!/bin/bash

# 1. Health check
echo "=== Health Check ==="
curl https://auto.lumiku.com/health | jq .

# 2. Get tenant
echo -e "\n=== Tenant Info ==="
curl https://auto.lumiku.com/api/tenant | jq .

# 3. List cars
echo -e "\n=== Car Catalog ==="
curl "https://auto.lumiku.com/api/cars?limit=2" | jq '.data[] | {brand, model, price}'

# 4. Search
echo -e "\n=== Search ==="
curl "https://auto.lumiku.com/api/cars/search?search=Toyota" | jq .

# 5. Login
echo -e "\n=== Admin Login ==="
RESPONSE=$(curl -s -X POST https://auto.lumiku.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@showroom-surabaya.com","password":"password123"}')

TOKEN=$(echo $RESPONSE | jq -r '.token')
echo "Token: ${TOKEN:0:50}..."

# 6. Get admin cars
echo -e "\n=== Admin Cars ==="
curl -s https://auto.lumiku.com/api/admin/cars \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0]'
```

---

## Testing with Postman

**Import Base URL:**
```
https://auto.lumiku.com/api
```

**Environment Variables:**
- `base_url`: https://auto.lumiku.com/api
- `token`: (set after login)

**Collections:**
1. Public Endpoints
   - Health Check
   - Tenant Info
   - Car Catalog
   - Car Search
   - Car Detail
   - Lead Submission

2. Admin Endpoints
   - Login (saves token to environment)
   - Get Current User
   - List/Create/Update/Delete Cars
   - Manage Leads

---

## Database Schema

**Main Tables:**
- `Tenant` - Multi-tenant configuration
- `User` - Admin users (OWNER, ADMIN, SALES)
- `Car` - Vehicle inventory
- `Lead` - Customer inquiries
- `Message` - WhatsApp messages (Phase 3)
- `ConversationState` - Bot states (Phase 3)

**Key Enums:**
- `CarStatus`: AVAILABLE | RESERVED | SOLD
- `TransmissionType`: MANUAL | AUTOMATIC
- `FuelType`: GASOLINE | DIESEL | ELECTRIC | HYBRID
- `LeadStatus`: NEW | CONTACTED | QUALIFIED | NEGOTIATION | WON | LOST
- `LeadSource`: WEB_CATALOG | WHATSAPP | PHONE | WALK_IN

---

## Support

**Check Logs:**
```bash
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 100"
```

**Monitor Deployment:**
```bash
curl https://cf.avolut.com/api/v1/deployments/applications/b8sc48s8s0c4w00008k808w8 \
  --header 'Authorization: Bearer 7|rsu1vBA8EzDIeetffQQk8PhM2pUqAiAKeHoaObun2bec5fc5'
```

**Documentation:**
- Deployment: `DEPLOYMENT_MASTER_CHECKLIST.md`
- Security: `PHASE_1_SECURITY_HARDENING.md`
- Status: `DEPLOYMENT_STATUS.md`

---

**Last Updated:** 2025-10-24
**Production URL:** https://auto.lumiku.com
**Container ID:** b8sc48s8s0c4w00008k808w8
