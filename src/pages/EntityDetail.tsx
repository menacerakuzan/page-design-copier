import { useEffect, useMemo, useRef, useState } from "react";
import { Img } from "@/components/Img";
import { useLang } from "@/lib/langContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, Calendar, Check, CheckCircle2, ChevronLeft,
  Clock, Globe, MapPin, Navigation, Phone, Share2, ShoppingCart, Tag, Ticket, BookOpen, X,
} from "lucide-react";
import { GalleryVideoCard } from "@/components/GalleryVideoCard";
import { ReelVideo } from "@/components/ReelVideo";
import { HeroBackgroundVideo } from "@/components/HeroBackgroundVideo";
import { GalleryLightbox, type LightboxImage } from "@/components/GalleryLightbox";
import { DragScrollRow } from "@/components/DragScrollRow";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link, useParams } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { usePageConfig } from "@/hooks/usePageConfig";
import { makeDefaultConfig, PageSection } from "@/types/pages";
import { applyFilter } from "@/lib/pageSections";
import NotFound from "@/pages/NotFound";
import type { TourismObject, TourismObjectType } from "@/types/hierarchy";
import { getObjectCoords, haversineKm } from "@/lib/geo";
import { useBasket } from "@/lib/basketContext";
import { ObjectSection, DEFAULT_BG, SECTION_PATTERN } from "@/components/ObjectSection";
import { CollapsibleRichText } from "@/components/CollapsibleRichText";
import { AudioGuidePlayer } from "@/components/AudioGuidePlayer";
import { DistrictDiscoverMore } from "@/components/DistrictDiscoverMore";
import { useSeo } from "@/hooks/useSeo";
import { objectDetailPath, objectTypeColor } from "@/lib/entityLinks";
import { CompassRose } from "@/components/decor";

/* ── palette ─────────────────────────────────────────────────────── */
const BG   = "#fff2e8";
const NAVY = "#002f5e";
const GOLD = "#df9b3b";

const meta: Record<string, { label: string; schedBg: string }> = {
  attraction: { label: "Місце",    schedBg: "#001a3d" },
  event:      { label: "Подія",    schedBg: "#3d0820" },
  hotel:      { label: "Готель",   schedBg: "#062820" },
  restaurant: { label: "Ресторан", schedBg: "#2a1200" },
};

type PageType = "event" | "hotel" | "restaurant" | "attraction";

/** Легкий фоновий патерн (компас — тема мандрів), тільки для кремових секцій. */
const SectionPattern = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-0"
    style={{ backgroundImage: "url(/districtspattern.svg)", backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.1 }}
  />
);

function parseRepertoire(text: string): { date: string; title: string; time: string }[] {
  return text.split("\n").map(line => {
    const parts = line.split("—").map(s => s.trim());
    return { date: parts[0] ?? "", title: parts[1] ?? line.trim(), time: parts[2] ?? "" };
  }).filter(r => r.title);
}

