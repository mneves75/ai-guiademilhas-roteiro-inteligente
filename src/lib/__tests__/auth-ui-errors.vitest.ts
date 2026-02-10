import { describe, expect, it } from 'vitest';
import { mapSignInError, mapSignUpError } from '@/lib/auth/ui-errors';

describe('mapSignInError', () => {
  const t = {
    invalidEmail: 'invalidEmail',
    passwordRequired: 'passwordRequired',
    loginFailedFallback: 'loginFailed',
  };

  it('maps INVALID_EMAIL to email field error', () => {
    expect(mapSignInError({ code: 'INVALID_EMAIL' }, t)).toEqual({
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

  it('maps PASSWORD_TOO_SHORT to password field error', () => {
    expect(mapSignUpError({ code: 'PASSWORD_TOO_SHORT' }, t)).toEqual({
      fieldErrors: { password: 'passwordMinError' },
    });
  });

  it('avoids enumeration for USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL', () => {
    expect(mapSignUpError({ code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' }, t)).toEqual({
      globalError: 'signupFailed trySignIn',
    });
  });
});
