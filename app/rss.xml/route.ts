import { getAllPosts } from '@/lib/blog';
import { resolvePublicOrigin } from '@/lib/seo/base-url';

function escapeXml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function GET() {
  const baseUrl = resolvePublicOrigin();
  const posts = getAllPosts();
  const feedUrl = `${baseUrl}/rss.xml`;

  const items = posts
    .map((post) => {
      const link = `${baseUrl}/blog/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();

      const categories = post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('');

      return [
        '<item>',
        `<title>${escapeXml(post.title)}</title>`,
        `<link>${escapeXml(link)}</link>`,
        `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `<pubDate>${escapeXml(pubDate)}</pubDate>`,
        `<description>${escapeXml(post.description)}</description>`,
        categories,
        '</item>',
      ].join('');
    })
    .join('');

  const latestPost = posts[0];
  const lastBuildDate = latestPost
    ? new Date(latestPost.date).toUTCString()
    : new Date().toUTCString();

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    '<title>NextJS Bootstrapped Shipped Blog</title>',
    `<link>${escapeXml(`${baseUrl}/blog`)}</link>`,
    '<description>Articles, tutorials, and updates about building production-ready Next.js applications.</description>',
    '<language>en-US</language>',
    `<lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`,
    `<atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />`,
    items,
    '</channel>',
    '</rss>',
  ].join('');

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // Reasonable caching for crawlers/readers. Next's `revalidate` controls ISR on the server.
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
