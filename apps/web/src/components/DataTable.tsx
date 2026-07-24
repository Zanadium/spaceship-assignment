import { useState } from "react";
import type { AnswerEnvelope } from "@spaceship/shared";
import { formatMetricValue, humanize, shortMonth } from "../lib/format";

/** Collapsible table of the underlying rows behind a result (explainability). */
export function DataTable({ env }: { env: AnswerEnvelope }) {
  const [open, setOpen] = useState(false);
  const { result } = env;

  const rowCount =
    result.kind === "forecast" ? result.series.length : result.data.length;

  return (
    <div style={{ marginTop: 14 }}>
      <button className="explain__title" onClick={() => setOpen((o) => !o)}>
        {open ? "▾" : "▸"} Underlying data — {rowCount} row{rowCount === 1 ? "" : "s"}
      </button>
      {open && (
        <div className="tablewrap">
          {result.kind === "forecast" ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th style={{ textAlign: "right" }}>Value</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {result.series.map((p) => (
                  <tr key={`${p.period}-${p.kind}`}>
                    <td className="mono">{shortMonth(p.period)}</td>
                    <td className="num">{p.value}</td>
                    <td>{p.kind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{result.groupBy ? humanize(result.groupBy) : "Metric"}</th>
                  <th style={{ textAlign: "right" }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((d) => (
                  <tr key={d.label}>
                    <td>
                      {result.groupBy === "month"
                        ? shortMonth(d.label)
                        : result.groupBy === "status"
                          ? humanize(d.label)
                          : d.label}
                    </td>
                    <td className="num">
                      {formatMetricValue(result.metric, d.value, result.isRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
