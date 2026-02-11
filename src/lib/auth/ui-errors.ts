import { $ERROR_CODES } from '@/lib/auth-client';
import {
  coerceErrorCode,
  coerceErrorMessage,
  parseBodyFieldErrors,
  type AuthClientErrorLike,
} from './error-utils';

export type FieldErrors = Record<string, string | undefined>;

function matchesBaseError(error: AuthClientErrorLike, codeName: string): boolean {
  const code = coerceErrorCode(error);
  const message = coerceErrorMessage(error);
  const messages = $ERROR_CODES as unknown as Record<string, string | undefined>;
  return code === codeName || (!!message && message === messages[codeName]);
}

export function mapSignInError(
  error: AuthClientErrorLike,
  t: {
    invalidEmail: string;
    passwordRequired: string;
    loginFailedFallback: string;
  }
): { globalError?: string; fieldErrors?: { email?: string; password?: string } } {
  const message = coerceErrorMessage(error);

  if (matchesBaseError(error, 'INVALID_EMAIL')) {
    return { fieldErrors: { email: t.invalidEmail } };
  }
  if (matchesBaseError(error, 'INVALID_EMAIL_OR_PASSWORD')) {
    // Generic by design (anti-enumeration).
    return { globalError: t.loginFailedFallback };
  }

  const bodyFields = parseBodyFieldErrors(message);
  if (bodyFields.email || bodyFields.password) {
    return {
      fieldErrors: {
        ...(bodyFields.email ? { email: t.invalidEmail } : {}),
        ...(bodyFields.password ? { password: t.passwordRequired } : {}),
      },
    };
  }

  return { globalError: t.loginFailedFallback };
}

export function mapSignUpError(
  error: AuthClientErrorLike,
  t: {
    nameRequired: string;
    invalidEmail: string;
    passwordRequired: string;
    passwordMinError: string;
    signupFailedFallback: string;
    signupTrySignInHint: string;
  }
): { globalError?: string; fieldErrors?: { name?: string; email?: string; password?: string } } {
  const message = coerceErrorMessage(error);

  if (matchesBaseError(error, 'INVALID_EMAIL')) {
    return { fieldErrors: { email: t.invalidEmail } };
  }
  if (matchesBaseError(error, 'PASSWORD_TOO_SHORT')) {
    return { fieldErrors: { password: t.passwordMinError } };
  }

  // Avoid account enumeration. Better Auth uses this code on signup when email exists.
  if (
    matchesBaseError(error, 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') ||
    coerceErrorCode(error) === 'USER_ALREADY_EXISTS'
  ) {
    return { globalError: `${t.signupFailedFallback} ${t.signupTrySignInHint}` };
  }

  const bodyFields = parseBodyFieldErrors(message);
  if (bodyFields.name || bodyFields.email || bodyFields.password) {
    return {
      fieldErrors: {
        ...(bodyFields.name ? { name: t.nameRequired } : {}),
        ...(bodyFields.email ? { email: t.invalidEmail } : {}),
        ...(bodyFields.password ? { password: t.passwordRequired } : {}),
      },
    };
  }

  return { globalError: t.signupFailedFallback };
}
