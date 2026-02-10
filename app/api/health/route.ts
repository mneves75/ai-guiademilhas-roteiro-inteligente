import { NextResponse } from 'next/server';
import { getHealthPayload } from '@/lib/health';

// Simple liveness endpoint for load balancers/uptime checks.
export function GET() {
  return NextResponse.json(getHealthPayload());
}
