import { useMemo, useRef, useState } from "react";
import { Img } from "@/components/Img";
import { motion } from "framer-motion";
import { useLang } from "@/lib/langContext";
import { ArrowRight, ChevronLeft, ChevronRight, Droplets, MapPin, Wind, Volume2, VolumeX } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useWeather } from "@/hooks/useWeather";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { makeDefaultConfig, PageSection } from "@/types/pages";
import { applyFilter } from "@/lib/pageSections";
import NotFound from "@/pages/NotFound";
import type { TourismObject } from "@/types/hierarchy";
import { GalleryVideoCard } from "@/components/GalleryVideoCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const NAVY = "#002f5e";
const star = "✦";

const ROUTE: Record<string, string> = {
  attraction: "/mistse",
  event:      "/podiyi",
  hotel:      "/hoteli",
  restaurant: "/restorany",
};

const LABEL_SHORT: Record<string, string> = {
  attraction: "Тур об'єкти",
  event:      "Події",
  hotel:      "Готелі",
  restaurant: "Ресторани",
};

const SECTION_CAPTION: Record<string, string> = {
  attraction: "explore",
  event:      "afisha",
  hotel:      "stay",
  restaurant: "taste",
};

const TYPE_ACCENT: Record<string, string> = {
  attraction: "#df9b3b",
  event:      "#e8526a",
  hotel:      "#3ebfa0",
  restaurant: "#f07844",
};

const DEFAULT_BG: Record<string, string> = {
  attraction: "#001a3d",
  event:      "#3d0820",
  hotel:      "#062820",
  restaurant: "#2a1200",
};

const BADGE_COLOR: Record<string, string> = {
  attraction: "#6eafd4",
  event:      "#e8526a",
  hotel:      "#3ebfa0",
  restaurant: "#f07844",
};

// ─── filter helper ────────────────────────────────────────────────────────────

