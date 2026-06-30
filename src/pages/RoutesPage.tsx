import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Navigation, ArrowRight, X, ChevronLeft, SlidersHorizontal } from "lucide-react";
import { loadRoutes, type Route, ROUTE_TAG_OPTIONS, loadRouteTagOrder } from "@/lib/routesRepository";
import { useLang } from "@/lib/langContext";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import SiteFooter from "@/components/SiteFooter";

const NAVY = "#002f5e";
const CREAM = "#fff2e8";
const GOLD = "#c9973a";

const RouteCard = ({ route, idx, onClick }: { route: Route; idx: number; onClick: () => void }) => {
  const { tl } = useLang();
  const name = tl(route.name, route.nameEn);
  const desc = tl(route.description, route.descriptionEn);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, delay: idx * 0.07 }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-[28px] transition-transform duration-500 group-hover:-translate-y-2"
        style={{ background: NAVY }}>
        {route.imageUrl && (
          <div className="relative h-[260px] overflow-hidden">
            <img loading="lazy" decoding="async" src={route.imageUrl} alt={name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,18,47,0.85) 100%)" }} />
            <div className="absolute bottom-4 left-5 flex gap-2">
              {route.duration && (
                <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-odesa-medium"
                  style={{ backgroundColor: "rgba(0,18,47,0.7)", color: CREAM, backdropFilter: "blur(8px)" }}>
                  <Clock className="h-3 w-3" style={{ color: GOLD }} />
                  {route.duration}
                </span>
              )}
              {route.distance && (
                <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-odesa-medium"
                  style={{ backgroundColor: "rgba(0,18,47,0.7)", color: CREAM, backdropFilter: "blur(8px)" }}>
                  <Navigation className="h-3 w-3" style={{ color: GOLD }} />
                  {route.distance}
                </span>
              )}
            </div>
          </div>
        )}
        <div className="p-6">
          {!route.imageUrl && route.duration && (
            <div className="mb-4 flex gap-2">
              {route.duration && (
                <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-odesa-medium"
                  style={{ borderColor: `${CREAM}20`, color: `${CREAM}70` }}>
                  <Clock className="h-3 w-3" style={{ color: GOLD }} />
                  {route.duration}
                </span>
              )}
              {route.distance && (
                <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-odesa-medium"
                  style={{ borderColor: `${CREAM}20`, color: `${CREAM}70` }}>
                  <Navigation className="h-3 w-3" style={{ color: GOLD }} />
                  {route.distance}
                </span>
              )}
            </div>
          )}
          {route.tags && route.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {route.tags.map(tagId => {
                const meta = ROUTE_TAG_OPTIONS.find(t => t.id === tagId);
                if (!meta) return null;
                return (
                  <span key={tagId} className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-odesa-medium"
                    style={{ backgroundColor: "rgba(201,151,58,0.15)", color: GOLD }}>
                    {meta.emoji} {meta.label}
                  </span>
                );
              })}
            </div>
          )}
          <h3 className="font-odesa-medium text-[22px] leading-[1.1]" style={{ color: CREAM }}>
            {name}
          </h3>
          {desc && (
            <p className="mt-3 line-clamp-3 text-[14px] font-odesa-regular leading-[1.6]"
              style={{ color: `${CREAM}70` }}>
              {desc}
            </p>
          )}
          <div className="mt-5 flex items-center gap-2 text-[13px] font-odesa-medium transition-opacity group-hover:opacity-100"
            style={{ color: GOLD, opacity: 0.7 }}>
            Детальніше <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const RouteModal = ({ route, onClose }: { route: Route; onClose: () => void }) => {
  const { tl } = useLang();
  const name = tl(route.name, route.nameEn);
  const desc = tl(route.description, route.descriptionEn);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center p-4"
      style={{ backgroundColor: "rgba(0,10,30,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[680px] overflow-hidden rounded-[28px] max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: NAVY }}
        onClick={e => e.stopPropagation()}
      >
        {route.imageUrl && (
          <div className="relative h-[200px] shrink-0 sm:h-[280px]">
            <img loading="lazy" decoding="async" src={route.imageUrl} alt={name} className="h-full w-full object-cover" />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,18,47,0.9) 100%)" }} />
          </div>
        )}

        <button onClick={onClose}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-75"
          style={{ backgroundColor: "rgba(0,18,47,0.6)", backdropFilter: "blur(8px)" }}>
          <X className="h-5 w-5" style={{ color: CREAM }} />
        </button>

        <div className="p-7">
          {(route.duration || route.distance) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {route.duration && (
                <span className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] font-odesa-medium"
                  style={{ borderColor: `${CREAM}25`, color: `${CREAM}80` }}>
                  <Clock className="h-3.5 w-3.5" style={{ color: GOLD }} />
                  {route.duration}
                </span>
              )}
              {route.distance && (
                <span className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] font-odesa-medium"
                  style={{ borderColor: `${CREAM}25`, color: `${CREAM}80` }}>
                  <Navigation className="h-3.5 w-3.5" style={{ color: GOLD }} />
                  {route.distance}
                </span>
              )}
            </div>
          )}

          {route.tags && route.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {route.tags.map(tagId => {
                const meta = ROUTE_TAG_OPTIONS.find(t => t.id === tagId);
                if (!meta) return null;
                return (
                  <span key={tagId} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-odesa-medium"
                    style={{ backgroundColor: "rgba(201,151,58,0.12)", color: GOLD }}>
                    {meta.emoji} {meta.label}
                  </span>
                );
              })}
            </div>
          )}
          <h2 className="font-odesa-medium text-[28px] leading-[1.05]" style={{ color: CREAM }}>
            {name}
          </h2>

          {desc && (
            <div className="mt-5 space-y-3 text-[15px] font-odesa-regular leading-[1.7]"
              style={{ color: `${CREAM}80` }}>
              {desc.split("\n").filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {(route.mapUrl || route.mapUrl2) && (
            <div className="mt-7 flex flex-wrap gap-3">
              {route.mapUrl && (
                <a href={route.mapUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-odesa-medium transition-opacity hover:opacity-85"
                  style={{ backgroundColor: GOLD, color: NAVY }}>
                  <MapPin className="h-4 w-4" />
                  Відкрити маршрут
                </a>
              )}
              {route.mapUrl2 && (
                <a href={route.mapUrl2} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-[14px] font-odesa-medium transition-opacity hover:opacity-85"
                  style={{ borderColor: `${CREAM}30`, color: CREAM }}>
                  <MapPin className="h-4 w-4" style={{ color: GOLD }} />
                  Альтернативний маршрут
                </a>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const RoutesPage = () => {
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["routes-published"],
    queryFn: () => loadRoutes(true),
  });
  const [selected, setSelected] = useState<Route | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagOrder, setTagOrder] = useState<string[]>([]);

  useEffect(() => {
    loadRouteTagOrder().then(order => { if (order.length > 0) setTagOrder(order); });
  }, []);

  // Collect tags that actually exist in loaded routes, sorted by saved order
  const availableTags = useMemo(() => {
    const used = new Set(routes.flatMap(r => r.tags ?? []));
    const all = ROUTE_TAG_OPTIONS.filter(t => used.has(t.id));
    if (!tagOrder.length) return all;
    return [...all].sort((a, b) => {
      const ai = tagOrder.indexOf(a.id);
      const bi = tagOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [routes, tagOrder]);

  const filtered = useMemo(() => {
    if (!activeTag) return routes;
    return routes.filter(r => r.tags?.includes(activeTag));
  }, [routes, activeTag]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#001224" }}>
      <AccessibilityMenu />

      {/* Header */}
      <div className="px-4 pt-10 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <Link to="/" className="inline-flex items-center gap-2 text-[13px] font-odesa-medium transition-opacity hover:opacity-70"
            style={{ color: `${CREAM}55` }}>
            <ChevronLeft className="h-4 w-4" /> Головна
          </Link>
        </div>
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="px-4 pb-12 pt-8 md:px-10 md:pt-12"
      >
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] uppercase tracking-[0.35em] font-odesa-medium" style={{ color: `${CREAM}35` }}>
            Одещина
          </p>
          <h1 className="mt-2 font-odesa-medium text-[56px] leading-[0.93] md:text-[88px] lg:text-[110px]"
            style={{ color: CREAM }}>
            Маршрути
          </h1>
          <p className="mt-5 max-w-[520px] text-[17px] font-odesa-regular leading-[1.55]"
            style={{ color: `${CREAM}65` }}>
            Туристичні маршрути Одещини — від винних доріг Бессарабії до морського узбережжя
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      {availableTags.length > 0 && (
        <div className="px-4 pb-8 md:px-10">
          <div className="mx-auto max-w-[1400px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-[12px] font-odesa-medium mr-1"
                style={{ color: `${CREAM}40` }}>
                <SlidersHorizontal className="h-3.5 w-3.5" /> Фільтр:
              </span>
              <button
                onClick={() => setActiveTag(null)}
                className="rounded-full border px-4 py-1.5 text-[13px] font-odesa-medium transition-all duration-200"
                style={{
                  borderColor: activeTag === null ? GOLD : `${CREAM}20`,
                  backgroundColor: activeTag === null ? GOLD : "transparent",
                  color: activeTag === null ? "#001224" : `${CREAM}65`,
                }}
              >
                Всі ({routes.length})
              </button>
              {availableTags.map(tag => {
                const count = routes.filter(r => r.tags?.includes(tag.id)).length;
                const isActive = activeTag === tag.id;
                return (
                  <motion.button
                    key={tag.id}
                    onClick={() => setActiveTag(isActive ? null : tag.id)}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[13px] font-odesa-medium transition-all duration-200"
                    style={{
                      borderColor: isActive ? GOLD : `${CREAM}20`,
                      backgroundColor: isActive ? GOLD : "transparent",
                      color: isActive ? "#001224" : `${CREAM}65`,
                    }}
                  >
                    {tag.emoji} {tag.label}
                    <span className="ml-0.5 text-[11px] opacity-60">({count})</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="px-4 pb-20 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <div className="h-12 w-12 rounded-full border-4 animate-spin"
                style={{ borderColor: `${CREAM}20`, borderTopColor: `${CREAM}80` }} />
            </div>
          ) : routes.length === 0 ? (
            <div className="py-24 text-center text-[17px] font-odesa-regular" style={{ color: `${CREAM}40` }}>
              Маршрути незабаром з'являться
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-24 text-center"
            >
              <p className="text-[17px] font-odesa-regular" style={{ color: `${CREAM}40` }}>
                Маршрутів з цією категорією поки немає
              </p>
              <button onClick={() => setActiveTag(null)}
                className="mt-4 rounded-full border px-5 py-2 text-[13px] font-odesa-medium transition hover:opacity-80"
                style={{ borderColor: `${CREAM}25`, color: `${CREAM}65` }}>
                Показати всі
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTag ?? "all"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filtered.map((route, idx) => (
                  <RouteCard key={route.id} route={route} idx={idx} onClick={() => setSelected(route)} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      <SiteFooter />

      <AnimatePresence>
        {selected && <RouteModal route={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default RoutesPage;
