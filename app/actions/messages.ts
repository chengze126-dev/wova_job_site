"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { conversationPair } from "@/lib/utils";

export async function hasReceivedFrom(senderId: string, recipientId: string) {
  const pair = conversationPair(senderId, recipientId);
  const convo = await prisma.conversation.findUnique({
    where: { userAId_userBId: pair },
  });
  if (!convo) return false;
  return prisma.message.existsFrom({ conversationId: convo.id, senderId });
}

export async function canSendDirectMessage(
  from: { id: string; role: string },
  to: { id: string; role: string },
  conversationId?: string,
) {
  if (from.id === to.id) return { ok: false, error: "You cannot message yourself." };
  if (from.role === "ADMIN") return { ok: true };
  if (from.role === "CLIENT" && to.role === "TALENT") return { ok: true };
  if (from.role === "TALENT" && (to.role === "CLIENT" || to.role === "ADMIN")) {
    if (conversationId) {
      if (await prisma.message.existsFrom({ conversationId, senderId: to.id })) return { ok: true };
    } else if (await hasReceivedFrom(to.id, from.id)) {
      return { ok: true };
    }
    const who = to.role === "ADMIN" ? "admin" : "client";
    return { ok: false, error: `You can reply after this ${who} messages you first.` };
  }
  return { ok: false, error: "Only the admin can message every client and developer." };
}

export async function startConversation(otherUserId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  if (otherUserId === user.id) return { error: "You cannot message yourself." };

  const other = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!other) return { error: "User not found." };

  const allowed = await canSendDirectMessage(user, other);
  if (!allowed.ok) return { error: allowed.error };

  const pair = conversationPair(user.id, otherUserId);
  const existing = await prisma.conversation.findUnique({
    where: { userAId_userBId: pair },
  });
  if (existing) redirect(`/messages/${existing.id}`);

  const created = await prisma.conversation.create({ data: pair });
  if (!created) return { error: "Could not start conversation." };
  redirect(`/messages/${created.id}`);
}

export async function sendMessage(conversationId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  const content = String(formData.get("content") || "").trim();
  if (!content) return { error: "Write a message." };
  if (content.length > 4000) return { error: "Message is too long." };

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return { error: "Conversation not found." };
  if (conversation.userAId !== user.id && conversation.userBId !== user.id && user.role !== "ADMIN") {
    return { error: "You are not in this conversation." };
  }

  const otherUserId = conversation.userAId === user.id ? conversation.userBId : conversation.userAId;
  const other = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!other) return { error: "User not found." };
  const allowed = await canSendDirectMessage(user, other, conversationId);
  if (!allowed.ok) return { error: allowed.error };

  await prisma.message.create({
    data: { conversationId, senderId: user.id, content },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  await markConversationRead(conversationId);
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  revalidatePath("/", "layout");
  return { ok: true };
}

async function ownMessage(messageId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." as const };
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) return { error: "Message not found." as const };
  if (message.senderId !== user.id) return { error: "You can only change your own messages." as const };
  const conversation = await prisma.conversation.findUnique({ where: { id: message.conversationId } });
  if (!conversation) return { error: "Conversation not found." as const };
  if (conversation.userAId !== user.id && conversation.userBId !== user.id && user.role !== "ADMIN") {
    return { error: "You are not in this conversation." as const };
  }
  return { user, message, conversation };
}

export async function editMessage(messageId: string, formData: FormData) {
  const loaded = await ownMessage(messageId);
  if ("error" in loaded) return loaded;
  const content = String(formData.get("content") || "").trim();
  if (!content) return { error: "Write a message." };
  if (content.length > 4000) return { error: "Message is too long." };
  await prisma.message.update({
    where: { id: messageId },
    data: { content, editedAt: new Date() },
  });
  revalidatePath(`/messages/${loaded.message.conversationId}`);
  revalidatePath("/messages");
  return { ok: true as const };
}

export async function deleteMessage(messageId: string) {
  const loaded = await ownMessage(messageId);
  if ("error" in loaded) return loaded;
  await prisma.message.delete({ where: { id: messageId } });
  revalidatePath(`/messages/${loaded.message.conversationId}`);
  revalidatePath("/messages");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function markConversationRead(conversationId: string) {
  const user = await getCurrentUser();
  if (!user) return;
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return;
  if (conversation.userAId !== user.id && conversation.userBId !== user.id) return;
  const stamp = new Date();
  if (conversation.userAId === user.id) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastReadA: stamp },
    });
  } else {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastReadB: stamp },
    });
  }
}

export async function countUnreadMessages(userId: string) {
  return prisma.message.unreadCount(userId);
}

export async function pingPresence() {
  const user = await getCurrentUser();
  if (!user) return { unread: 0 };
  await prisma.user.touchLastSeen(user.id);
  const unread = await prisma.message.unreadCount(user.id);
  return { unread };
}
