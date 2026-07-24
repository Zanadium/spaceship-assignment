import type { AnswerEnvelope } from "@spaceship/shared";
import { formatNumber } from "../lib/format";
import { DataTable } from "./DataTable";
import { Explanation } from "./Explanation";
import { ResultChart } from "./ResultChart";

export function ResultCard({ env }: { env: AnswerEnvelope }) {
  const isForecast = env.result.kind === "forecast";

  return (
    <div className="card rise" style={{ padding: "20px 22px", marginBottom: 16 }}>
      <div className="result__q">
        <span className="eyebrow">Question</span>
        <b>{env.question}</b>
        <span
          className={`badge badge--${env.routedBy}`}
          style={{ marginLeft: "auto" }}
          title={
            env.routedBy === "openai"
              ? "Routed by the OpenAI model"
              : "Routed by the deterministic rule-based fallback"
          }
        >
          {env.routedBy === "openai" ? "◆ OpenAI" : "◇ Rule-based"}
        </span>
      </div>

      <div className="result__answer">{env.answer}</div>

      <ResultChart env={env} />

      {isForecast &&
        env.result.kind === "forecast" &&
        env.result.series.length > 0 && (
          <div className="rec">
            <div className="rec__num">
              {formatNumber(env.result.inventoryRecommendation)}
            </div>
            <div className="rec__txt">
              <b>Units recommended to stock.</b> {env.result.methodology}
            </div>
          </div>
        )}

      <Explanation env={env} />
      <DataTable env={env} />
    </div>
  );
}
