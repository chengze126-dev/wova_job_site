"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { conversationPair } from "@/lib/utils";

async function hasStartedContract(userId: string, otherUserId: string) {
  const contract = await prisma.application.findFirst({
    where: {
      status: "HIRED",
      OR: [
        { talentId: userId, job: { clientId: otherUserId } },
        { talentId: otherUserId, job: { clientId: userId } },
      ],
    },
    select: { id: true },
  });

  return Boolean(contract);
}

export async function startConversation(otherUserId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Sign in first." };
  if (otherUserId === user.id) return { error: "You cannot message yourself." };

  const other = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!other) return { error: "User not found." };

  if (user.role !== "ADMIN") {
    const contractStarted = await hasStartedContract(user.id, otherUserId);
    if (!contractStarted) {
      return { error: "Messaging becomes available after the contract starts." };
    }
  }

  const pair = conversationPair(user.id, otherUserId);
  const existing = await prisma.conversation.findUnique({
    where: { userAId_userBId: pair },
  });
  if (existing) redirect(`/messages/${existing.id}`);

  const created = await prisma.conversation.create({ data: pair });
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

  if (user.role !== "ADMIN") {
    const otherUserId = conversation.userAId === user.id ? conversation.userBId : conversation.userAId;
    const contractStarted = await hasStartedContract(user.id, otherUserId);
    if (!contractStarted) {
      return { error: "Messaging becomes available after the contract starts." };
    }
  }

  await prisma.message.create({
    data: { conversationId, senderId: user.id, content },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  revalidatePath(`/messages/${conversationId}`);
  return { ok: true };
}
