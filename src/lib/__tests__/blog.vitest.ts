import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}));

// Import after mocking
import { getAllPosts, getPostBySlug, getAllTags, getPostsByTag } from '../blog';

describe('blog utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPosts', () => {
    it('should return empty array when no posts exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const posts = getAllPosts();
      expect(posts).toEqual([]);
    });

    it('should parse and return posts sorted by date', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      // Return string array since that's what the actual implementation uses
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fs.readdirSync).mockReturnValue(['old-post.mdx', 'new-post.mdx'] as any);

      vi.mocked(fs.readFileSync).mockImplementation((path) => {
        if (String(path).includes('old-post')) {
          return `---
title: Old Post
description: An older post
date: "2024-01-01"
author:
  name: Author
tags: ["test"]
published: true
---
Content here`;
        }
        return `---
title: New Post
description: A newer post
date: "2025-01-01"
author:
  name: Author
tags: ["test", "new"]
published: true
---
Content here`;
      });

      const posts = getAllPosts();
      expect(posts).toHaveLength(2);
      expect(posts[0]?.title).toBe('New Post');
      expect(posts[1]?.title).toBe('Old Post');
    });

    it('should filter out unpublished posts', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fs.readdirSync).mockReturnValue(['draft.mdx'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(`---
title: Draft Post
published: false
---
Content`);

      const posts = getAllPosts();
      expect(posts).toHaveLength(0);
    });
  });

  describe('getPostBySlug', () => {
    it('should return null for non-existent post', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const post = getPostBySlug('non-existent');
      expect(post).toBeNull();
    });

    it('should return post with content', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(`---
title: Test Post
description: A test post
date: "2025-01-01"
author:
  name: Test Author
tags: ["test"]
published: true
---
This is the content.`);

      const post = getPostBySlug('test-post');
      expect(post).not.toBeNull();
      expect(post?.title).toBe('Test Post');
      expect(post?.content).toContain('This is the content.');
    });
  });

  describe('getAllTags', () => {
    it('should return unique sorted tags from all posts', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fs.readdirSync).mockReturnValue(['post1.mdx', 'post2.mdx'] as any);

      vi.mocked(fs.readFileSync).mockImplementation((path) => {
        if (String(path).includes('post1')) {
          return `---
title: Post 1
tags: ["react", "nextjs"]
published: true
---
Content`;
        }
        return `---
title: Post 2
tags: ["nextjs", "typescript"]
published: true
---
Content`;
      });

      const tags = getAllTags();
      expect(tags).toEqual(['nextjs', 'react', 'typescript']);
    });
  });

  describe('getPostsByTag', () => {
    it('should filter posts by tag', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fs.readdirSync).mockReturnValue(['post1.mdx', 'post2.mdx'] as any);

      vi.mocked(fs.readFileSync).mockImplementation((path) => {
        if (String(path).includes('post1')) {
          return `---
title: React Post
tags: ["react"]
published: true
---
Content`;
        }
        return `---
title: Next Post
tags: ["nextjs"]
published: true
---
Content`;
      });

      const reactPosts = getPostsByTag('react');
      expect(reactPosts).toHaveLength(1);
      expect(reactPosts[0]?.title).toBe('React Post');
    });
  });
});
