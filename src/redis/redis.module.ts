import { Global, Module } from "@nestjs/common";
import Redis from "ioredis";

@Global()
@Module({
  providers: [
    {
      provide: "REDIS",
      useFactory: () => {
        const url = process.env.REDIS_URL;
        if (!url) {
          throw new Error("REDIS_URL environment variable is not set");
        }
        return new Redis(url);
      },
    },
  ],
  exports: ["REDIS"],
})
export class RedisModule {}
