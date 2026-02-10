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
      or: string;
      email: string;
      emailRequired: string;
      invalidEmail: string;
      magicLinkEmail: string;
      password: string;
      passwordRequired: string;
      forgotPassword: string;
      signInButton: string;
      signingIn: string;
      loginFailedFallback: string;
      oauthContinue: string;
      oauthLoginFailed: string;
      magicLinkTitle: string;
      magicLinkHint: string;
      magicLinkButton: string;
      magicLinkSent: string;
      magicLinkSendFailed: string;
      sendingLink: string;
      signUpTitle: string;
      alreadyHaveAccount: string;
      fullName: string;
      nameRequired: string;
      createAccountButton: string;
      creatingAccount: string;
      passwordMinHint: string;
      signupFailedFallback: string;
      signupTrySignInHint: string;
      unexpectedError: string;
      bySigningUp: string;
      termsOfService: string;
      privacyPolicy: string;
      resetTitle: string;
      resetHint: string;
      sendResetLink: string;
      sendingResetLink: string;
      requestResetSent: string;
      requestResetFailedFallback: string;
      chooseNewPassword: string;
      setNewPasswordHint: string;
      newPassword: string;
      confirmPassword: string;
      resetPasswordButton: string;
      resetting: string;
      resetTokenMissing: string;
      passwordMinError: string;
      passwordsDontMatch: string;
      resetFailedFallback: string;
      resetSuccessRedirecting: string;
      invalidResetLink: string;
      requestNewResetLink: string;
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
      or: 'Or',
      email: 'Email address',
      emailRequired: 'Email is required.',
      invalidEmail: 'Enter a valid email address.',
      magicLinkEmail: 'Email for magic link',
      password: 'Password',
      passwordRequired: 'Password is required.',
      forgotPassword: 'Forgot your password?',
      signInButton: 'Sign in',
      signingIn: 'Signing in...',
      loginFailedFallback: 'Login failed',
      oauthContinue: 'Or continue with',
      oauthLoginFailed: 'OAuth login failed',
      magicLinkTitle: 'Magic link',
      magicLinkHint: 'Get a passwordless sign-in link by email.',
      magicLinkButton: 'Email me a sign-in link',
      magicLinkSent: 'Check your email for your magic sign-in link.',
      magicLinkSendFailed: 'Failed to send magic link',
      sendingLink: 'Sending link...',
      signUpTitle: 'Create your account',
      alreadyHaveAccount: 'Already have an account?',
      fullName: 'Full name',
      nameRequired: 'Full name is required.',
      createAccountButton: 'Create account',
      creatingAccount: 'Creating account...',
      passwordMinHint: 'Must be at least 8 characters',
      signupFailedFallback: 'Signup failed',
      signupTrySignInHint:
        'If you already have an account, try signing in or resetting your password.',
      unexpectedError: 'An unexpected error occurred',
      bySigningUp: 'By signing up, you agree to our',
      termsOfService: 'Terms of Service',
      privacyPolicy: 'Privacy Policy',
      resetTitle: 'Reset your password',
      resetHint: "Enter your email and we'll send you a reset link.",
      sendResetLink: 'Send reset link',
      sendingResetLink: 'Sending...',
      requestResetSent: 'If this email exists, you will receive a reset link shortly.',
      requestResetFailedFallback: 'Failed to request password reset',
      chooseNewPassword: 'Choose a new password',
      setNewPasswordHint: 'Set a new password for your account.',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
      resetPasswordButton: 'Reset password',
      resetting: 'Resetting...',
      resetTokenMissing: 'Missing reset token. Request a new reset link.',
      passwordMinError: 'Password must be at least 8 characters.',
      passwordsDontMatch: 'Passwords do not match.',
      resetFailedFallback: 'Failed to reset password',
      resetSuccessRedirecting: 'Password reset successfully. Redirecting to sign in...',
      invalidResetLink: 'This reset link is invalid or expired. Please request a new one.',
      requestNewResetLink: 'Request a new reset link',
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
      or: 'Ou',
      email: 'Email',
      emailRequired: 'Email e obrigatorio.',
      invalidEmail: 'Informe um email valido.',
      magicLinkEmail: 'Email para link magico',
      password: 'Senha',
      passwordRequired: 'Senha e obrigatoria.',
      forgotPassword: 'Esqueceu sua senha?',
      signInButton: 'Entrar',
      signingIn: 'Entrando...',
      loginFailedFallback: 'Falha ao entrar',
      oauthContinue: 'Ou continue com',
      oauthLoginFailed: 'Falha no login OAuth',
      magicLinkTitle: 'Link magico',
      magicLinkHint: 'Receba um link de acesso por email (sem senha).',
      magicLinkButton: 'Enviar link de acesso',
      magicLinkSent: 'Confira seu email para o link de acesso.',
      magicLinkSendFailed: 'Falha ao enviar link de acesso',
      sendingLink: 'Enviando link...',
      signUpTitle: 'Crie sua conta',
      alreadyHaveAccount: 'Ja tem uma conta?',
      fullName: 'Nome completo',
      nameRequired: 'Nome completo e obrigatorio.',
      createAccountButton: 'Criar conta',
      creatingAccount: 'Criando conta...',
      passwordMinHint: 'Deve ter no minimo 8 caracteres',
      signupFailedFallback: 'Falha ao criar conta',
      signupTrySignInHint: 'Se voce ja tem uma conta, tente entrar ou redefinir sua senha.',
      unexpectedError: 'Ocorreu um erro inesperado',
      bySigningUp: 'Ao criar sua conta, voce concorda com nossos',
      termsOfService: 'Termos de Uso',
      privacyPolicy: 'Politica de Privacidade',
      resetTitle: 'Redefinir senha',
      resetHint: 'Informe seu email e enviaremos um link de redefinicao.',
      sendResetLink: 'Enviar link',
      sendingResetLink: 'Enviando...',
      requestResetSent: 'Se este email existir, voce recebera um link em instantes.',
      requestResetFailedFallback: 'Falha ao solicitar redefinicao de senha',
      chooseNewPassword: 'Escolha uma nova senha',
      setNewPasswordHint: 'Defina uma nova senha para sua conta.',
      newPassword: 'Nova senha',
      confirmPassword: 'Confirmar senha',
      resetPasswordButton: 'Redefinir senha',
      resetting: 'Redefinindo...',
      resetTokenMissing: 'Token ausente. Solicite um novo link de redefinicao.',
      passwordMinError: 'A senha deve ter no minimo 8 caracteres.',
      passwordsDontMatch: 'As senhas nao conferem.',
      resetFailedFallback: 'Falha ao redefinir senha',
      resetSuccessRedirecting: 'Senha redefinida. Redirecionando para entrar...',
      invalidResetLink: 'Este link e invalido ou expirou. Solicite um novo link.',
      requestNewResetLink: 'Solicitar novo link',
      backToSignIn: 'Voltar para entrar',
    },
  },
};

export function m(locale: Locale) {
  return MESSAGES[locale];
}
