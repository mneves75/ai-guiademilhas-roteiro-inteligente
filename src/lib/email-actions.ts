import { sendEmail, type EmailResult } from './email';
import { WelcomeEmail } from '@/emails/welcome-email';
import { InvitationEmail } from '@/emails/invitation-email';
import { PasswordResetEmail } from '@/emails/password-reset-email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(params: { to: string; name: string }): Promise<EmailResult> {
  return sendEmail({
    to: params.to,
    subject: 'Welcome to Shipped! 🚀',
    react: WelcomeEmail({
      name: params.name,
      loginUrl: `${APP_URL}/login`,
    }),
  });
}

/**
 * Send workspace invitation email
 */
export async function sendInvitationEmail(params: {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  token: string;
  expiresAt: Date;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.to,
    subject: `${params.inviterName} invited you to join ${params.workspaceName}`,
    react: InvitationEmail({
      inviterName: params.inviterName,
      workspaceName: params.workspaceName,
      role: params.role,
      inviteUrl: `${APP_URL}/invite/${params.token}`,
      expiresAt: params.expiresAt,
    }),
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.to,
    subject: 'Reset your Shipped password',
    react: PasswordResetEmail({
      name: params.name,
      resetUrl: `${APP_URL}/reset-password?token=${params.token}`,
      expiresInMinutes: 60,
    }),
  });
}
