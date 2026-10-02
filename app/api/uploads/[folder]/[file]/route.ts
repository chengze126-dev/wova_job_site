import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { isUploadFolder, type UploadFolder } from "@/lib/uploads";

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

function filePath(folder: UploadFolder, file: string) {
  if (process.env.VERCEL) {
    switch (folder) {
      case "avatars":
        return path.join("/tmp", "wova-data", "uploads", "avatars", file);
      case "resumes":
        return path.join("/tmp", "wova-data", "uploads", "resumes", file);
      case "proposals":
        return path.join("/tmp", "wova-data", "uploads", "proposals", file);
      case "portfolio":
        return path.join("/tmp", "wova-data", "uploads", "portfolio", file);
    }
  }
  switch (folder) {
    case "avatars":
      return path.join(process.cwd(), "public", "uploads", "avatars", file);
    case "resumes":
      return path.join(process.cwd(), "public", "uploads", "resumes", file);
    case "proposals":
      return path.join(process.cwd(), "public", "uploads", "proposals", file);
    case "portfolio":
      return path.join(process.cwd(), "public", "uploads", "portfolio", file);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ folder: string; file: string }> },
) {
  const { folder, file } = await params;
  if (!isUploadFolder(folder) || !FILE_NAME.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const ext = path.extname(file).toLowerCase();
  const type = MIME[ext];
  if (!type) return new NextResponse("Not found", { status: 404 });

  try {
    const data = await readFile(filePath(folder, file));
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
