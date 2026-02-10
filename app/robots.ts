import type { MetadataRoute } from 'next';
import { resolvePublicOrigin } from '@/lib/seo/base-url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolvePublicOrigin();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/admin/', '/invite/', '/emails/preview'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
