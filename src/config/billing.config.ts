import { registerAs } from '@nestjs/config';

// Pricing lives in Stripe (a Price object), referenced by ID from env.
// When pricing is finalized or changes: create a new Price in Stripe and swap the env var.
export default registerAs('billing', () => ({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  physicianMonthlyPriceId: process.env.STRIPE_PRICE_PHYSICIAN_MONTHLY!,
  physicianYearlyPriceId: process.env.STRIPE_PRICE_PHYSICIAN_YEARLY!,
}));
