import { Global, Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { AppConfigService } from "./app-config.service";
import { validateEnv } from "./env.schema";

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      // Prefer the monorepo-root .env in local dev; production injects real env vars.
      envFilePath: ["../../.env", ".env"],
      validate: validateEnv,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
