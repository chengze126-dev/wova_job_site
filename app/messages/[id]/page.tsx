import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/message-thread";
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
  const receivedFirst =
    user.role === "TALENT" &&
    (other.role === "CLIENT" || other.role === "ADMIN") &&
    (conversation.messages || []).some((message) => message.senderId === other.id);
  const canSend = receivedFirst || (await canSendDirectMessage(user, other, id)).ok;
  await markConversationRead(id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-5 py-10">
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
          {other.companyName ? <p className="text-sm text-muted">{other.companyName}</p> : null}
        </div>
      </div>
      <MessageThread
        conversationId={id}
        currentUserId={user.id}
        canSend={canSend}
        waitCopy={`You can reply after this ${other.role === "ADMIN" ? "admin" : "client"} messages you first.`}
        otherName={other.name}
        messages={(conversation.messages || []).map((message) => ({
          id: message.id,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt,
          editedAt: message.editedAt,
          replyToId: message.replyToId,
        }))}
      />
    </div>
  );
}
