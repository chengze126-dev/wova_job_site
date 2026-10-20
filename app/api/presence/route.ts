import { pingPresence } from "@/app/actions/messages";

export const runtime = "nodejs";

export async function POST() {
  const data = await pingPresence();
  return Response.json(data);
}

export async function GET() {
  return POST();
}
