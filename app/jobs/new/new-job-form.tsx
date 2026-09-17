"use client";

import { useActionState, useState } from "react";
import { createJob } from "@/app/actions/jobs";
import { HIGH_BADGE_CONNECT_COSTS, JOB_CATEGORIES, STANDARD_CONNECT_COST } from "@/lib/constants";
import { SubmitButton } from "@/components/submit-button";

export function NewJobForm() {
  const [high, setHigh] = useState(false);
  const [state, action] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => createJob(formData),
    null,
  );

  return (
    <form action={action} className="mt-8 space-y-4 rounded-2xl border border-line bg-cream p-6">
      {state?.error ? <p className="rounded-lg bg-copper/10 px-3 py-2 text-sm text-copper-dark">{state.error}</p> : null}
      <label className="block text-sm">
        Title
        <input name="title" required minLength={8} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
      </label>
      <label className="block text-sm">
        Description
        <textarea name="description" required minLength={40} rows={8} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
      </label>
      <label className="block text-sm">
        Category
        <select name="category" required className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2">
          {JOB_CATEGORIES.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Skills (comma separated)
        <input name="skills" required placeholder="React, Figma, Writing" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          Budget min
          <input name="budgetMin" type="number" min={0} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        <label className="block text-sm">
          Budget max
          <input name="budgetMax" type="number" min={0} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2" />
        </label>
        <label className="block text-sm">
          Type
          <select name="budgetType" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2">
            <option value="fixed">Fixed</option>
            <option value="hourly">Hourly</option>
          </select>
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="highBadge" checked={high} onChange={(e) => setHigh(e.target.checked)} />
        High-badge job (Talent badge required, 15–20 connects)
      </label>
      {high ? (
        <label className="block text-sm">
          Connect cost
          <select name="connectCost" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2">
            {HIGH_BADGE_CONNECT_COSTS.map((cost) => (
              <option key={cost} value={cost}>
                {cost} connects
              </option>
            ))}
          </select>
        </label>
      ) : (
        <input type="hidden" name="connectCost" value={STANDARD_CONNECT_COST} />
      )}
      <SubmitButton className="rounded-full bg-[#0db64b] hover:bg-[#0aa542]">Post this job</SubmitButton>
    </form>
  );
}
