import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageComposer } from "@/components/message-composer";
import { formatDate } from "@/lib/utils";
import { RefreshOnInterval } from "@/components/refresh-on-interval";
import { canSendDirectMessage, markConversationRead } from "@/app/actions/messages";
import { isOnline } from "@/lib/presence";
import { ProfileAvatar } from "@/components/profile-avatar";

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
  if (!other) notFound();
  const receivedFromClient =
    user.role === "TALENT" &&
    other.role === "CLIENT" &&
    (conversation.messages || []).some((message) => message.senderId === other.id);
  const canSend =
    receivedFromClient || (await canSendDirectMessage(user, other, id)).ok;
  await markConversationRead(id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-5 py-10">
      <RefreshOnInterval seconds={4} />
      <div className="flex items-center gap-3">
        <ProfileAvatar
          name={other.name}
          src={other.avatarUrl}
          size={48}
          badge={other.talentBadge}
          presence={isOnline(other.lastSeenAt)}
        />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Direct message</p>
          <h1 className="font-display text-3xl">{other.name}</h1>
          <p className="text-sm text-muted">{other.companyName || other.email}</p>
        </div>
      </div>
      <div className="mt-6 flex max-h-[55vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-line bg-cream p-4">
        {conversation.messages?.map((message) => {
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
          You can reply after this client messages you first.
        </p>
      )}
    </div>
  );
}
