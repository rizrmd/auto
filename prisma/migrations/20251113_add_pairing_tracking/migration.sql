-- Add pairing failure tracking to tenants table
ALTER TABLE "tenants"
ADD COLUMN IF NOT EXISTS "whatsapp_pairing_failures" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "whatsapp_last_pairing_attempt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "whatsapp_rate_limited_until" TIMESTAMP;

-- Add comment for documentation
COMMENT ON COLUMN "tenants"."whatsapp_pairing_failures" IS 'Counter for failed WhatsApp pairing attempts (resets after successful pairing)';
COMMENT ON COLUMN "tenants"."whatsapp_last_pairing_attempt" IS 'Timestamp of last pairing attempt (successful or failed)';
COMMENT ON COLUMN "tenants"."whatsapp_rate_limited_until" IS 'Timestamp until which tenant is suspected to be rate-limited (null if not rate-limited)';
