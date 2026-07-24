import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AppConfigService } from "./config/app-config.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  // All routes are served under /api (keeps the FE proxy and CORS simple).
  app.setGlobalPrefix("api");
  app.enableCors({ origin: config.corsOrigins, credentials: true });

  const port = config.get("PORT");
  await app.listen(port, "0.0.0.0");
  new Logger("Bootstrap").log(`API listening on http://0.0.0.0:${port}/api`);
}

void bootstrap();
