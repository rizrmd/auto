# 🏗️ PENJELASAN ARSITEKTUR AUTOLEADS

**Deployment URL:** https://auto.lumiku.com
**Status:** ✅ Production Running

---

## 📂 STRUKTUR FOLDER UTAMA

```
auto/
├── backend/              # ← BACKEND UTAMA (1 server untuk semua)
│   ├── index.tsx         # Entry point server
│   └── src/
│       ├── routes/
│       │   ├── public/   # ← API untuk customer (katalog mobil)
│       │   ├── admin/    # ← API untuk admin multi-tenant
│       │   └── webhook/  # ← Webhook WhatsApp bot
│       ├── bot/          # ← Sistem WhatsApp bot
│       ├── middleware/   # ← Multi-tenant middleware
│       └── services/     # ← Business logic
│
├── frontend/             # ← FRONTEND KATALOG (untuk customer)
│   ├── index.html
│   └── src/
│       ├── pages/        # ← Halaman katalog mobil
│       ├── components/   # ← Komponen UI
│       └── api/          # ← API client
│
├── prisma/               # ← DATABASE SCHEMA
│   ├── schema.prisma     # Schema multi-tenant
│   └── seed.ts           # Data testing
│
└── generated/            # ← Prisma client (auto-generated)
```

---

## 🎯 ARSITEKTUR: 1 BACKEND UNTUK SEMUA

**PENTING:** AutoLeads menggunakan **SATU backend tunggal** yang melayani:
1. ✅ Customer (katalog mobil)
2. ✅ Admin (manajemen multi-tenant)
3. ✅ WhatsApp Bot (webhook)

**Tidak ada backend terpisah!** Semua dalam satu server di `backend/index.tsx`

---

## 📍 LOKASI KODE PER FUNGSI

### 1️⃣ **BACKEND UNTUK CUSTOMER (Katalog Website)**

**File Entry Point:**
```
backend/index.tsx (line 67-67)
```

**Routing:**
```typescript
// Line 67: Route untuk customer melihat katalog
app.route('/api/cars', publicCarsRoutes);
```

**File Handler:**
```
backend/src/routes/public/cars.ts
```

**Endpoints yang dilayani:**
- `GET /api/cars` - List semua mobil (dengan filter)
- `GET /api/cars/:slug` - Detail mobil
- `GET /api/cars/search` - Search mobil

**Middleware yang dipakai:**
- `tenantMiddleware` - Identifikasi showroom dari domain
- `rateLimitMiddleware` - Batasi request

**Contoh Flow:**
```
Customer → https://auto.lumiku.com/api/cars
         → Backend (index.tsx)
         → tenantMiddleware (identifikasi tenant)
         → publicCarsRoutes (backend/src/routes/public/cars.ts)
         → Database (filter by tenantId)
         → Response JSON
```

---

### 2️⃣ **BACKEND UNTUK ADMIN (Multi-Tenant Management)**

**File Entry Point:**
```
backend/index.tsx (lines 73-75)
```

**Routing:**
```typescript
// Lines 73-75: Routes untuk admin kelola tenant
app.route('/api/admin/auth', adminAuthRoutes);
app.route('/api/admin/cars', adminCarsRoutes);
app.route('/api/admin/leads', adminLeadsRoutes);
```

**File Handlers:**
```
backend/src/routes/admin/
├── auth.ts    # Login, logout, register admin
├── cars.ts    # CRUD mobil (create, update, delete)
└── leads.ts   # Manage leads & messages
```

**Endpoints yang dilayani:**
```
Auth:
- POST /api/admin/auth/login      # Login admin
- POST /api/admin/auth/logout     # Logout
- GET  /api/admin/auth/profile    # Profile admin

Cars:
- GET    /api/admin/cars          # List semua mobil (termasuk draft)
- POST   /api/admin/cars          # Upload mobil baru
- GET    /api/admin/cars/:id      # Detail mobil
- PUT    /api/admin/cars/:id      # Update mobil
- DELETE /api/admin/cars/:id      # Hapus mobil
- PATCH  /api/admin/cars/:id/status  # Ubah status (available/sold)

Leads:
- GET    /api/admin/leads         # List semua leads
- GET    /api/admin/leads/:id     # Detail lead + chat history
- PATCH  /api/admin/leads/:id     # Update lead (assign, notes)
- POST   /api/admin/leads/:id/message  # Kirim pesan ke customer
```

**Middleware yang dipakai:**
- `authMiddleware` - Cek JWT token
- `tenantMiddleware` - Isolasi data per tenant
- `roleMiddleware` - Cek permission (owner/admin/sales)

