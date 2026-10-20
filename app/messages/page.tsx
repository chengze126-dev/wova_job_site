import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { isOnline } from "@/lib/presence";
import { ProfileAvatar } from "@/components/profile-avatar";
import { OnlineBadge } from "@/components/online-badge";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: {
      userA: true,
      userB: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
  const unreadById = await prisma.message.unreadByConversation(user.id);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-4xl">Messages</h1>
      <p className="mt-2 text-sm text-muted">Direct messages between clients and talents stay on Wova.</p>
      <ul className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-cream">
        {conversations.length === 0 ? (
          <li className="p-6 text-sm text-muted">No threads yet. Message from a job or profile.</li>
        ) : (
          conversations.map((c) => {
            if (!c) return null;
            const other = c.userAId === user.id ? c.userB : c.userA;
            const last = c.messages?.[0];
            const unread = unreadById[c.id] || 0;
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="block p-4 hover:bg-paper">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      name={other?.name || "User"}
                      src={other?.avatarUrl}
                      size={44}
                      badge={other?.talentBadge}
                      online={isOnline(other?.lastSeenAt)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="flex min-w-0 items-center gap-2 font-medium">
                          <span className="truncate">{other?.name}</span>
                          <OnlineBadge lastSeenAt={other?.lastSeenAt} compact />
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          {last ? <p className="text-xs text-muted">{formatDate(last.createdAt)}</p> : null}
                          {unread > 0 ? (
                            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e31c25] px-1 text-[10px] font-bold text-white">
                              {unread > 99 ? "99+" : unread}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <p className={`mt-1 truncate text-sm ${unread > 0 ? "font-semibold text-ink" : "text-muted"}`}>
                        {other?.companyName ? `${other.companyName} · ` : ""}
                        {last?.content || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
