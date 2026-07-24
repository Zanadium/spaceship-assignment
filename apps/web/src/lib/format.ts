import type { Metric } from "@spaceship/shared";

/** Metric display names, mirrored from the API for consistent labels. */
export const METRIC_LABELS: Record<Metric, string> = {
  order_count: "Orders",
  delivered_count: "Delivered",
  delayed_count: "Delayed",
  on_time_rate: "On-time rate",
  delay_rate: "Delay rate",
  avg_delivery_days: "Avg delivery time",
  total_order_value: "Total order value",
  total_quantity: "Total quantity",
};

/** Format a metric value respecting rates, currency, and units. */
export function formatMetricValue(
  metric: Metric,
  value: number,
  isRate: boolean,
): string {
  if (isRate) return `${(value * 100).toFixed(1)}%`;
  if (metric === "total_order_value") return formatCurrency(value);
  if (metric === "avg_delivery_days") return `${value.toFixed(1)}d`;
  return formatNumber(value);
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

/** Turn a dimension key ("destination_city") into a readable label. */
export function humanize(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Compact a month bucket "2025-03" into "Mar '25" for axis ticks. */
export function shortMonth(period: string): string {
  const [y, m] = period.split("-");
  if (!y || !m) return period;
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${names[Number(m) - 1] ?? m} '${y.slice(2)}`;
}
