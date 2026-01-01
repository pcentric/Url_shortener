import { Body, Controller, Get, Param, Post, Res } from "@nestjs/common";
import { LinksService } from "./links.service";
import type { Response } from "express";

@Controller()
export class LinksController {
  constructor(private links: LinksService) {}

  @Post("links")
  async create(@Body() body: unknown) {
    return this.links.create(body);
  }

  // redirect endpoint
  @Get("r/:code")
  async redirect(@Param("code") code: string, @Res() res: Response) {
    const { longUrl } = await this.links.resolve(code);
    // Use 302 for now; later we can support 301 option
    return res.redirect(302, longUrl);
  }

  // health
  @Get("health")
  health() {
    return { ok: true };
  }
}
