import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

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

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-4xl">Messages</h1>
      <p className="mt-2 text-sm text-muted">Direct messages between clients and talents stay on Wova.</p>
      <ul className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-cream">
        {conversations.length === 0 ? (
          <li className="p-6 text-sm text-muted">No threads yet. Message from a job or profile.</li>
        ) : (
          conversations.map((c) => {
            const other = c.userAId === user.id ? c.userB : c.userA;
            const last = c.messages[0];
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="block p-4 hover:bg-paper">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{other.name}</p>
                    {last ? <p className="text-xs text-muted">{formatDate(last.createdAt)}</p> : null}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">
                    {other.companyName ? `${other.companyName} · ` : ""}
                    {last?.content || "No messages yet"}
                  </p>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