const EntityDetail = ({ type }: { type: PageType }) => {
  const params = useParams();
  const slug   = params.slug ?? "";
  const pageKey = `detail-${type}-${slug}`;
  const refs       = useRef<Record<string, HTMLElement | null>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [reelMuted, setReelMuted] = useState(true);
  const [reelImageOpen, setReelImageOpen] = useState(false);
  const [reelVideoOpen, setReelVideoOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [galleryLightbox, setGalleryLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);
  const { data: snapshot, isLoading } = useHierarchySnapshot();
  const { data: cardsData } = usePageContentCards(pageKey);
  const m = meta[type];

  const object = useMemo(
    () => snapshot?.objects.find(o => o.slug === slug && o.type === type && o.published),
    [snapshot, slug, type],
  );

  const allObjects = useMemo(() => (snapshot?.objects ?? []).filter(o => o.published), [snapshot]);

  const cards = useMemo(
    () => (cardsData ?? []).filter(c => c.pageKey === pageKey),
    [cardsData, pageKey],
  );

  // Gallery cards use a different pageKey: "{type}-{id}" (set by AdminPageEditor)
  const galleryPageKey = object ? `${type}-${object.id}` : "";
  const { data: galleryCardsData } = usePageContentCards(galleryPageKey);
  const galleryCards = useMemo(
    () => (galleryCardsData ?? []).filter(c => c.pageKey === galleryPageKey),
    [galleryCardsData, galleryPageKey],
  );

  const { config } = usePageConfig(type, object?.id ?? null);
  const { tl, t, lang } = useLang();
  const { has: inBasket, toggle: toggleBasket } = useBasket();

  const objectCity = useMemo(() => snapshot?.cities.find(c => c.id === object?.cityId), [snapshot, object]);
  const objectDistrict = useMemo(() => snapshot?.districts.find(d => d.id === object?.districtId), [snapshot, object]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [slug]);

  const objectName = object ? tl(object.name, object.nameEn) : m.label;
  const objectDesc = object
    ? tl(object.subtitle, object.subtitleEn) || tl(object.description, object.descriptionEn).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
    : undefined;

  // Google формує "багаті" картки для туристичних об'єктів саме за такими
  // типами schema.org (адреса/координати прямо у видачі). Для готелю навмисно
  // узагальнений LodgingBusiness, а не строгий "Hotel" — той вимагає рейтинги/
  // ціни, яких у нас немає, і без них Google показав би помилку в GSC.
  const ENTITY_SCHEMA_TYPE: Record<PageType, string> = {
    attraction: "TouristAttraction",
    restaurant: "Restaurant",
    hotel: "LodgingBusiness",
    event: "TouristAttraction",
  };

  useSeo({
    title: objectName,
    description: objectDesc,
    image: object?.imageUrl,
    lang,
    videoUrl: object?.reelUrl,
    breadcrumbs: object
      ? [
          { name: t("home"), path: "/" },
          { name: t("districts"), path: "/districts" },
          ...(objectDistrict ? [{ name: tl(objectDistrict.name, objectDistrict.nameEn), path: `/raion/${objectDistrict.slug}` }] : []),
          ...(objectCity ? [{ name: tl(objectCity.name, objectCity.nameEn), path: `/napryamky/${objectCity.slug}` }] : []),
          { name: objectName, path: objectDetailPath(type, slug) },
        ]
      : undefined,
    entitySchema: object
      ? {
          "@type": ENTITY_SCHEMA_TYPE[type],
          name: objectName,
          description: objectDesc || objectName,
          image: object.imageUrl,
          url: `https://tourism.od.gov.ua${objectDetailPath(type, slug)}`,
          ...(object.address ? { address: { "@type": "PostalAddress", streetAddress: tl(object.address, object.addressEn), addressCountry: "UA" } } : {}),
          ...(object.phone ? { telephone: object.phone } : {}),
          ...(object.latitude != null && object.longitude != null
            ? { geo: { "@type": "GeoCoordinates", latitude: object.latitude, longitude: object.longitude } }
            : {}),
        }
      : undefined,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#001a3d] flex items-center justify-center">
      <div className="h-12 w-12 rounded-full border-4 border-[#fff2e8]/20 border-t-[#fff2e8]/80 animate-spin" />
    </div>
  );
  if (!object) return <NotFound />;

  const accent = objectTypeColor[type];
  const city     = objectCity;
  const district = objectDistrict;

  const heroCard     = cards.find(c => c.sectionKey === "hero");
  const overviewCard = cards.find(c => c.sectionKey === "overview");
  const infoCards    = cards.filter(c => c.sectionKey === "info").sort((a, b) => a.sortOrder - b.sortOrder);
  const contactCard  = cards.find(c => c.sectionKey === "contacts");

  const heroImage   = heroCard?.imageUrl ?? object.imageUrl ?? "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2400&q=80";
  const heroVideo   = (heroCard?.payload?.videoUrl as string | undefined) ?? object.videoUrl;
  const unescapeHtml = (s: string) =>
    s.includes("&lt;") ? s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"') : s;
  const description = unescapeHtml(String(overviewCard?.payload?.text ?? tl(object.description, object.descriptionEn) ?? `${tl(object.name, object.nameEn)} — унікальний об'єкт Одещини.`));
  const address     = String(contactCard?.payload?.address ?? tl(object.address, object.addressEn) ?? tl(city?.name, city?.nameEn) ?? "Одещина");
  const phone       = String(contactCard?.payload?.phone ?? object.phone ?? "");
  const website     = contactCard?.href ?? object.website ?? "";
  const mapUrl      = object.mapUrl ?? "";
  const hours       = tl(object.hours, object.hoursEn);
  const amenities   = tl(object.amenities, object.amenitiesEn);
  const tourismTypes= object.tourismTypes ?? [];
  const backTo      = city ? `/napryamky/${city.slug}` : district ? `/raion/${district.slug}` : "/";

  /* ── page config ──────────────────────────────────────────────── */
  const displayConfig = config ?? makeDefaultConfig(type, object.id);
  const activeSections = [...displayConfig.sections]
    .filter(s => s.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // find section by kind for bgColor/visibility lookups
  const findSection = (kind: string) => displayConfig.sections.find(s => s.kind === kind);
  const sectionVisible = (kind: string) => findSection(kind)?.visible ?? true;

  // schedule bg = first of hours/event_dates/amenities that has a bgColor, else meta default
  const schedBg = (() => {
    for (const k of ["hours", "event_dates", "amenities"]) {
      const s = findSection(k);
      if (s?.bgColor) return s.bgColor;
    }
    return m.schedBg;
  })();

  // related objects helper — geo-aware, 30 km radius max
  const GEO_RADIUS_KM = 30;
  const relatedByType = (relType: string, filter?: PageSection["filter"]) => {
    // admin-curated list: respect as-is
    if (filter?.entityIds?.length) return applyFilter(allObjects, filter);

    const candidates = allObjects.filter(o => o.type === relType && o.id !== object.id && o.published);
    const originCoords = getObjectCoords(object);

    if (originCoords) {
      // prefer geo: keep only objects within radius, sort by distance
      const withDist = candidates
        .map(o => ({ o, dist: (() => { const c = getObjectCoords(o); return c ? haversineKm(originCoords, c) : null; })() }))
        .filter((x): x is { o: TourismObject; dist: number } => x.dist !== null && x.dist <= GEO_RADIUS_KM)
        .sort((a, b) => a.dist - b.dist);

      if (withDist.length > 0) return applyFilter(withDist.map(x => x.o), filter);
    }

    // fallback: same city only (explicit truthy check avoids undefined === undefined)
    if (object.cityId) {
      const inCity = candidates.filter(o => o.cityId === object.cityId);
      if (inCity.length > 0) return applyFilter(inCity, filter);
    }

    return [];
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = tl(object.name, object.nameEn);
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch { /* користувач скасував */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* буфер недоступний */ }
  };

  const setRef   = (id: string) => (el: HTMLElement | null) => { refs.current[id] = el; };
  const scroll   = (key: string, dir: 1 | -1) => scrollRefs.current[key]?.scrollBy({ left: dir * 380, behavior: "smooth" });

  // Рілс — зліва від тексту опису (як на сторінці району), а не під карткою
  // контактів: вертикальне відео поруч із текстом читається природніше.
  const renderReel = () => {
    if (!object.reelUrl && !object.reelImageUrl) return null;
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}
        className="mx-auto w-full max-w-[280px] shrink-0 self-start lg:mx-0">
        <div className="relative overflow-hidden rounded-[24px] shadow-xl" style={{ aspectRatio: "9/16" }}>
          {object.reelImageUrl ? (
            <Img w={500}
              src={object.reelImageUrl}
              alt={object.name}
              onClick={() => setReelImageOpen(true)}
              className="h-full w-full object-cover cursor-zoom-in transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <ReelVideo
              src={object.reelUrl!}
              muted={reelMuted}
              onToggleMute={() => setReelMuted((mutedVal) => !mutedVal)}
              onExpand={() => setReelVideoOpen(true)}
            />
          )}
        </div>
      </motion.div>
    );
  };

  /* ── section renderer ─────────────────────────────────────────── */
  const renderSection = (section: PageSection) => {
    switch (section.kind) {

      // ── description (about block) ─────────────────────────────
      case "description": {
        const bg = section.bgColor ?? BG;
        const textColor = section.textColor ?? NAVY;
        const showContacts = sectionVisible("contact_info");
        return (
          <section key={section.id} ref={setRef("about")}
            className="relative scroll-mt-6 overflow-hidden px-4 py-20 md:px-10" style={{ backgroundColor: bg }}>
            <SectionPattern />
            <div className="relative z-10 mx-auto max-w-[1400px]">
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                <p className="text-[12px] uppercase tracking-[0.25em] font-odesa-medium" style={{ color: accent }}>{m.label}</p>
                <h2 className="mt-2 text-[44px] leading-none font-odesa-medium md:text-[64px]" style={{ color: textColor }}>
                  {type === "event" ? "Про подію" : type === "hotel" ? "Про готель" : type === "restaurant" ? "Про ресторан" : "Про місце"}
                </h2>
              </motion.div>
              {tl(object.audioUrl, object.audioUrlEn) && (
                <div className="mt-8 max-w-[720px]">
                  <AudioGuidePlayer src={tl(object.audioUrl, object.audioUrlEn)} accent={accent} />
                </div>
              )}
              <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
                <div className="flex min-w-0 flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
                {renderReel()}
                <motion.div className="min-w-0 flex-1" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.05 }}>
                  <CollapsibleRichText
                    html={description}
                    bgColor={bg}
                    collapsedMaxHeightPx={420}
                    className="text-[20px] leading-[1.55] font-odesa-regular md:text-[28px] article-content"
                  />
                  {(object.detailedInfo || object.detailedInfoEn) && (
                    <div className="mt-6">
                      <CollapsibleRichText
                        html={tl(object.detailedInfo, object.detailedInfoEn)}
                        bgColor={bg}
                        collapsedMaxHeightPx={160}
                        className="text-[17px] leading-[1.65] font-odesa-regular md:text-[20px] article-content"
                      />
                    </div>
                  )}
                  {object.venueId && (() => {
                    const venue = snapshot?.objects.find(o => o.id === object.venueId && o.published);
                    if (!venue) return null;
                    return (
                      <div className="mt-6 flex items-center gap-2 text-[15px] font-odesa-regular" style={{ color: `${textColor}99` }}>
                        <MapPin className="h-4 w-4 shrink-0" style={{ color: accent }} />
                        <span>Локація:</span>
                        <Link to={objectDetailPath(venue.type, venue.slug)}
                          className="font-odesa-medium underline underline-offset-2 transition-opacity hover:opacity-70"
                          style={{ color: accent }}>
                          {tl(venue.name, venue.nameEn)}
                        </Link>
                      </div>
                    );
                  })()}
                  {tourismTypes.length > 0 && (
                    <div className="mt-8 flex flex-wrap gap-2">
                      {tourismTypes.map(tt => (
                        <span key={tt} className="rounded-full border px-4 py-1.5 text-[14px] font-odesa-medium"
                          style={{ borderColor: `${accent}60`, color: accent, backgroundColor: `${accent}18` }}>{tt}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
                </div>
                {showContacts && (
                  <motion.aside ref={setRef("contacts")}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.65, delay: 0.1 }}
                    className="order-first scroll-mt-6 space-y-4 lg:order-none lg:sticky lg:top-6 lg:self-start">
                    <ContactCard
                      name={tl(object.name, object.nameEn)}
                      address={address} hours={hours} eventDates={object.eventDates}
                      phone={phone} website={website} mapUrl={mapUrl} accent={accent}
                      inBasket={inBasket(object.id)} onToggleBasket={() => toggleBasket(object.id)}
                      onShare={handleShare} linkCopied={linkCopied} t={t}
                      cityLink={city ? { slug: city.slug, name: city.name } : undefined}
                    />
                  </motion.aside>
                )}
              </div>
            </div>
          </section>
        );
      }

      // ── contact_info standalone ───────────────────────────────
      case "contact_info": {
        // When contact_info comes AFTER description, skip it (already rendered in sidebar)
        const descIdx = activeSections.findIndex(s => s.kind === "description");
        const contIdx = activeSections.findIndex(s => s.id === section.id);
        if (descIdx !== -1 && descIdx < contIdx) return null;
        const bg = section.bgColor ?? BG;
        return (
          <section key={section.id} ref={setRef("contacts")}
            className="relative scroll-mt-6 overflow-hidden px-4 py-14 md:px-10" style={{ backgroundColor: bg }}>
            <SectionPattern />
            <div className="relative z-10 mx-auto max-w-[600px]">
              <ContactCard
                name={section.title || tl(object.name, object.nameEn)}
                address={address} hours={hours} eventDates={object.eventDates}
                phone={phone} website={website} mapUrl={mapUrl} accent={accent}
                inBasket={inBasket(object.id)} onToggleBasket={() => toggleBasket(object.id)}
                onShare={handleShare} linkCopied={linkCopied} t={t}
                cityLink={city ? { slug: city.slug, name: city.name } : undefined}
              />
            </div>
          </section>
        );
      }

      // ── hours ──────────────────────────────────────────────────
      case "hours": {
        if (!hours && infoCards.length === 0) return null;
        const bg = section.bgColor ?? schedBg;
        return (
          <section key={section.id} ref={setRef("schedule")}
            className="relative scroll-mt-6 overflow-hidden px-4 py-20 text-[#fff2e8] md:px-10"
            style={{ background: `linear-gradient(160deg, transparent 0%, transparent 30%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.12) 72%, rgba(0,0,0,0.28) 82%, rgba(0,0,0,0.28) 90%, rgba(0,0,0,0.48) 100%), ${bg}` }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0"
              style={{ backgroundImage: `url(${SECTION_PATTERN[type]})`, backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.08 }} />
            <div className="relative z-10 mx-auto max-w-[1400px]">
              <ScheduleHeader type={type} accent={accent} />
              <div className="mt-10 flex flex-col items-center gap-6">
                {hours && (
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }}
                    className="flex w-full max-w-[520px] items-center gap-5 rounded-[28px] border p-7"
                    style={{ borderColor: `${accent}35`, backgroundColor: `${accent}14` }}>
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${accent}25` }}>
                      <Clock className="h-7 w-7" style={{ color: accent }} />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest font-odesa-medium" style={{ color: `${accent}bb` }}>Години роботи</p>
                      <p className="mt-1 text-[19px] font-odesa-medium leading-[1.3] text-[#fff2e8]">{hours}</p>
                    </div>
                  </motion.div>
                )}
                {infoCards.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-3">
                    {infoCards.map(card => (
                      <InfoChip key={card.id} icon={<Tag className="h-4 w-4" />} label={card.subtitle ?? ""} value={card.title} accent={accent} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      }

      // ── event_dates ────────────────────────────────────────────
      case "event_dates": {
        if (!object.eventDates && infoCards.length === 0 && !object.repertoire) return null;
        const bg = section.bgColor ?? schedBg;
        return (
          <section key={section.id} ref={setRef("schedule")}
            className="relative scroll-mt-6 overflow-hidden px-4 py-20 text-[#fff2e8] md:px-10"
            style={{ background: `linear-gradient(160deg, transparent 0%, transparent 30%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.12) 72%, rgba(0,0,0,0.28) 82%, rgba(0,0,0,0.28) 90%, rgba(0,0,0,0.48) 100%), ${bg}` }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0"
              style={{ backgroundImage: `url(${SECTION_PATTERN[type]})`, backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.08 }} />
            <div className="relative z-10 mx-auto max-w-[1400px]">
              <ScheduleHeader type={type} accent={accent} />
              <div className="mt-10 flex flex-col items-center gap-6">
                {object.eventDates && (
                  <div className="relative mx-auto w-full max-w-[420px]">
                    <div className="absolute left-0 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: bg }} aria-hidden="true" />
                    <div className="absolute right-0 top-1/2 h-6 w-6 translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: bg }} aria-hidden="true" />
                    <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }}
                      className="flex items-center justify-center gap-3 rounded-[24px] border-2 border-dashed px-8 py-7 text-center"
                      style={{ borderColor: `${accent}55`, backgroundColor: `${accent}14` }}>
                      <Calendar className="h-6 w-6 shrink-0" style={{ color: accent }} />
                      <p className="text-[18px] font-odesa-medium leading-[1.3] text-[#fff2e8]">{object.eventDates}</p>
                    </motion.div>
                  </div>
                )}
                {infoCards.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-3">
                    {infoCards.map(card => (
                      <InfoChip key={card.id} icon={<Tag className="h-4 w-4" />} label={card.subtitle ?? ""} value={card.title} accent={accent} />
                    ))}
                  </div>
                )}
              </div>
              {object.repertoire && (
                <div className="mt-14">
                  <h3 className="mb-5 text-center font-odesa-medium text-[28px]" style={{ color: accent }}>Репертуар</h3>
                  <div className="mx-auto flex max-w-[700px] flex-col gap-2">
                    {parseRepertoire(object.repertoire).map((r, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-[14px] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                        {r.date && (
                          <span className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-odesa-medium text-white" style={{ backgroundColor: accent }}>
                            {r.date}
                          </span>
                        )}
                        <span className="flex-1 font-odesa-medium text-[15px] text-[#fff2e8]">{r.title}</span>
                        {r.time && (
                          <span className="shrink-0 text-[13px] font-odesa-regular text-[#fff2e8]/60">{r.time}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      }

      // ── amenities ─────────────────────────────────────────────
      case "amenities": {
        if (!amenities && infoCards.length === 0) return null;
        const bg = section.bgColor ?? schedBg;
        return (
          <section key={section.id} ref={setRef("schedule")}
            className="relative scroll-mt-6 overflow-hidden px-4 py-20 text-[#fff2e8] md:px-10"
            style={{ background: `linear-gradient(160deg, transparent 0%, transparent 30%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.12) 72%, rgba(0,0,0,0.28) 82%, rgba(0,0,0,0.28) 90%, rgba(0,0,0,0.48) 100%), ${bg}` }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0"
              style={{ backgroundImage: `url(${SECTION_PATTERN[type]})`, backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.08 }} />
            <div className="relative z-10 mx-auto max-w-[1400px]">
              <ScheduleHeader type={type} accent={accent} />
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {amenities && amenities.split(",").map((a, i) => (
                  <motion.span key={a.trim()} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.4, delay: i * 0.03 }}
                    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-odesa-medium text-[#fff2e8]"
                    style={{ borderColor: `${accent}35`, backgroundColor: `${accent}14` }}>
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: accent }} /> {a.trim()}
                  </motion.span>
                ))}
                {infoCards.map(card => (
                  <InfoChip key={card.id} icon={<Tag className="h-4 w-4" />} label={card.subtitle ?? ""} value={card.title} accent={accent} />
                ))}
              </div>
            </div>
          </section>
        );
      }

      // ── ticket_info ────────────────────────────────────────────
      case "ticket_info": {
        const ticketUrl = (section.payload?.ticketUrl as string | undefined) ?? "";
        const ticketText = (section.payload?.text as string | undefined) ?? "";
        if (!ticketUrl && !ticketText) return null;
        const eventColor = objectTypeColor.event;
        const bg = section.bgColor ?? DEFAULT_BG.event;
        return (
          <section key={section.id} className="relative overflow-hidden px-4 py-16 md:px-10" style={{ backgroundColor: bg }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0"
              style={{ backgroundImage: `url(${SECTION_PATTERN.event})`, backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.08 }} />
            <div className="relative z-10 mx-auto max-w-[520px]">
              <div className="absolute left-0 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: bg }} aria-hidden="true" />
              <div className="absolute right-0 top-1/2 h-7 w-7 translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: bg }} aria-hidden="true" />
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}
                className="rounded-[28px] border-2 border-dashed px-8 py-10 text-center"
                style={{ borderColor: `${eventColor}55`, backgroundColor: `${eventColor}14` }}>
                <Ticket className="mx-auto mb-4 h-10 w-10" style={{ color: eventColor }} />
                <h2 className="font-odesa-medium text-[36px] leading-none text-[#fff2e8]">{section.title}</h2>
                {ticketText && <p className="mt-4 text-[17px] font-odesa-regular text-[#fff2e8]/70">{ticketText}</p>}
                {ticketUrl && (
                  <a href={ticketUrl} target="_blank" rel="noreferrer"
                    className="mt-7 inline-flex items-center gap-2 rounded-full px-8 py-3 text-[16px] font-odesa-medium text-[#fff2e8] transition-opacity hover:opacity-90"
                    style={{ backgroundColor: eventColor }}>
                    Купити квитки <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </motion.div>
            </div>
          </section>
        );
      }

      // ── menu_link ──────────────────────────────────────────────
      case "menu_link": {
        const menuUrl = (section.payload?.menuUrl as string | undefined) ?? "";
        if (!menuUrl) return null;
        const restaurantColor = objectTypeColor.restaurant;
        const bg = section.bgColor ?? "#fff2e8";
        return (
          <section key={section.id} className="px-4 py-12 md:px-10" style={{ backgroundColor: bg }}>
            <div className="container-edge">
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.6 }}
                className="mx-auto flex max-w-[700px] items-stretch overflow-hidden rounded-[24px] border bg-white/80 backdrop-blur-sm"
                style={{ borderColor: `${restaurantColor}30` }}>
                <div className="w-1.5 shrink-0" style={{ backgroundColor: restaurantColor }} />
                <div className="flex flex-1 flex-wrap items-center justify-between gap-4 px-6 py-6 sm:px-8">
                  <div className="flex items-center gap-4">
                    <BookOpen className="h-8 w-8 shrink-0" style={{ color: restaurantColor }} />
                    <div>
                      <p className="font-odesa-medium text-[20px] text-[#002f5e]">{section.title}</p>
                      {section.subtitle && <p className="text-[14px] font-odesa-regular text-[#002f5e]/70">{section.subtitle}</p>}
                    </div>
                  </div>
                  <a href={menuUrl} target="_blank" rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-odesa-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: restaurantColor }}>
                    Переглянути <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </motion.div>
            </div>
          </section>
        );
      }

      // ── map ────────────────────────────────────────────────────
      case "map": {
        const rawUrl = (section.payload?.embedUrl as string | undefined) ?? "";
        if (!rawUrl) return null;

        // Extract lat/lng from any Google Maps URL format
        const extractCoords = (url: string): [string, string] | null => {
          // @lat,lng,zoom format
          const at = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (at) return [at[1], at[2]];
          // ?q=lat,lng format
          const q = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (q) return [q[1], q[2]];
          // ll=lat,lng format
          const ll = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (ll) return [ll[1], ll[2]];
          return null;
        };

        let embedUrl = rawUrl;
        let isOsm = false;
        let noCoords = false;

        if (rawUrl.includes("google.com/maps") && !rawUrl.includes("/maps/embed")) {
          const coords = extractCoords(rawUrl);
          if (coords) {
            const [lat, lng] = coords;
            embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${+lng - 0.01},${+lat - 0.007},${+lng + 0.01},${+lat + 0.007}&layer=mapnik&marker=${lat},${lng}`;
            isOsm = true;
          } else {
            noCoords = true;
          }
        }

        const bg = section.bgColor ?? BG;
        const titleColor = bg === BG || bg === "#fff2e8" ? NAVY : "#fff2e8";
        return (
          <section key={section.id} className="px-4 py-14 md:px-10" style={{ backgroundColor: bg }}>
            <div className="container-edge">
              {section.title && <h2 className="mb-6 font-odesa-medium text-[40px] leading-none" style={{ color: titleColor }}>{section.title}</h2>}
              {section.subtitle && <p className="mb-4 text-[17px] font-odesa-regular" style={{ color: `${titleColor}88` }}>{section.subtitle}</p>}
              {noCoords ? (
                <a href={rawUrl} target="_blank" rel="noreferrer"
                  className="relative flex items-center justify-center gap-3 overflow-hidden rounded-[28px] border-2 border-dashed py-20 text-[18px] font-odesa-medium transition hover:opacity-80"
                  style={{ borderColor: `${titleColor}33`, color: `${titleColor}b3` }}>
                  <div aria-hidden="true" className="pointer-events-none absolute h-64 w-64 opacity-[0.06]" style={{ color: titleColor }}>
                    <CompassRose className="h-full w-full" />
                  </div>
                  <MapPin className="relative z-10 h-6 w-6" style={{ color: GOLD }} />
                  <span className="relative z-10">Відкрити на карті →</span>
                </a>
              ) : (
                <div className="h-[320px] overflow-hidden rounded-[28px] md:h-[480px]">
                  <iframe
                    src={embedUrl}
                    title="Карта"
                    loading="lazy"
                    allow="fullscreen"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-full w-full border-0"
                  />
                </div>
              )}
              {isOsm && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[12px] text-[#002f5e]/70">© OpenStreetMap contributors</p>
                  <a href={rawUrl} target="_blank" rel="noreferrer"
                    className="text-[12px] text-[#002f5e]/70 underline underline-offset-2 hover:text-[#002f5e]/70 transition-colors">
                    Відкрити в Google Maps →
                  </a>
                </div>
              )}
            </div>
          </section>
        );
      }

      // ── video ──────────────────────────────────────────────────
      case "video": {
        const videoUrl = (section.payload?.videoUrl as string | undefined) ?? "";
        if (!videoUrl) return null;
        const bg = section.bgColor ?? "#001a3d";
        return (
          <section key={section.id} className="px-4 py-14 md:px-10" style={{ backgroundColor: bg }}>
            <div className="container-edge">
              <div className="mx-auto max-w-[1200px]">
                {section.title && <h2 className="mb-2 font-odesa-medium text-[40px] leading-none text-[#fff2e8]">{section.title}</h2>}
                {section.subtitle && <p className="mb-4 text-[17px] font-odesa-regular text-[#fff2e8]/55">{section.subtitle}</p>}
                <div className="overflow-hidden rounded-[28px]" style={{ aspectRatio: "16/9" }}>
                  <iframe src={videoUrl} title={section.title} allow="autoplay; encrypted-media" allowFullScreen
                    className="h-full w-full border-0" />
                </div>
              </div>
            </div>
          </section>
        );
      }

      // ── stat_strip ─────────────────────────────────────────────
      case "stat_strip": {
        const stats = (section.payload?.stats as string ?? "").split("\n").filter(Boolean)
          .map((line: string) => { const [val, lbl] = line.split("|").map((s: string) => s.trim()); return { val, lbl }; });
        if (!stats.length) return null;
        const bg = section.bgColor ?? NAVY;
        return (
          <section key={section.id} className="px-4 py-14 md:px-10" style={{ backgroundColor: bg }}>
            <div className="container-edge">
              {section.title && <h2 className="mb-2 font-odesa-medium text-[40px] leading-none text-[#fff2e8]">{section.title}</h2>}
              {section.subtitle && <p className="mb-6 text-[17px] font-odesa-regular text-[#fff2e8]/55">{section.subtitle}</p>}
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {stats.map(({ val, lbl }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: i * 0.06 }}
                    className="rounded-[24px] border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
                    <p className="font-odesa-medium text-[40px] leading-none" style={{ color: accent }}>{val}</p>
                    <p className="mt-2 text-[13px] font-odesa-regular uppercase tracking-widest text-[#fff2e8]/55">{lbl}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      // ── quote ──────────────────────────────────────────────────
      case "quote": {
        const quote  = (section.payload?.quote  as string | undefined) ?? "";
        const author = (section.payload?.author as string | undefined) ?? "";
        if (!quote) return null;
        const bg = section.bgColor ?? BG;
        const isLight = bg === BG || bg === "#fff2e8";
        const textColor = isLight ? NAVY : "#fff2e8";
        return (
          <section key={section.id} className="relative overflow-hidden px-4 py-20 md:px-10" style={{ backgroundColor: bg }}>
            {isLight && <SectionPattern />}
            <div className="container-edge relative z-10">
              <div className="mx-auto max-w-[860px] text-center">
                <motion.blockquote initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                  <span className="block font-odesa-bold text-[64px] leading-none" style={{ color: accent }} aria-hidden="true">&ldquo;</span>
                  <p className="-mt-6 font-odesa-medium text-[28px] leading-[1.35] md:text-[40px]" style={{ color: textColor }}>{quote}</p>
                  {author && <footer className="mt-5 text-[15px] font-odesa-regular" style={{ color: `${textColor}80` }}>— {author}</footer>}
                </motion.blockquote>
              </div>
            </div>
          </section>
        );
      }

      // ── custom_text ────────────────────────────────────────────
      case "custom_text": {
        const text = (section.payload?.text as string | undefined) ?? "";
        if (!text) return null;
        const bg = section.bgColor ?? BG;
        const isLight = bg === BG || bg === "#fff2e8";
        const textColor = isLight ? NAVY : "#fff2e8";
        return (
          <section key={section.id} className="relative overflow-hidden px-4 py-20 md:px-10" style={{ backgroundColor: bg }}>
            {isLight && <SectionPattern />}
            <div className="container-edge relative z-10">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                {section.title && <h2 className="mb-2 font-odesa-medium text-[40px] leading-none" style={{ color: textColor }}>{section.title}</h2>}
                {section.subtitle && <p className="mb-4 text-[17px] font-odesa-regular" style={{ color: `${textColor}88` }}>{section.subtitle}</p>}
                <CollapsibleRichText
                  html={text}
                  bgColor={bg}
                  collapsedMaxHeightPx={300}
                  className="text-[20px] leading-[1.55] font-odesa-regular md:text-[26px] article-content"
                />
              </motion.div>
            </div>
          </section>
        );
      }

      // ── related sections ───────────────────────────────────────
      case "related_events":
      case "related_attractions":
      case "related_restaurants":
      case "related_hotels": {
        const relType = section.kind.replace("related_", "").replace(/s$/, "") as TourismObjectType;
        const items = relatedByType(relType, section.filter);
        if (!items.length) return null;
        const bg = section.bgColor ?? DEFAULT_BG[relType];
        return (
          <ObjectSection key={section.id} sectionId={`related-${relType}`} title={section.title} subtitle={section.subtitle}
            items={items} bg={bg} setRef={setRef} scroll={scroll} scrollRefs={scrollRefs} />
        );
      }

      // ── gallery ────────────────────────────────────────────────
      case "gallery": {
        const sectionKey = `gallery-${section.id}`;
        const items = galleryCards
          .filter((c) => c.sectionKey === sectionKey)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (!items.length) return null;
        const bg = section.bgColor ?? "#fff2e8";
        const isDark = bg !== "#fff2e8" && bg !== "#ffffff" && bg !== "#f4f4f0" && bg !== "#ffdfc6";
        const tc = isDark ? "#fff2e8" : "#002f5e";
        const CARD_H = "calc((100vh - 56px - 20px) / 2)";
        const cardW = (colSpan: number) =>
          colSpan === 3 ? `calc(${CARD_H} * 3 + 40px)` : colSpan === 2 ? `calc(${CARD_H} * 2 + 20px)` : CARD_H;
        const imageItems = items.filter((item) => !item.payload?.videoUrl && item.imageUrl);
        return (
          <section key={section.id} ref={setRef(`gallery-${section.id}`)} className="scroll-mt-6 py-14" style={{ backgroundColor: bg }}>
            <div className="container-edge mb-6">
              {section.title && <h2 className="font-odesa-medium text-[44px] leading-none md:text-[64px]" style={{ color: tc }}>{section.title}</h2>}
              {section.subtitle && <p className="mt-2 text-[18px] font-odesa-regular md:text-[22px]" style={{ color: `${tc}99` }}>{section.subtitle}</p>}
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

      // ── divider ────────────────────────────────────────────────
      case "divider":
        return <div key={section.id} className="mx-auto my-4 max-w-[1400px] border-t border-[#002f5e]/8 px-4 md:px-10" />;

      default:
        return null;
    }
  };

  return (
    // key={object.id}: перехід з одного об'єкта на інший — це той самий
    // роут-компонент, і без ремоунта <img> hero тримає ФОТО ПОПЕРЕДНЬОГО
    // об'єкта, доки не довантажиться нове. Свіжий вузол показує темний
    // плейсхолдер замість чужої картинки (і заодно скидає стан
    // рілса/лайтбоксів/скрол-рефів минулої сторінки).
    <div key={object.id} className="bg-[#fff2e8] text-[#002f5e]">
     <main id="main-content" tabIndex={-1}>

      {/* ══════════════════  HERO  ══════════════════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden bg-[#001a3d]">
        {heroVideo ? (
          <HeroBackgroundVideo src={heroVideo} poster={heroImage} />
        ) : (
          <Img priority w={1600} src={heroImage} alt={tl(object.name, object.nameEn)} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.28)_0%,rgba(0,12,33,0.0)_40%,rgba(0,12,33,0.85)_100%)]" />

        {/* ── Єдина шапка-«бровь»: назад + один breadcrumb + головна ─────── */}
        <div className="relative z-20 mx-auto w-full max-w-[1180px] px-4 pt-0 md:px-5">
          <div className="rounded-b-[36px] bg-[#fff2e8] px-5 pb-3 pt-3 text-[#002f5e] md:rounded-b-[48px] md:px-6 md:pb-4 md:pt-4">
            <div className="flex items-center gap-3">
              <Link to={backTo} className="flex shrink-0 items-center gap-1.5 text-[14px] font-odesa-medium transition-opacity hover:opacity-70">
                <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">{t("back")}</span>
              </Link>
              <div className="h-4 w-px shrink-0 bg-[#002f5e]/15" />
              <div className="min-w-0 flex-1">
                <Breadcrumbs crumbs={[
                  { label: "Одещина", href: "/" },
                  { label: t("districts"), href: "/districts" },
                  ...(district ? [{ label: district.name, href: `/raion/${district.slug}` }] : []),
                  ...(city ? [{ label: city.name, href: `/napryamky/${city.slug}` }] : []),
                  { label: tl(object.name, object.nameEn) },
                ]} />
              </div>
              <Link to="/" className="hidden shrink-0 text-[14px] font-odesa-medium transition-opacity hover:opacity-70 sm:inline">{t("home")}</Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col justify-end px-6 pb-24 text-[#fff2e8] md:px-14 md:pb-14">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="mb-4 flex flex-wrap items-center gap-2 text-[14px] font-odesa-regular text-[#fff2e8]/65">
            {city && <Link to={`/napryamky/${city.slug}`} className="hover:text-[#fff2e8]">{city.name}</Link>}
            {city && district && <span className="text-[#fff2e8]/60">/</span>}
            {district && <Link to={`/raion/${district.slug}`} className="hover:text-[#fff2e8]">{district.name}</Link>}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.1 }}>
            <span className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[12px] uppercase tracking-[0.2em] font-odesa-medium backdrop-blur-md shadow-lg"
              style={{ backgroundColor: `${accent}40`, color: accent, border: `1px solid ${accent}70`, boxShadow: `0 0 18px ${accent}35` }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
              {m.label}
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className={`mt-4 font-odesa-medium leading-[0.95] [hyphens:none] [overflow-wrap:break-word] md:leading-[0.93] ${
              object.heroFontSize === "sm" ? "text-[30px] xs:text-[36px] md:text-[56px] lg:text-[72px]" :
              object.heroFontSize === "md" ? "text-[34px] xs:text-[44px] md:text-[76px] lg:text-[96px]" :
              object.heroFontSize === "lg" ? "text-[38px] xs:text-[50px] md:text-[100px] lg:text-[130px]" :
              "text-[38px] xs:text-[50px] md:text-[100px] lg:text-[120px]"
            }`}>
            {tl(object.name, object.nameEn)}
          </motion.h1>
          {object.subtitle && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.18 }}
              className="mt-3 text-[18px] font-odesa-regular text-[#fff2e8]/80 md:text-[26px]">
              {tl(object.subtitle, object.subtitleEn)}
            </motion.p>
          )}
          {tourismTypes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-5 flex flex-wrap gap-2">
              {tourismTypes.map(tt => (
                <span key={tt} className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] font-odesa-medium backdrop-blur-md"
                  style={{ borderColor: `${accent}60`, color: accent, backgroundColor: `${accent}25` }}>
                  <Tag className="h-3 w-3" /> {tt}
                </span>
              ))}
            </motion.div>
          )}
          {(hours || object.eventDates || address) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.35 }}
              className="mt-7 flex w-fit max-w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-md">
              {hours && (
                <span className="flex items-center gap-2 text-[13px] font-odesa-regular">
                  <Clock className="h-3.5 w-3.5 shrink-0" style={{ color: GOLD }} />{hours}
                </span>
              )}
              {hours && (object.eventDates || address) && <span className="hidden h-4 w-px shrink-0 bg-white/15 sm:block" />}
              {object.eventDates && (
                <span className="flex items-center gap-2 text-[13px] font-odesa-regular">
                  <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: GOLD }} />{object.eventDates}
                </span>
              )}
              {object.eventDates && address && <span className="hidden h-4 w-px shrink-0 bg-white/15 sm:block" />}
              {address && (
                <span className="flex items-center gap-2 text-[13px] font-odesa-regular">
                  <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: GOLD }} />{address}
                </span>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════  DYNAMIC SECTIONS  ══════════════════════════ */}
      <div className="pb-tabbar md:pb-0">
        {activeSections.map(renderSection)}

        {district && (
          <DistrictDiscoverMore
            currentObjectId={object.id}
            districtId={district.id}
            districtSlug={district.slug}
            districtName={district.name}
            districtNameEn={district.nameEn}
            allObjects={allObjects}
          />
        )}
      </div>
     </main>

      <SiteFooter />

      <AnimatePresence>
        {reelImageOpen && object.reelImageUrl && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setReelImageOpen(false)}
              className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setReelImageOpen(false)}
              className="fixed inset-0 z-[91] flex items-center justify-center p-4 cursor-zoom-out"
            >
              <Img w={500}
                src={object.reelImageUrl}
                alt={object.name}
                onClick={e => e.stopPropagation()}
                className="max-h-[90vh] max-w-[90vw] rounded-[20px] object-contain shadow-2xl cursor-default"
              />
              <button
                type="button"
                onClick={() => setReelImageOpen(false)}
                aria-label={t("close")}
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reelVideoOpen && object.reelUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setReelVideoOpen(false)}
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,10,30,0.85)", backdropFilter: "blur(8px)" }}
          >
            <motion.video
              src={object.reelUrl}
              autoPlay loop playsInline controls
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              className="max-h-[90vh] w-auto rounded-[20px] object-contain shadow-2xl"
              style={{ aspectRatio: "9 / 16" }}
            />
            <button
              type="button"
              onClick={() => setReelVideoOpen(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30"
              aria-label="Закрити"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <GalleryLightbox
        images={galleryLightbox?.images ?? []}
        index={galleryLightbox ? galleryLightbox.index : null}
        onClose={() => setGalleryLightbox(null)}
        onNavigate={(index) => setGalleryLightbox((cur) => (cur ? { ...cur, index } : cur))}
      />
    </div>
  );
};

