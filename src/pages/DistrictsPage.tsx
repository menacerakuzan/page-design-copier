import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/langContext";
import { Link } from "react-router-dom";
import { ChevronLeft, ArrowRight, ArrowUpRight, MapPin, ChevronRight, X } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import type { District, City, TourismObject } from "@/types/hierarchy";

const star = "✦";

const ROUTE: Record<string, string> = {
  attraction: "/mistse",
  event:      "/podiyi",
  hotel:      "/hoteli",
  restaurant: "/restorany",
};

const TYPE_LABEL: Record<string, string> = {
  attraction: "Туристичні об'єкти",
  event:      "Події",
  hotel:      "Готелі",
  restaurant: "Ресторани",
};

const TYPE_COLOR: Record<string, string> = {
  attraction: "#6eafd4",
  event:      "#e8526a",
  hotel:      "#3ebfa0",
  restaurant: "#f07844",
};

const TYPE_BG: Record<string, string> = {
  attraction: "#001a3d",
  event:      "#3d0820",
  hotel:      "#062820",
  restaurant: "#2a1200",
};

// українська плюралізація: pluralUk(5, "пункт", "пункти", "пунктів")
function pluralUk(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export default function DistrictsPage() {
  const { tl } = useLang();
  const { data: snapshot, isLoading } = useHierarchySnapshot();
  const [activeDistrict, setActiveDistrict] = useState<District | null>(null);
  const [activeCity, setActiveCity] = useState<City | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const districts = useMemo(() =>
    [...(snapshot?.districts ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)),
    [snapshot]);
  const allCities = useMemo(() => snapshot?.cities ?? [], [snapshot]);
  const allObjects = useMemo(() => (snapshot?.objects ?? []).filter(o => o.published), [snapshot]);

  const districtCities = useMemo(() =>
    activeDistrict ? allCities.filter(c => c.districtId === activeDistrict.id) : [],
    [activeDistrict, allCities]
  );

  const cityCountByDistrict = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of allCities) counts[c.districtId] = (counts[c.districtId] ?? 0) + 1;
    return counts;
  }, [allCities]);

  const objectCountByCity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of allObjects) if (o.cityId) counts[o.cityId] = (counts[o.cityId] ?? 0) + 1;
    return counts;
  }, [allObjects]);

  const cityObjects = useMemo(() => {
    if (!activeCity) return [];
    return allObjects.filter(o => o.cityId === activeCity.id);
  }, [activeCity, allObjects]);

  const objectsByType = useMemo(() => {
    const types = ["attraction", "event", "hotel", "restaurant"];
    return types.map(type => ({
      type,
      items: cityObjects.filter(o => o.type === type),
    })).filter(g => g.items.length > 0);
  }, [cityObjects]);

  const filteredObjects = useMemo(() => {
    if (!activeType) return cityObjects;
    return cityObjects.filter(o => o.type === activeType);
  }, [cityObjects, activeType]);

  const selectDistrict = (d: District) => {
    setActiveDistrict(d);
    setActiveCity(null);
    setActiveType(null);
  };

  const selectCity = (c: City) => {
    setActiveCity(c);
    setActiveType(null);
  };

  const goBack = () => {
    if (activeCity) { setActiveCity(null); setActiveType(null); }
    else if (activeDistrict) { setActiveDistrict(null); }
  };

  return (
    <div className="min-h-screen bg-[#fff2e8] font-odesa-regular text-[#002f5e]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#002f5e] pb-20 pt-0 text-[#fff2e8]">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.08]"
          style={{ backgroundImage: "url(/shieldtile.svg)", backgroundSize: "180px 203px", backgroundRepeat: "repeat" }} />
        <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 md:px-5">
          <div className="rounded-b-[48px] bg-[#fff2e8] px-6 pb-4 pt-4 text-[#002f5e]">
            <div className="flex items-center justify-between gap-4 text-[14px] font-odesa-medium">
              <Link to="/" className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70">
                <ChevronLeft className="h-4 w-4" /> На головну
              </Link>
              <div className="flex items-center gap-3 text-[#002f5e]/65">
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>Райони</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>Одещина</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
              </div>
              <Link to="/" className="transition-opacity hover:opacity-70">Головна</Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-16 max-w-[1400px] px-4 md:px-10">
          {/* Breadcrumb */}
          <motion.div layout className="mb-6 flex items-center gap-2 text-[14px] font-odesa-medium text-[#fff2e8]/50">
            <button onClick={() => { setActiveDistrict(null); setActiveCity(null); setActiveType(null); }}
              className={`transition-opacity hover:opacity-100 ${!activeDistrict ? "text-[#fff2e8]" : ""}`}>
              Всі райони
            </button>
            {activeDistrict && (
              <>
                <ChevronRight className="h-4 w-4" />
                <button onClick={() => { setActiveCity(null); setActiveType(null); }}
                  className={`transition-opacity hover:opacity-100 ${!activeCity ? "text-[#fff2e8]" : ""}`}>
                  {activeDistrict.name}
                </button>
              </>
            )}
            {activeCity && (
              <>
                <ChevronRight className="h-4 w-4" />
                <span className="text-[#fff2e8]">{activeCity.name}</span>
              </>
            )}
          </motion.div>

          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
            className="text-[12px] uppercase tracking-[0.08em] font-odesa-medium text-[#df9b3b]">
            {activeCity ? (activeCity.settlementType ?? "місто") : activeDistrict ? tl("оберіть населений пункт", "select a settlement") : tl("оберіть район", "select a district")}
          </motion.p>
          <motion.h1 key={activeCity?.id ?? activeDistrict?.id ?? "root"}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="mt-3 font-odesa-medium text-[56px] leading-[0.92] md:text-[100px]">
            {activeCity ? tl(activeCity.name, activeCity.nameEn) : activeDistrict ? tl(activeDistrict.name, activeDistrict.nameEn) : tl("Райони", "Districts")}
          </motion.h1>
          {!activeDistrict && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}
              className="mt-5 max-w-[560px] text-[18px] leading-[1.55] text-[#fff2e8]/65 font-odesa-regular">
              {tl("Досліджуйте райони Одеської області — оберіть район, населений пункт і знайдіть найкращі місця", "Explore the districts of Odesa region — select a district, settlement and find the best places")}
            </motion.p>
          )}
        </div>
      </section>

      <section className="px-4 py-16 md:px-10">
        <div className="mx-auto max-w-[1400px]">

          {/* ── Рівень 1: Райони ──
              initial={false}: на першому відкритті сторінки контейнер не
              програє власну анімацію входу — анімуються лише картки (один прохід,
              без ефекту «подвійного завантаження»). Перемикання рівнів анімується. */}
          <AnimatePresence mode="wait" initial={false}>
            {!activeDistrict && (
              <motion.div key="districts"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}>
                {isLoading ? (
                  <div className="flex items-center justify-center py-32">
                    <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#002f5e] border-t-transparent" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {districts.map((d, idx) => (
                      <motion.button key={d.id} type="button" onClick={() => selectDistrict(d)}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: idx * 0.03 }}
                        className="group relative overflow-hidden rounded-[28px] text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-22px_rgba(0,47,94,0.45)]"
                        style={{ aspectRatio: "16/9" }}>
                        {d.imageUrl ? (
                          <img src={d.imageUrl} alt={d.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                          <div className="absolute inset-0 bg-[#002f5e]" />
                        )}
                        <div className="absolute inset-0"
                          style={{ background: "linear-gradient(160deg, transparent 0%, transparent 30%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0.18) 65%, rgba(0,0,0,0.65) 100%)" }} />
                        {(cityCountByDistrict[d.id] ?? 0) > 0 && (
                          <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-[12px] leading-none font-odesa-medium text-[#fff2e8] backdrop-blur-md">
                            <MapPin className="h-3 w-3 text-[#df9b3b]" />
                            {cityCountByDistrict[d.id]} {pluralUk(cityCountByDistrict[d.id], "пункт", "пункти", "пунктів")}
                          </span>
                        )}
                        <span className="absolute bottom-5 right-5 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-[#df9b3b] text-[#002f5e] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          <ArrowUpRight className="h-5 w-5" />
                        </span>
                        <div className="absolute bottom-0 left-0 right-16 p-5">
                          <p className="font-odesa-medium text-[26px] leading-[1.05] text-[#fff2e8]">{tl(d.name, d.nameEn)}</p>
                          {d.subtitle && <p className="mt-1 text-[14px] font-odesa-regular text-[#fff2e8]/60">{tl(d.subtitle, d.subtitleEn)}</p>}
                          <div className="mt-3 h-[3px] w-9 rounded-full bg-[#df9b3b] transition-all duration-500 group-hover:w-20" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Рівень 2: Населені пункти ── */}
            {activeDistrict && !activeCity && (
              <motion.div key="cities"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}>
                <button type="button" onClick={goBack}
                  className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#002f5e]/20 px-5 py-2 text-[14px] font-odesa-medium text-[#002f5e]/60 transition hover:border-[#002f5e]/40 hover:text-[#002f5e]">
                  <ChevronLeft className="h-4 w-4" /> Всі райони
                </button>

                {districtCities.length === 0 ? (
                  <div className="flex items-center justify-center rounded-[28px] border border-dashed border-[#002f5e]/20 py-24">
                    <p className="text-[18px] text-[#002f5e]/40">Населених пунктів поки немає</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {districtCities.map((c, idx) => (
                      <motion.button key={c.id} type="button" onClick={() => selectCity(c)}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.025 }}
                        className="group relative overflow-hidden rounded-[22px] text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_44px_-20px_rgba(0,47,94,0.5)]"
                        style={{ aspectRatio: "3/4" }}>
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <div className="absolute inset-0 bg-[#002f5e]/80" />
                        )}
                        <div className="absolute inset-0"
                          style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.72) 100%)" }} />
                        {(objectCountByCity[c.id] ?? 0) > 0 && (
                          <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-1 text-[11px] leading-none font-odesa-medium text-[#fff2e8] backdrop-blur-md">
                            {objectCountByCity[c.id]} {pluralUk(objectCountByCity[c.id], "об'єкт", "об'єкти", "об'єктів")}
                          </span>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          {c.settlementType && (
                            <p className="text-[11px] uppercase tracking-widest font-odesa-medium text-[#df9b3b] mb-1">{c.settlementType}</p>
                          )}
                          <p className="font-odesa-medium text-[18px] leading-[1.1] text-[#fff2e8]">{c.name}</p>
                          {c.subtitle && <p className="mt-0.5 text-[12px] font-odesa-regular text-[#fff2e8]/60 line-clamp-1">{c.subtitle}</p>}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Рівень 3: Об'єкти ── */}
            {activeCity && (
              <motion.div key="objects"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}>
                <button type="button" onClick={goBack}
                  className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#002f5e]/20 px-5 py-2 text-[14px] font-odesa-medium text-[#002f5e]/60 transition hover:border-[#002f5e]/40 hover:text-[#002f5e]">
                  <ChevronLeft className="h-4 w-4" /> {activeDistrict?.name}
                </button>

                {/* Фільтр по типах */}
                {objectsByType.length > 0 && (
                  <div className="mb-8 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setActiveType(null)}
                      className={`rounded-full border px-5 py-2 text-[13px] font-odesa-medium transition ${!activeType ? "border-[#002f5e] bg-[#002f5e] text-[#fff2e8]" : "border-[#002f5e]/20 text-[#002f5e]/60 hover:border-[#002f5e]/40"}`}>
                      Всі
                    </button>
                    {objectsByType.map(({ type, items }) => (
                      <button key={type} type="button" onClick={() => setActiveType(type === activeType ? null : type)}
                        className={`rounded-full border px-5 py-2 text-[13px] font-odesa-medium transition ${activeType === type ? "text-white" : "text-[#002f5e]/60 hover:border-[#002f5e]/40"}`}
                        style={activeType === type
                          ? { backgroundColor: TYPE_COLOR[type], borderColor: TYPE_COLOR[type] }
                          : { borderColor: `${TYPE_COLOR[type]}60`, color: TYPE_COLOR[type], backgroundColor: `${TYPE_COLOR[type]}12` }}>
                        {TYPE_LABEL[type]} · {items.length}
                      </button>
                    ))}
                  </div>
                )}

                {cityObjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[#002f5e]/20 py-24">
                    <p className="text-[18px] text-[#002f5e]/40">Об'єктів поки немає</p>
                    <Link to={`/napryamky/${activeCity.slug}`}
                      className="mt-4 inline-flex items-center gap-2 text-[15px] font-odesa-medium text-[#df9b3b] transition-opacity hover:opacity-70">
                      Перейти на сторінку міста <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Якщо не фільтровано — показуємо по групах */}
                    {!activeType ? (
                      <div className="flex flex-col gap-16">
                        {objectsByType.map(({ type, items }) => (
                          <div key={type}>
                            <div className="mb-6 flex items-center gap-4">
                              <h2 className="font-odesa-medium text-[32px] leading-none" style={{ color: TYPE_BG[type] }}>
                                {TYPE_LABEL[type]}
                              </h2>
                              <span className="rounded-full px-3 py-1 text-[12px] font-odesa-medium text-white"
                                style={{ backgroundColor: TYPE_COLOR[type] }}>
                                {items.length}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {items.map((obj, idx) => (
                                <ObjectCard key={obj.id} obj={obj} idx={idx} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredObjects.map((obj, idx) => (
                          <ObjectCard key={obj.id} obj={obj} idx={idx} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

const ObjectCard = ({ obj, idx }: { obj: TourismObject; idx: number }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: idx * 0.04 }}>
    <Link to={`${ROUTE[obj.type]}/${obj.slug}`}
      className="group block h-full overflow-hidden rounded-[22px] border border-[#002f5e]/8 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_44px_-20px_rgba(0,47,94,0.35)]">
      <div className="relative h-[200px] overflow-hidden">
        <img src={obj.imageUrl ?? "https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=80"}
          alt={obj.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-odesa-medium uppercase tracking-wide text-white backdrop-blur-sm"
          style={{ backgroundColor: `${TYPE_COLOR[obj.type]}cc` }}>
          {TYPE_LABEL[obj.type]}
        </span>
      </div>
      <div className="relative p-4">
        <div className="absolute left-0 top-5 h-[24px] w-[3px] rounded-r-full transition-all duration-300 group-hover:h-[34px]"
          style={{ backgroundColor: TYPE_COLOR[obj.type] }} />
        <p className="font-odesa-medium text-[18px] leading-[1.1]">{obj.name}</p>
        {obj.subtitle && (
          <p className="mt-1 text-[13px] text-[#002f5e]/55 font-odesa-regular line-clamp-1">{obj.subtitle}</p>
        )}
        {obj.address && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#002f5e]/50 font-odesa-regular">
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: TYPE_COLOR[obj.type] }} /> {obj.address.split("\n")[0]}
          </p>
        )}
        <div className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-odesa-medium" style={{ color: TYPE_COLOR[obj.type] }}>
          Детальніше <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  </motion.div>
);
