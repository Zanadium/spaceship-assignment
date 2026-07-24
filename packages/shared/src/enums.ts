import { z } from "zod";

/**
 * Domain enums derived directly from the logistics dataset. Keeping these as the
 * single source of truth lets both the AI router and the deterministic query
 * builder validate against the same allowed values.
 */

/** Order fulfilment status (the `status` column). */
export const OrderStatusEnum = z.enum([
  "delivered",
  "delayed",
  "in_transit",
  "exception",
  "canceled",
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

/**
 * Metrics the Query Tool can compute. All are deterministic aggregations over
 * the orders table — the AI selects one, it never invents a number.
 */
export const MetricEnum = z.enum([
  "order_count", // number of orders
  "delivered_count", // orders with status = delivered
  "delayed_count", // orders with status = delayed
  "on_time_rate", // delivered / (delivered + delayed + exception)
  "delay_rate", // delayed / all terminal orders
  "avg_delivery_days", // mean(delivery_date - order_date) over delivered orders
  "total_order_value", // sum(order_value_usd)
  "total_quantity", // sum(quantity)
]);
export type Metric = z.infer<typeof MetricEnum>;

/**
 * Dimensions the Query Tool can group by. Time dimensions bucket `order_date`;
 * the rest are categorical columns.
 */
export const DimensionEnum = z.enum([
  "day",
  "week",
  "month",
  "carrier",
  "status",
  "region",
  "destination_city",
  "origin_city",
  "product_category",
  "sku",
  "warehouse",
  "client_id",
]);
export type Dimension = z.infer<typeof DimensionEnum>;

/** Time-bucket dimensions, kept separate because they need date truncation. */
export const TIME_DIMENSIONS: Dimension[] = ["day", "week", "month"];

export const isTimeDimension = (d: Dimension): boolean =>
  (TIME_DIMENSIONS as string[]).includes(d);
