import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuthService } from "./auth.service";
import { Public } from "./public.decorator";

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
type LoginRequest = z.infer<typeof LoginSchema>;

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  login(
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginRequest,
  ): { accessToken: string } {
    return this.auth.login(body.username, body.password);
  }
}
