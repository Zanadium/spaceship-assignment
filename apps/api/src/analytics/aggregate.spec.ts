import { describe, expect, it } from "vitest";
import type { OrderStatus } from "@spaceship/shared";
import { computeMetric, groupKey, isTimeBucket, type OrderRow } from "./aggregate";

/** Build an OrderRow with sensible defaults, overriding only what a test needs. */
function row(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    orderDate: new Date("2025-10-19T00:00:00.000Z"),
    status: "delivered" as OrderStatus,
    deliveryDays: 3,
    orderValueUsd: 10,
    quantity: 1,
    carrier: "DHL",
    region: "UK",
    destinationCity: "Leeds, UK",
    originCity: "London, UK",
    productCategory: "PAPER",
    sku: "PAPER-0001",
    warehouse: "LON-FC1",
    clientId: "CL-1001",
    ...overrides,
  };
}

describe("computeMetric", () => {
  const rows = [
    row({ status: "delivered", deliveryDays: 2, orderValueUsd: 10, quantity: 2 }),
    row({ status: "delivered", deliveryDays: 4, orderValueUsd: 5.5, quantity: 3 }),
    row({ status: "delayed", deliveryDays: 7, orderValueUsd: 20, quantity: 1 }),
    row({ status: "exception", deliveryDays: null, orderValueUsd: 4.5, quantity: 1 }),
    row({ status: "in_transit", deliveryDays: null, orderValueUsd: 100, quantity: 5 }),
  ];

  it("counts orders and status subsets", () => {
    expect(computeMetric("order_count", rows)).toBe(5);
    expect(computeMetric("delivered_count", rows)).toBe(2);
    expect(computeMetric("delayed_count", rows)).toBe(1);
  });

  it("sums value and quantity", () => {
    expect(computeMetric("total_order_value", rows)).toBe(140);
    expect(computeMetric("total_quantity", rows)).toBe(12);
  });

  it("averages delivery days ignoring nulls", () => {
    // (2 + 4 + 7) / 3 = 4.3333 -> rounded to 4.33
    expect(computeMetric("avg_delivery_days", rows)).toBe(4.33);
  });

  it("computes on-time rate over terminal statuses only", () => {
    // terminal = delivered(2) + delayed(1) + exception(1) = 4; delivered/terminal = 2/4
    expect(computeMetric("on_time_rate", rows)).toBe(0.5);
    // in_transit is excluded from the denominator
    expect(computeMetric("delay_rate", rows)).toBe(0.25);
  });

  it("returns zero rates when there are no terminal orders", () => {
    const inTransitOnly = [row({ status: "in_transit", deliveryDays: null })];
    expect(computeMetric("on_time_rate", inTransitOnly)).toBe(0);
    expect(computeMetric("avg_delivery_days", inTransitOnly)).toBe(0);
  });
});

describe("groupKey", () => {
  const r = row({ orderDate: new Date("2025-10-19T00:00:00.000Z") }); // a Sunday

  it("buckets time dimensions in UTC", () => {
    expect(groupKey("day", r)).toBe("2025-10-19");
    expect(groupKey("month", r)).toBe("2025-10");
    // ISO week: Monday of the week containing Sun 2025-10-19 is 2025-10-13
    expect(groupKey("week", r)).toBe("2025-10-13");
  });

  it("returns raw values for categorical dimensions", () => {
    expect(groupKey("carrier", r)).toBe("DHL");
    expect(groupKey("status", r)).toBe("delivered");
    expect(groupKey("region", r)).toBe("UK");
  });
});

describe("isTimeBucket", () => {
  it("identifies only day/week/month as time buckets", () => {
    expect(isTimeBucket("day")).toBe(true);
    expect(isTimeBucket("week")).toBe(true);
    expect(isTimeBucket("month")).toBe(true);
    expect(isTimeBucket("carrier")).toBe(false);
  });
});
