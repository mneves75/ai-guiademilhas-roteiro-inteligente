'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useLocale } from '@/contexts/locale-context';
import { m } from '@/lib/messages';

export function FAQ() {
  const { locale } = useLocale();
  const t = m(locale).landing.faq;

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">{t.title}</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">{t.subtitle}</p>
        </div>
        <div className="glass-card rounded-2xl border-border/50 p-6 sm:p-8">
          <Accordion type="single" collapsible>
            {t.items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium md:text-lg">
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
