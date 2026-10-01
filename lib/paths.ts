import path from "path";

export function isVercelProduction() {
  return process.env.VERCEL_ENV === "production";
}

export function dataDirectory() {
  if (process.env.WOVA_DATA_DIR) return process.env.WOVA_DATA_DIR;
  if (process.env.VERCEL) return "/tmp/wova-data";
  return path.join(process.cwd(), "data");
}
