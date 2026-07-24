import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DataPoint } from "@spaceship/shared";
import { AXIS_TICK, ChartTooltip } from "./ChartTooltip";

interface Props {
  data: DataPoint[];
  colorFor?: (label: string, index: number) => string;
  labelFormat?: (s: string) => string;
  valueFormat?: (n: number) => string;
  height?: number;
}

/** Horizontal bar chart for a categorical breakdown, one color per bar. */
export function BreakdownBar({
  data,
  colorFor,
  labelFormat,
  valueFormat,
  height,
}: Props) {
  const h = height ?? Math.max(160, data.length * 40 + 24);

  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 20, left: 6, bottom: 4 }}
      >
        <CartesianGrid stroke="var(--line)" horizontal={false} />
        <XAxis
          type="number"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--line)" }}
          tickFormatter={valueFormat}
        />
        <YAxis
          type="category"
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={96}
          tickFormatter={labelFormat}
        />
        <Tooltip
          content={
            <ChartTooltip valueFormat={valueFormat} labelFormat={labelFormat} />
          }
          cursor={{ fill: "var(--accent-soft)" }}
        />
        <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={24}>
          {data.map((d, i) => (
            <Cell
              key={d.label}
              fill={colorFor ? colorFor(d.label, i) : "var(--accent)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
