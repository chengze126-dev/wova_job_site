"use client";

import { useRef } from "react";
import { sendMessage } from "@/app/actions/messages";
import { SubmitButton } from "@/components/submit-button";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await sendMessage(conversationId, formData);
        formRef.current?.reset();
      }}
      className="mt-4 flex gap-2"
    >
      <input
        name="content"
        required
        placeholder="Write a message"
        className="flex-1 rounded-full border border-line bg-cream px-4 py-2.5 text-sm"
      />
      <SubmitButton>Send</SubmitButton>
    </form>
  );
}
