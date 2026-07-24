import type { Metric } from "@spaceship/shared";

/** Human-readable names for each metric, used in interpretations and answers. */
export const METRIC_LABELS: Record<Metric, string> = {
  order_count: "the number of orders",
  delivered_count: "the number of delivered orders",
  delayed_count: "the number of delayed orders",
  on_time_rate: "the on-time delivery rate",
  delay_rate: "the delay rate",
  avg_delivery_days: "the average delivery time (days)",
  total_order_value: "the total order value",
  total_quantity: "the total quantity",
};

/** Format a metric value for display, respecting rates, currency, and units. */
export function formatMetricValue(
  metric: Metric,
  value: number,
  isRate: boolean,
): string {
  if (isRate) return `${(value * 100).toFixed(1)}%`;
  if (metric === "total_order_value") return `$${value.toFixed(2)}`;
  if (metric === "avg_delivery_days") return `${value} days`;
  return String(value);
}
