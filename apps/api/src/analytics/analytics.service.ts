import { Injectable } from "@nestjs/common";
import type {
  DashboardData,
  DataPoint,
  FilterMeta,
  Filters,
  QueryPlan,
  QueryResult,
} from "@spaceship/shared";
import { PrismaService } from "../prisma/prisma.service";
import {
  computeMetric,
  groupKey,
  isTimeBucket,
  RATE_METRICS,
  type OrderRow,
} from "./aggregate";
import { buildWhere } from "./where";

/**
 * The Query Tool. Executes a validated QueryPlan against the database and
 * returns a structured, chartable result. All filtering is pushed to Prisma;
 * metric computation is delegated to the pure `aggregate` module.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async runQuery(plan: QueryPlan): Promise<QueryResult> {
    const rows = await this.fetchRows(plan.filters);
    const isRate = RATE_METRICS.includes(plan.metric);

    if (!plan.groupBy) {
      return {
        kind: "query",
        metric: plan.metric,
        data: [{ label: "total", value: computeMetric(plan.metric, rows) }],
        isRate,
      };
    }

    const groups = new Map<string, OrderRow[]>();
    for (const row of rows) {
      const key = groupKey(plan.groupBy, row);
      const bucket = groups.get(key);
      if (bucket) bucket.push(row);
      else groups.set(key, [row]);
    }

    let data: DataPoint[] = [...groups.entries()].map(([label, groupRows]) => ({
      label,
      value: computeMetric(plan.metric, groupRows),
    }));

    if (isTimeBucket(plan.groupBy)) {
      // ISO labels sort chronologically as plain strings.
      data.sort((a, b) => a.label.localeCompare(b.label));
      if (plan.sort === "desc") data.reverse();
    } else {
      const dir = plan.sort === "asc" ? 1 : -1;
      data.sort((a, b) => (a.value - b.value) * dir);
    }

    if (plan.limit) data = data.slice(0, plan.limit);

    return {
      kind: "query",
      metric: plan.metric,
      groupBy: plan.groupBy,
      data,
      isRate,
    };
  }

  /** Compose the dashboard from four canned query plans over the same filters. */
  async getDashboard(filters: Filters = {}): Promise<DashboardData> {
    const rows = await this.fetchRows(filters);

    const kpis = {
      totalOrders: computeMetric("order_count", rows),
      deliveredOrders: computeMetric("delivered_count", rows),
      delayedOrders: computeMetric("delayed_count", rows),
      onTimeRate: computeMetric("on_time_rate", rows),
      avgDeliveryDays: computeMetric("avg_delivery_days", rows),
    };

    const orderVolumeByMonth = this.groupInMemory(rows, "month", "order_count", {
      chronological: true,
    });
    const deliveryPerformance = this.groupInMemory(
      rows,
      "status",
      "order_count",
      { chronological: false },
    );
    const carrierBreakdown = this.groupInMemory(
      rows,
      "carrier",
      "order_count",
      { chronological: false },
    );

    return {
      kpis,
      orderVolumeByMonth,
      deliveryPerformance,
      carrierBreakdown,
      filters,
    };
  }

  /** Distinct dimension values, for the filter UI and for grounding the AI. */
  async getFilterMeta(): Promise<FilterMeta> {
    const distinct = async (
      field: "carrier" | "region" | "productCategory" | "warehouse",
    ): Promise<string[]> => {
      const rows = await this.prisma.order.findMany({
        distinct: [field],
        select: { [field]: true },
        orderBy: { [field]: "asc" },
      });
      return rows.map((r) => r[field] as string);
    };

    const [carriers, regions, productCategories, warehouses, skuRows, range] =
      await Promise.all([
        distinct("carrier"),
        distinct("region"),
        distinct("productCategory"),
        distinct("warehouse"),
        this.prisma.order.findMany({
          distinct: ["sku"],
          select: { sku: true },
          orderBy: { sku: "asc" },
          take: 100,
        }),
        this.prisma.order.aggregate({
          _min: { orderDate: true },
          _max: { orderDate: true },
        }),
      ]);

    return {
      carriers,
      regions,
      productCategories,
      warehouses,
      statuses: ["delivered", "delayed", "in_transit", "exception", "canceled"],
      skus: skuRows.map((r) => r.sku),
      dateRange: {
        min: range._min.orderDate?.toISOString().slice(0, 10) ?? "",
        max: range._max.orderDate?.toISOString().slice(0, 10) ?? "",
      },
    };
  }

  /** In-memory group+metric used by the dashboard (rows already fetched once). */
  private groupInMemory(
    rows: OrderRow[],
    dimension: Parameters<typeof groupKey>[0],
    metric: Parameters<typeof computeMetric>[0],
    opts: { chronological: boolean },
  ): DataPoint[] {
    const groups = new Map<string, OrderRow[]>();
    for (const row of rows) {
      const key = groupKey(dimension, row);
      const bucket = groups.get(key);
      if (bucket) bucket.push(row);
      else groups.set(key, [row]);
    }
    const data = [...groups.entries()].map(([label, groupRows]) => ({
      label,
      value: computeMetric(metric, groupRows),
    }));
    if (opts.chronological) data.sort((a, b) => a.label.localeCompare(b.label));
    else data.sort((a, b) => b.value - a.value);
    return data;
  }

  private async fetchRows(filters: Filters): Promise<OrderRow[]> {
    const records = await this.prisma.order.findMany({
      where: buildWhere(filters),
      select: {
        orderDate: true,
        status: true,
        deliveryDays: true,
        orderValueUsd: true,
        quantity: true,
        carrier: true,
        region: true,
        destinationCity: true,
        originCity: true,
        productCategory: true,
        sku: true,
        warehouse: true,
        clientId: true,
      },
    });

    // Decimal columns come back as Prisma.Decimal; normalize to number.
    return records.map((r) => ({
      ...r,
      orderValueUsd: Number(r.orderValueUsd),
    }));
  }
}
