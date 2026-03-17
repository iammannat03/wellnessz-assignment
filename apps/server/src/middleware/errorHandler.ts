import type { ErrorRequestHandler } from "express";
import { HttpError } from "../utils/httpError.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const httpErr = err instanceof HttpError ? err : null;

  const status = httpErr?.status ?? 500;
  const payload = {
    error: httpErr?.code ?? "INTERNAL_ERROR",
    message: httpErr?.message ?? "Internal server error",
    ...(httpErr?.details !== undefined ? { details: httpErr.details } : {}),
  };

  if (status === 500) {
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", err instanceof Error ? err.message : err);
    if (err instanceof Error && err.stack) {
      // eslint-disable-next-line no-console
      console.error(err.stack);
    }
  }

  res.status(status).json(payload);
};

