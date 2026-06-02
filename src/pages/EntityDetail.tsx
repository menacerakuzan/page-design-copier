import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, Calendar, ChevronLeft, ChevronRight,
  Clock, Globe, MapPin, Phone, Tag, Ticket, BookOpen,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { usePageConfig } from "@/hooks/usePageConfig";
import { makeDefaultConfig, PageSection } from "@/types/pages";
import NotFound from "@/pages/NotFound";
import type { TourismObject } from "@/types/hierarchy";

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

function applyFilter<T extends { id: string }>(items: T[], filter?: PageSection["filter"]): T[] {
  let result = items;
  if (filter?.entityIds?.length) result = result.filter(i => filter.entityIds!.includes(i.id));
  if (filter?.limit) result = result.slice(0, filter.limit);
  return result;
}

const EntityDetail = ({ type }: { type: PageType }) => {
  const params = useParams();
  const slug   = params.slug ?? "";
  const pageKey = `detail-${type}-${slug}`;
  const refs       = useRef<Record<string, HTMLElement | null>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { data: snapshot, isLoading } = useHierarchySnapshot();
  const { data: cardsData } = usePageContentCards(pageKey);
  const m = meta[type];

  const object = useMemo(
    () => snapshot?.objects.find(o => o.slug === slug && o.type === type),
    [snapshot, slug, type],
  );

  const allObjects = useMemo(() => snapshot?.objects ?? [], [snapshot]);

  const cards = useMemo(
    () => (cardsData ?? []).filter(c => c.pageKey === pageKey),
    [cardsData, pageKey],
  );

  const { config } = usePageConfig(type, object?.id ?? null);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [slug]);

  if (isLoading) return null;
  if (!object) return <NotFound />;

  const city     = snapshot?.cities.find(c => c.id === object.cityId);
  const district = snapshot?.districts.find(d => d.id === object.districtId);

  const heroCard     = cards.find(c => c.sectionKey === "hero");
  const overviewCard = cards.find(c => c.sectionKey === "overview");
  const infoCards    = cards.filter(c => c.sectionKey === "info").sort((a, b) => a.sortOrder - b.sortOrder);
  const contactCard  = cards.find(c => c.sectionKey === "contacts");

  const heroImage   = heroCard?.imageUrl ?? object.imageUrl ?? "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2400&q=80";
  const heroVideo   = (heroCard?.payload?.videoUrl as string | undefined) ?? object.videoUrl;
  const description = String(overviewCard?.payload?.text ?? object.description ?? `${object.name} — унікальний об'єкт Одещини.`);
  const address     = String(contactCard?.payload?.address ?? object.address ?? city?.name ?? "Одещина");
  const phone       = String(contactCard?.payload?.phone ?? object.phone ?? "");
  const website     = contactCard?.href ?? object.website ?? "";
  const mapUrl      = object.mapUrl ?? "";
  const hours       = object.hours ?? "";
  const amenities   = object.amenities ?? "";
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

  // related objects helper
  const relatedByType = (relType: string, filter?: PageSection["filter"]) => {
    const inCity = allObjects.filter(o => o.type === relType && o.cityId === object.cityId && o.id !== object.id);
    const inDist = allObjects.filter(o => o.type === relType && o.districtId === object.districtId && o.id !== object.id);
    return applyFilter(inCity.length > 0 ? inCity : inDist, filter);
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
                  <p className="text-[20px] leading-[1.55] font-odesa-regular md:text-[28px]"
                    style={{ color: `${textColor}e6` }}>{description}</p>
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
                    className="scroll-mt-[52px] space-y-4 lg:sticky lg:top-[64px] lg:self-start">
                    <div className="rounded-[28px] border p-7"
                      style={{ backgroundColor: NAVY, color: BG, borderColor: `${m.accent}35`, boxShadow: `0 4px 30px ${m.accent}20` }}>
                      <p className="font-odesa-medium text-[26px] leading-[1.05]">{object.name}</p>
                      <div className="mt-1 h-px w-full bg-white/10" />
                      <div className="mt-5 space-y-4">
                        {address && (
                          <div className="flex items-start gap-3">
                            <MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GOLD }} />
                            <span className="text-[17px] font-odesa-regular leading-[1.35] text-[#fff2e8]/90">{address}</span>
                          </div>
                        )}
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
                        {phone && (
                          <a href={`tel:${phone}`} className="flex items-center gap-3 transition-opacity hover:opacity-75">
                            <Phone className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
                            <span className="text-[17px] font-odesa-regular text-[#fff2e8]/90">{phone}</span>
                          </a>
                        )}
                        {website && (
                          <a href={website} target="_blank" rel="noreferrer"
                            className="flex items-center gap-3 transition-opacity hover:opacity-75">
                            <Globe className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
                            <span className="text-[17px] font-odesa-regular text-[#fff2e8]/90 underline underline-offset-2">Офіційний сайт</span>
                            <ArrowUpRight className="h-4 w-4 text-[#fff2e8]/50" />
                          </a>
                        )}
                      </div>
                      {mapUrl && (
                        <a href={mapUrl} target="_blank" rel="noreferrer"
                          className="mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3 text-[15px] font-odesa-medium transition-opacity hover:opacity-90"
                          style={{ backgroundColor: GOLD, color: NAVY }}>
                          На карті <ArrowRight className="h-4 w-4" />
                        </a>
                      )}
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
                  {address && <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0" style={{ color: GOLD }} /><span className="text-[16px] font-odesa-regular text-[#fff2e8]/90">{address}</span></div>}
                  {phone && <a href={`tel:${phone}`} className="flex items-center gap-3 hover:opacity-75"><Phone className="h-5 w-5 shrink-0" style={{ color: GOLD }} /><span className="text-[16px] font-odesa-regular text-[#fff2e8]/90">{phone}</span></a>}
                  {website && <a href={website} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-75"><Globe className="h-5 w-5 shrink-0" style={{ color: GOLD }} /><span className="text-[16px] font-odesa-regular text-[#fff2e8]/90 underline">Офіційний сайт</span></a>}
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
            style={{ background: `linear-gradient(160deg, ${bg} 0%, ${bg}bb 100%)` }}>
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
        if (!object.eventDates && infoCards.length === 0) return null;
        const bg = section.bgColor ?? schedBg;
        return (
          <section key={section.id} ref={setRef("schedule")}
            className="scroll-mt-[52px] px-4 py-20 text-[#fff2e8] md:px-10"
            style={{ background: `linear-gradient(160deg, ${bg} 0%, ${bg}bb 100%)` }}>
            <div className="mx-auto max-w-[1400px]">
              <ScheduleHeader type={type} accent={m.accent} />
              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {object.eventDates && <InfoTile icon={<Calendar className="h-6 w-6" />} label="Дати проведення" value={object.eventDates} accent={m.accent} />}
                {infoCards.map(card => (
                  <InfoTile key={card.id} icon={<Tag className="h-6 w-6" />} label={card.subtitle ?? ""} value={card.title} accent={m.accent} />
                ))}
              </div>
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
            style={{ background: `linear-gradient(160deg, ${bg} 0%, ${bg}bb 100%)` }}>
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
        const embedUrl = (section.payload?.embedUrl as string | undefined) ?? "";
        if (!embedUrl) return null;
        const bg = section.bgColor ?? BG;
        const titleColor = bg === BG || bg === "#fff2e8" ? NAVY : "#fff2e8";
        return (
          <section key={section.id} className="px-4 py-14 md:px-10" style={{ backgroundColor: bg }}>
            <div className="mx-auto max-w-[1400px]">
              {section.title && (
                <h2 className="mb-6 font-odesa-medium text-[40px] leading-none" style={{ color: titleColor }}>{section.title}</h2>
              )}
              <div className="overflow-hidden rounded-[28px]" style={{ height: "480px" }}>
                <iframe src={embedUrl} title="Карта" loading="lazy" className="h-full w-full border-0" />
              </div>
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
              {section.title && <h2 className="mb-6 font-odesa-medium text-[40px] leading-none text-[#fff2e8]">{section.title}</h2>}
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
                {section.title && <h2 className="mb-6 font-odesa-medium text-[40px] leading-none" style={{ color: textColor }}>{section.title}</h2>}
                <p className="text-[20px] leading-[1.55] font-odesa-regular md:text-[26px]" style={{ color: `${textColor}cc` }}>{text}</p>
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
          <RelatedSection key={section.id} sectionId={`rel-${relType}`} title={section.title}
            type={relType} items={items} bg={bg} setRef={setRef} scroll={scroll} scrollRefs={scrollRefs} />
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
          <img src={heroImage} alt={object.name} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.28)_0%,rgba(0,12,33,0.0)_40%,rgba(0,12,33,0.85)_100%)]" />

        <div className="relative z-20 mx-auto w-full max-w-[1180px] px-4 pt-0 md:px-5">
          <div className="rounded-b-[48px] bg-[#fff2e8] px-6 pb-4 pt-4 text-[#002f5e]">
            <div className="flex items-center justify-between gap-4 font-odesa-medium text-[14px]">
              <Link to={backTo} className="flex items-center gap-2 transition-opacity hover:opacity-70">
                <ChevronLeft className="h-4 w-4" /> Назад
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-[15px] text-[#002f5e]/40">{star}</span>
                <span>{m.label}</span>
                <span className="text-[15px] text-[#002f5e]/40">{star}</span>
                <span>{city?.name ?? district?.name ?? "Одещина"}</span>
              </div>
              <Link to="/" className="transition-opacity hover:opacity-70">Головна</Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col justify-end px-6 pb-10 text-[#fff2e8] md:px-14 md:pb-14">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }}
            className="mb-4 flex flex-wrap items-center gap-2 text-[14px] font-odesa-regular text-[#fff2e8]/65">
            {city && <Link to={`/napryamky/${city.slug}`} className="hover:text-[#fff2e8]">{city.name}</Link>}
            {city && district && <span className="text-[#fff2e8]/30">/</span>}
            {district && <Link to={`/raion/${district.slug}`} className="hover:text-[#fff2e8]">{district.name}</Link>}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="mb-5">
            <span className="inline-block rounded-full px-5 py-2 text-[12px] uppercase tracking-[0.2em] font-odesa-medium backdrop-blur-md shadow-lg"
              style={{ backgroundColor: `${m.accent}40`, color: m.accent, border: `1px solid ${m.accent}70`, boxShadow: `0 0 18px ${m.accent}35` }}>
              {m.label}
            </span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="font-odesa-medium text-[58px] leading-[0.93] md:text-[100px] lg:text-[120px]">
            {object.name}
          </motion.h1>
          {object.subtitle && (
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.12 }}
              className="mt-4 text-[18px] font-odesa-regular text-[#fff2e8]/80 md:text-[26px]">
              {object.subtitle}
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.7 }}
            className="mt-8 flex items-center gap-2 text-[12px] font-odesa-regular text-[#fff2e8]/45">
            <div className="h-px w-10 bg-[#fff2e8]/30" /> Гортайте вниз
          </motion.div>
        </div>
      </section>

      {/* ══════════════════  STICKY NAV  ════════════════════════════════ */}
      <nav className="sticky top-0 z-40 px-4 py-3 backdrop-blur-md md:px-10" style={{ backgroundColor: m.navBg }}>
        <div className="mx-auto max-w-[1400px] overflow-x-auto">
          <div className="flex min-w-max items-center gap-8 font-odesa-medium text-[14px] text-[#fff2e8] md:gap-10 md:text-[18px]">
            <span className="text-[13px] text-[#fff2e8]/50">{star}</span>
            {tabs[type].map(tab => (
              <button key={tab.id} type="button" onClick={() => goTo(tab.id)}
                className="whitespace-nowrap opacity-80 transition-all hover:opacity-100">{tab.label}</button>
            ))}
          </div>
        </div>
      </nav>

      {/* ══════════════════  DYNAMIC SECTIONS  ══════════════════════════ */}
      {activeSections.map(renderSection)}

      {/* ══════════════════  FULL-BLEED IMAGE STRIP  ════════════════════ */}
      <section className="relative h-[50vh] min-h-[320px] overflow-hidden md:h-[60vh]">
        <img src={heroImage} alt={object.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.0)_0%,rgba(0,12,33,0.55)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 text-[#fff2e8] md:px-14">
          <p className="text-[12px] uppercase tracking-[0.25em] font-odesa-medium text-[#fff2e8]/55">
            {city?.name ?? district?.name ?? "Одещина"}
          </p>
          <p className="mt-1 font-odesa-medium text-[36px] leading-none md:text-[52px]">{object.name}</p>
        </div>
      </section>

      <SiteFooter />
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
  sectionId, title, type, items, bg, setRef, scroll, scrollRefs,
}: {
  sectionId: string; title: string; type: string; items: TourismObject[]; bg: string;
  setRef: (id: string) => (el: HTMLElement | null) => void;
  scroll: (key: string, dir: 1 | -1) => void;
  scrollRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}) => (
  <section ref={setRef(sectionId)} className="scroll-mt-[52px] flex h-screen flex-col overflow-x-hidden px-4 py-14 md:px-10"
    style={{ background: `linear-gradient(160deg, ${bg} 0%, ${bg}cc 100%)` }}>
    <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7 }}
        className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-odesa-medium text-[44px] leading-none text-[#fff2e8] md:text-[64px]">{title}</h2>
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
                className="group block h-full w-[270px] overflow-hidden rounded-[26px] transition-transform duration-300 hover:-translate-y-2 md:w-[310px]">
                <div className="relative h-full w-full">
                  <img src={obj.imageUrl ?? "https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=80"}
                    alt={obj.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 35%, ${bg}ee 100%)` }} />
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest font-odesa-medium text-[#fff2e8] backdrop-blur-md"
                      style={{ backgroundColor: `${BADGE_COLOR[obj.type]}cc` }}>
                      {LABEL_SHORT[obj.type]}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="rounded-[18px] bg-black/30 px-4 py-4 backdrop-blur-md" style={{ border: "1px solid rgba(255,242,232,0.2)" }}>
                      <p className="font-odesa-medium text-[20px] leading-[1.1] text-[#fff2e8]">{obj.name}</p>
                      {obj.subtitle && <p className="mt-1 text-[12px] font-odesa-regular text-[#fff2e8]/60 line-clamp-1">{obj.subtitle}</p>}
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-[11px] font-odesa-medium text-[#fff2e8]">
                        Детальніше <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
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
