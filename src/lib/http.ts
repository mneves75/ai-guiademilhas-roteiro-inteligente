export class HttpError extends Error {
  readonly status: number;
  readonly expose: boolean;

  constructor(
    status: number,
    message: string,
    options?: {
      expose?: boolean;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.expose = options?.expose ?? status < 500;
    if (options?.cause !== undefined) {
      Object.defineProperty(this, 'cause', { value: options.cause });
    }
  }
}

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}

export function badRequest(message: string, cause?: unknown): HttpError {
  return new HttpError(400, message, { expose: true, cause });
}

export function unauthorized(message = 'Unauthorized', cause?: unknown): HttpError {
  return new HttpError(401, message, { expose: true, cause });
}

export function forbidden(message = 'Forbidden', cause?: unknown): HttpError {
  return new HttpError(403, message, { expose: true, cause });
}

export function notFound(message = 'Not found', cause?: unknown): HttpError {
  return new HttpError(404, message, { expose: true, cause });
}

export function conflict(message: string, cause?: unknown): HttpError {
  return new HttpError(409, message, { expose: true, cause });
}
