import { PrismaClient } from "@prisma/client";

/**
 * Single shared PrismaClient instance. Cached on globalThis in non-production so
 * hot-reload during development doesn't exhaust the connection pool.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export generated types (Prisma namespace, OrderStatus enum, model types)
// so consumers depend only on @spaceship/db.
export * from "@prisma/client";
