/**
 * Розбір вільного тексту «Години роботи» з адмінки в рядки для постера.
 * Порт `qr-postery/_generator/data.mjs`: браузерний генератор і друкарський
 * скрипт мусять давати однаковий результат, тож логіку не переписано, а
 * перенесено один в один.
 */
export type ScheduleRow = { days: string; time: string };

const DAY = "(?:Пн|Вт|Ср|Чт|Пт|Сб|Нд|Вс|понеділок|вівторок|середа|четвер|п['’]ятниця|субота|неділя)";
const LABEL = `${DAY}(?:\\s*[-–—,]\\s*${DAY})*`;
const SPAN = "\\d{1,2}[:.]\\d{2}\\s*[-–—]\\s*\\d{1,2}[:.]\\d{2}";
const VALUE = `(?:${SPAN}(?:\\s*[/·,;]\\s*${SPAN})*|зачинено|вихідн\\S*|цілодобово)`;
const ROW = new RegExp(`(${LABEL})\\s*[-–—:]?\\s*(${VALUE})`, "giu");

const tidyDays = (d: string) => d
  .replace(/\s*[-–—]\s*/gu, "–")
  .replace(/\s*,\s*/gu, ", ")
  .replace(/\bВс\b/u, "Нд").replace(/Вс$/u, "Нд")
  .replace(/^./u, c => c.toUpperCase());

const tidyTime = (t: string) => t
  .replace(/(\d)\s*[-–—]\s*(\d)/gu, "$1–$2")
  .replace(/\b(\d):(\d{2})/gu, "0$1:$2")
  .replace(/\s*[/·,;]\s*/gu, " · ")
  .replace(/^вихідн\S*$/iu, "зачинено")
  .replace(/[;,.\s]+$/u, "");

export function parseHours(raw: string | null | undefined): ScheduleRow[] {
  const norm = String(raw ?? "").replace(/\s+/gu, " ").trim();
  if (!norm) return [];
  const rows: ScheduleRow[] = [];
  for (const m of norm.matchAll(ROW)) rows.push({ days: tidyDays(m[1]), time: tidyTime(m[2]) });
  return rows.length ? rows : [{ days: "", time: norm }];
}
