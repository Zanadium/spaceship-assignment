import { Module } from "@nestjs/common";
import { AiModule } from "./ai/ai.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AskModule } from "./ask/ask.module";
import { AuthModule } from "./auth/auth.module";
import { AppConfigModule } from "./config/config.module";
import { ForecastModule } from "./forecast/forecast.module";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AuthModule,
    AnalyticsModule,
    ForecastModule,
    AiModule,
    AskModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
