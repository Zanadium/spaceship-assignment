import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DataPoint } from "@spaceship/shared";
import { AXIS_TICK, ChartTooltip } from "./ChartTooltip";

interface Props {
  data: DataPoint[];
  color?: string;
  height?: number;
  xFormat?: (s: string) => string;
  valueFormat?: (n: number) => string;
}

/** Area/line chart for a time series of {label, value} points. */
export function TrendLine({
  data,
  color = "var(--accent)",
  height = 280,
  xFormat,
  valueFormat,
}: Props) {
  const gid = useId().replace(/:/g, "");

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.26} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--line)" vertical={false} />
        <XAxis
          dataKey="label"
          tickFormatter={xFormat}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--line)" }}
          minTickGap={18}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={valueFormat}
        />
        <Tooltip
          content={
            <ChartTooltip valueFormat={valueFormat} labelFormat={xFormat} />
          }
          cursor={{ stroke: "var(--accent-line)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gid})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: "var(--bg)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
