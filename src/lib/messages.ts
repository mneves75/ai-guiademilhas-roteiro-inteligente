import type { Locale } from './locale';

export const MESSAGES: Record<
  Locale,
  {
    nav: {
      features: string;
      pricing: string;
      faq: string;
      github: string;
      signIn: string;
      getStarted: string;
    };
    auth: {
      signInTitle: string;
      createAccount: string;
      email: string;
      password: string;
      forgotPassword: string;
      magicLinkTitle: string;
      magicLinkHint: string;
      magicLinkButton: string;
      signUpTitle: string;
      alreadyHaveAccount: string;
      fullName: string;
      createAccountButton: string;
      resetTitle: string;
      resetHint: string;
      sendResetLink: string;
      chooseNewPassword: string;
      newPassword: string;
      confirmPassword: string;
      resetPasswordButton: string;
      backToSignIn: string;
    };
  }
> = {
  en: {
    nav: {
      features: 'Features',
      pricing: 'Pricing',
      faq: 'FAQ',
      github: 'GitHub',
      signIn: 'Sign In',
      getStarted: 'Get Started',
    },
    auth: {
      signInTitle: 'Sign in to your account',
      createAccount: 'create a new account',
      email: 'Email address',
      password: 'Password',
      forgotPassword: 'Forgot your password?',
      magicLinkTitle: 'Magic link',
      magicLinkHint: 'Get a passwordless sign-in link by email.',
      magicLinkButton: 'Email me a sign-in link',
      signUpTitle: 'Create your account',
      alreadyHaveAccount: 'Already have an account?',
      fullName: 'Full name',
      createAccountButton: 'Create account',
      resetTitle: 'Reset your password',
      resetHint: "Enter your email and we'll send you a reset link.",
      sendResetLink: 'Send reset link',
      chooseNewPassword: 'Choose a new password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      resetPasswordButton: 'Reset password',
      backToSignIn: 'Back to sign in',
    },
  },
  'pt-BR': {
    nav: {
      features: 'Recursos',
      pricing: 'Precos',
      faq: 'FAQ',
      github: 'GitHub',
      signIn: 'Entrar',
      getStarted: 'Comecar',
    },
    auth: {
      signInTitle: 'Entre na sua conta',
      createAccount: 'criar uma nova conta',
      email: 'Email',
      password: 'Senha',
      forgotPassword: 'Esqueceu sua senha?',
      magicLinkTitle: 'Link magico',
      magicLinkHint: 'Receba um link de acesso por email (sem senha).',
      magicLinkButton: 'Enviar link de acesso',
      signUpTitle: 'Crie sua conta',
      alreadyHaveAccount: 'Ja tem uma conta?',
      fullName: 'Nome completo',
      createAccountButton: 'Criar conta',
      resetTitle: 'Redefinir senha',
      resetHint: 'Informe seu email e enviaremos um link de redefinicao.',
      sendResetLink: 'Enviar link',
      chooseNewPassword: 'Escolha uma nova senha',
      newPassword: 'Nova senha',
      confirmPassword: 'Confirmar senha',
      resetPasswordButton: 'Redefinir senha',
      backToSignIn: 'Voltar para entrar',
    },
  },
};

export function m(locale: Locale) {
  return MESSAGES[locale];
}
