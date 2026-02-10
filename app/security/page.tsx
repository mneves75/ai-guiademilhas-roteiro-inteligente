import type { Metadata } from 'next';
import { getRequestLocale } from '@/lib/locale-server';
import { m } from '@/lib/messages';
import { publicAlternates } from '@/lib/seo/public-alternates';
import { publicPathname } from '@/lib/locale-routing';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = m(locale).securityPolicy;
  const canonical = publicPathname(locale, '/security');

  return {
    title: t.title,
    description: t.intro,
    alternates: publicAlternates(locale, '/security'),
    openGraph: {
      title: t.title,
      description: t.intro,
      url: canonical,
    },
  };
}

function resolveContactEmail() {
  return process.env.SECURITY_CONTACT_EMAIL?.trim() || 'marcusneves2004@yahoo.com.br';
}

export default function SecurityPolicyPage() {
  const contactEmail = resolveContactEmail();

  return <SecurityPolicyContent contactEmail={contactEmail} />;
}

async function SecurityPolicyContent({ contactEmail }: { contactEmail: string }) {
  const locale = await getRequestLocale();
  const t = m(locale).securityPolicy;

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-bold">{t.title}</h1>

      <p className="text-muted-foreground">{t.intro}</p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t.reportingTitle}</h2>
        <p className="text-muted-foreground">{t.reportingNoPublicIssues}</p>
        <p className="text-muted-foreground">
          {t.contactLabel}{' '}
          <a className="underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t.includeTitle}</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {t.includeItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t.processTitle}</h2>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          {t.processItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold" id="acknowledgments">
          {t.acknowledgmentsTitle}
        </h2>
        <p className="text-muted-foreground">{t.acknowledgmentsBody}</p>
      </section>
    </main>
  );
}
