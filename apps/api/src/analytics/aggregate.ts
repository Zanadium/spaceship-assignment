import type { Dimension, Metric, OrderStatus } from "@spaceship/shared";

/**
 * Pure aggregation logic for the Query Tool. Kept free of Nest/Prisma so it can
 * be reasoned about and unit-tested in isolation — this is the code that must be
 * correct for the "Data Correctness" criterion.
 *
 * Filtering happens in the database (Prisma `where`); this module only computes
 * metrics over the already-filtered rows. At this dataset's scale (hundreds of
 * rows) in-memory aggregation is exact and simple; a production-scale system
 * would push these down to SQL (see README → limitations).
 */

/** The minimal row shape the aggregator needs, projected from the Order table. */
export interface OrderRow {
  orderDate: Date;
  status: OrderStatus;
  deliveryDays: number | null;
  orderValueUsd: number;
  quantity: number;
  carrier: string;
  region: string;
  destinationCity: string;
  originCity: string;
  productCategory: string;
  sku: string;
  warehouse: string;
  clientId: string;
}

/** Statuses that represent a completed delivery attempt (used for rate denominators). */
const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "delayed", "exception"];

export const RATE_METRICS: Metric[] = ["on_time_rate", "delay_rate"];

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

/** Compute a single metric value over a set of rows. */
export function computeMetric(metric: Metric, rows: OrderRow[]): number {
  switch (metric) {
    case "order_count":
      return rows.length;
    case "delivered_count":
      return rows.filter((r) => r.status === "delivered").length;
    case "delayed_count":
      return rows.filter((r) => r.status === "delayed").length;
    case "total_order_value":
      return round2(sum(rows.map((r) => r.orderValueUsd)));
    case "total_quantity":
      return sum(rows.map((r) => r.quantity));
    case "avg_delivery_days": {
      const days = rows
        .map((r) => r.deliveryDays)
        .filter((d): d is number => d !== null);
      return days.length === 0 ? 0 : round2(sum(days) / days.length);
    }
    case "on_time_rate": {
      const terminal = rows.filter((r) => TERMINAL_STATUSES.includes(r.status));
      const delivered = terminal.filter((r) => r.status === "delivered").length;
      return terminal.length === 0 ? 0 : round4(delivered / terminal.length);
    }
    case "delay_rate": {
      const terminal = rows.filter((r) => TERMINAL_STATUSES.includes(r.status));
      const delayed = terminal.filter((r) => r.status === "delayed").length;
      return terminal.length === 0 ? 0 : round4(delayed / terminal.length);
    }
    default: {
      // Exhaustiveness guard: adding a Metric without handling it is a type error.
      const _never: never = metric;
      throw new Error(`Unhandled metric: ${String(_never)}`);
    }
  }
}

/** The grouping key for a row under a given dimension. */
export function groupKey(dimension: Dimension, row: OrderRow): string {
  switch (dimension) {
    case "day":
      return isoDate(row.orderDate);
    case "week":
      return isoDate(startOfIsoWeek(row.orderDate));
    case "month":
      return isoMonth(row.orderDate);
    case "carrier":
      return row.carrier;
    case "status":
      return row.status;
    case "region":
      return row.region;
    case "destination_city":
      return row.destinationCity;
    case "origin_city":
      return row.originCity;
    case "product_category":
      return row.productCategory;
    case "sku":
      return row.sku;
    case "warehouse":
      return row.warehouse;
    case "client_id":
      return row.clientId;
    default: {
      const _never: never = dimension;
      throw new Error(`Unhandled dimension: ${String(_never)}`);
    }
  }
}

export const isTimeBucket = (d: Dimension): boolean =>
  d === "day" || d === "week" || d === "month";

// ── date helpers (all UTC to match how dates were seeded) ──────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isoMonth(d: Date): string {
  return d.toISOString().slice(0, 7);
}

/** Monday of the ISO week containing d, at UTC midnight. */
function startOfIsoWeek(d: Date): Date {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const day = date.getUTCDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
