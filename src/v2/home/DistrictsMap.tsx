import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { plain, useV2 } from "@/v2/i18n";
import { EASE, PillLink, SectionHead } from "@/v2/components/ui";
import { DISTRICT_SHAPES, MAP_H, MAP_W, projectLonLat } from "./districtShapes";
import { PrintPhoto } from "./districts/photos";
import { usePauseOffscreen } from "@/v2/lib/usePauseOffscreen";

const ODESA = projectLonLat(30.7233, 46.4825);

/**
 * Де стоять підписи районів (одиниці карти). Підібрано вручну й перевірено,
 * що підпис цілком усередині свого району; решта — з центрів контурів.
 */
const LABEL_POS: Record<string, [number, number]> = {
  "odeskyy-rayon": [428, 486],
  "izmayilskyy-rayon": [180, 778],
  "bilhorod-dnistrovskyy-rayon": [338, 632],
  "podilskyy-rayon": [288, 132],
  "bolhradskyy-rayon": [184, 650],
};

/** Коротка назва без слова «район» — для підписів на карті. */
const short = (name: string) => name.replace(/\s*(район|district)\s*$/i, "");

export function DistrictsMap() {
  const { t, tl, lang } = useV2();
  const reduce = useReducedMotion();
  const { data: snap } = useHierarchySnapshot();
  const { data: cards } = usePageContentCards("index");
  const pauseRef = usePauseOffscreen<HTMLElement>();
  // Наведення одразу обирає район і він лишається обраним (раніше після
  // відведення миші виділення поверталось на Одеський — виглядало, ніби той «залип»).
  const [active, setActive] = useState("odeskyy-rayon");
  const setHover = (slug: string) => setActive(slug);
  const current = active;

  const districts = useMemo(() => (snap?.districts ?? []).filter((d) => DISTRICT_SHAPES[d.slug]), [snap]);

  const stats = useMemo(() => {
    const m = new Map<string, { places: number; cities: number }>();
    for (const d of districts) m.set(d.id, { places: 0, cities: 0 });
    for (const c of snap?.cities ?? []) { const s = m.get(c.districtId); if (s) s.cities++; }
    for (const o of snap?.objects ?? []) { const s = m.get(o.districtId); if (s && o.published && o.type === "attraction") s.places++; }
    return m;
  }, [districts, snap]);

  const dots = useMemo(
    () =>
      (snap?.objects ?? [])
        .filter((o) => o.published && o.latitude && o.longitude)
        .map((o) => {
          const [x, y] = projectLonLat(o.longitude!, o.latitude!);
          return { id: o.id, x, y, district: districts.find((d) => d.id === o.districtId)?.slug };
        })
        .filter((p) => p.x > 0 && p.x < MAP_W && p.y > 0 && p.y < MAP_H),
    [snap, districts],
  );

  const d = districts.find((x) => x.slug === current);
  const image = d?.imageUrl || cards?.find((c) => c.sectionKey === "directions" && c.href?.endsWith(`/${current}`))?.imageUrl;
  const dCities = (snap?.cities ?? []).filter((c) => c.districtId === d?.id);
  const st = d ? stats.get(d.id) : undefined;

  return (
    <section ref={pauseRef} aria-labelledby="map-title" className="grain relative overflow-hidden bg-o-sand px-5 py-10 text-o-sea sm:px-10 sm:py-12">
      {/* Блок виділено як «аркуш карти»: пунктирні межі згори й знизу та сітка,
          що розчиняється до країв. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 border-t-[1.5px] border-dashed border-o-sea/25" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 border-b-[1.5px] border-dashed border-o-sea/25" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.11]"
        style={{
          backgroundImage: "linear-gradient(#002f5e 1px, transparent 1px), linear-gradient(90deg, #002f5e 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 100%)",
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, #000 40%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1280px]">
        <SectionHead id="map-title" inline kicker={t("mapKicker")} line1={t("mapTitle1")} line2={t("mapTitle2")} action={{ to: "/districts", label: t("allDistricts") }} />

        {/* Перемикач районів (зручно на мобільному та з клавіатури). */}
        <div className="no-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label={t("navDistricts")}>
          {districts.map((x) => (
            <button
              key={x.slug}
              type="button"
              role="tab"
              aria-selected={active === x.slug}
              onClick={() => setActive(x.slug)}
              onMouseEnter={() => setHover(x.slug)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                current === x.slug ? "bg-o-wine text-o-sand" : "bg-o-sea/[0.06] text-o-sea hover:bg-o-wine/10"
              }`}
            >
              {short(tl(x.name, x.nameEn))}
            </button>
          ))}
        </div>

        <div className="mt-6 grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          {/* Карта */}
          {/* Висота карти підлаштовується під екран, щоб увесь блок вміщався. */}
          <div className="relative mx-auto w-full" style={{ maxWidth: "min(400px, calc((100svh - 300px) * 0.7))" }}>
            <svg viewBox={`-10 -10 ${MAP_W + 20} ${MAP_H + 20}`} className="w-full overflow-visible" role="img" aria-label={lang === "en" ? "Map of Odesa Region districts" : "Карта районів Одеської області"}>
              <defs>
                <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="10" />
                </filter>
              </defs>
              {/* Роза вітрів у порожньому куті карти */}
              <g transform="translate(530 100) scale(1.35)" stroke="#002f5e" strokeOpacity="0.35" fill="none" aria-hidden="true">
                <circle r="34" strokeDasharray="2 4" />
                <circle r="22" />
                <path d="M0 -44 L5 -5 L0 0 L-5 -5 Z M0 44 L5 5 L0 0 L-5 5 Z" fill="#002f5e" fillOpacity="0.35" />
                <path d="M-44 0 L-5 -5 L0 0 L-5 5 Z M44 0 L5 -5 L0 0 L5 5 Z" />
                <text y="-50" textAnchor="middle" fontSize="12" fontWeight={700} fill="#002f5e" fillOpacity="0.45" stroke="none">{lang === "en" ? "N" : "Пн"}</text>
              </g>
              {/* Масштаб: 1° широти ≈ 111 км = 283,5 одиниці карти → 50 км ≈ 128 */}
              <g transform="translate(436 822)" aria-hidden="true">
                <path d="M0 0 H128 M0 -5 V5 M64 -3 V3 M128 -5 V5" stroke="#002f5e" strokeOpacity="0.5" strokeWidth="1.5" />
                <path d="M0 0 H64" stroke="#002f5e" strokeOpacity="0.5" strokeWidth="4" />
                <text x="0" y="24" fontSize="17" fill="#002f5e" fillOpacity="0.6">0</text>
                <text x="128" y="24" textAnchor="end" fontSize="17" fill="#002f5e" fillOpacity="0.6">50 {lang === "en" ? "km" : "км"}</text>
              </g>

              {/* Підписи води */}
              <text x={MAP_W - 30} y={MAP_H - 120} textAnchor="end" className="ital" fill="#002f5e" fillOpacity="0.35" fontSize="30">{t("blackSea")}</text>
              <text x={60} y={MAP_H + 12} className="ital" fill="#002f5e" fillOpacity="0.3" fontSize="22">{t("danube")}</text>

              {current && DISTRICT_SHAPES[current] && (
                <path d={DISTRICT_SHAPES[current].d} fill="#9f1f47" opacity="0.3" filter="url(#map-glow)" />
              )}

              {/* Райони — звичайні path (без анімаційної бібліотеки: вона «запам'ятовувала»
                  червону заливку, і Одеський лишався виділеним після зміни вибору). */}
              <motion.g
                initial={reduce ? false : { opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: 1 }}
              >
                {districts.map((x) => {
                  const on = current === x.slug;
                  return (
                    <path
                      key={x.slug}
                      d={DISTRICT_SHAPES[x.slug].d}
                      tabIndex={0}
                      role="button"
                      aria-label={tl(x.name, x.nameEn)}
                      aria-pressed={active === x.slug}
                      onMouseEnter={() => setHover(x.slug)}
                      onClick={() => setActive(x.slug)}
                      onFocus={() => setActive(x.slug)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActive(x.slug)}
                      fill={on ? "#9f1f47" : "rgba(0,47,94,0.05)"}
                      stroke={on ? "#fff2e8" : "rgba(0,47,94,0.45)"}
                      strokeWidth={on ? 2 : 1.2}
                      strokeLinejoin="round"
                      className="cursor-pointer outline-none transition-[fill,stroke] duration-300 focus-visible:stroke-o-sun"
                    />
                  );
                })}
              </motion.g>

              {/* Поява: контури «малюються», потім розчиняються в справжніх межах. */}
              {!reduce && (
                <g aria-hidden="true" className="pointer-events-none">
                  {districts.map((x, i) => (
                    <motion.path
                      key={x.slug}
                      d={DISTRICT_SHAPES[x.slug].d}
                      fill="none"
                      stroke="#002f5e"
                      strokeOpacity={0.6}
                      strokeWidth={1.2}
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 1 }}
                      whileInView={{ pathLength: 1, opacity: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ pathLength: { duration: 1.6, delay: i * 0.12, ease: "easeInOut" }, opacity: { duration: 0.5, delay: 1.8 + i * 0.12 } }}
                    />
                  ))}
                </g>
              )}

              {/* Точки місць із координатами */}
              <g aria-hidden="true">
                {dots.map((p) => (
                  <circle key={p.id} cx={p.x} cy={p.y} r={p.district === current ? 3.6 : 2.4} fill={p.district === current ? "#fff2e8" : "#002f5e"} fillOpacity={p.district === current ? 0.9 : 0.35} className="pointer-events-none transition-all duration-300" />
                ))}
              </g>

              {/* Підписи районів */}
              <g aria-hidden="true" className="pointer-events-none">
                {districts.map((x) => {
                  const [lx, ly] = LABEL_POS[x.slug] ?? [DISTRICT_SHAPES[x.slug].cx, DISTRICT_SHAPES[x.slug].cy];
                  const on = current === x.slug;
                  return (
                    <text key={x.slug} x={lx} y={ly} textAnchor="middle" fontSize="16" fontWeight={600} fill={on ? "#fff2e8" : "#002f5e"} fillOpacity={on ? 1 : 0.7} className="transition-all duration-300">
                      {/* Довгі назви («Білгород-Дністровський») — у два рядки. */}
                      {short(tl(x.name, x.nameEn)).split(/(?<=-)/).map((part, j, arr) => (
                        <tspan key={j} x={lx} dy={j === 0 ? (arr.length > 1 ? -8 : 0) : 18}>{part}</tspan>
                      ))}
                    </text>
                  );
                })}
              </g>

              {/* Одеса */}
              <g aria-hidden="true" className="pointer-events-none">
                <circle cx={ODESA[0]} cy={ODESA[1]} r="7" fill="#002f5e" className="ping-soft" style={{ transformOrigin: `${ODESA[0]}px ${ODESA[1]}px`, transformBox: "view-box" }} />
                <circle cx={ODESA[0]} cy={ODESA[1]} r="6" fill="#002f5e" stroke="#fff2e8" strokeWidth="2" />
                <text x={ODESA[0] + 12} y={ODESA[1] + 5} fontSize="16" fontWeight={700} fill="#002f5e" stroke="#fff2e8" strokeWidth={4} paintOrder="stroke" strokeLinejoin="round">{lang === "en" ? "Odesa" : "Одеса"}</text>
              </g>
            </svg>
          </div>

          {/* Опис активного району */}
          <div className="lg:min-h-[400px]" aria-live="polite">
            <AnimatePresence mode="wait">
              {d && (
                <motion.div
                  key={d.slug}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="grid gap-8 sm:grid-cols-[240px_1fr] sm:items-start"
                >
                  <PrintPhoto image={image} name={short(tl(d.name, d.nameEn))} lang={lang} />
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-o-wine">
                      {String(districts.findIndex((x) => x.slug === d.slug) + 1).padStart(2, "0")} / {String(districts.length).padStart(2, "0")}
                    </p>
                    <h3 className="mt-2 text-[28px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[32px]">{tl(d.name, d.nameEn)}</h3>
                    <p className="mt-4 line-clamp-4 text-[15px] leading-relaxed text-o-sea/70">{plain(tl(d.description, d.descriptionEn))}</p>
                    <div className="mt-5 flex gap-8">
                      <div><span className="block text-[26px] font-extrabold leading-none text-o-wine">{st?.places ?? 0}</span><span className="text-[14px] text-o-sea/60">{t("places")}</span></div>
                      <div><span className="block text-[26px] font-extrabold leading-none text-o-wine">{st?.cities ?? 0}</span><span className="text-[14px] text-o-sea/60">{t("settlements")}</span></div>
                    </div>

                      {dCities.length > 0 && (
                        <ul className="mt-6 flex flex-wrap gap-2">
                          {dCities.slice(0, 6).map((c) => (
                            <li key={c.id}>
                              <Link to={`/napryamky/${c.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-o-sea/20 px-3 py-1.5 text-[13px] transition-colors hover:border-o-wine hover:text-o-wine">
                                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />{tl(c.name, c.nameEn)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    <PillLink to={`/raion/${d.slug}`} tone="wine" className="mt-6">{t("openDistrict")}</PillLink>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
