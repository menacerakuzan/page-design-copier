import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/langContext";
import { Link } from "react-router-dom";
import { ChevronLeft, ArrowRight, MapPin } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { usePageContentCards } from "@/hooks/usePageContentCards";

const ROUTE: Record<string, string> = {
  attraction: "/mistse",
  event: "/podiyi",
  hotel: "/hoteli",
  restaurant: "/restorany",
};

const TYPE_LABEL: Record<string, string> = {
  attraction: "Тур. об'єкт",
  event: "Подія",
  hotel: "Готель",
  restaurant: "Ресторан",
};

const star = "✦";

const TOURISM_TYPES = [
  "Гастрономічний туризм",
  "Історико-культурний туризм",
  "Медико-оздоровчий туризм",
  "Морський туризм",
  "Релігійний туризм",
  "Розважальний туризм",
  "Сільський та зелений туризм",
  "Спортивний туризм",
];

const DEFAULT_IMAGES: Record<string, string> = {
  "Гастрономічний туризм": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
  "Історико-культурний туризм": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=800&q=80",
  "Медико-оздоровчий туризм": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
  "Морський туризм": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
  "Релігійний туризм": "https://images.unsplash.com/photo-1548625149-720094a54a3a?auto=format&fit=crop&w=800&q=80",
  "Розважальний туризм": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
  "Сільський та зелений туризм": "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
  "Спортивний туризм": "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=800&q=80",
};

