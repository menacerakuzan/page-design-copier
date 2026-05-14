import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, Droplets, MapPin, Star, Wind } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import SiteFooter from "@/components/SiteFooter";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useWeather } from "@/hooks/useWeather";
import NotFound from "@/pages/NotFound";

const BG       = "#fff2e8";
const NAVY     = "#002f5e";
const GOLD     = "#df9b3b";
const star     = "✦";

const ROUTE: Record<string, string> = {
  attraction: "/mistse",
  event:      "/podiyi",
  hotel:      "/hoteli",
  restaurant: "/restorany",
};

const SECTION_LABEL: Record<string, string> = {
  attraction: "Місця",
  event:      "Події",
  hotel:      "Готелі",
  restaurant: "Ресторани",
};

/* per-type accent + bg, same as DistrictPage */
const TYPE_ACCENT: Record<string, string> = {
  attraction: "#df9b3b",
  event:      "#e8526a",
  hotel:      "#3ebfa0",
  restaurant: "#f07844",
};
const SECTION_BG: Record<string, string> = {
  attraction: "#001a3d",
  event:      "#3d0820",
  hotel:      "#062820",
  restaurant: "#2a1200",
};

const CityPage = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const { data: snapshot } = useHierarchySnapshot();
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const city = useMemo(
    () => snapshot?.cities.find((c) => c.slug === citySlug),
    [snapshot, citySlug],
  );
  const objects = useMemo(
    () => (snapshot?.objects ?? []).filter((o) => o.cityId === city?.id),
    [snapshot, city],
  );
  const { data: weather } = useWeather(city?.weatherCityName ?? city?.name ?? null);

  if (!city) return <NotFound />;

  const district  = snapshot?.districts.find((d) => d.id === city.districtId);
  const heroImage = city.imageUrl ?? "https://images.unsplash.com/photo-1464817739973-0128fe77aaa1?auto=format&fit=crop&w=2400&q=80";

  const sections = (["attraction", "event", "hotel", "restaurant"] as const).map((t) => ({
    type: t as string,
    label: SECTION_LABEL[t],
    accent: TYPE_ACCENT[t],
    bg: SECTION_BG[t],
    items: objects.filter((o) => o.type === t),
  })).filter((s) => s.items.length > 0);

  const setRef = (id: string) => (el: HTMLElement | null) => { refs.current[id] = el; };
  const goTo   = (id: string) => refs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="bg-[#fff2e8] text-[#002f5e]">

      {/* ══════════════════  HERO  ══════════════════════════════════════ */}
      <section className="relative min-h-screen overflow-hidden">
        <img src={heroImage} alt={city.name}
          className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.28)_0%,rgba(0,12,33,0.0)_40%,rgba(0,12,33,0.9)_100%)]" />

        {/* top bar */}
        <div className="relative z-20 mx-auto w-full max-w-[1180px] px-4 pt-0 md:px-5">
          <div className="rounded-b-[48px] bg-[#fff2e8] px-6 pb-4 pt-4 text-[#002f5e]">
            <div className="flex items-center justify-between gap-4 font-odesa-medium text-[14px]">
              <Link to={district ? `/raion/${district.slug}` : "/"} className="flex items-center gap-2 transition-opacity hover:opacity-70">
                <ChevronLeft className="h-4 w-4" /> Назад
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-[15px] text-[#002f5e]/40">{star}</span>
                <span>Місто</span>
                <span className="text-[15px] text-[#002f5e]/40">{star}</span>
                {district && <span>{district.name}</span>}
              </div>
              <Link to="/" className="transition-opacity hover:opacity-70">Головна</Link>
            </div>
          </div>
        </div>

        {/* hero body */}
        <div className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col justify-end px-6 pb-10 text-[#fff2e8] md:px-14 md:pb-16">

          {/* weather pill — glassmorphism */}
          {weather && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.3 }}
              className="mb-7 inline-flex items-center gap-4 self-start rounded-full border border-white/25 bg-white/12 px-5 py-3 backdrop-blur-md shadow-lg"
            >
              <img src={`https://openweathermap.org/img/wn/${weather.icon}.png`} alt={weather.description} className="h-8 w-8" />
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

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-4">
            <span className="inline-block rounded-full border border-[#df9b3b]/50 bg-[#df9b3b]/25 px-5 py-2 text-[12px] uppercase tracking-[0.2em] font-odesa-medium text-[#df9b3b] backdrop-blur-sm">
              Місто
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-odesa-medium text-[62px] leading-[0.93] md:text-[110px] lg:text-[128px]"
          >
            {city.name}
          </motion.h1>

          {city.subtitle && (
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.14 }}
              className="mt-4 text-[18px] font-odesa-regular text-[#fff2e8]/80 md:text-[26px]"
            >
              {city.subtitle}
            </motion.p>
          )}

          {/* coloured jump pills */}
          {sections.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              {sections.map((s) => (
                <button key={s.type} type="button" onClick={() => goTo(s.type)}
                  className="rounded-full border px-5 py-2 text-[13px] font-odesa-medium backdrop-blur-md transition-all hover:brightness-125"
                  style={{ borderColor: `${s.accent}60`, color: s.accent, backgroundColor: `${s.accent}20` }}
                >
                  {s.label}
                </button>
              ))}
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.7 }}
            className="mt-8 flex items-center gap-2 text-[12px] font-odesa-regular text-[#fff2e8]/35"
          >
            <div className="h-px w-10 bg-[#fff2e8]/20" /> Гортайте вниз
          </motion.div>
        </div>
      </section>

      {/* ══════════════════  ABOUT  ═════════════════════════════════════ */}
      {city.description && (
        <section className="bg-[#fff2e8] px-4 py-20 md:px-10">
          <div className="mx-auto max-w-[1400px]">
            <div className="grid gap-12 lg:grid-cols-[1fr_340px]">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7 }}
              >
                <p className="text-[12px] uppercase tracking-[0.25em] font-odesa-medium" style={{ color: GOLD }}>Про місто</p>
                <h2 className="mt-2 font-odesa-medium text-[44px] leading-none md:text-[64px]">{city.name}</h2>
                <p className="mt-8 text-[20px] leading-[1.55] font-odesa-regular text-[#002f5e]/85 md:text-[28px]">
                  {city.description}
                </p>
              </motion.div>

              {/* stats card */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.7, delay: 0.08 }}
                className="self-start rounded-[28px] p-7"
                style={{ backgroundColor: NAVY, color: BG }}
              >
                <p className="font-odesa-medium text-[22px]">{city.name}</p>
                <div className="mt-2 h-px w-full bg-white/10" />
                {district && (
                  <Link to={`/raion/${district.slug}`}
                    className="mt-5 flex items-center gap-3 transition-opacity hover:opacity-75"
                  >
                    <MapPin className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
                    <span className="text-[17px] font-odesa-regular text-[#fff2e8]/90">{district.name}</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-[#fff2e8]/40" />
                  </Link>
                )}
                {/* colour-coded section chips */}
                <div className="mt-5 flex flex-wrap gap-2">
                  {sections.map((s) => (
                    <button key={s.type} type="button" onClick={() => goTo(s.type)}
                      className="rounded-full border px-3 py-1 text-[12px] font-odesa-medium backdrop-blur-sm transition-all hover:brightness-125"
                      style={{ borderColor: `${s.accent}55`, color: s.accent, backgroundColor: `${s.accent}20` }}
                    >
                      {s.items.length} {s.label.toLowerCase()}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════  OBJECT SECTIONS  ═══════════════════════════ */}
      {sections.map((section) => (
        <section
          key={section.type}
          ref={setRef(section.type)}
          className="scroll-mt-[52px] px-4 py-20 md:px-10"
          style={{ background: `linear-gradient(160deg, ${section.bg} 0%, ${section.bg}cc 100%)` }}
        >
          <div className="mx-auto max-w-[1400px]">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7 }}
              className="flex flex-wrap items-end justify-between gap-4"
            >
              <div>
                <p className="text-[12px] uppercase tracking-[0.25em] font-odesa-medium" style={{ color: section.accent }}>
                  {city.name}
                </p>
                <h2 className="mt-1 font-odesa-medium text-[44px] leading-none text-[#fff2e8] md:text-[64px]">
                  {section.label}
                </h2>
              </div>
              <span
                className="rounded-full border px-5 py-2 text-[13px] font-odesa-medium backdrop-blur-md text-[#fff2e8]/80"
                style={{ borderColor: `${section.accent}50`, backgroundColor: `${section.accent}18` }}
              >
                {section.items.length} {section.label.toLowerCase()}
              </span>
            </motion.div>

            <div className="mt-10 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-5 pb-3" style={{ width: "max-content" }}>
                {section.items.map((obj, idx) => (
                  <motion.div key={obj.id}
                    initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.55, delay: idx * 0.08 }}
                  >
                    <Link
                      to={`${ROUTE[obj.type]}/${obj.slug}`}
                      /* alternate height for variety */
                      className={`group block overflow-hidden rounded-[26px] transition-transform duration-300 hover:-translate-y-2 ${
                        idx % 3 === 0
                          ? "h-[540px] w-[320px] md:h-[580px] md:w-[360px]"
                          : idx % 3 === 1
                          ? "h-[460px] w-[280px] md:h-[500px] md:w-[320px]"
                          : "h-[500px] w-[300px] md:h-[540px] md:w-[340px]"
                      }`}
                    >
                      <div className="relative h-full w-full">
                        <img
                          src={obj.imageUrl ?? "https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=80"}
                          alt={obj.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0"
                          style={{ background: `linear-gradient(180deg, transparent 35%, ${section.bg}f0 100%)` }}
                        />

                        {/* vivid badge */}
                        <div className="absolute left-4 top-4">
                          <span
                            className="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest font-odesa-medium text-[#fff2e8] backdrop-blur-md"
                            style={{ backgroundColor: `${section.accent}cc`, boxShadow: `0 0 14px ${section.accent}60` }}
                          >
                            {SECTION_LABEL[obj.type]}
                          </span>
                        </div>

                        {/* bottom glassmorphism panel */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="rounded-[18px] border border-white/12 bg-black/42 px-4 py-4 backdrop-blur-md">
                            <p className="font-odesa-medium text-[20px] leading-[1.1] text-[#fff2e8]">{obj.name}</p>
                            {obj.subtitle && (
                              <p className="mt-1 text-[12px] font-odesa-regular text-[#fff2e8]/60 line-clamp-1">{obj.subtitle}</p>
                            )}
                            {obj.address && (
                              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-odesa-regular text-[#fff2e8]/50">
                                <MapPin className="h-3 w-3" /> {obj.address}
                              </p>
                            )}
                            <div
                              className="mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-odesa-medium backdrop-blur-sm"
                              style={{ borderColor: `${section.accent}55`, color: section.accent, backgroundColor: `${section.accent}18` }}
                            >
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

      {/* closing strip */}
      <section className="relative h-[45vh] min-h-[280px] overflow-hidden">
        <img src={heroImage} alt={city.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.0)_0%,rgba(0,12,33,0.65)_100%)]" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 text-[#fff2e8] md:px-14">
          <p className="font-odesa-medium text-[38px] leading-none md:text-[56px]">{city.name}</p>
          {city.subtitle && (
            <p className="mt-2 text-[16px] font-odesa-regular text-[#fff2e8]/65">{city.subtitle}</p>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default CityPage;
