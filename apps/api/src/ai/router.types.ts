import type { FilterMeta, RouterOutput } from "@spaceship/shared";

/**
 * A QuestionRouter turns a natural-language question into a validated
 * RouterOutput (an interpretation + a structured plan). It is the ONLY place
 * where free text becomes a plan — and it never returns SQL or a computed
 * answer, only a plan for the deterministic tools to execute.
 */
export interface QuestionRouter {
  readonly name: "openai" | "mock";
  route(question: string, meta: FilterMeta): Promise<RouterOutput>;
}
