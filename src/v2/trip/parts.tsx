import { Link } from "react-router-dom";
import { ArrowRight, Heart, Landmark, Map as MapIcon, Route as RouteIcon, Trash2 } from "lucide-react";
import { useV2 } from "@/v2/i18n";
import { Reveal } from "@/v2/components/ui";
import { PlaceTile } from "@/v2/components/PlaceTile";
import { plural } from "@/v2/districts/parts";
import { FoldedMap } from "@/v2/home/routes/parts";
import type { TripData } from "./useTrip";

/** «5 місць · у 3 районах · ≈ 120 км по прямій» */
export function useSummary(data: TripData) {
  const { t, lang } = useV2();
  const n = data.items.length;
  return [
    `${n} ${plural(n, t("placeForms"))}`,
    data.districtCount ? `${lang === "en" ? "in" : "у"} ${data.districtCount} ${plural(data.districtCount, t("tpInDistricts"))}` : "",
    data.km >= 1 ? `≈ ${Math.round(data.km)} ${t("kmUnit")} ${t("trStraight")}` : "",
  ].filter(Boolean);
}

/** «≈ 12 км» між сусідніми місцями */
export function legText(km: number | undefined, unit: string) {
  if (km == null) return "";
  return km < 1 ? `≈ ${Math.round(km * 1000)} м` : `≈ ${km < 10 ? km.toFixed(1).replace(".", ",") : Math.round(km)} ${unit}`;
}

/** Заголовок сторінки; праворуч — «Очистити все». */
export function TripHead({ data }: { data: TripData }) {
  const { t } = useV2();
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <Reveal className="max-w-[720px]">
        <p className="mb-3 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
          <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
          {t("trKicker")}
        </p>
        <h1 className="text-[40px] font-bold leading-[1] tracking-[-0.025em] sm:text-[56px] lg:text-[64px]">
          {t("trTitle1")} <span className="ital text-o-wine">{t("trTitle2")}</span>
        </h1>
        <p className="mt-4 max-w-[600px] text-[15.5px] leading-relaxed text-o-sea/70 sm:text-[16.5px]">{t("trLead")}</p>
      </Reveal>
      {data.items.length > 0 && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(t("trClearAsk"))) data.clear();
          }}
          className="inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-[13.5px] font-semibold text-o-sea/60 ring-1 ring-o-sea/15 transition-colors hover:text-o-wine hover:ring-o-wine/40 lg:self-end"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t("trClear")}
        </button>
      )}
    </div>
  );
}

/** Кнопка «Скласти маршрут» → карта (/marshrut); вимкнена, поки місць із локацією менше двох. */
export function BuildButton({ data, className = "", light = false }: { data: TripData; className?: string; light?: boolean }) {
  const { t } = useV2();
  const base = "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-colors";
  if (!data.canBuild) {
    return (
      <span className={`${base} cursor-not-allowed ${light ? "bg-o-sand/20 text-o-sand/60" : "bg-o-sea/[0.07] text-o-sea/45"} ${className}`} title={t("trNeedTwo")}>
        <RouteIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        {t("trBuild")}
      </span>
    );
  }
  return (
    <Link to="/marshrut" className={`group ${base} ${light ? "bg-o-sand text-o-sea hover:bg-o-sunsoft" : "bg-o-wine text-o-sand hover:bg-o-winedeep"} ${className}`}>
      <RouteIcon className="h-[18px] w-[18px]" aria-hidden="true" />
      {t("trBuild")}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

/** Порожньо: ілюстрація, як зберігати ♡, куди піти, і кілька місць, з яких почати. */
export function EmptyTrip({ data }: { data: TripData }) {
  const { t, tl } = useV2();
  const links = [
    { to: "/districts", label: t("navDistricts"), Icon: MapIcon },
    { to: "/marshruty", label: t("routesKicker"), Icon: RouteIcon },
    { to: "/types", label: t("tpTitle1") + " " + t("tpTitle2"), Icon: Landmark },
  ];
  return (
    <>
      <Reveal className="mt-10 grid items-center gap-8 rounded-[28px] bg-[#fffaf5] p-6 shadow-[0_24px_50px_-36px_rgba(0,10,30,0.6)] ring-1 ring-o-sea/[0.06] sm:mt-12 sm:p-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-[26px] font-bold leading-tight sm:text-[32px]">{t("trEmptyTitle")}</p>
          <p className="mt-3 max-w-[560px] text-[15.5px] leading-relaxed text-o-sea/70">
            {t("trEmptyText1")}{" "}
            <span className="inline-flex h-7 w-7 translate-y-1.5 items-center justify-center rounded-full bg-o-sand text-o-sea shadow-[0_6px_16px_-8px_rgba(0,20,50,0.6)]">
              <Heart className="h-3.5 w-3.5" aria-hidden="true" />
            </span>{" "}
            {t("trEmptyText2")}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {links.map(({ to, label, Icon }) => (
              <Link key={to} to={to} className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14.5px] font-semibold ring-1 ring-o-sea/20 transition-colors hover:text-o-wine hover:ring-o-wine/40">
                <Icon className="h-4 w-4 text-o-wine" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <FoldedMap tone="cream" className="mx-auto hidden w-full max-w-[300px] -rotate-3 drop-shadow-[0_24px_30px_rgba(0,10,30,0.12)] lg:block" />
      </Reveal>

      {data.starters.length > 0 && (
        <section aria-labelledby="start" className="mt-14 sm:mt-16">
          <h2 id="start" className="text-[24px] font-bold leading-tight tracking-[-0.015em] sm:text-[30px]">{t("trStart")}</h2>
          <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 lg:grid-cols-4">
            {data.starters.map((o, i) => (
              <Reveal as="li" key={o.id} delay={i * 0.05} y={14}>
                <PlaceTile o={o} name={tl(o.name, o.nameEn)} />
              </Reveal>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
