import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageComposer } from "@/components/message-composer";
import { formatDate } from "@/lib/utils";
import { RefreshOnInterval } from "@/components/refresh-on-interval";
import { canSendDirectMessage } from "@/app/actions/messages";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      userA: true,
      userB: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) notFound();
  if (conversation.userAId !== user.id && conversation.userBId !== user.id && user.role !== "ADMIN") {
    redirect("/messages");
  }
  const other = conversation.userAId === user.id ? conversation.userB : conversation.userA;
  const canSend = (await canSendDirectMessage(user, other)).ok;

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-5 py-10">
      <RefreshOnInterval seconds={4} />
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Direct message</p>
        <h1 className="font-display text-3xl">{other.name}</h1>
        <p className="text-sm text-muted">{other.companyName || other.email}</p>
      </div>
      <div className="mt-6 flex max-h-[55vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-line bg-cream p-4">
        {conversation.messages.map((message) => {
          const mine = message.senderId === user.id;
          return (
            <div key={message.id} className={`max-w-[80%] ${mine ? "ml-auto" : ""}`}>
              <div className={`rounded-2xl px-4 py-2 text-sm leading-6 ${mine ? "bg-pine text-cream" : "bg-paper"}`}>
                {message.content}
              </div>
              <p className="mt-1 text-[11px] text-muted">{formatDate(message.createdAt)}</p>
            </div>
          );
        })}
      </div>
      {canSend ? (
        <MessageComposer conversationId={id} />
      ) : (
        <p className="mt-4 rounded-xl border border-line bg-paper px-4 py-3 text-sm text-muted">
          You can reply after a contract starts. Clients can still message you now.
        </p>
      )}
    </div>
  );
}
