/**
 * Pure forecasting math. No dependencies on Nest/Prisma so the models can be
 * unit-tested directly. Two simple, transparent methods — deliberately basic per
 * the spec (no black-box models); every number is reproducible by hand.
 */

/** Add `months` to a "YYYY-MM" period string. */
export function addMonths(period: string, months: number): string {
  const [y, m] = period.split("-").map(Number);
  const zero = (y as number) * 12 + ((m as number) - 1) + months;
  const year = Math.floor(zero / 12);
  const month = (zero % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Inclusive list of "YYYY-MM" periods from `start` to `end`. */
export function monthRange(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  // Guard against pathological inputs.
  for (let i = 0; i < 1000 && cur <= end; i++) {
    out.push(cur);
    cur = addMonths(cur, 1);
  }
  return out;
}

/**
 * Linear-regression (ordinary least squares) forecast. Fits value ≈ a + b·t over
 * the historical points and projects `horizon` steps ahead. Negatives are clamped
 * to zero (demand can't be negative).
 */
export function linearForecast(history: number[], horizon: number): number[] {
  const n = history.length;
  if (n === 0) return new Array(horizon).fill(0);
  if (n === 1) return new Array(horizon).fill(Math.max(0, history[0] as number));

  const meanX = (n - 1) / 2;
  const meanY = history.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * ((history[i] as number) - meanY);
    den += (i - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  const out: number[] = [];
  for (let h = 0; h < horizon; h++) {
    out.push(Math.max(0, intercept + slope * (n + h)));
  }
  return out;
}

/**
 * Moving-average forecast. Projects a flat line at the mean of the last `window`
 * observed months. Good when demand is noisy but roughly stationary.
 */
export function movingAverageForecast(
  history: number[],
  horizon: number,
  window = 3,
): number[] {
  const n = history.length;
  if (n === 0) return new Array(horizon).fill(0);
  const w = Math.min(window, n);
  const level = history.slice(n - w).reduce((a, b) => a + b, 0) / w;
  return new Array(horizon).fill(Math.max(0, level));
}
