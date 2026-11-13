import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, MapPin } from "lucide-react";
import { Img } from "@/components/Img";
import { objectDetailPath } from "@/lib/entityLinks";
import { useV2 } from "@/v2/i18n";
import { Reveal } from "@/v2/components/ui";
import { usePlaceSnippet } from "@/v2/components/PlaceTile";
import { TripButton } from "@/v2/district/parts";
import { RouteLiveMap } from "./RouteLiveMap";
import { FoldedMap } from "@/v2/home/routes/parts";
import { Head, RouteDetails, RouteLinks, RouteHero, RouteLead, RoutePassport, RouteTags, SimilarRoutes, useLegText, useStopKind } from "./parts";
import type { RoutePageData, RouteStop } from "./useRoutePage";

/** Водні й пішохідні маршрути по автодорогах не прокладаємо. */
export const byRoads = (data: RoutePageData) => !/водн|стежк|water|trail/i.test(data.name);

/** Висота карти на ПК; список зупинок поруч — не вищий за неї. */
const PANE = "lg:h-[min(560px,calc(100vh-200px))]";

/**
 * «Розворот» (обраний власником) — як сторінка місця: фото на весь перший екран із
 * назвою й діями; нижче — опис і довідка; далі зупинки поруч із картою.
 * Карта стоїть на місці, а список зупинок має висоту карти й гортається сам
 * (коли навести на нього) — унизу м'який край, за яким решта зупинок.
 * Наведення на зупинку — карта перелітає до неї.
 */
export function RouteSpread({ data }: { data: RoutePageData }) {
  const { t } = useV2();
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <RouteHero data={data} />

      <SpreadAbout data={data} />

      {/* Зупинки + карта */}
      {data.stops.length > 0 && (
        <section aria-labelledby="stops" className="mx-auto max-w-[1280px] px-5 pt-16 sm:px-10 sm:pt-24">
          <Head kicker={t("rpStopsKicker")} title={t("rpStops")} id="stops" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-8">
            <div className={`lg:order-2 ${PANE}`}>
              <RouteLiveMap stops={data.stops} line={data.line} active={active} onPick={setActive} roads={byRoads(data)} className="h-[48vh] min-h-[320px] lg:h-full" />
            </div>
            <StopsPane data={data} active={active} setActive={setActive} />
          </div>
        </section>
      )}

      <SpreadDetails data={data} />

      <div className="pt-16 sm:pt-24">
        <SimilarRoutes data={data} />
      </div>
    </>
  );
}

/** «Про маршрут»: опис і типи ліворуч, довідка праворуч.  */
export function SpreadAbout({ data }: { data: RoutePageData }) {
  const { t } = useV2();
  return (
  <section aria-labelledby="about" className="mx-auto max-w-[1280px] px-5 pt-14 sm:px-10 sm:pt-20">
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
      <Reveal>
        <p id="about" className="mb-4 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
          <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
          {t("rpAbout")}
        </p>
        <RouteLead data={data} className="max-w-[760px]" />
        <RouteTags data={data} className="mt-6" />
      </Reveal>
      <Reveal delay={0.08} className="self-start rounded-[24px] bg-[#fffaf5] p-6 shadow-[0_20px_40px_-32px_rgba(0,10,30,0.55)] ring-1 ring-o-sea/[0.06]">
        <RoutePassport data={data} />
      </Reveal>
    </div>
  </section>
  );
}

/** «Детальніше про маршрут»: текст і відео ліворуч, праворуч — проста ілюстрація.  */
export function SpreadDetails({ data }: { data: RoutePageData }) {
  const { t } = useV2();
  return (
  <section aria-labelledby="details" className="mx-auto max-w-[1280px] px-5 pt-16 sm:px-10 sm:pt-24">
    {/* Заголовок — у лівій колонці, щоб ілюстрація стояла по центру всього блоку (заголовок + текст) */}
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
      <div className="min-w-0 max-w-[780px]">
        <Head kicker={t("rpAbout")} title={t("rpDetails")} id="details" className="mb-8" />
        {data.content ? <RouteDetails data={data} /> : <RouteLead data={data} />}
        <RouteVideo data={data} className="mt-10" />
        <RouteLinks data={data} className="mt-10" />
      </div>
      {/* Проста ілюстрація — складена паперова мапа з шляхом (як у блоці маршрутів на головній) */}
      <aside className="hidden -translate-y-6 self-center lg:block" aria-hidden="true">
        <FoldedMap tone="cream" className="mx-auto w-full max-w-[340px] -rotate-3 drop-shadow-[0_24px_30px_rgba(0,10,30,0.12)]" />
      </aside>
    </div>
  </section>
  );
}

/* ── Список зупинок поруч із картою ────────────────────────────────────── */

