-- CreateIndex
CREATE UNIQUE INDEX "unique_tenant_customer" ON "leads"("tenant_id", "customer_phone");
