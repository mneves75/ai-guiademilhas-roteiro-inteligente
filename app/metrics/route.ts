import { NextResponse, type NextRequest } from 'next/server';
import { renderMetricsText, getMetricsContentType } from '@/lib/metrics';

function isAuthorized(request: NextRequest): boolean {
  const token = process.env.METRICS_TOKEN?.trim();
  if (!token) return process.env.NODE_ENV !== 'production';

  const header = request.headers.get('authorization')?.trim();
  if (header?.toLowerCase().startsWith('bearer ')) {
    return header.slice('bearer '.length).trim() === token;
  }

  const legacy = request.headers.get('x-metrics-token')?.trim();
  return legacy === token;
}

export const GET = async (request: NextRequest) => {
  if (!isAuthorized(request)) {
    // Avoid leaking that the endpoint exists in production when not configured.
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await renderMetricsText();
  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': getMetricsContentType() },
  });
};
