import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { dataDirectory } from "./paths";

const PUBLIC_FOLDERS = new Set(["avatars", "resumes", "proposals"]);

export function uploadsRoot() {
  if (process.env.VERCEL) return path.join(dataDirectory(), "uploads");
  return path.join(process.cwd(), "public", "uploads");
}

export function publicUploadUrl(folder: string, filename: string) {
  if (process.env.VERCEL) return `/api/uploads/${folder}/${filename}`;
  return `/uploads/${folder}/${filename}`;
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
  if (!PUBLIC_FOLDERS.has(folder)) {
    return { error: "That upload folder is not allowed." };
  }
  if (file.size > maxBytes) {
    return { error: `File must be under ${Math.round(maxBytes / (1024 * 1024))}MB.` };
  }
  const ext = path.extname(file.name).toLowerCase() || "";
  if (!allowed.includes(ext)) {
    return { error: `Upload a ${allowed.map((item) => item.replace(".", "").toUpperCase()).join(", ")} file.` };
  }
  const dir = path.join(uploadsRoot(), folder);
  await mkdir(dir, { recursive: true });
  const filename = `${userId}-${Date.now()}${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return { url: publicUploadUrl(folder, filename) };
}
