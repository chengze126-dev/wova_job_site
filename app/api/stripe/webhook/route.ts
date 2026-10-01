import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { applyPaidConnects, applyPaymentSetup } from "@/app/actions/billing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.mode === "payment") {
      const result = await applyPaidConnects(session.id);
      if (result && "error" in result && result.error && result.error !== "Purchase not found.") {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }
    if (session.mode === "setup") {
      const result = await applyPaymentSetup(session.id);
      if (result && "error" in result && result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
