import { getAllPosts, getAllTags, getPostsByTag } from '@/lib/blog';
import { resolvePublicOrigin } from '@/lib/seo/base-url';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolvePublicOrigin();

  // Static pages (indexable)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
    },
    {
      url: `${baseUrl}/blog`,
    },
    {
      url: `${baseUrl}/pricing`,
    },
    {
      url: `${baseUrl}/security`,
    },
    {
      url: `${baseUrl}/privacy`,
    },
    {
      url: `${baseUrl}/terms`,
    },
  ];

  // Blog posts
  const posts = getAllPosts();
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  // Tag pages: only include tags that have enough content to avoid thin pages.
  const tagPages: MetadataRoute.Sitemap = getAllTags()
    .filter((tag) => getPostsByTag(tag).length >= 2)
    .map((tag) => ({
      url: `${baseUrl}/blog/tag/${encodeURIComponent(tag)}`,
    }));

  return [...staticPages, ...blogPages, ...tagPages];
}
