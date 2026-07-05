import { useState, useMemo } from "react";
import { Img } from "@/components/Img";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/langContext";
import { Link } from "react-router-dom";
import { ChevronLeft, ArrowRight, MapPin, MapPinned, Landmark } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { objectDetailPath, objectTypeLabel, objectTypeColor } from "@/lib/entityLinks";
import type { District, City, TourismObject } from "@/types/hierarchy";

const GOLD = "#df9b3b";

// Заголовки груп і фільтра рівня 3 — множинні "заголовкові" підписи, окремо
// від objectTypeLabel() з entityLinks.ts (та повертає компактну однину для
// бейджів на картках).
const SECTION_LABEL: Record<string, string> = {
  attraction: "Туристичні об'єкти",
  event:      "Події",
  hotel:      "Готелі",
  restaurant: "Ресторани",
};

// українська плюралізація: pluralUk(5, "пункт", "пункти", "пунктів")
function pluralUk(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const BadgePill = ({ children }: { children: React.ReactNode }) => (
  <span className="flex items-center gap-1.5 rounded-full border border-[#fff2e8]/30 bg-[#002f5e]/30 px-3 py-1 text-[12px] leading-none text-[#fff2e8] backdrop-blur-md font-odesa-medium">
    {children}
  </span>
);

export default function DistrictsPage() {
  const { t, tl, lang } = useLang();
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

  // Дані для блоку заголовка сторінки — окремі для кожного з 3 рівнів.
  const titleIcon = activeCity ? (
    <Landmark className="h-5 w-5" />
  ) : activeDistrict ? (
    <MapPin className="h-5 w-5" />
  ) : (
    <MapPinned className="h-5 w-5" />
  );
  const titleHeading = activeCity
    ? tl(activeCity.name, activeCity.nameEn)
    : activeDistrict
      ? tl(activeDistrict.name, activeDistrict.nameEn)
      : t("districts");
  const titleDescription = activeCity
    ? (activeCity.settlementType ?? tl("оберіть тип об'єкта", "select an object type"))
    : activeDistrict
      ? (tl(activeDistrict.subtitle, activeDistrict.subtitleEn) || tl("оберіть населений пункт", "select a settlement"))
      : t("districtsPageDesc");

  return (
    <div className="relative min-h-screen bg-[#fff2e8] font-odesa-regular text-[#002f5e]">
      {/* Легкий фоновий патерн (роза вітрів — тема районів/дослідження).
          ВАЖЛИВО: absolute (у потоці сторінки), а не fixed — інакше при overscroll
          на iOS патерн «відклеюється» від бежевого фону і крізь нього видно синій
          html/body. Так само зроблено на робочих сторінках. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "url(/districtspattern.svg)", backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.1 }}
      />

      {/* ── Шапка-«бровь» (як на головній), мінімальна: тільки назад ───────── */}
      <div className="container-edge pt-safe relative z-10">
        <div
          className="mt-4 rounded-b-[36px] bg-[#fff2e8] px-4 pb-2.5 pt-2.5"
          style={{ boxShadow: "0 8px 24px -18px rgba(0,47,94,0.35)" }}
        >
          <div className="relative flex items-center justify-center">
            <Link
              to="/"
              aria-label={t("backHome")}
              className="tap absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-[#002f5e] transition-opacity hover:opacity-70"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1
              className="px-2 text-center text-[30px] leading-[0.95] text-[#00376c] font-odesa-medium font-odesa-ss02"
              style={{ letterSpacing: "0.04em" }}
            >
              ОДЕЩИНА
            </h1>
          </div>
        </div>
      </div>

      {/* ── Заголовок сторінки (змінюється залежно від рівня) ──────────────── */}
      <div className="container-edge relative z-10 pb-6 pt-8">
        <motion.div
          key={activeCity?.id ?? activeDistrict?.id ?? "root"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#002f5e] text-[#fff2e8]">
              {titleIcon}
            </span>
            <h2 className="text-[34px] leading-[0.95] text-[#002f5e] font-odesa-bold">{titleHeading}</h2>
          </div>
          <p className="mt-3 max-w-[520px] text-[15px] leading-[1.5] text-[#002f5e]/60 font-odesa-regular">
            {titleDescription}
          </p>
        </motion.div>
      </div>

      <main className="container-edge relative z-10 pb-tabbar md:pb-16">
        {/* initial={false}: на першому відкритті сторінки контейнер не програє
            власну анімацію входу — анімуються лише картки (один прохід, без
            ефекту «подвійного завантаження»). Перемикання рівнів анімується. */}
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
                <div className="space-y-7">
                  {districts.map((d, idx) => {
                    const count = cityCountByDistrict[d.id] ?? 0;
                    return (
                      <motion.div key={d.id}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.5, delay: idx * 0.06 }}
                      >
                        <button
                          type="button"
                          onClick={() => selectDistrict(d)}
                          className="group block w-full overflow-hidden rounded-[26px] bg-[#fffaf3] text-left"
                          style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.06), 0 0 28px -3px rgba(0,47,94,0.3)" }}
                        >
                          <div className="relative h-[170px] overflow-hidden bg-[#002f5e]/10 xs:h-[198px]">
                            {d.imageUrl ? (
                              <Img
                                w={700}
                                src={d.imageUrl}
                                alt={d.name}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <MapPinned className="h-8 w-8 text-[#002f5e]/30" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#002f5e]/85 via-[#002f5e]/15 to-transparent" />
                            {count > 0 && (
                              <div className="absolute left-4 top-4">
                                <BadgePill>
                                  <MapPin className="h-3 w-3" style={{ color: GOLD }} />
                                  {count} {pluralUk(count, "пункт", "пункти", "пунктів")}
                                </BadgePill>
                              </div>
                            )}
                            <div className="absolute bottom-4 left-4 right-4">
                              <h3 className="text-[22px] leading-[0.95] text-[#fff2e8] font-odesa-medium xs:text-[24px]">
                                {tl(d.name, d.nameEn)}
                              </h3>
                              <div className="mt-2 h-[3px] w-9 rounded-full bg-[#df9b3b] transition-all duration-500 group-hover:w-[72px]" />
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
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
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#002f5e]/20 px-4 py-1.5 text-[13px] font-odesa-semi text-[#002f5e]/60 transition hover:border-[#002f5e]/40 hover:text-[#002f5e]">
                <ChevronLeft className="h-4 w-4" /> {tl("Всі райони", "All districts")}
              </button>

              {districtCities.length === 0 ? (
                <div className="flex items-center justify-center rounded-[26px] border border-dashed border-[#002f5e]/20 py-24">
                  <p className="text-[16px] text-[#002f5e]/40 font-odesa-regular">{tl("Населених пунктів поки немає", "No settlements yet")}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {districtCities.map((c, idx) => (
                    <motion.div key={c.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={{ duration: 0.5, delay: idx * 0.06 }}
                    >
                      <button type="button" onClick={() => selectCity(c)}
                        className="group block w-full overflow-hidden rounded-[26px] bg-[#fffaf3] text-left"
                        style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.05), 0 12px 32px -10px rgba(0,47,94,0.22)" }}>
                        <div className="relative h-[170px] overflow-hidden bg-[#002f5e]/10 xs:h-[198px]">
                          {c.imageUrl ? (
                            <Img w={700} src={c.imageUrl} alt={c.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Landmark className="h-8 w-8 text-[#002f5e]/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#002f5e]/85 via-[#002f5e]/15 to-transparent" />
                          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                            {c.settlementType && (
                              <BadgePill>{c.settlementType}</BadgePill>
                            )}
                            {(objectCountByCity[c.id] ?? 0) > 0 && (
                              <BadgePill>
                                <MapPin className="h-3 w-3" style={{ color: GOLD }} />
                                {objectCountByCity[c.id]} {pluralUk(objectCountByCity[c.id], "об'єкт", "об'єкти", "об'єктів")}
                              </BadgePill>
                            )}
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-[22px] leading-[0.95] text-[#fff2e8] font-odesa-medium xs:text-[24px]">{c.name}</h3>
                            <div className="mt-2 h-[3px] w-9 rounded-full bg-[#df9b3b] transition-all duration-500 group-hover:w-[72px]" />
                          </div>
                        </div>
                      </button>
                    </motion.div>
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
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#002f5e]/20 px-4 py-1.5 text-[13px] font-odesa-semi text-[#002f5e]/60 transition hover:border-[#002f5e]/40 hover:text-[#002f5e]">
                <ChevronLeft className="h-4 w-4" /> {activeDistrict?.name}
              </button>

              {/* Фільтр по типах: горизонтальна прокрутка, без стрілок */}
              {objectsByType.length > 0 && (
                <div className="mb-6 flex gap-2 overflow-x-auto p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button type="button" onClick={() => setActiveType(null)}
                    className="shrink-0 rounded-full px-4 py-1.5 text-[13px] font-odesa-semi transition-all duration-200"
                    style={{
                      backgroundColor: !activeType ? GOLD : "rgba(0,47,94,0.07)",
                      color: !activeType ? "#002f5e" : "rgba(0,47,94,0.6)",
                      boxShadow: !activeType ? "0 6px 14px -6px rgba(223,155,59,0.7)" : "none",
                    }}>
                    {tl("Всі", "All")} ({cityObjects.length})
                  </button>
                  {objectsByType.map(({ type, items }) => {
                    const isActive = activeType === type;
                    return (
                      <button key={type} type="button" onClick={() => setActiveType(isActive ? null : type)}
                        className="shrink-0 rounded-full px-4 py-1.5 text-[13px] font-odesa-semi transition-all duration-200"
                        style={{
                          backgroundColor: isActive ? GOLD : "rgba(0,47,94,0.07)",
                          color: isActive ? "#002f5e" : "rgba(0,47,94,0.6)",
                          boxShadow: isActive ? "0 6px 14px -6px rgba(223,155,59,0.7)" : "none",
                        }}>
                        {SECTION_LABEL[type]} ({items.length})
                      </button>
                    );
                  })}
                </div>
              )}

              {cityObjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[26px] border border-dashed border-[#002f5e]/20 py-24">
                  <p className="text-[16px] text-[#002f5e]/40 font-odesa-regular">{tl("Об'єктів поки немає", "No objects yet")}</p>
                  <Link to={`/napryamky/${activeCity.slug}`}
                    className="mt-4 inline-flex items-center gap-2 text-[14px] font-odesa-medium text-[#df9b3b] transition-opacity hover:opacity-70">
                    {tl("Перейти на сторінку міста", "Go to the city page")} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <>
                  {/* Якщо не фільтровано — показуємо по групах */}
                  {!activeType ? (
                    <div className="flex flex-col gap-12">
                      {objectsByType.map(({ type, items }) => (
                        <div key={type}>
                          <div className="mb-4 flex items-center gap-3">
                            <h2 className="text-[22px] leading-none text-[#002f5e] font-odesa-bold">
                              {SECTION_LABEL[type]}
                            </h2>
                            <span className="rounded-full bg-[#002f5e]/8 px-2.5 py-1 text-[12px] leading-none text-[#002f5e]/60 font-odesa-medium">
                              {items.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {items.map((obj, idx) => (
                              <ObjectCard key={obj.id} obj={obj} idx={idx} lang={lang} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {filteredObjects.map((obj, idx) => (
                        <ObjectCard key={obj.id} obj={obj} idx={idx} lang={lang} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SiteFooter />
    </div>
  );
}

const ObjectCard = ({ obj, idx, lang }: { obj: TourismObject; idx: number; lang: "uk" | "en" }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: idx * 0.04 }}>
    <Link to={objectDetailPath(obj.type, obj.slug)}
      className="group block h-full overflow-hidden rounded-[26px] bg-white transition-transform duration-300 hover:-translate-y-1.5"
      style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.05), 0 12px 32px -10px rgba(0,47,94,0.22)" }}>
      <div className="relative h-[170px] overflow-hidden xs:h-[198px]">
        <Img w={500} src={obj.imageUrl ?? "https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=80"}
          alt={obj.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-odesa-medium uppercase tracking-wide text-white backdrop-blur-sm"
          style={{ backgroundColor: `${objectTypeColor[obj.type]}cc` }}>
          {objectTypeLabel(obj.type, lang)}
        </span>
      </div>
      <div className="relative p-3.5">
        <div className="absolute left-0 top-4 h-[22px] w-[3px] rounded-r-full transition-all duration-300 group-hover:h-[32px]"
          style={{ backgroundColor: objectTypeColor[obj.type] }} />
        <p className="font-odesa-medium text-[17px] leading-[1.1] text-[#002f5e]">{obj.name}</p>
        {obj.subtitle && (
          <p className="mt-1 text-[13px] text-[#002f5e]/55 font-odesa-regular line-clamp-1">{obj.subtitle}</p>
        )}
        {obj.address && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#002f5e]/50 font-odesa-regular">
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: objectTypeColor[obj.type] }} /> {obj.address.split("\n")[0]}
          </p>
        )}
        <div className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-odesa-medium" style={{ color: objectTypeColor[obj.type] }}>
          Детальніше <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  </motion.div>
);
