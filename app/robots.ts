import type { MetadataRoute } from 'next';
import { resolvePublicOrigin } from '@/lib/seo/base-url';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolvePublicOrigin();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // robots.txt e uma dica de crawl, nao uma garantia de nao indexacao.
        // Para rotas sensiveis/privadas, preferimos `noindex` via meta + headers `X-Robots-Tag`.
        disallow: ['/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
