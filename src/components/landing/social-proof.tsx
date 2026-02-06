import { Github } from 'lucide-react';

const badges = ['Open Source', 'Next.js 16', 'TypeScript', 'MIT License'];

export function SocialProof() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-4 sm:px-6">
        {badges.map((badge) => (
          <span
            key={badge}
            className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground sm:text-sm"
          >
            {badge}
          </span>
        ))}
        <span className="flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground sm:text-sm">
          <Github className="h-3.5 w-3.5" />
          Star us on GitHub
        </span>
      </div>
    </section>
  );
}
