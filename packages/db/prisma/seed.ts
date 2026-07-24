import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient, type OrderStatus, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// The dataset lives in the repo's requirements/ directory.
const CSV_PATH = resolve(__dirname, "../../../requirements/mock_logistics_data.csv");

const VALID_STATUSES: OrderStatus[] = [
  "delivered",
  "delayed",
  "in_transit",
  "exception",
  "canceled",
];

interface CsvRow {
  client_id: string;
  order_id: string;
  order_date: string;
  delivery_date: string;
  carrier: string;
  origin_city: string;
  destination_city: string;
  status: string;
  sku: string;
  product_category: string;
  quantity: string;
  unit_price_usd: string;
  order_value_usd: string;
  is_promo: string;
  promo_discount_pct: string;
  region: string;
  warehouse: string;
}

/** Parse an ISO date string (YYYY-MM-DD) as UTC midnight to avoid TZ drift. */
function toUtcDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return new Date(`${trimmed}T00:00:00.000Z`);
}

/** Whole-day difference between two UTC dates. */
function diffInDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function toOrder(row: CsvRow): Prisma.OrderCreateManyInput {
  const status = row.status.trim() as OrderStatus;
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Unknown status "${row.status}" for order ${row.order_id}`);
  }

  const orderDate = toUtcDate(row.order_date);
  if (!orderDate) {
    throw new Error(`Missing order_date for order ${row.order_id}`);
  }
  const deliveryDate = toUtcDate(row.delivery_date);

  return {
    orderId: row.order_id.trim(),
    clientId: row.client_id.trim(),
    orderDate,
    deliveryDate,
    deliveryDays: deliveryDate ? diffInDays(orderDate, deliveryDate) : null,
    carrier: row.carrier.trim(),
    originCity: row.origin_city.trim(),
    destinationCity: row.destination_city.trim(),
    status,
    sku: row.sku.trim(),
    productCategory: row.product_category.trim(),
    quantity: Number.parseInt(row.quantity, 10),
    unitPriceUsd: row.unit_price_usd.trim(),
    orderValueUsd: row.order_value_usd.trim(),
    isPromo: row.is_promo.trim() === "1",
    promoDiscountPct: Number.parseInt(row.promo_discount_pct || "0", 10),
    region: row.region.trim(),
    warehouse: row.warehouse.trim(),
  };
}

async function main(): Promise<void> {
  const csv = readFileSync(CSV_PATH, "utf8");
  const rows = parse(csv, {
    columns: true,
    skipEmptyLines: true,
    trim: false, // fields are trimmed explicitly in toOrder
  }) as CsvRow[];

  const orders = rows.map(toOrder);

  // Idempotent: wipe and reload so re-running the seed is safe.
  await prisma.order.deleteMany();
  const { count } = await prisma.order.createMany({ data: orders });

  console.log(`Seeded ${count} orders from ${CSV_PATH}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
