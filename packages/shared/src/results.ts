import type { Dimension, Metric } from "./enums";
import type { Filters, Plan } from "./query-plan";

/** Chart type chosen deterministically from the shape of the result. */
export type ChartType = "kpi" | "line" | "bar" | "table";

/** A single (label, value) point in a query result series. */
export interface DataPoint {
  label: string;
  value: number;
}

/** Result of the Query Tool. */
export interface QueryResult {
  kind: "query";
  metric: Metric;
  groupBy?: Dimension;
  /** For a scalar KPI (no groupBy) this holds one point labelled "total". */
  data: DataPoint[];
  /** True when the metric is a rate/percentage (formatting hint for the UI). */
  isRate: boolean;
}

/** One month of the forecast series (historical or projected). */
export interface ForecastPoint {
  /** Month bucket, e.g. "2025-03". */
  period: string;
  value: number;
  kind: "historical" | "forecast";
}

/** Result of the Forecasting Tool. */
export interface ForecastResult {
  kind: "forecast";
  target: "quantity" | "order_count";
  method: "moving_average" | "linear_regression";
  subject: string; // e.g. "SKU PAPER-0197" or "all orders"
  series: ForecastPoint[];
  /** Suggested inventory to stock for the forecast horizon. */
  inventoryRecommendation: number;
  /** Plain-language description of how the forecast was produced. */
  methodology: string;
}

export type ToolResult = QueryResult | ForecastResult;

/**
 * Explainability payload — attached to every answer. This is what makes the
 * system auditable: it states exactly which filters, metric, and dimensions
 * produced the result, plus the structured plan the AI selected.
 */
export interface Explanation {
  interpretation: string;
  metric?: Metric;
  dimensions: Dimension[];
  filters: Filters;
  plan: Plan;
}

/** The full envelope returned by the NL query endpoint. */
export interface AnswerEnvelope {
  question: string;
  answer: string; // short natural-language summary of the result
  chartType: ChartType;
  result: ToolResult;
  explanation: Explanation;
  /** How the plan was produced: the real model, or the deterministic fallback. */
  routedBy: "openai" | "mock";
}
