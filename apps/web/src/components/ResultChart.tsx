import type { AnswerEnvelope } from "@spaceship/shared";
import {
  formatMetricValue,
  METRIC_LABELS,
  humanize,
  shortMonth,
} from "../lib/format";
import { CATEGORICAL, STATUS_COLOR } from "../lib/theme";
import { BreakdownBar } from "./charts/BreakdownBar";
import { ForecastLine } from "./charts/ForecastLine";
import { TrendLine } from "./charts/TrendLine";

/** Renders any tool result using the deterministically-selected chart type. */
export function ResultChart({ env }: { env: AnswerEnvelope }) {
  const { result, chartType } = env;

  if (result.kind === "forecast") {
    return <ForecastLine series={result.series} />;
  }

  const vf = (n: number) => formatMetricValue(result.metric, n, result.isRate);

  if (chartType === "kpi") {
    const value = result.data[0]?.value ?? 0;
    return (
      <div className="kpi" style={{ maxWidth: 300 }}>
        <div className="kpi__label">{METRIC_LABELS[result.metric]}</div>
        <div className="kpi__value">{vf(value)}</div>
      </div>
    );
  }

  if (chartType === "line") {
    return (
      <TrendLine
        data={result.data}
        xFormat={result.groupBy === "month" ? shortMonth : undefined}
        valueFormat={vf}
      />
    );
  }

  // bar breakdown
  const colorFor =
    result.groupBy === "status"
      ? (label: string) => STATUS_COLOR[label] ?? "var(--accent)"
      : (_: string, i: number) => CATEGORICAL[i % CATEGORICAL.length] as string;

  return (
    <BreakdownBar
      data={result.data}
      labelFormat={result.groupBy === "status" ? humanize : undefined}
      valueFormat={vf}
      colorFor={colorFor}
    />
  );
}
