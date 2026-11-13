import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, ChevronRight, Clock, ExternalLink, Globe, Heart, Link2, MapPin, Navigation, Route as RouteIcon, Share2 } from "lucide-react";
import { Img } from "@/components/Img";
import { useBasket } from "@/lib/basketContext";
import { objectDetailPath } from "@/lib/entityLinks";
import { useV2 } from "@/v2/i18n";
import { EASE, Reveal } from "@/v2/components/ui";
import { usePlaceSnippet } from "@/v2/components/PlaceTile";
import { TAG_ICON } from "@/v2/home/routes/tagIcons";
import { BlockHead, RichText, RoutesCompact, TripButton, typeName } from "@/v2/district/parts";
import { plural } from "@/v2/districts/parts";
import { useShare } from "@/v2/place/parts";
import type { RoutePageData, RouteStop } from "./useRoutePage";

/* ── Підписи ───────────────────────────────────────────────────────────── */

/** Одещина › Маршрути › Назва */
export function RouteCrumbs({ data, light = false, className = "" }: { data: RoutePageData; light?: boolean; className?: string }) {
  const { t } = useV2();
  const base = light ? "text-o-sand/80" : "text-o-sea/55";
  const hover = light ? "hover:text-o-sand" : "hover:text-o-wine";
  return (
    <nav aria-label="breadcrumb" className={`flex flex-wrap items-center gap-1 text-[13px] ${base} ${className}`}>
      <Link to="/" className={`transition-colors ${hover}`}>Одещина</Link>
      <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      <Link to="/marshruty" className={`transition-colors ${hover}`}>{t("routesKicker")}</Link>
      <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      <span className={`max-w-[60vw] truncate ${light ? "text-o-sand/90" : "text-o-sea/80"}`} aria-current="page">{data.name}</span>
    </nav>
  );
}

/** Розмір назви за довжиною — довгі назви не мають закривати пів фото. */
export function titleSize(name: string) {
  const n = name.length;
  if (n <= 28) return "text-[40px] sm:text-[64px] lg:text-[72px]";
  if (n <= 48) return "text-[34px] sm:text-[52px] lg:text-[58px]";
  return "text-[28px] sm:text-[40px] lg:text-[46px]";
}

/** «6 годин · 20 км · 3 зупинки» з іконками. */
export function RouteFactsLine({ data, light = false, className = "" }: { data: RoutePageData; light?: boolean; className?: string }) {
  const r = data.route!;
  const n = data.stops.length;
  const items = [
    r.duration ? { Icon: Clock, text: r.duration } : null,
    r.distance ? { Icon: RouteIcon, text: r.distance } : null,
    n ? { Icon: MapPin, text: `${n} ${data.d.stopsWord(n)}` } : null,
  ].filter(Boolean) as { Icon: typeof Clock; text: string }[];
  if (!items.length) return null;
  return (
    <p className={`flex flex-wrap items-center gap-x-5 gap-y-1 text-[14.5px] font-semibold ${light ? "text-o-sunsoft" : "text-o-wine"} ${className}`}>
      {items.map(({ Icon, text }) => (
        <span key={text} className="inline-flex items-center gap-1.5">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {text}
        </span>
      ))}
    </p>
  );
}

