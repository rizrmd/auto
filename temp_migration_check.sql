-- CreateEnum
CREATE TYPE "SslStatus" AS ENUM ('pending', 'active', 'failed');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('trial', 'free', 'starter', 'growth', 'pro');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended', 'trial', 'expired');

-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('Manual', 'Matic');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('available', 'sold', 'booking', 'draft', 'deleted');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'hot', 'warm', 'cold', 'closed', 'lost');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('web', 'wa', 'direct', 'referral');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('customer', 'bot', 'sales', 'system');

-- CreateEnum
CREATE TYPE "SuperAdminRole" AS ENUM ('super_admin', 'support');

-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'sales');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('customer', 'admin', 'sales');

-- CreateEnum
CREATE TYPE "SecurityLogSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SecurityLogStatus" AS ENUM ('SUCCESS', 'FAILED', 'WARNING');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('draft', 'published', 'scheduled', 'archived');

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
    "header_tagline" VARCHAR(200) DEFAULT 'Mobil Bekas Berkualitas',
    "header_title" VARCHAR(200) NOT NULL DEFAULT 'Temukan Mobil Impian Kamu',
    "header_subtitle" TEXT NOT NULL DEFAULT 'Jelajahi koleksi mobil bekas pilihan kami. Kualitas terjamin, harga terpercaya, dan pelayanan terbaik.',
    "header_cta_text" VARCHAR(100) NOT NULL DEFAULT 'Lihat Semua Mobil',
    "phone" VARCHAR(20) NOT NULL,
    "whatsapp_number" VARCHAR(20) NOT NULL,
    "whatsapp_bot_enabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp_instance_id" VARCHAR(100),
    "whatsapp_port" INTEGER,
    "whatsapp_status" VARCHAR(20) DEFAULT 'disconnected',
    "whatsapp_pairing_failures" INTEGER DEFAULT 0,
    "whatsapp_last_pairing_attempt" TIMESTAMP(3),
    "whatsapp_rate_limited_until" TIMESTAMP(3),
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
    "deleted_at" TIMESTAMP(3),
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
CREATE TABLE "super_admins" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "SuperAdminRole" NOT NULL DEFAULT 'super_admin',
    "status" "AdminStatus" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "super_admins_pkey" PRIMARY KEY ("id")
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
    "role" "UserRole" NOT NULL DEFAULT 'admin',
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

-- CreateTable
CREATE TABLE "search_demand" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "car_id" INTEGER,
    "keyword" VARCHAR(255) NOT NULL,
    "search_date" DATE NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'website',
    "customer_phone" VARCHAR(20),
    "unmet_need" BOOLEAN NOT NULL DEFAULT false,
    "search_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_demand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "super_admin_id" INTEGER,
    "user_name" VARCHAR(200) NOT NULL,
    "user_email" VARCHAR(200),
    "action" VARCHAR(100) NOT NULL,
    "details" TEXT NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "endpoint" VARCHAR(255),
    "method" VARCHAR(10),
    "severity" "SecurityLogSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "SecurityLogStatus" NOT NULL DEFAULT 'SUCCESS',
    "tenant_id" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "meta_title" VARCHAR(500),
    "meta_description" TEXT,
    "meta_keywords" TEXT[],
    "og_image" TEXT,
    "og_title" VARCHAR(500),
    "og_description" TEXT,
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_prompt" TEXT,
    "ai_tone" VARCHAR(100),
    "status" "BlogStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMP(3),
    "scheduled_for" TIMESTAMP(3),
    "category" VARCHAR(100) NOT NULL,
    "tags" TEXT[],
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_cars" (
    "id" SERIAL NOT NULL,
    "blog_post_id" INTEGER NOT NULL,
    "car_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "show_as_card" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_post_cars_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "leads_tenant_id_customer_phone_key" ON "leads"("tenant_id", "customer_phone");

-- CreateIndex
CREATE INDEX "messages_tenant_id_lead_id_idx" ON "messages"("tenant_id", "lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "super_admins_email_key" ON "super_admins"("email");

-- CreateIndex
CREATE INDEX "super_admins_email_idx" ON "super_admins"("email");

-- CreateIndex
CREATE INDEX "super_admins_role_status_idx" ON "super_admins"("role", "status");

-- CreateIndex
CREATE INDEX "users_tenant_id_role_idx" ON "users"("tenant_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "conversation_states_tenant_id_user_phone_current_flow_idx" ON "conversation_states"("tenant_id", "user_phone", "current_flow");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_states_tenant_id_user_phone_key" ON "conversation_states"("tenant_id", "user_phone");

-- CreateIndex
CREATE INDEX "search_demand_tenant_id_search_date_idx" ON "search_demand"("tenant_id", "search_date");

-- CreateIndex
CREATE INDEX "search_demand_tenant_id_keyword_idx" ON "search_demand"("tenant_id", "keyword");

-- CreateIndex
CREATE INDEX "search_demand_tenant_id_source_idx" ON "search_demand"("tenant_id", "source");

-- CreateIndex
CREATE UNIQUE INDEX "search_demand_tenant_id_car_id_search_date_source_key" ON "search_demand"("tenant_id", "car_id", "search_date", "source");

-- CreateIndex
CREATE INDEX "security_logs_created_at_idx" ON "security_logs"("created_at");

-- CreateIndex
CREATE INDEX "security_logs_user_id_created_at_idx" ON "security_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "security_logs_super_admin_id_created_at_idx" ON "security_logs"("super_admin_id", "created_at");

-- CreateIndex
CREATE INDEX "security_logs_tenant_id_created_at_idx" ON "security_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "security_logs_severity_created_at_idx" ON "security_logs"("severity", "created_at");

-- CreateIndex
CREATE INDEX "security_logs_action_created_at_idx" ON "security_logs"("action", "created_at");

-- CreateIndex
CREATE INDEX "security_logs_ip_address_created_at_idx" ON "security_logs"("ip_address", "created_at");

-- CreateIndex
CREATE INDEX "blog_posts_tenant_id_status_published_at_idx" ON "blog_posts"("tenant_id", "status", "published_at");

-- CreateIndex
CREATE INDEX "blog_posts_tenant_id_category_idx" ON "blog_posts"("tenant_id", "category");

-- CreateIndex
CREATE INDEX "blog_posts_tenant_id_deleted_at_idx" ON "blog_posts"("tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_tenant_id_slug_key" ON "blog_posts"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "blog_post_cars_blog_post_id_position_idx" ON "blog_post_cars"("blog_post_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_cars_blog_post_id_car_id_key" ON "blog_post_cars"("blog_post_id", "car_id");

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

-- AddForeignKey
ALTER TABLE "search_demand" ADD CONSTRAINT "search_demand_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_demand" ADD CONSTRAINT "search_demand_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_super_admin_id_fkey" FOREIGN KEY ("super_admin_id") REFERENCES "super_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_cars" ADD CONSTRAINT "blog_post_cars_blog_post_id_fkey" FOREIGN KEY ("blog_post_id") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_cars" ADD CONSTRAINT "blog_post_cars_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

