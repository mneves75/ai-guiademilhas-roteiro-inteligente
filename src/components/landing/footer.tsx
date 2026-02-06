import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">NextJS Bootstrapped Shipped</span> | Built
          to ship.
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-4 text-sm">
          <Link className="text-muted-foreground hover:text-foreground" href="/blog">
            Blog
          </Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/login">
            Sign in
          </Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/signup">
            Sign up
          </Link>
        </nav>
      </div>
    </footer>
  );
}
