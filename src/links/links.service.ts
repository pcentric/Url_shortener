import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { nanoid } from "nanoid";
import { z } from "zod";
import type Redis from "ioredis";

const CreateLinkSchema = z.object({
  longUrl: z.string().url(),
  customAlias: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/).optional(),
});

@Injectable()
export class LinksService {
  constructor(
    private prisma: PrismaService,
    @Inject("REDIS") private redis: Redis,
  ) {}

  private cacheKey(code: string) {
    return `link:${code}`;
  }

  async create(body: unknown) {
    const parsed = CreateLinkSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const { longUrl, customAlias } = parsed.data;
    const code = customAlias ?? nanoid(7);

    try {
      const link = await this.prisma.link.create({
        data: { code, longUrl },
      });

      // cache immediately (fast redirects)
      await this.redis.set(this.cacheKey(link.code), link.longUrl, "EX", 60 * 60); // 1h
      return link;
    } catch (e: any) {
      // unique violation
      if (String(e?.code) === "P2002") {
        throw new BadRequestException("Short code already exists. Try a different alias.");
      }
      throw e;
    }
  }

  async resolve(code: string) {
    // 1) try cache
    const cached = await this.redis.get(this.cacheKey(code));
    if (cached) return { longUrl: cached, fromCache: true };

    // 2) fallback db
    const link = await this.prisma.link.findUnique({ where: { code } });
    if (!link) throw new NotFoundException("Link not found");

    // 3) set cache
    await this.redis.set(this.cacheKey(code), link.longUrl, "EX", 60 * 60);
    return { longUrl: link.longUrl, fromCache: false };
  }
}
