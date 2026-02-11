import Link from 'next/link';
import Image from 'next/image';
import { getPostsByTag, getAllTags } from '@/lib/blog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { toIntlLocale } from '@/lib/intl';
import { publicAlternates } from '@/lib/seo/public-alternates';
import { publicPathname } from '@/lib/locale-routing';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const locale = await getRequestLocale();
  const tagsEn = getAllTags({ locale: 'en' });
  const tagsPtBr = getAllTags({ locale: 'pt-BR' });

  const availableLocales = [
    ...(tagsEn.includes(tag) ? (['en'] as const) : []),
    ...(tagsPtBr.includes(tag) ? (['pt-BR'] as const) : []),
  ];

  // Keep metadata consistent with the page-level 404 behavior.
  if (!availableLocales.includes(locale)) notFound();

  const safeTag = encodeURIComponent(tag);
  const canonical = publicPathname(locale, `/blog/tag/${safeTag}`);

  return {
    title: locale === 'pt-BR' ? `Posts com tag "${tag}" | Blog` : `Posts tagged "${tag}" | Blog`,
    description:
      locale === 'pt-BR'
        ? `Veja todos os artigos com a tag "${tag}".`
        : `Browse all articles tagged with "${tag}".`,
    alternates: publicAlternates(locale, `/blog/tag/${safeTag}`, { availableLocales }),
    openGraph: {
      title: locale === 'pt-BR' ? `Posts com tag "${tag}"` : `Posts tagged "${tag}"`,
      description:
        locale === 'pt-BR'
          ? `Veja todos os artigos com a tag "${tag}".`
          : `Browse all articles tagged with "${tag}".`,
      url: canonical,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: locale === 'pt-BR' ? `Posts com tag "${tag}"` : `Posts tagged "${tag}"`,
      description:
        locale === 'pt-BR'
          ? `Veja todos os artigos com a tag "${tag}".`
          : `Browse all articles tagged with "${tag}".`,
    },
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const locale = await getRequestLocale();
  const t = m(locale);
  const intlLocale = toIntlLocale(locale);
  const posts = getPostsByTag(tag, { locale });
  const allTags = getAllTags({ locale });
  const blogPath = publicPathname(locale, '/blog');

  if (!allTags.includes(tag)) notFound();

  return (
    <div className="container mx-auto max-w-6xl px-4 py-16">
      <Button asChild variant="ghost" className="mb-8">
        <Link href={blogPath}>
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
          <Link href={blogPath}>{t.blog.allPosts}</Link>
        </Button>
        {allTags.map((tagValue) => (
          <Button key={tagValue} asChild variant={tagValue === tag ? 'default' : 'ghost'} size="sm">
            <Link href={publicPathname(locale, `/blog/tag/${encodeURIComponent(tagValue)}`)}>
              {tagValue}
            </Link>
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
          {posts.map((post) => {
            const safeSlug = encodeURIComponent(post.slug);
            return (
              <Link
                key={safeSlug}
                href={publicPathname(locale, `/blog/${safeSlug}`)}
                className="block h-full"
              >
                <Card className="h-full transition-shadow hover:shadow-lg">
                  {post.image && (
                    <div className="pointer-events-none relative aspect-video overflow-hidden rounded-t-lg">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
