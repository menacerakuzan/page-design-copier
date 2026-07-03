import { useEffect, useMemo, useRef, useState } from "react";
import { Img } from "@/components/Img";
import { useLang } from "@/lib/langContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, Calendar, Check, ChevronLeft, ChevronRight,
  Clock, Globe, MapPin, Navigation, Phone, Share2, ShoppingCart, Tag, Ticket, BookOpen, Volume2, VolumeX, X, Maximize2,
} from "lucide-react";
import { GalleryVideoCard } from "@/components/GalleryVideoCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link, useParams } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { usePageConfig } from "@/hooks/usePageConfig";
import { makeDefaultConfig, PageSection } from "@/types/pages";
import { applyFilter } from "@/lib/pageSections";
import NotFound from "@/pages/NotFound";
import type { TourismObject } from "@/types/hierarchy";
import { getObjectCoords, haversineKm } from "@/lib/geo";
import { useBasket } from "@/lib/basketContext";

/* ── palette ─────────────────────────────────────────────────────── */
const BG   = "#fff2e8";
const NAVY = "#002f5e";
const GOLD = "#df9b3b";
const star = "✦";

const meta: Record<string, { label: string; accent: string; navBg: string; schedBg: string }> = {
  attraction: { label: "Місце",    accent: "#df9b3b", navBg: `${NAVY}f0`,     schedBg: "#001a3d" },
  event:      { label: "Подія",    accent: "#e8526a", navBg: "#9f1f47ee",     schedBg: "#3d0820" },
  hotel:      { label: "Готель",   accent: "#3ebfa0", navBg: `${NAVY}f0`,     schedBg: "#062820" },
  restaurant: { label: "Ресторан", accent: "#f07844", navBg: "#9f1f47ee",     schedBg: "#2a1200" },
};

const tabs: Record<string, { id: string; label: string }[]> = {
  attraction: [
    { id: "about",    label: "Про місце" },
    { id: "schedule", label: "Відвідування" },
    { id: "contacts", label: "Контакти" },
  ],
  event: [
    { id: "about",    label: "Про подію" },
    { id: "schedule", label: "Розклад" },
    { id: "contacts", label: "Контакти" },
  ],
  hotel: [
    { id: "about",    label: "Про готель" },
    { id: "schedule", label: "Сервіс" },
    { id: "contacts", label: "Контакти" },
  ],
  restaurant: [
    { id: "about",    label: "Про ресторан" },
    { id: "schedule", label: "Графік" },
    { id: "contacts", label: "Контакти" },
  ],
};

const ROUTE: Record<string, string> = {
  attraction: "/mistse",
  event:      "/podiyi",
  hotel:      "/hoteli",
  restaurant: "/restorany",
};

const BADGE_COLOR: Record<string, string> = {
  attraction: "#6eafd4",
  event:      "#e8526a",
  hotel:      "#3ebfa0",
  restaurant: "#f07844",
};

const LABEL_SHORT: Record<string, string> = {
  attraction: "Тур об'єкти",
  event:      "Події",
  hotel:      "Готелі",
  restaurant: "Ресторани",
};

type PageType = "event" | "hotel" | "restaurant" | "attraction";

function parseRepertoire(text: string): { date: string; title: string; time: string }[] {
  return text.split("\n").map(line => {
    const parts = line.split("—").map(s => s.trim());
    return { date: parts[0] ?? "", title: parts[1] ?? line.trim(), time: parts[2] ?? "" };
  }).filter(r => r.title);
}

