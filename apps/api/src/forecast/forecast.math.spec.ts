import { describe, expect, it } from "vitest";
import {
  addMonths,
  linearForecast,
  monthRange,
  movingAverageForecast,
} from "./forecast.math";

describe("addMonths", () => {
  it("advances and rolls over years", () => {
    expect(addMonths("2025-11", 2)).toBe("2026-01");
    expect(addMonths("2025-01", -1)).toBe("2024-12");
    expect(addMonths("2025-06", 0)).toBe("2025-06");
  });
});

describe("monthRange", () => {
  it("lists inclusive month buckets", () => {
    expect(monthRange("2025-01", "2025-04")).toEqual([
      "2025-01",
      "2025-02",
      "2025-03",
      "2025-04",
    ]);
  });

  it("returns a single month when start equals end", () => {
    expect(monthRange("2025-03", "2025-03")).toEqual(["2025-03"]);
  });
});

describe("linearForecast", () => {
  it("projects a perfect linear trend", () => {
    // y = 1 + 1*t over [1,2,3,4]; next points at t=4,5 -> 5,6
    const out = linearForecast([1, 2, 3, 4], 2);
    expect(out[0]).toBeCloseTo(5, 6);
    expect(out[1]).toBeCloseTo(6, 6);
  });

  it("clamps negative projections to zero", () => {
    // y = 5 - 2*t over [5,3,1]; t=3 -> -1, t=4 -> -3, both clamped to 0
    expect(linearForecast([5, 3, 1], 2)).toEqual([0, 0]);
  });

  it("handles empty and single-point history", () => {
    expect(linearForecast([], 3)).toEqual([0, 0, 0]);
    expect(linearForecast([7], 2)).toEqual([7, 7]);
  });
});

describe("movingAverageForecast", () => {
  it("projects a flat line at the mean of the last window", () => {
    expect(movingAverageForecast([2, 4, 6], 2, 3)).toEqual([4, 4]);
    // only the last 3 months count: mean(2,3,10) = 5
    expect(movingAverageForecast([1, 2, 3, 10], 2, 3)).toEqual([5, 5]);
  });

  it("returns zeros for empty history", () => {
    expect(movingAverageForecast([], 3)).toEqual([0, 0, 0]);
  });
});
