import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function stripeEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function getStripeUsdBalance() {
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    const balance = await stripe.balance.retrieve();
    const available = balance.available.find((item) => item.currency === "usd")?.amount ?? 0;
    const pending = balance.pending.find((item) => item.currency === "usd")?.amount ?? 0;
    return { availableCents: available, pendingCents: pending };
  } catch {
    return null;
  }
}
