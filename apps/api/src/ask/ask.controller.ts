import { Body, Controller, Post } from "@nestjs/common";
import { z } from "zod";
import type { AnswerEnvelope } from "@spaceship/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AskService } from "./ask.service";

const AskRequestSchema = z.object({
  question: z.string().trim().min(1).max(500),
});
type AskRequest = z.infer<typeof AskRequestSchema>;

@Controller("ask")
export class AskController {
  constructor(private readonly ask: AskService) {}

  /** Natural-language endpoint: question in, explainable answer envelope out. */
  @Post()
  handle(
    @Body(new ZodValidationPipe(AskRequestSchema)) body: AskRequest,
  ): Promise<AnswerEnvelope> {
    return this.ask.ask(body.question);
  }
}