export default function TourismTypesPage() {
  const { t, tl } = useLang();
  const [activeType, setActiveType] = useState<string | null>(null);
  const { data: snapshot } = useHierarchySnapshot();
  const { data: cardsData } = usePageContentCards("tourism-types");
  // Рендеримо сітку лише коли обидві черги готові — щоб картки змонтувались і
  // анімувались рівно один раз (без повторного «осідання» даних).
  const ready = !!snapshot && !!cardsData;

  const typeImages = useMemo(() => {
    const cards = (cardsData ?? []).filter(c => c.pageKey === "tourism-types");
    const map: Record<string, string> = {};
    cards.forEach(c => { if (c.imageUrl) map[c.title] = c.imageUrl; });
    return map;
  }, [cardsData]);

  const allObjects = useMemo(() => snapshot?.objects?.filter(o => o.published) ?? [], [snapshot]);

  const filteredObjects = useMemo(() => {
    if (!activeType) return [];
    return allObjects.filter(o => o.tourismTypes?.includes(activeType));
  }, [allObjects, activeType]);

  return (
    <div className="min-h-screen bg-[#fff2e8] font-odesa-regular text-[#002f5e]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#002f5e] px-4 pb-20 pt-0 text-[#fff2e8] md:px-10">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.08]"
          style={{ backgroundImage: "url(/shieldtile.svg)", backgroundSize: "180px 203px", backgroundRepeat: "repeat" }} />
        <div className="relative z-10 mx-auto w-full max-w-[1180px]">
          <div className="rounded-b-[48px] bg-[#fff2e8] px-6 pb-4 pt-4 text-[#002f5e]">
            <div className="flex items-center justify-between gap-4 text-[14px] font-odesa-medium">
              <Link to="/" className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70">
                <ChevronLeft className="h-4 w-4" /> {t("backHome")}
              </Link>
              <div className="flex items-center gap-3 text-[#002f5e]/65">
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>Туризм</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>Одещина</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
              </div>
              <Link to="/" className="transition-opacity hover:opacity-70">{t("home")}</Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto mt-16 max-w-[1400px] px-4 md:px-10">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-[12px] uppercase tracking-[0.08em] font-odesa-medium text-[#df9b3b]">
            {t("types")}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 font-odesa-medium text-[56px] leading-[0.92] md:text-[100px]">
            {t("typesTitle")}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-5 max-w-[560px] text-[18px] leading-[1.55] text-[#fff2e8]/65 font-odesa-regular">
            {t("typesDesc")}
          </motion.p>
        </div>
      </section>

      {/* Type grid */}
      <section className="px-4 py-16 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          {!ready ? (
            <div className="flex items-center justify-center py-32">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#002f5e] border-t-transparent" />
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {TOURISM_TYPES.map((type, idx) => {
              const img = typeImages[type] ?? DEFAULT_IMAGES[type] ?? "";
              const isActive = activeType === type;
              const count = allObjects.filter(o => o.tourismTypes?.includes(type)).length;
              return (
                <motion.button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(isActive ? null : type)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  className={`group relative overflow-hidden rounded-[24px] text-left transition-all duration-300 ${isActive ? "ring-4 ring-[#df9b3b] ring-offset-2 ring-offset-[#fff2e8]" : "hover:-translate-y-1"}`}
                  style={{ aspectRatio: "4/3" }}
                >
                  {img ? (
                    <img loading="lazy" decoding="async" src={img} alt={type} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 bg-[#002f5e]" />
                  )}
                  <div className="absolute inset-0"
                    style={{ background: "linear-gradient(160deg, transparent 0%, transparent 30%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0.18) 65%, rgba(0,0,0,0.55) 100%)" }} />
                  {isActive && (
                    <div className="absolute inset-0 bg-[#df9b3b]/20" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-odesa-medium text-[18px] leading-[1.1] text-[#fff2e8] md:text-[20px]">{type}</p>
                    <p className="mt-1 text-[12px] font-odesa-regular text-[#fff2e8]/60">{count} об'єктів</p>
                  </div>
                  {isActive && (
                    <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#df9b3b] text-[#002f5e]">
                      <span className="text-[14px] font-bold">✓</span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* Filtered results */}
      <AnimatePresence>
        {activeType && (
          <motion.section
            key={activeType}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className="px-4 pb-20 md:px-10"
          >
            <div className="mx-auto max-w-[1400px]">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.08em] font-odesa-medium text-[#df9b3b]">{activeType}</p>
                  <h2 className="mt-1 font-odesa-medium text-[40px] leading-none md:text-[56px]">
                    {filteredObjects.length} об'єктів
                  </h2>
                </div>
                <button type="button" onClick={() => setActiveType(null)}
                  className="rounded-full border border-[#002f5e]/20 px-5 py-2 text-[14px] font-odesa-medium text-[#002f5e]/60 transition hover:border-[#002f5e]/40 hover:text-[#002f5e]">
                  Скинути
                </button>
              </div>

              {filteredObjects.length === 0 ? (
                <div className="flex items-center justify-center rounded-[28px] border border-dashed border-[#002f5e]/20 py-24">
                  <p className="text-[18px] text-[#002f5e]/40 font-odesa-regular">Об'єктів цього типу поки немає</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredObjects.map((obj, idx) => (
                    <motion.div key={obj.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.04 }}>
                      <Link to={`${ROUTE[obj.type]}/${obj.slug}`}
                        className="group block overflow-hidden rounded-[22px] border border-[#002f5e]/8 bg-white transition-transform duration-300 hover:-translate-y-1">
                        <div className="relative h-[200px] overflow-hidden">
                          <img loading="lazy" decoding="async" src={obj.imageUrl ?? "https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=80"}
                            alt={obj.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <span className="absolute left-3 top-3 rounded-full bg-[#002f5e]/80 px-3 py-1 text-[11px] font-odesa-medium uppercase tracking-wide text-[#fff2e8] backdrop-blur-sm">
                            {TYPE_LABEL[obj.type]}
                          </span>
                        </div>
                        <div className="p-4">
                          <p className="font-odesa-medium text-[18px] leading-[1.1]">{obj.name}</p>
                          {obj.address && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#002f5e]/50 font-odesa-regular">
                              <MapPin className="h-3.5 w-3.5" /> {obj.address.split("\n")[0]}
                            </p>
                          )}
                          <div className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-odesa-medium text-[#df9b3b]">
                            {t("details")} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <SiteFooter />
    </div>
  );
}
