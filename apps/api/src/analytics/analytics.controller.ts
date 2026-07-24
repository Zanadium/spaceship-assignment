import { Controller, Get, Query } from "@nestjs/common";
import {
  FiltersSchema,
  type DashboardData,
  type FilterMeta,
  type Filters,
} from "@spaceship/shared";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  /** Distinct dimension values for the filter UI. */
  @Get("meta")
  meta(): Promise<FilterMeta> {
    return this.analytics.getFilterMeta();
  }

  /** Dashboard KPIs + chart series, optionally scoped to a global date range. */
  @Get("dashboard")
  dashboard(
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
  ): Promise<DashboardData> {
    const filters: Filters = FiltersSchema.parse({
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    });
    return this.analytics.getDashboard(filters);
  }
}
