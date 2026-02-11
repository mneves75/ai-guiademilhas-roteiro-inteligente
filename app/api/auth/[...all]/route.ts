import { getAuth } from '@/lib/auth';
import { withApiLogging } from '@/lib/logging';
import { toNextJsHandler } from 'better-auth/next-js';
import type { NextRequest } from 'next/server';

export const GET = withApiLogging('api.auth', async (request: NextRequest) => {
  return toNextJsHandler(getAuth()).GET(request);
});

export const POST = withApiLogging('api.auth', async (request: NextRequest) => {
  return toNextJsHandler(getAuth()).POST(request);
});
