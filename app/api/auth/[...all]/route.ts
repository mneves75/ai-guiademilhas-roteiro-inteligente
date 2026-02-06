import { getAuth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return toNextJsHandler(getAuth()).GET(request);
}

export async function POST(request: NextRequest) {
  return toNextJsHandler(getAuth()).POST(request);
}
