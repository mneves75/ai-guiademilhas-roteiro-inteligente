import { describe, expect, it } from 'vitest';
import sitemap from '../../../app/sitemap';
import robots from '../../../app/robots';
import { GET as rssGet } from '../../../app/rss.xml/route';

describe('SEO routes', () => {
  it('sitemap includes indexable pages and excludes auth pages', () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls).toContain('http://localhost:3000/en');
    expect(urls).toContain('http://localhost:3000/en/blog');
    expect(urls).toContain('http://localhost:3000/en/pricing');
    expect(urls).toContain('http://localhost:3000/en/privacy');
    expect(urls).toContain('http://localhost:3000/en/terms');
    expect(urls).toContain('http://localhost:3000/en/security');

    expect(urls).toContain('http://localhost:3000/pt-br');
    expect(urls).toContain('http://localhost:3000/pt-br/blog');
    expect(urls).toContain('http://localhost:3000/pt-br/pricing');
    expect(urls).toContain('http://localhost:3000/pt-br/privacy');
    expect(urls).toContain('http://localhost:3000/pt-br/terms');
    expect(urls).toContain('http://localhost:3000/pt-br/security');

    expect(urls).not.toContain('http://localhost:3000/login');
    expect(urls).not.toContain('http://localhost:3000/signup');

    expect(urls.some((u) => u.includes('/en/blog/getting-started'))).toBe(true);
    expect(urls.some((u) => u.includes('/pt-br/blog/nextjs-saas-boilerplate-10-10'))).toBe(true);

    expect(urls.some((u) => u.includes('/en/blog/tag/'))).toBe(true);
    expect(urls.some((u) => u.includes('/pt-br/blog/tag/'))).toBe(true);
  });

  it('robots disallows sensitive sections', () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const disallow = rules[0]?.disallow ?? [];
    const disallowList = Array.isArray(disallow) ? disallow : [disallow];

    expect(disallowList).toContain('/api/');
    expect(disallowList).not.toContain('/dashboard/');
    expect(disallowList).not.toContain('/admin/');
    expect(disallowList).not.toContain('/invite/');
  });

  it('rss is valid xml and includes items', async () => {
    const res = rssGet();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/application\/rss\+xml/i);

    const body = await res.text();
    expect(body).toContain('<rss');
    expect(body).toContain('<channel>');
    expect(body).toContain('<item>');
    expect(body).toContain('/en/blog/getting-started');
  });
});
