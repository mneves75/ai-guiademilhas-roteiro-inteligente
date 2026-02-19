import { describe, expect, it } from 'vitest';
import { mapSignInError, mapSignUpError } from '@/lib/auth/ui-errors';

describe('mapSignInError', () => {
  const t = {
    invalidEmail: 'invalidEmail',
    passwordRequired: 'passwordRequired',
    loginFailedFallback: 'loginFailed',
  };

  it('maps validation_failed with email message to email field error', () => {
    expect(
      mapSignInError({ code: 'validation_failed', message: 'Invalid email address' }, t)
    ).toEqual({
      fieldErrors: { email: 'invalidEmail' },
    });
  });

  it('maps INVALID_EMAIL_OR_PASSWORD to generic global error', () => {
    expect(mapSignInError({ code: 'INVALID_EMAIL_OR_PASSWORD' }, t)).toEqual({
      globalError: 'loginFailed',
    });
  });

  it('parses body field errors from message', () => {
    expect(
      mapSignInError(
        {
          message:
            '[body.email] Invalid email address; [body.password] Too small: expected string to have >=1 characters',
        },
        t
      )
    ).toEqual({
      fieldErrors: { email: 'invalidEmail', password: 'passwordRequired' },
    });
  });
});

describe('mapSignUpError', () => {
  const t = {
    nameRequired: 'nameRequired',
    invalidEmail: 'invalidEmail',
    passwordRequired: 'passwordRequired',
    passwordMinError: 'passwordMinError',
    signupFailedFallback: 'signupFailed',
    signupTrySignInHint: 'trySignIn',
  };

  it('maps weak_password to password field error', () => {
    expect(mapSignUpError({ code: 'weak_password' }, t)).toEqual({
      fieldErrors: { password: 'passwordMinError' },
    });
  });

  it('avoids enumeration for user_already_exists', () => {
    expect(mapSignUpError({ code: 'user_already_exists' }, t)).toEqual({
      globalError: 'signupFailed trySignIn',
    });
  });
});