/** Типи маршруту — ведуть на список маршрутів із цим фільтром. */
export function RouteTags({ data, light = false, className = "" }: { data: RoutePageData; light?: boolean; className?: string }) {
  const tags = data.route?.tags ?? [];
  if (!tags.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((id) => {
        const Icon = TAG_ICON[id] ?? MapPin;
        return (
          <li key={id}>
            <Link
              to={`/marshruty?tag=${id}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold transition-colors ${
                light ? "bg-o-sand/15 text-o-sand hover:bg-o-sand/25" : "bg-o-wine/[0.08] text-o-wine hover:bg-o-wine/15"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {data.d.tagLabel(id)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Дії ───────────────────────────────────────────────────────────────── */

/** «Усі зупинки в мій маршрут» — кладе всі об'єкти в «Мій маршрут» одним натиском (ще раз — прибирає). */
export function AddAllPill({ data, light = false, className = "" }: { data: RoutePageData; light?: boolean; className?: string }) {
  const { t } = useV2();
  const { has, add, remove } = useBasket();
  const ids = data.stops.map((s) => s.o.id);
  if (!ids.length) return null;
  const all = ids.every(has);
  return (
    <button
      type="button"
      onClick={() => (all ? ids.forEach(remove) : ids.forEach(add))}
      aria-pressed={all}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-colors ${
        all ? "bg-o-wine text-o-sand" : light ? "bg-o-sand text-o-sea hover:bg-o-sunsoft" : "bg-o-wine text-o-sand hover:bg-o-winedeep"
      } ${className}`}
    >
      {all ? <Check className="h-[18px] w-[18px]" aria-hidden="true" /> : <Heart className="h-[18px] w-[18px]" aria-hidden="true" />}
      {all ? t("rpAllAdded") : t("rpAddAll")}
    </button>
  );
}

/**
 * Ряд дій: «Усі зупинки в мій маршрут», «Відкрити в Google Maps» (і «Інший
 * варіант», якщо є друге посилання), «Поділитися».
 */
export function RouteActions({ data, light = false, className = "" }: { data: RoutePageData; light?: boolean; className?: string }) {
  const { t } = useV2();
  const { share, copied } = useShare(data.name);
  const r = data.route!;
  const ghost = `inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-colors ${
    light ? "text-o-sand ring-1 ring-o-sand/40 hover:bg-o-sand/15" : "text-o-sea ring-1 ring-o-sea/20 hover:text-o-wine hover:ring-o-wine/40"
  }`;
  const round = `relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
    light ? "bg-o-sand/15 text-o-sand ring-1 ring-o-sand/30 hover:bg-o-sand/25" : "bg-o-sea/[0.06] text-o-sea hover:bg-o-wine/10 hover:text-o-wine"
  }`;
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <AddAllPill data={data} light={light} />
      {/* Google Maps та «Інший варіант» — з'єднані лінією того ж кольору, що й обведення: це два шляхи одного маршруту */}
      {(r.mapUrl || r.mapUrl2) && (
        <span className="inline-flex items-center">
          {r.mapUrl && (
            <a href={r.mapUrl.trim()} target="_blank" rel="noreferrer" className={ghost}>
              <Navigation className="h-[17px] w-[17px]" aria-hidden="true" />
              {t("rpOpenGoogle")}
            </a>
          )}
          {r.mapUrl && r.mapUrl2 && <span className={`h-px w-6 shrink-0 ${light ? "bg-o-sand/40" : "bg-o-sea/20"}`} aria-hidden="true" />}
          {r.mapUrl2 && (
            <a href={r.mapUrl2.trim()} target="_blank" rel="noreferrer" className={`${ghost} px-4 text-[14px]`}>
              {t("rpAlt")}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )}
        </span>
      )}
      <button type="button" onClick={share} className={round} aria-label={t("share")} title={t("share")}>
        {copied ? <Link2 className="h-[18px] w-[18px]" aria-hidden="true" /> : <Share2 className="h-[18px] w-[18px]" aria-hidden="true" />}
        <span className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-o-sea px-3 py-1 text-[12px] font-semibold text-o-sand transition-opacity ${copied ? "opacity-100" : "opacity-0"}`} role="status">
          {copied ? t("copied") : ""}
        </span>
      </button>
    </div>
  );
}

/* ── Перший екран ──────────────────────────────────────────────────────── */

/** Фото на весь екран із повільним наближенням; унизу — крихти, назва, дані й дії. */
export function RouteHero({ data, height = "h-[100svh] min-h-[560px]" }: { data: RoutePageData; height?: string }) {
  const reduce = useReducedMotion();
  const r = data.route!;
  return (
    <section className={`relative overflow-hidden bg-o-deep text-o-sand ${height}`}>
      <motion.div className="absolute inset-0" initial={reduce ? false : { scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 14, ease: "easeOut" }}>
        <Img src={r.imageUrl || data.stops[0]?.o.imageUrl} w={2200} priority alt="" className="h-full w-full object-cover" />
      </motion.div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(14,10,14,0.42) 0%, rgba(14,10,14,0) 24%, rgba(14,10,14,0) 38%, rgba(14,10,14,0.6) 70%, rgba(14,10,14,0.88) 100%)" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex h-full max-w-[1280px] flex-col justify-end px-5 pb-[calc(104px+env(safe-area-inset-bottom))] sm:px-10 lg:pb-12">
        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2, ease: EASE }}>
          <RouteCrumbs data={data} light className="[text-shadow:0_1px_8px_rgba(0,0,0,0.45)]" />
          <h1 className={`mt-5 max-w-[1100px] font-semibold leading-[1.02] tracking-[-0.025em] [text-wrap:balance] ${titleSize(data.name)}`}>{data.name}</h1>
          <RouteFactsLine data={data} light className="mt-4" />
          <RouteActions data={data} light className="mt-6 border-t border-o-sand/25 pt-5" />
        </motion.div>
      </div>
    </section>
  );
}

/* ── Зупинки ───────────────────────────────────────────────────────────── */

/** Що це за місце — перший вид туризму або тип об'єкта. */
export function useStopKind() {
  const { list, lang } = useV2();
  const kinds = list("placeKinds");
  const idx = { attraction: 0, event: 1, restaurant: 2, hotel: 3 } as const;
  return (s: RouteStop) => (s.o.tourismTypes?.[0] ? typeName(s.o.tourismTypes[0], lang) : kinds[idx[s.o.type]]);
}

/** «≈ 12 км до наступної» */
export function useLegText() {
  const { t, lang } = useV2();
  return (km?: number, short = false) => {
    if (km == null) return "";
    const v = km < 1 ? `${Math.round(km * 1000)} ${lang === "en" ? "m" : "м"}` : `${km < 10 ? km.toFixed(1).replace(".", lang === "en" ? "." : ",") : Math.round(km)} ${t("kmUnit")}`;
    return short ? `≈ ${v}` : `≈ ${v} ${t("rpToNext")}`;
  };
}

/* ── Опис, деталі, посилання, схожі ────────────────────────────────────── */

/** Короткий опис великим текстом. */
export function RouteLead({ data, className = "" }: { data: RoutePageData; className?: string }) {
  if (!data.desc) return null;
  return <p className={`text-[17px] leading-[1.7] text-o-sea/80 sm:text-[19px] ${className}`}>{data.desc}</p>;
}

/** Довідка про маршрут: тривалість, відстань, зупинки, райони. */
export function RoutePassport({ data, className = "" }: { data: RoutePageData; className?: string }) {
  const { t, lang } = useV2();
  const r = data.route!;
  const rows = [
    r.duration ? { k: t("rpDuration"), v: r.duration } : null,
    r.distance ? { k: t("rpDistance"), v: r.distance } : null,
    data.stops.length ? { k: t("rpStops"), v: `${data.stops.length} ${data.d.stopsWord(data.stops.length)}` } : null,
  ].filter(Boolean) as { k: string; v: string }[];
  return (
    <dl className={`grid gap-3 ${className}`}>
      {rows.map((x) => (
        <div key={x.k} className="flex items-baseline justify-between gap-4 border-b border-o-sea/10 pb-2.5">
          <dt className="text-[13px] text-o-sea/55">{x.k}</dt>
          <dd className="text-right text-[15px] font-semibold">{x.v}</dd>
        </div>
      ))}
      {data.districts.length > 0 && (
        <div className="flex items-baseline justify-between gap-4 border-b border-o-sea/10 pb-2.5">
          <dt className="text-[13px] text-o-sea/55">{plural(data.districts.length, lang === "en" ? "District|Districts|Districts" : "Район|Райони|Райони")}</dt>
          <dd className="flex flex-wrap justify-end gap-x-2 text-right text-[15px] font-semibold">
            {data.districts.map((x, i) => (
              <Link key={x.slug} to={`/raion/${x.slug}`} className="transition-colors hover:text-o-wine">
                {x.name}
                {i < data.districts.length - 1 ? "," : ""}
              </Link>
            ))}
          </dd>
        </div>
      )}
    </dl>
  );
}

/** Довгий опис маршруту: спершу ~10 рядків, «Читати більше» розкриває. */
export function RouteDetails({ data, className = "" }: { data: RoutePageData; className?: string }) {
  const { t } = useV2();
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) setLong(el.scrollHeight > el.clientHeight + 4);
  }, [data.content]);
  if (!data.content) return null;
  return (
    <div className={className}>
      <div ref={ref} className={`relative ${open ? "" : "max-h-[17em] overflow-hidden"}`}>
        <RichText html={data.content} className="text-[16px] leading-[1.75] text-o-sea/80 sm:text-[17px]" />
        {!open && long && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-o-sand to-transparent" aria-hidden="true" />}
      </div>
      {long && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-4 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-o-wine underline-offset-4 hover:underline">
          {open ? t("readLess") : t("readMore")}
        </button>
      )}
    </div>
  );
}

/** Корисні посилання маршруту — пігулками. */
export function RouteLinks({ data, className = "" }: { data: RoutePageData; className?: string }) {
  const { t } = useV2();
  if (!data.links.length) return null;
  return (
    <div className={className}>
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-o-wine">{t("rpLinks")}</p>
      <ul className="flex flex-wrap gap-2.5">
        {data.links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#fffaf5] px-4 py-2.5 text-[14px] font-semibold ring-1 ring-o-sea/10 transition-colors hover:text-o-wine hover:ring-o-wine/30">
              <Globe className="h-4 w-4 text-o-wine/70" aria-hidden="true" />
              {l.label}
              <ExternalLink className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** «Схожі маршрути» — звичайні картки маршрутів. */
export function SimilarRoutes({ data }: { data: RoutePageData }) {
  const { t } = useV2();
  if (!data.similar.length) return null;
  return (
    <div className="pb-8 sm:pb-12">
      <RoutesCompact data={{ routes: data.similar, routesData: data.d }} title={t("rpSimilar")} id="similar" />
    </div>
  );
}

/** Заголовок розділу (кікер + назва) — як на інших сторінках. */
export function Head({ kicker, title, id, className = "", aside }: { kicker: string; title: string; id: string; className?: string; aside?: React.ReactNode }) {
  return <BlockHead kicker={kicker} title={title} id={id} className={className} aside={aside} />;
}

