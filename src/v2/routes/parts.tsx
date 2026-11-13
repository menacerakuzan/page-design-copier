import { MapPin, Route as RouteIcon } from "lucide-react";
import { useV2 } from "@/v2/i18n";
import { Reveal } from "@/v2/components/ui";
import { plural } from "@/v2/districts/parts";
import { TAG_ICON } from "@/v2/home/routes/tagIcons";
import type { RoutesPageData } from "./useRoutesPage";

/* ── Заголовок і фільтри ───────────────────────────────────────────────── */

/** «Готові маршрути», вступ і рядок цифр: «9 маршрутів · 22 зупинки · 5 районів». */
export function RoutesHead({ data, aside }: { data: RoutesPageData; aside?: React.ReactNode }) {
  const { t, lang } = useV2();
  const { routes, stops, districts } = data.stats;
  const facts = [
    `${routes} ${plural(routes, t("routeForms"))}`,
    stops ? `${stops} ${data.d.stopsWord(stops)}` : "",
    districts ? `${lang === "en" ? "in" : "у"} ${districts} ${plural(districts, t("tpInDistricts"))}` : "",
  ].filter(Boolean);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
      <Reveal className="max-w-[720px]">
        <p className="mb-3 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
          <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
          {t("routesKicker")}
        </p>
        <h1 className="text-[40px] font-bold leading-[1] tracking-[-0.025em] sm:text-[56px] lg:text-[64px]">
          {t("routesTitle1")} <span className="ital text-o-wine">{t("routesTitle2")}</span>
        </h1>
        <p className="mt-4 max-w-[700px] text-[15.5px] leading-relaxed text-o-sea/70 sm:text-[16.5px]">{t("routesLead")}</p>
        {routes > 0 && <p className="mt-4 text-[13px] font-semibold text-o-sea/55">{facts.join(" · ")}</p>}
      </Reveal>
      {aside}
    </div>
  );
}

/** Фільтри за типом — «таблетки» з іконкою й кількістю; обрана — винна. На телефоні рядок гортається вбік. */
export function RouteTagChips({ data, className = "" }: { data: RoutesPageData; className?: string }) {
  const { t } = useV2();
  const { d, tags, tag, setTag } = data;
  if (!tags.length) return null;
  const all = [{ id: null as string | null, count: data.inDistrict.length }, ...tags];
  return (
    <div className={`no-scrollbar -mx-5 -mb-4 flex gap-1.5 overflow-x-auto px-5 pb-5 pt-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 ${className}`} role="group" aria-label={t("routesKicker")}>
      {all.map(({ id, count }) => {
        const Icon = id ? TAG_ICON[id] ?? MapPin : RouteIcon;
        const on = tag === id;
        return (
          <button
            key={id ?? "all"}
            type="button"
            aria-pressed={on}
            onClick={() => setTag(id)}
            className={`group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-all duration-300 ${!count && !on ? "opacity-45" : ""} ${
              on ? "bg-o-wine text-o-sand shadow-[0_8px_18px_-10px_rgba(159,31,71,0.9)]" : "bg-o-sea/[0.05] text-o-sea/80 hover:bg-o-sea/[0.1] hover:text-o-sea"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${on ? "text-o-sun" : "text-o-wine"}`} aria-hidden="true" />
            {id ? d.tagLabel(id) : t("allTags")}
            <span className={`text-[11.5px] ${on ? "text-o-sand/70" : "text-o-sea/45"}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Порожньо: маршрутів ще немає зовсім або немає обраного типу. */
export function RoutesEmpty({ data }: { data: RoutesPageData }) {
  const { t } = useV2();
  return (
    <div className="py-20 text-center">
      <p className="text-[16px] text-o-sea/65">{data.items.length ? t("rtEmpty") : t("rtNone")}</p>
      {(data.tag || data.districts.length > 0) && (
        <button type="button" onClick={data.resetFilters} className="mt-5 rounded-full border border-o-sea/20 px-5 py-2 text-[14px] font-semibold transition-colors hover:border-o-wine hover:text-o-wine">
          {t("rtShowAllRoutes")}
        </button>
      )}
    </div>
  );
}
