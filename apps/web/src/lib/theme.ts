import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";
const THEME_KEY = "spaceship_theme";

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme) ?? "dark",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );
  return [theme, toggle];
}

/**
 * Chart palette expressed as CSS variables so colors follow the active theme
 * automatically. Used consistently across every chart for one visual system.
 */
export const SERIES = {
  primary: "var(--accent)",
  good: "var(--good)",
  bad: "var(--bad)",
  warn: "var(--warn)",
  info: "var(--info)",
  faint: "var(--text-faint)",
} as const;

/** Ordered categorical palette for multi-series breakdowns (carriers, etc.). */
export const CATEGORICAL = [
  "var(--accent)",
  "var(--good)",
  "var(--info)",
  "var(--warn)",
  "var(--bad)",
  "var(--accent-2)",
  "var(--text-dim)",
] as const;

/** Fixed color per order status, reused wherever status appears. */
export const STATUS_COLOR: Record<string, string> = {
  delivered: "var(--good)",
  delayed: "var(--bad)",
  in_transit: "var(--info)",
  exception: "var(--warn)",
  canceled: "var(--text-faint)",
};
