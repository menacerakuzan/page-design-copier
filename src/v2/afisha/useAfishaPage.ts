import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { TourismObject } from "@/types/hierarchy";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { isEventArchived, kyivToday } from "@/lib/eventArchive";
import { objectDetailPath } from "@/lib/entityLinks";
import { upcomingShows, type Show } from "@/v2/lib/afisha";
import { useV2 } from "@/v2/i18n";

/** На скільки днів уперед показуємо розклад. */
const DAYS = 60;

/** Вистава для квитка: вистава з репертуару + місто й ключ сцени. */
export type TicketShow = Show & { venueKey: string; city?: string };

/** Подія без розкладу (фестиваль, ярмарок): дати текстом із бази. */
export type OtherEvent = { o: TourismObject; name: string; dates?: string; city?: string; href: string };

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
const weekday = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();

/**
 * Дані сторінки «Афіша»: усі вистави з репертуарів на ~2 місяці вперед,
 * згруповані за днями; події без
 * розкладу; архів. Фільтри в адресі: ?date=YYYY-MM-DD | weekend,
 * ?city=<назва>, ?arkhiv.
 */
export function useAfishaPage() {
  const { tl } = useV2();
  const { data: snap, isLoading } = useHierarchySnapshot();
  const [params, setParams] = useSearchParams();
  const today = kyivToday();

  const base = useMemo(() => {
    const events = (snap?.objects ?? []).filter((o) => o.type === "event" && o.published);
    const cities = new Map((snap?.cities ?? []).map((c) => [c.id, tl(c.name, c.nameEn)]));
    const byName = new Map(events.map((o) => [norm(o.name), o]));

    const days = upcomingShows(events, DAYS);
    const shows: TicketShow[] = days.flatMap((d) =>
      d.shows.map((s) => {
        const o = byName.get(norm(s.venue));
        return { ...s, venueKey: norm(s.venue), city: o?.cityId ? cities.get(o.cityId) : undefined };
      }),
    );

    const live = events.filter((o) => !isEventArchived(o, today));
    const other: OtherEvent[] = live
      .filter((o) => !o.repertoire?.trim())
      .map((o) => ({ o, name: tl(o.name, o.nameEn), dates: o.eventDates || undefined, city: o.cityId ? cities.get(o.cityId) : undefined, href: objectDetailPath("event", o.slug) }));

    // Архів: заклади/події, чиї дати минули (один запис на заклад)
    const seen = new Set<string>();
    const archive = events
      .filter((o) => isEventArchived(o, today))
      .filter((o) => (seen.has(norm(o.name)) ? false : (seen.add(norm(o.name)), true)))
      .map((o) => ({ o, name: tl(o.name, o.nameEn), dates: o.eventDates || undefined, city: o.cityId ? cities.get(o.cityId) : undefined, href: objectDetailPath("event", o.slug) }));

    return {
      shows,
      cities: [...new Set(shows.map((s) => s.city).filter(Boolean) as string[])],
      other,
      archive,
    };
  }, [snap, tl, today]);

  const date = params.get("date");
  const city = params.get("city");
  const archiveOn = params.has("arkhiv");

  const set = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null) p.delete(k);
      else p.set(k, v);
    }
    setParams(p, { replace: true, preventScrollReset: true });
  };

  // Вистави з урахуванням міста (без дати) — для лічильників днів
  const scoped = useMemo(() => base.shows.filter((s) => !city || s.city === city), [base.shows, city]);
  const dateCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of scoped) m.set(s.iso, (m.get(s.iso) ?? 0) + 1);
    return m;
  }, [scoped]);

  const filtered = useMemo(
    () => scoped.filter((s) => !date || (date === "weekend" ? [0, 6].includes(weekday(s.iso)) && Date.parse(s.iso) - Date.parse(today) < 8 * 86_400_000 : s.iso === date)),
    [scoped, date, today],
  );

  /** Групи за днями. */
  const groups = useMemo(() => {
    const m = new Map<string, TicketShow[]>();
    for (const s of filtered) m.set(s.iso, [...(m.get(s.iso) ?? []), s]);
    return [...m.entries()].map(([iso, list]) => ({ iso, shows: list }));
  }, [filtered]);

  return {
    ...base,
    loading: isLoading || !snap,
    today,
    date,
    city,
    archiveOn,
    set,
    dateCounts,
    groups,
    total: filtered.length,
    hasWeekend: [...dateCounts.keys()].some((iso) => [0, 6].includes(weekday(iso)) && Date.parse(iso) - Date.parse(today) < 8 * 86_400_000),
  };
}

export type AfishaPageData = ReturnType<typeof useAfishaPage>;
