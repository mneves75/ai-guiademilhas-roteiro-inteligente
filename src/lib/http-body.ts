import type { NextRequest } from 'next/server';
import { badRequest } from '@/lib/http';
import { z } from 'zod';

export async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch (err) {
    throw badRequest('Invalid JSON body', err);
  }
}

function toZodIssues(error: z.ZodError): Array<{ path: string; code: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    code: issue.code,
    message: issue.message,
  }));
}

/**
 * Read and validate a JSON request body using a Zod schema.
 *
 * - Throws HttpError(400) on invalid JSON or schema mismatch.
 * - Error message is intentionally value-free to avoid leaking user input into logs.
 */
export async function readJsonBodyAs<TSchema extends z.ZodTypeAny>(
  request: NextRequest,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const body = await readJsonBody(request);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw badRequest('Invalid request body', { issues: toZodIssues(parsed.error) });
  }
  return parsed.data;
}
