-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('delivered', 'delayed', 'in_transit', 'exception', 'canceled');

-- CreateTable
CREATE TABLE "orders" (
    "order_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "order_date" DATE NOT NULL,
    "delivery_date" DATE,
    "delivery_days" INTEGER,
    "carrier" TEXT NOT NULL,
    "origin_city" TEXT NOT NULL,
    "destination_city" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "sku" TEXT NOT NULL,
    "product_category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_usd" DECIMAL(10,2) NOT NULL,
    "order_value_usd" DECIMAL(12,2) NOT NULL,
    "is_promo" BOOLEAN NOT NULL,
    "promo_discount_pct" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "warehouse" TEXT NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateIndex
CREATE INDEX "orders_order_date_idx" ON "orders"("order_date");

-- CreateIndex
CREATE INDEX "orders_carrier_idx" ON "orders"("carrier");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_sku_idx" ON "orders"("sku");

-- CreateIndex
CREATE INDEX "orders_product_category_idx" ON "orders"("product_category");

-- CreateIndex
CREATE INDEX "orders_region_idx" ON "orders"("region");
