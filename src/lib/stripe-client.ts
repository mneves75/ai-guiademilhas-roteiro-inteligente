import { loadStripe, type Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');
  }
  return stripePromise;
}

/**
 * Redirect to Stripe Checkout using the URL from the session
 */
export function redirectToCheckout(url: string) {
  window.location.href = url;
}
