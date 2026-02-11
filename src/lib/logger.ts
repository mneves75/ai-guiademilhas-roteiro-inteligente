import pino from 'pino';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function toJsonValue(value: unknown): JsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v))
  ) as JsonValue;
}

const level = process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const logger = pino({
  level,
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'headers.cookie',
      'authorization',
      'cookie',
      'password',
      'token',
      '*.token',
      '*.secret',
      '*.apiKey',
      '*.api_key',
      '*.accessToken',
      '*.refreshToken',
    ],
    remove: true,
  },
  serializers: {
    err: (value) => toJsonValue(value),
  },
});
