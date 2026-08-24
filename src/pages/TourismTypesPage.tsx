import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/langContext";
import {
  Layers, Check,
  UtensilsCrossed, Landmark, HeartPulse, Waves, Church, PartyPopper, Leaf, Mountain,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import PageBrow from "@/components/PageBrow";
import { useSeo } from "@/hooks/useSeo";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { ObjectCard } from "@/components/ObjectCard";

const GOLD = "#df9b3b";

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

// Колір + іконка для кожного виду туризму — суто фронтенд-подання (немає
// відповідних полів у БД), ключ — точний рядок із TOURISM_TYPES.
const TYPE_META: Record<string, { color: string; Icon: LucideIcon }> = {
  "Гастрономічний туризм": { color: "#d97706", Icon: UtensilsCrossed },
  "Історико-культурний туризм": { color: "#a16207", Icon: Landmark },
  "Медико-оздоровчий туризм": { color: "#0d9488", Icon: HeartPulse },
  "Морський туризм": { color: "#0284c7", Icon: Waves },
  "Релігійний туризм": { color: "#7c3aed", Icon: Church },
  "Розважальний туризм": { color: "#db2777", Icon: PartyPopper },
  "Сільський та зелений туризм": { color: "#16a34a", Icon: Leaf },
  "Спортивний туризм": { color: "#4f46e5", Icon: Mountain },
};

export default function TourismTypesPage() {
  const { t, tl, lang } = useLang();
  useSeo({ title: t("typesTitle"), description: t("typesDesc"), lang });
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
    <div className="relative min-h-screen bg-[#fff2e8] font-odesa-regular text-[#002f5e]">
      {/* Легкий фоновий патерн (гора, листок, іскра, хвиля — розмаїття видів
          туризму). ВАЖЛИВО: absolute (у потоці сторінки), а не fixed — інакше
          при overscroll на iOS патерн «відклеюється» від бежевого фону і крізь
          нього видно синій html/body. Так само зроблено на робочих сторінках. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "url(/typespattern.svg)", backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.1 }}
      />

      {/* ── Шапка-«бровь»: мобільно — назад, на md+ — повна навігація ──────── */}
      <PageBrow />

      {/* ── Заголовок сторінки ──────────────────────────────────────────── */}
      <div className="container-edge relative z-10 pb-6 pt-8 md:pb-8 md:pt-12">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#002f5e] text-[#fff2e8] md:h-12 md:w-12">
            <Layers className="h-5 w-5" />
          </span>
          <h1 className="text-[34px] leading-[0.95] text-[#002f5e] font-odesa-bold md:text-[46px]">{t("typesTitle")}</h1>
        </div>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.5] text-[#002f5e]/70 font-odesa-regular md:max-w-[640px] md:text-[16px]">
          {t("typesDesc")}
        </p>
      </div>

      <main id="main-content" tabIndex={-1} className="container-edge relative z-10 pb-tabbar md:pb-16">
        {!ready ? (
          <div className="flex items-center justify-center py-32">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#002f5e] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
            {TOURISM_TYPES.map((type, idx) => {
              const meta = TYPE_META[type];
              const Icon = meta.Icon;
              const img = typeImages[type] ?? DEFAULT_IMAGES[type] ?? "";
              const isActive = activeType === type;
              const count = allObjects.filter(o => o.tourismTypes?.includes(type)).length;
              return (
                <motion.button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(isActive ? null : type)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                  className="group relative overflow-hidden rounded-[24px] bg-[#002f5e]/8 text-left transition-transform active:scale-[0.97]"
                  style={{
                    aspectRatio: "1/1",
                    boxShadow: isActive
                      ? `0 0 0 3px ${GOLD}, 0 14px 30px -12px rgba(0,47,94,0.45)`
                      : "0 10px 26px -16px rgba(0,47,94,0.3)",
                  }}
                >
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      aria-hidden
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#002f5e]/10">
                      <Icon className="h-10 w-10 text-[#002f5e]/70" strokeWidth={1.5} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {isActive && (
                    <span
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white"
                      style={{ color: "#002f5e" }}
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                  <div className="relative z-10 flex h-full flex-col justify-end p-4">
                    <p className="text-[15px] leading-tight text-white font-odesa-semi">{type}</p>
                    <p className="mt-0.5 text-[11px] text-white/70 font-odesa-regular">{count} {tl("об'єктів", "objects")}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Відфільтровані результати */}
        <AnimatePresence>
          {activeType && (
            <motion.section
              key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.4 }}
              className="mt-10"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] uppercase tracking-[0.08em] text-[#9c6200] font-odesa-medium">{activeType}</p>
                  <h2 className="mt-1 text-[24px] leading-none text-[#002f5e] font-odesa-bold">
                    {filteredObjects.length} {tl("об'єктів", "objects")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveType(null)}
                  className="shrink-0 rounded-full border border-[#002f5e]/20 px-4 py-1.5 text-[13px] font-odesa-semi text-[#002f5e]/70 transition hover:border-[#002f5e]/40 hover:text-[#002f5e]"
                >
                  {tl("Скинути", "Reset")}
                </button>
              </div>

              {filteredObjects.length === 0 ? (
                <div className="flex items-center justify-center rounded-[26px] border border-dashed border-[#002f5e]/20 py-24">
                  <p className="text-[16px] text-[#002f5e]/70 font-odesa-regular">
                    {tl("Об'єктів цього типу поки немає", "No objects of this type yet")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredObjects.map((obj, idx) => (
                    <ObjectCard key={obj.id} obj={obj} idx={idx} lang={lang} />
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <SiteFooter />
    </div>
  );
}
