import { Injectable, type OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@spaceship/db";

/**
 * PrismaService is the injectable database client for the API. It extends the
 * generated PrismaClient so services get full type-safe query access.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
