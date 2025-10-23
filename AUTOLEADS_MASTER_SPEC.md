# 📘 AUTOLEADS - MASTER DEVELOPMENT SPECIFICATION

> **Version:** 1.0
> **Last Updated:** 2025-10-23
> **Status:** Ready for Development
> **Timeline:** 2-4 weeks to MLP Launch

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Business Model](#2-product-vision--business-model)
3. [Technical Architecture](#3-technical-architecture)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [User Flows](#6-user-flows)
7. [Development Phases](#7-development-phases)
8. [Agent Assignment Map](#8-agent-assignment-map)
9. [Testing & QA Checklist](#9-testing--qa-checklist)
10. [Deployment Guide](#10-deployment-guide)
11. [Post-Launch Operations](#11-post-launch-operations)

---

## 1. EXECUTIVE SUMMARY

### 1.1 What is AutoLeads?

**AutoLeads** adalah platform SaaS multi-tenant untuk showroom mobil bekas yang menggabungkan:
- 🌐 **Katalog Website** (mobile-first, SEO-optimized, custom domain)
- 🤖 **AI WhatsApp Bot** (customer service 24/7 + inventory management via WA)
- 📊 **Dashboard Admin** (analytics, lead management, backup controls)

### 1.2 Target Market

| Attribute | Value |
|-----------|-------|
| **Customer Type** | Large showrooms (50+ mobil, 5+ sales, multi-cabang) |
| **Geography** | Surabaya, Malang, Solo (Jawa Timur fokus awal) |
| **Pain Points** | Lost leads (slow response), sales burnout (repetitive FAQ), upload inventory ribet |
| **First Customer** | ✅ VALIDATED: 3 cabang, 70+ mobil, butuh segera |

### 1.3 Business Model

| Item | Value |
|------|-------|
| **Pricing** | Rp 3.000.000/bulan (annual payment) |
| **Setup Fee** | Rp 5.000.000 (one-time) |
| **First Customer Deal** | Rp 2.5jt setup + Rp 1.5jt/bulan (founding customer discount) |
| **Payment Model** | 50% down (Rp 10.25jt) + 50% upon go-live |
| **Revenue Target** | 30 showrooms × Rp 41jt/year = **Rp 1.2 MILIAR** (6 bulan) |

### 1.4 Core Value Proposition

**Customer ROI:**
- **Pay:** Rp 3jt/bulan
- **Gain:**
  - 5+ extra leads/month (24/7 bot) = +Rp 50jt revenue
  - Save 600 hours/month (sales time) = Rp 30jt labor cost
- **Total ROI:** 17-27x 🚀

### 1.5 MLP Scope (Minimum Lovable Product)

**3 Core Features:**

1. **WA Bot Customer AI** - 24/7 instant response (<3s)
2. **Web Katalog Simple** - Mobile-first, SEO, browsing, WA CTA
3. **Bot Admin WA** - Upload mobil 2 menit via WhatsApp

**What's CUT from MVP:**
- Credit calculator (Phase 4)
- Dashboard admin (Phase 3 - minimal version)
- Analytics (Phase 4)
- Broadcast (Phase 4)
- Video support (Phase 4)
- Advertising pixels (Phase 4)

---

## 2. PRODUCT VISION & BUSINESS MODEL

### 2.1 Core Problems Solved

| Problem | Current Impact | AutoLeads Solution | Result |
|---------|----------------|-------------------|--------|
| **Lost Leads** (slow response) | -Rp 25-150jt/bulan | WA Bot 24/7 (<3s) | +50% lead conversion |
| **Sales Burnout** (80% time on FAQ) | Low productivity, turnover | AI handle 80% FAQ | Sales focus on closing |
| **Upload Ribet** (1.5 jam via laptop) | Delay 2-4 jam, competitor faster | Upload 2 menit via WA | 18x faster, instant live |

### 2.2 Product Features Matrix

| Feature | MLP (Phase 1) | Phase 2 | Phase 3 | Phase 4 |
|---------|---------------|---------|---------|---------|
| **Web Katalog** | ✅ Basic | | ✅ SEO Advanced | ✅ Blog/Artikel |
| **WA Bot Customer** | ✅ 5 Intents | | ✅ 10+ Intents | ✅ Advanced NLP |
| **Bot Admin WA** | ✅ Upload/Status | | ✅ Edit/Photo | ✅ Bulk Ops |
| **Multi-Tenant** | ✅ Subdomain | | ✅ Custom Domain | ✅ White-label |
| **Dashboard** | ❌ | | ✅ Basic | ✅ Full Analytics |
| **Credit Calc** | ❌ | | | ✅ Interactive |
| **Broadcast** | ❌ | | | ✅ Segmented |
| **Video** | ❌ | | | ✅ Upload/Display |

### 2.3 Subscription Tiers

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | Rp 500k/bulan | Subdomain, 50 mobil, 500 msg/month, 1 admin |
| **Growth** | Rp 1.5jt/bulan | Custom domain, unlimited mobil, 2000 msg/month, Bot Admin WA, 3 admin + 2 sales |
| **Pro** | Rp 3jt/bulan | All Growth + Unlimited msg, Bot Sales + Broadcast, Priority support, White-label option, 5 admin + unlimited sales |

---

## 3. TECHNICAL ARCHITECTURE

### 3.1 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Bun v1.2+ | Fast, lightweight, native TypeScript |
| **Backend Framework** | Hono | Lightweight, edge-compatible, fast routing |
| **Database** | PostgreSQL 15+ | Robust, JSONB support, full-text search |
| **ORM** | Prisma 6+ | Type-safe, migrations, excellent DX |
| **Frontend** | React 19 | Already in use, component-based |
| **Styling** | Tailwind CSS + shadcn/ui | Fast styling, pre-built components |
| **WhatsApp Gateway** | Fonnte | Affordable (Rp 300k/month), reliable |
| **LLM** | Google Gemini Pro | Cost-effective (Rp 500k/month for 10k msg), good quality |
| **File Storage** | Local filesystem (Phase 1) → S3 (Phase 4) | Simple for MLP, scalable later |
| **Deployment** | Docker + Coolify | Already in use, container-based |
| **SSL** | Cloudflare | Free SSL, CDN, DDoS protection |
| **Monitoring** | Console logs (Phase 1) → Sentry (Phase 4) | Simple first, robust later |

### 3.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼─────────┐         ┌──────▼──────┐
        │   Cloudflare    │         │   Fonnte    │
        │   (SSL + CDN)   │         │  (WA API)   │
        └───────┬─────────┘         └──────┬──────┘
                │                           │
        ┌───────▼─────────────────────────┬─▼────────┐
        │     Docker Container (Coolify)           │
        │  ┌─────────────────────────────────────┐ │
        │  │     Bun + Hono Server               │ │
        │  │                                     │ │
        │  │  ┌──────────────────────────────┐  │ │
        │  │  │  Tenant Middleware           │  │ │
        │  │  │  (Domain → Tenant ID)        │  │ │
        │  │  └──────────────────────────────┘  │ │
        │  │                                     │ │
        │  │  ┌──────────────────────────────┐  │ │
        │  │  │  API Routes                  │  │ │
        │  │  │  - /api/cars                 │  │ │
        │  │  │  - /api/leads                │  │ │
        │  │  │  - /webhook/fonnte           │  │ │
        │  │  └──────────────────────────────┘  │ │
        │  │                                     │ │
        │  │  ┌──────────────────────────────┐  │ │
        │  │  │  Bot Logic Engine            │  │ │
        │  │  │  - Intent Recognition        │  │ │
        │  │  │  - RAG (DB → LLM)            │  │ │
        │  │  │  - Response Generation       │  │ │
        │  │  └──────────────────────────────┘  │ │
        │  │                                     │ │
        │  │  ┌──────────────────────────────┐  │ │
        │  │  │  Frontend (React)            │  │ │
        │  │  │  - SSR for SEO               │  │ │
        │  │  │  - Served by Hono            │  │ │
        │  │  └──────────────────────────────┘  │ │
        │  └─────────────────────────────────────┘ │
        │                                           │
        │  ┌─────────────────────────────────────┐ │
        │  │     Prisma ORM                      │ │
        │  └───────────┬─────────────────────────┘ │
        └──────────────┼───────────────────────────┘
                       │
        ┌──────────────▼───────────────┐
        │   PostgreSQL Database        │
        │   - tenants                  │
        │   - cars                     │
        │   - leads                    │
        │   - messages                 │
        │   - users                    │
        └──────────────────────────────┘
```

### 3.3 Multi-Tenant Architecture

**Request Flow:**

```typescript
// 1. Request comes in
GET https://showroommobil.com/avanza-2020-hitam-a01

// 2. Cloudflare SSL → Docker Container

// 3. Tenant Middleware
const host = request.headers.get('host'); // "showroommobil.com"

// 4. Identify Tenant
const tenant = await db.tenant.findFirst({
  where: {
    OR: [
      { custom_domain: host },
      { subdomain: host }
    ]
  }
});

// 5. Set Context
request.tenant = tenant; // tenant_id: 123

// 6. All queries scoped to tenant
const car = await db.car.findFirst({
  where: {
    tenant_id: tenant.id, // 🔑 DATA ISOLATION
    slug: 'avanza-2020-hitam-a01',
    status: 'available'
  }
});

// 7. Render with tenant branding
return renderCarDetail(car, tenant);
```

**Key Principle:** Every query MUST include `tenant_id` filter (data isolation).

### 3.4 Identity System (Dual-Layer)

| Layer | Visible To | Purpose | Example |
|-------|------------|---------|---------|
| **Internal ID** | Owner, Sales, System | Tracking, commands | Plat: B 1234 XYZ<br>Stock: STK-045 |
| **Public ID** | Customer, Website | Reference, sharing | Display Code: #A01<br>Public Name: Avanza 2020 Hitam #A01 |
| **URL Slug** | Everyone | SEO, linking | avanza-2020-hitam-a01 |

**Privacy:** Plat nomor NEVER exposed to public (customer-facing).

### 3.5 WhatsApp Integration Architecture

**Fonnte Flow:**

```
Customer (0812-xxxx) → WhatsApp
    ↓
Fonnte (webhook) → POST https://api.autoleads.id/webhook/fonnte
    ↓
Payload: {
  device: "628123456789", // Showroom WA number
  message: "Ada Avanza 2020?",
  sender: "6281234567890" // Customer phone
}
    ↓
Backend:
  1. Identify tenant by device (WA number)
  2. Check conversation state (first message vs. ongoing)
  3. Process message:
     - Query DB (find matching cars)
     - Build LLM prompt with context
     - Get response from Gemini Pro
     - Save to leads/messages table
  4. Send response via Fonnte API
    ↓
Fonnte → Customer (receives reply <3s)
```

**Bot State Management:**

```sql
CREATE TABLE conversation_states (
  id SERIAL PRIMARY KEY,
  tenant_id INT,
  user_phone VARCHAR(20),
  user_type ENUM('customer', 'admin', 'sales'),
  current_flow VARCHAR(50), -- 'idle', 'upload_car', 'credit_calc'
  current_step INT,
  context JSONB, -- Temporary data
  expires_at TIMESTAMP, -- Auto-reset after 30 min
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3.6 LLM Integration (RAG Pattern)

**Retrieval-Augmented Generation Flow:**

```typescript
async function handleCustomerMessage(tenant, customerPhone, message) {
  // 1. Query Database (Retrieval)
  const matchingCars = await db.car.findMany({
    where: {
      tenant_id: tenant.id,
      status: 'available',
      OR: [
        { brand: { contains: extractBrand(message) } },
        { model: { contains: extractModel(message) } },
        { year: extractYear(message) }
      ]
    },
    take: 3 // Limit to top 3 matches
  });

  // 2. Build Context
  const context = {
    tenant: {
      name: tenant.name,
      phone: tenant.phone,
      address: tenant.address
    },
    availableCars: matchingCars.map(car => ({
      code: car.display_code,
      name: `${car.brand} ${car.model} ${car.year}`,
      price: car.price,
      km: car.km,
      transmission: car.transmission,
      color: car.color,
      features: car.key_features
    })),
    conversationHistory: await getRecentMessages(customerPhone, 5)
  };

  // 3. Build Prompt (Augmentation)
  const prompt = `
Anda adalah asisten sales showroom mobil "${tenant.name}" yang ramah dan membantu.

Context Showroom:
- Nama: ${context.tenant.name}
- Alamat: ${context.tenant.address}
- Telepon: ${context.tenant.phone}

Mobil Yang Tersedia:
${context.availableCars.map(car => `
- ${car.name} (Kode: ${car.code})
  Harga: Rp ${formatPrice(car.price)}
  KM: ${car.km.toLocaleString()} km
  Transmisi: ${car.transmission}
  Warna: ${car.color}
  ${car.features ? `Kelebihan: ${car.features.join(', ')}` : ''}
`).join('\n')}

Percakapan Sebelumnya:
${context.conversationHistory.map(m => `${m.sender}: ${m.message}`).join('\n')}

Guidelines:
- Jawab singkat, jelas, ramah (pakai emoji wajar)
- HANYA gunakan data mobil di atas (JANGAN mengada-ada)
- Jika tanya harga nego: "Harga masih bisa dinego, mau saya hubungkan sales?"
- Jika tidak ada stock: "Maaf belum ada, tapi ada yang mirip: [suggest]"
- Selalu akhiri dengan pertanyaan/CTA
- Format response: Text only (no markdown)

Pertanyaan Customer: "${message}"

Jawab:
  `;

  // 4. Call LLM (Generation)
  const response = await callGeminiPro(prompt);

  // 5. Save & Send
  await saveMessage(tenant.id, customerPhone, 'bot', response);
  await sendWhatsApp(tenant.whatsapp_number, customerPhone, response);

  return response;
}
```

**Cost Control:**

```typescript
// Cache common queries
const CACHED_RESPONSES = {
  "lokasi": () => `Showroom kami di ${tenant.address}. Maps: ${tenant.maps_url}`,
  "jam buka": () => `Buka setiap hari ${tenant.business_hours}`,
  "telepon": () => `Bisa hubungi kami di ${tenant.phone}`
};

// Check cache first
const normalized = message.toLowerCase().trim();
if (CACHED_RESPONSES[normalized]) {
  return CACHED_RESPONSES[normalized]();
}

// Rate limiting
const recentMessages = await getRecentMessages(customerPhone, 1); // Last 1 min
if (recentMessages.length > 10) {
  return "Maaf, terlalu banyak pesan. Tunggu sebentar ya 😊";
}

// Then call LLM
```

---

## 4. DATABASE SCHEMA

### 4.1 Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// TENANTS (SHOWROOMS)
// ============================================

model Tenant {
  id                        Int       @id @default(autoincrement())

  // IDENTITY
  name                      String    @db.VarChar(200)
  slug                      String    @unique @db.VarChar(100)

  // DOMAINS
  subdomain                 String    @unique @db.VarChar(200)
  customDomain              String?   @unique @map("custom_domain") @db.VarChar(200)
  customDomainVerified      Boolean   @default(false) @map("custom_domain_verified")
  customDomainSslStatus     SslStatus @default(pending) @map("custom_domain_ssl_status")

  // BRANDING
  logoUrl                   String?   @map("logo_url") @db.Text
  primaryColor              String    @default("#FF5722") @map("primary_color") @db.VarChar(7)
  secondaryColor            String    @default("#000000") @map("secondary_color") @db.VarChar(7)

  // CONTACT
  phone                     String    @db.VarChar(20)
  whatsappNumber            String    @map("whatsapp_number") @db.VarChar(20)
  whatsappBotEnabled        Boolean   @default(true) @map("whatsapp_bot_enabled")
  email                     String?   @db.VarChar(200)
  address                   String?   @db.Text
  city                      String?   @db.VarChar(100)
  mapsUrl                   String?   @map("maps_url") @db.Text

  // BUSINESS HOURS
  businessHours             Json?     @map("business_hours") // {"mon": "09:00-18:00"}

  // SUBSCRIPTION
  plan                      PlanType  @default(trial)
  planStartedAt             DateTime? @map("plan_started_at")
  planExpiresAt             DateTime? @map("plan_expires_at")

  // STATUS
  status                    TenantStatus @default(trial)
  trialEndsAt               DateTime? @map("trial_ends_at")

  // SETTINGS
  settings                  Json?     // Flexible settings

  // META
  createdAt                 DateTime  @default(now()) @map("created_at")
  updatedAt                 DateTime  @updatedAt @map("updated_at")

  // RELATIONS
  cars                      Car[]
  leads                     Lead[]
  messages                  Message[]
  users                     User[]
  conversationStates        ConversationState[]

  @@map("tenants")
}

enum SslStatus {
  pending
  active
  failed
}

enum PlanType {
  free
  starter
  growth
  pro
}

enum TenantStatus {
  active
  suspended
  trial
  expired
}

// ============================================
// CARS (INVENTORY)
// ============================================

model Car {
  id                  Int       @id @default(autoincrement())
  tenantId            Int       @map("tenant_id")

  // INTERNAL IDENTITY (PRIVATE)
  plateNumber         String?   @map("plate_number") @db.VarChar(20)
  plateNumberClean    String?   @map("plate_number_clean") @db.VarChar(20) // "B1234XYZ"
  stockCode           String?   @map("stock_code") @db.VarChar(20) // "STK-001"

  // PUBLIC IDENTITY (CUSTOMER-FACING)
  displayCode         String    @map("display_code") @db.VarChar(20) // "#A01"
  publicName          String    @map("public_name") @db.VarChar(200) // "Avanza 2020 Hitam #A01"

  // BASIC INFO
  brand               String    @db.VarChar(50)
  model               String    @db.VarChar(100)
  year                Int
  color               String    @db.VarChar(50)
  transmission        Transmission

  // SPECS
  km                  Int
  price               BigInt
  fuelType            String?   @map("fuel_type") @db.VarChar(20)

  // DIFFERENTIATORS
  keyFeatures         String[]  @map("key_features") // ["Velg Racing", "Spoiler"]
  conditionNotes      String?   @map("condition_notes") @db.Text

  // CONTENT
  photos              String[]  // Array of URLs
  primaryPhotoIndex   Int       @default(0) @map("primary_photo_index")
  description         String?   @db.Text

  // STATUS
  status              CarStatus @default(draft)

  // META
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")
  soldAt              DateTime? @map("sold_at")

  // SEO
  slug                String    @db.VarChar(200) // "avanza-2020-hitam-a01"

  // RELATIONS
  tenant              Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  leads               Lead[]

  @@unique([tenantId, displayCode])
  @@unique([tenantId, slug])
  @@index([tenantId, status])
  @@index([tenantId, brand, model, year, color])
  @@index([plateNumberClean])
  @@map("cars")
}

enum Transmission {
  Manual
  Matic
}

enum CarStatus {
  available
  sold
  booking
  draft
}

// ============================================
// LEADS (CUSTOMER INQUIRIES)
// ============================================

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
  @@map("leads")
}

enum LeadStatus {
  new
  hot
  warm
  cold
  closed
  lost
}

enum LeadSource {
  web
  wa
  direct
  referral
}

// ============================================
// MESSAGES (CHAT HISTORY)
// ============================================

model Message {
  id          Int       @id @default(autoincrement())
  tenantId    Int       @map("tenant_id")
  leadId      Int       @map("lead_id")

  // MESSAGE
  sender      MessageSender
  message     String    @db.Text

  // METADATA
  metadata    Json?     // For storing extra data (e.g., button clicks, media URLs)

  // TIMESTAMPS
  createdAt   DateTime  @default(now()) @map("created_at")

  // RELATIONS
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  lead        Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)

  @@index([tenantId, leadId])
  @@map("messages")
}

enum MessageSender {
  customer
  bot
  sales
  system
}

// ============================================
// USERS (ADMIN & SALES)
// ============================================

model User {
  id              Int       @id @default(autoincrement())
  tenantId        Int       @map("tenant_id")

  // IDENTITY
  name            String    @db.VarChar(200)
  email           String    @db.VarChar(200)
  phone           String?   @db.VarChar(20)
  whatsappNumber  String?   @map("whatsapp_number") @db.VarChar(20)
  passwordHash    String    @map("password_hash") @db.Text

  // ROLE
  role            UserRole

  // STATUS
  status          UserStatus @default(active)
  lastLoginAt     DateTime?  @map("last_login_at")

  // META
  createdAt       DateTime   @default(now()) @map("created_at")
  updatedAt       DateTime   @updatedAt @map("updated_at")

  // RELATIONS
  tenant          Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  assignedLeads   Lead[]

  @@unique([tenantId, email])
  @@index([tenantId, role])
  @@map("users")
}

enum UserRole {
  owner
  admin
  sales
}

enum UserStatus {
  active
  inactive
}

// ============================================
// CONVERSATION STATES (BOT STATE MACHINE)
// ============================================

model ConversationState {
  id            Int       @id @default(autoincrement())
  tenantId      Int       @map("tenant_id")

  // USER
  userPhone     String    @map("user_phone") @db.VarChar(20)
  userType      UserType  @map("user_type")

  // STATE
  currentFlow   String    @map("current_flow") @db.VarChar(50) // 'idle', 'upload_car', 'credit_calc'
  currentStep   Int       @default(0) @map("current_step")
  context       Json?     // Temporary data storage

  // EXPIRY
  expiresAt     DateTime  @map("expires_at")

  // META
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // RELATIONS
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, userPhone])
  @@index([tenantId, userPhone, currentFlow])
  @@map("conversation_states")
}

enum UserType {
  customer
  admin
  sales
}
```

### 4.2 Database Indexes (Performance)

**Critical Indexes:**

```sql
-- Tenant lookup (by domain)
CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain);

-- Car search (frequently queried)
CREATE INDEX idx_cars_tenant_status ON cars(tenant_id, status);
CREATE INDEX idx_cars_search ON cars(tenant_id, brand, model, year, color);
CREATE INDEX idx_cars_plate ON cars(plate_number_clean);
CREATE INDEX idx_cars_display_code ON cars(tenant_id, display_code);

-- Lead management
CREATE INDEX idx_leads_tenant_status ON leads(tenant_id, status);
CREATE INDEX idx_leads_customer ON leads(tenant_id, customer_phone);

-- Message history (for bot context)
CREATE INDEX idx_messages_lead ON messages(tenant_id, lead_id);

-- Conversation state (bot state machine)
CREATE INDEX idx_conv_state ON conversation_states(tenant_id, user_phone, current_flow);
```

### 4.3 Sample Data (Seed)

```typescript
// prisma/seed.ts

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Create test tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Showroom Mobil Surabaya',
      slug: 'showroom-surabaya',
      subdomain: 'showroom-surabaya.autoleads.id',
      phone: '031-1234567',
      whatsappNumber: '628123456789',
      email: 'owner@showroom-surabaya.com',
      address: 'Jl. Raya Darmo No. 123, Surabaya',
      city: 'Surabaya',
      mapsUrl: 'https://maps.google.com/?q=-7.257472,112.752088',
      businessHours: {
        mon: '09:00-18:00',
        tue: '09:00-18:00',
        wed: '09:00-18:00',
        thu: '09:00-18:00',
        fri: '09:00-18:00',
        sat: '09:00-18:00',
        sun: 'closed'
      },
      plan: 'growth',
      status: 'active',
      planStartedAt: new Date(),
      planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  });

  // Create owner user
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Owner Showroom',
      email: 'owner@showroom-surabaya.com',
      phone: '081234567890',
      passwordHash: await hashPassword('password123'), // Use bcrypt in real impl
      role: 'owner',
      status: 'active'
    }
  });

  // Create sample cars
  const cars = [
    {
      plateNumber: 'B 1234 XYZ',
      plateNumberClean: 'B1234XYZ',
      stockCode: 'STK-001',
      displayCode: '#A01',
      publicName: 'Avanza 2020 Hitam #A01',
      brand: 'Toyota',
      model: 'Avanza 1.3 G',
      year: 2020,
      color: 'Hitam Metalik',
      transmission: 'Manual',
      km: 45000,
      price: 185000000,
      fuelType: 'Bensin',
      keyFeatures: ['Velg racing 16 inch', 'Spoiler belakang', 'Interior rapi'],
      conditionNotes: 'Kondisi istimewa, service record lengkap, pajak panjang',
      photos: [
        '/uploads/cars/avanza-001-1.jpg',
        '/uploads/cars/avanza-001-2.jpg',
        '/uploads/cars/avanza-001-3.jpg'
      ],
      status: 'available',
      slug: 'avanza-2020-hitam-a01'
    },
    {
      plateNumber: 'B 5678 ABC',
      plateNumberClean: 'B5678ABC',
      stockCode: 'STK-002',
      displayCode: '#A02',
      publicName: 'Avanza 2020 Hitam #A02',
      brand: 'Toyota',
      model: 'Avanza 1.3 G',
      year: 2020,
      color: 'Hitam',
      transmission: 'Manual',
      km: 50000,
      price: 180000000,
      fuelType: 'Bensin',
      keyFeatures: ['Ban baru', 'Service record lengkap'],
      conditionNotes: 'Kondisi baik, siap pakai',
      photos: [
        '/uploads/cars/avanza-002-1.jpg',
        '/uploads/cars/avanza-002-2.jpg'
      ],
      status: 'available',
      slug: 'avanza-2020-hitam-a02'
    },
    {
      plateNumber: 'L 9012 DEF',
      plateNumberClean: 'L9012DEF',
      stockCode: 'STK-003',
      displayCode: '#V01',
      publicName: 'Avanza Veloz 2020 Hitam #V01',
      brand: 'Toyota',
      model: 'Avanza 1.5 Veloz',
      year: 2020,
      color: 'Hitam Metalik',
      transmission: 'Matic',
      km: 40000,
      price: 215000000,
      fuelType: 'Bensin',
      keyFeatures: ['Veloz type', 'Matic', 'Audio upgrade', 'Kamera parkir'],
      conditionNotes: 'Unit istimewa, full original, tidak bekas banjir',
      photos: [
        '/uploads/cars/veloz-001-1.jpg',
        '/uploads/cars/veloz-001-2.jpg',
        '/uploads/cars/veloz-001-3.jpg',
        '/uploads/cars/veloz-001-4.jpg'
      ],
      status: 'available',
      slug: 'avanza-veloz-2020-hitam-v01'
    }
  ];

  for (const car of cars) {
    await prisma.car.create({
      data: {
        ...car,
        tenantId: tenant.id
      }
    });
  }

  console.log('✅ Seed completed!');
  console.log(`Tenant: ${tenant.name}`);
  console.log(`Subdomain: ${tenant.subdomain}`);
  console.log(`Cars created: ${cars.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 5. API ENDPOINTS

### 5.1 Public API (Customer-Facing)

**BASE URL:** `https://{tenant-domain}/api`

#### **GET /api/cars**
List all available cars for current tenant.

**Query Parameters:**
- `search` (string, optional): Search term (brand, model, year)
- `brand` (string, optional): Filter by brand
- `year` (number, optional): Filter by year
- `minPrice` (number, optional): Minimum price
- `maxPrice` (number, optional): Maximum price
- `transmission` (enum, optional): "Manual" or "Matic"
- `page` (number, default: 1): Page number
- `limit` (number, default: 12): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "cars": [
      {
        "id": 101,
        "displayCode": "#A01",
        "publicName": "Avanza 2020 Hitam #A01",
        "brand": "Toyota",
        "model": "Avanza 1.3 G",
        "year": 2020,
        "color": "Hitam Metalik",
        "transmission": "Manual",
        "km": 45000,
        "price": 185000000,
        "keyFeatures": ["Velg racing", "Spoiler"],
        "photos": ["/uploads/cars/avanza-001-1.jpg"],
        "slug": "avanza-2020-hitam-a01"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

#### **GET /api/cars/:slug**
Get single car details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "displayCode": "#A01",
    "publicName": "Avanza 2020 Hitam #A01",
    "brand": "Toyota",
    "model": "Avanza 1.3 G",
    "year": 2020,
    "color": "Hitam Metalik",
    "transmission": "Manual",
    "km": 45000,
    "price": 185000000,
    "fuelType": "Bensin",
    "keyFeatures": ["Velg racing 16 inch", "Spoiler belakang", "Interior rapi"],
    "conditionNotes": "Kondisi istimewa, service record lengkap",
    "photos": [
      "/uploads/cars/avanza-001-1.jpg",
      "/uploads/cars/avanza-001-2.jpg",
      "/uploads/cars/avanza-001-3.jpg"
    ],
    "slug": "avanza-2020-hitam-a01",
    "whatsappLink": "https://wa.me/628123456789?text=Halo%2C%20saya%20tertarik%20dengan%20Toyota%20Avanza%202020%20kode%20%23A01",
    "createdAt": "2025-10-20T10:30:00Z"
  }
}
```

### 5.2 Webhook API (External Integrations)

#### **POST /webhook/fonnte**
Receive incoming WhatsApp messages from Fonnte.

**Headers:**
- `Content-Type: application/json`

**Payload (from Fonnte):**
```json
{
  "device": "628123456789",
  "message": "Ada Avanza 2020?",
  "sender": "6281234567890",
  "type": "text",
  "timestamp": 1697812345
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message processed"
}
```

**Backend Flow:**
1. Identify tenant by `device` (WhatsApp number)
2. Check if customer or admin (by sender number)
3. Process message accordingly:
   - Customer → Bot Customer AI flow
   - Admin → Bot Admin flow
4. Send response via Fonnte API
5. Save to messages table

### 5.3 Admin API (Dashboard)

**BASE URL:** `https://{tenant-domain}/api/admin`

**Authentication:** JWT token in `Authorization: Bearer <token>` header

#### **POST /api/admin/auth/login**
Login to dashboard.

**Request:**
```json
{
  "email": "owner@showroom.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Owner Showroom",
      "email": "owner@showroom.com",
      "role": "owner"
    },
    "tenant": {
      "id": 1,
      "name": "Showroom Mobil Surabaya",
      "subdomain": "showroom-surabaya.autoleads.id",
      "customDomain": "showroommobil.com"
    }
  }
}
```

#### **GET /api/admin/dashboard**
Get dashboard overview stats.

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalCars": 50,
      "availableCars": 42,
      "soldCars": 8,
      "totalLeads": 234,
      "newLeads": 12,
      "hotLeads": 18
    },
    "recentLeads": [
      {
        "id": 501,
        "customerName": "Ahmad",
        "customerPhone": "081234567890",
        "carDisplayCode": "#A01",
        "status": "hot",
        "createdAt": "2025-10-23T14:30:00Z"
      }
    ],
    "leadsTrend": [
      { "date": "2025-10-17", "count": 8 },
      { "date": "2025-10-18", "count": 12 },
      { "date": "2025-10-19", "count": 15 }
    ]
  }
}
```

#### **GET /api/admin/cars**
List cars (admin view with internal data).

**Response:** Similar to public API but includes:
- `plateNumber` (internal)
- `stockCode` (internal)
- All statuses (draft, booking, etc)

#### **POST /api/admin/cars**
Create car (manual upload via dashboard).

**Request:**
```json
{
  "plateNumber": "B 1234 XYZ",
  "brand": "Toyota",
  "model": "Avanza 1.3 G",
  "year": 2020,
  "color": "Hitam",
  "transmission": "Manual",
  "km": 45000,
  "price": 185000000,
  "fuelType": "Bensin",
  "keyFeatures": ["Velg racing", "Spoiler"],
  "conditionNotes": "Kondisi istimewa",
  "photos": ["base64-encoded-image-1", "base64-encoded-image-2"],
  "status": "available"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "displayCode": "#A01",
    "slug": "avanza-2020-hitam-a01",
    "message": "Car created successfully"
  }
}
```

#### **PATCH /api/admin/cars/:id**
Update car details.

#### **DELETE /api/admin/cars/:id**
Delete car.

#### **GET /api/admin/leads**
List all leads.

#### **GET /api/admin/leads/:id**
Get lead details including conversation history.

**Response:**
```json
{
  "success": true,
  "data": {
    "lead": {
      "id": 501,
      "customerName": "Ahmad",
      "customerPhone": "081234567890",
      "car": {
        "displayCode": "#A01",
        "publicName": "Avanza 2020 Hitam #A01"
      },
      "status": "hot",
      "assignedTo": {
        "name": "Sales Budi",
        "phone": "081234567891"
      },
      "notes": "Customer tertarik, minta nego harga",
      "createdAt": "2025-10-23T10:00:00Z"
    },
    "messages": [
      {
        "sender": "customer",
        "message": "Ada Avanza 2020?",
        "createdAt": "2025-10-23T10:00:15Z"
      },
      {
        "sender": "bot",
        "message": "Halo! Ada nih Toyota Avanza 2020...",
        "createdAt": "2025-10-23T10:00:18Z"
      },
      {
        "sender": "customer",
        "message": "Bisa nego?",
        "createdAt": "2025-10-23T10:02:30Z"
      },
      {
        "sender": "sales",
        "message": "Harga masih bisa nego Pak. Budget berapa?",
        "createdAt": "2025-10-23T10:05:00Z"
      }
    ]
  }
}
```

#### **POST /api/admin/domain/verify**
Verify custom domain DNS settings.

**Request:**
```json
{
  "customDomain": "showroommobil.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "sslStatus": "active",
    "message": "Domain verified successfully"
  }
}
```

---

## 6. USER FLOWS

### 6.1 Customer Journey: Browse → Chat → Lead

**Flow Diagram:**

```
[Customer Google Search]
    ↓
