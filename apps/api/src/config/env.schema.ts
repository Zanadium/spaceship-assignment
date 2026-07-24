import { z } from "zod";

/**
 * Validated environment. The API refuses to boot with a malformed config, so a
 * missing DATABASE_URL or JWT_SECRET fails fast at startup rather than at the
 * first request.
 */
export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),

  // Optional: when absent, the AI layer falls back to the deterministic mock.
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),

  APP_USERNAME: z.string().min(1),
  APP_PASSWORD: z.string().min(1),
  JWT_SECRET: z.string().min(16),

  // Comma-separated list of allowed CORS origins.
  FE_ORIGIN: z.string().default("http://localhost:5173"),
});

export type Env = z.infer<typeof EnvSchema>;

/** Used by ConfigModule.forRoot({ validate }). */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = EnvSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
