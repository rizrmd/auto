-- CreateTable
CREATE TABLE "search_demand" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "car_id" INTEGER,
    "keyword" VARCHAR(255) NOT NULL,
    "search_date" DATE NOT NULL,
    "search_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_demand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "search_demand_tenant_id_car_id_search_date_key" ON "search_demand"("tenant_id", "car_id", "search_date");

-- CreateIndex
CREATE INDEX "search_demand_tenant_id_search_date_idx" ON "search_demand"("tenant_id", "search_date");

-- CreateIndex
CREATE INDEX "search_demand_tenant_id_keyword_idx" ON "search_demand"("tenant_id", "keyword");

-- AddForeignKey
ALTER TABLE "search_demand" ADD CONSTRAINT "search_demand_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "search_demand" ADD CONSTRAINT "search_demand_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE SET NULL ON UPDATE NO ACTION;