**Contoh Flow:**
```
Admin → POST https://auto.lumiku.com/api/admin/auth/login
      → Backend (index.tsx)
      → adminAuthRoutes (backend/src/routes/admin/auth.ts)
      → Verify password (bcrypt)
      → Generate JWT token
      → Response { token, user, tenant }

Admin → GET https://auto.lumiku.com/api/admin/cars
      → Backend (index.tsx)
      → authMiddleware (verify JWT)
      → tenantMiddleware (get tenant from JWT)
      → adminCarsRoutes (backend/src/routes/admin/cars.ts)
      → Database (WHERE tenantId = X)
      → Response cars (dengan plateNumber, stockCode)
```

---

### 3️⃣ **BACKEND UNTUK WHATSAPP BOT**

**File Entry Point:**
```
backend/index.tsx (line 70)
```

**Routing:**
```typescript
// Line 70: Webhook untuk Fonnte (WhatsApp gateway)
app.route('/webhook/fonnte', fontteWebhookRoutes);
```

**File Handler:**
```
backend/src/routes/webhook/fonnte.ts
```

**Bot System Files:**
```
backend/src/bot/
├── customer/
│   ├── handler.ts           # Handle pesan customer
│   ├── intent-recognition.ts  # Deteksi maksud customer
│   └── response-builder.ts   # Build response
│
├── admin/
│   ├── handler.ts           # Handle pesan admin
│   └── upload-flow.ts       # Flow upload mobil 8 langkah
│
└── state-manager.ts         # Manage conversation state
```

**WhatsApp Integration:**
```
backend/src/whatsapp/
├── fonnte.service.ts        # Kirim pesan via Fonnte API
└── message-handler.ts       # Process incoming messages
```

**LLM Integration (AI Response):**
```
backend/src/llm/
├── gemini.service.ts        # Google Gemini Pro API
├── prompt-templates.ts      # Template prompt untuk LLM
└── rag-engine.ts            # Retrieval-Augmented Generation
```

**Endpoints:**
- `POST /webhook/fonnte` - Terima pesan dari Fonnte

**Contoh Flow (Customer Bot):**
```
Customer WA → "Ada Avanza 2020?"
           ↓
Fonnte API → POST https://auto.lumiku.com/webhook/fonnte
           ↓
Backend (fontteWebhookRoutes)
           ↓
Identify tenant (dari nomor WhatsApp showroom)
           ↓
bot/customer/handler.ts
  ├→ intent-recognition.ts (deteksi: INQUIRY_SPECIFIC)
  ├→ Database query (cari Avanza 2020)
  ├→ llm/rag-engine.ts (build context)
  ├→ llm/gemini.service.ts (generate response)
  └→ response-builder.ts (format response)
           ↓
whatsapp/fonnte.service.ts (kirim balik via API)
           ↓
Customer WA ← "Halo! Ada 2 unit Avanza 2020 nih:
               1. Avanza 1.3 G 2020 Hitam (#A01)
                  💰 Rp 185.000.000
                  📍 45.000 km
                  ..."
```

**Contoh Flow (Admin Bot - Upload Mobil):**
```
Admin WA → "/upload"
         ↓
Fonnte → Webhook
         ↓
bot/admin/handler.ts
  └→ upload-flow.ts (start 8-step flow)
         ↓
Save state: { step: 1, flow: 'car_upload' }
         ↓
Response ← "Kirim foto mobil (minimal 3 foto)"
         ↓
Admin WA → [kirim 4 foto]
         ↓
Upload to /uploads/cars/
Save state: { step: 2, photos: [...] }
         ↓
Response ← "Mobil apa ini? (contoh: Avanza 2020)"
         ↓
... (8 langkah total)
         ↓
Step 8: Save to database
         ↓
Response ← "✅ Mobil berhasil ditambahkan!
            #A06 - Avanza 2020 Hitam
            Harga: Rp 165.000.000"
```

---

### 4️⃣ **FRONTEND KATALOG (Untuk Customer)**

**File Entry Point:**
```
frontend/index.html
frontend/src/App.tsx
```

