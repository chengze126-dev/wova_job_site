"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Reply, Trash2 } from "lucide-react";
import { deleteMessage, editMessage, sendMessage } from "@/app/actions/messages";
import { SubmitButton } from "@/components/submit-button";
import { RefreshOnInterval } from "@/components/refresh-on-interval";
import { formatTime } from "@/lib/utils";

type ThreadMessage = {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date | string;
  editedAt?: Date | string | null;
  replyToId?: string | null;
};

export function MessageThread({
  conversationId,
  currentUserId,
  canSend,
  waitCopy,
  otherName,
  messages,
}: {
  conversationId: string;
  currentUserId: string;
  canSend: boolean;
  waitCopy: string;
  otherName: string;
  messages: ThreadMessage[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastTypingPing = useRef(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);

  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingPing.current < 1200) return;
    lastTypingPing.current = now;
    void fetch("/api/typing", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId }),
    });
  }

  useEffect(() => {
    let stop = false;
    async function tick() {
      try {
        const res = await fetch(`/api/typing?conversationId=${encodeURIComponent(conversationId)}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { typing?: boolean };
        if (!stop) setOtherTyping(Boolean(data.typing));
      } catch {
        // ignore network errors
      }
    }
    void tick();
    const id = setInterval(() => void tick(), 2000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [conversationId]);

  const byId = useMemo(() => new Map(messages.map((message) => [message.id, message])), [messages]);
  const selected = useMemo(
    () => messages.find((message) => message.id === selectedId) || null,
    [messages, selectedId],
  );
  const mineSelected = Boolean(selected && selected.senderId === currentUserId);

  useEffect(() => {
    if (selectedId && !messages.some((message) => message.id === selectedId)) {
      setSelectedId(null);
      setEditing(false);
      setReplying(false);
    }
  }, [messages, selectedId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setEditing(false);
      setReplying(false);
      setSelectedId(null);
      setError("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function selectMessage(message: ThreadMessage) {
    if (selectedId === message.id && !editing && !replying) {
      setSelectedId(null);
      return;
    }
    setSelectedId(message.id);
    setEditing(false);
    setReplying(false);
    setDraft(message.content);
    setError("");
  }

  function startEdit() {
    if (!selected || !mineSelected) return;
    setDraft(selected.content);
    setEditing(true);
    setReplying(false);
    setError("");
  }

  function startReply() {
    if (!selected) return;
    setReplying(true);
    setEditing(false);
    setDraft("");
    setError("");
  }

  return (
    <>
      {!editing && !replying ? <RefreshOnInterval seconds={4} /> : null}
      <div className="mt-6 flex max-h-[55vh] flex-col gap-2 overflow-y-auto rounded-2xl border border-line bg-cream p-4">
        {messages.map((message) => {
          const mine = message.senderId === currentUserId;
          const active = selectedId === message.id;
          const quoted = message.replyToId ? byId.get(message.replyToId) : null;
          return (
            <div key={message.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              {quoted ? (
                <p className="mb-1 max-w-[80%] truncate rounded-lg border-l-2 border-[#14a800] bg-paper px-2 py-1 text-[11px] text-muted">
                  {quoted.content}
                </p>
              ) : null}
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
                  {canSend ? (
                    <button
                      type="button"
                      onClick={startReply}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium hover:bg-cream"
                    >
                      <Reply size={12} />
                      Reply
                    </button>
                  ) : null}
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
                </div>
              ) : null}
            </div>
          );
        })}
        {otherTyping ? (
          <p className="mt-1 text-sm text-muted">
            <span className="font-medium text-ink">{otherName}</span> is typing
            <span className="inline-flex w-6 justify-between pl-1">
              <span className="animate-pulse">.</span>
              <span className="animate-pulse [animation-delay:150ms]">.</span>
              <span className="animate-pulse [animation-delay:300ms]">.</span>
            </span>
          </p>
        ) : null}
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
            onChange={(event) => {
              setDraft(event.target.value);
              notifyTyping();
            }}
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
      ) : replying && selected && canSend ? (
        <form
          ref={formRef}
          action={async (formData) => {
            formData.set("replyToId", selected.id);
            const result = await sendMessage(conversationId, formData);
            if (result && "error" in result) {
              setError(result.error);
              return;
            }
            formRef.current?.reset();
            setReplying(false);
            setSelectedId(null);
          }}
          className="mt-4 space-y-3 rounded-2xl border border-line bg-paper p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Reply {selected.senderId === currentUserId ? "" : `to ${otherName}`}
          </p>
          <div className="rounded-[18px] border-l-4 border-[#14a800] bg-[#dce8e3] px-4 py-2 text-sm leading-6 whitespace-pre-wrap break-words text-[#0b1f17]">
            {selected.content}
          </div>
          <textarea
            name="content"
            required
            placeholder="Write a reply"
            rows={3}
            onChange={() => notifyTyping()}
            className="w-full rounded-2xl border border-line bg-cream px-4 py-2.5 text-sm leading-6"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setReplying(false)} className="rounded-full px-4 py-2 text-sm text-muted">
              Cancel
            </button>
            <SubmitButton className="!rounded-full !bg-[#14a800] !px-4 !py-2">Reply</SubmitButton>
          </div>
        </form>
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
            onChange={() => notifyTyping()}
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
