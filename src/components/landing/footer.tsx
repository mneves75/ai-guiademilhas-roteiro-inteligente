import Link from 'next/link';

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  Resources: [
    { label: 'GitHub', href: 'https://github.com/mneves75/nextjs-bootstrapped-shipped' },
    { label: 'Blog', href: '/blog' },
    {
      label: 'Documentation',
      href: 'https://github.com/mneves75/nextjs-bootstrapped-shipped#readme',
    },
  ],
  Legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <span className="text-lg font-bold">Shipped</span>
          <p className="mt-2 text-sm text-muted-foreground">Built with Next.js 16 and shadcn/ui</p>
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
          &copy; {new Date().getFullYear()} Shipped. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
