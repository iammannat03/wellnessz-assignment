import type { Request } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config/config.js";

export function tryGetUserId(request: Request): string | null {
  const header =
    request.header("authorization") ?? request.header("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub?: string };
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

export async function expressAuthentication(
  request: Request,
  securityName: string,
  _scopes?: string[],
): Promise<{ id: string }> {
  if (securityName !== "jwt") {
    throw new Error("Unknown security scheme");
  }

  const header =
    request.header("authorization") ?? request.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub?: string };
    if (!payload?.sub) throw new Error("Invalid token");
    return { id: payload.sub };
  } catch {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
}