function StopsPane({ data, active, setActive }: { data: RoutePageData; active: number | null; setActive: (i: number | null) => void }) {
  const { lang } = useV2();
  const leg = useLegText();
  const box = useRef<HTMLOListElement>(null);
  const [edge, setEdge] = useState({ top: true, end: true });

  // Чи є що гортати вгору / вниз — від цього м'які краї й підказка «ще ↓»
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const check = () => setEdge({ top: el.scrollTop < 4, end: el.scrollTop + el.clientHeight >= el.scrollHeight - 4 });
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [data.stops.length]);

  const mask = `linear-gradient(180deg, ${edge.top ? "#000" : "transparent"} 0, #000 36px, #000 calc(100% - 56px), ${edge.end ? "#000" : "transparent"} 100%)`;

  return (
    <div className={`relative lg:order-1 ${PANE}`}>
      <ol
        ref={box}
        onMouseLeave={() => setActive(null)}
        // Запас усередині прокрутки, щоб тіні карток (особливо нижньої) не обрізались
        className="no-scrollbar lg:-mx-4 lg:h-full lg:overflow-y-auto lg:overscroll-contain lg:px-4 lg:pb-12 lg:pt-1"
        style={{ WebkitMaskImage: mask, maskImage: mask }}
      >
        {data.stops.map((s, i) => (
          <li key={s.o.id}>
            <StopCompact s={s} active={active === i} onActive={() => setActive(i)} />
            {i < data.stops.length - 1 && (
              <div className="relative h-11" aria-hidden={s.next == null}>
                <span className="absolute bottom-1 left-[67px] top-1 border-l-2 border-dotted border-o-wine/40 sm:left-[91px]" />
                {s.next != null && (
                  <span className="absolute left-[86px] top-1/2 -translate-y-1/2 rounded-full bg-o-sand px-2.5 py-0.5 text-[12px] font-semibold text-o-sea/55 ring-1 ring-o-sea/10 sm:left-[110px]">
                    {leg(s.next)}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ol>
      {!edge.end && (
        <button
          type="button"
          onClick={() => box.current?.scrollBy({ top: 220, behavior: "smooth" })}
          className="absolute -bottom-3 left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-o-wine px-3 py-1.5 text-[12px] font-semibold text-o-sand shadow-[0_8px_18px_-8px_rgba(159,31,71,0.8)] lg:inline-flex"
        >
          {lang === "en" ? "More stops" : "Ще зупинки"}
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Компактна картка зупинки: фото на всю висоту з номером, праворуч — що це, назва, опис, де. */
function StopCompact({ s, active, onActive }: { s: RouteStop; active: boolean; onActive: () => void }) {
  const snippet = usePlaceSnippet();
  const kind = useStopKind();
  return (
    <article
      onMouseEnter={onActive}
      onFocus={onActive}
      className={`group relative flex min-h-[128px] overflow-hidden rounded-[20px] bg-[#fffaf5] ring-1 transition-[box-shadow,transform] duration-300 ${
        active ? "shadow-[0_22px_40px_-22px_rgba(0,10,30,0.5)] ring-o-sea/[0.07]" : "shadow-[0_14px_28px_-24px_rgba(0,10,30,0.55)] ring-o-sea/[0.07]"
      }`}
    >
      <div className="relative w-[136px] shrink-0 overflow-hidden bg-o-sea/10 sm:w-[184px]">
        <Img src={s.o.imageUrl} w={320} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" />
        <span
          className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-o-sand text-[14px] font-bold text-o-wine shadow-[0_6px_14px_-6px_rgba(0,0,0,0.6)]"
        >
          {s.n}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center py-3.5 pl-4 pr-11">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-o-wine/80">{kind(s)}</p>
        <h3 className="mt-1 line-clamp-2 text-[15.5px] font-bold leading-snug">
          <Link to={objectDetailPath(s.o.type, s.o.slug)} className="transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-o-wine">
            {s.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-[1.4] text-o-sea/55">{snippet(s.o, s.name)}</p>
        {s.where && (
          <p className="mt-1.5 flex items-center gap-1 truncate text-[11.5px] font-medium text-o-sea/45">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{s.where}</span>
          </p>
        )}
      </div>
      <TripButton id={s.o.id} size="sm" className="absolute right-2.5 top-2.5" />
    </article>
  );
}

/* ── Права колонка «Детальніше» ────────────────────────────────────────── */

/** Відео маршруту (якщо є). */
function RouteVideo({ data, className = "" }: { data: RoutePageData; className?: string }) {
  const v = data.route?.videoUrl;
  if (!v) return null;
  const yt = /youtu\.?be/.test(v) ? v.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/") : null;
  return (
    <div className={`overflow-hidden rounded-[22px] bg-o-deep ${className}`}>
      {yt ? <iframe src={yt} title={data.name} className="aspect-video w-full border-0" allow="fullscreen" allowFullScreen /> : <video src={v} controls className="aspect-video w-full" />}
    </div>
  );
}
