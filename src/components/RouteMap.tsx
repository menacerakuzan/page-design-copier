import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Maximize2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { TourismObject } from "@/types/hierarchy";

export type WaypointObject = {
  coordIndex: number;
  object: TourismObject;
};

type Props = {
  mapUrl: string;
  waypoints?: WaypointObject[];
};

export function extractCoords(url: string): [number, number][] {
  const pairs: [number, number][] = [];
  const regex = /!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/g;
  let m;
  while ((m = regex.exec(url)) !== null) {
    pairs.push([parseFloat(m[1]), parseFloat(m[2])]);
  }
  return pairs;
}

// ── Палітра ─────────────────────────────────────────────────────────────────
const WINE = "#9f1f47";
const GOLD = "#e0a542";
const GOLD_SOFT = "#f4c878";
const NAVY = "#002f5e";
const CREAM = "#fff2e8";

const objectTypeSlug: Record<string, string> = {
  attraction: "mistse", event: "podiyi", restaurant: "restorany", hotel: "hoteli",
};

const typeLabel = (t: string) =>
  t === "attraction" ? "Місце" : t === "event" ? "Подія" : t === "restaurant" ? "Ресторан" : "Готель";

const lineFeature = (coords: [number, number][]): GeoJSON.Feature => ({
  type: "Feature",
  properties: {},
  geometry: { type: "LineString", coordinates: coords },
});

