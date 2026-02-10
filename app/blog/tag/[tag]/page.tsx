import Link from 'next/link';
import Image from 'next/image';
import { getPostsByTag, getAllTags } from '@/lib/blog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { toIntlLocale } from '@/lib/intl';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const canonical = `/blog/tag/${tag}`;

  return {
    title: `Posts tagged "${tag}" | Blog`,
    description: `Browse all articles tagged with "${tag}".`,
    alternates: { canonical },
    openGraph: {
      title: `Posts tagged "${tag}"`,
      description: `Browse all articles tagged with "${tag}".`,
      url: canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Posts tagged "${tag}"`,
      description: `Browse all articles tagged with "${tag}".`,
    },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const locale = await getRequestLocale();
  const t = m(locale);
  const intlLocale = toIntlLocale(locale);
  const posts = getPostsByTag(tag);
  const allTags = getAllTags();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <Button asChild variant="ghost" className="mb-8">
        <Link href="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.blog.backToBlog}
        </Link>
      </Button>

      <div className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <Tag className="h-6 w-6 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">{tag}</h1>
        </div>
        <p className="text-lg text-muted-foreground">{t.blog.taggedCount(posts.length, tag)}</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/blog">{t.blog.allPosts}</Link>
        </Button>
        {allTags.map((tagValue) => (
          <Button key={tagValue} asChild variant={tagValue === tag ? 'default' : 'ghost'} size="sm">
            <Link href={`/blog/tag/${tagValue}`}>{tagValue}</Link>
          </Button>
        ))}
      </div>

      {posts.length === 0 ? (
        <Card className="text-center">
          <CardContent className="py-12">
            <p className="text-muted-foreground">{t.blog.noPostsForTag}</p>
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
                    {post.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className={`rounded-full px-2 py-1 text-xs ${
                          t === tag
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {t}
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