**Structure:**
```
frontend/src/
├── pages/
│   ├── HomePage.tsx           # Landing page + featured cars
│   ├── CatalogPage.tsx        # List semua mobil + filter
│   └── CarDetailPage.tsx      # Detail mobil + WhatsApp CTA
│
├── components/
│   ├── CarCard.tsx            # Card mobil (di catalog)
│   ├── CarFilters.tsx         # Filter brand/year/price
│   ├── PhotoGallery.tsx       # Swipeable gallery
│   └── WhatsAppButton.tsx     # CTA hubungi via WA
│
├── api/
│   └── cars.ts                # API client (fetch from backend)
│
└── context/
    └── TenantContext.tsx      # Context tenant info
```

**Endpoints yang dipanggil:**
```typescript
// frontend/src/api/cars.ts

export async function getCars(params) {
  // Panggil: GET /api/cars?brand=Toyota&year=2020
  return fetch(`${API_URL}/api/cars?${queryString}`)
}

export async function getCarDetail(slug) {
  // Panggil: GET /api/cars/avanza-2020-hitam-a01
  return fetch(`${API_URL}/api/cars/${slug}`)
}
```

**Halaman yang ada:**

1. **Home Page** (`/`)
   - Hero section
   - Featured cars (4 mobil terbaru)
   - CTA "Lihat Semua Mobil"

2. **Catalog Page** (`/cars`)
   - Filter (brand, year, transmission, price range)
   - Grid mobil (card dengan foto, nama, harga)
   - Pagination
   - Sort (terbaru, termurah, termahal)

3. **Car Detail Page** (`/cars/:slug`)
   - Photo gallery (swipeable)
   - Spesifikasi lengkap
   - Fitur unggulan
   - Harga besar
   - WhatsApp button "Hubungi Kami"

**Contoh Flow:**
```
Customer → Buka https://auto.lumiku.com
         ↓
Frontend (index.html + App.tsx)
         ↓
HomePage.tsx (load featured cars)
  └→ api/cars.ts → GET /api/cars?limit=4
         ↓
Tampil 4 mobil featured
         ↓
Click "Lihat Semua" → /cars
         ↓
CatalogPage.tsx
  ├→ CarFilters.tsx (filter UI)
  ├→ api/cars.ts → GET /api/cars?brand=Toyota
  └→ CarCard.tsx (render each car)
         ↓
Click mobil → /cars/avanza-2020-hitam-a01
         ↓
CarDetailPage.tsx
  ├→ api/cars.ts → GET /api/cars/avanza-2020-hitam-a01
  ├→ PhotoGallery.tsx (swipeable photos)
  └→ WhatsAppButton.tsx
         ↓
Click WhatsApp → Open wa.me/628123456789?text=...
         ↓
Customer chat dengan bot!
```

---

## 🔐 MULTI-TENANT: BAGAIMANA ISOLASI DATA BEKERJA?

**Konsep:** Satu database, banyak tenant (showroom), data terpisah otomatis.

### Middleware Tenant (KUNCI UTAMA)

**File:** `backend/src/middleware/tenant.ts`

**Cara Kerja:**
```typescript
// Setiap request masuk
1. Extract domain dari request
   - Header: Host = "auto.lumiku.com"
   - Extract: domain = "auto.lumiku.com"

2. Query database
   - SELECT * FROM tenants WHERE subdomain = "auto.lumiku.com"
   - Result: { id: 1, name: "Showroom Mobil Surabaya", ... }

3. Attach tenant ke context
   - c.set('tenant', tenant)
   - c.header('X-Tenant-Id', '1')

4. Lanjut ke handler
   - Handler otomatis dapat tenant dari context
```

**Implementasi di Handler:**
```typescript
// backend/src/routes/public/cars.ts

import { getTenant } from '../../middleware/tenant';

app.get('/api/cars', async (c) => {
  // Ambil tenant dari context (sudah di-inject middleware)
  const tenant = getTenant(c);

  // Query SELALU include tenantId
  const cars = await prisma.car.findMany({
    where: {
      tenantId: tenant.id,  // ← ISOLASI DATA!
      status: 'available',
    }
  });

  return c.json({ success: true, data: cars });
});
```

**Hasil:**
- Tenant A (auto.lumiku.com) hanya lihat mobilnya sendiri
- Tenant B (dealer-xyz.autoleads.id) hanya lihat mobilnya sendiri
- **Tidak mungkin cross-tenant data leak!**

---

## 🎯 DIAGRAM ALUR LENGKAP

### Customer → Katalog Website

