import { useMemo } from "react";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useV2 } from "@/v2/i18n";
import { upcomingShows } from "@/v2/lib/afisha";

/** Дані афіші на тиждень + підписи дат і правильні форми слова «вистава». */
export function useAfisha() {
  const { t, tl, lang } = useV2();
  const { data: snap } = useHierarchySnapshot();
  const days = useMemo(() => upcomingShows(snap?.objects ?? [], 7), [snap]);
  const upcoming = useMemo(() => days.flatMap((d) => d.shows), [days]);

  const locale = lang === "en" ? "en-GB" : "uk-UA";
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...o, timeZone: "Europe/Kyiv" }).format(new Date(`${iso}T12:00:00Z`));

  /** «Сьогодні» / «Завтра» / «пт». */
  const dayName = (iso: string) => {
    const i = days.findIndex((d) => d.iso === iso);
    return i === 0 ? t("today") : i === 1 ? t("tomorrow") : fmt(iso, { weekday: "short" });
  };
  /** «Сьогодні» / «Завтра» / «пт, 6». */
  const dateLabel = (iso: string) => {
    const i = days.findIndex((d) => d.iso === iso);
    return i === 0 ? t("today") : i === 1 ? t("tomorrow") : fmt(iso, { weekday: "short", day: "numeric" });
  };
  /** 1 вистава · 2 вистави · 5 вистав (англ. show/shows). */
  const showsWord = (n: number) => {
    if (lang === "en") return n === 1 ? "show" : "shows";
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "вистава";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "вистави";
    return "вистав";
  };

  return { ready: !!snap, days, upcoming, total: upcoming.length, fmt, dayName, dateLabel, showsWord, t, tl, lang };
}

export type AfishaData = ReturnType<typeof useAfisha>;
