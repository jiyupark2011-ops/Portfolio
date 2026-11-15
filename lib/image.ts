import { STORAGE_BUCKET, SUPABASE_URL } from "./supabase/env";
import type { SectionKey } from "./types";

/**
 * Public URL for a Storage path in the public `portfolio` bucket.
 * Same result as `supabase.storage.from('portfolio').getPublicUrl(path)`, without needing a client instance.
 */
export function toPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${encoded}`;
}

/**
 * UUID v4. `crypto.randomUUID()` only exists in secure contexts (HTTPS / localhost),
 * so on plain-HTTP addresses (e.g. a phone opening http://192.168.x.x:3000) we build it
 * from `crypto.getRandomValues()`, which is available everywhere.
 */
function uuidV4(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant 10xx
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** New unique file path for each upload (avoids CDN cache issues). */
export function makeImagePath(target: { kind: "profile" } | { kind: "item"; sectionKey: SectionKey }) {
  const id = uuidV4();
  return target.kind === "profile" ? `profile/${id}.webp` : `items/${target.sectionKey}/${id}.webp`;
}

/** Only paths we generate are accepted from clients. */
export function isValidImagePath(path: string, expected: { kind: "profile" } | { kind: "item"; sectionKey: SectionKey }) {
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  const prefix = expected.kind === "profile" ? "profile" : `items/${expected.sectionKey}`;
  return new RegExp(`^${prefix}/${uuid}\\.webp$`).test(path);
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Browser-only: compress to WebP, max 1600px, ~1MB. */
export async function compressImage(file: File): Promise<File> {
  const { default: imageCompression } = await import("browser-image-compression");
  const blob = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 1,
    fileType: "image/webp",
    initialQuality: 0.85,
    useWebWorker: true,
  });
  return new File([blob], "image.webp", { type: "image/webp" });
}
