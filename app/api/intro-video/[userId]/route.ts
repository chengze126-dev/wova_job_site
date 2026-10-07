import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const viewer = await getCurrentUser();
  if (!viewer) return new NextResponse("Unauthorized", { status: 401 });

  const { userId } = await params;
  const admin = viewer.role === "ADMIN" && isAdminEmail(viewer.email);
  if (!admin && viewer.id !== userId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const talent = await prisma.user.findUnique({ where: { id: userId } });
  if (!talent?.introVideoUrl) return new NextResponse("Not found", { status: 404 });

  const buffer = await prisma.introVideo.load(userId);
  if (!buffer?.length) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": talent.introVideoMime || "video/webm",
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, max-age=60",
      "Content-Disposition": "inline",
    },
  });
}
