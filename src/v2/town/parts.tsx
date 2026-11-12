import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Calendar, ChevronRight, Sparkles, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSun, Moon, Snowflake, Sun } from "lucide-react";
import type { TourismObjectType } from "@/types/hierarchy";
import type { PageSection } from "@/types/pages";
import { Img } from "@/components/Img";
import { PlaceTile } from "@/v2/components/PlaceTile";
import { GridToggle, gridColsClass, useGridCols } from "@/v2/components/GridToggle";
import { AudioGuidePlayer } from "@/components/AudioGuidePlayer";
import { ReelVideo } from "@/components/ReelVideo";
import { objectDetailPath } from "@/lib/entityLinks";
import type { WeatherData } from "@/hooks/useWeather";
import { plain, useV2 } from "@/v2/i18n";
import { EASE, Reveal } from "@/v2/components/ui";
import { DISTRICT_SHAPES, shapeBox } from "@/v2/lib/districtShapes";
import { plural } from "@/v2/districts/parts";
import {
  BlockHead, ExtraSection, MoreButton, RichText, RoutesCompact, SilhouetteThumb, TypeChips,
  typeName, useMore, usePlacesWord, useSectionTitle, useTypeFilter,
} from "@/v2/district/parts";
import { PLACE_KIND, type Place } from "@/v2/district/useDistrictPage";
import { townPlacesFor, type TownDot, type TownPageData } from "./useTownPage";
import { SideArrow, useWide } from "@/v2/district/MixTowns";
import { useTownEventsCount } from "./Events";

/* ── Дрібниці ──────────────────────────────────────────────────────────── */

const TYPES = ["місто", "село", "селище", "селище міського типу"];

/** «місто» / «село» / «селище» (en: city / village / …) — малими, для підпису над назвою. */
export function useTownType(data: TownPageData) {
  const { list } = useV2();
  const i = TYPES.indexOf(data.c?.settlementType ?? "місто");
  return list("townTypes")[i < 0 ? 0 : i];
}

/** Підзаголовок пункту, якщо він не повторює тип («Місто» під словом «місто»). */
export function useSubtitle(data: TownPageData) {
  const type = useTownType(data);
  const s = data.subtitle?.trim();
  return s && s.toLowerCase() !== type.toLowerCase() ? s : "";
}

/** Заголовок блоку з конструктора; «Про місто» → «Про село»/«Про селище» за типом пункту. */
export function useTownSectionTitle(data: TownPageData) {
  const titleOf = useSectionTitle();
  return (s: PageSection) => {
    if (s.title !== "Про місто") return titleOf(s);
    const t = data.c?.settlementType ?? "місто";
    const fixed = t === "село" ? "Про село" : t.startsWith("селище") ? "Про селище" : "Про місто";
    return titleOf({ ...s, title: fixed });
  };
}

/** Одещина › Райони › Район › Пункт */
export function TownCrumbs({ data, light = false, className = "" }: { data: TownPageData; light?: boolean; className?: string }) {
  const { t } = useV2();
  const base = light ? "text-o-sand/80" : "text-o-sea/55";
  const hover = light ? "hover:text-o-sand" : "hover:text-o-wine";
  const sep = <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />;
  return (
    <nav aria-label="breadcrumb" className={`flex flex-wrap items-center gap-1 text-[13px] ${base} ${className}`}>
      <Link to="/" className={`transition-colors ${hover}`}>Одещина</Link>
      {sep}
      <Link to="/districts" className={`transition-colors ${hover}`}>{t("navDistricts")}</Link>
      {data.district && (
        <>
          {sep}
          <Link to={`/raion/${data.district.slug}`} className={`transition-colors ${hover}`}>{data.district.name}</Link>
        </>
      )}
      {sep}
      <span className={light ? "text-o-sand/90" : "text-o-sea/80"} aria-current="page">{data.name}</span>
    </nav>
  );
}

/** Іконка погоди за кодом OpenWeather (01d, 10n…) — лінійна, у колір тексту. */
function weatherIcon(code: string) {
  const night = code.endsWith("n");
  switch (code.slice(0, 2)) {
    case "01": return night ? Moon : Sun;
    case "02": return night ? CloudMoon : CloudSun;
    case "09": return CloudDrizzle;
    case "10": return CloudRain;
    case "11": return CloudLightning;
    case "13": return Snowflake;
    case "50": return CloudFog;
    default: return Cloud;
  }
}

