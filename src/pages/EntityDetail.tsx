import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  MapPin,
  Phone,
  Tag,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import NotFound from "@/pages/NotFound";

/* ── palette mirroring Index.tsx ────────────────────────────────── */
const BG       = "#fff2e8";
const NAVY     = "#002f5e";
const BURGUNDY = "#9f1f47";
const GOLD     = "#df9b3b";
const DARK_BG  = "#1c1a15";

const star = "✦";

const meta: Record<string, { label: string; accent: string; navBg: string; schedBg: string }> = {
  attraction: { label: "Місце",     accent: "#df9b3b", navBg: `${NAVY}f0`,      schedBg: "#001a3d" },
  event:      { label: "Подія",     accent: "#e8526a", navBg: `${BURGUNDY}ee`, schedBg: "#3d0820" },
  hotel:      { label: "Готель",    accent: "#3ebfa0", navBg: `${NAVY}f0`,      schedBg: "#062820" },
  restaurant: { label: "Ресторан",  accent: "#f07844", navBg: `${BURGUNDY}ee`, schedBg: "#2a1200" },
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

type PageType = "event" | "hotel" | "restaurant" | "attraction";

const EntityDetail = ({ type }: { type: PageType }) => {
  const params = useParams();
  const slug = params.slug ?? "";
  const pageKey = `detail-${type}-${slug}`;
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const { data: snapshot } = useHierarchySnapshot();
  const { data: cardsData }  = usePageContentCards(pageKey);
  const m = meta[type];

  const object = useMemo(
    () => snapshot?.objects.find((o) => o.slug === slug && o.type === type),
    [snapshot, slug, type],
  );

  const cards = useMemo(
    () => (cardsData ?? []).filter((c) => c.pageKey === pageKey),
    [cardsData, pageKey],
  );

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [slug]);

  if (!object) return <NotFound />;

  const city     = snapshot?.cities.find((c)    => c.id === object.cityId);
  const district = snapshot?.districts.find((d) => d.id === object.districtId);

  const heroCard    = cards.find((c) => c.sectionKey === "hero");
  const overviewCard= cards.find((c) => c.sectionKey === "overview");
  const infoCards   = cards.filter((c) => c.sectionKey === "info").sort((a,b) => a.sortOrder - b.sortOrder);
  const contactCard = cards.find((c) => c.sectionKey === "contacts");

  const heroImage   = heroCard?.imageUrl ?? object.imageUrl   ?? "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2400&q=80";
  const heroVideo   = (heroCard?.payload?.videoUrl as string | undefined) ?? object.videoUrl;
  const description = String(overviewCard?.payload?.text ?? object.description ?? `${object.name} — унікальний об'єкт Одещини.`);
  const address     = String(contactCard?.payload?.address ?? object.address ?? city?.name ?? "Одещина");
  const phone       = String(contactCard?.payload?.phone   ?? object.phone   ?? "");
  const website     = contactCard?.href ?? object.website ?? "";
  const mapUrl      = object.mapUrl ?? "";
  const hours       = object.hours   ?? "";
  const amenities   = object.amenities ?? "";
  const tourismTypes= object.tourismTypes ?? [];
  const backTo      = city ? `/napryamky/${city.slug}` : district ? `/raion/${district.slug}` : "/";

  const setRef = (id: string) => (el: HTMLElement | null) => { refs.current[id] = el; };
  const goTo   = (id: string) => refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="bg-[#fff2e8] text-[#002f5e]">

      {/* ══════════════════  HERO  ══════════════════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden">
        {heroVideo ? (
          <video className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline>
            <source src={heroVideo} type="video/mp4" />
          </video>
        ) : (
          <img src={heroImage} alt={object.name}
            className="absolute inset-0 h-full w-full object-cover" />
        )}
        {/* same gradient formula as Index hero */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.28)_0%,rgba(0,12,33,0.0)_40%,rgba(0,12,33,0.85)_100%)]" />

        {/* top bar — mirrors Index header pill */}
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

        {/* main hero content — bottom */}
        <div className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col justify-end px-6 pb-10 text-[#fff2e8] md:px-14 md:pb-14">
          {/* breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mb-4 flex flex-wrap items-center gap-2 text-[14px] font-odesa-regular text-[#fff2e8]/65"
          >
            {city && <Link to={`/napryamky/${city.slug}`} className="hover:text-[#fff2e8]">{city.name}</Link>}
            {city && district && <span className="text-[#fff2e8]/30">/</span>}
            {district && <Link to={`/raion/${district.slug}`} className="hover:text-[#fff2e8]">{district.name}</Link>}
          </motion.div>

          {/* type badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="mb-5"
          >
            <span
              className="inline-block rounded-full px-5 py-2 text-[12px] uppercase tracking-[0.2em] font-odesa-medium backdrop-blur-md shadow-lg"
              style={{ backgroundColor: `${m.accent}40`, color: m.accent, border: `1px solid ${m.accent}70`, boxShadow: `0 0 18px ${m.accent}35` }}
            >
              {m.label}
            </span>
          </motion.div>

          {/* title */}
          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="font-odesa-medium text-[58px] leading-[0.93] md:text-[100px] lg:text-[120px]"
          >
            {object.name}
          </motion.h1>

          {/* subtitle */}
          {object.subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.12 }}
              className="mt-4 text-[18px] font-odesa-regular text-[#fff2e8]/80 md:text-[26px]"
            >
              {object.subtitle}
            </motion.p>
          )}

          {/* tourism tags */}
          {tourismTypes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-5 flex flex-wrap gap-2"
            >
              {tourismTypes.map((t) => (
                <span key={t}
                  className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] font-odesa-medium backdrop-blur-md"
                  style={{ borderColor: `${m.accent}60`, color: m.accent, backgroundColor: `${m.accent}25`, boxShadow: `0 0 10px ${m.accent}25` }}
                >
                  <Tag className="h-3 w-3" /> {t}
                </span>
              ))}
            </motion.div>
          )}

          {/* quick-info chips (hours / dates on hero) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-7 flex flex-wrap items-center gap-4"
          >
            {hours && (
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-odesa-regular backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5" style={{ color: GOLD }} />
                {hours}
              </div>
            )}
            {object.eventDates && (
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-odesa-regular backdrop-blur-sm">
                <Calendar className="h-3.5 w-3.5" style={{ color: GOLD }} />
                {object.eventDates}
              </div>
            )}
            {address && (
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[13px] font-odesa-regular backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5" style={{ color: GOLD }} />
                {address}
              </div>
            )}
          </motion.div>

          {/* scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.7 }}
            className="mt-8 flex items-center gap-2 text-[12px] font-odesa-regular text-[#fff2e8]/45"
          >
            <div className="h-px w-10 bg-[#fff2e8]/30" /> Гортайте вниз
          </motion.div>
        </div>
      </section>

      {/* ══════════════════  STICKY NAV  ════════════════════════════════ */}
      <nav
        className="sticky top-0 z-40 px-4 py-3 backdrop-blur-md md:px-10"
        style={{ backgroundColor: m.navBg }}
      >
        <div className="mx-auto max-w-[1400px] overflow-x-auto">
          <div className="flex min-w-max items-center gap-8 font-odesa-medium text-[14px] text-[#fff2e8] md:gap-10 md:text-[18px]">
            <span className="text-[13px] text-[#fff2e8]/50">{star}</span>
            {tabs[type].map((tab) => (
              <button key={tab.id} type="button" onClick={() => goTo(tab.id)}
                className="whitespace-nowrap opacity-80 transition-all hover:opacity-100"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ══════════════════  ABOUT SECTION  ═════════════════════════════ */}
      <section
        ref={setRef("about")}
        className="scroll-mt-[52px] bg-[#fff2e8] px-4 py-20 text-[#002f5e] md:px-10"
      >
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[12px] uppercase tracking-[0.25em] font-odesa-medium" style={{ color: m.accent }}>
              {m.label}
            </p>
            <h2 className="mt-2 text-[44px] leading-none font-odesa-medium md:text-[64px]">
              {type === "event" ? "Про подію" : type === "hotel" ? "Про готель" : type === "restaurant" ? "Про ресторан" : "Про місце"}
            </h2>
          </motion.div>

          {/* two-column layout: text left, contact card right */}
          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
            {/* description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.05 }}
            >
              <p className="text-[20px] leading-[1.55] font-odesa-regular text-[#002f5e]/90 md:text-[28px]">
                {description}
              </p>

              {/* tourism type tags */}
              {tourismTypes.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {tourismTypes.map((t) => (
                    <span key={t}
                      className="rounded-full border px-4 py-1.5 text-[14px] font-odesa-medium backdrop-blur-sm"
                      style={{ borderColor: `${m.accent}60`, color: m.accent, backgroundColor: `${m.accent}18`, boxShadow: `0 0 10px ${m.accent}20` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ── Contact / info card  ── */}
            <motion.aside
              ref={setRef("contacts")}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="scroll-mt-[52px] space-y-4 lg:sticky lg:top-[64px] lg:self-start"
            >
              {/* primary card */}
              <div
                className="rounded-[28px] border p-7"
                style={{ backgroundColor: NAVY, color: BG, borderColor: `${m.accent}35`, boxShadow: `0 4px 30px ${m.accent}20` }}
              >
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
                      className="flex items-center gap-3 transition-opacity hover:opacity-75"
                    >
                      <Globe className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
                      <span className="text-[17px] font-odesa-regular text-[#fff2e8]/90 underline underline-offset-2">Офіційний сайт</span>
                      <ArrowUpRight className="h-4 w-4 text-[#fff2e8]/50" />
                    </a>
                  )}
                </div>

                {mapUrl && (
                  <a href={mapUrl} target="_blank" rel="noreferrer"
                    className="mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3 text-[15px] font-odesa-medium transition-opacity hover:opacity-90"
                    style={{ backgroundColor: GOLD, color: NAVY }}
                  >
                    На карті <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>

              {/* city shortcut */}
              {city && (
                <Link to={`/napryamky/${city.slug}`}
                  className="group flex items-center justify-between rounded-[20px] border bg-white/70 px-6 py-4 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
                  style={{ borderColor: `${m.accent}35` }}
                >
                  <div>
                    <p className="text-[12px] font-odesa-medium uppercase tracking-widest text-[#002f5e]/50">Місто</p>
                    <p className="mt-0.5 font-odesa-medium text-[20px] text-[#002f5e]">{city.name}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#002f5e]/40 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              )}
            </motion.aside>
          </div>
        </div>
      </section>

      {/* ══════════════════  SCHEDULE / AMENITIES  ══════════════════════ */}
      {(hours || amenities || object.eventDates || infoCards.length > 0) && (
        <section
          ref={setRef("schedule")}
          className="scroll-mt-[52px] px-4 py-20 text-[#fff2e8] md:px-10"
          style={{ background: `linear-gradient(160deg, ${m.schedBg} 0%, ${m.schedBg}bb 100%)` }}
        >
          <div className="mx-auto max-w-[1400px]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7 }}
              className="flex flex-wrap items-end justify-between gap-6"
            >
              <div>
                <p className="text-[12px] uppercase tracking-[0.25em] font-odesa-medium" style={{ color: m.accent }}>
                  {type === "hotel" ? "Сервіс та зручності" : type === "event" ? "Розклад" : type === "restaurant" ? "Режим роботи" : "Відвідування"}
                </p>
                <h2 className="mt-2 font-odesa-medium text-[44px] leading-none md:text-[64px]">
                  {type === "hotel" ? "Зручності" : type === "event" ? "Деталі" : type === "restaurant" ? "Графік" : "Інформація"}
                </h2>
              </div>
            </motion.div>

            {/* cards grid — exactly like Index "events" grid */}
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {hours && (
                <InfoTile icon={<Clock className="h-6 w-6" />} label="Години роботи" value={hours} accent={m.accent} bg={m.schedBg} />
              )}
              {object.eventDates && (
                <InfoTile icon={<Calendar className="h-6 w-6" />} label="Дати проведення" value={object.eventDates} accent={m.accent} bg={m.schedBg} />
              )}
              {amenities && amenities.split(",").map((a) => (
                <InfoTile key={a.trim()} icon={<Tag className="h-6 w-6" />} label="Зручність" value={a.trim()} accent={m.accent} bg={m.schedBg} />
              ))}
              {infoCards.map((card) => (
                <InfoTile key={card.id}
                  icon={<Tag className="h-6 w-6" />}
                  label={card.subtitle ?? ""}
                  value={card.title}
                  accent={m.accent}
                  bg={m.schedBg}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════  FULL-BLEED IMAGE STRIP  ════════════════════ */}
      <section className="relative h-[50vh] min-h-[320px] overflow-hidden md:h-[60vh]">
        <img src={heroImage} alt={object.name}
          className="h-full w-full object-cover"
        />
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

/* ── reusable info tile ────────────────────────────────────────── */
const InfoTile = ({
  icon, label, value, accent, bg,
}: { icon: React.ReactNode; label: string; value: string; accent: string; bg: string }) => (
  <motion.article
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.5 }}
    className="overflow-hidden rounded-[24px] border backdrop-blur-sm"
    style={{ borderColor: `${accent}30`, backgroundColor: `${accent}10` }}
  >
    {/* vivid accent top strip */}
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

export default EntityDetail;
