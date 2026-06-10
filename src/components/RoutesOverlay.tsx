import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, MapPin, Clock, Navigation, ArrowRight, ExternalLink, Globe } from "lucide-react";
import RouteMap from "@/components/RouteMap";
import { Link } from "react-router-dom";
import { loadRoutes, type Route } from "@/lib/routesRepository";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useLang } from "@/lib/langContext";
import { TourismObject } from "@/types/hierarchy";

// ── Кольори ─────────────────────────────────────────────────────────────────
// Ліва панель: WINE + NAVY (темна)
// Права панель: CREAM + GOLD (світла)
const NAVY  = "#002f5e";
const CREAM = "#fff2e8";
const GOLD  = "#df9b3b";
const WINE  = "#9f1f47";

const isYoutube = (url?: string) =>
  !!url && (url.includes("youtube.com") || url.includes("youtu.be"));

const youtubeEmbed = (url: string) => {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m
    ? `https://www.youtube.com/embed/${m[1]}?mute=1&loop=1&playlist=${m[1]}&controls=1&rel=0`
    : null;
};

const hasMapCoords = (url?: string): boolean => {
  if (!url) return false;
  return /!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/.test(url) || /@(-?\d+\.\d+),(-?\d+\.\d+)/.test(url);
};

const objectTypeSlug: Record<string, string> = {
  attraction: "mistse", event: "podiyi", restaurant: "restorany", hotel: "hoteli",
};

// ── Linked object card ──────────────────────────────────────────────────────
const LinkedObjectCard = ({ obj }: { obj: TourismObject }) => (
  <Link
    to={`/${objectTypeSlug[obj.type] ?? "mistse"}/${obj.slug}`}
    className="group flex items-center gap-3 rounded-[14px] p-3 transition-all hover:brightness-110"
    style={{ backgroundColor: `${CREAM}12`, border: `1px solid ${CREAM}20` }}
  >
    {obj.imageUrl && (
      <img src={obj.imageUrl} alt={obj.name}
        className="h-12 w-16 shrink-0 rounded-[10px] object-cover" />
    )}
    <div className="min-w-0 flex-1">
      <p className="truncate font-odesa-medium text-[14px]" style={{ color: CREAM }}>{obj.name}</p>
      {obj.subtitle && (
        <p className="truncate text-[12px] font-odesa-regular" style={{ color: `${CREAM}60` }}>
          {obj.subtitle}
        </p>
      )}
    </div>
    <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
      style={{ color: GOLD }} />
  </Link>
);

