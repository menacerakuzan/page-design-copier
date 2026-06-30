import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { X, MapPin, Clock, Navigation, ArrowRight, ExternalLink, Globe, Route as RouteIcon, ChevronLeft } from "lucide-react";
import RouteMap from "@/components/RouteMap";
import { Link } from "react-router-dom";
import { loadRoutes, type Route, ROUTE_TAG_OPTIONS, loadRouteTagOrder } from "@/lib/routesRepository";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useLang } from "@/lib/langContext";
import { TourismObject } from "@/types/hierarchy";

// ── Палітра ───────────────────────────────────────────────────────────────
// Ліва панель (детально): глибокий navy-градієнт + gold-акценти.
// Права панель (список): світла cream + gold.
const INK = "#001426";
const NAVY = "#002f5e";
const CREAM = "#fff2e8";
const GOLD = "#e0a542";
const GOLD_SOFT = "#f4c878";
const WINE = "#9f1f47";

const PANEL_BG = `linear-gradient(165deg, #013163 0%, #001a35 55%, ${INK} 100%)`;

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

const typeLabel = (t: string) =>
  t === "attraction" ? "Місце" : t === "event" ? "Подія" : t === "restaurant" ? "Ресторан" : "Готель";

const stopsWord = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "зупинка";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "зупинки";
  return "зупинок";
};

// ── Заголовок секції ────────────────────────────────────────────────────────
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-4 flex items-center gap-3">
    <span className="h-px w-6" style={{ background: GOLD }} />
    <p className="text-[11px] uppercase font-odesa-medium tracking-[0.22em]" style={{ color: GOLD_SOFT }}>
      {children}
    </p>
  </div>
);

// ── Карточка-зупинка таймлайну ──────────────────────────────────────────────
const StopCard = ({ obj }: { obj: TourismObject }) => (
  <Link
    to={`/${objectTypeSlug[obj.type] ?? "mistse"}/${obj.slug}`}
    className="group flex flex-1 items-center gap-3.5 rounded-[18px] p-3 transition-all duration-300 hover:-translate-y-0.5"
    style={{
      background: `linear-gradient(135deg, ${CREAM}14, ${CREAM}07)`,
      border: `1px solid ${CREAM}1c`,
      boxShadow: "0 12px 32px -20px rgba(0,0,0,0.85)",
    }}
  >
    {obj.imageUrl ? (
      <div className="relative h-[60px] w-[80px] shrink-0 overflow-hidden rounded-[13px]">
        <img loading="lazy" decoding="async" src={obj.imageUrl} alt={obj.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
      </div>
    ) : (
      <div className="flex h-[60px] w-[80px] shrink-0 items-center justify-center rounded-[13px]"
        style={{ background: `${GOLD}22` }}>
        <MapPin className="h-5 w-5" style={{ color: GOLD }} />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-[10px] uppercase tracking-wider font-odesa-medium" style={{ color: GOLD_SOFT }}>
        {typeLabel(obj.type)}
      </p>
      <p className="truncate font-odesa-medium text-[15px] leading-tight" style={{ color: CREAM }}>{obj.name}</p>
      {obj.subtitle && (
        <p className="truncate text-[12px] font-odesa-regular" style={{ color: `${CREAM}60` }}>{obj.subtitle}</p>
      )}
    </div>
    <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: GOLD }} />
  </Link>
);

// ── Вертикальний таймлайн зупинок, з'єднаних пунктирною SVG-лінією ───────────
const RouteTimeline = ({ stops }: { stops: TourismObject[] }) => (
  <div className="relative">
    {stops.map((obj, i) => {
      const last = i === stops.length - 1;
      const label = i === 0 ? "A" : last ? "B" : String(i + 1);
      return (
        <motion.div
          key={obj.id}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.45, delay: i * 0.05 }}
          className="relative flex gap-3.5 pb-4 last:pb-0"
        >
          {/* Бейдж + пунктирний з'єднувач */}
          <div className="relative flex w-10 shrink-0 flex-col items-center">
            <div
              className="z-10 flex h-10 w-10 items-center justify-center rounded-full font-odesa-semi text-[14px]"
              style={{
                background: `linear-gradient(135deg, ${GOLD_SOFT}, ${GOLD})`,
                color: NAVY,
                boxShadow: `0 4px 14px ${GOLD}45, 0 0 0 4px ${INK}`,
              }}
            >
              {label}
            </div>
            {!last && (
              <svg className="w-10 flex-1" viewBox="0 0 40 100" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M20 0 C 34 32, 6 68, 20 100"
                  fill="none"
                  stroke={GOLD}
                  strokeWidth="2.5"
                  strokeDasharray="1 7"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.55"
                />
              </svg>
            )}
          </div>
          <StopCard obj={obj} />
        </motion.div>
      );
    })}
  </div>
);

