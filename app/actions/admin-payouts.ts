"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { getStripe, getStripeUsdBalance } from "@/lib/stripe";

function deny() {
  redirect("/dashboard");
}

export async function payoutAvailableBalance() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN" || !isAdminEmail(user.email)) deny();

  const stripe = getStripe();
  if (!stripe) redirect("/admin?payout_error=" + encodeURIComponent("Set STRIPE_SECRET_KEY first."));

  const balance = await getStripeUsdBalance();
  if (!balance) {
    redirect(
      "/admin?payout_error=" +
        encodeURIComponent("Could not read Stripe balance. Use a secret key with Balance and Payouts permissions."),
    );
  }
  if (balance.availableCents < 100) {
    redirect(
      "/admin?payout_error=" +
        encodeURIComponent("Nothing is available yet. Stripe holds new charges briefly, then they become available."),
    );
  }

  try {
    await stripe.payouts.create({
      amount: balance.availableCents,
      currency: "usd",
      statement_descriptor: "WOVA",
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Payout failed. Add a bank account in Stripe Dashboard → Settings → Payouts.";
    redirect("/admin?payout_error=" + encodeURIComponent(message.slice(0, 180)));
  }

  redirect("/admin?payout=1");
}