/** Погода одним рядком: іконка · 14° · хмарно. Без рамок і плашок. */
export function WeatherLine({ w, light = false, className = "" }: { w: WeatherData | null; light?: boolean; className?: string }) {
  const { t } = useV2();
  if (!w) return null;
  return (
    <p className={`flex items-center gap-1.5 text-[14px] ${light ? "text-o-sand/85" : "text-o-sea/70"} ${className}`}>
      <span className="sr-only">{t("weatherNow")}: </span>
      {(() => {
        const Icon = weatherIcon(w.icon ?? "");
        return <Icon className={`h-[18px] w-[18px] ${light ? "text-o-sunsoft" : "text-o-wine"}`} aria-hidden="true" />;
      })()}
      <span className={`text-[17px] font-bold ${light ? "text-o-sand" : "text-o-sea"}`}>{w.temp > 0 ? `+${w.temp}` : w.temp}°</span>
      <span className="opacity-50" aria-hidden="true">·</span>
      <span className="first-letter:uppercase">{w.description}</span>
    </p>
  );
}

/** Переходи до розділів: «4 місця ↓ · 2 маршрути ↓». */
export function useJumps(data: TownPageData) {
  const { t } = useV2();
  const count = (kind: TourismObjectType) => {
    const s = data.sections.find((x) => x.kind === `places_${kind}`);
    return s ? townPlacesFor(data, kind, s).length : 0;
  };
  const places = count("attraction");
  const events = useTownEventsCount(data);
  return [
    places ? { href: "#see-attraction", n: places, word: plural(places, t("placeForms")) } : null,
    events ? { href: "#events", n: events, word: plural(events, t("eventForms")) } : null,
    data.routes.length ? { href: "#routes", n: data.routes.length, word: plural(data.routes.length, t("routeForms")) } : null,
  ].filter(Boolean) as { href: string; n: number; word: string }[];
}

/**
 * Опис пункту. clamp — скільки рядків видно спершу; «Читати більше» розкриває
 * і короткий, і детальний опис.
 */
export function TownText({ data, clamp, className = "", textClass = "text-[16.5px] leading-[1.7] sm:text-[18px]", withDetails = true }: {
  data: TownPageData;
  clamp?: number;
  className?: string;
  textClass?: string;
  withDetails?: boolean;
}) {
  const { t, tl } = useV2();
  const [open, setOpen] = useState(false);
  const c = data.c!;
  const more = withDetails ? c.detailedInfo : undefined;
  const clamped: React.CSSProperties | undefined =
    clamp && !open ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: clamp, overflow: "hidden" } : undefined;
  return (
    <div className={className}>
      <RichText html={tl(c.description, c.descriptionEn)} className={`${textClass} text-o-sea/85`} style={clamped} />
      {more && (
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="overflow-hidden"
        >
          <RichText html={more} className={`mt-3 ${textClass} text-o-sea/75`} />
        </motion.div>
      )}
      {(more || clamp) && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-o-wine underline decoration-o-wine/30 underline-offset-4 transition-colors hover:decoration-o-wine"
        >
          {open ? t("readLess") : t("readMore")}
        </button>
      )}
    </div>
  );
}

/** Аудіогід пункту (якщо є) — у винному кольорі нового дизайну. */
export function TownAudio({ data, className = "" }: { data: TownPageData; className?: string }) {
  const { tl } = useV2();
  const src = tl(data.c?.audioUrl, data.c?.audioUrlEn);
  if (!src) return null;
  return (
    <div className={`max-w-[520px] ${className}`}>
      <AudioGuidePlayer src={src} accent="#9f1f47" />
    </div>
  );
}

/** Вертикальне відео-«рілс» пункту (якщо є). */
export function TownReel({ data, className = "w-[220px]" }: { data: TownPageData; className?: string }) {
  const [muted, setMuted] = useState(true);
  if (!data.c?.reelUrl) return null;
  return (
    <div className={`relative aspect-[9/16] overflow-hidden rounded-[20px] bg-o-deep shadow-[0_24px_40px_-24px_rgba(0,10,30,0.7)] ${className}`}>
      <ReelVideo src={data.c.reelUrl} muted={muted} onToggleMute={() => setMuted((m) => !m)} emblemSize={120} />
    </div>
  );
}

/* ── Карта району з точкою пункту ──────────────────────────────────────── */

/**
 * Контур району (тонка винна лінія), на ньому — пункти району крапками.
 * Цей пункт — винна точка з хвилею, інші — маленькі, з назвою при наведенні
 * (клік — на їхню сторінку). Підписи — HTML поверх SVG, щоб текст був чіткий.
 */
