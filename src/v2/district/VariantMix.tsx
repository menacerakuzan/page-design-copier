import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import type { PageSection } from "@/types/pages";
import { Img } from "@/components/Img";
import { objectDetailPath } from "@/lib/entityLinks";
import { useV2 } from "@/v2/i18n";
import { EASE, Reveal } from "@/v2/components/ui";
import { DISTRICT_SHAPES, MAP_H, MAP_W, projectLonLat } from "@/v2/lib/districtShapes";
import { useDistricts } from "@/v2/districts/useDistricts";
import { plural } from "@/v2/districts/parts";
import {
  AboutText, BlockHead, Crumbs, DistrictTitle, ExtraSection, MoreButton, TripButton, TypeChips,
  placesFor, typeName, useMore, useSectionTitle, useTypeFilter,
} from "./parts";
import { PLACE_KIND, type DistrictPageData, type Place } from "./useDistrictPage";
import { MixTowns } from "./MixTowns";

/* ── Перший екран ──────────────────────────────────────────────────────── */

/**
 * Фото на весь екран із повільним наближенням. Затемнення нейтральне (не синє)
 * і лише там, де текст: трохи вгорі під шапкою й унизу під назвою.
 * Під назвою — «характер» району, а нижче — цифри, що водночас є переходами
 * до розділів (5 населених пунктів ↓ · 26 місць ↓ · 3 маршрути ↓).
 */
