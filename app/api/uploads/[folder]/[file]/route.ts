import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { uploadsRoot } from "@/lib/uploads";

const FOLDERS = new Set(["avatars", "resumes", "proposals", "portfolio"]);
const FILE_NAME = /^[A-Za-z0-9._-]+$/;
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".zip": "application/zip",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ folder: string; file: string }> },
) {
  const { folder, file } = await params;
  if (!FOLDERS.has(folder) || !FILE_NAME.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext];
  if (!type) return new NextResponse("Not found", { status: 404 });

  try {
    const data = await readFile(path.join(uploadsRoot(), folder, file));
    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
