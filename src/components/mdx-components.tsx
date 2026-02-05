import type { MDXComponents } from 'mdx/types';
import Image from 'next/image';
import Link from 'next/link';

function CustomLink({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href?.startsWith('/')) {
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  }

  if (href?.startsWith('#')) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  );
}

function CustomImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src || typeof src !== 'string') return null;

  return <Image src={src} alt={alt ?? ''} width={800} height={400} className="rounded-lg" />;
}

function Callout({
  children,
  type = 'info',
}: {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'error';
}) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200',
    warning:
      'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200',
    error:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200',
  };

  return <div className={`my-6 rounded-lg border p-4 ${styles[type]}`}>{children}</div>;
}

export function getMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mb-4 mt-8 text-4xl font-bold tracking-tight">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-3 mt-8 text-3xl font-semibold tracking-tight">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-6 text-2xl font-semibold tracking-tight">{children}</h3>
    ),
    h4: ({ children }) => <h4 className="mb-2 mt-4 text-xl font-semibold">{children}</h4>,
    p: ({ children }) => <p className="mb-4 leading-7 text-muted-foreground">{children}</p>,
    a: CustomLink,
    img: CustomImage,
    ul: ({ children }) => <ul className="my-4 ml-6 list-disc space-y-2">{children}</ul>,
    ol: ({ children }) => <ol className="my-4 ml-6 list-decimal space-y-2">{children}</ol>,
    li: ({ children }) => <li className="leading-7">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-primary pl-4 italic">{children}</blockquote>
    ),
    code: ({ children }) => (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4">{children}</pre>
    ),
    hr: () => <hr className="my-8 border-border" />,
    table: ({ children }) => (
      <div className="my-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
        {children}
      </th>
    ),
    td: ({ children }) => <td className="border border-border px-4 py-2">{children}</td>,
    Callout,
    Image: CustomImage,
    ...components,
  };
}