function MixHero({ data }: { data: DistrictPageData }) {
  const { t } = useV2();
  const reduce = useReducedMotion();
  const it = data.it!;
  const seeSection = data.sections.find((s) => s.kind === "places_attraction");
  const places = seeSection ? placesFor(data, "attraction", seeSection).length : data.placesByType.attraction?.length ?? 0;
  const jumps = [
    data.towns.length
      ? { href: "#towns", n: data.towns.length, word: plural(data.towns.length, t("settlementForms")), short: plural(data.towns.length, t("settlementShortForms")) }
      : null,
    places ? { href: "#see-attraction", n: places, word: plural(places, t("placeForms")) } : null,
    data.routes.length ? { href: "#routes", n: data.routes.length, word: plural(data.routes.length, t("routeForms")) } : null,
  ].filter(Boolean) as { href: string; n: number; word: string; short?: string }[];

  return (
    <section className="relative h-[100svh] min-h-[600px] overflow-hidden bg-o-deep text-o-sand">
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 14, ease: "easeOut" }}
      >
        <Img src={it.image} w={2200} priority alt="" className="h-full w-full object-cover" />
      </motion.div>
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(14,10,14,0.42) 0%, rgba(14,10,14,0) 24%, rgba(14,10,14,0) 42%, rgba(14,10,14,0.55) 70%, rgba(14,10,14,0.86) 100%)" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex h-full max-w-[1280px] flex-col justify-end px-5 pb-[calc(104px+env(safe-area-inset-bottom))] sm:px-10 lg:pb-12">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        >
          <Crumbs name={it.name} light className="[text-shadow:0_1px_8px_rgba(0,0,0,0.45)]" />
          <DistrictTitle name={it.name} accent="text-o-sand/85" className="mt-4 text-[48px] !font-semibold text-o-sand sm:text-[80px] lg:text-[100px]" />
          {it.tagline && (
            <p className="mt-3 max-w-[640px] text-[19px] font-medium leading-snug text-o-sand/90 sm:text-[24px]">{it.tagline}</p>
          )}
          {jumps.length > 0 && (
            <nav aria-label={t("jumpTo")} className="mt-6 flex max-w-[760px] flex-wrap gap-x-6 gap-y-3 border-t border-o-sand/25 pt-4 sm:mt-7 sm:gap-x-12 sm:pt-5">
              {jumps.map((j) => (
                <a key={j.href} href={j.href} className="group flex items-baseline gap-2">
                  <span className="text-[26px] font-bold leading-none tracking-[-0.02em] text-o-sunsoft sm:text-[34px]">{j.n}</span>
                  {/* На телефоні — коротше слово («5 пунктів»), щоб цифри стали в один рядок */}
                  <span className="text-[13.5px] font-medium text-o-sand/80 transition-colors group-hover:text-o-sand sm:text-[15px]">
                    {j.short ? (
                      <>
                        <span className="sm:hidden">{j.short}</span>
                        <span className="hidden sm:inline">{j.word}</span>
                      </>
                    ) : (
                      j.word
                    )}
                  </span>
                  <ArrowDown className="hidden h-4 w-4 self-center sm:block text-o-sand/50 transition-transform group-hover:translate-y-0.5 group-hover:text-o-sand" aria-hidden="true" />
                </a>
              ))}
            </nav>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ── Про район: текст + карта ──────────────────────────────────────────── */

/**
 * Карта області: цей район — винний, на ньому — точки місць; решта районів
 * ледь помітні, при наведенні показують назву, клік — на їхню сторінку.
 */
function DistrictMap({ data }: { data: DistrictPageData }) {
  const { t, lang } = useV2();
  const { onMap } = useDistricts();
  const navigate = useNavigate();
  const [hot, setHot] = useState<string | null>(null);
  const it = data.it!;

  // Точки місць — лише ті, що лежать у межах контуру (у частини місць у базі хибні координати).
  const dots = useMemo(() => {
    const shape = DISTRICT_SHAPES[it.slug];
    const ctx = shape && typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
    const area = shape ? new Path2D(shape.d) : null;
    return Object.values(data.placesByType)
      .flat()
      .filter((p) => p.o.latitude && p.o.longitude)
      .map((p) => ({ id: p.o.id, xy: projectLonLat(p.o.longitude!, p.o.latitude!) }))
      .filter((p) => !ctx || !area || ctx.isPointInPath(area, p.xy[0], p.xy[1]));
  }, [data.placesByType, it.slug]);

  if (!DISTRICT_SHAPES[it.slug]) return null;
  // Свій район малюємо останнім — щоб його світла межа була поверх сусідів.
  const shapes = [...onMap.filter((d) => d.slug !== it.slug), it];
  const other = onMap.find((d) => d.slug === hot && d.slug !== it.slug);

  return (
    <figure className="flex flex-col items-center">
      <svg
        viewBox={`-6 -6 ${MAP_W + 12} ${MAP_H + 12}`}
        className="h-[240px] w-auto overflow-visible sm:h-[300px] lg:h-[340px]"
        role="group"
        aria-label={lang === "en" ? "Map of Odesa Region districts" : "Карта районів Одеської області"}
        onMouseLeave={() => setHot(null)}
      >
        {shapes.map((d) => {
          const own = d.slug === it.slug;
          const on = hot === d.slug;
          const go = () => navigate(`/raion/${d.slug}`);
          return (
            <path
              key={d.slug}
              d={DISTRICT_SHAPES[d.slug].d}
              fill={own ? "#9f1f47" : on ? "rgba(159,31,71,0.16)" : "rgba(0,47,94,0.05)"}
              stroke={own ? "#fff2e8" : on ? "rgba(159,31,71,0.6)" : "rgba(0,47,94,0.3)"}
              strokeWidth={own ? 2.5 : 1.2}
              strokeLinejoin="round"
              {...(own
                ? { "aria-label": d.name }
                : {
                    role: "link",
                    tabIndex: 0,
                    "aria-label": `${t("onMapOther")}: ${d.name}`,
                    onMouseEnter: () => setHot(d.slug),
                    onFocus: () => setHot(d.slug),
                    onBlur: () => setHot(null),
                    onClick: go,
                    onKeyDown: (e: React.KeyboardEvent) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go()),
                    className: "cursor-pointer outline-none transition-[fill,stroke] duration-300 focus-visible:stroke-o-wine",
                  })}
            />
          );
        })}
        {dots.map((p) => (
          <circle key={p.id} cx={p.xy[0]} cy={p.xy[1]} r={4.5} fill="#fff2e8" stroke="#6e1131" strokeWidth={1} pointerEvents="none" />
        ))}
      </svg>
      {/* Підпис: за замовчуванням — «Район на карті», при наведенні на сусіда — його назва */}
      <figcaption className="mt-3 h-5 text-[13px] font-semibold text-o-sea/60" aria-live="polite">
        {other ? <span className="text-o-wine">{other.short} →</span> : t("onMapTitle")}
      </figcaption>
    </figure>
  );
}

function MixAbout({ data, title }: { data: DistrictPageData; title: string }) {
  const { t } = useV2();
  return (
    <section aria-label={title || t("aboutDistrict")} className="mx-auto max-w-[1280px] px-5 py-12 sm:px-10 sm:py-16">
      <Reveal className="grid items-center gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
        <div className="max-w-[720px]">
          <p className="mb-5 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
            <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
            {title || t("aboutDistrict")}
          </p>
          <AboutText it={data.it!} clamp={6} textClass="text-[17.5px] leading-[1.7] !text-o-sea/90 sm:text-[19.5px]" />
        </div>
        <DistrictMap data={data} />
      </Reveal>
    </section>
  );
}

/* ── Місця ─────────────────────────────────────────────────────────────── */

/**
 * Картка місця: кремова рамка, як у відбитка, але рівна — назву легко читати.
 * Фото 4:3 (нижче, ніж було), назва — до двох рядків, підпис — один рядок,
 * тож картки в ряду однакової висоти.
 */
function PlaceCard({ p }: { p: Place }) {
  const { lang } = useV2();
  const kind = p.o.tourismTypes?.[0];
  return (
    <article className="group relative flex h-full flex-col rounded-[14px] bg-[#fffaf5] p-1.5 shadow-[0_14px_30px_-22px_rgba(0,10,30,0.55)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_22px_38px_-22px_rgba(0,10,30,0.6)] sm:p-2">
      <div className="relative overflow-hidden rounded-[10px] bg-o-sea/10">
        <Img src={p.o.imageUrl} w={560} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
        <TripButton id={p.o.id} size="sm" className="absolute right-2 top-2" />
      </div>
      <h3 className="mt-2.5 line-clamp-2 px-1 text-[13.5px] font-bold leading-snug sm:text-[15px]">
        <Link to={objectDetailPath(p.o.type, p.o.slug)} className="transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-o-wine">
          {p.name}
        </Link>
      </h3>
      <p className="mt-auto truncate px-1 pb-1 pt-1 text-[12px] text-o-sea/55">
        {[p.town, kind && typeName(kind, lang)].filter(Boolean).join(" · ")}
      </p>
    </article>
  );
}

function MixPlaces({ data, s, title }: { data: DistrictPageData; s: PageSection; title: string }) {
  const { t } = useV2();
  const kind = PLACE_KIND[s.kind];
  const places = placesFor(data, kind, s);
  const { type, setType, types, list } = useTypeFilter(places);
  const more = useMore(list, 8);
  const shown = more.shown;
  if (!places.length) return null;
  return (
    <section id={`see-${kind}`} aria-labelledby={`see-${kind}-t`} className="mx-auto max-w-[1280px] scroll-mt-24 px-5 py-10 sm:px-10 sm:py-14">
      <BlockHead id={`see-${kind}-t`} kicker={kind === "attraction" ? t("seeTitle") : data.it!.short} title={title} count={places.length} />
      <div className="mt-6">
        <TypeChips types={types} value={type} onChange={setType} total={places.length} />
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {shown.map((p, i) => (
          <Reveal as="li" key={p.o.id} delay={(i % 4) * 0.05} y={18}>
            <PlaceCard p={p} />
          </Reveal>
        ))}
      </ul>
      <MoreButton more={more} anchor={`see-${kind}`} />
    </section>
  );
}

/**
 * «Мікс» — вигляд сторінки району (обраний). Перший екран — фото на весь екран із «характером» і
 * цифрами-переходами; опис — поруч із картою області; населені пункти —
 * розкладка фото (одне розкрите); місця — рівні компактні картки в рамці.
 */
export function VariantMix({ data }: { data: DistrictPageData }) {
  const { t } = useV2();
  const titleOf = useSectionTitle();
  return (
    <>
      <MixHero data={data} />
      {data.sections.map((s) => {
        const title = titleOf(s);
        if (s.kind === "description") return <MixAbout key={s.id} data={data} title={title} />;
        if (s.kind === "cities_list") return <MixTowns key={s.id} data={data} title={title || t("townsTitle")} />;
        if (PLACE_KIND[s.kind]) return <MixPlaces key={s.id} data={data} s={s} title={title} />;
        return <ExtraSection key={s.id} s={s} data={data} title={title} />;
      })}
    </>
  );
}