/* ── ScheduleHeader ─────────────────────────────────────────────── */
const ScheduleHeader = ({ type, accent }: { type: string; accent: string }) => (
  <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
    <p className="text-[12px] uppercase tracking-[0.25em] font-odesa-medium" style={{ color: accent }}>
      {type === "hotel" ? "Сервіс та зручності" : type === "event" ? "Розклад" : type === "restaurant" ? "Режим роботи" : "Відвідування"}
    </p>
    <h2 className="mt-2 font-odesa-medium text-[44px] leading-none md:text-[64px]">
      {type === "hotel" ? "Зручності" : type === "event" ? "Деталі" : type === "restaurant" ? "Графік" : "Інформація"}
    </h2>
  </motion.div>
);

/* ── InfoChip ────────────────────────────────────────────────────── */
const InfoChip = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) => (
  <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.4 }}
    aria-label={label || undefined}
    className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-odesa-medium text-[#fff2e8]"
    style={{ borderColor: `${accent}35`, backgroundColor: `${accent}14` }}>
    <span style={{ color: accent }}>{icon}</span>
    {value}
  </motion.span>
);

/* ── ContactCard ─────────────────────────────────────────────────── */
type ContactCardProps = {
  name: string;
  address?: string;
  hours?: string;
  eventDates?: string;
  phone?: string;
  website?: string;
  mapUrl?: string;
  accent: string;
  inBasket: boolean;
  onToggleBasket: () => void;
  onShare: () => void;
  linkCopied: boolean;
  t: (key: "inBasket" | "addToBasket") => string;
  cityLink?: { slug: string; name: string };
};