// ── Detail panel (left, dark: WINE + NAVY) ──────────────────────────────────
const RouteDetail = ({ route }: { route: Route }) => {
  const { lang } = useLang();
  const { data: snapshot } = useHierarchySnapshot();
  const name    = lang === "en" && route.nameEn    ? route.nameEn    : route.name;
  const content = lang === "en" && route.contentEn ? route.contentEn : route.content;

  const linkedObjects = (route.objectIds ?? [])
    .map(id => snapshot?.objects.find(o => o.id === id && o.published))
    .filter(Boolean) as TourismObject[];

  const linksList = (route.links ?? "").split("\n").filter(Boolean).map(l => {
    const [label, ...rest] = l.split("|");
    return { label: label.trim(), url: (rest.join("|") || label).trim() };
  });

  const showMap = hasMapCoords(route.mapUrl);

  const waypointObjects: import("@/components/RouteMap").WaypointObject[] = (route.waypointObjectIds ?? [])
    .map((id, i) => {
      if (!id) return null;
      const obj = snapshot?.objects.find(o => o.id === id && o.published);
      return obj ? { coordIndex: i, object: obj } : null;
    })
    .filter(Boolean) as import("@/components/RouteMap").WaypointObject[];

  return (
    <motion.div
      key={route.id}
      initial={{ opacity: 0, x: -32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-y-auto"
      style={{ backgroundColor: NAVY }}
    >
      {/* Hero image */}
      {route.imageUrl && (
        <div className="relative z-10 h-[280px] shrink-0 overflow-hidden">
          <img src={route.imageUrl} alt={name} className="h-full w-full object-cover" />
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, transparent 30%, ${NAVY} 100%)` }} />

          <div className="absolute bottom-0 left-0 right-0 px-8 pb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {route.duration && (
                <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-odesa-medium"
                  style={{ backgroundColor: "rgba(0,0,0,0.35)", color: CREAM, backdropFilter: "blur(6px)" }}>
                  <Clock className="h-3 w-3" style={{ color: GOLD }} />{route.duration}
                </span>
              )}
              {route.distance && (
                <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-odesa-medium"
                  style={{ backgroundColor: "rgba(0,0,0,0.35)", color: CREAM, backdropFilter: "blur(6px)" }}>
                  <Navigation className="h-3 w-3" style={{ color: GOLD }} />{route.distance}
                </span>
              )}
            </div>
            <h2 className="font-odesa-medium text-[40px] leading-[1.0]" style={{ color: CREAM }}>{name}</h2>
          </div>
        </div>
      )}

      <div className="relative flex-1 px-8 py-7" style={{ backgroundColor: NAVY }}>
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "url(/routepage.svg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.06,
            filter: "brightness(0.4)",
          }} />
        <div className="relative z-10 space-y-6">
        {/* Title if no image */}
        {!route.imageUrl && (
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {route.duration && (
                <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-odesa-medium"
                  style={{ borderColor: `${CREAM}25`, color: CREAM }}>
                  <Clock className="h-3.5 w-3.5" style={{ color: GOLD }} />{route.duration}
                </span>
              )}
              {route.distance && (
                <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-odesa-medium"
                  style={{ borderColor: `${CREAM}25`, color: CREAM }}>
                  <Navigation className="h-3.5 w-3.5" style={{ color: GOLD }} />{route.distance}
                </span>
              )}
            </div>
            <h2 className="font-odesa-medium text-[40px] leading-[1.0]" style={{ color: CREAM }}>{name}</h2>
          </div>
        )}

        {/* Short description */}
        {route.description && (
          <p className="text-[16px] font-odesa-regular leading-[1.65]"
            style={{ color: `${CREAM}80` }}>
            {route.description}
          </p>
        )}

        {/* Map */}
        {showMap && route.mapUrl && <RouteMap mapUrl={route.mapUrl} waypoints={waypointObjects} />}

        {/* Кнопки карти */}
        <div className="flex flex-col gap-2">
          {route.mapUrl && (
            <a href={route.mapUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-[14px] py-3.5 text-[14px] font-odesa-medium transition-opacity hover:opacity-85"
              style={{ backgroundColor: GOLD, color: NAVY }}>
              <MapPin className="h-4 w-4" /> Відкрити маршрут на карті
            </a>
          )}
          {route.mapUrl2 && (
            <a href={route.mapUrl2} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-[14px] border py-3.5 text-[14px] font-odesa-medium transition-opacity hover:opacity-85"
              style={{ borderColor: `${CREAM}25`, color: CREAM }}>
              <MapPin className="h-4 w-4" style={{ color: GOLD }} /> Альтернативний маршрут
            </a>
          )}
        </div>

        {/* Video */}
        {route.videoUrl && (
          <div className="overflow-hidden rounded-[18px]"
            style={{ border: `1px solid ${CREAM}15` }}>
            {isYoutube(route.videoUrl) ? (
              <iframe src={youtubeEmbed(route.videoUrl)!} className="w-full"
                style={{ height: 260, border: "none" }}
                allow="fullscreen" allowFullScreen />
            ) : (
              <video src={route.videoUrl} controls muted className="w-full"
                style={{ maxHeight: 260 }} />
            )}
          </div>
        )}

        {/* Rich content */}
        {content && (
          <div className="route-rich-content" dangerouslySetInnerHTML={{ __html: content }} />
        )}

        {/* Linked objects */}
        {linkedObjects.length > 0 && (
          <div>
            <p className="mb-3 text-[11px] uppercase font-odesa-medium tracking-widest"
              style={{ color: `${CREAM}35` }}>
              Об'єкти маршруту
            </p>
            <div className="space-y-2">
              {linkedObjects.map(obj => <LinkedObjectCard key={obj.id} obj={obj} />)}
            </div>
          </div>
        )}

        {/* Useful links */}
        {linksList.length > 0 && (
          <div>
            <p className="mb-3 text-[11px] uppercase font-odesa-medium tracking-widest"
              style={{ color: `${CREAM}35` }}>
              Корисні посилання
            </p>
            <div className="space-y-2">
              {linksList.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 rounded-[12px] px-4 py-3 text-[14px] font-odesa-regular transition-all hover:opacity-75"
                  style={{ backgroundColor: `${CREAM}08`, border: `1px solid ${CREAM}15`, color: CREAM }}>
                  <Globe className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
                  <span className="flex-1 truncate">{l.label}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" style={{ color: `${CREAM}35` }} />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="h-6" />
        </div>
      </div>
    </motion.div>
  );
};

// ── Route card in sidebar (light: CREAM + GOLD) ─────────────────────────────
const RouteCard = ({ route, idx, selected, onClick }: {
  route: Route; idx: number; selected: boolean; onClick: () => void;
}) => {
  const { lang } = useLang();
  const name = lang === "en" && route.nameEn ? route.nameEn : route.name;
  const desc = lang === "en" && route.descriptionEn ? route.descriptionEn : route.description;

  return (
    <motion.button
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.06 }}
      onClick={onClick}
      className="group w-full overflow-hidden rounded-[20px] text-left transition-all duration-300"
      style={{
        border: selected ? `1.5px solid ${GOLD}` : `1.5px solid ${NAVY}15`,
        backgroundColor: selected ? `${GOLD}15` : "white",
        boxShadow: selected ? `0 0 0 3px ${GOLD}20` : "0 1px 4px rgba(0,47,94,0.06)",
      }}
    >
      <div className="flex gap-3 p-3">
        {route.imageUrl && (
          <img src={route.imageUrl} alt={name}
            className="h-16 w-20 shrink-0 rounded-[12px] object-cover" />
        )}
        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex flex-wrap gap-1 mb-1.5">
            {route.duration && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-odesa-medium"
                style={{ backgroundColor: `${GOLD}20`, color: GOLD }}>
                {route.duration}
              </span>
            )}
            {route.distance && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-odesa-medium"
                style={{ backgroundColor: `${NAVY}08`, color: `${NAVY}60` }}>
                {route.distance}
              </span>
            )}
          </div>
          <p className="font-odesa-medium text-[15px] leading-[1.15]" style={{ color: NAVY }}>{name}</p>
          {desc && (
            <p className="mt-1 text-[12px] font-odesa-regular line-clamp-2"
              style={{ color: `${NAVY}55` }}>{desc}</p>
          )}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 self-center transition-transform group-hover:translate-x-0.5"
          style={{ color: selected ? GOLD : `${NAVY}25` }} />
      </div>
    </motion.button>
  );
};

// ── Main overlay ────────────────────────────────────────────────────────────
type Props = { open: boolean; onClose: () => void };

const RoutesOverlay = ({ open, onClose }: Props) => {
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["routes-published"],
    queryFn: () => loadRoutes(true),
    enabled: open,
  });
  const [selected, setSelected] = useState<Route | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(0,10,30,0.65)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Detail panel — left, dark (WINE→NAVY) */}
          <AnimatePresence>
            {selected && (
              <motion.div
                key="detail-panel"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-0 z-50 h-full overflow-hidden shadow-2xl"
                style={{ left: 0, right: 380 }}
              >
                <RouteDetail route={selected} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar — right, light (CREAM + GOLD) */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-[380px] flex-col overflow-hidden shadow-2xl"
            style={{ backgroundColor: CREAM }}
          >
            <div className="flex items-center justify-between border-b px-5 py-5 shrink-0"
              style={{ borderColor: `${NAVY}12` }}>
              <div>
                <p className="text-[10px] uppercase font-odesa-medium" style={{ color: `${NAVY}40` }}>Одещина</p>
                <h2 className="mt-0.5 font-odesa-medium text-[24px] leading-none" style={{ color: NAVY }}>Маршрути</h2>
              </div>
              <button onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                style={{ backgroundColor: `${NAVY}10` }}>
                <X className="h-5 w-5" style={{ color: NAVY }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 rounded-full border-4 animate-spin"
                    style={{ borderColor: `${NAVY}15`, borderTopColor: GOLD }} />
                </div>
              ) : routes.length === 0 ? (
                <p className="py-16 text-center text-[14px] font-odesa-regular"
                  style={{ color: `${NAVY}40` }}>
                  Маршрути незабаром з'являться
                </p>
              ) : (
                <div className="space-y-2">
                  {routes.map((route, idx) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      idx={idx}
                      selected={selected?.id === route.id}
                      onClick={() => setSelected(prev => prev?.id === route.id ? null : route)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RoutesOverlay;
