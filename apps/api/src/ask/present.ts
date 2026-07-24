import type {
  ChartType,
  ForecastResult,
  QueryResult,
  ToolResult,
} from "@spaceship/shared";
import { isTimeBucket } from "../analytics/aggregate";
import { formatMetricValue, METRIC_LABELS } from "../common/labels";

/**
 * Deterministic chart-type selection from the shape of the result — NOT chosen
 * by the AI. A scalar KPI renders as a stat, a time series as a line, any other
 * breakdown as a bar chart, and forecasts as a (historical + projected) line.
 */
export function pickChartType(result: ToolResult): ChartType {
  if (result.kind === "forecast") return "line";
  if (!result.groupBy) return "kpi";
  return isTimeBucket(result.groupBy) ? "line" : "bar";
}

/** Short natural-language summary of a query result. */
export function buildQueryAnswer(result: QueryResult): string {
  const label = METRIC_LABELS[result.metric];

  if (!result.groupBy) {
    const value = result.data[0]?.value ?? 0;
    const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
    return `${capitalized} is ${formatMetricValue(result.metric, value, result.isRate)}.`;
  }

  if (result.data.length === 0) {
    return `No matching orders were found for ${label} by ${result.groupBy.replace(/_/g, " ")}.`;
  }

  const top = result.data[0];
  const dim = result.groupBy.replace(/_/g, " ");
  return `${label.charAt(0).toUpperCase() + label.slice(1)} across ${result.data.length} ${dim}(s). Leading: ${top?.label} at ${formatMetricValue(result.metric, top?.value ?? 0, result.isRate)}.`;
}

/** Short natural-language summary of a forecast result. */
export function buildForecastAnswer(result: ForecastResult): string {
  if (result.series.length === 0) {
    return `No historical data was available to forecast ${result.subject}.`;
  }
  const unit = result.target === "quantity" ? "units" : "orders";
  const horizon = result.series.filter((p) => p.kind === "forecast").length;
  return `Projected demand for ${result.subject} over the next ${horizon} month(s). Recommended inventory to stock: ${result.inventoryRecommendation} ${unit}.`;
}
