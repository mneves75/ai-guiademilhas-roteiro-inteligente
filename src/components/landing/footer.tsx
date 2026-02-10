import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';

export async function Footer() {
  const locale = await getRequestLocale();
  const t = m(locale).landing.footer;

  const footerLinks = {
    [t.groups.product]: [
      { label: t.links.features, href: '#features' },
      { label: t.links.pricing, href: '#pricing' },
      { label: t.links.faq, href: '#faq' },
    ],
    [t.groups.resources]: [
      { label: t.links.github, href: 'https://github.com/mneves75/nextjs-bootstrapped-shipped' },
      { label: t.links.blog, href: '/blog' },
      {
        label: t.links.documentation,
        href: 'https://github.com/mneves75/nextjs-bootstrapped-shipped#readme',
      },
    ],
    [t.groups.legal]: [
      { label: t.links.privacy, href: '/privacy' },
      { label: t.links.terms, href: '/terms' },
    ],
  } as const;

  return (
    <footer className="border-t py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <span className="text-lg font-bold">Shipped</span>
          <p className="mt-2 text-sm text-muted-foreground">{t.builtWith}</p>
          <div className="mt-4 flex gap-3">
            <Link
              href="https://github.com/mneves75/nextjs-bootstrapped-shipped"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </Link>
            <Link
              href="https://x.com/mneves75"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="X / Twitter"
            >
              <Twitter className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h4 className="mb-3 text-sm font-semibold">{title}</h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t px-4 pt-8 sm:px-6">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Shipped. {t.rightsReserved}
        </p>
      </div>
    </footer>
  );
}
