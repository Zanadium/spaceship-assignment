import { Injectable } from "@nestjs/common";
import type {
  ForecastPlan,
  ForecastPoint,
  ForecastResult,
  Filters,
} from "@spaceship/shared";
import { PrismaService } from "../prisma/prisma.service";
import { buildWhere } from "../analytics/where";
import {
  addMonths,
  linearForecast,
  monthRange,
  movingAverageForecast,
} from "./forecast.math";

/** Safety-stock multiplier applied to predicted demand for the inventory rec. */
const SAFETY_STOCK = 1.1;
const MA_WINDOW = 3;

/**
 * The Forecasting Tool. Aggregates historical demand into a monthly series,
 * applies a basic forecasting method, and returns the projection plus an
 * inventory recommendation and a plain-language methodology note.
 */
@Injectable()
export class ForecastService {
  constructor(private readonly prisma: PrismaService) {}

  async runForecast(plan: ForecastPlan): Promise<ForecastResult> {
    const filters: Filters = { ...plan.filters };
    if (plan.sku) filters.sku = [plan.sku];
    if (plan.productCategory) filters.productCategory = [plan.productCategory];

    const rows = await this.prisma.order.findMany({
      where: buildWhere(filters),
      select: { orderDate: true, quantity: true },
    });

    const subject = plan.sku
      ? `SKU ${plan.sku}`
      : plan.productCategory
        ? `category ${plan.productCategory}`
        : "all orders";

    // Aggregate demand into monthly buckets.
    const byMonth = new Map<string, number>();
    for (const r of rows) {
      const period = r.orderDate.toISOString().slice(0, 7);
      const inc = plan.target === "quantity" ? r.quantity : 1;
      byMonth.set(period, (byMonth.get(period) ?? 0) + inc);
    }

    if (byMonth.size === 0) {
      return {
        kind: "forecast",
        target: plan.target,
        method: plan.method,
        subject,
        series: [],
        inventoryRecommendation: 0,
        methodology: `No historical ${plan.target === "quantity" ? "demand" : "order"} data was found for ${subject}, so no forecast could be produced.`,
      };
    }

    // Build a gap-filled monthly history (missing months count as zero demand).
    const months = [...byMonth.keys()].sort();
    const first = months[0] as string;
    const last = months[months.length - 1] as string;
    const fullRange = monthRange(first, last);
    const history = fullRange.map((m) => byMonth.get(m) ?? 0);

    const forecastValues = (
      plan.method === "moving_average"
        ? movingAverageForecast(history, plan.horizonMonths, MA_WINDOW)
        : linearForecast(history, plan.horizonMonths)
    ).map(round2);

    const historicalSeries: ForecastPoint[] = fullRange.map((period, i) => ({
      period,
      value: round2(history[i] as number),
      kind: "historical",
    }));
    const forecastSeries: ForecastPoint[] = forecastValues.map((value, h) => ({
      period: addMonths(last, h + 1),
      value,
      kind: "forecast",
    }));

    const totalForecast = forecastValues.reduce((a, b) => a + b, 0);
    const inventoryRecommendation = Math.ceil(totalForecast * SAFETY_STOCK);

    return {
      kind: "forecast",
      target: plan.target,
      method: plan.method,
      subject,
      series: [...historicalSeries, ...forecastSeries],
      inventoryRecommendation,
      methodology: this.describe(
        plan,
        history.length,
        first,
        last,
        round2(totalForecast),
        inventoryRecommendation,
      ),
    };
  }

  private describe(
    plan: ForecastPlan,
    historyMonths: number,
    first: string,
    last: string,
    totalForecast: number,
    inventory: number,
  ): string {
    const unit = plan.target === "quantity" ? "units" : "orders";
    const methodText =
      plan.method === "moving_average"
        ? `a ${MA_WINDOW}-month moving average (flat projection at the recent mean)`
        : "ordinary least-squares linear regression (fitted trend line)";

    return [
      `Forecast for ${this.subjectOf(plan)} over the next ${plan.horizonMonths} month(s).`,
      `Method: ${methodText}, fit on ${historyMonths} month(s) of monthly demand history (${first} to ${last}); months with no orders are treated as zero.`,
      `Predicted total demand over the horizon is ${totalForecast} ${unit}. The inventory recommendation adds a ${Math.round((SAFETY_STOCK - 1) * 100)}% safety buffer, giving ${inventory} ${unit}.`,
    ].join(" ");
  }

  private subjectOf(plan: ForecastPlan): string {
    return plan.sku
      ? `SKU ${plan.sku}`
      : plan.productCategory
        ? `category ${plan.productCategory}`
        : "all orders";
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
