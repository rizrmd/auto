-- CreateEnum
CREATE TYPE "SslStatus" AS ENUM ('pending', 'active', 'failed');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('trial', 'free', 'starter', 'growth', 'pro');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended', 'trial', 'expired');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('Manual', 'Matic');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('available', 'sold', 'booking', 'draft');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'hot', 'warm', 'cold', 'closed', 'lost');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('web', 'wa', 'direct', 'referral');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('customer', 'bot', 'sales', 'system');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'sales');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('customer', 'admin', 'sales');

-- CreateTable
CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "subdomain" VARCHAR(200) NOT NULL,
    "custom_domain" VARCHAR(200),
    "custom_domain_verified" BOOLEAN NOT NULL DEFAULT false,
    "custom_domain_ssl_status" "SslStatus" NOT NULL DEFAULT 'pending',
    "logo_url" TEXT,
    "primary_color" VARCHAR(7) NOT NULL DEFAULT '#FF5722',
    "secondary_color" VARCHAR(7) NOT NULL DEFAULT '#000000',
    "phone" VARCHAR(20) NOT NULL,
    "whatsapp_number" VARCHAR(20) NOT NULL,
    "whatsapp_bot_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email" VARCHAR(200),
    "address" TEXT,
    "city" VARCHAR(100),
    "maps_url" TEXT,
    "business_hours" JSONB,
    "plan" "PlanType" NOT NULL DEFAULT 'trial',
    "plan_started_at" TIMESTAMP(3),
    "plan_expires_at" TIMESTAMP(3),
    "status" "TenantStatus" NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMP(3),
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cars" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "plate_number" VARCHAR(20),
    "plate_number_clean" VARCHAR(20),
    "stock_code" VARCHAR(20),
    "display_code" VARCHAR(20) NOT NULL,
    "public_name" VARCHAR(200) NOT NULL,
    "brand" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "color" VARCHAR(50) NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "km" INTEGER NOT NULL,
    "price" BIGINT NOT NULL,
    "fuel_type" VARCHAR(20),
    "key_features" TEXT[],
    "condition_notes" TEXT,
    "photos" TEXT[],
    "primary_photo_index" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "status" "CarStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sold_at" TIMESTAMP(3),
    "slug" VARCHAR(200) NOT NULL,

    CONSTRAINT "cars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "customer_phone" VARCHAR(20) NOT NULL,
    "customer_name" VARCHAR(100),
    "car_id" INTEGER,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "source" "LeadSource" NOT NULL DEFAULT 'wa',
    "assigned_to_user_id" INTEGER,
    "notes" TEXT,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "lead_id" INTEGER NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(20),
    "whatsapp_number" VARCHAR(20),
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_states" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "user_phone" VARCHAR(20) NOT NULL,
    "user_type" "UserType" NOT NULL,
    "current_flow" VARCHAR(50) NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "context" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_custom_domain_key" ON "tenants"("custom_domain");

-- CreateIndex
CREATE INDEX "cars_tenant_id_status_idx" ON "cars"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "cars_tenant_id_brand_model_year_color_idx" ON "cars"("tenant_id", "brand", "model", "year", "color");

-- CreateIndex
CREATE INDEX "cars_plate_number_clean_idx" ON "cars"("plate_number_clean");

-- CreateIndex
CREATE UNIQUE INDEX "cars_tenant_id_display_code_key" ON "cars"("tenant_id", "display_code");

-- CreateIndex
CREATE UNIQUE INDEX "cars_tenant_id_slug_key" ON "cars"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "leads_tenant_id_status_idx" ON "leads"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "leads_tenant_id_customer_phone_idx" ON "leads"("tenant_id", "customer_phone");

-- CreateIndex
CREATE INDEX "messages_tenant_id_lead_id_idx" ON "messages"("tenant_id", "lead_id");

-- CreateIndex
CREATE INDEX "users_tenant_id_role_idx" ON "users"("tenant_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "conversation_states_tenant_id_user_phone_current_flow_idx" ON "conversation_states"("tenant_id", "user_phone", "current_flow");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_states_tenant_id_user_phone_key" ON "conversation_states"("tenant_id", "user_phone");

-- AddForeignKey
ALTER TABLE "cars" ADD CONSTRAINT "cars_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_states" ADD CONSTRAINT "conversation_states_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