const ContactCard = ({
  name, address, hours, eventDates, phone, website, mapUrl, accent,
  inBasket, onToggleBasket, onShare, linkCopied, t, cityLink,
}: ContactCardProps) => (
  <div className="space-y-4">
    <div className="rounded-[28px] border p-7"
      style={{ backgroundColor: NAVY, color: BG, borderColor: `${accent}35`, boxShadow: `0 4px 30px ${accent}20` }}>
      <p className="font-odesa-medium text-[26px] leading-[1.05]">{name}</p>
      <div className="mt-1 h-px w-full bg-white/10" />
      <div className="mt-5 space-y-4">
        {address && address.split("\n").filter(Boolean).map((a, i) => (
          <div key={i} className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GOLD }} />
            <span className="text-[17px] font-odesa-regular leading-[1.35] text-[#fff2e8]/90">{a}</span>
          </div>
        ))}
        {hours && (
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GOLD }} />
            <span className="text-[17px] font-odesa-regular leading-[1.4] text-[#fff2e8]/90">{hours}</span>
          </div>
        )}
        {eventDates && (
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GOLD }} />
            <span className="text-[17px] font-odesa-regular leading-[1.35] text-[#fff2e8]/90">{eventDates}</span>
          </div>
        )}
        {phone && phone.split("\n").filter(Boolean).map((p, i) => (
          <a key={i} href={`tel:${p}`} className="flex items-center gap-3 transition-opacity hover:opacity-75">
            <Phone className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
            <span className="text-[17px] font-odesa-regular text-[#fff2e8]/90">{p}</span>
          </a>
        ))}
        {website && website.split("\n").filter(Boolean).map((w, i) => (
          <a key={i} href={w} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 transition-opacity hover:opacity-75">
            <Globe className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
            <span className="text-[17px] font-odesa-regular text-[#fff2e8]/90 underline underline-offset-2">Офіційний сайт</span>
            <ArrowUpRight className="h-4 w-4 text-[#fff2e8]/50" />
          </a>
        ))}
      </div>
      {mapUrl && (
        <div className="mt-7 flex flex-wrap gap-2">
          {mapUrl.split("\n").filter(Boolean).map((url, i, arr) => (
            <a key={i} href={url} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[15px] font-odesa-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: GOLD, color: NAVY }}>
              <MapPin className="h-4 w-4" />
              {arr.length > 1 ? `Карта ${i + 1}` : "На карті"} <ArrowRight className="h-4 w-4" />
            </a>
          ))}
        </div>
      )}
      <div className="mt-6 border-t border-white/10 pt-5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onToggleBasket}
          aria-pressed={inBasket}
          className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-odesa-bold transition-colors"
          style={inBasket ? { backgroundColor: GOLD, color: NAVY } : { backgroundColor: BG, color: NAVY }}
        >
          {inBasket
            ? <><Check className="h-[18px] w-[18px]" /> {t("inBasket")}</>
            : <><ShoppingCart className="h-[18px] w-[18px]" /> {t("addToBasket")}</>}
        </motion.button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {address && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.split("\n")[0])}`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#fff2e8]/25 px-5 py-2.5 text-[13px] font-odesa-medium text-[#fff2e8] transition-colors hover:bg-white/10"
          >
            <Navigation className="h-4 w-4" style={{ color: GOLD }} /> Прокласти маршрут
          </a>
        )}
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-2 rounded-full border border-[#fff2e8]/25 px-5 py-2.5 text-[13px] font-odesa-medium text-[#fff2e8] transition-colors hover:bg-white/10"
        >
          {linkCopied
            ? <><Check className="h-4 w-4 text-emerald-400" /> Скопійовано!</>
            : <><Share2 className="h-4 w-4" style={{ color: GOLD }} /> Поділитися</>}
        </button>
      </div>
    </div>
    {cityLink && (
      <Link to={`/napryamky/${cityLink.slug}`}
        className="group flex items-center justify-between rounded-[20px] border bg-white/70 px-6 py-4 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
        style={{ borderColor: `${accent}35` }}>
        <div>
          <p className="text-[12px] font-odesa-medium uppercase tracking-widest text-[#002f5e]/70">Місто</p>
          <p className="mt-0.5 font-odesa-medium text-[20px] text-[#002f5e]">{cityLink.name}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-[#002f5e]/70 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    )}
  </div>
);

export default EntityDetail;
