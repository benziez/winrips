/** Must stay in sync with api/_lib/stripeRouteMatch.ts route suffixes. */
export const STRIPE_API_ROUTES = {
  createPaymentIntent: "/api/stripe/create-payment-intent",
  paymentIntentStatus: "/api/stripe/payment-intent-status",
  webhook: "/api/stripe/webhook",
  connectStatus: "/api/stripe/connect-status",
  connectAccount: "/api/stripe/connect-account",
  onboardingLink: "/api/stripe/onboarding-link",
  withdraw: "/api/stripe/withdraw",
  kycSession: "/api/stripe/kyc-session",
} as const;
