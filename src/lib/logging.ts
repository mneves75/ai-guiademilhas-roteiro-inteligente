import { NextResponse, type NextRequest } from 'next/server';
import { isHttpError } from '@/lib/http';
import { getOrCreateRequestId } from '@/lib/request-id';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/telemetry/sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function sanitizeLogMessage(value: string): string {
  // Value-free redaction to avoid leaking PII/secrets into logs.
  // This is intentionally conservative: only patterns with high confidence.
  const emailRedacted = value.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    '<redacted_email>'
  );

  // Common token-like blobs (invite tokens, API tokens, hex IDs). Keep length >= 32 to reduce false positives.
  const tokenRedacted = emailRedacted.replace(/\b[a-f0-9]{32,}\b/gi, '<redacted_token>');

  return tokenRedacted;
}

function toJsonSafe(value: Record<string, unknown>): Record<string, unknown> {
  try {
    return JSON.parse(
      JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v))
    ) as Record<string, unknown>;
  } catch (err) {
    // Logging must never crash the request path.
    return {
      __log_sanitize_error: true,
      __log_sanitize_error_name: err instanceof Error ? err.name : 'Error',
    };
  }
}

function serializeError(err: unknown): {
  errorName: string;
  errorMessage: string;
  errorStack?: string;
} {
  const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';

  if (err instanceof Error) {
    return {
      errorName: err.name || 'Error',
      errorMessage: truncate(sanitizeLogMessage(err.message || '(no message)'), 200),
      ...(!isProd && err.stack ? { errorStack: err.stack } : {}),
    };
  }

  if (typeof err === 'string') {
    return { errorName: 'Error', errorMessage: truncate(sanitizeLogMessage(err), 200) };
  }

  return { errorName: 'Error', errorMessage: 'Unknown error' };
}

export function logEvent(level: LogLevel, event: string, payload: Record<string, unknown> = {}) {
  const safePayload = toJsonSafe(payload);
  logger[level]({ event, ...safePayload }, event);
}

type LoggingOptions = {
  /**
   * When true (default), convert thrown errors into a JSON 4xx/5xx response.
   * When false, rethrow after logging and let Next.js handle the error response.
   */
  handleErrors?: boolean;
};

export function withApiLogging(
  eventPrefix: string,
  handler: (request: NextRequest) => Promise<Response> | Response,
  options?: LoggingOptions
): (request: NextRequest) => Promise<Response>;

export function withApiLogging<TContext = unknown>(
  eventPrefix: string,
  handler: (request: NextRequest, context: TContext) => Promise<Response> | Response,
  options?: LoggingOptions
): (request: NextRequest, context: TContext) => Promise<Response>;

export function withApiLogging<TContext = unknown>(
  eventPrefix: string,
  handler: (request: NextRequest, context?: TContext) => Promise<Response> | Response,
  options?: LoggingOptions
): (request: NextRequest, context?: TContext) => Promise<Response> {
  const handleErrors = options?.handleErrors ?? true;

  return async function loggedHandler(request: NextRequest, context?: TContext): Promise<Response> {
    const requestId = getOrCreateRequestId(request);
    const { pathname } = request.nextUrl;
    const start = Date.now();

    logEvent('info', `${eventPrefix}.request_received`, {
      requestId,
      method: request.method,
      path: pathname,
    });

    try {
      const response = await handler(request, context);
      const durationMs = Date.now() - start;
      const status = response.status;

      const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
      logEvent(level, `${eventPrefix}.request_completed`, {
        requestId,
        method: request.method,
        path: pathname,
        status,
        durationMs,
      });

      return response;
    } catch (err) {
      const durationMs = Date.now() - start;
      const serialized = serializeError(err);
      const status = isHttpError(err) ? err.status : 500;
      const level: LogLevel = status >= 500 ? 'error' : 'warn';

      logEvent(level, `${eventPrefix}.request_failed`, {
        requestId,
        method: request.method,
        path: pathname,
        status,
        durationMs,
        ...serialized,
      });

      if (status >= 500) {
        captureException(err, {
          requestId,
          method: request.method,
          path: pathname,
          status,
          durationMs,
          ...serialized,
        });
      }

      if (!handleErrors) throw err;

      if (isHttpError(err) && err.expose) {
        return NextResponse.json(
          { error: err.message, requestId },
          { status: err.status, headers: { 'x-request-id': requestId } }
        );
      }

      return NextResponse.json(
        { error: 'Internal Server Error', requestId },
        { status: 500, headers: { 'x-request-id': requestId } }
      );
    }
  };
}
