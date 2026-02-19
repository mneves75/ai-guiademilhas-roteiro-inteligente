import {
  parseBodyFieldErrors,
  type AuthClientErrorLike,
  coerceErrorCode,
  coerceErrorMessage,
} from './error-utils';

export type FieldErrors = Record<string, string | undefined>;

export function mapSignInError(
  error: AuthClientErrorLike,
  t: {
    invalidEmail: string;
    passwordRequired: string;
    loginFailedFallback: string;
  }
): { globalError?: string; fieldErrors?: { email?: string; password?: string } } {
  const code = coerceErrorCode(error);
  const message = coerceErrorMessage(error);

  // Supabase error codes
  if (code === 'invalid_credentials' || message?.includes('Invalid login credentials')) {
    return { globalError: t.loginFailedFallback };
  }
  if (code === 'validation_failed' && message?.includes('email')) {
    return { fieldErrors: { email: t.invalidEmail } };
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
  const code = coerceErrorCode(error);
  const message = coerceErrorMessage(error);

  // Supabase error codes
  if (code === 'user_already_exists' || message?.includes('already registered')) {
    return { globalError: `${t.signupFailedFallback} ${t.signupTrySignInHint}` };
  }
  if (code === 'weak_password' || message?.includes('password')) {
    return { fieldErrors: { password: t.passwordMinError } };
  }
  if (code === 'validation_failed' && message?.includes('email')) {
    return { fieldErrors: { email: t.invalidEmail } };
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
