import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { LinksModule } from "./links/links.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    LinksModule,
  ],
})
export class AppModule {}
