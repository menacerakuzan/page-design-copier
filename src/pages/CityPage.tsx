import { useMemo, useRef, useState } from "react";
import { Img } from "@/components/Img";
import { motion } from "framer-motion";
import { useLang } from "@/lib/langContext";
import { ChevronLeft, Droplets, Wind } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useWeather } from "@/hooks/useWeather";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { makeDefaultConfig, PageSection } from "@/types/pages";
import { applyFilter } from "@/lib/pageSections";
import NotFound from "@/pages/NotFound";
import type { TourismObjectType } from "@/types/hierarchy";
import { GalleryVideoCard } from "@/components/GalleryVideoCard";
import { ReelVideo } from "@/components/ReelVideo";
import { HeroBackgroundVideo } from "@/components/HeroBackgroundVideo";
import { GalleryLightbox, type LightboxImage } from "@/components/GalleryLightbox";
import { DragScrollRow } from "@/components/DragScrollRow";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CollapsibleRichText } from "@/components/CollapsibleRichText";
import { AudioGuidePlayer } from "@/components/AudioGuidePlayer";
import { useSeo } from "@/hooks/useSeo";
import { ObjectSection, DEFAULT_BG } from "@/components/ObjectSection";
import { objectTypeColor } from "@/lib/entityLinks";

const NAVY = "#002f5e";
const GOLD = "#df9b3b";

// Заголовок блоку опису мав жорстко "Про місто" для будь-якого населеного
// пункту (шаблон DEFAULT_SECTIONS.city у types/pages.ts однаковий для всіх).
// Підміняємо на правильний варіант за типом населеного пункту — але тільки
// якщо заголовок і досі дефолтний "Про місто" (адмін міг вручну переписати
// його на щось своє через конструктор сторінки — таке не чіпаємо).
const DESCRIPTION_TITLE_BY_SETTLEMENT: Record<string, string> = {
  "місто": "Про місто",
  "село": "Про село",
  "селище": "Про селище",
  "селище міського типу": "Про селище",
};

const LABEL_SHORT: Record<TourismObjectType, string> = {
  attraction: "Туристичні об'єкти",
  event: "Події",
  hotel: "Готелі",
  restaurant: "Ресторани",
};

/** Легкий фоновий патерн (компас — тема районів/міст), тільки для кремових секцій. */
const SectionPattern = () => (
  <div
    aria-hidden
    className="pointer-events-none absolute inset-0 z-0"
    style={{ backgroundImage: "url(/districtspattern.svg)", backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.1 }}
  />
);

