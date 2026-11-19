import { useState } from "react";
import { MapPin } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Img } from "@/components/Img";
import { useV2 } from "@/v2/i18n";
import { Reveal } from "@/v2/components/ui";
import { MoodArt } from "@/v2/home/moods/art";
import { plural } from "@/v2/districts/parts";
import { MoreButton, RoutesCompact, useMore } from "@/v2/district/parts";
import { PlaceTile } from "@/v2/components/PlaceTile";
import { GridToggle, gridColsClass, useGridCols } from "@/v2/components/GridToggle";
import type { TourismType, TypesPageData } from "./useTypesPage";

/** Обраний вид у адресі (?type=…) — посилання з головної ведуть одразу на нього. */
export function useActiveType(data: TypesPageData, fallback = true) {
  const [params, setParams] = useSearchParams();
  const raw = params.get("type");
  const active = data.types.find((t) => t.key === raw) ?? (fallback ? data.types[0] : undefined);
  const setActive = (key: string) => {
    const p = new URLSearchParams(params);
    p.set("type", key);
    setParams(p, { replace: true, preventScrollReset: true });
  };
  return { active, setActive, fromUrl: !!raw };
}

/** Заголовок сторінки: кікер, «Види туризму», короткий вступ. */
export function TypesHead({ aside }: { aside?: React.ReactNode }) {
  const { t } = useV2();
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <Reveal className="max-w-[720px]">
        <p className="mb-3 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
          <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
          {t("tpKicker")}
        </p>
        <h1 className="text-[40px] font-bold leading-[1] tracking-[-0.025em] sm:text-[56px] lg:text-[64px]">
          {t("tpTitle1")} <span className="ital text-o-wine">{t("tpTitle2")}</span>
        </h1>
        <p className="mt-4 max-w-[560px] text-[15.5px] leading-relaxed text-o-sea/70 sm:text-[16.5px]">{t("tpLead")}</p>
      </Reveal>
      {aside}
    </div>
  );
}

/** «47 місць · у 7 районах · 2 маршрути». */
export function useStats() {
  const { t, lang } = useV2();
  return (tp: TourismType) =>
    [
      `${tp.places.length} ${plural(tp.places.length, t("placeForms"))}`,
      tp.districts.length ? `${lang === "en" ? "in" : "у"} ${tp.districts.length} ${plural(tp.districts.length, t("tpInDistricts"))}` : "",
      tp.routes.length ? `${tp.routes.length} ${plural(tp.routes.length, t("routeForms"))}` : "",
    ].filter(Boolean);
}

/**
 * Плитка виду — як на головній: колір палітри, фото лише тлом (знебарвлене,
 * «м'яке світло»), лінійний малюнок виду і назва. compact — менша, для ряду-вибору.
 */