export function Locator({ data, className = "w-[240px] sm:w-[280px]", caption = true, tone = "wine" }: {
  data: TownPageData;
  className?: string;
  caption?: boolean;
  /** stamp — заповнений винний силует (для «марки» в «Буклеті»). */
  tone?: "wine" | "stamp";
}) {
  const { t } = useV2();
  const [hot, setHot] = useState<string | null>(null);
  const slug = data.district?.slug;
  const box = slug ? shapeBox(slug) : undefined;
  if (!slug || !box) return null;
  // Кадр — за формою району (широкий Ізмаїльський не тоне в порожньому квадраті),
  // але не вужчий за 4:5 і не ширший за 2.2:1.
  const fw = Math.max(box.w, box.h * 0.8) * 1.1;
  const fh = Math.max(box.h, fw / 2.2 / 1.1) * 1.1;
  const vx = box.x + box.w / 2 - fw / 2;
  const vy = box.y + box.h / 2 - fh / 2;
  const pos = (xy: [number, number]) => ({ left: `${((xy[0] - vx) / fw) * 100}%`, top: `${((xy[1] - vy) / fh) * 100}%` });
  const stamp = tone === "stamp";

  return (
    <figure className={className}>
      <div className="relative" style={{ aspectRatio: `${fw} / ${fh}` }}>
        <svg viewBox={`${vx} ${vy} ${fw} ${fh}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <path
            d={DISTRICT_SHAPES[slug].d}
            fill={stamp ? "#9f1f47" : "rgba(159,31,71,0.06)"}
            stroke="#9f1f47"
            strokeOpacity={stamp ? 1 : 0.7}
            strokeWidth={1.6}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        </svg>
        {data.towns.map((tw) => {
          if (!tw.xy) return null;
          const own = tw.c.id === data.c?.id;
          if (own) {
            return (
              <span key={tw.c.id} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={pos(tw.xy)}>
                <span className={`ping-soft absolute inset-0 rounded-full ${stamp ? "bg-o-sand" : "bg-o-wine"}`} aria-hidden="true" />
                <span className={`relative block h-3.5 w-3.5 rounded-full border-2 ${stamp ? "border-o-wine bg-o-sand" : "border-o-sand bg-o-wine"}`} />
              </span>
            );
          }
          const on = hot === tw.c.id;
          // Марка сама є посиланням — усередині неї точки без посилань.
          if (stamp) {
            return (
              <span key={tw.c.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={pos(tw.xy)} aria-hidden="true">
                <span className="block h-1.5 w-1.5 rounded-full bg-o-sand/75" />
              </span>
            );
          }
          return (
            <Link
              key={tw.c.id}
              to={`/napryamky/${tw.c.slug}`}
              className="group absolute z-[5] -translate-x-1/2 -translate-y-1/2 p-1.5"
              style={pos(tw.xy)}
              onMouseEnter={() => setHot(tw.c.id)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(tw.c.id)}
              onBlur={() => setHot(null)}
              aria-label={tw.name}
            >
              <span className="block h-2 w-2 rounded-full bg-o-sea/45 transition-transform group-hover:scale-150 group-hover:bg-o-wine" />
              <span
                className={`pointer-events-none absolute bottom-full left-1/2 mb-0.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-o-sea px-2 py-0.5 text-[11.5px] font-semibold text-o-sand transition-opacity ${on ? "opacity-100" : "opacity-0"}`}
                aria-hidden="true"
              >
                {tw.name}
              </span>
            </Link>
          );
        })}
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-[13px] font-semibold text-o-sea/60">
          <Link to={`/raion/${slug}`} className="inline-flex items-center gap-1 transition-colors hover:text-o-wine">
            {data.district?.name}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <span className="sr-only"> — {t("townOnMap")}</span>
        </figcaption>
      )}
    </figure>
  );
}

/* ── Місця ─────────────────────────────────────────────────────────────── */

/** Підпис над назвою місця: дати події або вид туризму. */
export function placeKicker(p: Place, lang: "uk" | "en") {
  if (p.o.type === "event" && p.o.eventDates) return p.o.eventDates;
  const kind = p.o.tourismTypes?.[0];
  return kind ? typeName(kind, lang) : "";
}

/** Короткий опис місця (без HTML). */
export function usePlaceText() {
  const { tl } = useV2();
  return (p: Place) => plain(tl(p.o.description, p.o.descriptionEn));
}

/** Картка місця — спільна «Картка» (src/v2/components/PlaceTile.tsx): під назвою — дати події або вид туризму. */
export function PlaceCard({ p }: { p: Place }) {
  const { lang } = useV2();
  const kicker = placeKicker(p, lang);
  return <PlaceTile o={p.o} name={p.name} meta={kicker} icon={p.o.type === "event" && p.o.eventDates ? Calendar : Sparkles} />;
}

/** Сітка карток з фільтром за видами і «Показати ще» — для довгих списків. */
export function PlacesGrid({ list: places, limit = 8 }: { list: Place[]; limit?: number }) {
  const { type, setType, types, list } = useTypeFilter(places);
  // По 4 чи по 3 в ряд — перемикач праворуч від фільтрів; при 3 — на одну картку більше (8 → 9), щоб ряди були повні.
  const [cols, setCols] = useGridCols();
  const more = useMore(list, cols === 3 && limit % 3 ? limit + (3 - (limit % 3)) : limit);
  return (
    <>
      <div className="mt-6 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          {places.length > limit && <TypeChips types={types} value={type} onChange={setType} total={places.length} />}
        </div>
        <GridToggle cols={cols} onChange={setCols} />
      </div>
      <ul className={`mt-8 grid ${gridColsClass(cols)}`}>
        {more.shown.map((p, i) => (
          <Reveal as="li" key={p.o.id} delay={(i % cols) * 0.05} y={18}>
            <PlaceCard p={p} />
          </Reveal>
        ))}
      </ul>
      <MoreButton more={more} />
    </>
  );
}

/** Блок місць будь-якого виду (події, ресторани, готелі) — звичайною сіткою. */
export function PlacesBlock({ data, s, title }: { data: TownPageData; s: PageSection; title: string }) {
  const { t } = useV2();
  const kind = PLACE_KIND[s.kind];
  const list = townPlacesFor(data, kind, s);
  if (!list.length) return null;
  return (
    <section id={`see-${kind}`} aria-labelledby={`see-${kind}-t`} className="mx-auto max-w-[1280px] scroll-mt-24 px-5 py-10 sm:px-10 sm:py-14">
      <BlockHead id={`see-${kind}-t`} kicker={kind === "attraction" ? t("seeTitle") : data.name} title={title} count={list.length} />
      <PlacesGrid list={list} />
    </section>
  );
}

/** Посилання «Детальніше →» на сторінку місця. */
export function DetailsLink({ p, className = "" }: { p: Place; className?: string }) {
  const { t } = useV2();
  return (
    <Link
      to={objectDetailPath(p.o.type, p.o.slug)}
      className={`group/l inline-flex items-center gap-1.5 text-[14px] font-semibold text-o-wine ${className}`}
    >
      <span className="underline decoration-o-wine/30 underline-offset-4 transition-colors group-hover/l:decoration-o-wine">{t("detailsLink")}</span>
      <ArrowRight className="h-4 w-4 transition-transform group-hover/l:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

/* ── Решта сторінки ────────────────────────────────────────────────────── */

/**
 * Блоки сторінки за порядком конструктора. Опис і туристичні об'єкти кожен
 * варіант малює по-своєму (about / attractions); решта — спільна.
 * skip — види блоків, які варіант уже показав деінде (напр. у «Прогулянці»).
 */
export function TownSections({ data, about, attractions, skip = [] }: {
  data: TownPageData;
  about?: (s: PageSection, title: string) => React.ReactNode;
  attractions?: (s: PageSection, title: string, list: Place[]) => React.ReactNode;
  skip?: string[];
}) {
  const titleOf = useTownSectionTitle(data);
  return (
    <>
      {data.sections.map((s) => {
        if (skip.includes(s.kind)) return null;
        const title = titleOf(s);
        if (s.kind === "description") return about ? <div key={s.id}>{about(s, title)}</div> : null;
        if (s.kind === "places_attraction" && attractions) {
          const list = townPlacesFor(data, "attraction", s);
          return list.length ? <div key={s.id}>{attractions(s, title, list)}</div> : null;
        }
        if (PLACE_KIND[s.kind]) return <PlacesBlock key={s.id} data={data} s={s} title={title} />;
        return <ExtraSection key={s.id} s={s} data={data} title={title} />;
      })}
    </>
  );
}

/** Маршрути, що проходять місцями пункту. */
export function TownRoutes({ data }: { data: TownPageData }) {
  const { t } = useV2();
  return <RoutesCompact data={data} title={`${t("routesThroughTown")} ${data.name}`} />;
}

/** Плитка «Увесь район»: силует району з фото + його «характер». */
function DistrictTile({ data }: { data: TownPageData }) {
  const { t } = useV2();
  const d = data.district!;
  return (
    <Link to={`/raion/${d.slug}`} className="group flex h-full flex-col items-center justify-center rounded-[16px] p-3 text-center ring-1 ring-inset ring-o-wine/15 transition-colors hover:bg-o-wine/[0.05] hover:ring-o-wine/40">
      <SilhouetteThumb it={d} className="h-[96px] w-[96px] transition-transform duration-500 group-hover:-translate-y-1" />
      <span className="mt-2 text-[14px] font-bold leading-tight transition-colors group-hover:text-o-wine">{t("wholeDistrict")}</span>
      <span className="mt-0.5 text-[12px] leading-snug text-o-sea/55">{d.tagline}</span>
    </Link>
  );
}

/** Плитка сусіднього пункту: фото 4:3, назва й кількість місць. */
function TownTile({ tw }: { tw: TownDot }) {
  const placesWord = usePlacesWord();
  return (
    <Link to={`/napryamky/${tw.c.slug}`} className="group block">
      <span className="block overflow-hidden rounded-[16px] bg-o-sea/10">
        <Img src={tw.c.imageUrl} w={520} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
      </span>
      <span className="mt-2.5 flex items-baseline justify-between gap-2 px-0.5">
        <span className="truncate text-[16px] font-bold transition-colors group-hover:text-o-wine">{tw.name}</span>
        {tw.places > 0 && <span className="shrink-0 text-[12px] text-o-sea/55">{placesWord(tw.places)}</span>}
      </span>
    </Link>
  );
}

/** Скільки сусідніх пунктів у ряду на ПК (поруч із плиткою району). */
const PER = 4;

/**
 * На ПК: плитка району + чотири пункти; якщо пунктів більше — стрілки по
 * боках гортають ряд (остання «сторінка» завжди повна), під ним — крапки.
 */
function SiblingPages({ data }: { data: TownPageData }) {
  const { t } = useV2();
  const reduce = useReducedMotion();
  const towns = data.siblings;
  const pages = Math.max(1, Math.ceil(towns.length / PER));
  const [[page, dir], setPage] = useState<[number, number]>([0, 0]);
  const start = Math.max(0, Math.min(page * PER, towns.length - PER));
  const go = (d: -1 | 1) => setPage(([p]) => [Math.min(pages - 1, Math.max(0, p + d)), d]);
  const slide = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { x: `${d * 60}%`, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { x: `${-d * 60}%`, opacity: 0 }),
  };
  return (
    <div>
      <div className="grid grid-cols-5 gap-4">
        <DistrictTile data={data} />
        <div className="relative col-span-4">
          {/* Запас знизу/згори — щоб підписи й тіні не обрізало під час гортання */}
          <div className="-my-2 overflow-hidden py-2">
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.ul
                key={page}
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: EASE }}
                className="grid grid-cols-4 gap-4"
              >
                {towns.slice(start, start + PER).map((tw) => (
                  <li key={tw.c.id}>
                    <TownTile tw={tw} />
                  </li>
                ))}
              </motion.ul>
            </AnimatePresence>
          </div>
          {pages > 1 && (
            <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[4/1] [&>*]:pointer-events-auto">
              <AnimatePresence>
                {page > 0 && <SideArrow key="prev" dir={-1} onClick={() => go(-1)} label={t("prevItems")} />}
                {page < pages - 1 && <SideArrow key="next" dir={1} onClick={() => go(1)} label={t("nextItems")} />}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(([p]) => [i, i > p ? 1 : -1])}
              aria-label={`${i + 1}`}
              aria-current={i === page || undefined}
              className={`h-2 rounded-full transition-all duration-300 ${i === page ? "w-6 bg-o-wine" : "w-2 bg-o-sea/20 hover:bg-o-sea/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * «Ще в районі»: перша плитка — сам район (силует), далі — інші пункти.
 * На ПК — ряд зі стрілками (див. SiblingPages); на телефоні — стрічка вбік.
 */
export function SiblingTowns({ data, className = "" }: { data: TownPageData; className?: string }) {
  const { t } = useV2();
  const wide = useWide();
  const d = data.district;
  if (!d) return null;
  return (
    <nav aria-labelledby="town-siblings" className={`mx-auto max-w-[1280px] px-5 pb-16 pt-8 sm:px-10 sm:pb-24 ${className}`}>
      <BlockHead
        id="town-siblings"
        kicker={d.name}
        title={t("townInDistrict")}
        className="[&_h2]:!text-[24px] sm:[&_h2]:!text-[30px]"
      />
      <Reveal className="mt-6" y={16}>
        {wide ? (
          <SiblingPages data={data} />
        ) : (
          <ul className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 py-1">
            <li className="w-[44vw] shrink-0 snap-start">
              <DistrictTile data={data} />
            </li>
            {data.siblings.map((tw) => (
              <li key={tw.c.id} className="w-[60vw] shrink-0 snap-start">
                <TownTile tw={tw} />
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </nav>
  );
}
