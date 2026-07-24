import { useState } from "react";
import type { AnswerEnvelope } from "@spaceship/shared";
import { humanize, METRIC_LABELS } from "../lib/format";

/** Collapsible panel exposing the filters, metric, dimensions, and query plan. */
export function Explanation({ env }: { env: AnswerEnvelope }) {
  const [open, setOpen] = useState(false);
  const { explanation } = env;
  const filterEntries = Object.entries(explanation.filters);

  return (
    <div className="explain">
      <button className="explain__title" onClick={() => setOpen((o) => !o)}>
        {open ? "▾" : "▸"} Explainability — how this answer was produced
      </button>

      {open && (
        <>
          <div className="explain__grid">
            <div>
              <div className="kv__k">Interpretation</div>
              <div className="kv__v">{explanation.interpretation}</div>
            </div>
            {explanation.metric && (
              <div>
                <div className="kv__k">Metric</div>
                <div className="kv__v">
                  {METRIC_LABELS[explanation.metric]}
                </div>
              </div>
            )}
            <div>
              <div className="kv__k">Dimensions</div>
              <div className="kv__v">
                {explanation.dimensions.length
                  ? explanation.dimensions.map(humanize).join(", ")
                  : "—"}
              </div>
            </div>
            <div>
              <div className="kv__k">Filters</div>
              {filterEntries.length ? (
                <div className="tags">
                  {filterEntries.map(([k, v]) => (
                    <span className="tag" key={k}>
                      <b>{k}</b> {Array.isArray(v) ? v.join(", ") : String(v)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="kv__v">none applied</div>
              )}
            </div>
          </div>

          <div className="kv__k" style={{ marginTop: 16 }}>
            Structured query plan
          </div>
          <pre className="plan-json">
            {JSON.stringify(explanation.plan, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
}
