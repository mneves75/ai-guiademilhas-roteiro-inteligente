'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqItems = [
  {
    question: "What's included in the boilerplate?",
    answer:
      'Authentication (email/password + OAuth), Stripe payments, multi-tenant workspaces with RBAC, transactional emails via Resend, admin dashboard, MDX blog, and a full component library with shadcn/ui. Everything is production-ready and fully typed with TypeScript.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Clone the repository, copy .env.example to .env.local, fill in your API keys (Stripe, Resend, database URL), run pnpm install, then pnpm dev. The README walks you through each step in detail.',
  },
  {
    question: "Is it open source? What's the license?",
    answer:
      'Yes, Shipped is fully open source under the MIT License. You can use it for personal and commercial projects, modify it freely, and distribute it without restrictions.',
  },
  {
    question: 'What databases are supported?',
    answer:
      'PostgreSQL (via Neon serverless), SQLite (for VPS deployments), and Cloudflare D1. Switch between them with a single environment variable — no code changes needed.',
  },
  {
    question: 'Can I use it for commercial projects?',
    answer:
      'Absolutely. The MIT License allows unrestricted commercial use. Many teams use Shipped as the foundation for their SaaS products.',
  },
  {
    question: 'How do I deploy to production?',
    answer:
      'Shipped works out of the box with Vercel (recommended), but also supports any Node.js hosting, Cloudflare Workers, and VPS deployments. Just connect your repository and deploy.',
  },
  {
    question: 'Is there support available?',
    answer:
      'Community support is available via GitHub Discussions. For priority support and direct access, check out the Pro plan.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Everything you need to know about Shipped.
          </p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <Accordion type="single" collapsible>
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
