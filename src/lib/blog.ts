import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { normalizeLocale, type Locale } from '@/lib/locale';

// In "output: standalone", the server process can run with cwd inside `<distDir>/standalone`.
// Keep the content path stable across runtime environments.
const CONTENT_DIR = path.join(process.env.APP_ROOT_DIR ?? process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  date: string;
  author: {
    name: string;
    avatar?: string;
  };
  image?: string;
  tags: string[];
  readingTime: string;
  content: string;
  published: boolean;
}

export interface BlogPostMeta {
  slug: string;
  locale: Locale;
  title: string;
  description: string;
  date: string;
  author: {
    name: string;
    avatar?: string;
  };
  image?: string;
  tags: string[];
  readingTime: string;
  published: boolean;
}

function ensureContentDir() {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
}

function getPostLocale(data: unknown): Locale {
  if (!data || typeof data !== 'object') return 'en';
  const value = (data as { locale?: unknown }).locale;
  if (typeof value !== 'string') return 'en';
  return normalizeLocale(value);
}

export function getAllPosts(opts?: { locale?: Locale }): BlogPostMeta[] {
  ensureContentDir();

  const files = fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith('.mdx'));

  const posts = files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const filePath = path.join(CONTENT_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);
      const locale = getPostLocale(data);

      return {
        slug,
        locale,
        title: data.title ?? 'Untitled',
        description: data.description ?? '',
        date: data.date ?? new Date().toISOString(),
        author: data.author ?? { name: 'Anonymous' },
        image: data.image,
        tags: data.tags ?? [],
        readingTime: readingTime(content).text,
        published: data.published !== false,
      };
    })
    .filter((post) => post.published)
    .filter((post) => (opts?.locale ? post.locale === opts.locale : true))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPostBySlug(slug: string, opts?: { locale?: Locale }): BlogPost | null {
  ensureContentDir();

  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);
  const locale = getPostLocale(data);

  if (opts?.locale && locale !== opts.locale) return null;

  const post: BlogPost = {
    slug,
    locale,
    title: data.title ?? 'Untitled',
    description: data.description ?? '',
    date: data.date ?? new Date().toISOString(),
    author: data.author ?? { name: 'Anonymous' },
    image: data.image,
    tags: data.tags ?? [],
    readingTime: readingTime(content).text,
    content,
    published: data.published !== false,
  };

  if (!post.published) {
    return null;
  }

  return post;
}

export function getAllSlugs(opts?: { locale?: Locale }): string[] {
  ensureContentDir();

  const slugs = fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''));

  if (!opts?.locale) return slugs;
  return slugs.filter((slug) => getPostBySlug(slug, { locale: opts.locale }) !== null);
}

export function getPostsByTag(tag: string, opts?: { locale?: Locale }): BlogPostMeta[] {
  const all = getAllPosts();
  return all.filter((post) => {
    if (opts?.locale && post.locale !== opts.locale) return false;
    return post.tags.includes(tag);
  });
}

export function getAllTags(opts?: { locale?: Locale }): string[] {
  const posts = getAllPosts().filter((p) => (opts?.locale ? p.locale === opts.locale : true));
  const tags = new Set<string>();
  posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}
