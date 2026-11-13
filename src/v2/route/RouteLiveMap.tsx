import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";
import { useV2 } from "@/v2/i18n";
import type { RouteStop } from "./useRoutePage";

/*
 * Карта маршруту для сторінки маршруту. Підкладка — та сама, що на старій
 * сторінці (CARTO Voyager, векторна, без ключа), трохи приглушена під палітру
 * сайту; шлях — по дорогах (OSRM), поки будується — пунктир по прямій.
 * Маркери — фото-кружки з номером; обрана зупинка (active) більшає, і карта
 * плавно перелітає до неї; без обраної — показує весь маршрут.
 * ТИМЧАСОВО: правильну карту для сайту ще оберемо (див. пам'ять проєкту).
 */

const WINE = "#9f1f47";
const SAND = "#fff2e8";

const feature = (coords: [number, number][]): GeoJSON.Feature => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });

async function roadRoute(coords: [number, number][]): Promise<[number, number][] | null> {
  if (coords.length < 2) return null;
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords.map((c) => c.join(",")).join(";")}?overview=full&geometries=geojson`);
    if (!res.ok) return null;
    const geom = (await res.json())?.routes?.[0]?.geometry?.coordinates;
    return Array.isArray(geom) && geom.length > 1 ? geom : null;
  } catch {
    return null;
  }
}

export function RouteLiveMap({ stops, line, active, onPick, roads = true, className = "" }: {
  stops: RouteStop[];
  line: [number, number][];
  active: number | null;
  onPick?: (i: number) => void;
  /** Будувати шлях по дорогах (для водних і пішохідних маршрутів — ні). */
  roads?: boolean;
  className?: string;
}) {
  const { lang } = useV2();
  const box = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<HTMLElement[]>([]);
  const all = useRef<maplibregl.LngLatBounds | null>(null);
  const [routing, setRouting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [full, setFull] = useState(false);
  // Карта готова (стиль і маркери є). Не m.loaded(): під час перельоту карта
  // довантажує тайли й loaded() = false — і новий переліт ігнорувався.
  const ready = useRef(false);
  const pick = useRef(onPick);
  pick.current = onPick;

  const placed = stops.filter((s) => s.lng != null && s.lat != null);

  useEffect(() => {
    if (!box.current || !line.length) return;
    let cancelled = false;
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({
        container: box.current,
        style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
        center: line[0],
        zoom: 8,
        attributionControl: { compact: true },
        // ПК: колесо миші над картою одразу наближає (без Ctrl). Телефон: карту
        // рухають двома пальцями, щоб одним можна було гортати сторінку.
        cooperativeGestures: typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches,
      });
    } catch {
      setFailed(true);
      return;
    }
    map.current = m;
    const bounds = new maplibregl.LngLatBounds();
    line.forEach((c) => bounds.extend(c));
    placed.forEach((s) => bounds.extend([s.lng!, s.lat!]));
    all.current = bounds;

    m.on("load", async () => {
      // Підписи — українською (у стилі CARTO першою йде англійська назва)
      const nameExpr = lang === "en" ? ["coalesce", ["get", "name:en"], ["get", "name"]] : ["coalesce", ["get", "name:uk"], ["get", "name"]];
      for (const l of m.getStyle().layers ?? []) {
        if (l.type === "symbol" && l.id !== "housenumber" && m.getLayoutProperty(l.id, "text-field")) {
          try {
            m.setLayoutProperty(l.id, "text-field", nameExpr as maplibregl.ExpressionSpecification);
          } catch {
            /* шар без підпису */
          }
        }
      }
      m.addSource("route", { type: "geojson", data: feature(line) });
      m.addLayer({ id: "route-casing", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": SAND, "line-width": 8, "line-opacity": 0.95 } });
      m.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": WINE, "line-width": 3.5, "line-dasharray": [0.1, 2.2] },
      });

      markers.current = placed.map((s) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "rlm-marker";
        el.setAttribute("aria-label", `${s.n}. ${s.name}`);
        el.innerHTML = `<span class="rlm-wrap"><span class="rlm-photo">${s.o.imageUrl ? `<img src="${s.o.imageUrl}" alt="" loading="lazy" decoding="async"/>` : ""}</span><span class="rlm-num">${s.n}</span></span>`;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          pick.current?.(s.n - 1);
        });
        new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([s.lng!, s.lat!]).addTo(m);
        return el;
      });

      m.fitBounds(bounds, { padding: 70, maxZoom: 12, duration: 0 });
      ready.current = true;

      if (roads && line.length > 1) {
        setRouting(true);
        const road = await roadRoute(line);
        if (cancelled) return;
        setRouting(false);
        const src = m.getSource("route") as maplibregl.GeoJSONSource | undefined;
        if (road && src) {
          src.setData(feature(road));
          m.setPaintProperty("route-line", "line-dasharray", [1, 0]);
        }
      }
    });
    m.on("error", () => {});

    return () => {
      cancelled = true;
      ready.current = false;
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line, roads, lang]);

  // Обрана зупинка: маркер більшає, карта перелітає до неї; без обраної — весь маршрут
  useEffect(() => {
    const m = map.current;
    markers.current.forEach((el, i) => el.classList.toggle("is-active", placed[i] && active === placed[i].n - 1));
    if (!m || !ready.current) return;
    m.stop(); // попередній переліт — зупинити, новий починається звідси
    const s = active != null ? stops[active] : null;
    // Не надто близько — щоб навколо зупинки було видно місцевість і сусідні міста
    if (s?.lng != null && s.lat != null) m.flyTo({ center: [s.lng, s.lat], zoom: 10.5, speed: 0.9, curve: 1.3, essential: true });
    else if (active == null && all.current) m.fitBounds(all.current, { padding: 70, maxZoom: 12, duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const toggleFull = () => {
    const el = wrap.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().then(() => setFull(true)).catch(() => {});
    else document.exitFullscreen().then(() => setFull(false)).catch(() => {});
  };
  useEffect(() => {
    const on = () => {
      setFull(!!document.fullscreenElement);
      map.current?.resize();
    };
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  return (
    <div ref={wrap} className={`rlm relative overflow-hidden rounded-[24px] bg-[#efe6da] ring-1 ring-o-sea/10 ${className}`}>
      <div ref={box} className="h-full w-full [&_.maplibregl-canvas]:[filter:saturate(0.7)_sepia(0.12)]" />
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-[14px] text-o-sea/60">
          {lang === "en" ? "The map could not load in this browser." : "Карта не завантажилась у цьому браузері."}
        </div>
      )}
      {routing && (
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-o-sand/95 px-3 py-1.5 text-[12px] font-semibold text-o-sea shadow-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-o-wine" aria-hidden="true" />
          {lang === "en" ? "Building the route…" : "Будуємо маршрут…"}
        </span>
      )}
      <button
        type="button"
        onClick={toggleFull}
        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-o-sand/95 text-o-sea shadow-sm transition-colors hover:text-o-wine"
        aria-label={full ? (lang === "en" ? "Exit full screen" : "Вийти з повного екрана") : lang === "en" ? "Full screen" : "На весь екран"}
      >
        {full ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
