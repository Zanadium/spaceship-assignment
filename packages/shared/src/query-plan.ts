import { z } from "zod";
import {
  DimensionEnum,
  MetricEnum,
  OrderStatusEnum,
} from "./enums";

/**
 * The query plan is the contract between AI interpretation and data computation.
 *
 * The AI layer NEVER emits SQL. It emits one of these structured, validated
 * plans; a deterministic builder turns the plan into Prisma queries. Because the
 * plan is fully typed and range-checked here, an out-of-vocabulary field or a
 * malformed filter is rejected before it can ever touch the database.
 *
 * The validated plan is also the explainability payload returned to the UI:
 * it literally lists the metric, dimension, and filters that produced a result.
 */

const ISO_DATE = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)");

/** Filters apply to both tools. All fields are optional and ANDed together. */
export const FiltersSchema = z
  .object({
    status: z.array(OrderStatusEnum).nonempty().optional(),
    carrier: z.array(z.string()).nonempty().optional(),
    region: z.array(z.string()).nonempty().optional(),
    productCategory: z.array(z.string()).nonempty().optional(),
    sku: z.array(z.string()).nonempty().optional(),
    destinationCity: z.array(z.string()).nonempty().optional(),
    originCity: z.array(z.string()).nonempty().optional(),
    warehouse: z.array(z.string()).nonempty().optional(),
    clientId: z.array(z.string()).nonempty().optional(),
    /** Inclusive lower bound on order_date. */
    dateFrom: ISO_DATE.optional(),
    /** Inclusive upper bound on order_date. */
    dateTo: ISO_DATE.optional(),
  })
  .strict();
export type Filters = z.infer<typeof FiltersSchema>;

/** Query Tool: aggregations, KPIs, and grouped breakdowns. */
export const QueryPlanSchema = z
  .object({
    tool: z.literal("query"),
    metric: MetricEnum,
    /** Omit for a single scalar KPI; set to break the metric down by dimension. */
    groupBy: DimensionEnum.optional(),
    filters: FiltersSchema.default({}),
    /** Sort direction for grouped results (by metric value). */
    sort: z.enum(["asc", "desc"]).optional(),
    /** Cap on the number of grouped rows returned. */
    limit: z.number().int().positive().max(500).optional(),
  })
  .strict();
export type QueryPlan = z.infer<typeof QueryPlanSchema>;

/** Forecasting Tool: predict future demand from historical monthly data. */
export const ForecastPlanSchema = z
  .object({
    tool: z.literal("forecast"),
    /** What to forecast: units sold or number of orders. */
    target: z.enum(["quantity", "order_count"]).default("quantity"),
    /** Narrow the history to a single SKU (most common) ... */
    sku: z.string().optional(),
    /** ... or to a product category. */
    productCategory: z.string().optional(),
    filters: FiltersSchema.default({}),
    /** How many months ahead to project. */
    horizonMonths: z.number().int().min(1).max(12).default(4),
    method: z
      .enum(["moving_average", "linear_regression"])
      .default("linear_regression"),
  })
  .strict();
export type ForecastPlan = z.infer<typeof ForecastPlanSchema>;

/** A plan is exactly one tool invocation, discriminated by `tool`. */
export const PlanSchema = z.discriminatedUnion("tool", [
  QueryPlanSchema,
  ForecastPlanSchema,
]);
export type Plan = z.infer<typeof PlanSchema>;

/**
 * What the AI router is asked to produce: a plan plus a short natural-language
 * restatement of how it understood the question (shown in the explanation panel).
 */
export const RouterOutputSchema = z.object({
  interpretation: z.string().min(1),
  plan: PlanSchema,
});
export type RouterOutput = z.infer<typeof RouterOutputSchema>;
