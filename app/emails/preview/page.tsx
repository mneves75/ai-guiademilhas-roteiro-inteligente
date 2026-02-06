import { notFound } from 'next/navigation';
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/emails/welcome-email';
import { InvitationEmail } from '@/emails/invitation-email';
import { PasswordResetEmail } from '@/emails/password-reset-email';
import { MagicLinkEmail } from '@/emails/magic-link-email';

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
      workspaceName: 'Shipped HQ',
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
        <h1 className="text-2xl font-bold">Email Preview</h1>
        <p className="text-sm text-muted-foreground">
          Development-only preview of React Email templates.
        </p>
      </div>

      <div className="grid gap-6">
        <EmailFrame title="Welcome" html={welcomeHtml} />
        <EmailFrame title="Invitation" html={invitationHtml} />
        <EmailFrame title="Password Reset" html={resetHtml} />
        <EmailFrame title="Magic Link" html={magicHtml} />
      </div>
    </div>
  );
}
