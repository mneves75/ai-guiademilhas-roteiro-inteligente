import { NextResponse } from 'next/server';
import { getHealthPayload } from '@/lib/health';

// Simple liveness endpoint for load balancers/uptime checks (common default path).
export function GET() {
  return NextResponse.json(getHealthPayload());
}