// ── Детальна панель (ліва, темна) ────────────────────────────────────────────
const RouteDetail = ({ route }: { route: Route }) => {
  const { tl } = useLang();
  const { data: snapshot } = useHierarchySnapshot();
  const name = tl(route.name, route.nameEn);
  const content = tl(route.content, route.contentEn);

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

  // Зупинки таймлайну: пов'язані об'єкти, або об'єкти-вейпоінти як запасний варіант.
  const stops = linkedObjects.length > 0
    ? linkedObjects
    : (waypointObjects.map(w => w.object) as TourismObject[]);

  return (
    <motion.div
      key={route.id}
      initial={{ opacity: 0, x: -32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col overflow-y-auto"
      style={{ background: PANEL_BG }}
    >
      {/* Hero image */}
      {route.imageUrl && (
        <div className="relative z-10 h-[220px] shrink-0 overflow-hidden sm:h-[300px]">
          <img loading="lazy" decoding="async" src={route.imageUrl} alt={name} className="h-full w-full object-cover" />
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, rgba(0,20,38,0.15) 0%, transparent 35%, ${INK} 100%)` }} />

          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 sm:px-8 sm:pb-7">
            <div className="mb-2 flex flex-wrap gap-1.5 sm:mb-3 sm:gap-2">
              {route.duration && (
                <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-odesa-medium"
                  style={{ backgroundColor: "rgba(0,0,0,0.4)", color: CREAM, backdropFilter: "blur(8px)", border: `1px solid ${CREAM}1a` }}>
                  <Clock className="h-3 w-3" style={{ color: GOLD_SOFT }} />{route.duration}
                </span>
              )}
              {route.distance && (
                <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-odesa-medium"
                  style={{ backgroundColor: "rgba(0,0,0,0.4)", color: CREAM, backdropFilter: "blur(8px)", border: `1px solid ${CREAM}1a` }}>
                  <Navigation className="h-3 w-3" style={{ color: GOLD_SOFT }} />{route.distance}
                </span>
              )}
            </div>
            <h2 className="font-odesa-medium text-[30px] leading-[0.98] sm:text-[42px]" style={{ color: CREAM }}>{name}</h2>
          </div>
        </div>
      )}

      <div className="relative flex-1 px-5 py-6 sm:px-8 sm:py-8" style={{ background: route.imageUrl ? "transparent" : PANEL_BG }}>
        <div className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "url(/routepage.svg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.05,
            filter: "brightness(0.4)",
          }} />
        <div className="relative z-10 space-y-9">
          {/* Title if no image */}
          {!route.imageUrl && (
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                {route.duration && (
                  <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-odesa-medium"
                    style={{ borderColor: `${CREAM}25`, color: CREAM }}>
                    <Clock className="h-3.5 w-3.5" style={{ color: GOLD_SOFT }} />{route.duration}
                  </span>
                )}
                {route.distance && (
                  <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-odesa-medium"
                    style={{ borderColor: `${CREAM}25`, color: CREAM }}>
                    <Navigation className="h-3.5 w-3.5" style={{ color: GOLD_SOFT }} />{route.distance}
                  </span>
                )}
              </div>
              <h2 className="font-odesa-medium text-[30px] leading-[0.98] sm:text-[42px]" style={{ color: CREAM }}>{name}</h2>
            </div>
          )}

          {/* Short description */}
          {route.description && (
            <p className="text-[16px] font-odesa-regular leading-[1.65]" style={{ color: `${CREAM}85` }}>
              {route.description}
            </p>
          )}

          {/* Таймлайн зупинок (під описом) */}
          {stops.length > 0 && (
            <div>
              <SectionTitle>Маршрут по об'єктах</SectionTitle>
              <RouteTimeline stops={stops} />
            </div>
          )}

          {/* Карта (нижче) */}
          {showMap && route.mapUrl && (
            <div>
              <SectionTitle>Маршрут на карті</SectionTitle>
              <RouteMap mapUrl={route.mapUrl} waypoints={waypointObjects} />
            </div>
          )}

          {/* Кнопки карти */}
          {(route.mapUrl || route.mapUrl2) && (
            <div className="flex flex-col gap-2.5">
              {route.mapUrl && (
                <a href={route.mapUrl} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-[14px] py-3.5 text-[14px] font-odesa-medium transition-transform hover:scale-[1.01]"
                  style={{ background: `linear-gradient(135deg, ${GOLD_SOFT}, ${GOLD})`, color: NAVY }}>
                  <MapPin className="h-4 w-4" /> Відкрити маршрут на карті
                </a>
              )}
              {route.mapUrl2 && (
                <a href={route.mapUrl2} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-[14px] border py-3.5 text-[14px] font-odesa-medium transition-colors hover:bg-white/5"
                  style={{ borderColor: `${CREAM}28`, color: CREAM }}>
                  <MapPin className="h-4 w-4" style={{ color: GOLD_SOFT }} /> Альтернативний маршрут
                </a>
              )}
            </div>
          )}

          {/* Video */}
          {route.videoUrl && (
            <div>
              <SectionTitle>Відео маршруту</SectionTitle>
              <div className="overflow-hidden rounded-[18px]" style={{ border: `1px solid ${CREAM}18` }}>
                {isYoutube(route.videoUrl) ? (
                  <iframe src={youtubeEmbed(route.videoUrl)!} className="w-full"
                    style={{ height: 260, border: "none" }} allow="fullscreen" allowFullScreen />
                ) : (
                  <video src={route.videoUrl} controls muted className="w-full" style={{ maxHeight: 260 }} />
                )}
              </div>
            </div>
          )}

          {/* Rich content */}
          {content && (
            <div className="route-rich-content" dangerouslySetInnerHTML={{ __html: content }} />
          )}

          {/* Useful links */}
          {linksList.length > 0 && (
            <div>
              <SectionTitle>Корисні посилання</SectionTitle>
              <div className="space-y-2">
                {linksList.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-3 rounded-[12px] px-4 py-3 text-[14px] font-odesa-regular transition-colors hover:bg-white/5"
                    style={{ backgroundColor: `${CREAM}08`, border: `1px solid ${CREAM}15`, color: CREAM }}>
                    <Globe className="h-4 w-4 shrink-0" style={{ color: GOLD_SOFT }} />
                    <span className="flex-1 truncate">{l.label}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" style={{ color: `${CREAM}35` }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="h-4" />
        </div>
      </div>
    </motion.div>
  );
};

// ── Карточка маршруту в сайдбарі (світла) ────────────────────────────────────
const RouteCard = ({ route, idx, selected, onClick }: {
  route: Route; idx: number; selected: boolean; onClick: () => void;
}) => {
  const { tl } = useLang();
  const name = tl(route.name, route.nameEn);
  const desc = tl(route.description, route.descriptionEn);

  return (
    <motion.button
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.06 }}
      onClick={onClick}
      className="group w-full overflow-hidden rounded-[20px] text-left transition-all duration-300 hover:-translate-y-0.5"
      style={{
        border: selected ? `1.5px solid ${GOLD}` : `1.5px solid ${NAVY}12`,
        background: selected ? `linear-gradient(135deg, ${GOLD}1f, ${GOLD}0a)` : "white",
        boxShadow: selected ? `0 10px 28px -12px ${GOLD}80` : "0 2px 10px rgba(0,47,94,0.07)",
      }}
    >
      <div className="flex gap-3 p-3">
        {route.imageUrl && (
          <img loading="lazy" decoding="async" src={route.imageUrl} alt={name}
            className="h-16 w-20 shrink-0 rounded-[12px] object-cover" />
        )}
        <div className="min-w-0 flex-1 py-0.5">
          <div className="mb-1.5 flex flex-wrap gap-1">
            {route.duration && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-odesa-medium"
                style={{ backgroundColor: `${GOLD}24`, color: "#a9701f" }}>
                {route.duration}
              </span>
            )}
            {route.distance && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-odesa-medium"
                style={{ backgroundColor: `${NAVY}0d`, color: `${NAVY}70` }}>
                {route.distance}
              </span>
            )}
            {(route.objectIds?.length ?? 0) > 0 && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-odesa-medium"
                style={{ backgroundColor: `${WINE}14`, color: WINE }}>
                {route.objectIds!.length} {stopsWord(route.objectIds!.length)}
              </span>
            )}
          </div>
          <p className="font-odesa-medium text-[15px] leading-[1.15]" style={{ color: NAVY }}>{name}</p>
          {desc && (
            <p className="mt-1 text-[12px] font-odesa-regular line-clamp-2" style={{ color: `${NAVY}60` }}>{desc}</p>
          )}
          {route.tags && route.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {route.tags.map(tagId => {
                const meta = ROUTE_TAG_OPTIONS.find(t => t.id === tagId);
                if (!meta) return null;
                return (
                  <span key={tagId} className="rounded-full px-2 py-0.5 text-[10px] font-odesa-medium"
                    style={{ backgroundColor: `${GOLD}18`, color: "#a9701f" }}>
                    {meta.emoji} {meta.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 self-center transition-transform group-hover:translate-x-0.5"
          style={{ color: selected ? GOLD : `${NAVY}30` }} />
      </div>
    </motion.button>
  );
};

// ── Головний оверлей ─────────────────────────────────────────────────────────
type Props = { open: boolean; onClose: () => void };

const RoutesOverlay = ({ open, onClose }: Props) => {
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["routes-published"],
    queryFn: () => loadRoutes(true),
    enabled: open,
  });
  const [selected, setSelected] = useState<Route | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagOrder, setTagOrder] = useState<string[]>([]);

  useEffect(() => {
    loadRouteTagOrder().then(order => {
      if (order.length > 0) setTagOrder(order);
    });
  }, []);

  const availableTags = useMemo(() => {
    const used = new Set(routes.flatMap(r => r.tags ?? []));
    const allAvailable = ROUTE_TAG_OPTIONS.filter(t => used.has(t.id));
    if (!tagOrder.length) return allAvailable;
    // Sort by saved order, tags not in order go to the end
    return [...allAvailable].sort((a, b) => {
      const ai = tagOrder.indexOf(a.id);
      const bi = tagOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [routes, tagOrder]);

  const filteredRoutes = useMemo(() => {
    if (!activeTag) return routes;
    return routes.filter(r => r.tags?.includes(activeTag));
  }, [routes, activeTag]);

  // Escape: спершу закриває деталі, потім весь оверлей
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selected) setSelected(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selected, onClose]);

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
            style={{ backgroundColor: "rgba(0,10,30,0.7)", backdropFilter: "blur(5px)" }}
            onClick={onClose}
          />

          {/* Детальна панель — ліворуч, темна. z-[52] щоб бути поверх сайдбару (z-50) на мобілі */}
          <AnimatePresence>
            {selected && (
              <motion.div
                key="detail-panel"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                className="fixed left-0 right-0 top-0 z-[52] h-full overflow-hidden shadow-2xl sm:right-[380px]"
              >
                {/* мобільна кнопка «назад до списку» */}
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-odesa-medium sm:hidden"
                  style={{ backgroundColor: "rgba(0,0,0,0.55)", color: CREAM, backdropFilter: "blur(8px)" }}
                  aria-label="До списку маршрутів"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Маршрути
                </button>
                <RouteDetail route={selected} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Сайдбар — праворуч, світлий. На мобілі прихований коли відкрита детальна панель */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col overflow-hidden shadow-2xl sm:w-[380px]"
            style={{ backgroundColor: CREAM }}
          >
            <div className="flex shrink-0 items-center justify-between px-5 py-5"
              style={{ borderBottom: `1px solid ${NAVY}12`, background: `linear-gradient(135deg, #ffffff, ${CREAM})` }}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                  style={{ background: `linear-gradient(135deg, ${GOLD_SOFT}, ${GOLD})` }}>
                  <RouteIcon className="h-5 w-5" style={{ color: NAVY }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-odesa-medium" style={{ color: `${NAVY}45` }}>Одещина</p>
                  <h2 className="mt-0.5 font-odesa-medium text-[24px] leading-none" style={{ color: NAVY }}>Маршрути</h2>
                </div>
              </div>
              <button onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                style={{ backgroundColor: `${NAVY}0d` }}>
                <X className="h-5 w-5" style={{ color: NAVY }} />
              </button>
            </div>

            {/* Filter chips */}
            {availableTags.length > 0 && (
              <div className="shrink-0 px-3 pb-2 pt-1" style={{ borderBottom: `1px solid ${NAVY}0e` }}>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setActiveTag(null)}
                    className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-odesa-medium transition-all"
                    style={{
                      backgroundColor: activeTag === null ? GOLD : `${NAVY}0d`,
                      color: activeTag === null ? NAVY : `${NAVY}60`,
                      border: `1px solid ${activeTag === null ? GOLD : `${NAVY}14`}`,
                    }}
                  >
                    Всі
                  </button>
                  {availableTags.map(tag => {
                    const isActive = activeTag === tag.id;
                    return (
                      <button
                        key={tag.id}
                        onClick={() => setActiveTag(isActive ? null : tag.id)}
                        className="shrink-0 flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12px] font-odesa-medium transition-all"
                        style={{
                          backgroundColor: isActive ? GOLD : `${NAVY}0d`,
                          color: isActive ? NAVY : `${NAVY}60`,
                          border: `1px solid ${isActive ? GOLD : `${NAVY}14`}`,
                        }}
                      >
                        {tag.emoji} {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3">
              {isLoading ? (
                <div className="flex justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-4"
                    style={{ borderColor: `${NAVY}15`, borderTopColor: GOLD }} />
                </div>
              ) : routes.length === 0 ? (
                <p className="py-16 text-center text-[14px] font-odesa-regular" style={{ color: `${NAVY}40` }}>
                  Маршрути незабаром з'являться
                </p>
              ) : filteredRoutes.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[14px] font-odesa-regular" style={{ color: `${NAVY}40` }}>
                    Немає маршрутів у цій категорії
                  </p>
                  <button onClick={() => setActiveTag(null)}
                    className="mt-3 rounded-full px-4 py-1.5 text-[12px] font-odesa-medium transition hover:opacity-80"
                    style={{ backgroundColor: `${NAVY}0d`, color: `${NAVY}60` }}>
                    Показати всі
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {!selected && (
                    <p className="px-2 pb-1 pt-1 text-[12px] font-odesa-regular" style={{ color: `${NAVY}45` }}>
                      <span className="sm:hidden">Оберіть маршрут — деталі відкриються тут</span>
                      <span className="hidden sm:inline">Оберіть маршрут — деталі, зупинки та карта відкриються поруч</span>
                    </p>
                  )}
                  {filteredRoutes.map((route, idx) => (
                    <RouteCard
                      key={route.id}
                      route={route}
                      idx={idx}
                      selected={selected?.id === route.id}
                      onClick={() => setSelected(prev => (prev?.id === route.id ? null : route))}
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
