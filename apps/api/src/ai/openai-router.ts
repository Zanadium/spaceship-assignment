import OpenAI from "openai";
import {
  RouterOutputSchema,
  type FilterMeta,
  type RouterOutput,
} from "@spaceship/shared";
import { buildSystemPrompt } from "./prompt";
import type { QuestionRouter } from "./router.types";

/**
 * OpenAI-backed router. Asks the model for a JSON plan, then validates it with
 * the SAME Zod schema the rest of the system uses. If the model returns anything
 * off-contract, parsing throws and the caller falls back to the mock router —
 * a malformed or hallucinated plan can never reach the database.
 */
export class OpenAiRouter implements QuestionRouter {
  readonly name = "openai" as const;

  constructor(
    private readonly client: OpenAI,
    private readonly model: string,
  ) {}

  async route(question: string, meta: FilterMeta): Promise<RouterOutput> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(meta) },
        { role: "user", content: question },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty response");
    }

    // Throws on malformed JSON or contract violation — handled by AiService.
    return RouterOutputSchema.parse(JSON.parse(content));
  }
}
