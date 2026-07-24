import { Injectable } from "@nestjs/common";
import {
  PlanSchema,
  type FilterMeta,
  type Filters,
  type Metric,
  type Dimension,
  type RouterOutput,
} from "@spaceship/shared";
import { METRIC_LABELS } from "../common/labels";
import type { QuestionRouter } from "./router.types";

/**
 * Deterministic keyword-based router. Used when no OpenAI key is configured (or
 * as a fallback when the model errors), so the whole application stays usable
 * without any external dependency. It is intentionally simple heuristics — good
 * enough for the documented example questions, not a substitute for the LLM.
 */
@Injectable()
export class MockRouter implements QuestionRouter {
  readonly name = "mock" as const;

  async route(question: string, meta: FilterMeta): Promise<RouterOutput> {
    const q = question.toLowerCase();

    if (this.isForecast(q)) {
      return this.buildForecast(q, meta);
    }
    return this.buildQuery(q, meta);
  }

  private isForecast(q: string): boolean {
    return /\b(forecast|predict|projection|project|demand|inventory|stock|restock|how much.*(plan|order|stock))\b/.test(
      q,
    );
  }

  private buildForecast(q: string, meta: FilterMeta): RouterOutput {
    // Match a SKU token directly (e.g. "paper-0197") rather than scanning the
    // capped SKU list, so any valid SKU is recognized.
    const skuMatch = q.match(/\b([a-z]+-\d+)\b/);
    const sku = skuMatch ? (skuMatch[1] as string).toUpperCase() : undefined;
    const category = sku
      ? undefined
      : meta.productCategories.find((c) => q.includes(c.toLowerCase()));
    const horizon = this.extractHorizon(q);
    const target: "quantity" | "order_count" = /\borders?\b/.test(q)
      ? "order_count"
      : "quantity";

    const plan = PlanSchema.parse({
      tool: "forecast",
      target,
      ...(sku ? { sku } : {}),
      ...(category ? { productCategory: category } : {}),
      horizonMonths: horizon,
      method: "linear_regression",
      filters: {},
    });

    const subject = sku
      ? `SKU ${sku}`
      : category
        ? `category ${category}`
        : "all orders";
    return {
      interpretation: `Forecast ${target === "quantity" ? "unit demand" : "order volume"} for ${subject} over the next ${horizon} months using linear regression.`,
      plan,
    };
  }

  private buildQuery(q: string, meta: FilterMeta): RouterOutput {
    const metric = this.detectMetric(q);
    const groupBy = this.detectDimension(q);
    const filters = this.detectFilters(q, meta, metric);
    const sort = this.detectSort(q);

    const plan = PlanSchema.parse({
      tool: "query",
      metric,
      ...(groupBy ? { groupBy } : {}),
      ...(sort ? { sort } : {}),
      filters,
    });

    const parts = [`Compute ${METRIC_LABELS[metric]}`];
    if (groupBy) parts.push(`broken down by ${groupBy.replace(/_/g, " ")}`);
    if (sort) parts.push(`(${sort === "desc" ? "highest first" : "lowest first"})`);
    return { interpretation: `${parts.join(" ")}.`, plan };
  }

  private detectMetric(q: string): Metric {
    if (/delay rate|delayed rate|rate of delay/.test(q)) return "delay_rate";
    if (/on[- ]?time|on time/.test(q)) return "on_time_rate";
    if (/average delivery|avg delivery|delivery time|how long/.test(q))
      return "avg_delivery_days";
    // Check late/delayed before "delivered" so "delivered late" reads as delayed.
    if (/\bdelayed\b|\blate\b/.test(q)) return "delayed_count";
    if (/\bdelivered\b/.test(q)) return "delivered_count";
    if (/revenue|order value|sales|gmv|\bvalue\b/.test(q))
      return "total_order_value";
    if (/quantity|units sold|total units/.test(q)) return "total_quantity";
    return "order_count";
  }

  private detectDimension(q: string): Dimension | undefined {
    if (/by week|weekly|per week/.test(q)) return "week";
    if (/by day|daily|per day/.test(q)) return "day";
    if (/by month|monthly|over time|trend|per month/.test(q)) return "month";
    if (/carrier/.test(q)) return "carrier";
    if (/region/.test(q)) return "region";
    if (/by status|status/.test(q)) return "status";
    if (/destination|city/.test(q)) return "destination_city";
    if (/category/.test(q)) return "product_category";
    if (/warehouse/.test(q)) return "warehouse";
    if (/\bsku\b/.test(q)) return "sku";
    if (/client|customer/.test(q)) return "client_id";
    return undefined;
  }

  private detectFilters(q: string, meta: FilterMeta, metric: Metric): Filters {
    const filters: Filters = {};

    const carrier = meta.carriers.find((c) => q.includes(c.toLowerCase()));
    if (carrier) filters.carrier = [carrier];

    const region = meta.regions.find((r) => q.includes(r.toLowerCase()));
    if (region) filters.region = [region];

    const category = meta.productCategories.find((c) =>
      q.includes(c.toLowerCase()),
    );
    if (category) filters.productCategory = [category];

    // Only add a status filter when the metric isn't already status-specific.
    if (metric === "order_count") {
      if (/\bin[- ]?transit\b/.test(q)) filters.status = ["in_transit"];
      else if (/\bexception\b/.test(q)) filters.status = ["exception"];
      else if (/\bcanceled\b|\bcancelled\b/.test(q)) filters.status = ["canceled"];
    }

    const dateFilter = this.detectDateRange(q, meta);
    if (dateFilter) Object.assign(filters, dateFilter);

    return filters;
  }

  private detectSort(q: string): "asc" | "desc" | undefined {
    if (/highest|most|top|worst|maximum|largest/.test(q)) return "desc";
    if (/lowest|least|fewest|best|minimum|smallest/.test(q)) return "asc";
    return undefined;
  }

  private extractHorizon(q: string): number {
    const m = q.match(/(\d+)\s*month/);
    if (m) return Math.min(12, Math.max(1, Number.parseInt(m[1] as string, 10)));
    return 4;
  }

  /** Interpret "last month" / "last N months" relative to the dataset's max date. */
  private detectDateRange(
    q: string,
    meta: FilterMeta,
  ): Pick<Filters, "dateFrom" | "dateTo"> | undefined {
    const max = meta.dateRange.max;
    if (!max) return undefined;

    const multi = q.match(/last\s+(\d+)\s+months?/);
    if (multi) {
      const n = Number.parseInt(multi[1] as string, 10);
      return { dateFrom: monthStart(max, -(n - 1)), dateTo: max };
    }
    if (/last month|previous month/.test(q)) {
      return { dateFrom: monthStart(max, 0), dateTo: max };
    }
    return undefined;
  }
}

/** First day of the month `offset` months from the month containing `isoDate`. */
function monthStart(isoDate: string, offset: number): string {
  const [y, m] = isoDate.split("-").map(Number);
  const zero = (y as number) * 12 + ((m as number) - 1) + offset;
  const year = Math.floor(zero / 12);
  const month = (zero % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}