// Будуємо маршрут по дорогах через публічний OSRM (без ключа).
// Повертає геометрію вздовж доріг або null (тоді лишаються прямі лінії).
async function fetchRoadRoute(coords: [number, number][]): Promise<[number, number][] | null> {
  if (coords.length < 2) return null;
  const path = coords.map(c => `${c[0]},${c[1]}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${path}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const geom = json?.routes?.[0]?.geometry?.coordinates;
    return Array.isArray(geom) && geom.length > 1 ? (geom as [number, number][]) : null;
  } catch {
    return null;
  }
}

export default function RouteMap({ mapUrl, waypoints = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeObj, setActiveObj] = useState<TourismObject | null>(null);
  const [routing, setRouting] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const coords = extractCoords(mapUrl);
    if (coords.length === 0) return;

    let cancelled = false;
    setRouting(true);

    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: [centerLng, centerLat],
      zoom: 8,
      attributionControl: false,
    });

    const fitTo = (pts: [number, number][], maxZoom: number) => {
      const bounds = new maplibregl.LngLatBounds();
      pts.forEach(c => bounds.extend(c));
      map.fitBounds(bounds, { padding: 70, maxZoom });
    };

    map.on("load", async () => {
      // Початково — прямі лінії (миттєво), потім підмінюємо на дороги.
      map.addSource("route", { type: "geojson", data: lineFeature(coords) });

      map.addLayer({
        id: "route-casing",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": CREAM, "line-width": 9, "line-opacity": 0.9 },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": WINE, "line-width": 5 },
      });

      // ── Маркери на оригінальних точках ────────────────────────────────────
      coords.forEach((coord, i) => {
        const isFirst = i === 0;
        const isLast = i === coords.length - 1;
        const wp = waypoints.find(w => w.coordIndex === i);
        const obj = wp?.object;

        const el = document.createElement("div");
        el.className = "rm-marker";

        if (obj?.imageUrl) {
          el.innerHTML = `
            <div class="rm-photo">
              <img loading="lazy" decoding="async" src="${obj.imageUrl}" alt="" />
              <span class="rm-num">${isFirst ? "A" : isLast ? "B" : i}</span>
            </div>`;
        } else {
          const bg = isFirst ? WINE : isLast ? NAVY : GOLD;
          el.innerHTML = `
            <div class="rm-dot ${isFirst || isLast ? "rm-dot-lg" : ""}" style="background:${bg}">
              ${isFirst ? "A" : isLast ? "B" : i}
            </div>`;
        }

        if (obj) {
          el.style.cursor = "pointer";
          el.addEventListener("click", e => {
            e.stopPropagation();
            setActiveObj(prev => (prev?.id === obj.id ? null : obj));
          });
        }

        new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(coord).addTo(map);
      });

      map.on("click", () => setActiveObj(null));
      fitTo(coords, 11);

      // ── Маршрут по дорогах ────────────────────────────────────────────────
      const road = await fetchRoadRoute(coords);
      if (cancelled) return;
      setRouting(false);
      const src = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
      if (road && src) {
        src.setData(lineFeature(road));
        fitTo(road, 14);
      }
    });

    const onFsChange = () => map.resize();
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      cancelled = true;
      document.removeEventListener("fullscreenchange", onFsChange);
      map.remove();
    };
  }, [mapUrl, waypoints]);

  return (
    <div
      className="route-map-wrap relative overflow-hidden rounded-[20px]"
      style={{ border: `1px solid ${CREAM}1f`, boxShadow: "0 18px 50px -22px rgba(0,0,0,0.7)" }}
    >
      <style>{`
        .route-map-wrap:fullscreen { border-radius: 0; }
        .route-map-wrap:fullscreen .route-map-canvas { height: 100vh !important; }
        .rm-marker { will-change: transform; }
        .rm-photo {
          position: relative; width: 46px; height: 46px; border-radius: 50%;
          border: 3px solid ${GOLD}; overflow: hidden; background: ${NAVY};
          box-shadow: 0 4px 14px rgba(0,0,0,0.45); transition: transform .18s ease, box-shadow .18s ease;
        }
        .rm-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .rm-marker:hover .rm-photo { transform: scale(1.12); box-shadow: 0 6px 20px rgba(0,0,0,0.55), 0 0 0 4px ${GOLD}66; }
        .rm-num {
          position: absolute; right: -3px; bottom: -3px; min-width: 18px; height: 18px;
          padding: 0 4px; border-radius: 9px; background: ${GOLD}; color: ${NAVY};
          font: 700 11px/18px sans-serif; text-align: center; border: 2px solid ${CREAM};
        }
        .rm-dot {
          width: 24px; height: 24px; border-radius: 50%; border: 3px solid ${CREAM};
          box-shadow: 0 3px 10px rgba(0,0,0,0.4); display: flex; align-items: center;
          justify-content: center; font: 700 11px/1 sans-serif; color: ${CREAM};
          transition: transform .18s ease;
        }
        .rm-dot-lg { width: 32px; height: 32px; font-size: 13px; }
        .rm-marker:hover .rm-dot { transform: scale(1.18); }
      `}</style>

      <div ref={containerRef} className="route-map-canvas h-[320px] w-full md:h-[460px]" />

      {/* Індикатор побудови маршруту по дорогах */}
      <AnimatePresence>
        {routing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-3 top-3 flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-odesa-medium"
            style={{ backgroundColor: "rgba(0,47,94,0.88)", color: CREAM, backdropFilter: "blur(6px)", zIndex: 10 }}
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: GOLD_SOFT }} />
            Будуємо маршрут…
          </motion.div>
        )}
      </AnimatePresence>

      {/* Кнопка повного екрану */}
      <button
        onClick={() => {
          const el = containerRef.current?.parentElement;
          if (!el) return;
          if (!document.fullscreenElement) el.requestFullscreen();
          else document.exitFullscreen();
        }}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-odesa-medium transition-transform hover:scale-105"
        style={{ backgroundColor: "rgba(0,47,94,0.88)", color: CREAM, backdropFilter: "blur(6px)", zIndex: 10 }}
      >
        <Maximize2 className="h-3.5 w-3.5" />
        На весь екран
      </button>

      {/* Карточка об'єкту — виїжджає справа поверх карти */}
      <AnimatePresence>
        {activeObj && (
          <motion.div
            key={activeObj.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-3 top-3 w-[244px] overflow-hidden rounded-[18px]"
            style={{ backgroundColor: NAVY, border: `1px solid ${CREAM}26`, zIndex: 20, boxShadow: "0 20px 50px -16px rgba(0,0,0,0.8)" }}
          >
            <button
              onClick={() => setActiveObj(null)}
              className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full transition-opacity hover:opacity-70"
              style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", zIndex: 1 }}
            >
              <X className="h-3.5 w-3.5" style={{ color: CREAM }} />
            </button>

            {activeObj.imageUrl && (
              <div className="relative h-[132px] overflow-hidden">
                <img loading="lazy" decoding="async" src={activeObj.imageUrl} alt={activeObj.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 45%, ${NAVY} 100%)` }} />
              </div>
            )}

            <div className="p-4">
              <p className="mb-1 text-[10px] uppercase tracking-wider font-odesa-medium" style={{ color: GOLD_SOFT }}>
                {typeLabel(activeObj.type)}
              </p>
              <p className="font-odesa-medium text-[15px] leading-[1.2]" style={{ color: CREAM }}>{activeObj.name}</p>
              {activeObj.subtitle && (
                <p className="mt-1 text-[12px] font-odesa-regular line-clamp-2" style={{ color: `${CREAM}65` }}>
                  {activeObj.subtitle}
                </p>
              )}

              <Link
                to={`/${objectTypeSlug[activeObj.type] ?? "mistse"}/${activeObj.slug}`}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-[12px] font-odesa-medium transition-transform hover:scale-[1.02]"
                style={{ background: `linear-gradient(135deg, ${GOLD_SOFT}, ${GOLD})`, color: NAVY }}
              >
                Детальніше <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
