import { notFound } from 'next/navigation';
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/emails/welcome-email';
import { InvitationEmail } from '@/emails/invitation-email';
import { PasswordResetEmail } from '@/emails/password-reset-email';
import { MagicLinkEmail } from '@/emails/magic-link-email';
import { getRequestLocale } from '@/lib/locale-server';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Preview',
  robots: { index: false, follow: false },
};

function EmailFrame({ title, html }: { title: string; html: string }) {
  return (
    <section className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <iframe title={title} className="h-[520px] w-full rounded-md border bg-white" srcDoc={html} />
    </section>
  );
}

export default async function EmailPreviewPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound();
  }

  const locale = await getRequestLocale();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const welcomeHtml = await render(
    WelcomeEmail({
      name: 'Ada Lovelace',
      loginUrl: 'http://localhost:3000/login',
    })
  );
  const invitationHtml = await render(
    InvitationEmail({
      inviterName: 'Grace Hopper',
      workspaceName: 'Guia de Milhas',
      role: 'member',
      inviteUrl: 'http://localhost:3000/invite/example-token',
      expiresAt,
    })
  );
  const resetHtml = await render(
    PasswordResetEmail({
      name: 'Alan Turing',
      resetUrl: 'http://localhost:3000/reset-password?token=example-token',
      expiresInMinutes: 60,
    })
  );
  const magicHtml = await render(
    MagicLinkEmail({
      signInUrl: 'http://localhost:3000/api/auth/magic-link/verify?token=example',
      expiresInMinutes: 5,
      supportUrl: 'http://localhost:3000/login',
    })
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">
          {locale === 'pt-BR' ? 'Preview de emails' : 'Email Preview'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {locale === 'pt-BR'
            ? 'Preview (apenas desenvolvimento) dos templates de React Email.'
            : 'Development-only preview of React Email templates.'}
        </p>
      </div>

      <div className="grid gap-6">
        <EmailFrame title={locale === 'pt-BR' ? 'Boas-vindas' : 'Welcome'} html={welcomeHtml} />
        <EmailFrame title={locale === 'pt-BR' ? 'Convite' : 'Invitation'} html={invitationHtml} />
        <EmailFrame
          title={locale === 'pt-BR' ? 'Redefinicao de senha' : 'Password Reset'}
          html={resetHtml}
        />
        <EmailFrame title={locale === 'pt-BR' ? 'Link magico' : 'Magic Link'} html={magicHtml} />
      </div>
    </div>
  );
}
