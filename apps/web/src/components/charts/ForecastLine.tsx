import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastPoint } from "@spaceship/shared";
import { shortMonth } from "../../lib/format";
import { AXIS_TICK, ChartTooltip } from "./ChartTooltip";

interface Row {
  period: string;
  historical: number | null;
  forecast: number | null;
}

/** Line chart showing historical demand (solid) and projection (dashed). */
export function ForecastLine({
  series,
  height = 300,
}: {
  series: ForecastPoint[];
  height?: number;
}) {
  const rows: Row[] = series.map((p) => ({
    period: p.period,
    historical: p.kind === "historical" ? p.value : null,
    forecast: p.kind === "forecast" ? p.value : null,
  }));

  // Bridge the boundary so the dashed forecast line connects to the history.
  let lastHist = -1;
  rows.forEach((r, i) => {
    if (r.historical !== null) lastHist = i;
  });
  if (lastHist >= 0) {
    const bridge = rows[lastHist];
    if (bridge) bridge.forecast = bridge.historical;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 6, paddingLeft: 8 }}>
        <Legend color="var(--info)" label="Historical" />
        <Legend color="var(--accent)" label="Forecast" dashed />
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={rows} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={shortMonth}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--line)" }}
            minTickGap={16}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            content={<ChartTooltip labelFormat={shortMonth} />}
            cursor={{ stroke: "var(--accent-line)" }}
          />
          <Line
            name="Historical"
            type="monotone"
            dataKey="historical"
            stroke="var(--info)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            name="Forecast"
            type="monotone"
            dataKey="forecast"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={{ r: 3, fill: "var(--accent)" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: "var(--font-mono)",
        fontSize: 10.5,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--text-faint)",
      }}
    >
      <span
        style={{
          width: 16,
          height: 0,
          borderTop: `2px ${dashed ? "dashed" : "solid"} ${color}`,
        }}
      />
      {label}
    </span>
  );
}
