import { env, API_URL } from "@/env";

/**
 * Media uploads against the self-hosted storage-server. Replaces the
 * `supabase.storage` usage: small files go straight to the object endpoint,
 * large files use the server's chunked upload protocol with progress.
 */

const STORAGE = `${API_URL}/storage/v1`;
const BUCKET = "media";
const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB
const CHUNK_THRESHOLD = 50 * 1024 * 1024; // 50MB

/** Public URL for an already-uploaded object path. */
export function mediaPublicUrl(path: string): string {
  return `${STORAGE}/object/public/${BUCKET}/${path}`;
}

function randomFilePath(file: File): string {
  const ext = file.name.includes(".") ? `.${file.name.split(".").pop()}` : "";
  return `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
}

async function uploadChunked(file: File, filePath: string, onProgress?: (pct: number) => void): Promise<void> {
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const total = Math.ceil(file.size / CHUNK_SIZE);
  for (let i = 0; i < total; i++) {
    const chunk = file.slice(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, file.size));
    const res = await fetch(`${STORAGE}/chunk/${BUCKET}/${uploadId}/${i}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: chunk,
    });
    if (!res.ok) throw new Error(`Частина ${i + 1}/${total} не завантажилась`);
    onProgress?.(Math.round(((i + 1) / total) * 100));
  }
  const done = await fetch(`${STORAGE}/chunk-complete/${BUCKET}/${uploadId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: filePath, totalChunks: total }),
  });
  if (!done.ok) throw new Error("Помилка збирання файлу");
}

async function uploadDirect(file: File, filePath: string): Promise<void> {
  const res = await fetch(`${STORAGE}/object/${BUCKET}/${filePath}`, {
    method: "POST",
    headers: {
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });
  if (!res.ok) throw new Error("Помилка завантаження файлу");
}

/** Upload a media file (auto chunked for large files); returns its public URL. */
export async function uploadMedia(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const filePath = randomFilePath(file);
  if (file.size > CHUNK_THRESHOLD) {
    await uploadChunked(file, filePath, onProgress);
  } else {
    await uploadDirect(file, filePath);
  }
  return mediaPublicUrl(filePath);
}
