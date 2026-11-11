import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Img } from "@/components/Img";
import { HeroBackgroundVideo } from "@/components/HeroBackgroundVideo";
import { objectDetailPath } from "@/lib/entityLinks";
import { useV2 } from "@/v2/i18n";
import { EASE, Reveal } from "@/v2/components/ui";
import { BlockHead, TripButton } from "@/v2/district/parts";
import type { Place } from "@/v2/district/useDistrictPage";
import {
  DetailsLink, Locator, PlacesGrid, SiblingTowns, TownAudio, TownCrumbs, TownReel, TownRoutes, TownSections, TownText,
  WeatherLine, placeKicker, useJumps, usePlaceText, useSubtitle, useTownType,
} from "./parts";
import type { TownPageData } from "./useTownPage";
import { TownEvents } from "./Events";

/** Скільки місць показувати розворотами; якщо більше — звичайна сітка з фільтром. */
const SPREADS_MAX = 5;

/**
 * Перший екран: фото (або відео) на весь екран із повільним наближенням.
 * Над назвою — тип пункту шрифтом ss02, під нею — підзаголовок, погода і
 * цифри-переходи до розділів. Так само, як на сторінці району, — пункт
 * відчувається її продовженням.
 */
function SpreadHero({ data }: { data: TownPageData }) {
  const { t } = useV2();
  const reduce = useReducedMotion();
  const c = data.c!;
  const type = useTownType(data);
  const subtitle = useSubtitle(data);
  const jumps = useJumps(data);

  return (
    <section className="relative h-[100svh] min-h-[560px] overflow-hidden bg-o-deep text-o-sand">
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 14, ease: "easeOut" }}
      >
        {c.videoUrl ? (
          <HeroBackgroundVideo src={c.videoUrl} poster={c.imageUrl} />
        ) : (
          <Img src={c.imageUrl} w={2200} priority alt="" className="h-full w-full object-cover" />
        )}
      </motion.div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(14,10,14,0.42) 0%, rgba(14,10,14,0) 24%, rgba(14,10,14,0) 40%, rgba(14,10,14,0.55) 70%, rgba(14,10,14,0.86) 100%)" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex h-full max-w-[1280px] flex-col justify-end px-5 pb-[calc(104px+env(safe-area-inset-bottom))] sm:px-10 lg:pb-12">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        >
          <TownCrumbs data={data} light className="[text-shadow:0_1px_8px_rgba(0,0,0,0.45)]" />
          <p className="ital mt-5 text-[22px] leading-none text-o-sunsoft sm:text-[28px]">{type}</p>
          <h1 className="mt-1 text-[46px] font-semibold leading-[0.98] tracking-[-0.025em] sm:text-[76px] lg:text-[92px]">{data.name}</h1>
          {subtitle && <p className="mt-3 max-w-[640px] text-[18px] font-medium leading-snug text-o-sand/90 sm:text-[22px]">{subtitle}</p>}

          <div className="mt-6 flex max-w-[860px] flex-wrap items-end justify-between gap-x-10 gap-y-4 border-t border-o-sand/25 pt-4 sm:mt-7 sm:pt-5">
            {jumps.length > 0 && (
              <nav aria-label={t("jumpTo")} className="flex flex-wrap gap-x-6 gap-y-3 sm:gap-x-10">
                {jumps.map((j) => (
                  <a key={j.href} href={j.href} className="group flex items-baseline gap-2">
                    <span className="text-[26px] font-bold leading-none tracking-[-0.02em] text-o-sunsoft sm:text-[32px]">{j.n}</span>
                    <span className="text-[13.5px] font-medium text-o-sand/80 transition-colors group-hover:text-o-sand sm:text-[15px]">{j.word}</span>
                    <ArrowDown className="hidden h-4 w-4 self-center text-o-sand/50 transition-transform group-hover:translate-y-0.5 group-hover:text-o-sand sm:block" aria-hidden="true" />
                  </a>
                ))}
              </nav>
            )}
            <WeatherLine w={data.weather} light />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/** Про пункт: текст (частина схована) і праворуч — район із точкою пункту. */
