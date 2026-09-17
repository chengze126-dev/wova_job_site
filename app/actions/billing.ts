"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CONNECT_PACK } from "@/lib/constants";
import { siteUrl } from "@/lib/site";
import { getStripe, stripeEnabled } from "@/lib/stripe";

export async function buyConnects() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TALENT") return { error: "Only talents buy connects." };

  if (!stripeEnabled()) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { connects: { increment: CONNECT_PACK.connects } },
      }),
      prisma.connectPurchase.create({
        data: {
          talentId: user.id,
          connects: CONNECT_PACK.connects,
          amountCents: CONNECT_PACK.priceCents,
          status: "demo",
        },
      }),
    ]);
    revalidatePath("/connects");
    redirect("/connects?purchased=1");
  }

  const stripe = getStripe();
  if (!stripe) return { error: "Payments are not configured." };

  const origin = siteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: CONNECT_PACK.priceCents,
          product_data: {
            name: "Wova Connects",
            description: `${CONNECT_PACK.connects} connects to send proposals`,
          },
        },
      },
    ],
    metadata: { userId: user.id, connects: String(CONNECT_PACK.connects) },
    success_url: `${origin}/connects?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/connects?canceled=1`,
  });

  await prisma.connectPurchase.create({
    data: {
      talentId: user.id,
      connects: CONNECT_PACK.connects,
      amountCents: CONNECT_PACK.priceCents,
      stripeSessionId: session.id,
      status: "pending",
    },
  });

  if (!session.url) return { error: "Could not start checkout." };
  redirect(session.url);
}

export async function fulfillCheckout(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const stripe = getStripe();
  if (!stripe) return { error: "Payments are not configured." };

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return { error: "Payment is not complete yet." };

  const purchase = await prisma.connectPurchase.findUnique({ where: { stripeSessionId: sessionId } });
  if (!purchase || purchase.talentId !== user.id) return { error: "Purchase not found." };
  if (purchase.status === "completed") return { ok: true };

  await prisma.$transaction([
    prisma.connectPurchase.update({
      where: { id: purchase.id },
      data: { status: "completed" },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { connects: { increment: purchase.connects } },
    }),
  ]);
  revalidatePath("/connects");
  return { ok: true };
}

export async function connectClientPayment() {
  const user = await getCurrentUser();
  if (!user || user.role !== "CLIENT") return { error: "Only clients can connect payment." };

  if (!stripeEnabled()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { paymentConnected: true },
    });
    revalidatePath("/billing");
    redirect("/billing?connected=1");
  }

  const stripe = getStripe();
  if (!stripe) return { error: "Payments are not configured." };
  const origin = siteUrl();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.companyName || user.name,
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    success_url: `${origin}/billing?setup=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing?canceled=1`,
  });

  if (!session.url) return { error: "Could not start payment setup." };
  redirect(session.url);
}

export async function fulfillPaymentSetup(sessionId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const stripe = getStripe();
  if (!stripe) return { error: "Payments are not configured." };
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.mode !== "setup") return { error: "Unexpected session." };

  await prisma.user.update({
    where: { id: user.id },
    data: { paymentConnected: true },
  });
  revalidatePath("/billing");
  return { ok: true };
}
