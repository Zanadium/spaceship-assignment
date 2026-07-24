/**
 * Distinct dimension values in the dataset. Serves two purposes: the frontend
 * builds its filter controls from this, and the AI router is grounded with these
 * valid values so it maps free-text ("FedEx", "the west region") onto real keys.
 */
export interface FilterMeta {
  carriers: string[];
  regions: string[];
  productCategories: string[];
  statuses: string[];
  warehouses: string[];
  /** Capped list of SKUs (the full set can be large). */
  skus: string[];
  dateRange: { min: string; max: string };
}
