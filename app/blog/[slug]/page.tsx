import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getPostBySlug, getAllSlugs } from '@/lib/blog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getMDXComponents } from '@/components/mdx-components';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { JsonLd } from '@/components/json-ld';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { toIntlLocale } from '@/lib/intl';
import { resolvePublicOrigin } from '@/lib/seo/base-url';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const url = resolvePublicOrigin();
  const canonical = `/blog/${post.slug}`;

  return {
    title: `${post.title} | Blog`,
    description: post.description,
    authors: [{ name: post.author.name }],
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      url: canonical,
      publishedTime: post.date,
      authors: [post.author.name],
      images: post.image
        ? [{ url: post.image, width: 1200, height: 630, alt: post.title }]
        : [{ url: `${url}/api/og?title=${encodeURIComponent(post.title)}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : [`${url}/api/og?title=${encodeURIComponent(post.title)}`],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const t = m(locale);
  const intlLocale = toIntlLocale(locale);
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const components = getMDXComponents({
    // Posts already have a page-level <h1>. Prevent MDX content from creating a second <h1>.
    h1: ({ children }: { children?: ReactNode }) => (
      <h2 className="mb-4 mt-8 text-4xl font-bold tracking-tight">{children}</h2>
    ),
  });
  const url = resolvePublicOrigin();
  const canonical = `${url}/blog/${post.slug}`;

  return (
    <article className="container mx-auto max-w-3xl px-4 py-16">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: { '@type': 'Person', name: post.author.name },
          image: post.image ? [post.image] : undefined,
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
          url: canonical,
        }}
      />
      <Button asChild variant="ghost" className="mb-8">
        <Link href="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.blog.backToBlog}
        </Link>
      </Button>

      <header className="mb-8">
        {post.image && (
          <div className="relative mb-8 aspect-video overflow-hidden rounded-lg">
            <Image src={post.image} alt={post.title} fill className="object-cover" priority />
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link key={tag} href={`/blog/tag/${tag}`}>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary hover:bg-primary/20">
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            </Link>
          ))}
        </div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">{post.title}</h1>

        <p className="mb-6 text-xl text-muted-foreground">{post.description}</p>

        <div className="flex items-center gap-6 border-b pb-6">
          <div className="flex items-center gap-3">
            {post.author.avatar ? (
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {post.author.name.charAt(0)}
              </div>
            )}
            <span className="font-medium">{post.author.name}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString(intlLocale, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readingTime}
            </div>
          </div>
        </div>
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <MDXRemote
          source={post.content}
          components={components}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug],
            },
          }}
        />
      </div>

      <footer className="mt-12 border-t pt-8">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.blog.allPosts}
            </Link>
          </Button>
        </div>
      </footer>
    </article>
  );
}
