export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFound(message = "Not found") {
  return new HttpError(404, "NOT_FOUND", message);
}

export function unauthorized(message = "Unauthorized") {
  return new HttpError(401, "UNAUTHORIZED", message);
}

export function forbidden(message = "Forbidden") {
  return new HttpError(403, "FORBIDDEN", message);
}

export function badRequest(message = "Bad request", details?: unknown) {
  return new HttpError(400, "BAD_REQUEST", message, details);
}

export function conflict(message = "Conflict") {
  return new HttpError(409, "CONFLICT", message);
}
