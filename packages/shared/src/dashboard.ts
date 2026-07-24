import type { DataPoint } from "./results";
import type { Filters } from "./query-plan";

/** The five headline KPIs required by the spec. */
export interface DashboardKpis {
  totalOrders: number;
  deliveredOrders: number;
  delayedOrders: number;
  /** Delivered / (delivered + delayed + exception), 0..1. */
  onTimeRate: number;
  /** Mean days from order to delivery over delivered orders. */
  avgDeliveryDays: number;
}

/** Everything the dashboard renders, computed server-side in one round trip. */
export interface DashboardData {
  kpis: DashboardKpis;
  /** Order volume over time (order_count grouped by month). */
  orderVolumeByMonth: DataPoint[];
  /** Delivery performance breakdown (order_count grouped by status). */
  deliveryPerformance: DataPoint[];
  /** Order_count grouped by carrier, highest first. */
  carrierBreakdown: DataPoint[];
  /** Filters that were applied (echoed for explainability). */
  filters: Filters;
}