const CityPage = () => {
  const { t, tl, lang } = useLang();
  const { citySlug } = useParams<{ citySlug: string }>();
  const location = useLocation();
  // Якщо сюди прийшли не через сторінку району (напр. зі списку районів,
  // де місто без тур-об'єктів веде одразу на сторінку міста) — "назад" має
  // повертати туди, звідки прийшли, а не до прив'язаного району.
  const backOverride = location.state as { backTo?: string; backLabel?: string } | null;
  const { data: snapshot, isLoading } = useHierarchySnapshot();
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [reelMuted, setReelMuted] = useState(true);
  const [galleryLightbox, setGalleryLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  const city = useMemo(
    () => snapshot?.cities.find((c) => c.slug === citySlug),
    [snapshot, citySlug],
  );
  const allObjects = useMemo(
    () => (snapshot?.objects ?? []).filter((o) => o.cityId === city?.id && o.published),
    [snapshot, city],
  );
  const parentDistrict = useMemo(
    () => snapshot?.districts.find((d) => d.id === city?.districtId),
    [snapshot, city],
  );

  const { data: weather } = useWeather(city?.weatherCityName || null);
  const { config } = usePageConfig("city", city?.id ?? null);
  const pageKey = `city-${city?.id ?? ""}`;
  const { data: cardsData } = usePageContentCards(pageKey);
  const allCards = useMemo(() => (cardsData ?? []).filter(c => c.pageKey === pageKey), [cardsData, pageKey]);

  useSeo({
    title: city ? tl(city.name, city.nameEn) : t("districts"),
    description: city ? tl(city.subtitle, city.subtitleEn) : undefined,
    image: city?.imageUrl,
    lang,
    videoUrl: city?.reelUrl,
    breadcrumbs: city
      ? [
          { name: t("home"), path: "/" },
          { name: t("districts"), path: "/districts" },
          ...(parentDistrict ? [{ name: tl(parentDistrict.name, parentDistrict.nameEn), path: `/raion/${parentDistrict.slug}` }] : []),
          { name: tl(city.name, city.nameEn), path: `/napryamky/${city.slug}` },
        ]
      : undefined,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#001a3d] flex items-center justify-center">
      <div className="h-12 w-12 rounded-full border-4 border-[#fff2e8]/20 border-t-[#fff2e8]/80 animate-spin" />
    </div>
  );
  if (!city) return <NotFound />;

  const district = parentDistrict;
  const heroImage = city.imageUrl ?? "https://images.unsplash.com/photo-1464817739973-0128fe77aaa1?auto=format&fit=crop&w=2400&q=80";
  const heroVideo = city.videoUrl;

  const displayConfig = config ?? makeDefaultConfig("city", city.id);
  const activeSections = [...displayConfig.sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const setRef = (id: string) => (el: HTMLElement | null) => { refs.current[id] = el; };
  const goTo = (id: string) => refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scroll = (key: string, dir: 1 | -1) => scrollRefs.current[key]?.scrollBy({ left: dir * 380, behavior: "smooth" });

  // Derive quick-jump pills
  const jumpPills: { id: string; label: string; color: string }[] = [];
  for (const s of activeSections) {
    if (s.kind === "places_attraction") {
      if (applyFilter(allObjects.filter(o => o.type === "attraction"), s.filter).length > 0)
        jumpPills.push({ id: "attraction", label: LABEL_SHORT.attraction, color: objectTypeColor.attraction });
    } else if (s.kind === "places_event") {
      if (applyFilter(allObjects.filter(o => o.type === "event"), s.filter).length > 0)
        jumpPills.push({ id: "event", label: LABEL_SHORT.event, color: objectTypeColor.event });
    } else if (s.kind === "places_hotel") {
      if (applyFilter(allObjects.filter(o => o.type === "hotel"), s.filter).length > 0)
        jumpPills.push({ id: "hotel", label: LABEL_SHORT.hotel, color: objectTypeColor.hotel });
    } else if (s.kind === "places_restaurant") {
      if (applyFilter(allObjects.filter(o => o.type === "restaurant"), s.filter).length > 0)
        jumpPills.push({ id: "restaurant", label: LABEL_SHORT.restaurant, color: objectTypeColor.restaurant });
    }
  }

  // ─── section renderer ─────────────────────────────────────────────────────

  const renderSection = (section: PageSection) => {
    switch (section.kind) {

      case "description": {
        if (!city.description) return null;
        const bg = section.bgColor ?? "#fff2e8";
        return (
          <section key={section.id} className="relative overflow-hidden py-20" style={{ backgroundColor: bg }}>
            <SectionPattern />
            <div className="container-edge relative z-10">
              <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
                {city.reelUrl && (
                  <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}
                    className="w-full max-w-[320px] shrink-0 self-start mx-auto lg:mx-0">
                    <div className="relative overflow-hidden rounded-[24px] shadow-xl" style={{ aspectRatio: "9/16" }}>
                      <ReelVideo src={city.reelUrl} muted={reelMuted} onToggleMute={() => setReelMuted((m) => !m)} />
                    </div>
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }} className="flex-1">
                  <h2 className="font-odesa-medium text-[32px] leading-none text-[#002f5e] md:text-[56px]">
                    {section.title === "Про місто"
                      ? (DESCRIPTION_TITLE_BY_SETTLEMENT[city.settlementType ?? "місто"] ?? "Про місто")
                      : section.title}
                  </h2>
                  {section.subtitle && <p className="mt-3 text-[16px] font-odesa-regular text-[#002f5e]/70 md:text-[20px]">{section.subtitle}</p>}
                  {tl(city.audioUrl, city.audioUrlEn) && (
                    <div className="mt-6 max-w-[560px]">
                      <AudioGuidePlayer src={tl(city.audioUrl, city.audioUrlEn)} accent="#df9b3b" />
                    </div>
                  )}
                  <CollapsibleRichText
                    html={city.description}
                    bgColor={bg}
                    className="mt-6 text-[17px] leading-[1.6] font-odesa-regular text-[#002f5e]/75 article-content"
                  />
                  {city.detailedInfo && (
                    <div className="mt-6">
                      <CollapsibleRichText
                        html={city.detailedInfo}
                        bgColor={bg}
                        className="text-[15px] leading-[1.65] font-odesa-regular text-[#002f5e]/70 article-content"
                      />
                    </div>
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
        const type = section.kind.replace("places_", "") as TourismObjectType;
        const items = applyFilter(allObjects.filter((o) => o.type === type), section.filter);
        if (!items.length) return null;
        const bg = section.bgColor ?? DEFAULT_BG[type];
        return (
          <ObjectSection key={section.id} sectionId={type} title={section.title} subtitle={section.subtitle}
            items={items} bg={bg}
            setRef={setRef} scroll={scroll} scrollRefs={scrollRefs} />
        );
      }

      case "stat_strip": {
        const stats = (section.payload?.stats as string ?? "").split("\n").filter(Boolean)
          .map((line: string) => { const [val, lbl] = line.split("|").map((s: string) => s.trim()); return { val, lbl }; });
        if (!stats.length) return null;
        const bg = section.bgColor ?? NAVY;
        return (
          <section key={section.id} className="py-14" style={{ backgroundColor: bg }}>
            <div className="container-edge">
              {section.title && <h2 className="mb-2 font-odesa-medium text-[32px] leading-none text-[#fff2e8] md:text-[44px]">{section.title}</h2>}
              {section.subtitle && <p className="mb-6 text-[16px] font-odesa-regular text-[#fff2e8]/55">{section.subtitle}</p>}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                {stats.map(({ val, lbl }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm md:p-6">
                    <p className="font-odesa-medium text-[32px] leading-none md:text-[40px]" style={{ color: GOLD }}>{val}</p>
                    <p className="mt-2 text-[12px] font-odesa-regular uppercase tracking-widest text-[#fff2e8]/55">{lbl}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "quote": {
        const quote = (section.payload?.quote as string | undefined) ?? "";
        const author = (section.payload?.author as string | undefined) ?? "";
        if (!quote) return null;
        const bg = section.bgColor ?? "#fff2e8";
        return (
          <section key={section.id} className="relative overflow-hidden py-20" style={{ backgroundColor: bg }}>
            <SectionPattern />
            <div className="container-edge relative z-10 max-w-[860px] text-center">
              <motion.blockquote initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                <span className="block font-odesa-medium text-[56px] leading-none" style={{ color: GOLD }}>&ldquo;</span>
                <p className="mt-2 font-odesa-medium text-[24px] leading-[1.35] text-[#002f5e] md:text-[36px]">{quote}</p>
                {author && <footer className="mt-5 text-[14px] font-odesa-regular text-[#002f5e]/70">— {author}</footer>}
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
          <section key={section.id} className="relative overflow-hidden py-20" style={{ backgroundColor: bg }}>
            <SectionPattern />
            <div className="container-edge relative z-10">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                {section.title && <h2 className="mb-2 font-odesa-medium text-[32px] leading-none text-[#002f5e] md:text-[44px]">{section.title}</h2>}
                {section.subtitle && <p className="mb-4 text-[16px] font-odesa-regular text-[#002f5e]/70">{section.subtitle}</p>}
                <p className="text-[17px] leading-[1.6] font-odesa-regular text-[#002f5e]/80 md:text-[22px]">{text}</p>
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
          <section key={section.id} className="py-14" style={{ backgroundColor: bg }}>
            <div className="container-edge max-w-[1200px]">
              {section.title && <h2 className="mb-2 font-odesa-medium text-[32px] leading-none text-[#fff2e8] md:text-[44px]">{section.title}</h2>}
              {section.subtitle && <p className="mb-4 text-[16px] font-odesa-regular text-[#fff2e8]/55">{section.subtitle}</p>}
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
          <section key={section.id} className="relative overflow-hidden py-14" style={{ backgroundColor: bg }}>
            <SectionPattern />
            <div className="container-edge relative z-10">
              {section.title && <h2 className="mb-2 font-odesa-medium text-[32px] leading-none text-[#002f5e] md:text-[44px]">{section.title}</h2>}
              {section.subtitle && <p className="mb-4 text-[16px] font-odesa-regular text-[#002f5e]/70">{section.subtitle}</p>}
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
        const imageItems = items.filter((item) => !item.payload?.videoUrl && item.imageUrl);
        return (
          <section key={section.id} className="py-14" style={{ backgroundColor: bg }}>
            <div className="container-edge mb-6">
              {section.title && <h2 className="font-odesa-medium text-[34px] leading-none md:text-[56px]" style={{ color: textColor }}>{section.title}</h2>}
              {section.subtitle && <p className="mt-2 text-[16px] font-odesa-regular md:text-[20px]" style={{ color: `${textColor}99` }}>{section.subtitle}</p>}
            </div>
            <DragScrollRow hint className="flex gap-5 overflow-x-auto px-4 pb-4 md:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.imageUrl) return;
                      const idx = imageItems.findIndex((i) => i.id === item.id);
                      setGalleryLightbox({
                        images: imageItems.map((i) => ({ url: i.imageUrl as string, title: i.title || undefined })),
                        index: Math.max(0, idx),
                      });
                    }}
                    className="relative shrink-0 cursor-pointer overflow-hidden rounded-[22px]"
                    style={{ width: w, height: CARD_H, minHeight: 280 }}
                  >
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
            </DragScrollRow>
          </section>
        );
      }

      case "divider":
        return <div key={section.id} className="container-edge my-4 border-t border-[#002f5e]/8" />;

      default:
        return null;
    }
  };

  return (
    // key: перехід місто→місто без ремоунта лишає в hero фото попереднього
    // міста, доки вантажиться нове.
    <div key={city.id} className="bg-[#fff2e8] font-odesa-regular text-[#002f5e]">
     <main id="main-content" tabIndex={-1}>

      {/* ══════════════════  HERO  ══════════════════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden bg-[#001a3d]">
        {heroVideo ? (
          <HeroBackgroundVideo src={heroVideo} poster={heroImage} />
        ) : (
          <Img priority w={1600} src={heroImage} alt={city.name} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.28)_0%,rgba(0,12,33,0.0)_38%,rgba(0,12,33,0.9)_100%)]" />

        {/* ── Єдина шапка-«бровь»: назад + один breadcrumb + головна ─────── */}
        <div className="relative z-20 mx-auto w-full max-w-[1180px] px-4 pt-0 md:px-5">
          <div className="rounded-b-[36px] bg-[#fff2e8] px-5 pb-3 pt-3 text-[#002f5e] md:rounded-b-[48px] md:px-6 md:pb-4 md:pt-4">
            <div className="flex items-center gap-3">
              {backOverride?.backTo ? (
                <Link to={backOverride.backTo} className="flex shrink-0 items-center gap-1.5 text-[14px] font-odesa-medium transition-opacity hover:opacity-70">
                  <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">{backOverride.backLabel ?? t("back")}</span>
                </Link>
              ) : district ? (
                <Link to={`/raion/${district.slug}`} className="flex shrink-0 items-center gap-1.5 text-[14px] font-odesa-medium transition-opacity hover:opacity-70">
                  <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">{district.name}</span>
                </Link>
              ) : (
                <Link to="/" className="flex shrink-0 items-center gap-1.5 text-[14px] font-odesa-medium transition-opacity hover:opacity-70">
                  <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">{t("backHome")}</span>
                </Link>
              )}
              <div className="h-4 w-px shrink-0 bg-[#002f5e]/15" />
              <div className="min-w-0 flex-1">
                <Breadcrumbs crumbs={[
                  { label: "Одещина", href: "/" },
                  { label: t("districts"), href: "/districts" },
                  ...(district ? [{ label: district.name, href: `/raion/${district.slug}` }] : []),
                  { label: city.name },
                ]} />
              </div>
              <Link to="/" className="hidden shrink-0 text-[14px] font-odesa-medium transition-opacity hover:opacity-70 sm:inline">{t("home")}</Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col justify-end px-6 pb-24 text-[#fff2e8] md:px-14 md:pb-14">
          {/* weather widget — above the title */}
          {weather && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: 0.1 }}
              className="mb-7 inline-flex flex-wrap items-center gap-x-4 gap-y-2 self-start rounded-full border border-white/25 bg-white/12 px-5 py-3 backdrop-blur-md shadow-lg"
            >
              <Img w={500} src={`https://openweathermap.org/img/wn/${weather.icon}.png`} alt={weather.description} className="h-8 w-8" />
              <span className="text-[30px] font-odesa-medium leading-none">{Math.round(weather.temp)}°</span>
              <div className="hidden h-5 w-px bg-white/20 xs:block" />
              <div className="flex flex-col gap-0.5 text-[13px] font-odesa-regular text-[#fff2e8]/80">
                <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-sky-300" /> {weather.humidity}%</span>
                <span className="flex items-center gap-1"><Wind className="h-3 w-3 text-sky-200" /> {Math.round(weather.windSpeed)} м/с</span>
              </div>
              <div className="hidden h-5 w-px bg-white/20 xs:block" />
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
            className="font-odesa-medium text-[44px] leading-[0.95] [overflow-wrap:break-word] xs:text-[52px] md:text-[84px] md:leading-[0.92] lg:text-[96px]">
            {city.name}
          </motion.h1>
          {city.subtitle && (
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, delay: 0.06 }}
              className="mt-4 text-[16px] font-odesa-regular text-[#fff2e8]/75 md:text-[22px]">
              {city.subtitle}
            </motion.p>
          )}

          {jumpPills.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.45 }}
              className="mt-8 flex flex-wrap gap-3">
              {jumpPills.map((pill) => (
                <button key={pill.id} type="button" onClick={() => goTo(pill.id)}
                  className="rounded-full border px-5 py-2 text-[13px] font-odesa-medium text-[#fff2e8] backdrop-blur-md transition-all hover:brightness-125"
                  style={{ borderColor: `${pill.color}90`, backgroundColor: `${pill.color}40` }}>
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: pill.color }} />
                  {pill.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════  DYNAMIC SECTIONS  ══════════════════════════ */}
      <div className="pb-tabbar md:pb-0">
        {activeSections.map(renderSection)}
      </div>
     </main>

      <SiteFooter />

      <GalleryLightbox
        images={galleryLightbox?.images ?? []}
        index={galleryLightbox ? galleryLightbox.index : null}
        onClose={() => setGalleryLightbox(null)}
        onNavigate={(index) => setGalleryLightbox((cur) => (cur ? { ...cur, index } : cur))}
      />
    </div>
  );
};

export default CityPage;
