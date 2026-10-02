import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const UPLOAD_FOLDERS = ["avatars", "resumes", "proposals", "portfolio"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

const IMAGE_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function isUploadFolder(folder: string): folder is UploadFolder {
  return (UPLOAD_FOLDERS as readonly string[]).includes(folder);
}

export function uploadsDir(folder: UploadFolder) {
  if (process.env.VERCEL) {
    switch (folder) {
      case "avatars":
        return path.join("/tmp", "wova-data", "uploads", "avatars");
      case "resumes":
        return path.join("/tmp", "wova-data", "uploads", "resumes");
      case "proposals":
        return path.join("/tmp", "wova-data", "uploads", "proposals");
      case "portfolio":
        return path.join("/tmp", "wova-data", "uploads", "portfolio");
    }
  }
  switch (folder) {
    case "avatars":
      return path.join(process.cwd(), "public", "uploads", "avatars");
    case "resumes":
      return path.join(process.cwd(), "public", "uploads", "resumes");
    case "proposals":
      return path.join(process.cwd(), "public", "uploads", "proposals");
    case "portfolio":
      return path.join(process.cwd(), "public", "uploads", "portfolio");
  }
}

export function publicUploadUrl(folder: string, filename: string) {
  if (process.env.VERCEL) return `/api/uploads/${folder}/${filename}`;
  return `/uploads/${folder}/${filename}`;
}

async function writeDiskUpload(folder: "resumes" | "proposals", filename: string, buffer: Buffer) {
  if (process.env.VERCEL) {
    if (folder === "resumes") {
      const dir = path.join("/tmp", "wova-data", "uploads", "resumes");
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, filename), buffer);
      return;
    }
    const dir = path.join("/tmp", "wova-data", "uploads", "proposals");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return;
  }

  if (folder === "resumes") {
    const dir = path.join(process.cwd(), "public", "uploads", "resumes");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return;
  }

  const dir = path.join(process.cwd(), "public", "uploads", "proposals");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
}

export async function savePublicUpload({
  file,
  folder,
  userId,
  allowed,
  maxBytes,
}: {
  file: File;
  folder: string;
  userId: string;
  allowed: string[];
  maxBytes: number;
}) {
  if (!isUploadFolder(folder)) {
    return { error: "That upload folder is not allowed." };
  }
  if (file.size > maxBytes) {
    return { error: `File must be under ${Math.round(maxBytes / (1024 * 1024))}MB.` };
  }
  const ext = path.extname(file.name).toLowerCase() || "";
  if (!allowed.includes(ext)) {
    return { error: `Upload a ${allowed.map((item) => item.replace(".", "").toUpperCase()).join(", ")} file.` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Avatars/portfolio must survive Vercel’s ephemeral disk, so persist in the DB as a data URL.
  if (folder === "avatars" || folder === "portfolio") {
    const mime = IMAGE_MIME[ext] || file.type || "image/jpeg";
    return { url: `data:${mime};base64,${buffer.toString("base64")}` };
  }

  const filename = `${userId}-${Date.now()}${ext}`;
  await writeDiskUpload(folder, filename, buffer);
  return { url: publicUploadUrl(folder, filename) };
}
