import { mkdir, writeFile } from "fs/promises";
import path from "path";

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
  if (file.size > maxBytes) {
    return { error: `File must be under ${Math.round(maxBytes / (1024 * 1024))}MB.` };
  }
  const ext = path.extname(file.name).toLowerCase() || "";
  if (!allowed.includes(ext)) {
    return { error: `Upload a ${allowed.map((item) => item.replace(".", "").toUpperCase()).join(", ")} file.` };
  }
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const filename = `${userId}-${Date.now()}${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `/uploads/${folder}/${filename}` };
}
