import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

// In "output: standalone", the server process can run with cwd inside `<distDir>/standalone`.
// Keep the content path stable across runtime environments.
const CONTENT_DIR = path.join(process.env.APP_ROOT_DIR ?? process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
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

export function getAllPosts(): BlogPostMeta[] {
  ensureContentDir();

  const files = fs.readdirSync(CONTENT_DIR).filter((file) => file.endsWith('.mdx'));

  const posts = files
    .map((file) => {
      const slug = file.replace(/\.mdx$/, '');
      const filePath = path.join(CONTENT_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      return {
        slug,
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
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
  ensureContentDir();

  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  const post: BlogPost = {
    slug,
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

export function getAllSlugs(): string[] {
  ensureContentDir();

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''));
}

export function getPostsByTag(tag: string): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.tags.includes(tag));
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}
