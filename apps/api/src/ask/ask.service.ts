import { Injectable } from "@nestjs/common";
import type {
  AnswerEnvelope,
  Dimension,
  Explanation,
  Metric,
  ToolResult,
} from "@spaceship/shared";
import { AiService } from "../ai/ai.service";
import { AnalyticsService } from "../analytics/analytics.service";
import { ForecastService } from "../forecast/forecast.service";
import {
  buildForecastAnswer,
  buildQueryAnswer,
  pickChartType,
} from "./present";

/**
 * Orchestrates the full flow described in the spec:
 *   question -> AI interpretation -> tool selection -> computation
 *            -> result -> explanation -> (chart-ready) response.
 *
 * The AI only picks the plan; this service runs the deterministic tool and
 * assembles the explainable answer envelope.
 */
@Injectable()
export class AskService {
  constructor(
    private readonly ai: AiService,
    private readonly analytics: AnalyticsService,
    private readonly forecast: ForecastService,
  ) {}

  async ask(question: string): Promise<AnswerEnvelope> {
    // Ground the router with the dataset's real dimension values.
    const meta = await this.analytics.getFilterMeta();
    const { output, routedBy } = await this.ai.route(question, meta);
    const { plan, interpretation } = output;

    let result: ToolResult;
    let answer: string;
    let metric: Metric | undefined;
    let dimensions: Dimension[] = [];

    if (plan.tool === "query") {
      result = await this.analytics.runQuery(plan);
      answer = buildQueryAnswer(result);
      metric = plan.metric;
      dimensions = plan.groupBy ? [plan.groupBy] : [];
    } else {
      result = await this.forecast.runForecast(plan);
      answer = buildForecastAnswer(result);
    }

    const explanation: Explanation = {
      interpretation,
      ...(metric ? { metric } : {}),
      dimensions,
      filters: plan.filters,
      plan,
    };

    return {
      question,
      answer,
      chartType: pickChartType(result),
      result,
      explanation,
      routedBy,
    };
  }
}
