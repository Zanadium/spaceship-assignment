import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { timingSafeEqual } from "node:crypto";
import { AppConfigService } from "../config/app-config.service";

/** Constant-time string comparison to avoid leaking length/content via timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly config: AppConfigService,
    private readonly jwt: JwtService,
  ) {}

  /** Validate the single shared credential and issue a JWT. */
  login(username: string, password: string): { accessToken: string } {
    const validUser = safeEqual(username, this.config.get("APP_USERNAME"));
    const validPass = safeEqual(password, this.config.get("APP_PASSWORD"));
    if (!validUser || !validPass) {
      throw new UnauthorizedException("Invalid username or password");
    }
    return { accessToken: this.jwt.sign({ sub: username }) };
  }
}
