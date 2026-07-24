import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "./env.schema";

/** Thin typed wrapper over ConfigService plus a few derived helpers. */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get<K extends keyof Env>(key: K): Env[K] {
    return this.config.get(key, { infer: true }) as Env[K];
  }

  /** True when a real OpenAI key is configured; otherwise the mock router is used. */
  get isOpenAiEnabled(): boolean {
    return this.get("OPENAI_API_KEY").trim().length > 0;
  }

  /** Allowed CORS origins, parsed from the comma-separated FE_ORIGIN. */
  get corsOrigins(): string[] {
    return this.get("FE_ORIGIN")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
