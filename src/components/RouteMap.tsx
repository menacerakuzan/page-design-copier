import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
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

const WINE  = "#9f1f47";
const GOLD  = "#df9b3b";
const NAVY  = "#002f5e";
const CREAM = "#fff2e8";

const objectTypeSlug: Record<string, string> = {
  attraction: "mistse", event: "podiyi", restaurant: "restorany", hotel: "hoteli",
};

export default function RouteMap({ mapUrl, waypoints = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeObj, setActiveObj] = useState<TourismObject | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const coords = extractCoords(mapUrl);
    if (coords.length === 0) return;

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

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords },
        },
      });

      map.addLayer({
        id: "route-shadow",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#000", "line-width": 7, "line-opacity": 0.12, "line-blur": 4 },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": WINE, "line-width": 4.5, "line-opacity": 0.95 },
      });
      map.addLayer({
        id: "route-dash",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "butt" },
        paint: { "line-color": GOLD, "line-width": 1.5, "line-dasharray": [3, 6], "line-opacity": 0.7 },
      });

      coords.forEach((coord, i) => {
        const isFirst = i === 0;
        const isLast  = i === coords.length - 1;
        const wp  = waypoints.find(w => w.coordIndex === i);
        const obj = wp?.object;

        const el = document.createElement("div");

        if (obj?.imageUrl) {
          el.style.cssText = `
            width:44px;height:44px;border-radius:50%;
            border:3px solid ${GOLD};
            box-shadow:0 3px 12px rgba(0,0,0,0.4);
            overflow:hidden;cursor:pointer;background:${NAVY};
            transition:transform 0.15s;
          `;
          el.style.transition = "box-shadow 0.15s";
          el.onmouseenter = () => { el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.5), 0 0 0 3px ${GOLD}`; };
          el.onmouseleave = () => { el.style.boxShadow = `0 3px 12px rgba(0,0,0,0.4)`; };
          const img = document.createElement("img");
          img.src = obj.imageUrl;
          img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
          el.appendChild(img);
        } else {
          el.style.cssText = `
            width:${isFirst || isLast ? 30 : 22}px;
            height:${isFirst || isLast ? 30 : 22}px;
            border-radius:50%;
            background:${isFirst ? WINE : isLast ? NAVY : GOLD};
            border:3px solid ${CREAM};
            box-shadow:0 2px 8px rgba(0,0,0,0.35);
            display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:700;color:${CREAM};
            cursor:${obj ? "pointer" : "default"};
            font-family:sans-serif;
          `;
          if (obj) {
            el.onmouseenter = () => { el.style.boxShadow = `0 4px 16px rgba(0,0,0,0.5), 0 0 0 3px ${GOLD}`; };
            el.onmouseleave = () => { el.style.boxShadow = `0 2px 8px rgba(0,0,0,0.35)`; };
          }
          el.textContent = isFirst ? "A" : isLast ? "B" : String(i);
        }

        if (obj) {
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            setActiveObj(prev => prev?.id === obj.id ? null : obj);
          });
        }

        new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(coord).addTo(map);
      });

      // Клік по карті — закриває картку
      map.on("click", () => setActiveObj(null));

      const bounds = new maplibregl.LngLatBounds();
      coords.forEach(c => bounds.extend(c));
      map.fitBounds(bounds, { padding: 60, maxZoom: 11 });
    });

    const onFsChange = () => map.resize();
    document.addEventListener("fullscreenchange", onFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      map.remove();
    };
  }, [mapUrl, waypoints]);

  return (
    <div className="route-map-wrap relative overflow-hidden rounded-[18px]"
      style={{ border: `1px solid rgba(255,242,232,0.15)` }}>
      <style>{`
        .route-map-wrap:fullscreen { border-radius: 0; }
        .route-map-wrap:fullscreen .route-map-canvas { height: 100vh !important; }
      `}</style>
      <div ref={containerRef} className="route-map-canvas" style={{ height: 460, width: "100%" }} />

      {/* Кнопка повного екрану */}
      <button
        onClick={() => {
          const el = containerRef.current?.parentElement;
          if (!el) return;
          if (!document.fullscreenElement) el.requestFullscreen();
          else document.exitFullscreen();
        }}
        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-odesa-medium transition-opacity hover:opacity-80"
        style={{ backgroundColor: "rgba(0,47,94,0.85)", color: CREAM, backdropFilter: "blur(6px)", zIndex: 10 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
          <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
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
            className="absolute right-3 top-3 w-[240px] overflow-hidden rounded-[18px] shadow-2xl"
            style={{ backgroundColor: NAVY, border: `1px solid rgba(255,242,232,0.15)`, zIndex: 20 }}
          >
            {/* Закрити */}
            <button
              onClick={() => setActiveObj(null)}
              className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full transition-opacity hover:opacity-70"
              style={{ backgroundColor: "rgba(255,242,232,0.15)", zIndex: 1 }}
            >
              <X className="h-3.5 w-3.5" style={{ color: CREAM }} />
            </button>

            {/* Фото */}
            {activeObj.imageUrl && (
              <div className="h-[130px] overflow-hidden">
                <img src={activeObj.imageUrl} alt={activeObj.name}
                  className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 top-0 h-[130px]"
                  style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,47,94,0.9) 100%)" }} />
              </div>
            )}

            <div className="p-4">
              {/* Тип */}
              <p className="mb-1 text-[10px] uppercase font-odesa-medium"
                style={{ color: GOLD }}>
                {activeObj.type === "attraction" ? "Місце" :
                 activeObj.type === "event" ? "Подія" :
                 activeObj.type === "restaurant" ? "Ресторан" : "Готель"}
              </p>
              <p className="font-odesa-medium text-[15px] leading-[1.2]"
                style={{ color: CREAM }}>{activeObj.name}</p>
              {activeObj.subtitle && (
                <p className="mt-1 text-[12px] font-odesa-regular line-clamp-2"
                  style={{ color: `${CREAM}65` }}>{activeObj.subtitle}</p>
              )}

              <Link
                to={`/${objectTypeSlug[activeObj.type] ?? "mistse"}/${activeObj.slug}`}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-[12px] font-odesa-medium transition-opacity hover:opacity-85"
                style={{ backgroundColor: GOLD, color: NAVY }}
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
