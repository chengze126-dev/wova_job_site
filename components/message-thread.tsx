"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Forward, Pencil, Trash2 } from "lucide-react";
import { deleteMessage, editMessage, forwardMessage, sendMessage } from "@/app/actions/messages";
import { SubmitButton } from "@/components/submit-button";
import { ProfileAvatar } from "@/components/profile-avatar";
import { RefreshOnInterval } from "@/components/refresh-on-interval";
import { formatTime } from "@/lib/utils";

type ThreadMessage = {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date | string;
  editedAt?: Date | string | null;
};

type ForwardTarget = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export function MessageThread({
  conversationId,
  currentUserId,
  canSend,
  waitCopy,
  messages,
  forwardTargets,
}: {
  conversationId: string;
  currentUserId: string;
  canSend: boolean;
  waitCopy: string;
  messages: ThreadMessage[];
  forwardTargets: ForwardTarget[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [forwarding, setForwarding] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(
    () => messages.find((message) => message.id === selectedId) || null,
    [messages, selectedId],
  );
  const mineSelected = Boolean(selected && selected.senderId === currentUserId);

  useEffect(() => {
    if (selectedId && !messages.some((message) => message.id === selectedId)) {
      setSelectedId(null);
      setEditing(false);
      setForwarding(false);
    }
  }, [messages, selectedId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setEditing(false);
      setForwarding(false);
      setSelectedId(null);
      setError("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function selectMessage(message: ThreadMessage) {
    if (selectedId === message.id && !editing && !forwarding) {
      setSelectedId(null);
      return;
    }
    setSelectedId(message.id);
    setEditing(false);
    setForwarding(false);
    setDraft(message.content);
    setError("");
  }

  function startEdit() {
    if (!selected || !mineSelected) return;
    setDraft(selected.content);
    setEditing(true);
    setForwarding(false);
    setError("");
  }

  return (
    <>
      {!editing ? <RefreshOnInterval seconds={4} /> : null}
      <div className="mt-6 flex max-h-[55vh] flex-col gap-2 overflow-y-auto rounded-2xl border border-line bg-cream p-4">
        {messages.map((message) => {
          const mine = message.senderId === currentUserId;
          const active = selectedId === message.id;
          return (
            <div key={message.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <button
                type="button"
                onClick={() => selectMessage(message)}
                className={`w-fit max-w-[80%] rounded-[22px] px-4 py-2 text-left text-sm leading-6 whitespace-pre-wrap break-words transition ${
                  mine ? "bg-[#7ee2c4] text-[#0b1f17]" : "bg-[#dce8e3] text-[#0b1f17] dark:bg-[#3d5248] dark:text-[#f3f6f4]"
                } ${active ? "ring-2 ring-[#14a800] ring-offset-2 ring-offset-cream" : ""}`}
              >
                {message.content}
              </button>
              <p className="mt-1 text-[11px] text-muted">
                {formatTime(message.createdAt)}
                {message.editedAt ? " · Edited" : ""}
                {active ? " · Selected" : ""}
              </p>
              {active ? (
                <div className="mt-1 flex items-center gap-1 rounded-full border border-line bg-paper px-1 py-0.5">
                  {mineSelected ? (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium hover:bg-cream"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                  ) : null}
                  {mineSelected ? (
                    <form
                      action={async () => {
                        if (!confirm("Delete this message?")) return;
                        const result = await deleteMessage(message.id);
                        if (result && "error" in result) {
                          setError(result.error);
                          return;
                        }
                        setSelectedId(null);
                      }}
                    >
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium hover:bg-cream"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </form>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setForwarding(true);
                      setEditing(false);
                      setError("");
                    }}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium hover:bg-cream"
                  >
                    <Forward size={12} />
                    Forward
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {editing && selected ? (
        <form
          action={async (formData) => {
            formData.set("content", draft);
            const result = await editMessage(selected.id, formData);
            if (result && "error" in result) {
              setError(result.error);
              return;
            }
            setEditing(false);
            setSelectedId(null);
          }}
          className="mt-4 space-y-3 rounded-2xl border border-line bg-paper p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Previous message</p>
          <div className="rounded-[18px] bg-[#7ee2c4] px-4 py-2 text-sm leading-6 whitespace-pre-wrap break-words text-[#0b1f17]">
            {selected.content}
          </div>
          <textarea
            name="content"
            required
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-line bg-cream px-4 py-2.5 text-sm leading-6"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setDraft(selected.content);
              }}
              className="rounded-full px-4 py-2 text-sm text-muted"
            >
              Cancel
            </button>
            <SubmitButton className="!rounded-full !bg-[#14a800] !px-4 !py-2">Save edit</SubmitButton>
          </div>
        </form>
      ) : forwarding && selected ? (
        <div className="mt-4 space-y-3 rounded-2xl border border-line bg-paper p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Forward message</p>
          <div className="rounded-[18px] bg-[#dce8e3] px-4 py-2 text-sm leading-6 whitespace-pre-wrap break-words text-[#0b1f17]">
            {selected.content}
          </div>
          {forwardTargets.length === 0 ? (
            <p className="text-sm text-muted">No other conversations to forward to yet.</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
              {forwardTargets.map((target) => (
                <li key={target.id}>
                  <button
                    type="button"
                    onClick={async () => {
                      const result = await forwardMessage(selected.id, target.id);
                      if (result && "error" in result) {
                        setError(result.error);
                        return;
                      }
                      if (result && "conversationId" in result) router.push(`/messages/${result.conversationId}`);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-cream"
                  >
                    <ProfileAvatar name={target.name} src={target.avatarUrl} size={32} />
                    <span className="font-medium">{target.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setForwarding(false)} className="text-sm text-muted">
            Cancel
          </button>
        </div>
      ) : canSend ? (
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
      ) : (
        <p className="mt-4 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-muted">{waitCopy}</p>
      )}
    </>
  );
}