const CityPage = () => {
  const { t, tl } = useLang();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data: snapshot, isLoading } = useHierarchySnapshot();
  const refs       = useRef<Record<string, HTMLElement | null>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [reelMuted, setReelMuted] = useState(true);

  const city = useMemo(
    () => snapshot?.cities.find((c) => c.slug === citySlug),
    [snapshot, citySlug],
  );
  const allObjects = useMemo(
    () => (snapshot?.objects ?? []).filter((o) => o.cityId === city?.id && o.published),
    [snapshot, city],
  );

  const { data: weather } = useWeather(city?.weatherCityName || null);
  const { config } = usePageConfig("city", city?.id ?? null);
  const pageKey = `city-${city?.id ?? ""}`;
  const { data: cardsData } = usePageContentCards(pageKey);
  const allCards = useMemo(() => (cardsData ?? []).filter(c => c.pageKey === pageKey), [cardsData, pageKey]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#001a3d] flex items-center justify-center">
      <div className="h-12 w-12 rounded-full border-4 border-[#fff2e8]/20 border-t-[#fff2e8]/80 animate-spin" />
    </div>
  );
  if (!city) return <NotFound />;

  const district  = snapshot?.districts.find((d) => d.id === city.districtId);
  const heroImage = city.imageUrl ?? "https://images.unsplash.com/photo-1464817739973-0128fe77aaa1?auto=format&fit=crop&w=2400&q=80";
  const heroVideo = city.videoUrl;

  const displayConfig = config ?? makeDefaultConfig("city", city.id);
  const activeSections = [...displayConfig.sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const setRef = (id: string) => (el: HTMLElement | null) => { refs.current[id] = el; };
  const goTo   = (id: string) => refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scroll = (key: string, dir: 1 | -1) => scrollRefs.current[key]?.scrollBy({ left: dir * 380, behavior: "smooth" });

  // Derive quick-jump pills
  const jumpPills: { id: string; label: string; styleProps: React.CSSProperties }[] = [];
  for (const s of activeSections) {
    if (s.kind === "places_attraction") {
      if (applyFilter(allObjects.filter(o => o.type === "attraction"), s.filter).length > 0)
        jumpPills.push({ id: "attraction", label: LABEL_SHORT["attraction"], styleProps: { borderColor: "#6eafd460", color: "#6eafd4", backgroundColor: "#6eafd418" } });
    } else if (s.kind === "places_event") {
      if (applyFilter(allObjects.filter(o => o.type === "event"), s.filter).length > 0)
        jumpPills.push({ id: "event", label: LABEL_SHORT["event"], styleProps: { borderColor: `${TYPE_ACCENT["event"]}60`, color: TYPE_ACCENT["event"], backgroundColor: `${TYPE_ACCENT["event"]}18` } });
    } else if (s.kind === "places_hotel") {
      if (applyFilter(allObjects.filter(o => o.type === "hotel"), s.filter).length > 0)
        jumpPills.push({ id: "hotel", label: LABEL_SHORT["hotel"], styleProps: { borderColor: `${TYPE_ACCENT["hotel"]}60`, color: TYPE_ACCENT["hotel"], backgroundColor: `${TYPE_ACCENT["hotel"]}18` } });
    } else if (s.kind === "places_restaurant") {
      if (applyFilter(allObjects.filter(o => o.type === "restaurant"), s.filter).length > 0)
        jumpPills.push({ id: "restaurant", label: LABEL_SHORT["restaurant"], styleProps: { borderColor: `${TYPE_ACCENT["restaurant"]}60`, color: TYPE_ACCENT["restaurant"], backgroundColor: `${TYPE_ACCENT["restaurant"]}18` } });
    }
  }

  // ─── section renderer ─────────────────────────────────────────────────────

  const renderSection = (section: PageSection) => {
    switch (section.kind) {

      case "description": {
        if (!city.description) return null;
        const bg = section.bgColor ?? "#fff2e8";
        return (
          <section key={section.id} className="px-4 py-20 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[1400px]">
              <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
                {city.reelUrl && (
                  <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}
                    className="w-full max-w-[320px] shrink-0 self-start mx-auto lg:mx-0">
                    <div className="relative overflow-hidden rounded-[24px] shadow-xl" style={{ aspectRatio: "9/16" }}>
                      <video src={city.reelUrl} autoPlay muted={reelMuted} loop playsInline className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setReelMuted((m) => !m)}
                        className="absolute bottom-3 right-3 flex items-center justify-center rounded-full border border-white/30 bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70"
                        aria-label={reelMuted ? "Увімкнути звук" : "Вимкнути звук"}
                      >
                        {reelMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }} className="flex-1">
                  <h2 className="font-odesa-medium text-[44px] leading-none text-[#002f5e] md:text-[68px]">
                    {section.title}
                  </h2>
                  {section.subtitle && <p className="mt-3 text-[18px] font-odesa-regular text-[#002f5e]/60 md:text-[22px]">{section.subtitle}</p>}
                  <div className="mt-6 text-[20px] leading-[1.55] font-odesa-regular text-[#002f5e]/75 md:text-[26px] article-content"
                    dangerouslySetInnerHTML={{ __html: city.description.includes("&lt;") ? city.description.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&") : city.description }} />
                  {city.detailedInfo && (
                    <div className="mt-6 text-[17px] leading-[1.65] font-odesa-regular text-[#002f5e]/55 md:text-[20px] article-content"
                      dangerouslySetInnerHTML={{ __html: city.detailedInfo.includes("&lt;") ? city.detailedInfo.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&") : city.detailedInfo }} />
                  )}
                </motion.div>
              </div>
            </div>
          </section>
        );
      }

      case "places_attraction":
      case "places_event":
      case "places_hotel":
      case "places_restaurant": {
        const type = section.kind.replace("places_", "");
        const items = applyFilter(allObjects.filter((o) => o.type === type), section.filter);
        if (!items.length) return null;
        const bg = section.bgColor ?? DEFAULT_BG[type];
        return (
          <ObjectSection key={section.id} sectionId={type} title={section.title} subtitle={section.subtitle}
            caption={SECTION_CAPTION[type]} type={type} items={items} bg={bg}
            setRef={setRef} scroll={scroll} scrollRefs={scrollRefs} />
        );
      }

      case "stat_strip": {
        const stats = (section.payload?.stats as string ?? "").split("\n").filter(Boolean)
          .map((line: string) => { const [val, lbl] = line.split("|").map((s: string) => s.trim()); return { val, lbl }; });
        if (!stats.length) return null;
        const bg = section.bgColor ?? NAVY;
        return (
          <section key={section.id} className="px-4 py-14 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[1400px]">
              {section.title && <h2 className="mb-2 font-odesa-medium text-[40px] leading-none text-[#fff2e8]">{section.title}</h2>}
              {section.subtitle && <p className="mb-6 text-[17px] font-odesa-regular text-[#fff2e8]/55">{section.subtitle}</p>}
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {stats.map(({ val, lbl }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.22, delay: i * 0.03 }}
                    className="rounded-[24px] border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
                    <p className="font-odesa-medium text-[40px] leading-none text-[#fff2e8]">{val}</p>
                    <p className="mt-2 text-[13px] font-odesa-regular uppercase tracking-widest text-[#fff2e8]/55">{lbl}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "quote": {
        const quote  = (section.payload?.quote  as string | undefined) ?? "";
        const author = (section.payload?.author as string | undefined) ?? "";
        if (!quote) return null;
        const bg = section.bgColor ?? "#fff2e8";
        return (
          <section key={section.id} className="px-4 py-20 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[860px] text-center">
              <motion.blockquote initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                <p className="font-odesa-medium text-[28px] leading-[1.35] text-[#002f5e] md:text-[40px]">«{quote}»</p>
                {author && <footer className="mt-5 text-[15px] font-odesa-regular text-[#002f5e]/50">— {author}</footer>}
              </motion.blockquote>
            </div>
          </section>
        );
      }

      case "custom_text": {
        const text = (section.payload?.text as string | undefined) ?? "";
        if (!text) return null;
        const bg = section.bgColor ?? "#fff2e8";
        return (
          <section key={section.id} className="px-4 py-20 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[1400px]">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                {section.title && <h2 className="mb-2 font-odesa-medium text-[40px] leading-none text-[#002f5e]">{section.title}</h2>}
              {section.subtitle && <p className="mb-4 text-[17px] font-odesa-regular text-[#002f5e]/55">{section.subtitle}</p>}
                <p className="text-[20px] leading-[1.55] font-odesa-regular text-[#002f5e]/80 md:text-[26px]">{text}</p>
              </motion.div>
            </div>
          </section>
        );
      }

      case "video": {
        const videoUrl = (section.payload?.videoUrl as string | undefined) ?? "";
        if (!videoUrl) return null;
        const bg = section.bgColor ?? "#001a3d";
        return (
          <section key={section.id} className="px-4 py-14 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[1200px]">
              {section.title && <h2 className="mb-2 font-odesa-medium text-[40px] leading-none text-[#fff2e8]">{section.title}</h2>}
              {section.subtitle && <p className="mb-4 text-[17px] font-odesa-regular text-[#fff2e8]/55">{section.subtitle}</p>}
              <div className="overflow-hidden rounded-[28px]" style={{ aspectRatio: "16/9" }}>
                <iframe src={videoUrl} title={section.title} allow="autoplay; encrypted-media" allowFullScreen
                  className="h-full w-full border-0" />
              </div>
            </div>
          </section>
        );
      }

      case "map": {
        const embedUrl = (section.payload?.embedUrl as string | undefined) ?? "";
        if (!embedUrl) return null;
        const bg = section.bgColor ?? "#fff2e8";
        return (
          <section key={section.id} className="px-4 py-14 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[1400px]">
              {section.title && <h2 className="mb-2 font-odesa-medium text-[40px] leading-none text-[#002f5e]">{section.title}</h2>}
              {section.subtitle && <p className="mb-4 text-[17px] font-odesa-regular text-[#002f5e]/55">{section.subtitle}</p>}
              <div className="overflow-hidden rounded-[28px]" style={{ height: "480px" }}>
                <iframe src={embedUrl} title="Карта" loading="lazy" className="h-full w-full border-0" />
              </div>
            </div>
          </section>
        );
      }

      case "gallery": {
        const sectionKey = `gallery-${section.id}`;
        const items = allCards
          .filter((c) => c.sectionKey === sectionKey)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (!items.length) return null;
        const bg = section.bgColor ?? "#001a3d";
        const isDark = bg !== "#fff2e8" && bg !== "#ffffff" && bg !== "#f4f4f0" && bg !== "#ffdfc6";
        const textColor = isDark ? "#fff2e8" : "#002f5e";
        const CARD_H = "min(calc((100vh - 56px - 20px) / 2), 72vw)";
        const cardW = (colSpan: number) =>
          colSpan === 3 ? `calc(${CARD_H} * 3 + 40px)` : colSpan === 2 ? `calc(${CARD_H} * 2 + 20px)` : CARD_H;
        return (
          <section key={section.id} className="py-14" style={{ backgroundColor: bg }}>
            <div className="mx-auto mb-6 max-w-[1400px] px-4 md:px-10">
              {section.title && <h2 className="font-odesa-medium text-[44px] leading-none md:text-[64px]" style={{ color: textColor }}>{section.title}</h2>}
              {section.subtitle && <p className="mt-2 text-[18px] font-odesa-regular md:text-[22px]" style={{ color: `${textColor}99` }}>{section.subtitle}</p>}
            </div>
            <div className="flex gap-5 overflow-x-auto px-4 pb-4 md:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((item) => {
                const isVideo = !!item.payload?.videoUrl;
                const colSpan = (item.payload?.colSpan as number) ?? 1;
                const textSize = (item.payload?.textSize as string) ?? "md";
                const textSizeCls = textSize === "lg" ? "text-[28px]" : textSize === "sm" ? "text-[16px]" : "text-[20px]";
                const w = cardW(colSpan);
                if (isVideo) {
                  return (
                    <GalleryVideoCard
                      key={item.id}
                      src={item.payload!.videoUrl as string}
                      title={item.title || undefined}
                      textSizeCls={textSizeCls}
                      style={{ width: w, height: CARD_H }}
                    />
                  );
                }
                return (
                  <div key={item.id} className="relative shrink-0 overflow-hidden rounded-[22px]" style={{ width: w, height: CARD_H, minHeight: 280 }}>
                    {item.imageUrl ? (
                      <Img w={500} src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[#002f5e]/20" />
                    )}
                    {item.title && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                        <p className={`absolute bottom-5 left-5 right-5 font-odesa-medium leading-tight text-[#fff2e8] ${textSizeCls}`}>{item.title}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      }

      case "divider":
        return <div key={section.id} className="mx-auto my-4 max-w-[1400px] border-t border-[#002f5e]/8 px-4 md:px-10" />;

      default:
        return null;
    }
  };

  return (
    <div className="bg-[#fff2e8] font-odesa-regular text-[#002f5e]">

      {/* ══════════════════  HERO  ══════════════════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden">
        {heroVideo ? (
          <video src={heroVideo} autoPlay muted loop playsInline
            className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Img priority w={1600} src={heroImage} alt={city.name} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.28)_0%,rgba(0,12,33,0.0)_38%,rgba(0,12,33,0.9)_100%)]" />

        {/* top bar */}
        <div className="relative z-20 mx-auto w-full max-w-[1180px] px-4 pt-0 md:px-5">
          <div className="rounded-b-[48px] bg-[#fff2e8] px-6 pb-4 pt-4 text-[#002f5e]">
            <div className="flex items-center justify-between gap-4 text-[14px] font-odesa-medium">
              <div className="min-w-0 flex-1 sm:w-[160px] sm:flex-none">
                {district ? (
                  <Link to={`/raion/${district.slug}`} className="inline-flex max-w-full items-center gap-1.5 transition-opacity hover:opacity-70">
                    <ChevronLeft className="h-4 w-4 shrink-0" /> <span className="truncate">{district.name}</span>
                  </Link>
                ) : (
                  <Link to="/" className="inline-flex max-w-full items-center gap-1.5 transition-opacity hover:opacity-70">
                    <ChevronLeft className="h-4 w-4 shrink-0" /> <span className="truncate">{t("backHome")}</span>
                  </Link>
                )}
              </div>
              <div className="hidden items-center gap-3 text-[#002f5e]/65 sm:flex">
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>{city.settlementType ?? t("city")}</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>Одещина</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
              </div>
              <div className="flex shrink-0 justify-end pr-2 sm:w-[160px]">
                <Link to="/" className="transition-opacity hover:opacity-70">{t("home")}</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 px-6 pt-4 md:px-14">
          <Breadcrumbs light crumbs={[
            { label: "Одещина", href: "/" },
            { label: "Райони", href: "/districts" },
            ...(district ? [{ label: district.name, href: `/raion/${district.slug}` }] : []),
            { label: city.name },
          ]} />
        </div>

        <div className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col justify-end px-6 pb-24 text-[#fff2e8] md:px-14 md:pb-15">
          {/* weather widget — above the title */}
          {weather && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.1 }}
              className="mb-7 inline-flex items-center gap-4 self-start rounded-full border border-white/25 bg-white/12 px-5 py-3 backdrop-blur-md shadow-lg"
            >
              <Img w={500} src={`https://openweathermap.org/img/wn/${weather.icon}.png`} alt={weather.description} className="h-8 w-8" />
              <span className="text-[30px] font-odesa-medium leading-none">{Math.round(weather.temp)}°</span>
              <div className="h-5 w-px bg-white/20" />
              <div className="flex flex-col gap-0.5 text-[13px] font-odesa-regular text-[#fff2e8]/80">
                <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-sky-300" /> {weather.humidity}%</span>
                <span className="flex items-center gap-1"><Wind className="h-3 w-3 text-sky-200" /> {Math.round(weather.windSpeed)} м/с</span>
              </div>
              <div className="h-5 w-px bg-white/20" />
              <span className="text-[13px] font-odesa-regular capitalize text-[#fff2e8]/70">{weather.description}</span>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="mb-5">
            <span className="inline-block rounded-full border border-white/25 bg-white/10 px-5 py-2 text-[12px] uppercase tracking-[0.2em] font-odesa-medium text-[#fff2e8] backdrop-blur-md">
              {city.settlementType ?? "Місто"}
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-odesa-medium text-[40px] leading-[0.95] [overflow-wrap:anywhere] xs:text-[48px] md:text-[100px] md:leading-[0.92] lg:text-[118px]">
            {city.name}
          </motion.h1>
          {city.subtitle && (
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.06 }}
              className="mt-4 text-[17px] font-odesa-regular text-[#fff2e8]/75 md:text-[24px]">
              {city.subtitle}
            </motion.p>
          )}

          {jumpPills.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.45 }}
              className="mt-8 flex flex-wrap gap-3">
              {jumpPills.map((pill) => (
                <button key={pill.id} type="button" onClick={() => goTo(pill.id)}
                  className="rounded-full border px-5 py-2 text-[13px] font-odesa-medium backdrop-blur-md transition-all hover:brightness-125"
                  style={pill.styleProps}>
                  {pill.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════  DYNAMIC SECTIONS  ══════════════════════════ */}
      {activeSections.map(renderSection)}

      <SiteFooter />
    </div>
  );
};

// ─── Object section sub-component ────────────────────────────────────────────

const ObjectSection = ({
  sectionId, title, subtitle, caption, type, items, bg,
  setRef, scroll, scrollRefs,
}: {
  sectionId: string;
  title: string;
  subtitle?: string;
  caption: string;
  type: string;
  items: TourismObject[];
  bg: string;
  setRef: (id: string) => (el: HTMLElement | null) => void;
  scroll: (key: string, dir: 1 | -1) => void;
  scrollRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) => {
  const { t } = useLang();
  return (
  <section ref={setRef(sectionId)} className="scroll-mt-[52px] flex h-screen flex-col overflow-x-hidden px-4 py-14 md:px-10"
    style={{ background: `linear-gradient(160deg, transparent 0%, transparent 30%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.12) 72%, rgba(0,0,0,0.28) 82%, rgba(0,0,0,0.28) 90%, rgba(0,0,0,0.48) 100%), ${bg}` }}>
    <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7 }}
        className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] font-odesa-medium text-[#fff2e8]/30">{caption}</p>
          <h2 className="mt-1 font-odesa-medium text-[44px] leading-none text-[#fff2e8] md:text-[64px]">{title}</h2>
          {subtitle && <p className="mt-2 text-[17px] font-odesa-regular text-[#fff2e8]/55">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => scroll(sectionId, -1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-all hover:bg-white/20" aria-label="Назад">
            <ChevronLeft className="h-4 w-4 text-[#fff2e8]" /></button>
          <button type="button" onClick={() => scroll(sectionId, 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-all hover:bg-white/20" aria-label="Вперед">
            <ChevronRight className="h-4 w-4 text-[#fff2e8]" /></button>
        </div>
      </motion.div>
      <div ref={(el) => { scrollRefs.current[sectionId] = el; }}
        className="flex-1 snap-x snap-mandatory scroll-px-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex h-full gap-4 pb-2 pt-3 md:gap-5" style={{ width: "max-content" }}>
          {items.map((obj, idx) => (
            <motion.div key={obj.id} className="h-full snap-start"
              initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.22, delay: idx * 0.03 }}>
              <Link to={`${ROUTE[obj.type]}/${obj.slug}`}
                className="group block h-full w-[270px] overflow-hidden rounded-[26px] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_50px_-22px_rgba(0,0,0,0.65)] md:w-[310px]">
                <div className="relative h-full w-full overflow-hidden rounded-[26px]">
                  <Img w={500} src={obj.imageUrl ?? "https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=80"}
                    alt={obj.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${bg}f5 100%)` }} />
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest font-odesa-medium text-[#fff2e8] backdrop-blur-md"
                      style={{ backgroundColor: `${BADGE_COLOR[obj.type]}cc`, boxShadow: `0 0 12px ${BADGE_COLOR[obj.type]}55` }}>
                      {LABEL_SHORT[obj.type]}
                    </span>
                  </div>
                  <span className="absolute right-4 top-4 rounded-full bg-black/25 px-2.5 py-1 text-[12px] leading-none font-odesa-medium text-[#fff2e8]/85 backdrop-blur-md">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {/* нижня панель: адреса й кнопка розкриваються при наведенні */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="h-[3px] w-9 rounded-full transition-all duration-500 group-hover:w-16" style={{ backgroundColor: BADGE_COLOR[obj.type] }} />
                    <p className="mt-3 font-odesa-medium text-[21px] leading-[1.08] text-[#fff2e8] drop-shadow-md">{obj.name}</p>
                    {obj.subtitle && <p className="mt-1 text-[12px] font-odesa-regular text-[#fff2e8]/65 line-clamp-1">{obj.subtitle}</p>}
                    <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-h-[110px] group-hover:opacity-100">
                      {obj.address && (
                        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-odesa-regular text-[#fff2e8]/55">
                          <MapPin className="h-3 w-3 shrink-0" /> {obj.address}
                        </p>
                      )}
                      <span className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-odesa-medium text-[#001022]"
                        style={{ backgroundColor: BADGE_COLOR[obj.type] }}>
                        {t("details")} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
  );
};

export default CityPage;