```
┌─────────────┐
│  Customer   │
│   Browser   │
└──────┬──────┘
       │
       │ https://auto.lumiku.com/cars
       ↓
┌──────────────────────────────────┐
│  Frontend (React)                │
│  - CatalogPage.tsx               │
│  - api/cars.ts                   │
└──────┬───────────────────────────┘
       │
       │ GET /api/cars
       ↓
┌──────────────────────────────────┐
│  Backend (backend/index.tsx)     │
│  Line 67: app.route('/api/cars') │
└──────┬───────────────────────────┘
       │
       ├→ tenantMiddleware (identify tenant)
       │   - Extract: auto.lumiku.com → Tenant ID 1
       │
       ├→ routes/public/cars.ts
       │   - Query: WHERE tenantId = 1
       │
       └→ Response JSON (cars)
           ↓
      Customer lihat katalog!
```

---

### Customer → WhatsApp Bot

```
┌─────────────┐
│  Customer   │
│  WhatsApp   │
└──────┬──────┘
       │
       │ "Ada Avanza 2020?"
       ↓
┌──────────────────────────────────┐
│  Fonnte API (WhatsApp Gateway)   │
└──────┬───────────────────────────┘
       │
       │ POST /webhook/fonnte
       │ { sender: "628199xxx", message: "Ada Avanza 2020?" }
       ↓
┌──────────────────────────────────┐
│  Backend (backend/index.tsx)     │
│  Line 70: webhook/fonnte         │
└──────┬───────────────────────────┘
       │
       ├→ Identify tenant (by device number)
       │
       ├→ bot/customer/handler.ts
       │   ├→ intent-recognition.ts (INQUIRY_SPECIFIC)
       │   ├→ Query DB (Avanza 2020 WHERE tenantId = 1)
       │   ├→ llm/rag-engine.ts (build context)
       │   ├→ llm/gemini.service.ts (AI response)
       │   └→ response-builder.ts
       │
       ├→ whatsapp/fonnte.service.ts (kirim balik)
       │
       └→ Customer terima response <3s
           "Halo! Ada 2 unit Avanza 2020 nih:
            1. Avanza 1.3 G 2020 Hitam (#A01)..."
```

---

### Admin → Login & Manage

```
┌─────────────┐
│    Admin    │
│   Browser   │ (atau Postman/API client)
└──────┬──────┘
       │
       │ POST /api/admin/auth/login
       │ { email: "owner@...", password: "..." }
       ↓
┌──────────────────────────────────┐
│  Backend (backend/index.tsx)     │
│  Line 73: admin/auth             │
└──────┬───────────────────────────┘
       │
       ├→ routes/admin/auth.ts
       │   - Verify password (bcrypt)
       │   - Generate JWT token
       │   - Response: { token, user, tenant }
       │
       └→ Admin dapat token
           ↓
       ┌────────────────────────────┐
       │ Admin simpan token         │
       └────┬───────────────────────┘
            │
            │ GET /api/admin/cars
            │ Header: Authorization: Bearer <token>
            ↓
       ┌────────────────────────────┐
       │  Backend                   │
       │  Line 74: admin/cars       │
       └────┬───────────────────────┘
            │
            ├→ authMiddleware (verify JWT)
            │   - Decode token → userId, tenantId
            │
            ├→ routes/admin/cars.ts
            │   - Query: WHERE tenantId = X
            │   - Return ALL fields (termasuk private)
            │
            └→ Response: 15 mobil dengan plateNumber
```

---

### Admin → Upload Mobil via WhatsApp

```
┌─────────────┐
│    Admin    │
│  WhatsApp   │
└──────┬──────┘
       │
       │ "/upload"
       ↓
┌──────────────────────────────────┐
│  Fonnte → Backend Webhook        │
└──────┬───────────────────────────┘
       │
       ├→ bot/admin/handler.ts
       │   └→ upload-flow.ts (8 steps)
       │
       ├→ Step 1: "Kirim foto mobil"
       │   Admin → [kirim 4 foto]
       │   Save to /uploads/cars/
       │
       ├→ Step 2: "Mobil apa?"
       │   Admin → "Avanza 2020"
       │   Save state: { brand: "Toyota", model: "Avanza" }
       │
       ├→ Step 3: "Harga?"
       │   Admin → "165 juta"
       │   Parse: 165000000
       │
       ├→ Step 4-8: Km, transmisi, warna, etc.
       │
       └→ Step 8: Save to database
           - INSERT INTO cars (tenantId, ...)
           - Response: "✅ Berhasil! #A06 - Avanza 2020"
```

---

## 📊 DATABASE: MULTI-TENANT SCHEMA

**File:** `prisma/schema.prisma`

