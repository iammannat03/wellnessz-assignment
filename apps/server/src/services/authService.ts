import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { UserModel } from "../models/User.js";
import { badRequest, conflict, unauthorized } from "../utils/httpError.js";

export class AuthService {
  async register(input: { email: string; password: string; name: string }) {
    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) throw badRequest("Invalid email");
    if (input.password.length < 8) throw badRequest("Password must be at least 8 characters");
    if (input.name.trim().length < 1) throw badRequest("Name is required");

    const existing = await UserModel.findOne({ email }).lean();
    if (existing) throw conflict("Email already registered");

    const passwordHash = await argon2.hash(input.password);
    const user = await UserModel.create({ email, passwordHash, name: input.name.trim() });
    const token = this.signToken(user._id.toString());
    return { token, user };
  }

  async login(input: { email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await UserModel.findOne({ email });
    if (!user) throw unauthorized("Invalid credentials");

    const ok = await argon2.verify(user.passwordHash, input.password);
    if (!ok) throw unauthorized("Invalid credentials");

    const token = this.signToken(user._id.toString());
    return { token, user };
  }

  signToken(userId: string): string {
    return jwt.sign({}, config.jwtSecret, { subject: userId, expiresIn: "7d" });
  }
}

