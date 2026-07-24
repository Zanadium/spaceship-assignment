import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { ForecastModule } from "../forecast/forecast.module";
import { AskController } from "./ask.controller";
import { AskService } from "./ask.service";

@Module({
  imports: [AiModule, AnalyticsModule, ForecastModule],
  controllers: [AskController],
  providers: [AskService],
})
export class AskModule {}
