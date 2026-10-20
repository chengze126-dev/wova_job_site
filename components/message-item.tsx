"use client";

import { useEffect, useState } from "react";
import { deleteMessage, editMessage } from "@/app/actions/messages";
import { formatDate } from "@/lib/utils";

export function MessageItem({
  id,
  content,
  createdAt,
  editedAt,
  mine,
}: {
  id: string;
  content: string;
  createdAt: Date | string;
  editedAt?: Date | string | null;
  mine: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    if (!editing) setDraft(content);
  }, [content, editing]);

  return (
    <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
      {editing ? (
        <form
          action={async (formData) => {
            const result = await editMessage(id, formData);
            if (result && "error" in result) return;
            setEditing(false);
          }}
          className="w-full max-w-[80%] space-y-2"
        >
          <textarea
            name="content"
            required
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            className="w-full rounded-[22px] border border-line bg-cream px-4 py-2 text-sm leading-6 text-[#0b1f17]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(content);
                setEditing(false);
              }}
              className="text-[11px] text-muted"
            >
              Cancel
            </button>
            <button type="submit" className="text-[11px] font-semibold text-[#0aa542]">
              Save
            </button>
          </div>
        </form>
      ) : (
        <div
          className={`w-fit max-w-[80%] rounded-[22px] px-4 py-2 text-sm leading-6 whitespace-pre-wrap break-words ${
            mine ? "bg-[#7ee2c4] text-[#0b1f17]" : "bg-[#dce8e3] text-[#0b1f17] dark:bg-[#3d5248] dark:text-[#f3f6f4]"
          }`}
        >
          {content}
        </div>
      )}
      <p className="mt-1 text-[11px] text-muted">
        {formatDate(createdAt)}
        {editedAt ? " · Edited" : ""}
      </p>
      {mine && !editing ? (
        <div className="mt-0.5 flex gap-3 text-[11px]">
          <button type="button" onClick={() => setEditing(true)} className="text-muted hover:text-ink">
            Edit
          </button>
          <form
            action={async () => {
              if (!confirm("Delete this message?")) return;
              await deleteMessage(id);
            }}
          >
            <button type="submit" className="text-muted hover:text-red-600">
              Delete
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
