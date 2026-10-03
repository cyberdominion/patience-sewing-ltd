import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Image upload storage.
 *
 * Locally we write to `public/uploads`. On Vercel the filesystem is ephemeral
 * and read-only between deployments, so production should point
 * `IMAGE_UPLOAD_PROVIDER` at a real object store. The `publicUrl` returned here
 * is what gets stored in ProductImage.url, so the rest of the app is
 * provider-agnostic.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Sniffs the real type from the file header so a renamed .exe is rejected. */
export function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;

  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";

  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }

  const ascii = buf.subarray(0, 12).toString("latin1");
  if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP") return "image/webp";
  if (ascii.slice(4, 8) === "ftyp" && ascii.slice(8, 12).startsWith("avif")) return "image/avif";

  return null;
}

function randomName(ext: string): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${stamp}-${randomBytes(8).toString("hex")}.${ext}`;
}

export type StoredImage = { url: string; bytes: number; mime: string };

/**
 * Validates and persists one uploaded image. Throws on anything that is not a
 * real image within the size budget.
 */
export async function storeImage(file: File): Promise<StoredImage> {
  if (file.size === 0) throw new Error("The file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Images must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB.`);
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Trust the bytes, not the browser-supplied Content-Type.
  const mime = sniffImageType(buf);
  if (!mime || !ALLOWED[mime]) {
    throw new Error("Upload a JPEG, PNG, WebP or AVIF image.");
  }

  const ext = ALLOWED[mime];
  const name = randomName(ext);

  const provider = process.env.IMAGE_UPLOAD_PROVIDER ?? "local";

  if (provider === "cloudinary") {
    const cloud = await uploadToCloudinary(buf, name);
    return { url: cloud, bytes: buf.length, mime };
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);

  return { url: `/uploads/${name}`, bytes: buf.length, mime };
}

async function uploadToCloudinary(buf: Buffer, name: string): Promise<string> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) {
    throw new Error("Cloudinary is selected but its credentials are not configured.");
  }

  const stamp = Math.floor(Date.now() / 1000).toString();
  const signature = await sha1Hex(`folder=patience-sewing&public_id=${name}&timestamp=${stamp}${secret}`);

  const form = new FormData();
  form.set("file", new Blob([new Uint8Array(buf)]), name);
  form.set("api_key", key);
  form.set("timestamp", stamp);
  form.set("signature", signature);
  form.set("folder", "patience-sewing");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Cloudinary rejected the upload.");

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("Cloudinary returned no URL.");
  return data.secure_url;
}

async function sha1Hex(input: string): Promise<string> {
  const { createHash } = await import("node:crypto");
  return createHash("sha1").update(input).digest("hex");
}

/** Best-effort cleanup when a product save fails after the file was written. */
export async function discardImage(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;
  const name = path.basename(url);
  const dir = path.join(process.cwd(), "public", "uploads");
  await unlink(path.join(dir, name)).catch(() => undefined);
}