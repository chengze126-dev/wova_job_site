import { pingTyping, typingStatus } from "@/app/actions/messages";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { conversationId?: string } | null;
  const conversationId = String(body?.conversationId || "").trim();
  if (!conversationId) return Response.json({ ok: false }, { status: 400 });
  const data = await pingTyping(conversationId);
  return Response.json(data);
}

export async function GET(request: Request) {
  const conversationId = String(new URL(request.url).searchParams.get("conversationId") || "").trim();
  if (!conversationId) return Response.json({ typing: false });
  const data = await typingStatus(conversationId);
  return Response.json(data);
}
