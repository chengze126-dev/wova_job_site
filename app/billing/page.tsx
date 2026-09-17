import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { connectClientPayment, fulfillPaymentSetup } from "@/app/actions/billing";
import { stripeEnabled } from "@/lib/stripe";
import { SubmitButton } from "@/components/submit-button";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; setup?: string; session_id?: string; canceled?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CLIENT") redirect("/dashboard");

  const params = await searchParams;
  if (params.session_id) await fulfillPaymentSetup(params.session_id);

  return (
    <div className="mx-auto max-w-xl px-5 py-12">
      <p className="text-xs uppercase tracking-[0.24em] text-copper">Client billing</p>
      <h1 className="font-display mt-2 text-4xl">Connect payment</h1>
      <p className="mt-3 text-muted">
        Attach a payment method so you can hire from Wova. Status:{" "}
        <strong>{user.paymentConnected ? "connected" : "not connected"}</strong>
      </p>
      {params.connected || params.setup ? (
        <p className="mt-4 rounded-xl bg-pine/10 px-4 py-3 text-sm text-pine">Payment method connected.</p>
      ) : null}
      <div className="mt-8 rounded-2xl border border-line bg-cream p-6">
        <p className="text-sm leading-6 text-muted">
          {stripeEnabled()
            ? "Stripe Setup Checkout will collect a card for your company."
            : "Stripe keys are not set. Demo mode marks payment as connected so you can keep posting jobs."}
        </p>
        <form action={connectClientPayment} className="mt-5">
          <SubmitButton>{user.paymentConnected ? "Update payment" : "Connect payment"}</SubmitButton>
        </form>
      </div>
    </div>
  );
}
