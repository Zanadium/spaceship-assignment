import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";
import type { FilterMeta, RouterOutput } from "@spaceship/shared";
import { AppConfigService } from "../config/app-config.service";
import { MockRouter } from "./mock-router";
import { OpenAiRouter } from "./openai-router";

export interface RoutedPlan {
  output: RouterOutput;
  routedBy: "openai" | "mock";
}

/**
 * Facade over the available routers. Prefers OpenAI when a key is configured,
 * but any failure (network, rate limit, malformed plan) degrades gracefully to
 * the deterministic mock so the endpoint never hard-fails on the AI layer.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly mock = new MockRouter();
  private readonly openai?: OpenAiRouter;

  constructor(config: AppConfigService) {
    if (config.isOpenAiEnabled) {
      const client = new OpenAI({ apiKey: config.get("OPENAI_API_KEY") });
      this.openai = new OpenAiRouter(client, config.get("OPENAI_MODEL"));
      this.logger.log("AI router: OpenAI enabled");
    } else {
      this.logger.log("AI router: no OpenAI key, using deterministic mock");
    }
  }

  async route(question: string, meta: FilterMeta): Promise<RoutedPlan> {
    if (this.openai) {
      try {
        const output = await this.openai.route(question, meta);
        return { output, routedBy: "openai" };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `OpenAI routing failed, falling back to mock: ${message}`,
        );
      }
    }
    const output = await this.mock.route(question, meta);
    return { output, routedBy: "mock" };
  }
}