**Model Utama:**
```prisma
model Tenant {
  id              Int       @id @default(autoincrement())
  name            String
  subdomain       String    @unique  // ← auto.lumiku.com
  customDomain    String?   @unique  // ← Optional
  whatsappNumber  String               // ← Nomor WA showroom
  plan            PlanType
  status          TenantStatus

  // Relations (1 tenant has many...)
  cars            Car[]
  leads           Lead[]
  messages        Message[]
  users           User[]
}

model Car {
  id              Int       @id
  tenantId        Int       // ← FOREIGN KEY ke Tenant
  displayCode     String    // ← #A01 (untuk customer)
  plateNumber     String?   // ← L 1234 AB (private, admin only)
  publicName      String    // ← "Avanza 2020 Hitam #A01"
  brand           String
  model           String
  year            Int
  price           BigInt
  photos          String[]
  status          CarStatus

  tenant          Tenant    @relation(...)

  @@unique([tenantId, displayCode])  // ← Unique per tenant
}

model Lead {
  id              Int       @id
  tenantId        Int       // ← ISOLASI DATA
  customerPhone   String
  customerName    String?
  carId           Int?
  status          LeadStatus
  source          LeadSource  // ← wa / web / manual
  assignedToId    Int?        // ← Sales yang handle

  tenant          Tenant    @relation(...)
  car             Car?      @relation(...)
  assignedTo      User?     @relation(...)
  messages        Message[]
}

model User {
  id              Int       @id
  tenantId        Int       // ← Admin hanya bisa akses tenant sendiri
  email           String
  password        String    // ← Bcrypt hash
  name            String
  role            UserRole  // ← owner / admin / sales

  tenant          Tenant    @relation(...)
}
```

**Keamanan:**
- Semua query HARUS include `tenantId`
- Unique constraints per tenant (bukan global)
- User tidak bisa lintas tenant

---

## 🚀 DEPLOYMENT

**Environment:** Production
**Server:** Docker container di Coolify
**URL:** https://auto.lumiku.com
**Container ID:** b8sc48s8s0c4w00008k808w8

**File yang di-deploy:**
```
SEMUA file di folder auto/ kecuali:
- node_modules/ (di-build ulang di container)
- .git/
- generated/ (di-generate otomatis)
```

**Entry Point Production:**
```bash
# start.sh
bunx prisma generate
bunx prisma migrate deploy
bun run backend/index.tsx
```

**Environment Variables di Container:**
```env
DATABASE_URL=postgres://...
NODE_ENV=production
APP_URL=https://auto.lumiku.com
FONNTE_API_TOKEN=<pending>
GEMINI_API_KEY=<pending>
JWT_SECRET=autoleads-jwt-secret-change-this
```

---

## ✅ KESIMPULAN

### Backend Untuk Customer (Katalog Website)
**Lokasi:** `backend/src/routes/public/cars.ts`
**Endpoint:** `/api/cars`
**Fungsi:** API untuk customer lihat katalog mobil

### Backend Untuk Admin (Multi-Tenant Management)
**Lokasi:** `backend/src/routes/admin/`
**Endpoint:** `/api/admin/*`
**Fungsi:** API untuk admin kelola tenant (CRUD mobil, leads, dll)

### Backend Untuk WhatsApp Bot
**Lokasi:** `backend/src/routes/webhook/fonnte.ts` + `backend/src/bot/`
**Endpoint:** `/webhook/fonnte`
**Fungsi:** Terima & proses pesan WhatsApp

### Frontend Katalog
**Lokasi:** `frontend/src/`
**URL:** `https://auto.lumiku.com` (semua route selain /api)
**Fungsi:** Website katalog untuk customer

---

**PENTING:**
- ✅ **HANYA ADA 1 BACKEND** di `backend/index.tsx`
- ✅ Backend ini melayani **SEMUA kebutuhan** (customer, admin, bot)
- ✅ Isolasi data lewat **tenantId** di setiap query
- ✅ Frontend **hanya untuk customer** (katalog mobil)
- ✅ Admin **pakai API** (bisa bikin dashboard terpisah nanti)

**Status Deployment:**
- Backend: ✅ Running di https://auto.lumiku.com
- Database: ✅ Connected dengan 15 mobil, 5 leads
- Frontend: ✅ Served dari backend (line 107-109)
- WhatsApp Bot: ⏳ Pending API keys

---

**Dokumentasi Lengkap:**
- API Endpoints: `API_TEST_RESULTS.md`
- Backend Architecture: `backend/ARCHITECTURE.md`
- Bot System: `BOT_SYSTEM_COMPLETE.md`
- Deployment: `DEPLOYMENT_GUIDE.md`
