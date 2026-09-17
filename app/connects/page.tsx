import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { buyConnects, fulfillCheckout } from "@/app/actions/billing";
import { CONNECT_PACK } from "@/lib/constants";
import { stripeEnabled } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/submit-button";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function ConnectsPage({
  searchParams,
}: {
  searchParams: Promise<{ purchased?: string; session_id?: string; canceled?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "TALENT") redirect("/dashboard");

  const params = await searchParams;
  if (params.session_id) {
    await fulfillCheckout(params.session_id);
  }

  const purchases = await prisma.connectPurchase.findMany({
    where: { talentId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.24em] text-pine">Wallet</p>
      <h1 className="font-display mt-2 text-4xl">Buy connects</h1>
      <p className="mt-3 text-muted">
        You have <strong>{user.connects}</strong> connects. Applications cost 10 connects, or 15–20 on
        high-badge jobs.
      </p>
      {params.purchased || params.session_id ? (
        <p className="mt-4 rounded-xl bg-pine/10 px-4 py-3 text-sm text-pine">Connects added to your account.</p>
      ) : null}
      {params.canceled ? <p className="mt-4 text-sm text-copper-dark">Checkout canceled.</p> : null}
      <div className="mt-8 rounded-2xl border border-line bg-cream p-6">
        <p className="text-sm text-muted">Pack</p>
        <p className="font-display mt-1 text-3xl">{CONNECT_PACK.label}</p>
        <p className="mt-2 text-sm text-muted">
          {stripeEnabled()
            ? "Paid with Stripe Checkout."
            : "Stripe keys are not set, so this demo credits the pack immediately."}
        </p>
        <form action={buyConnects} className="mt-5">
          <SubmitButton>Buy {CONNECT_PACK.connects} connects</SubmitButton>
        </form>
      </div>
      <h2 className="font-display mt-10 text-2xl">History</h2>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-cream">
        {purchases.length === 0 ? <li className="p-4 text-sm text-muted">No purchases yet.</li> : null}
        {purchases.map((p) => (
          <li key={p.id} className="flex justify-between p-4 text-sm">
            <span>
              {p.connects} connects · {p.status}
            </span>
            <span className="text-muted">
              {formatMoney(p.amountCents)} · {formatDate(p.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