function SpreadAbout({ data, title }: { data: TownPageData; title: string }) {
  return (
    <section aria-label={title} className="mx-auto max-w-[1280px] px-5 py-12 sm:px-10 sm:py-16">
      <Reveal className="grid items-center gap-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-14">
        <div className="max-w-[720px]">
          <p className="mb-5 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
            <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
            {title}
          </p>
          <TownText data={data} clamp={6} textClass="text-[17.5px] leading-[1.7] sm:text-[19.5px]" />
          <TownAudio data={data} className="mt-8" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <TownReel data={data} className="w-[200px]" />
          <Locator data={data} className="w-[230px] sm:w-[270px]" />
        </div>
      </Reveal>
    </section>
  );
}

/**
 * Одне місце «розворотом»: велике фото на 7/12 і текст поруч; сторони
 * чергуються. Фото ледь зсувається при прокрутці (±40px) — глибина без
 * перехоплення скролу.
 */
function Spread({ p, flip }: { p: Place; flip: boolean }) {
  const { lang } = useV2();
  const reduce = useReducedMotion();
  const textOf = usePlaceText();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40]);
  const kicker = placeKicker(p, lang);
  const sub = p.o.subtitle && p.o.subtitle !== p.name ? p.o.subtitle : "";
  return (
    <article ref={ref} className="grid items-center gap-5 md:grid-cols-12 md:gap-10">
      <div className={`relative md:col-span-7 ${flip ? "md:order-2" : ""}`}>
        <motion.div style={{ y }} className="group relative overflow-hidden rounded-[22px] bg-o-sea/10 shadow-[0_30px_50px_-34px_rgba(0,10,30,0.7)]">
          <Link to={objectDetailPath(p.o.type, p.o.slug)} tabIndex={-1} aria-hidden="true">
            <Img src={p.o.imageUrl} w={1200} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04] md:aspect-[3/2]" />
          </Link>
          <TripButton id={p.o.id} className="absolute right-3 top-3" />
        </motion.div>
      </div>
      <Reveal className={`md:col-span-5 ${flip ? "md:order-1 md:text-right" : ""}`} y={20}>
        {kicker && <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-o-wine">{kicker}</p>}
        <h3 className="mt-2 text-[26px] font-bold leading-[1.08] tracking-[-0.015em] sm:text-[32px]">
          <Link to={objectDetailPath(p.o.type, p.o.slug)} className="transition-colors hover:text-o-wine">{p.name}</Link>
        </h3>
        {sub && <p className="ital mt-2 text-[17px] leading-snug text-o-sea/60">{sub}</p>}
        <p className={`mt-4 line-clamp-4 text-[15.5px] leading-[1.65] text-o-sea/75 ${flip ? "md:ml-auto" : ""} max-w-[460px]`}>{textOf(p)}</p>
        <DetailsLink p={p} className="mt-5" />
      </Reveal>
    </article>
  );
}

/**
 * Варіант 1 «Розворот»: продовження сторінки району на ступінь менше. Коли
 * місць небагато (до 5), кожне отримує власний розворот; коли багато —
 * компактна сітка з фільтром.
 */
export function VariantSpread({ data }: { data: TownPageData }) {
  const { t } = useV2();
  return (
    <>
      <SpreadHero data={data} />
      {/* Події — власним блоком перед маршрутами (не з конструктора) */}
      <TownSections
        data={data}
        skip={["places_event"]}
        about={(_, title) => <SpreadAbout data={data} title={title} />}
        attractions={(_, title, list) => (
          <section id="see-attraction" aria-labelledby="see-attraction-t" className="mx-auto max-w-[1280px] scroll-mt-24 px-5 py-10 sm:px-10 sm:py-14">
            <BlockHead id="see-attraction-t" kicker={t("seeTitle")} title={title} count={list.length} />
            {list.length <= SPREADS_MAX ? (
              <div className="mt-10 flex flex-col gap-14 sm:mt-14 sm:gap-24">
                {list.map((p, i) => (
                  <Spread key={p.o.id} p={p} flip={i % 2 === 1} />
                ))}
              </div>
            ) : (
              <PlacesGrid list={list} />
            )}
          </section>
        )}
      />
      <TownEvents data={data} />
      <TownRoutes data={data} />
      <SiblingTowns data={data} />
    </>
  );
}
