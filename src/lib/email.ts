import { Resend } from 'resend';

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
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Email send exception:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
