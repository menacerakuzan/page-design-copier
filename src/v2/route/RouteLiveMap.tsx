import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";
import { useV2 } from "@/v2/i18n";
import { resizedImageUrl } from "@/lib/img";
import type { RouteStop } from "./useRoutePage";

/*
 * Жива карта маршруту (сторінка маршруту й «Маршрут по місцях»). Підкладка —
 * CARTO Voyager (векторна, без ключа), трохи приглушена, підписи українською;
 * шлях — по дорогах (OSRM), поки будується — пунктир по прямій. Маркери —
 * фото-кружки з номером; обрана зупинка (active) більшає, і карта плавно
 * перелітає до неї; без обраної — весь маршрут (або focus — частина, напр. день).
 * Зміна зупинок / лінії не перебудовує карту — лише оновлює шар і маркери.
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

export function RouteLiveMap({ stops, line, active, onPick, roads = true, geometry, focus, padLeft = 0, className = "" }: {
  stops: RouteStop[];
  line: [number, number][];
  active: number | null;
  onPick?: (i: number) => void;
  /** Будувати шлях по дорогах самостійно (для водних і пішохідних маршрутів — ні). */
  roads?: boolean;
  /** Готова лінія по дорогах (тоді карта сама її не запитує); null — ще будується. */
  geometry?: [number, number][] | null;
  /** Показати лише ці точки (напр. зупинки одного дня), коли нічого не обрано. */
  focus?: [number, number][] | null;
  /** Ліворуч карту закриває панель (повна карта) — стільки пікселів не враховуємо при показі маршруту. */
  padLeft?: number;
  className?: string;
}) {
  const { lang } = useV2();
  const box = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ el: HTMLElement; m: maplibregl.Marker; n: number }[]>([]);
  const [ready, setReady] = useState(false);
  const [routing, setRouting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [full, setFull] = useState(false);
  const pick = useRef(onPick);
  pick.current = onPick;

  const placed = stops.filter((s) => s.lng != null && s.lat != null);
  const lineKey = line.map((c) => c.join(",")).join(";");
  const stopsKey = placed.map((s) => `${s.o.id}@${s.n}`).join("|");
  const focusKey = focus?.map((c) => c.join(",")).join(";") ?? "";

  const bounds = (pts: [number, number][]) => {
    const b = new maplibregl.LngLatBounds();
    pts.forEach((c) => b.extend(c));
    return b;
  };
  const allPts = () => [...line, ...placed.map((s) => [s.lng!, s.lat!] as [number, number])];
  const pad = () => (padLeft && window.innerWidth >= 1024 ? { top: 70, bottom: 70, right: 70, left: padLeft + 50 } : 70);

  // Створення карти (один раз; заново — лише при зміні мови підписів)
  useEffect(() => {
    if (!box.current) return;
    let m: maplibregl.Map;
    try {
      m = new maplibregl.Map({
        container: box.current,
        style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
        center: [30.7, 46.5],
        zoom: 7,
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
    m.on("load", () => {
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
      m.addSource("route", { type: "geojson", data: feature([]) });
      m.addLayer({ id: "route-casing", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": SAND, "line-width": 8, "line-opacity": 0.95 } });
      m.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": WINE, "line-width": 3.5, "line-dasharray": [0.1, 2.2] } });
      setReady(true);
    });
    m.on("error", () => {});
    return () => {
      setReady(false);
      markers.current = [];
      m.remove();
      map.current = null;
    };
  }, [lang]);

  // Маркери зупинок — заново, коли змінився склад чи порядок
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    markers.current.forEach((x) => x.m.remove());
    markers.current = placed.map((s) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "rlm-marker";
      el.setAttribute("aria-label", `${s.n}. ${s.name}`);
      // Фото в мітці крихітне (44px, активна ×1.3) — беремо зменшену копію, а не
      // оригінал (сотні КБ–МБ); якщо копії немає — падаємо на оригінал.
      el.innerHTML = `<span class="rlm-wrap"><span class="rlm-photo">${s.o.imageUrl ? `<img src="${resizedImageUrl(s.o.imageUrl, 160)}" alt="" loading="lazy" decoding="async"/>` : ""}</span><span class="rlm-num">${s.n}</span></span>`;
      const img = el.querySelector("img");
      if (img && s.o.imageUrl) img.addEventListener("error", () => { if (img.src !== s.o.imageUrl) img.src = s.o.imageUrl!; }, { once: true });
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        pick.current?.(s.n - 1);
      });
      const mk = new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([s.lng!, s.lat!]).addTo(m);
      return { el, m: mk, n: s.n };
    });
    const pts = allPts();
    if (pts.length) m.fitBounds(bounds(focus?.length ? focus : pts), { padding: pad(), maxZoom: 12, duration: 600 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, stopsKey]);

  // Лінія: готова (geometry) або власний запит по дорогах; поки немає — пунктир по прямій
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const src = m.getSource("route") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    const straight = () => {
      src.setData(feature(line));
      m.setPaintProperty("route-line", "line-dasharray", [0.1, 2.2]);
    };
    const road = (g: [number, number][]) => {
      src.setData(feature(g));
      m.setPaintProperty("route-line", "line-dasharray", [1, 0]);
    };
    if (geometry !== undefined) {
      if (geometry && geometry.length > 1) road(geometry);
      else straight();
      return;
    }
    straight();
    if (!roads || line.length < 2) return;
    let cancelled = false;
    setRouting(true);
    roadRoute(line).then((g) => {
      if (cancelled) return;
      setRouting(false);
      if (g) road(g);
    });
    return () => {
      cancelled = true;
      setRouting(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, lineKey, roads, geometry]);

  // Обрана зупинка: маркер більшає, карта перелітає до неї; без обраної — весь маршрут чи focus
  useEffect(() => {
    const m = map.current;
    markers.current.forEach((x) => x.el.classList.toggle("is-active", active === x.n - 1));
    if (!m || !ready) return;
    m.stop(); // попередній переліт — зупинити, новий починається звідси
    const s = active != null ? stops[active] : null;
    // Не надто близько — щоб навколо зупинки було видно місцевість і сусідні міста
    if (s?.lng != null && s.lat != null) m.flyTo({ center: [s.lng, s.lat], zoom: 10.5, speed: 0.9, curve: 1.3, essential: true, ...(padLeft && window.innerWidth >= 1024 ? { offset: [padLeft / 2, 0] as [number, number] } : {}) });
    else {
      const pts = focus?.length ? focus : allPts();
      if (pts.length) m.fitBounds(bounds(pts), { padding: pad(), maxZoom: 12, duration: 900 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ready, focusKey]);

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
      {(routing || geometry === null) && line.length > 1 && (
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
