import { Prisma } from "@spaceship/db";
import type { Filters } from "@spaceship/shared";

/**
 * Translate a validated Filters object into a Prisma `where` clause.
 *
 * This is the ONLY place filters become a database query. Every value already
 * passed Zod validation (correct types, known enums), and Prisma parameterizes
 * the query — so there is no string interpolation and no raw SQL anywhere.
 */
export function buildWhere(filters: Filters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (filters.status) where.status = { in: filters.status };
  if (filters.carrier) where.carrier = { in: filters.carrier };
  if (filters.region) where.region = { in: filters.region };
  if (filters.productCategory)
    where.productCategory = { in: filters.productCategory };
  if (filters.sku) where.sku = { in: filters.sku };
  if (filters.destinationCity)
    where.destinationCity = { in: filters.destinationCity };
  if (filters.originCity) where.originCity = { in: filters.originCity };
  if (filters.warehouse) where.warehouse = { in: filters.warehouse };
  if (filters.clientId) where.clientId = { in: filters.clientId };

  if (filters.dateFrom || filters.dateTo) {
    const orderDate: Prisma.DateTimeFilter = {};
    if (filters.dateFrom)
      orderDate.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    if (filters.dateTo)
      orderDate.lte = new Date(`${filters.dateTo}T00:00:00.000Z`);
    where.orderDate = orderDate;
  }

  return where;
}
