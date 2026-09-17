"use client";

import { useActionState, useState } from "react";
import { applyToJob } from "@/app/actions/jobs";
import { SubmitButton } from "@/components/submit-button";

export function ApplyForm({
  jobId,
  connectCost,
  balance,
}: {
  jobId: string;
  connectCost: number;
  balance: number;
}) {
  const [fileName, setFileName] = useState("");
  const [state, action] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => applyToJob(jobId, formData),
    null,
  );

  return (
    <form action={action} className="mt-4 space-y-3">
      {state?.error ? <p className="text-sm text-copper-dark">{state.error}</p> : null}
      <p className="text-sm text-muted">
        This costs <strong>{connectCost} connects</strong>. You have {balance}.
      </p>
      <textarea
        name="coverLetter"
        required
        minLength={40}
        rows={6}
        placeholder="Plan, proof, timeline, questions."
        className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
      />
      <label className="block text-sm font-medium">
        Attachment <span className="font-normal text-muted">(optional)</span>
        <input
          name="attachment"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
          className="mt-1.5 block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-[#e8f9ee] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0aa542]"
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
        />
        <p className="mt-1 text-xs text-muted">
          PDF, DOC, image, or ZIP · max 8MB. You can submit without a file.
          {fileName ? ` Selected: ${fileName}` : ""}
        </p>
      </label>
      <SubmitButton className="rounded-full bg-[#0db64b] hover:bg-[#0aa542]">
        Submit a proposal · {connectCost} connects
      </SubmitButton>
    </form>
  );
}
