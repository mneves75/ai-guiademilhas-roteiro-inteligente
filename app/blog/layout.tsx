import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Rocket } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { publicPathname } from '@/lib/locale-routing';

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  const t = m(locale);
  const homePath = publicPathname(locale, '/');
  const blogPath = publicPathname(locale, '/blog');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href={homePath} className="flex items-center gap-2 font-semibold">
            <Rocket className="h-5 w-5" />
            <span>Guia de Milhas</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href={blogPath}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t.blog.title}
            </Link>
            <Link
              href={homePath}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t.blog.home}
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/login">{t.blog.signIn}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t py-12">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              <span className="font-semibold">Guia de Milhas</span>
            </div>
            <p className="text-sm text-muted-foreground">{t.blog.footerTagline}</p>
            <div className="flex gap-4">
              <Link href={blogPath} className="text-sm text-muted-foreground hover:text-foreground">
                {t.blog.title}
              </Link>
              <Link href="/rss.xml" className="text-sm text-muted-foreground hover:text-foreground">
                RSS
              </Link>
              <Link
                href="https://github.com/mneves75/ai-guiademilhas-roteiro-inteligente"
                className="text-sm text-muted-foreground hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
