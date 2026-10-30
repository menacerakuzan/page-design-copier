import { db } from "@/lib/apiClient";

/**
 * Глобальні налаштування сайту (таблиця site_settings, міграція 20261029).
 * Поки там один ключ — зимова тема.
 */

/**
 * off     — нікому не показуємо;
 * preview — лише за прихованим посиланням (?winter=<токен>) і адміністраторам;
 * on      — усім відвідувачам.
 */
export type WinterMode = "off" | "preview" | "on";

export type WinterThemeSetting = {
  mode: WinterMode;
  /** SHA-256 (hex) токена з прихованого посилання. Сам токен у базі не зберігаємо. */
  tokenHash?: string;
};

const WINTER_KEY = "winter_theme";

const isMode = (v: unknown): v is WinterMode => v === "off" || v === "preview" || v === "on";

export async function loadWinterSetting(): Promise<WinterThemeSetting> {
  const { data, error } = await db.from("site_settings").select("value").eq("key", WINTER_KEY).maybeSingle();
  // Немає таблиці (міграцію ще не застосовано) або рядка — тема вимкнена.
  if (error || !data) return { mode: "off" };
  const value = (data as { value?: Record<string, unknown> }).value ?? {};
  return {
    mode: isMode(value.mode) ? value.mode : "off",
    tokenHash: typeof value.tokenHash === "string" ? value.tokenHash : undefined,
  };
}

export async function saveWinterSetting(setting: WinterThemeSetting): Promise<void> {
  const { error } = await db.from("site_settings").upsert(
    { key: WINTER_KEY, value: setting, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  if (error) throw error;
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Випадковий токен для прихованого посилання (128 біт, url-safe). */
export function makePreviewToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 24);
}
