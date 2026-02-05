import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get('title') ?? 'NextJS Bootstrapped Shipped';
  const description = searchParams.get('description') ?? 'Ship production-ready apps fast';

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        backgroundColor: '#09090b',
        padding: '80px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '40px',
        }}
      >
        <svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fafafa"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
        <span
          style={{
            marginLeft: '16px',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#fafafa',
          }}
        >
          Shipped
        </span>
      </div>

      <h1
        style={{
          fontSize: title.length > 50 ? '48px' : '64px',
          fontWeight: 'bold',
          color: '#fafafa',
          lineHeight: 1.2,
          marginBottom: '24px',
          maxWidth: '900px',
        }}
      >
        {title}
      </h1>

      {description && (
        <p
          style={{
            fontSize: '28px',
            color: '#a1a1aa',
            lineHeight: 1.4,
            maxWidth: '800px',
          }}
        >
          {description}
        </p>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '24px', color: '#71717a' }}>shipped.dev</span>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
        }}
      />
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
