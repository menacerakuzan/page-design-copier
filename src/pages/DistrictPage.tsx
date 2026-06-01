import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import NotFound from "@/pages/NotFound";

const NAVY     = "#002f5e";
const GOLD     = "#df9b3b";
const star     = "✦";

const TYPE_ACCENT: Record<string, string> = {
  attraction: "#df9b3b",
  event:      "#e8526a",
  hotel:      "#3ebfa0",
  restaurant: "#f07844",
};

/* badge color on cards — lighter/matching per type */
const BADGE_COLOR: Record<string, string> = {
  attraction: "#6eafd4",   /* light blue  */
  event:      "#e8526a",   /* rose        */
  hotel:      "#3ebfa0",   /* teal        */
  restaurant: "#f07844",   /* orange      */
};

const SECTION_BG: Record<string, string> = {
  attraction: "#001a3d",
  event:      "#3d0820",
  hotel:      "#062820",
  restaurant: "#2a1200",
};

const ROUTE: Record<string, string> = {
  attraction: "/mistse",
  event:      "/podiyi",
  hotel:      "/hoteli",
  restaurant: "/restorany",
};

const LABEL: Record<string, string> = {
  attraction: "Туристичні об'єкти",
  event:      "Події",
  hotel:      "Готелі",
  restaurant: "Ресторани",
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

const DistrictPage = () => {
  const { districtSlug } = useParams<{ districtSlug: string }>();
  const { data: snapshot } = useHierarchySnapshot();
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const district = useMemo(
    () => snapshot?.districts.find((d) => d.slug === districtSlug),
    [snapshot, districtSlug],
  );
  const cities = useMemo(
    () => (snapshot?.cities ?? []).filter((c) => c.districtId === district?.id),
    [snapshot, district],
  );
  const allObjects = useMemo(
    () => (snapshot?.objects ?? []).filter((o) => o.districtId === district?.id),
    [snapshot, district],
  );

  if (!district) return <NotFound />;

  const heroImage = district.imageUrl ?? "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80";

  const sections = (["attraction", "event", "hotel", "restaurant"] as const).map((t) => ({
    type: t as string,
    label: LABEL[t],
    accent: TYPE_ACCENT[t],
    bg: SECTION_BG[t],
    items: allObjects.filter((o) => o.type === t),
  })).filter((s) => s.items.length > 0);

  const setRef = (id: string) => (el: HTMLElement | null) => { refs.current[id] = el; };
  const goTo   = (id: string) => refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scroll = (key: string, dir: 1 | -1) => {
    const el = scrollRefs.current[key];
    if (el) el.scrollBy({ left: dir * 380, behavior: "smooth" });
  };

  return (
    <div className="bg-[#fff2e8] font-odesa-regular text-[#002f5e]">

      {/* ══════════════════  HERO  ══════════════════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden">
        <img src={heroImage} alt={district.name}
          className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.28)_0%,rgba(0,12,33,0.0)_38%,rgba(0,12,33,0.9)_100%)]" />

        {/* top bar */}
        <div className="relative z-20 mx-auto w-full max-w-[1180px] px-4 pt-0 md:px-5">
          <div className="rounded-b-[48px] bg-[#fff2e8] px-6 pb-4 pt-4 text-[#002f5e]">
            <div className="flex items-center justify-between gap-4 text-[14px] font-odesa-medium">
              <div className="w-[160px]">
                <Link to="/" className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70">
                  <ChevronLeft className="h-4 w-4" /> На головну
                </Link>
              </div>
              <div className="flex items-center gap-3 text-[#002f5e]/65">
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>Район</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>Одещина</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
              </div>
              <div className="flex w-[160px] justify-end pr-2">
                <Link to="/" className="transition-opacity hover:opacity-70">Головна</Link>
              </div>
            </div>
          </div>
        </div>

        {/* hero body */}
        <div className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col justify-end px-6 pb-14 text-[#fff2e8] md:px-14 md:pb-15">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-5">
            <span className="inline-block rounded-full border border-white/25 bg-white/10 px-5 py-2 text-[12px] uppercase tracking-[0.2em] font-odesa-medium text-[#fff2e8] backdrop-blur-md">
              Район
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-odesa-medium text-[54px] leading-[0.92] md:text-[100px] lg:text-[118px]"
          >
            {district.name}
          </motion.h1>

          {district.subtitle && (
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.14 }}
              className="mt-4 text-[17px] font-odesa-regular text-[#fff2e8]/75 md:text-[24px]"
            >
              {district.subtitle}
            </motion.p>
          )}

          {/* quick-jump pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.45 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            {cities.length > 0 && (
              <button type="button" onClick={() => goTo("cities")}
                className="rounded-full border border-white/25 bg-white/10 px-5 py-2 text-[13px] font-odesa-medium backdrop-blur-md transition-all hover:bg-white/25 hover:border-white/50"
              >
                Міста
              </button>
            )}
            {sections.map((s) => (
              <button key={s.type} type="button" onClick={() => goTo(s.type)}
                className={`rounded-full border px-5 py-2 text-[13px] font-odesa-medium backdrop-blur-md transition-all hover:bg-white/10`}
                style={s.type === "attraction"
                  ? { borderColor: "#6eafd460", color: "#6eafd4", backgroundColor: "#6eafd418" }
                  : { borderColor: `${s.accent}60`, color: s.accent, backgroundColor: `${s.accent}18` }}
              >
                {LABEL_SHORT[s.type]}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════  DESCRIPTION  ══════════════════════════════ */}
      {district.description && (
        <section className="bg-[#fff2e8] px-4 py-20 md:px-10">
          <div className="mx-auto max-w-[1400px]">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}
            >
              <h2 className="font-odesa-medium text-[44px] leading-none text-[#002f5e] md:text-[68px]">
                Про район
              </h2>
              <p className="mt-6 max-w-[860px] text-[20px] leading-[1.55] font-odesa-regular text-[#002f5e]/75 md:text-[26px]">
                {district.description}
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════  CITIES CAROUSEL  ═══════════════════════════ */}
      {cities.length > 0 && (
        <section
          ref={setRef("cities")}
          className="scroll-mt-[52px] flex h-screen flex-col overflow-x-hidden px-4 py-14 md:px-10"
          style={{ background: "linear-gradient(160deg, #ffdfc6 0%, #fde9da 100%)" }}
        >
          <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col">

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7 }}
              className="mb-7 flex flex-wrap items-end justify-between gap-4"
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] font-odesa-medium text-[#002f5e]/35">напрямки</p>
                <h2 className="mt-1 font-odesa-medium text-[44px] leading-none text-[#002f5e] md:text-[64px]">Міста</h2>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => scroll("cities", -1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20"
                  aria-label="Назад"
                ><ChevronLeft className="h-4 w-4 text-[#002f5e]" /></button>
                <button type="button" onClick={() => scroll("cities", 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20"
                  aria-label="Вперед"
                ><ChevronRight className="h-4 w-4 text-[#002f5e]" /></button>
              </div>
            </motion.div>

            <div
              ref={(el) => { scrollRefs.current["cities"] = el; }}
              className="flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex h-full gap-5 pb-2 pt-3" style={{ width: "max-content" }}>
                {cities.map((c, idx) => (
                  <motion.div key={c.id} className="h-full"
                    initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.6, delay: idx * 0.08 }}
                  >
                    <Link
                      to={`/napryamky/${c.slug}`}
                      className="group block h-full w-[280px] overflow-hidden rounded-[28px] transition-transform duration-300 hover:-translate-y-2 md:w-[340px]"
                    >
                      <div className="relative h-full w-full">
                        <img
                          src={c.imageUrl ?? "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=800&q=80"}
                          alt={c.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,5,20,0.08)_0%,transparent_30%,rgba(0,5,20,0.85)_100%)]" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          {/* bg-black/30 → прозорість фону; backdrop-blur-md → сила розмиття */}
                          <div className="rounded-[20px] bg-black/30 px-5 py-4 backdrop-blur-md" style={{ border: "1px solid rgba(255,242,232,0.2)" }}>
                            <p className="font-odesa-medium text-[24px] leading-[1.05] text-[#fff2e8]">{c.name}</p>
                            {c.subtitle && (
                              <p className="mt-1 text-[13px] font-odesa-regular text-[#fff2e8]/60 line-clamp-1">{c.subtitle}</p>
                            )}
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-[12px] font-odesa-medium text-[#fff2e8]">
                              Відвідати <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
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
      )}

      {/* ══════════════════  OBJECT SECTIONS  ═══════════════════════════ */}
      {sections.map((section) => (
        <section
          key={section.type}
          ref={setRef(section.type)}
          className="scroll-mt-[52px] flex h-screen flex-col overflow-x-hidden px-4 py-14 md:px-10"
          style={{ background: `linear-gradient(160deg, ${section.bg} 0%, ${section.bg}cc 100%)` }}
        >
          <div className="mx-auto flex h-full w-full max-w-[1400px] flex-col">

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7 }}
              className="mb-7 flex flex-wrap items-end justify-between gap-4"
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] font-odesa-medium text-[#fff2e8]/30">
                  {SECTION_CAPTION[section.type]}
                </p>
                <h2 className="mt-1 font-odesa-medium text-[44px] leading-none text-[#fff2e8] md:text-[64px]">
                  {section.label}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => scroll(section.type, -1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-all hover:bg-white/20"
                  aria-label="Назад"
                ><ChevronLeft className="h-4 w-4 text-[#fff2e8]" /></button>
                <button type="button" onClick={() => scroll(section.type, 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-all hover:bg-white/20"
                  aria-label="Вперед"
                ><ChevronRight className="h-4 w-4 text-[#fff2e8]" /></button>
              </div>
            </motion.div>

            <div
              ref={(el) => { scrollRefs.current[section.type] = el; }}
              className="flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex h-full gap-5 pb-2 pt-3" style={{ width: "max-content" }}>
                {section.items.map((obj, idx) => (
                  <motion.div key={obj.id} className="h-full"
                    initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.55, delay: idx * 0.08 }}
                  >
                    <Link
                      to={`${ROUTE[obj.type]}/${obj.slug}`}
                      className="group block h-full w-[270px] overflow-hidden rounded-[26px] transition-transform duration-300 hover:-translate-y-2 md:w-[310px]"
                    >
                      <div className="relative h-full w-full">
                        <img
                          src={obj.imageUrl ?? "https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=80"}
                          alt={obj.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div
                          className="absolute inset-0"
                          style={{ background: `linear-gradient(180deg, transparent 35%, ${section.bg}ee 100%)` }}
                        />
                        <div className="absolute left-4 top-4">
                          <span
                            className="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest font-odesa-medium text-[#fff2e8] backdrop-blur-md"
                            style={{ backgroundColor: `${BADGE_COLOR[obj.type]}cc`, boxShadow: `0 0 12px ${BADGE_COLOR[obj.type]}55` }}
                          >
                            {LABEL_SHORT[obj.type]}
                          </span>
                        </div>
                        {/* bottom blur panel */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="rounded-[18px] bg-black/30 px-4 py-4 backdrop-blur-md" style={{ border: "1px solid rgba(255,242,232,0.2)" }}>
                            <p className="font-odesa-medium text-[20px] leading-[1.1] text-[#fff2e8]">{obj.name}</p>
                            {obj.subtitle && (
                              <p className="mt-1 text-[12px] font-odesa-regular text-[#fff2e8]/60 line-clamp-1">{obj.subtitle}</p>
                            )}
                            {obj.address && (
                              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-odesa-regular text-[#fff2e8]/45">
                                <MapPin className="h-3 w-3" /> {obj.address}
                              </p>
                            )}
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
      ))}

      <SiteFooter />
    </div>
  );
};

export default DistrictPage;
