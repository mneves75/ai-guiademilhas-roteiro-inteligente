import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts, getAllTags } from '@/lib/blog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { toIntlLocale } from '@/lib/intl';
import { resolvePublicOrigin } from '@/lib/seo/base-url';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Articles, tutorials, and updates about building production-ready Next.js applications.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog',
    description:
      'Articles, tutorials, and updates about building production-ready Next.js applications.',
    type: 'website',
    url: '/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog',
    description:
      'Articles, tutorials, and updates about building production-ready Next.js applications.',
  },
};

export default async function BlogPage() {
  const locale = await getRequestLocale();
  const t = m(locale);
  const intlLocale = toIntlLocale(locale);

  const posts = getAllPosts();
  const tags = getAllTags();
  const url = resolvePublicOrigin();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Blog',
          url: `${url}/blog`,
        }}
      />
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">{t.blog.title}</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{t.blog.description}</p>
      </div>

      {tags.length > 0 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/blog">{t.blog.allPosts}</Link>
          </Button>
          {tags.map((tag) => (
            <Button key={tag} asChild variant="ghost" size="sm">
              <Link href={`/blog/tag/${tag}`}>
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Link>
            </Button>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <Card className="text-center">
          <CardContent className="py-12">
            <p className="text-muted-foreground">{t.blog.noPosts}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block h-full">
              <Card className="h-full transition-shadow hover:shadow-lg">
                {post.image && (
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="pointer-events-none object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{post.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString(intlLocale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.readingTime}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
