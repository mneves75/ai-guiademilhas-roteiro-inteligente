import { getAllPosts, getAllTags, getPostsByTag } from '@/lib/blog';
import { publicPathname } from '@/lib/locale-routing';
import { resolvePublicOrigin } from '@/lib/seo/base-url';
import type { Locale } from '@/lib/locale';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolvePublicOrigin();

  const locales: readonly Locale[] = ['en', 'pt-BR'] as const;

  // Static public pages (indexable) per locale.
  const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) => {
    const paths = ['/', '/blog', '/pricing', '/security', '/privacy', '/terms'] as const;
    return paths.map((p) => ({
      url: `${baseUrl}${publicPathname(locale, p)}`,
    }));
  });

  // Blog posts
  const posts = getAllPosts();
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}${publicPathname(post.locale, `/blog/${post.slug}`)}`,
    lastModified: new Date(post.date),
  }));

  // Tag pages: only include tags that have enough content to avoid thin pages.
  const tagPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    getAllTags({ locale })
      .filter((tag) => getPostsByTag(tag, { locale }).length >= 2)
      .map((tag) => ({
        url: `${baseUrl}${publicPathname(locale, `/blog/tag/${encodeURIComponent(tag)}`)}`,
      }))
  );

  return [...staticPages, ...blogPages, ...tagPages];
}
