import type { TourismObject } from "@/types/hierarchy";
import { parseRepertoire } from "@/lib/repertoire";
import { isEventArchived, kyivToday } from "@/lib/eventArchive";
import { objectDetailPath } from "@/lib/entityLinks";

export type Show = {
  key: string;
  iso: string; // YYYY-MM-DD
  time: string;
  title: string;
  venue: string;
  venueEn?: string;
  href: string;
  image?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** "05.11" / "05.11.2026" / "5/11/26" → YYYY-MM-DD відносно сьогоднішнього дня. */
function toIso(date: string, today: string): string | null {
  const m = date.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/);
  if (!m) return null;
  const day = +m[1];
  const month = +m[2];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  let year = m[3] ? +m[3] : +today.slice(0, 4);
  if (year < 100) year += 2000;
  let iso = `${year}-${pad(month)}-${pad(day)}`;
  // Репертуар без року: грудень → січень. Дата «далеко в минулому» насправді
  // належить наступному року.
  if (!m[3]) {
    const diffDays = (Date.parse(iso) - Date.parse(today)) / 86_400_000;
    if (diffDays < -180) iso = `${year + 1}-${pad(month)}-${pad(day)}`;
  }
  return iso;
}

/** Вистави з репертуарів усіх актуальних подій, згруповані за датою (сьогодні + days−1). */
export function upcomingShows(objects: TourismObject[], days = 7): { iso: string; shows: Show[] }[] {
  const today = kyivToday();
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(0, 10);
  });
  const byDate = new Map<string, Show[]>(dates.map((d) => [d, []]));
  // Сьогоднішні вистави, що вже почались, не показуємо.
  const nowHm = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Kyiv" }).format(new Date());
  const hm = (time: string) => time.split(/[–-]/)[0].trim().padStart(5, "0");
  const seen = new Set<string>();

  for (const o of objects) {
    if (o.type !== "event" || !o.published || !o.repertoire?.trim() || isEventArchived(o, today)) continue;
    for (const row of parseRepertoire(o.repertoire)) {
      const iso = row.date ? toIso(row.date, today) : null;
      if (!iso || !byDate.has(iso)) continue;
      if (iso === today && row.time && hm(row.time) < nowHm) continue;
      // Одна вистава може бути в репертуарах двох місяців того самого театру.
      const key = `${iso}|${row.time}|${row.title}|${o.name}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      byDate.get(iso)!.push({
        key,
        iso,
        time: row.time,
        title: row.title,
        venue: o.name,
        venueEn: o.nameEn,
        href: objectDetailPath("event", o.slug),
        image: o.imageUrl,
      });
    }
  }
  return dates.map((iso) => ({
    iso,
    shows: (byDate.get(iso) ?? []).sort((a, b) => a.time.localeCompare(b.time)),
  }));
}
