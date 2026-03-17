import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { unauthorized } from "../utils/httpError.js";

export type AuthenticatedUser = {
  userId: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __authTypes: undefined;
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

export function requireAuth(): RequestHandler {
  return (req, _res, next) => {
    const header = req.header("authorization") ?? req.header("Authorization");
    if (!header?.startsWith("Bearer ")) return next(unauthorized());
    const token = header.slice("Bearer ".length);
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { sub?: string };
      if (!payload?.sub) return next(unauthorized());
      req.auth = { userId: payload.sub };
      return next();
    } catch {
      return next(unauthorized());
    }
  };
}

export function optionalAuth(): RequestHandler {
  return (req, _res, next) => {
    const header = req.header("authorization") ?? req.header("Authorization");
    if (!header?.startsWith("Bearer ")) return next();
    const token = header.slice("Bearer ".length);
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { sub?: string };
      if (payload?.sub) req.auth = { userId: payload.sub };
    } catch {
      // ignore
    }
    return next();
  };
}

