import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import type {
  AuthLoginRequest,
  AuthRegisterRequest,
  AuthTokenResponse,
  MeResponse,
} from "@repo/contracts";
import { AuthService } from "../services/authService.js";
import { UserModel } from "../models/User.js";
import { notFound } from "../utils/httpError.js";

@Route("auth")
@Tags("auth")
export class AuthController extends Controller {
  private auth = new AuthService();

  @Post("register")
  public async register(@Body() body: AuthRegisterRequest): Promise<AuthTokenResponse> {
    const { token, user } = await this.auth.register(body);
    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  @Post("login")
  public async login(@Body() body: AuthLoginRequest): Promise<AuthTokenResponse> {
    const { token, user } = await this.auth.login(body);
    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}

@Route("")
@Tags("auth")
export class MeController extends Controller {
  @Get("me")
  @Security("jwt")
  public async me(@Request() req: any): Promise<MeResponse> {
    const userId = String(req?.user?.id ?? "");
    if (!userId) throw notFound("User context missing");
    const user = await UserModel.findById(userId).lean();
    if (!user) throw notFound("User not found");
    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}

