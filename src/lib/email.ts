import 'server-only';

import { Resend } from 'resend';
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/telemetry/sentry';

export const EMAIL_FROM = process.env.EMAIL_FROM ?? 'Shipped <noreply@shipped.dev>';

export type EmailResult = {
  success: boolean;
  id?: string;
  error?: string;
};

let cachedResend: Resend | null = null;

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not set');
  }

  cachedResend ??= new Resend(apiKey);
  return cachedResend;
}

/**
 * Send an email with error handling
 */
export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}): Promise<EmailResult> {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      react,
    });

    if (error) {
      logger.warn(
        { event: 'email.send_failed', provider: 'resend', errorMessage: error.message },
        'Email send failed'
      );
      captureException(error, { event: 'email.send_failed', provider: 'resend' });
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    logger.error(
      { event: 'email.send_exception', provider: 'resend', err },
      'Email send exception'
    );
    captureException(err, { event: 'email.send_exception', provider: 'resend' });
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