"showroom mobil bekas Surabaya"
    ↓
[Click website from search results]
    ↓
Homepage (showroommobil.com)
    ↓
[Search "Avanza 2020"]
    ↓
Car Listing Page (3 results: #A01, #A02, #V01)
    ↓
[Click #A01 - the one with velg racing]
    ↓
Car Detail Page
- Photo gallery (5 photos, swipeable)
- Specs table
- Price: Rp 185.000.000
- Key features: Velg racing, Spoiler
- Sticky WA button at bottom
    ↓
[Click "💬 Chat via WhatsApp"]
    ↓
WhatsApp opens with pre-filled message:
"Halo, saya tertarik dengan Toyota Avanza 2020 kode #A01 seharga Rp 185.000.000"
    ↓
Customer press Send
    ↓
Bot responds (<3s):
"Halo! Terima kasih minat Avanza #A01 🚗
Mobilnya kondisi istimewa, velg racing + spoiler.
Mau tanya apa? (harga, kredit, lihat langsung?)"
    ↓
Customer: "Bisa nego ga?"
    ↓
Bot: "Harga masih bisa nego kok 😊
Biar sales kami bantu ya, Pak Budi akan chat sekarang..."
    ↓
[Bot creates Lead in DB + notifies Sales Budi]
    ↓
Sales Budi takes over:
"Halo Pak, saya Budi. Tadi lihat Avanza #A01 ya?
Untuk harga bisa kita nego. Budget Bapak berapa?"
    ↓
[Negotiation continues...]
    ↓
Customer: "Ok deal, kapan bisa lihat?"
    ↓
Sales: "Besok jam 10 bisa Pak? Showroom kami di..."
    ↓
[Deal closed! 🎉]
```

### 6.2 Owner Journey: Upload Car via WA

**Flow Diagram:**

```
[Mobil baru masuk showroom - 06:00]
    ↓
Owner ambil HP, foto 5 foto (06:05)
    ↓
Owner: Open WhatsApp, chat Bot Admin
    ↓
Owner: "/upload"
    ↓
Bot (<1s): "Kirim foto mobil (max 10 foto)"
    ↓
Owner: [Send 5 photos via WA]
    ↓
Bot (<2s): "✅ 5 foto diterima!

Sekarang info mobilnya. Format:
[Plat] | [Merek Model] | [Tahun] | [Harga] | [KM] | [Transmisi] | [Warna]

Contoh:
B1234XYZ | Toyota Avanza 1.3 G | 2020 | 185jt | 45rb | Manual | Hitam"
    ↓
Owner (type once, send):
"B1234XYZ | Toyota Avanza 1.3 G | 2020 | 185jt | 45rb | Manual | Hitam"
    ↓
Bot (<2s): "Oke! Data diterima.

🚗 Mobil: Toyota Avanza 1.3 G 2020
💰 Harga: Rp 185.000.000
📍 KM: 45.000 km
⚙️ Manual | 🎨 Hitam

━━━━━━━━━━━━━━━━━━━
INTERNAL (Buat Bapak):
📋 Plat: B 1234 XYZ
🏷️ Stock: STK-045

PUBLIC (Customer lihat):
📱 Kode: #A01 ← (auto-generated)
━━━━━━━━━━━━━━━━━━━

Ada fitur khusus? (optional)
Contoh: Velg racing, spoiler

Atau ketik SKIP"
    ↓
Owner: "Velg racing, spoiler"
    ↓
Bot: "Perfect! Ada catatan kondisi? (optional)
Atau ketik SKIP"
    ↓
Owner: "SKIP"
    ↓
Bot (<1s): "Mantap! Recap final:

🚗 Toyota Avanza 1.3 G 2020
📋 Plat: B 1234 XYZ (internal)
📱 Kode: #A01 (customer lihat)
💰 Rp 185.000.000
✨ Velg racing, spoiler

Link: https://showroommobil.com/avanza-2020-hitam-a01

Publish sekarang?
1 = YA, langsung live
2 = EDIT dulu
3 = SIMPAN DRAFT"
    ↓
Owner: "1"
    ↓
Bot (<1s): "✅ BERHASIL PUBLISH!

Unit #A01 (B 1234 XYZ) sudah live!

Link: https://showroommobil.com/avanza-2020-hitam-a01

Customer sudah bisa lihat & chat sekarang 🚀

━━━━━━━━━━━━━━━━━━━
Command cepat:
/status B1234XYZ atau /status #A01
/edit B1234XYZ
/foto B1234XYZ
━━━━━━━━━━━━━━━━━━━

Upload mobil lagi? Ketik /upload"
    ↓
[Car instantly live on website - 06:10]
    ↓
Total time: 5 menit! (vs. 1.5 jam manual)
```

### 6.3 Owner Journey: Update Status (Sold)

**Flow Diagram:**

```
[Customer datang, deal closed, transfer done - 14:00]
    ↓
Owner: Open WhatsApp, chat Bot Admin
    ↓
Owner: "/status B1234XYZ terjual"
    ↓
Bot (<1s): "🔍 Cari unit B 1234 XYZ...

Ketemu!

🚗 Toyota Avanza 1.3 G 2020 Hitam
📋 Plat: B 1234 XYZ (Internal)
📱 Kode: #A01 (Customer lihat)
💰 Rp 185.000.000

Update status jadi TERJUAL?
Ketik: YA"
    ↓
Owner: "YA"
    ↓
Bot (<1s): "✅ Status diupdate!

Unit B 1234 XYZ (#A01) sekarang:
❌ Tidak muncul di website
✅ Ditandai TERJUAL di dashboard
📊 Tercatat di laporan penjualan

━━━━━━━━━━━━━━━━━━━
Quick Stats Hari Ini:
• Mobil terjual: 2 unit
• Revenue: Rp 365jt
• Lead masuk: 8 leads
━━━━━━━━━━━━━━━━━━━

Update mobil lain? Ketik /status [plat]"
    ↓
[Car removed from website instantly - 14:00]
    ↓
Total time: 10 detik!
```

### 6.4 Sales Journey: Receive Lead Notification

**Flow Diagram:**

```
[Customer chat bot, mention "bisa nego?" - trigger hot lead]
    ↓
Bot detects intent: negotiation → hot lead → notify sales
    ↓
Sales Budi receives WA notification:
"🔥 LEAD BARU!

Nama: Ahmad (0812-3456-7890)
Minat: Toyota Avanza 2020 #A01
Budget: Nego dari 185jt
Status: HOT - mention mau nego

Chat history: [link to dashboard]

Mau ambil lead ini?
1 = AMBIL - saya yang handle
2 = SKIP - kasih ke sales lain"
    ↓
Sales Budi: "1"
    ↓
Bot: "✅ Lead Ahmad sekarang milik Anda.

Customer phone: 0812-3456-7890
Silakan chat langsung ke customer.

━━━━━━━━━━━━━━━━━━━
Context:
- Minat: Avanza #A01
- Budget: Nego dari 185jt
- Lead score: HOT (8/10)

Chat history:
[Customer] Ada Avanza 2020?
[Bot] Ada 3 unit...
[Customer] Yang #A01, bisa nego?
[Bot] Saya hubungkan sales ya...

Good luck closing! 💪
━━━━━━━━━━━━━━━━━━━"
    ↓
Sales Budi: Opens customer WA, starts conversation
"Halo Pak Ahmad, saya Budi dari Showroom Mobil Surabaya.
Tadi lihat Avanza #A01 ya? Yang ada velg racing.
Untuk harga bisa kita nego Pak. Budget Bapak berapa ya?"
    ↓
[Negotiation & closing...]
```

### 6.5 Admin Journey: Setup Custom Domain

**Flow Diagram:**

```
[Owner login dashboard]
    ↓
Navigate to: Settings → Domain
    ↓
Current domain: showroom-surabaya.autoleads.id

[Click "Upgrade to Custom Domain"]
    ↓
Form: Custom Domain
Input: [showroommobil.com]
    ↓
[Click "Next: Setup DNS"]
    ↓
Instructions shown:

"Step 1: Daftar Cloudflare (free)
1. Go to cloudflare.com
2. Add site: showroommobil.com
3. Copy nameservers provided

Step 2: Update nameservers at registrar
1. Login to your domain registrar (Niagahoster, Rumahweb, etc)
2. Change nameservers to:
   ns1.cloudflare.com
   ns2.cloudflare.com

Step 3: Configure DNS in Cloudflare
1. Add A record:
   Type: A
   Name: @
   Value: 103.127.132.123 (our server IP)
   Proxied: ON (orange cloud)

2. Add A record for www:
   Type: A
   Name: www
   Value: 103.127.132.123
   Proxied: ON

3. SSL Mode: Full (strict)

Step 4: Wait 5-10 minutes, then click 'Verify Domain'"
    ↓
[Owner completes steps in Cloudflare]
    ↓
[Click "Verify Domain" in dashboard]
    ↓
System checks DNS...
    ↓
✅ DNS verified!
✅ SSL certificate active (Cloudflare)
✅ HTTPS enabled
    ↓
"🎉 Success! Your website is now live at:
https://showroommobil.com

Old URL automatically redirects:
https://showroom-surabaya.autoleads.id → https://showroommobil.com"
    ↓
[Domain fully active - customers see custom domain]
```

---

## 7. DEVELOPMENT PHASES

### 7.1 PHASE 1: MLP Foundation (Week 1-2)

**Timeline:** 10 working days
**Goal:** Launch working SaaS with 3 core features

#### **Week 1: Infrastructure + Web Katalog + Bot Customer**

**DAY 1: Project Setup + Database**

Tasks:
- [ ] Initialize Bun project
- [ ] Setup Hono server
- [ ] Configure Prisma with PostgreSQL
- [ ] Create all database tables (run migrations)
- [ ] Seed test data (1 tenant + 3 cars)
- [ ] Setup Docker container
- [ ] Deploy to Coolify (staging)

**Agent Assignment:** `/agents system-architect` → Design initial setup
**Agent Assignment:** `/agents senior-code-reviewer` → Review schema & setup

**Deliverables:**
- ✅ Working Bun + Hono + Prisma setup
- ✅ Database tables created
- ✅ Seed data loaded
- ✅ Staging environment deployed

---

**DAY 2: Multi-Tenant Middleware + Subdomain Routing**

Tasks:
- [ ] Create tenant middleware (domain → tenant lookup)
- [ ] Test tenant isolation (data scoped to tenant_id)
- [ ] Setup subdomain routing (*.autoleads.id)
- [ ] Create tenant context (available in all routes)
- [ ] Add security checks (prevent cross-tenant data access)

**Agent Assignment:** `/agents system-architect` → Review multi-tenant approach
**Agent Assignment:** `/agents senior-code-reviewer` → Security audit (tenant isolation)

**Deliverables:**
- ✅ Tenant middleware working
- ✅ Subdomain routing functional
- ✅ Data isolation verified

---

**DAY 3: Web Katalog - Homepage + Listing**

Tasks:
- [ ] Create React components structure
- [ ] Homepage:
  - Hero section (showroom name + tagline)
  - Search bar (prominent)
  - Featured cars grid (6 newest/best)
- [ ] Car Listing Page:
  - Grid view (responsive: 1 col mobile, 3 col desktop)
  - Filters: Brand, Year, Price range, Transmission
  - Search functionality (text input → query DB)
  - Pagination (12 per page)
- [ ] Mobile-responsive styling (Tailwind)

**Agent Assignment:** `/agents premium-ux-designer` → Review UI/UX
**Agent Assignment:** `/agents code-refactorer` → Optimize components

**Deliverables:**
- ✅ Homepage rendered with tenant branding
- ✅ Car listing functional with filters
- ✅ Mobile-responsive

---

**DAY 4: Web Katalog - Car Detail Page + SEO**

Tasks:
- [ ] Car Detail Page:
  - Photo gallery (swipeable, 5-10 photos)
  - Specs table (year, km, transmission, etc)
  - Key features badges
  - Condition notes
  - Price (prominent)
  - Sticky WA button (bottom on mobile)
- [ ] SEO optimization:
  - Dynamic meta tags (title, description, OG image)
  - Schema.org structured data (Product, Car)
  - Sitemap.xml generation (auto-update on new car)
  - robots.txt
- [ ] Test Lighthouse score (target: >90)

**Agent Assignment:** `/agents premium-ux-designer` → Review car detail UX
**Agent Assignment:** `/agents senior-code-reviewer` → SEO audit

**Deliverables:**
- ✅ Car detail page complete
- ✅ SEO tags working
- ✅ Lighthouse score >90

---

**DAY 5: WhatsApp Integration + Bot Customer AI**

Tasks:
- [ ] Fonnte account setup + API key
- [ ] Webhook endpoint: POST /webhook/fonnte
- [ ] Webhook handler:
  - Parse incoming message
  - Identify tenant (by device/WA number)
  - Identify sender (customer vs admin)
  - Route to appropriate flow
- [ ] Bot Customer AI logic:
  - Intent recognition (5 intents: inquiry, harga, lokasi, kredit, other)
  - Database query (find matching cars)
  - LLM integration (Gemini Pro API)
  - RAG pattern implementation
  - Response generation
  - Lead auto-capture (create lead in DB)
- [ ] Send response via Fonnte API
- [ ] Test with real WA messages

**Agent Assignment:** `/agents system-architect` → Design bot architecture
**Agent Assignment:** `/agents senior-code-reviewer` → Review LLM integration & security
**Agent Assignment:** `/agents code-reviewer-debugger` → Debug webhook issues

**Deliverables:**
- ✅ Webhook receiving messages
- ✅ Bot responding <3s
- ✅ 5 intents working
- ✅ Leads captured in DB

---

#### **Week 2: Bot Admin WA + Polish + Launch**

**DAY 1: Bot Admin - Upload Flow (Part 1)**

Tasks:
- [ ] Conversation state management:
  - Create conversation_states table entry
  - Track upload flow steps
  - Handle state expiry (30 min timeout)
- [ ] Upload flow - Step 1: Photos
  - Detect `/upload` command
  - Request photos (max 10)
  - Receive photos via Fonnte webhook
  - Download & save photos (compress to 500KB each)
  - Store photo URLs in conversation context
- [ ] Upload flow - Step 2: Car info
  - Request car info (format instruction)
  - Parse text input (regex/NLP):
    - Plat nomor: B 1234 XYZ
    - Brand + Model: Toyota Avanza 1.3 G
    - Year: 2020
    - Price: 185jt → 185000000
    - KM: 45rb → 45000
    - Transmission: Manual/Matic
    - Color: Hitam

**Agent Assignment:** `/agents system-architect` → Design state machine
**Agent Assignment:** `/agents code-reviewer-debugger` → Debug parsing logic

**Deliverables:**
- ✅ Upload command detected
- ✅ Photos received & stored
- ✅ Info parsed correctly

---

**DAY 2: Bot Admin - Upload Flow (Part 2)**

Tasks:
- [ ] Upload flow - Step 3: Optional fields
  - Request key features (optional)
  - Request condition notes (optional)
  - Allow SKIP
- [ ] Upload flow - Step 4: Confirmation
  - Show recap (internal + public data)
  - Display code auto-generation (#A01, #A02, etc)
  - Generate URL slug
  - Request confirmation (1=YA, 2=EDIT, 3=DRAFT)
- [ ] Upload flow - Step 5: Publish
  - Insert car to database
  - Upload photos to storage
  - Generate slug & SEO metadata
  - Send success message with link
  - Clear conversation state
- [ ] Test entire upload flow end-to-end

**Agent Assignment:** `/agents senior-code-reviewer` → Review upload security (file validation)
**Agent Assignment:** `/agents code-refactorer` → Refactor upload flow (DRY principle)

**Deliverables:**
- ✅ Full upload flow working
- ✅ Car published to website instantly
- ✅ Display code (#A01) auto-generated
- ✅ Success message with link sent

---

**DAY 3: Bot Admin - Other Commands**

Tasks:
- [ ] Command: `/status [plat/code] [status]`
  - Parse plat or display code
  - Find car in DB (fuzzy match if typo)
  - Confirm with owner
  - Update status (available, sold, booking, draft)
  - Update website (remove if sold)
- [ ] Command: `/list`
  - Show all cars (paginated, 5 per message)
  - Display: #A01 - Avanza 2020 - Available
- [ ] Command: `/help`
  - Show all available commands
- [ ] Natural language parsing:
  - "Avanza hitam yang kemarin udah laku" → detect intent & car
  - "Update #A01 jadi terjual" → parse command

**Agent Assignment:** `/agents system-architect` → Design command parser
**Agent Assignment:** `/agents code-reviewer-debugger` → Debug NLP parsing

**Deliverables:**
- ✅ All commands working
- ✅ Natural language understood
- ✅ Fuzzy matching for typos

---

**DAY 4: Integration Testing + Bug Fixes**

Tasks:
- [ ] End-to-end testing:
  - Upload car via WA → verify live on website
  - Customer search web → find car → click WA → bot responds
  - Bot captures lead → verify in database
  - Owner updates status → verify website updated
- [ ] Edge case testing:
  - Similar cars (3x Avanza 2020 Hitam) → bot differentiates
  - Typo in plat nomor → fuzzy match suggests
  - Upload without plat → TEMP-001 generated
  - Customer sends 20 messages → rate limiting works
  - LLM API error → fallback message sent
- [ ] Performance testing:
  - 10 concurrent customer chats → bot responds <3s
  - Website load test (100 concurrent users)
- [ ] Fix all bugs found

**Agent Assignment:** `/agents code-reviewer-debugger` → Find & fix bugs
**Agent Assignment:** `/agents senior-code-reviewer` → Final code review

**Deliverables:**
- ✅ All flows tested & working
- ✅ No critical bugs
- ✅ Performance acceptable

---

**DAY 5: Production Deployment + Documentation**

Tasks:
- [ ] Production deployment:
  - Deploy to production (Coolify)
  - Configure production database (backups enabled)
  - Setup environment variables (secure)
  - Enable HTTPS (Cloudflare SSL)
  - Configure Fonnte webhook (production URL)
- [ ] Seed production data:
  - Create first customer tenant (showroom partner)
  - Upload 20-30 real cars (from partner)
  - Configure branding (logo, colors)
- [ ] Documentation:
  - User manual for owner (upload via WA, commands)
  - User manual for sales (handle leads)
  - Troubleshooting guide (common issues)
  - Admin credentials handover
- [ ] Final checks:
  - Website accessible (subdomain)
  - Bot responding (WA number active)
  - All features working

**Agent Assignment:** `/agents lumiku-deployment-specialist` → Handle deployment
**Agent Assignment:** `/agents git-commit-helper` → Create deployment commit

**Deliverables:**
- ✅ Production deployed & stable
- ✅ First tenant active
- ✅ 20-30 cars live on website
- ✅ Documentation complete
- ✅ Ready for go-live!

---

### 7.2 PHASE 2: Training & Soft Launch (Week 3)

**Timeline:** 5 working days
**Goal:** Showroom fully onboarded, real customers using platform

**DAY 1: Owner Training**

Tasks:
- [ ] Schedule training session (2 hours, video call or on-site)
- [ ] Training agenda:
  - Platform overview (15 min)
  - Upload mobil via WA (30 min hands-on)
  - Commands: /status, /list, /help (15 min)
  - Monitor leads di dashboard (30 min)
  - Q&A (30 min)
- [ ] Hands-on practice:
  - Owner uploads 5 mobil while trainer watches
  - Owner updates status 2 mobil
  - Owner views leads di dashboard
- [ ] Provide cheat sheet (printed or PDF)

**Deliverables:**
- ✅ Owner confident using platform
- ✅ Owner uploads 10+ mobil independently

---

**DAY 2: Sales Training**

Tasks:
- [ ] Schedule training sessions (2 hours per batch, 2 batches for 5+ sales)
- [ ] Training agenda:
  - How bot works (10 min)
  - How to receive lead notification (10 min)
  - How to take over from bot (20 min)
  - How to view chat history (15 min)
  - Best practices (30 min):
    - Respond fast (<10 min from notification)
    - Reference car by display code (#A01)
    - Use showroom WhatsApp etiquette
  - Q&A (15 min)
- [ ] Test scenarios:
  - Simulate customer chat → sales receives notification → sales takes over
- [ ] Provide sales cheat sheet

**Deliverables:**
- ✅ All sales trained
- ✅ Sales know how to handle leads

---

**DAY 3-4: Soft Launch + Monitoring**

Tasks:
- [ ] Website go-live (public URL announced)
- [ ] WA bot go-live (public WA number announced)
- [ ] Monitor closely (24 hours):
  - First 10 customer chats → watch bot responses
  - Any errors? → fix immediately
  - Response time? → optimize if >3s
  - Lead capture working? → verify DB
- [ ] Daily check-in with showroom owner (30 min):
  - Any issues?
  - Customer feedback?
  - Anything confusing?
- [ ] Quick fixes:
  - Tweak bot responses if not natural
  - Adjust LLM prompt if hallucinating
  - Fix UI bugs if found

**Agent Assignment:** `/agents code-reviewer-debugger` → Debug production issues
**Agent Assignment:** `/agents autoleads-deployment-specialist` → Monitor deployment

**Deliverables:**
- ✅ First 10 customers served successfully
- ✅ Bot performing well (response quality + speed)
- ✅ No critical issues

---

**DAY 5: Review + Iterate**

Tasks:
- [ ] Collect usage data:
  - Total customer chats: __
  - Total leads captured: __
  - Bot resolution rate (no human needed): __%
  - Average response time: __s
  - Customer satisfaction (ask 5 customers): __/5
- [ ] Showroom feedback session (1 hour):
  - What works well?
  - What's confusing?
  - What's missing?
  - Feature requests?
- [ ] Prioritize improvements (Phase 3/4)
- [ ] Measure success metrics:
  - Owner "Aha moment"? (got lead at 2am, etc)
  - Sales using leads effectively?
  - Cars uploaded via WA? (vs. manual)
- [ ] Request testimonial (if positive experience)

**Deliverables:**
- ✅ Usage data collected
- ✅ Feedback documented
- ✅ Phase 3/4 roadmap refined
- ✅ Success metrics measured

---

### 7.3 PHASE 3: Custom Domain + Dashboard (Week 4)

**Timeline:** 5 working days
**Goal:** Professional branding + backup management

**DAY 1-2: Custom Domain Setup**

Tasks:
- [ ] Domain verification system:
  - API endpoint: POST /api/admin/domain/verify
  - Check DNS A record (dig/dns.resolve4)
  - Validate domain not used by other tenant
  - Update tenant.customDomain in DB
- [ ] SSL status tracking:
  - Assume Cloudflare handles SSL
  - Store SSL status in DB
- [ ] Redirect middleware:
  - If custom domain active → redirect subdomain to custom (301)
  - Preserve URL path & query params
- [ ] Dashboard UI:
  - Domain settings page
  - Step-by-step wizard (Cloudflare setup instructions)
  - Verify button (with loading state)
  - Success/error messages
- [ ] Documentation:
  - "How to setup custom domain" guide (with screenshots)
  - Troubleshooting common DNS issues
- [ ] Test with real domain (e.g., showroommobil.com)

**Agent Assignment:** `/agents system-architect` → Design domain verification flow
**Agent Assignment:** `/agents senior-code-reviewer` → Security review (domain validation)
**Agent Assignment:** `/agents autoleads-deployment-specialist` → Handle DNS/SSL issues

**Deliverables:**
- ✅ Custom domain working (showroommobil.com)
- ✅ SSL active (HTTPS)
- ✅ Auto-redirect from subdomain
- ✅ Documentation complete

---

**DAY 3-4: Dashboard Admin (Minimal)**

Tasks:
- [ ] Authentication:
  - Login page (email + password)
  - JWT token generation
  - Protected routes (middleware)
  - Logout
- [ ] Dashboard Overview:
  - Stats cards: Total mobil, Available, Sold, Total leads, New leads
  - Chart: Leads trend (last 7 days, simple line chart)
  - Recent leads table (last 10, with car + status)
- [ ] Inventory Management:
  - List cars (table view: display code, public name, price, status)
  - Search & filters (brand, year, status)
  - View car details (modal or separate page)
  - Edit car (form with all fields)
  - Delete car (with confirmation)
  - Manual upload car (form - backup if WA bot down)
- [ ] Lead Management:
  - List leads (table: customer, car, status, date)
  - View lead detail (customer info + conversation history)
  - Assign lead to sales (dropdown)
  - Update lead status
  - Add notes
- [ ] Settings:
  - Showroom profile (name, phone, address, hours)
  - Domain settings (link to domain setup page)
  - Users management (add/remove admin/sales) - basic

**Agent Assignment:** `/agents premium-ux-designer` → Design dashboard UI
**Agent Assignment:** `/agents code-refactorer` → Refactor dashboard components
**Agent Assignment:** `/agents senior-code-reviewer` → Review authentication security

**Deliverables:**
- ✅ Dashboard accessible (login working)
- ✅ Overview page showing stats
- ✅ Inventory CRUD functional
- ✅ Lead management working
- ✅ Backup method for upload (if WA bot down)

---

**DAY 5: Testing + Deploy**

Tasks:
- [ ] Test all dashboard features:
  - Login/logout
  - View stats
  - Edit car details
  - Manual upload car
  - View lead conversation history
  - Assign lead to sales
- [ ] Mobile responsive check (dashboard should work on tablet)
- [ ] Deploy to production
- [ ] Update documentation (dashboard user guide)
- [ ] Train showroom owner on dashboard (30 min session)

**Agent Assignment:** `/agents code-reviewer-debugger` → Final bug hunt
**Agent Assignment:** `/agents autoleads-deployment-specialist` → Production deployment

**Deliverables:**
- ✅ Dashboard production-ready
- ✅ No critical bugs
- ✅ Owner trained on dashboard

---

### 7.4 PHASE 4: Advanced Features (Week 5-8+)

**Optional features based on demand and feedback.**

**Week 5: Credit Calculator + Smart Recommendations**
**Week 6: Analytics Dashboard + Lead Scoring**
**Week 7: Broadcast System + Sales Tools**
**Week 8: Video Support + Blog/SEO + Advertising Pixels**

(Full specs available upon request - not critical for MLP launch)

---

## 8. AGENT ASSIGNMENT MAP

### 8.1 Agent Roles & Responsibilities

**When to use which agent throughout development:**

| Phase | Task | Primary Agent | Secondary Agent | Purpose |
|-------|------|---------------|-----------------|---------|
| **Planning** | Architecture design | `/agents system-architect` | `/agents staff-engineer` | Design scalable multi-tenant system |
| **Planning** | Database schema review | `/agents system-architect` | `/agents senior-code-reviewer` | Validate schema, indexes, relationships |
| **Planning** | UX/UI design | `/agents premium-ux-designer` | - | Design user-friendly flows |
| **Dev - Setup** | Project initialization | - | `/agents system-architect` | Setup Bun + Hono + Prisma |
| **Dev - Backend** | API endpoints | - | `/agents senior-code-reviewer` | Review security, performance |
| **Dev - Backend** | LLM integration | `/agents system-architect` | `/agents senior-code-reviewer` | RAG pattern design + security |
| **Dev - Backend** | Multi-tenant middleware | `/agents system-architect` | `/agents senior-code-reviewer` | Data isolation critical |
| **Dev - Frontend** | Component structure | `/agents code-refactorer` | `/agents premium-ux-designer` | Clean, reusable components |
| **Dev - Frontend** | UI polish | `/agents premium-ux-designer` | - | Mobile-responsive, accessible |
| **Dev - Bot** | WhatsApp integration | `/agents system-architect` | `/agents code-reviewer-debugger` | Webhook reliability |
| **Dev - Bot** | Conversation state machine | `/agents system-architect` | `/agents senior-code-reviewer` | State management design |
| **Dev - Bot** | Intent recognition | `/agents system-architect` | `/agents code-reviewer-debugger` | NLP logic |
| **Testing** | Bug finding | `/agents code-reviewer-debugger` | - | Find & fix bugs |
| **Testing** | Security audit | `/agents senior-code-reviewer` | - | SQL injection, XSS, auth bypass |
| **Testing** | Performance optimization | `/agents senior-code-reviewer` | - | Query optimization, caching |
| **Deployment** | Production deploy | `/agents autoleads-deployment-specialist` | - | Docker, DNS, SSL, monitoring |
| **Deployment** | Troubleshooting | `/agents autoleads-deployment-specialist` | `/agents code-reviewer-debugger` | Fix deployment issues |
| **Documentation** | Code documentation | `/agents staff-engineer` | - | Write clear docs |
| **Git** | Commit messages | `/agents git-commit-helper` | - | Professional commits |
| **Refactoring** | Code cleanup | `/agents code-refactorer` | - | DRY, SOLID principles |
| **Review** | Pre-release review | `/agents senior-code-reviewer` | `/agents premium-ux-designer` | Final quality check |

### 8.2 Concurrent Agent Usage (Parallel Work)

**Scenarios where multiple agents can work simultaneously:**

**Scenario 1: After completing a major feature (e.g., Bot Customer AI)**

Run in parallel:
```bash
/agents senior-code-reviewer
Review Bot Customer AI implementation for:
- Security vulnerabilities (LLM injection, webhook validation)
- Performance issues (response time, database queries)
- Code quality

/agents code-refactorer
Refactor bot logic files:
- backend/src/bot/customer-bot.ts
- backend/src/bot/intent-recognition.ts
Extract common patterns, improve readability
```

**Scenario 2: Before production deployment**

Run in parallel:
```bash
/agents senior-code-reviewer
Conduct final security audit:
- Authentication flows
- API endpoints (authorization checks)
- Database queries (SQL injection prevention)
- File uploads (validation, sanitization)

/agents autoleads-deployment-specialist
Prepare production deployment:
- Docker configuration review
- Environment variables checklist
- Database migration plan
- Monitoring setup
```

**Scenario 3: UI/UX + Backend development (different team members)**

Run in parallel:
```bash
/agents premium-ux-designer
Design car detail page:
- Photo gallery layout
- Specs table design
- Mobile responsive considerations
- WhatsApp CTA placement

/agents system-architect
Design API for car detail page:
- Endpoint structure
- Data shape
- Caching strategy
- SEO metadata generation
```

### 8.3 Agent Workflow: Day-by-Day Example (Week 1, Day 5)

**Task: Build WhatsApp Bot Customer AI**

**Morning (9am-12pm): Architecture & Setup**

1. **Start with System Architect:**
```bash
/agents system-architect

Task: Design WhatsApp bot architecture for AutoLeads customer service.

Requirements:
- Receive messages from Fonnte webhook
- Identify tenant by WhatsApp number
- Query database for matching cars
- Integrate with Gemini Pro LLM (RAG pattern)
- Respond within 3 seconds
- Auto-capture leads
- Handle 10 concurrent conversations

Provide:
- System architecture diagram
- Data flow (webhook → DB → LLM → response)
- State management approach
- Error handling strategy
- Cost optimization (LLM API)
```

2. **Implement based on architect's design** (3-4 hours coding)

**Afternoon (1pm-3pm): Code Review**

3. **Run Senior Code Reviewer:**
```bash
/agents senior-code-reviewer

Review the WhatsApp bot implementation:
- backend/src/webhook/fonnte.ts
- backend/src/bot/customer-bot.ts
- backend/src/bot/llm-integration.ts

Focus on:
- Security: Webhook signature validation, input sanitization
- Performance: Response time optimization, database query efficiency
- Error handling: LLM API failures, database errors, network issues
- Code quality: Readability, maintainability, type safety
```

**Late Afternoon (3pm-5pm): Bug Fixes & Polish**

4. **If bugs found, use Debugger:**
```bash
/agents code-reviewer-debugger

Issue: Bot sometimes responds with wrong car details.

Context:
- Customer asks "Ada Avanza 2020?"
- Bot shows Xenia 2019 instead
- Database has 3 Avanza 2020 available

Debug:
- Intent recognition logic
- Database query (search matching)
- LLM context injection
```

5. **Final refactor:**
```bash
/agents code-refactorer

Refactor bot customer service logic:
- backend/src/bot/customer-bot.ts (250 lines, getting complex)

Improvements needed:
- Extract intent recognition to separate module
- Create LLM prompt builder class
- Improve readability of conversation flow
```

**End of Day: Commit**

6. **Create professional commit:**
```bash
/agents git-commit-helper

Create commit for:
- WhatsApp bot customer AI implementation
- Fonnte webhook handler
- LLM integration (Gemini Pro)
- RAG pattern for car inquiry
- Lead auto-capture
- Intent recognition (5 intents)
```

---

## 9. TESTING & QA CHECKLIST

### 9.1 Unit Testing (Optional for MLP, Recommended for Phase 2+)

**Backend:**
- [ ] Tenant middleware (identify tenant by domain)
- [ ] Display code generation (#A01, #A02, etc)
- [ ] Slug generation (avanza-2020-hitam-a01)
- [ ] Car search query (brand, model, year filters)
- [ ] Intent recognition (classify customer message)
- [ ] LLM prompt builder (inject car data correctly)
- [ ] Price formatting (185000000 → Rp 185.000.000)

**Frontend:**
- [ ] Car card component (displays correctly)
- [ ] Search input (queries on enter/button click)
- [ ] Filter components (updates URL params)
- [ ] Photo gallery (swipeable)

### 9.2 Integration Testing (CRITICAL for MLP)

**End-to-End Flows:**

**Test 1: Customer Browse → Chat → Lead**
- [ ] Customer opens website (subdomain or custom domain)
- [ ] Search "Avanza 2020" → results shown
- [ ] Click car #A01 → detail page loads
- [ ] Click "Chat via WhatsApp" → WA opens with pre-filled message
- [ ] Customer sends message → Bot responds <3s
- [ ] Bot response includes correct car info (#A01 details)
- [ ] Lead created in database (verify in admin panel)
- [ ] Conversation history saved in messages table

**Test 2: Owner Upload Car via WA**
- [ ] Owner sends `/upload` → Bot responds with instructions
- [ ] Owner sends 5 photos → Bot confirms received
- [ ] Owner sends car info (plat | brand model | year | etc) → Bot parses correctly
- [ ] Bot shows recap with internal (plat) + public (#A01) IDs
- [ ] Owner confirms (1) → Car inserted to database
- [ ] Car instantly visible on website (/cars API + detail page)
- [ ] Display code (#A01) unique per tenant
- [ ] Slug generated correctly (avanza-2020-hitam-a01)

**Test 3: Owner Update Status via WA**
- [ ] Owner sends `/status B1234XYZ terjual`
- [ ] Bot finds car by plat number
- [ ] Bot asks confirmation
- [ ] Owner confirms → Car status updated to "sold"
- [ ] Car removed from website (not in /cars API)
- [ ] Dashboard shows car as "sold"

**Test 4: Multiple Similar Cars (Disambiguation)**
- [ ] Database has 3x Avanza 2020 Hitam (#A01, #A02, #V01)
- [ ] Customer asks "Ada Avanza 2020 hitam?"
- [ ] Bot lists ALL 3 units with differentiators (velg racing, ban baru, Veloz type)
- [ ] Customer selects "1" → Bot shows #A01 details only
- [ ] Pre-filled WA message includes "#A01" (specific reference)

**Test 5: Sales Lead Notification**
- [ ] Customer mentions "bisa nego?" (hot lead trigger)
- [ ] Bot detects intent → Creates lead with status "hot"
- [ ] Bot notifies sales via WA (send message to sales WA number)
- [ ] Notification includes: customer phone, car code, chat summary
- [ ] Sales can view full conversation history

**Test 6: Multi-Tenant Isolation**
- [ ] Create 2 test tenants (Tenant A, Tenant B)
- [ ] Tenant A uploads car #A01
- [ ] Tenant B uploads car #A01 (same display code, different tenant)
- [ ] Customer visits Tenant A website → sees only Tenant A's #A01
- [ ] Customer visits Tenant B website → sees only Tenant B's #A01
- [ ] No cross-tenant data leakage

**Test 7: Custom Domain + SSL**
- [ ] Setup custom domain (showroommobil.com)
- [ ] Configure DNS (A record to server IP)
- [ ] Verify domain via dashboard
- [ ] Visit https://showroommobil.com → HTTPS active (Cloudflare SSL)
- [ ] Website renders with tenant branding
- [ ] Visit old subdomain → 301 redirect to custom domain

### 9.3 Performance Testing

**Response Time:**
- [ ] Website homepage load: <2s (Desktop), <3s (Mobile)
- [ ] Car listing page: <2s
- [ ] Car detail page: <2s
- [ ] Bot response time: <3s (95th percentile)
- [ ] API endpoints: <100ms (database queries)

**Concurrency:**
- [ ] 10 concurrent customer chats → all respond <3s
- [ ] 100 concurrent website visitors → no slowdown
- [ ] 5 owners upload cars simultaneously → all succeed

**Load Testing (Optional):**
- [ ] Simulate 1000 page views/minute → server handles
- [ ] Simulate 100 bot messages/minute → bot handles

### 9.4 Security Testing (CRITICAL)

**Authentication & Authorization:**
- [ ] Dashboard login requires valid credentials
- [ ] Invalid login → error message (no hints about which field is wrong)
- [ ] JWT token expires after 24 hours
- [ ] Protected routes require valid JWT
- [ ] User can only access own tenant's data

**Tenant Isolation:**
- [ ] User A cannot access Tenant B's cars (even with direct API call)
- [ ] User A cannot access Tenant B's leads
- [ ] User A cannot access Tenant B's messages

**Input Validation:**
- [ ] SQL injection attempts → sanitized by Prisma (parameterized queries)
- [ ] XSS attempts (car description with `<script>`) → escaped on render
- [ ] File upload validation:
  - Only images accepted (jpg, png, webp)
  - Max file size: 10MB
  - Malicious files rejected
- [ ] Rate limiting:
  - Max 10 messages/minute per customer (prevent spam)
  - Max 5 login attempts per IP per hour (prevent brute force)

**Webhook Security:**
- [ ] Fonnte webhook validates signature (if available)
- [ ] Unknown sender → reject or rate limit
- [ ] Malformed payload → return 400 error (don't crash)

**Environment Variables:**
- [ ] No secrets in code (use .env)
- [ ] .env not committed to git (.gitignore check)
- [ ] Production secrets different from development

### 9.5 User Acceptance Testing (with Showroom Partner)

**Owner Tasks:**
- [ ] Upload 5 cars via WA → All successful?
- [ ] Update 2 cars status → Website updates correctly?
- [ ] View leads in dashboard → Understandable?
- [ ] Find specific car in dashboard → Search works?

**Sales Tasks:**
- [ ] Receive lead notification → Notification clear?
- [ ] View conversation history → Readable?
- [ ] Take over from bot → Transition smooth?

**Customer Simulation:**
- [ ] Browse website on mobile → Easy to navigate?
- [ ] Search for car → Finds relevant results?
- [ ] Click WA button → Opens correctly?
- [ ] Chat with bot → Responses helpful?

**Feedback Questions:**
- What was confusing?
- What worked really well?
- What's missing?
- Would you recommend to other showrooms?

---

## 10. DEPLOYMENT GUIDE

### 10.1 Environment Setup

**Required Accounts/Services:**

1. **Domain:** autoleads.id (main platform domain)
2. **Server:** Coolify access (Docker-based deployment)
3. **Database:** PostgreSQL 15+ (hosted or Docker)
4. **Fonnte:** Account + API key (Rp 300k/month)
   - URL: https://fonnte.com
   - Setup: Register → Buy package → Get API token
5. **Google AI:** Gemini Pro API key (free tier: 60 requests/minute)
   - URL: https://ai.google.dev
   - Setup: Enable Gemini API → Create API key
6. **Cloudflare:** Account (free tier)
   - URL: https://cloudflare.com
   - Setup: Create account → Add main domain (autoleads.id)

**Environment Variables (.env):**

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/autoleads_prod"

# App
NODE_ENV="production"
APP_URL="https://autoleads.id"
APP_PORT="3000"

# JWT Secret (generate with: openssl rand -hex 32)
JWT_SECRET="your-secret-key-here"

# Fonnte (WhatsApp Gateway)
FONNTE_API_URL="https://api.fonnte.com"
FONNTE_API_TOKEN="your-fonnte-token-here"

# Google Gemini Pro (LLM)
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_API_URL="https://generativelanguage.googleapis.com/v1"

# File Upload
UPLOAD_DIR="/app/uploads"
MAX_FILE_SIZE="10485760" # 10MB in bytes

# Rate Limiting
RATE_LIMIT_WINDOW_MS="60000" # 1 minute
RATE_LIMIT_MAX_REQUESTS="100" # per window

# Session
SESSION_DURATION_HOURS="24"
```

### 10.2 Docker Setup

**Dockerfile:**

```dockerfile
# Dockerfile
FROM oven/bun:1.2-alpine AS base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Build application
FROM base AS builder
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Production image
FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunuser

# Copy files
COPY --from=deps --chown=bunuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=bunuser:nodejs /app .

# Create upload directory
RUN mkdir -p /app/uploads && chown bunuser:nodejs /app/uploads

USER bunuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["bun", "run", "start"]
```

**docker-compose.yml (for local testing):**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/autoleads
      - JWT_SECRET=${JWT_SECRET}
      - FONNTE_API_TOKEN=${FONNTE_API_TOKEN}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - db
    volumes:
      - uploads:/app/uploads

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=autoleads
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
  uploads:
```

### 10.3 Deployment to Coolify

**Step 1: Prepare Repository**

```bash
# Ensure all code committed
git status

# Create production branch (optional)
git checkout -b production
git push origin production
```

**Step 2: Coolify Setup**

1. Login to Coolify: https://cf.avolut.com
2. Create new Application
3. Configure:
   - **Name:** autoleads-prod
   - **Repository:** https://github.com/your-username/auto.git
   - **Branch:** main (or production)
   - **Build Pack:** Dockerfile
   - **Port:** 3000

**Step 3: Environment Variables**

In Coolify dashboard, add all environment variables from .env (see section 10.1).

**Step 4: Database Setup**

Option A: Use Coolify's PostgreSQL service
- Create PostgreSQL database in Coolify
- Copy connection string to DATABASE_URL

Option B: External database
- Use managed PostgreSQL (e.g., Supabase, Neon, Railway)
- Copy connection string to DATABASE_URL

**Step 5: Run Migrations**

```bash
# SSH into Coolify container
ssh root@cf.avolut.com
docker exec -it <container-id> sh

# Run migrations
bunx prisma migrate deploy

# Seed initial data (first deployment only)
bun run seed.ts
```

**Step 6: Configure Domain**

1. In Coolify, add domain: autoleads.id
2. Coolify provides Let's Encrypt SSL (auto)
3. Configure DNS:
   - A record: autoleads.id → Coolify server IP
   - A record: *.autoleads.id → Coolify server IP (wildcard for subdomains)

**Step 7: Configure Fonnte Webhook**

1. Login to Fonnte dashboard
2. Go to Webhook settings
3. Set webhook URL: https://autoleads.id/webhook/fonnte
4. Test webhook (send test message)

**Step 8: Verify Deployment**

```bash
# Check health endpoint
curl https://autoleads.id/health

# Expected response:
# {"status":"ok","timestamp":"2025-10-23T10:00:00Z"}

# Check API
curl https://autoleads.id/api/cars?brand=Toyota

# Check website
curl -I https://autoleads.id
# Should return: HTTP/2 200
```

### 10.4 Monitoring & Logging

**Application Logs:**

```bash
# View live logs (Coolify)
ssh root@cf.avolut.com
docker logs -f <container-id>

# Or in Coolify dashboard: Application → Logs
```

**Health Monitoring:**

```typescript
// backend/src/routes/health.ts
import { Hono } from 'hono';
import { db } from '../db';

const health = new Hono();

health.get('/health', async (c) => {
  try {
    // Check database connection
    await db.$queryRaw`SELECT 1`;

    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    return c.json({
      status: 'error',
      error: error.message
    }, 500);
  }
});

export default health;
```

**Error Tracking (Phase 2+):**

- Integrate Sentry (https://sentry.io)
- Track errors, performance, user sessions
- Alert on critical errors

**Uptime Monitoring (Optional):**

- Use UptimeRobot (free tier)
- Monitor https://autoleads.id/health every 5 minutes
- Alert via email if down

### 10.5 Backup Strategy

**Database Backups:**

```bash
# Automated daily backup (cron job on server)
# Create backup script: /root/backup-autoleads-db.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/autoleads_$DATE.sql"

# Dump database
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_FILE.gz s3://backups/autoleads/

# Keep last 7 days only
find /backups -name "autoleads_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**File Uploads Backup:**

```bash
# Backup uploads directory daily
rsync -avz /app/uploads/ /backups/uploads/
```

**Disaster Recovery Plan:**

1. **Database corruption:**
   - Restore from latest backup (daily)
   - Data loss: Maximum 24 hours

2. **Server failure:**
   - Deploy to new server (Coolify makes this easy)
   - Restore database from backup
   - Point DNS to new server
   - Downtime: ~30 minutes

3. **Data breach:**
   - Rotate all API keys (Fonnte, Gemini)
   - Rotate JWT secret (forces all users to re-login)
   - Review access logs
   - Notify affected tenants

### 10.6 Scaling Strategy (Future)

**Horizontal Scaling (Phase 4+):**

- Multiple app instances behind load balancer
- Shared PostgreSQL database (with connection pooling)
- Shared file storage (S3 instead of local filesystem)
- Redis for session storage (instead of JWT in memory)

**Vertical Scaling (First approach):**

- Upgrade server resources (more CPU, RAM)
- Optimize database queries (add indexes)
- Add caching layer (Redis for API responses)

---

## 11. POST-LAUNCH OPERATIONS

### 11.1 Customer Onboarding Process

**New Showroom Signup:**

1. **Initial Contact:**
   - Customer fills form on autoleads.id or contacts sales
   - Sales qualification call (15 min):
     - Showroom size (mobil inventory)
     - Current pain points
     - Budget confirmation
     - Timeline expectations

2. **Demo (30 min):**
   - Show website katalog (use demo tenant)
   - Show WA bot responding to customer
   - Show owner uploading via WA (live demo)
   - Show dashboard (leads, stats)
   - Q&A

3. **Sign Agreement + Payment:**
   - Send partnership agreement (email/WA)
   - Receive down payment (50% = Rp 10.25jt for first customer)
   - Create tenant in database
   - Generate subdomain (showroom-slug.autoleads.id)

4. **Onboarding (Day 1-2):**
   - Kickoff meeting (1 hour):
     - Collect showroom info (logo, colors, contact, address)
     - Setup branding in dashboard
     - Configure WhatsApp number (Fonnte device)
   - Content gathering:
     - Request 20-30 cars data (photos, specs)
     - Or train owner to upload via WA

5. **Training (Day 3-4):**
   - Owner training (2 hours)
   - Sales training (2 hours per batch)
   - Provide cheat sheets

6. **Go-Live (Day 5):**
   - Website live (subdomain)
   - WA bot active
   - Monitor first 24 hours
   - Daily check-in (Week 1)

7. **Final Payment + Success:**
   - Collect remaining 50% after go-live
   - Measure success metrics (Week 1)
   - Request testimonial
   - Upsell custom domain (if Growth plan)

### 11.2 Support Process

**Support Channels:**

- **WhatsApp:** Fast response for urgent issues (owner's WA)
- **Email:** support@autoleads.id (for less urgent)
- **Dashboard:** Built-in support chat (Phase 4)

**Support SLA:**

| Priority | Response Time | Resolution Time |
|----------|---------------|-----------------|
| **Critical** (bot down, website down) | <1 hour | <4 hours |
| **High** (feature not working) | <4 hours | <24 hours |
| **Medium** (question, minor bug) | <24 hours | <3 days |
| **Low** (feature request) | <3 days | Backlog |

**Common Issues & Solutions:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Bot not responding | Fonnte webhook down or WA number inactive | Check Fonnte dashboard, test webhook manually |
| Website slow | Database query not optimized or high traffic | Check slow query log, add indexes |
| Car not appearing | Status = "draft" or slug collision | Update status via bot or dashboard |
| Upload failed | Photo too large or network timeout | Retry upload, check photo size <10MB |
| Login not working | Wrong credentials or JWT expired | Reset password or re-login |

### 11.3 Maintenance Schedule

**Daily:**
- Monitor error logs (critical errors alert)
- Check bot response time (should be <3s average)
- Check website uptime (UptimeRobot)

**Weekly:**
- Review customer feedback (support tickets)
- Check database size (cleanup old messages if >10GB)
- Review LLM API costs (should be ~Rp 500k/month per 10 tenants)
- Update roadmap based on feature requests

**Monthly:**
- Database backup verification (test restore)
- Security update check (Bun, dependencies)
- Performance review (slow queries, bottlenecks)
- Customer success check-in (NPS survey)

**Quarterly:**
- Major version updates (Bun, Prisma, React)
- Infrastructure review (server capacity)
- Security audit (penetration testing - Phase 4)
- Product roadmap review (next 3 months)

### 11.4 Metrics to Track

**Product Metrics:**

- **Active Tenants:** Number of showrooms using platform
- **MAU (Monthly Active Users):** Owners + sales logging in
- **Bot Usage:**
  - Messages per day (per tenant average)
  - Response time (avg, p95, p99)
  - Resolution rate (% handled without human)
- **Website Traffic:**
  - Page views per tenant per month
  - Unique visitors
  - Bounce rate
  - Time on site
- **Lead Generation:**
  - Leads per tenant per month
  - Hot leads (% mention nego/kredit/serious)
  - Conversion rate (lead → sale - if tracked)
- **Feature Adoption:**
  - % using Bot Admin WA (vs. dashboard upload)
  - % using custom domain
  - % using dashboard (vs. WA only)

**Business Metrics:**

- **MRR (Monthly Recurring Revenue):** Total from all tenants
- **Churn Rate:** % tenants cancel per month (target: <5%)
- **NPS (Net Promoter Score):** Would you recommend? (target: >50)
- **CAC (Customer Acquisition Cost):** Sales + marketing cost per new tenant
- **LTV (Lifetime Value):** Avg revenue per tenant over lifetime
- **LTV/CAC Ratio:** Should be >3x for healthy SaaS

**Technical Metrics:**

- **Uptime:** % time website + bot available (target: >99%)
- **Error Rate:** % API requests with 5xx errors (target: <0.1%)
- **Database Size:** GB used (monitor growth)
- **LLM Cost:** Rp/month for Gemini API (should scale linearly with usage)

---

## 12. APPENDIX

### 12.1 Glossary

| Term | Definition |
|------|------------|
| **MLP** | Minimum Lovable Product - smallest product customers love |
| **RAG** | Retrieval-Augmented Generation - query DB then inject to LLM |
| **Tenant** | A showroom customer (multi-tenant SaaS) |
| **Display Code** | Public car identifier (#A01, #A02) - customer-facing |
| **Stock Code** | Internal car identifier (STK-001) - owner/sales only |
| **Plat Nomor** | License plate number (B 1234 XYZ) - internal only, not public |
| **Slug** | URL-friendly identifier (avanza-2020-hitam-a01) |
| **LLM** | Large Language Model (Gemini Pro, GPT-4) |
| **Fonnte** | WhatsApp gateway service (webhook-based) |
| **Intent** | Customer's goal detected from message (inquiry, price, location, etc) |
| **Lead** | Customer inquiry captured in database |
| **Hot Lead** | High-intent lead (mentions nego, kredit, test drive) |
| **Hand-off** | Bot transfers conversation to human sales |

### 12.2 External Resources

**Documentation:**
- Bun: https://bun.sh/docs
- Hono: https://hono.dev
- Prisma: https://prisma.io/docs
- React: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- Fonnte API: https://fonnte.com/api
- Google Gemini: https://ai.google.dev/docs

**Tools:**
- Coolify: https://coolify.io/docs
- Cloudflare: https://developers.cloudflare.com
- PostgreSQL: https://postgresql.org/docs

**Community:**
- AutoLeads GitHub: (your repo)
- Support: support@autoleads.id

### 12.3 Contact & Support

**Development Team:**
- Lead Developer: (your contact)
- Product Manager: (your contact)

**Customer Support:**
- Email: support@autoleads.id
- WhatsApp: (support number)

**Emergency Contact (Production Issues):**
- Phone: (your phone)
- Available: 24/7 (Week 1 after launch), then business hours

---

## 📝 DOCUMENT REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-23 | AutoLeads Product Strategist | Initial master specification |

---

## ✅ FINAL CHECKLIST - Ready for Development

Before starting development, ensure:

- [ ] User decision made: GO for development (Option A or B)
- [ ] Showroom partner confirmed (first customer ready)
- [ ] Down payment secured (Rp 10.25jt)
- [ ] Development resource available (1-2 developers)
- [ ] Fonnte account setup (WhatsApp gateway)
- [ ] Gemini API key obtained (LLM)
- [ ] Server access (Coolify + Docker)
- [ ] Domain registered (autoleads.id)
- [ ] This document reviewed and understood

**When ready to start:**
1. Create project repository
2. Run: `bun init`
3. Follow Phase 1, Week 1, Day 1 tasks
4. Use agents as mapped in Section 8
5. Refer back to this document throughout development

---

**END OF MASTER SPECIFICATION**

*This document is the single source of truth for AutoLeads development. Keep it updated as requirements evolve.*