function RepertoireCards({ repertoire, accent }: { repertoire: string; accent: string }) {
  const rows = parseRepertoire(repertoire);
  if (!rows.length) return null;
  return (
    <div className="mt-8 w-full">
      <h3 className="mb-4 font-odesa-medium text-[22px]" style={{ color: accent }}>Репертуар</h3>
      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 rounded-[14px] border border-[#002f5e]/10 bg-white/70 px-4 py-3">
            {r.date && (
              <span className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-odesa-medium text-white" style={{ backgroundColor: accent }}>
                {r.date}
              </span>
            )}
            <span className="flex-1 font-odesa-medium text-[15px] text-[#002f5e]">{r.title}</span>
            {r.time && (
              <span className="shrink-0 text-[13px] font-odesa-regular text-[#002f5e]/50">{r.time}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
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
  const [activeTab, setActiveTab] = useState("about");
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
  const { tl, t } = useLang();
  const { has: inBasket, toggle: toggleBasket } = useBasket();

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [slug]);

  // Scroll-spy: підсвічуємо активну вкладку липкої навігації
  useEffect(() => {
    if (!object) return;
    const ids = ["about", "schedule", "contacts"];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = ids.find((k) => refs.current[k] === entry.target);
          if (id) setActiveTab(id);
        }
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    ids.forEach((id) => {
      const el = refs.current[id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [object, config]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#001a3d] flex items-center justify-center">
      <div className="h-12 w-12 rounded-full border-4 border-[#fff2e8]/20 border-t-[#fff2e8]/80 animate-spin" />
    </div>
  );
  if (!object) return <NotFound />;

  const city     = snapshot?.cities.find(c => c.id === object.cityId);
  const district = snapshot?.districts.find(d => d.id === object.districtId);

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

  // about section bg
  const aboutBg = findSection("description")?.bgColor ?? BG;

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
  const goTo     = (id: string) => refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scroll   = (key: string, dir: 1 | -1) => scrollRefs.current[key]?.scrollBy({ left: dir * 380, behavior: "smooth" });

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
            className="scroll-mt-[52px] px-4 py-20 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[1400px]">
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                <p className="text-[12px] uppercase tracking-[0.25em] font-odesa-medium" style={{ color: m.accent }}>{m.label}</p>
                <h2 className="mt-2 text-[44px] leading-none font-odesa-medium md:text-[64px]" style={{ color: textColor }}>
                  {type === "event" ? "Про подію" : type === "hotel" ? "Про готель" : type === "restaurant" ? "Про ресторан" : "Про місце"}
                </h2>
              </motion.div>
              <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.05 }}>
                  <div className="text-[20px] leading-[1.55] font-odesa-regular md:text-[28px] article-content"
                    style={{ color: `${textColor}e6` }} dangerouslySetInnerHTML={{ __html: description }} />
                  {(object.detailedInfo || object.detailedInfoEn) && (
                    <div className="mt-6 text-[17px] leading-[1.65] font-odesa-regular md:text-[20px] article-content"
                      style={{ color: `${textColor}88` }} dangerouslySetInnerHTML={{ __html: unescapeHtml(tl(object.detailedInfo, object.detailedInfoEn)) }} />
                  )}
                  {(object.reelUrl || object.reelImageUrl) && (
                    <div className="mt-8 w-full max-w-[200px]">
                      <div className="relative overflow-hidden rounded-[20px] shadow-xl" style={{ aspectRatio: "9/16" }}>
                        {object.reelImageUrl ? (
                          <Img w={500}
                            src={object.reelImageUrl}
                            alt={object.name}
                            onClick={() => setReelImageOpen(true)}
                            className="h-full w-full object-cover cursor-zoom-in transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <>
                            <video
                              src={object.reelUrl}
                              autoPlay muted={reelMuted} loop playsInline
                              onClick={() => setReelVideoOpen(true)}
                              className="h-full w-full object-cover cursor-zoom-in"
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setReelMuted((m) => !m)}
                                className="flex items-center justify-center rounded-full border border-white/30 bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70"
                                aria-label={reelMuted ? "Увімкнути звук" : "Вимкнути звук"}
                              >
                                {reelMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setReelVideoOpen(true)}
                                className="flex items-center justify-center rounded-full border border-white/30 bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70"
                                aria-label="На весь екран"
                              >
                                <Maximize2 className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {object.venueId && (() => {
                    const venue = snapshot.objects.find(o => o.id === object.venueId && o.published);
                    if (!venue) return null;
                    return (
                      <div className="mt-6 flex items-center gap-2 text-[15px] font-odesa-regular" style={{ color: `${textColor}99` }}>
                        <MapPin className="h-4 w-4 shrink-0" style={{ color: m.accent }} />
                        <span>Локація:</span>
                        <Link to={`${ROUTE[venue.type]}/${venue.slug}`}
                          className="font-odesa-medium underline underline-offset-2 transition-opacity hover:opacity-70"
                          style={{ color: m.accent }}>
                          {tl(venue.name, venue.nameEn)}
                        </Link>
                      </div>
                    );
                  })()}
                  {tourismTypes.length > 0 && (
                    <div className="mt-8 flex flex-wrap gap-2">
                      {tourismTypes.map(t => (
                        <span key={t} className="rounded-full border px-4 py-1.5 text-[14px] font-odesa-medium"
                          style={{ borderColor: `${m.accent}60`, color: m.accent, backgroundColor: `${m.accent}18` }}>{t}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
                {showContacts && (
                  <motion.aside ref={setRef("contacts")}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.65, delay: 0.1 }}
                    className="order-first scroll-mt-[52px] space-y-4 lg:order-none lg:sticky lg:top-[64px] lg:self-start">
                    <div className="rounded-[28px] border p-7"
                      style={{ backgroundColor: NAVY, color: BG, borderColor: `${m.accent}35`, boxShadow: `0 4px 30px ${m.accent}20` }}>
                      <p className="font-odesa-medium text-[26px] leading-[1.05]">{tl(object.name, object.nameEn)}</p>
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
                        {object.eventDates && (
                          <div className="flex items-start gap-3">
                            <Calendar className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GOLD }} />
                            <span className="text-[17px] font-odesa-regular leading-[1.35] text-[#fff2e8]/90">{object.eventDates}</span>
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
                          {mapUrl.split("\n").filter(Boolean).map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-[15px] font-odesa-medium transition-opacity hover:opacity-90"
                              style={{ backgroundColor: GOLD, color: NAVY }}>
                              <MapPin className="h-4 w-4" />
                              {mapUrl.split("\n").filter(Boolean).length > 1 ? `Карта ${i + 1}` : "На карті"} <ArrowRight className="h-4 w-4" />
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="mt-6 border-t border-white/10 pt-5">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleBasket(object.id)}
                          aria-pressed={inBasket(object.id)}
                          className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[15px] font-odesa-bold transition-colors"
                          style={
                            inBasket(object.id)
                              ? { backgroundColor: GOLD, color: NAVY }
                              : { backgroundColor: BG, color: NAVY }
                          }
                        >
                          {inBasket(object.id)
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
                          onClick={handleShare}
                          className="inline-flex items-center gap-2 rounded-full border border-[#fff2e8]/25 px-5 py-2.5 text-[13px] font-odesa-medium text-[#fff2e8] transition-colors hover:bg-white/10"
                        >
                          {linkCopied
                            ? <><Check className="h-4 w-4 text-emerald-400" /> Скопійовано!</>
                            : <><Share2 className="h-4 w-4" style={{ color: GOLD }} /> Поділитися</>}
                        </button>
                      </div>
                    </div>
                    {city && (
                      <Link to={`/napryamky/${city.slug}`}
                        className="group flex items-center justify-between rounded-[20px] border bg-white/70 px-6 py-4 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
                        style={{ borderColor: `${m.accent}35` }}>
                        <div>
                          <p className="text-[12px] font-odesa-medium uppercase tracking-widest text-[#002f5e]/50">Місто</p>
                          <p className="mt-0.5 font-odesa-medium text-[20px] text-[#002f5e]">{city.name}</p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-[#002f5e]/40 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    )}
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
        // Standalone contact card
        const bg = section.bgColor ?? BG;
        return (
          <section key={section.id} ref={setRef("contacts")}
            className="scroll-mt-[52px] px-4 py-14 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[600px]">
              <div className="rounded-[28px] border p-7"
                style={{ backgroundColor: NAVY, color: BG, borderColor: `${m.accent}35` }}>
                <p className="font-odesa-medium text-[24px] text-[#fff2e8]">{section.title}</p>
                <div className="mt-4 space-y-4">
                  {address && address.split("\n").filter(Boolean).map((a, i) => (
                    <div key={i} className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GOLD }} /><span className="text-[16px] font-odesa-regular text-[#fff2e8]/90">{a}</span></div>
                  ))}
                  {phone && phone.split("\n").filter(Boolean).map((p, i) => (
                    <a key={i} href={`tel:${p}`} className="flex items-center gap-3 hover:opacity-75"><Phone className="h-5 w-5 shrink-0" style={{ color: GOLD }} /><span className="text-[16px] font-odesa-regular text-[#fff2e8]/90">{p}</span></a>
                  ))}
                  {website && website.split("\n").filter(Boolean).map((w, i) => (
                    <a key={i} href={w} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-75"><Globe className="h-5 w-5 shrink-0" style={{ color: GOLD }} /><span className="text-[16px] font-odesa-regular text-[#fff2e8]/90 underline">Офіційний сайт</span></a>
                  ))}
                </div>
              </div>
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
            className="scroll-mt-[52px] px-4 py-20 text-[#fff2e8] md:px-10"
            style={{ background: `linear-gradient(160deg, transparent 0%, transparent 30%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.12) 72%, rgba(0,0,0,0.28) 82%, rgba(0,0,0,0.28) 90%, rgba(0,0,0,0.48) 100%), ${bg}` }}>
            <div className="mx-auto max-w-[1400px]">
              <ScheduleHeader type={type} accent={m.accent} />
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {hours && <InfoTile icon={<Clock className="h-6 w-6" />} label="Години роботи" value={hours} accent={m.accent} />}
                {infoCards.map(card => (
                  <InfoTile key={card.id} icon={<Tag className="h-6 w-6" />} label={card.subtitle ?? ""} value={card.title} accent={m.accent} />
                ))}
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
            className="scroll-mt-[52px] px-4 py-20 text-[#fff2e8] md:px-10"
            style={{ background: `linear-gradient(160deg, transparent 0%, transparent 30%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.12) 72%, rgba(0,0,0,0.28) 82%, rgba(0,0,0,0.28) 90%, rgba(0,0,0,0.48) 100%), ${bg}` }}>
            <div className="mx-auto max-w-[1400px]">
              <ScheduleHeader type={type} accent={m.accent} />
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {object.eventDates && <InfoTile icon={<Calendar className="h-6 w-6" />} label="Дати проведення" value={object.eventDates} accent={m.accent} />}
                {infoCards.map(card => (
                  <InfoTile key={card.id} icon={<Tag className="h-6 w-6" />} label={card.subtitle ?? ""} value={card.title} accent={m.accent} />
                ))}
              </div>
              {object.repertoire && (
                <div className="mt-12">
                  <h3 className="mb-5 font-odesa-medium text-[28px]" style={{ color: m.accent }}>Репертуар</h3>
                  <div className="flex flex-col gap-2 max-w-[700px]">
                    {parseRepertoire(object.repertoire).map((r, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-[14px] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                        {r.date && (
                          <span className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-odesa-medium text-white" style={{ backgroundColor: m.accent }}>
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
            className="scroll-mt-[52px] px-4 py-20 text-[#fff2e8] md:px-10"
            style={{ background: `linear-gradient(160deg, transparent 0%, transparent 30%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.12) 72%, rgba(0,0,0,0.28) 82%, rgba(0,0,0,0.28) 90%, rgba(0,0,0,0.48) 100%), ${bg}` }}>
            <div className="mx-auto max-w-[1400px]">
              <ScheduleHeader type={type} accent={m.accent} />
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {amenities && amenities.split(",").map(a => (
                  <InfoTile key={a.trim()} icon={<Tag className="h-6 w-6" />} label="Зручність" value={a.trim()} accent={m.accent} />
                ))}
                {infoCards.map(card => (
                  <InfoTile key={card.id} icon={<Tag className="h-6 w-6" />} label={card.subtitle ?? ""} value={card.title} accent={m.accent} />
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
        const bg = section.bgColor ?? "#1a0a2e";
        return (
          <section key={section.id} className="px-4 py-14 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[700px] text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                <Ticket className="mx-auto mb-4 h-10 w-10" style={{ color: m.accent }} />
                <h2 className="font-odesa-medium text-[40px] leading-none text-[#fff2e8]">{section.title}</h2>
                {ticketText && <p className="mt-4 text-[18px] font-odesa-regular text-[#fff2e8]/70">{ticketText}</p>}
                {ticketUrl && (
                  <a href={ticketUrl} target="_blank" rel="noreferrer"
                    className="mt-7 inline-flex items-center gap-2 rounded-full px-8 py-3 text-[16px] font-odesa-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: m.accent, color: NAVY }}>
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
        const bg = section.bgColor ?? "#fff2e8";
        const isDark = bg === BG || bg === "#fff2e8" || bg === "#f4f4f0";
        return (
          <section key={section.id} className="px-4 py-12 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto flex max-w-[700px] items-center justify-between gap-6 rounded-[24px] border border-[#002f5e]/10 bg-white/70 px-8 py-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <BookOpen className="h-8 w-8" style={{ color: m.accent }} />
                <div>
                  <p className="font-odesa-medium text-[20px] text-[#002f5e]">{section.title}</p>
                  {section.subtitle && <p className="text-[14px] font-odesa-regular text-[#002f5e]/55">{section.subtitle}</p>}
                </div>
              </div>
              <a href={menuUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[14px] font-odesa-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: m.accent, color: NAVY }}>
                Переглянути <ArrowUpRight className="h-4 w-4" />
              </a>
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
            <div className="mx-auto max-w-[1400px]">
              {section.title && <h2 className="mb-6 font-odesa-medium text-[40px] leading-none" style={{ color: titleColor }}>{section.title}</h2>}
              {section.subtitle && <p className="mb-4 text-[17px] font-odesa-regular" style={{ color: `${titleColor}88` }}>{section.subtitle}</p>}
              {noCoords ? (
                <a href={rawUrl} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-3 rounded-[28px] border-2 border-dashed border-[#fff2e8]/20 py-20 text-[18px] font-odesa-medium text-[#fff2e8]/70 transition hover:border-[#fff2e8]/40 hover:text-[#fff2e8]">
                  <MapPin className="h-6 w-6" style={{ color: GOLD }} />
                  Відкрити на карті →
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
                  <p className="text-[12px] text-[#002f5e]/35">© OpenStreetMap contributors</p>
                  <a href={rawUrl} target="_blank" rel="noreferrer"
                    className="text-[12px] text-[#002f5e]/40 underline underline-offset-2 hover:text-[#002f5e]/70 transition-colors">
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

      // ── stat_strip ─────────────────────────────────────────────
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
                    viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5, delay: i * 0.06 }}
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

      // ── quote ──────────────────────────────────────────────────
      case "quote": {
        const quote  = (section.payload?.quote  as string | undefined) ?? "";
        const author = (section.payload?.author as string | undefined) ?? "";
        if (!quote) return null;
        const bg = section.bgColor ?? BG;
        const textColor = bg === BG || bg === "#fff2e8" ? NAVY : "#fff2e8";
        return (
          <section key={section.id} className="px-4 py-20 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[860px] text-center">
              <motion.blockquote initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                <p className="font-odesa-medium text-[28px] leading-[1.35] md:text-[40px]" style={{ color: textColor }}>«{quote}»</p>
                {author && <footer className="mt-5 text-[15px] font-odesa-regular" style={{ color: `${textColor}80` }}>— {author}</footer>}
              </motion.blockquote>
            </div>
          </section>
        );
      }

      // ── custom_text ────────────────────────────────────────────
      case "custom_text": {
        const text = (section.payload?.text as string | undefined) ?? "";
        if (!text) return null;
        const bg = section.bgColor ?? BG;
        const textColor = bg === BG || bg === "#fff2e8" ? NAVY : "#fff2e8";
        return (
          <section key={section.id} className="px-4 py-20 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[1400px]">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}>
                {section.title && <h2 className="mb-2 font-odesa-medium text-[40px] leading-none" style={{ color: textColor }}>{section.title}</h2>}
                {section.subtitle && <p className="mb-4 text-[17px] font-odesa-regular" style={{ color: `${textColor}88` }}>{section.subtitle}</p>}
                <div className="text-[20px] leading-[1.55] font-odesa-regular md:text-[26px] article-content" style={{ color: `${textColor}cc` }} dangerouslySetInnerHTML={{ __html: text }} />
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
        const relType = section.kind.replace("related_", "").replace("attractions", "attraction").replace("restaurants", "restaurant").replace("hotels", "hotel").replace("events", "event");
        const items = relatedByType(relType, section.filter);
        if (!items.length) return null;
        const bg = section.bgColor ?? ({ attraction: "#001a3d", event: "#3d0820", hotel: "#062820", restaurant: "#2a1200" }[relType] ?? NAVY);
        return (
          <RelatedSection key={section.id} sectionId={`rel-${relType}`} title={section.title} subtitle={section.subtitle}
            type={relType} items={items} bg={bg} setRef={setRef} scroll={scroll} scrollRefs={scrollRefs} />
        );
      }

      // ── gallery ────────────────────────────────────────────────
      case "gallery": {
        const sectionKey = `gallery-${section.id}`;
        const items = galleryCards
          .filter((c) => c.sectionKey === sectionKey)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (!items.length) return null;
        const bg = section.bgColor ?? m.bg;
        const isDark = bg !== "#fff2e8" && bg !== "#ffffff" && bg !== "#f4f4f0" && bg !== "#ffdfc6";
        const tc = isDark ? "#fff2e8" : "#002f5e";
        const CARD_H = "calc((100vh - 56px - 20px) / 2)";
        const cardW = (colSpan: number) =>
          colSpan === 3 ? `calc(${CARD_H} * 3 + 40px)` : colSpan === 2 ? `calc(${CARD_H} * 2 + 20px)` : CARD_H;
        return (
          <section key={section.id} className="py-14" style={{ backgroundColor: bg }}>
            <div className="mx-auto mb-6 max-w-[1400px] px-4 md:px-10">
              {section.title && <h2 className="font-odesa-medium text-[44px] leading-none md:text-[64px]" style={{ color: tc }}>{section.title}</h2>}
              {section.subtitle && <p className="mt-2 text-[18px] font-odesa-regular md:text-[22px]" style={{ color: `${tc}99` }}>{section.subtitle}</p>}
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

      // ── divider ────────────────────────────────────────────────
      case "divider":
        return <div key={section.id} className="mx-auto my-4 max-w-[1400px] border-t border-[#002f5e]/8 px-4 md:px-10" />;

      default:
        return null;
    }
  };

  return (
    <div className="bg-[#fff2e8] text-[#002f5e]">

      {/* ══════════════════  HERO  ══════════════════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden">
        {heroVideo ? (
          <video className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline>
            <source src={heroVideo} type="video/mp4" />
          </video>
        ) : (
          <Img priority w={1600} src={heroImage} alt={tl(object.name, object.nameEn)} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.28)_0%,rgba(0,12,33,0.0)_40%,rgba(0,12,33,0.85)_100%)]" />

        <div className="relative z-20 mx-auto w-full max-w-[1180px] px-4 pt-0 md:px-5">
          <div className="rounded-b-[48px] bg-[#fff2e8] px-6 pb-4 pt-4 text-[#002f5e]">
            <div className="flex items-center justify-between gap-4 font-odesa-medium text-[14px]">
              <Link to={backTo} className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-70">
                <ChevronLeft className="h-4 w-4 shrink-0" /> <span className="truncate">Назад</span>
              </Link>
              <div className="hidden items-center gap-3 sm:flex">
                <span className="text-[15px] text-[#002f5e]/40">{star}</span>
                <span>{m.label}</span>
                <span className="text-[15px] text-[#002f5e]/40">{star}</span>
                <span>{city?.name ?? district?.name ?? "Одещина"}</span>
              </div>
              <Link to="/" className="shrink-0 transition-opacity hover:opacity-70">Головна</Link>
            </div>
          </div>
        </div>

        <div className="relative z-20 px-6 pt-4 md:px-14">
          <Breadcrumbs light crumbs={[
            { label: "Одещина", href: "/" },
            { label: "Райони", href: "/districts" },
            ...(district ? [{ label: district.name, href: `/raion/${district.slug}` }] : []),
            ...(city ? [{ label: city.name, href: `/napryamky/${city.slug}` }] : []),
            { label: tl(object.name, object.nameEn) },
          ]} />
        </div>

        <div className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col justify-end px-6 pb-24 text-[#fff2e8] md:px-14 md:pb-14">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="mb-4 flex flex-wrap items-center gap-2 text-[14px] font-odesa-regular text-[#fff2e8]/65">
            {city && <Link to={`/napryamky/${city.slug}`} className="hover:text-[#fff2e8]">{city.name}</Link>}
            {city && district && <span className="text-[#fff2e8]/30">/</span>}
            {district && <Link to={`/raion/${district.slug}`} className="hover:text-[#fff2e8]">{district.name}</Link>}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className={`font-odesa-medium leading-[0.95] [hyphens:auto] [overflow-wrap:anywhere] md:leading-[0.93] ${
              object.heroFontSize === "sm" ? "text-[30px] xs:text-[36px] md:text-[56px] lg:text-[72px]" :
              object.heroFontSize === "md" ? "text-[34px] xs:text-[44px] md:text-[76px] lg:text-[96px]" :
              object.heroFontSize === "lg" ? "text-[38px] xs:text-[50px] md:text-[100px] lg:text-[130px]" :
              "text-[38px] xs:text-[50px] md:text-[100px] lg:text-[120px]"
            }`}>
            {tl(object.name, object.nameEn)}
          </motion.h1>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.1 }} className="mt-5">
            <span className="inline-block rounded-full px-5 py-2 text-[12px] uppercase tracking-[0.2em] font-odesa-medium backdrop-blur-md shadow-lg"
              style={{ backgroundColor: `${m.accent}40`, color: m.accent, border: `1px solid ${m.accent}70`, boxShadow: `0 0 18px ${m.accent}35` }}>
              {m.label}
            </span>
          </motion.div>
          {object.subtitle && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.18 }}
              className="mt-3 text-[18px] font-odesa-regular text-[#fff2e8]/80 md:text-[26px]">
              {tl(object.subtitle, object.subtitleEn)}
            </motion.p>
          )}
          {tourismTypes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-5 flex flex-wrap gap-2">
              {tourismTypes.map(t => (
                <span key={t} className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] font-odesa-medium backdrop-blur-md"
                  style={{ borderColor: `${m.accent}60`, color: m.accent, backgroundColor: `${m.accent}25` }}>
                  <Tag className="h-3 w-3" /> {t}
                </span>
              ))}
            </motion.div>
          )}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.4 }}
            className="mt-7 flex flex-wrap items-center gap-4">
            {hours && (
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-odesa-regular backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5" style={{ color: GOLD }} />{hours}
              </div>
            )}
            {object.eventDates && (
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-odesa-regular backdrop-blur-sm">
                <Calendar className="h-3.5 w-3.5" style={{ color: GOLD }} />{object.eventDates}
              </div>
            )}
            {address && (
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-odesa-regular backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5" style={{ color: GOLD }} />{address}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════  STICKY NAV  ════════════════════════════════ */}
      <nav className="sticky top-0 z-40 px-4 py-3 backdrop-blur-md md:px-10" style={{ backgroundColor: m.navBg }}>
        <div className="mx-auto max-w-[1400px] overflow-x-auto">
          <div className="flex min-w-max items-center gap-8 font-odesa-medium text-[14px] text-[#fff2e8] md:gap-10 md:text-[18px]">
            <span className="text-[13px] text-[#fff2e8]/50">{star}</span>
            {tabs[type].map(tab => (
              <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id); goTo(tab.id); }}
                className={`relative whitespace-nowrap pb-1 transition-all ${activeTab === tab.id ? "opacity-100" : "opacity-60 hover:opacity-100"}`}>
                {tab.label}
                <span
                  className={`absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-300 ${activeTab === tab.id ? "w-full" : "w-0"}`}
                  style={{ backgroundColor: m.accent }}
                />
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ══════════════════  DYNAMIC SECTIONS  ══════════════════════════ */}
      {activeSections.map(renderSection)}

      {/* ══════════════════  FULL-BLEED IMAGE STRIP  ════════════════════ */}
      <section className="relative h-[50vh] min-h-[320px] overflow-hidden md:h-[60vh]">
        <Img priority w={1600} src={heroImage} alt={tl(object.name, object.nameEn)} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.0)_0%,rgba(0,12,33,0.55)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 text-[#fff2e8] md:px-14">
          <p className="text-[12px] uppercase tracking-[0.25em] font-odesa-medium text-[#fff2e8]/55">
            {city?.name ?? district?.name ?? "Одещина"}
          </p>
          <p className="mt-1 font-odesa-medium text-[36px] leading-none md:text-[52px]">{tl(object.name, object.nameEn)}</p>
        </div>
      </section>

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
                className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30"
              >
                <X className="h-5 w-5" />
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

/* ── InfoTile ────────────────────────────────────────────────────── */
const InfoTile = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) => (
  <motion.article initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.5 }}
    className="overflow-hidden rounded-[24px] border backdrop-blur-sm"
    style={{ borderColor: `${accent}30`, backgroundColor: `${accent}10` }}>
    <div className="h-1 w-full" style={{ backgroundColor: accent, opacity: 0.7 }} />
    <div className="p-7">
      <div className="mb-4 flex items-center gap-2" style={{ color: accent }}>
        {icon}
        {label && <span className="text-[11px] uppercase tracking-widest font-odesa-medium" style={{ color: `${accent}bb` }}>{label}</span>}
      </div>
      <p className="text-[18px] font-odesa-medium leading-[1.35] text-[#fff2e8]">{value}</p>
    </div>
  </motion.article>
);

/* ── RelatedSection ──────────────────────────────────────────────── */
const RelatedSection = ({
  sectionId, title, subtitle, type, items, bg, setRef, scroll, scrollRefs,
}: {
  sectionId: string; title: string; subtitle?: string; type: string; items: TourismObject[]; bg: string;
  setRef: (id: string) => (el: HTMLElement | null) => void;
  scroll: (key: string, dir: 1 | -1) => void;
  scrollRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) => (
  <section ref={setRef(sectionId)} className="scroll-mt-[52px] flex h-screen flex-col overflow-x-hidden px-4 py-14 md:px-10"
    style={{ background: `linear-gradient(160deg, transparent 0%, transparent 30%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.12) 72%, rgba(0,0,0,0.28) 82%, rgba(0,0,0,0.28) 90%, rgba(0,0,0,0.48) 100%), ${bg}` }}>
    <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7 }}
        className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-odesa-medium text-[44px] leading-none text-[#fff2e8] md:text-[64px]">{title}</h2>
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
        className="flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex h-full gap-5 pb-2 pt-3" style={{ width: "max-content" }}>
          {items.map((obj, idx) => (
            <motion.div key={obj.id} className="h-full"
              initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.55, delay: idx * 0.08 }}>
              <Link to={`${ROUTE[obj.type]}/${obj.slug}`}
                className="group block h-full w-[270px] overflow-hidden rounded-[26px] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_28px_50px_-22px_rgba(0,0,0,0.65)] md:w-[310px]">
                <div className="relative h-full w-full overflow-hidden rounded-[26px]">
                  <Img w={500} src={obj.imageUrl ?? "https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=80"}
                    alt={obj.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${bg}f5 100%)` }} />
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest font-odesa-medium text-[#fff2e8] backdrop-blur-md"
                      style={{ backgroundColor: `${BADGE_COLOR[obj.type]}cc` }}>
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
                        Детальніше <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
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

export default EntityDetail;