export function TypeTile({ tp, active = false, dim = false, onClick, compact = false, className = "", shape = "aspect-square" }: {
  tp: TourismType;
  active?: boolean;
  dim?: boolean;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
  /** Пропорції плитки (на головній на телефоні — 4:3). */
  shape?: string;
}) {
  const c = tp.style;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative block ${shape} w-full rounded-[20px] text-left shadow-[0_18px_34px_-24px_rgba(0,30,70,0.55)] transition-[transform,box-shadow,opacity] duration-500 ease-out hover:-translate-y-1.5 ${
        active ? "-translate-y-1.5 shadow-[0_26px_40px_-22px_rgba(0,30,70,0.6)] ring-[3px] ring-[color:var(--tile)] ring-offset-[3px] ring-offset-o-sand" : ""
      } ${dim ? "opacity-70 hover:opacity-100" : ""} ${className}`}
      // Обведення обраної плитки — її власного кольору (вино / море / сонце)
      style={{ color: c.ink, ["--tile" as string]: c.bg }}
    >
      <span className="absolute inset-0 isolate overflow-hidden rounded-[20px] [clip-path:inset(0_round_20px)]" style={{ backgroundColor: c.bg }}>
        {tp.image && (
          <Img
            src={tp.image}
            w={360}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-[0.75] mix-blend-soft-light transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.05] group-hover:opacity-100"
            // Фото завжди на власному шарі — без «стрибка» яскравості в кінці анімації наведення (Safari), як на головній
            style={{ filter: tp.photoFilter, willChange: "transform, opacity" }}
          />
        )}
        <MoodArt
          type={tp.key}
          className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 ease-out group-hover:scale-[1.06] ${compact ? "top-[40%] h-[50%] w-[50%]" : "top-[38%] h-[48%] w-[48%] sm:top-[38%] sm:h-[48%] sm:w-[48%]"}`}
        />
        <span className={`absolute ${compact ? "inset-x-2.5 bottom-2.5" : "inset-x-3 bottom-3 sm:inset-x-3.5 sm:bottom-3"}`}>
          <span className={`block font-bold leading-tight ${compact ? "text-[12.5px] sm:text-[13px]" : "text-[14px] sm:text-[15px]"}`}>{tp.head}</span>
          {!compact && tp.tail && (
            <span className="ital hidden text-[13.5px] leading-tight sm:block" style={{ color: c.accent }}>
              {tp.tail}
            </span>
          )}
        </span>
        {compact && (
          <span className="absolute right-2 top-2 rounded-full px-1.5 text-[11px] font-bold tabular-nums" style={{ backgroundColor: c.ink, color: c.bg }}>
            {tp.places.length}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * Смуга виду на всю ширину — в кольорі виду: фото тлом, великий лінійний
 * малюнок, назва, опис і цифри. size="sm" — нижча (для «Розділів»).
 */
export function TypeBand({ tp, size = "lg", children, id }: { tp: TourismType; size?: "lg" | "sm"; children?: React.ReactNode; id?: string }) {
  const { t } = useV2();
  const stats = useStats();
  const c = tp.style;
  const lg = size === "lg";
  return (
    <div className="layers relative isolate overflow-hidden" style={{ backgroundColor: c.bg, color: c.ink }}>
      {tp.image && (
        <Img src={tp.image} w={1800} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60 mix-blend-soft-light" style={{ filter: tp.photoFilter }} />
      )}
      <div className={`relative mx-auto grid max-w-[1280px] items-center gap-6 px-5 sm:px-10 ${lg ? "py-10 sm:grid-cols-[minmax(0,1fr)_260px] sm:py-14 lg:grid-cols-[minmax(0,1fr)_320px]" : "py-8 sm:grid-cols-[minmax(0,1fr)_170px] sm:py-10"}`}>
        <div>
          <p className="mb-3 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em]" style={{ color: c.accent }}>
            <span className="h-px w-8" style={{ backgroundColor: c.accent }} aria-hidden="true" />
            {t("tpKind")}
          </p>
          <h2 id={id} className={`font-bold leading-[1] tracking-[-0.02em] ${lg ? "text-[36px] sm:text-[52px] lg:text-[60px]" : "text-[30px] sm:text-[40px]"}`}>
            {tp.head} {tp.tail && <span className="ital" style={{ color: c.accent }}>{tp.tail}</span>}
          </h2>
          {tp.about && <p className={`mt-4 max-w-[600px] leading-snug opacity-90 ${lg ? "text-[17px] sm:text-[20px]" : "text-[16px] sm:text-[18px]"}`}>{tp.about}</p>}
          <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[14px] font-semibold opacity-80">
            {stats(tp).map((s, i) => (
              <span key={s} className="flex items-center gap-3">
                {i > 0 && <span aria-hidden="true">·</span>}
                {s}
              </span>
            ))}
          </p>
          {children}
        </div>
        <MoodArt type={tp.key} className={`mx-auto hidden opacity-90 sm:block ${lg ? "h-[220px] w-[220px] lg:h-[280px] lg:w-[280px]" : "h-[150px] w-[150px]"}`} />
      </div>
    </div>
  );
}

/** Фільтр за районами — лише ті, де є місця цього виду. */
export function DistrictChips({ tp, value, onChange }: { tp: TourismType; value: string | null; onChange: (v: string | null) => void }) {
  const { t } = useV2();
  if (tp.districts.length < 2) return null;
  const cls = (on: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${on ? "bg-o-wine text-o-sand" : "bg-o-sea/[0.06] text-o-sea hover:bg-o-wine/10"}`;
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={t("tpAllDistricts")}>
      <button type="button" onClick={() => onChange(null)} aria-pressed={!value} className={cls(!value)}>
        {t("tpAllDistricts")} <span className="opacity-60">{tp.places.length}</span>
      </button>
      {tp.districts.map((d) => {
        const n = tp.places.filter((p) => p.o.districtId === d.d.id).length;
        return (
          <button key={d.slug} type="button" onClick={() => onChange(value === d.slug ? null : d.slug)} aria-pressed={value === d.slug} className={cls(value === d.slug)}>
            {d.short} <span className="opacity-60">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Місця виду: фільтр за районами + сітка + «Показати ще». */
export function TypePlaces({ tp, limit = 12, anchor }: { tp: TourismType; limit?: number; anchor?: string }) {
  const [district, setDistrict] = useState<string | null>(null);
  // По 4 чи по 3 в ряд — перемикач праворуч від фільтрів (за замовчуванням 4).
  const [cols, setCols] = useGridCols();
  const list = district ? tp.places.filter((p) => p.district?.slug === district) : tp.places;
  const more = useMore(list, limit);
  return (
    <>
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <DistrictChips tp={tp} value={district} onChange={setDistrict} />
        </div>
        <GridToggle cols={cols} onChange={setCols} />
      </div>
      <div className="relative mt-6">
        <ul className={`relative grid ${gridColsClass(cols)}`}>
          {more.shown.map((p, i) => (
            <Reveal as="li" key={p.o.id} delay={(i % cols) * 0.05} y={18}>
              <PlaceTile o={p.o} name={p.name} meta={[p.town, p.district?.short].filter(Boolean).join(" · ")} icon={MapPin} />
            </Reveal>
          ))}
        </ul>
      </div>
      <MoreButton more={more} anchor={anchor} />
    </>
  );
}

/** Маршрути з тегами цього виду (якщо є). */
export function TypeRoutes({ tp, data }: { tp: TourismType; data: TypesPageData }) {
  const { t } = useV2();
  if (!tp.routes.length) return null;
  return <RoutesCompact data={{ routes: tp.routes, routesData: data.routesData }} title={t("tpRoutes")} id={`routes-${tp.key.length}`} />;
}
