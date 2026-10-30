import type { TourismObject } from "@/types/hierarchy";

/**
 * Архів подій.
 *
 * Подія переходить в архів наступного дня після дати `archiveAfter`
 * (включно з цим днем вона ще актуальна). Дату ставить контент-менеджер
 * в адмінці. Якщо дату не поставили — беремо останню дату з репертуару
 * або з поля «Дати проведення», щоб місячні афіші театрів не висіли на
 * сайті вічно. Подія без жодної дати в архів сама не потрапляє.
 *
 * «Сьогодні» рахуємо за київським часом, а не за годинником браузера
 * відвідувача — інакше турист з іншого поясу бачив би інший список.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
// "01.11", "1/11", "03.05.2026", "03.05.26"
const DAY_MONTH = /(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/g;

/** Сьогоднішня дата в Києві у форматі YYYY-MM-DD. */
export function kyivToday(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Kyiv", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Остання дата, згадана в тексті (репертуар або «24.04 – 03.05.2026»).
 * Рік без явного зазначення — поточний; але якщо так виходить дата більш як
 * на пів року в минулому, це афіша на наступний рік (грудень → січень).
 */
export function lastDateInText(text: string | undefined, today: string): string | null {
  if (!text) return null;
  const [ty, tm] = today.split("-").map(Number);
  let best: string | null = null;
  for (const m of text.matchAll(DAY_MONTH)) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (day < 1 || day > 31 || month < 1 || month > 12) continue;
    let year = m[3] ? Number(m[3]) : ty;
    if (m[3] && m[3].length === 2) year += 2000;
    if (!m[3] && (ty * 12 + tm) - (year * 12 + month) > 6) year += 1;
    const iso = `${year}-${pad(month)}-${pad(day)}`;
    if (!best || iso > best) best = iso;
  }
  return best;
}

/** Дата, після якої подія йде в архів, і звідки її взято. */
export function eventArchiveDate(
  obj: Pick<TourismObject, "type" | "archiveAfter" | "repertoire" | "eventDates">,
  today: string = kyivToday(),
): { date: string; source: "manual" | "auto" } | null {
  if (obj.type !== "event") return null;
  if (obj.archiveAfter && ISO_DATE.test(obj.archiveAfter)) return { date: obj.archiveAfter, source: "manual" };
  const auto = [lastDateInText(obj.repertoire, today), lastDateInText(obj.eventDates, today)]
    .filter((d): d is string => !!d)
    .sort()
    .pop();
  return auto ? { date: auto, source: "auto" } : null;
}

export function isEventArchived(
  obj: Pick<TourismObject, "type" | "archiveAfter" | "repertoire" | "eventDates">,
  today: string = kyivToday(),
): boolean {
  const d = eventArchiveDate(obj, today);
  return !!d && today > d.date;
}

/** Опубліковані об'єкти без архівних подій — для всіх публічних списків. */
export function withoutArchivedEvents<T extends TourismObject>(objects: T[], today: string = kyivToday()): T[] {
  return objects.filter((o) => !isEventArchived(o, today));
}

/** "2026-11-30" → "30.11.2026" для підписів в інтерфейсі. */
export function formatIsoDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
