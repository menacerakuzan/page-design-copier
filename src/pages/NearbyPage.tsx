import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, LocateFixed, Search, MapPin, X, Loader2, Navigation } from "lucide-react";
import { useLang } from "@/lib/langContext";
import SiteFooter from "@/components/SiteFooter";
import PageBrow from "@/components/PageBrow";
import { haversineKm, type LatLng } from "@/lib/geo";
import { useSeo } from "@/hooks/useSeo";

const NAVY = "#002f5e";
const CREAM = "#fff2e8";
const GOLD = "#df9b3b";
const GOLD_SOFT = "#f4c878";

// ── Категорії об'єктів (колір + підписи) ────────────────────────────────────
type CatKey = "hotel" | "restaurant" | "cafe" | "museum" | "gallery" | "other";

// Кольори в межах палітри ОДА (навігаційні відтінки navy / gold / wine)
const CATEGORIES: Record<CatKey, { uk: string; en: string; color: string }> = {
  hotel: { uk: "Готелі", en: "Hotels", color: "#002f5e" },       // navy
  restaurant: { uk: "Ресторани", en: "Restaurants", color: "#9f1f47" }, // wine
  cafe: { uk: "Кафе", en: "Cafés", color: "#df9b3b" },           // gold
  museum: { uk: "Музеї", en: "Museums", color: "#2f6f9f" },      // navy (світліший)
  gallery: { uk: "Галереї", en: "Galleries", color: "#c2536e" }, // wine (світліший)
  other: { uk: "Інше", en: "Other", color: "#b9892f" },          // gold (бронзовий)
};

const CAT_ORDER: CatKey[] = ["hotel", "restaurant", "cafe", "museum", "gallery", "other"];

function classify(props: Record<string, unknown>): CatKey {
  const tourism = String(props.tourism ?? "");
  const amenity = String(props.amenity ?? "");
  if (tourism === "hotel" || tourism === "hostel" || tourism === "guest_house" || tourism === "motel") return "hotel";
  if (amenity === "restaurant" || amenity === "fast_food") return "restaurant";
  if (amenity === "cafe" || amenity === "internet_cafe") return "cafe";
  if (tourism === "museum") return "museum";
  if (tourism === "gallery" || tourism === "artwork") return "gallery";
  return "other";
}

type Place = {
  id: string;
  name: string;
  category: CatKey;
  lat: number;
  lng: number;
};

// Геодезичне коло (полігон) для відображення радіуса
function circlePolygon(center: LatLng, radiusKm: number, steps = 72): GeoJSON.Feature {
  const coords: [number, number][] = [];
  const latR = (center.lat * Math.PI) / 180;
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = (radiusKm / 111.32) * Math.cos(angle) / Math.cos(latR);
    const dy = (radiusKm / 110.574) * Math.sin(angle);
    coords.push([center.lng + dx, center.lat + dy]);
  }
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [coords] } };
}

const RADII = [0.5, 1, 2, 5];

export default function NearbyPage() {
  const { lang } = useLang();
  const L = (uk: string, en: string) => (lang === "en" ? en : uk);
  useSeo({
    title: L("Поблизу", "Nearby"),
    description: L(
      "Знайди туристичні об'єкти, ресторани та готелі поблизу себе на карті Одещини.",
      "Find tourist attractions, restaurants and hotels near you on the Odesa region map.",
    ),
    lang,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const readyRef = useRef(false);

  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [radiusKm, setRadiusKm] = useState(1);
  const [enabled, setEnabled] = useState<Set<CatKey>>(new Set(CAT_ORDER));
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // ── Завантаження GeoJSON ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch("/places.geojson")
      .then(r => r.json())
      .then((json: GeoJSON.FeatureCollection) => {
        if (cancelled) return;
        const parsed: Place[] = [];
        for (const f of json.features ?? []) {
          if (f.geometry?.type !== "Point") continue;
          const [lng, lat] = f.geometry.coordinates as [number, number];
          const p = (f.properties ?? {}) as Record<string, unknown>;
          const name = String(
            p["name:uk"] ?? p.name ?? p["name:en"] ?? p["name:ru"] ?? "",
          ).trim();
          if (!name) continue;
          parsed.push({
            id: String(p["@id"] ?? f.id ?? `${lng},${lat}`),
            name,
            category: classify(p),
            lat,
            lng,
          });
        }
        setAllPlaces(parsed);
      })
      .catch(() => { if (!cancelled) setError(L("Не вдалося завантажити дані карти", "Failed to load map data")); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Об'єкти поблизу (фільтр радіус + категорії), відсортовані за відстанню ──
  const nearby = useMemo(() => {
    if (!userLoc) return [] as (Place & { distKm: number })[];
    return allPlaces
      .filter(p => enabled.has(p.category))
      .map(p => ({ ...p, distKm: haversineKm(userLoc, { lat: p.lat, lng: p.lng }) }))
      .filter(p => p.distKm <= radiusKm)
      .sort((a, b) => a.distKm - b.distKm);
  }, [allPlaces, userLoc, radiusKm, enabled]);

  const activePlace = nearby.find(p => p.id === activeId) ?? null;

  // ── Ініціалізація карти ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
      center: [30.7233, 46.4825], // Одеса
      zoom: 11,
      attributionControl: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      readyRef.current = true;

      map.addSource("radius", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "radius-fill", type: "fill", source: "radius",
        paint: { "fill-color": NAVY, "fill-opacity": 0.06 },
      });
      map.addLayer({
        id: "radius-line", type: "line", source: "radius",
        paint: { "line-color": NAVY, "line-width": 1.5, "line-dasharray": [2, 2], "line-opacity": 0.5 },
      });

      map.addSource("places", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      const colorExpr = [
        "match", ["get", "category"],
        ...CAT_ORDER.flatMap(k => [k, CATEGORIES[k].color]),
        "#9aa7b4",
      ];
      map.addLayer({
        id: "places-circle", type: "circle", source: "places",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 5, 14, 8, 16, 11],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "circle-color": colorExpr as any,
          "circle-stroke-color": CREAM,
          "circle-stroke-width": 2,
        },
      });

      map.on("mouseenter", "places-circle", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "places-circle", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "places-circle", (e) => {
        const f = e.features?.[0];
        if (f) setActiveId(String(f.properties?.id));
      });
      map.on("click", (e) => {
        const hits = map.queryRenderedFeatures(e.point, { layers: ["places-circle"] });
        if (hits.length === 0) setActiveId(null);
      });
    });

    return () => { readyRef.current = false; map.remove(); mapRef.current = null; };
  }, []);

  // ── Оновлення шару об'єктів ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource("places") as maplibregl.GeoJSONSource | undefined;
    if (!src) return;
    src.setData({
      type: "FeatureCollection",
      features: nearby.map(p => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: { id: p.id, name: p.name, category: p.category },
      })),
    });
  }, [nearby]);

  // ── Оновлення позиції користувача / радіуса / маркера ──────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !userLoc) return;

    const ring = circlePolygon(userLoc, radiusKm);
    const radiusSrc = map.getSource("radius") as maplibregl.GeoJSONSource | undefined;
    radiusSrc?.setData({ type: "FeatureCollection", features: [ring] });

    if (!userMarkerRef.current) {
      const el = document.createElement("div");
      el.className = "nb-user-marker";
      userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([userLoc.lng, userLoc.lat]).addTo(map);
    } else {
      userMarkerRef.current.setLngLat([userLoc.lng, userLoc.lat]);
    }

    const bounds = new maplibregl.LngLatBounds();
    (ring.geometry as GeoJSON.Polygon).coordinates[0].forEach(c => bounds.extend(c as [number, number]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 600 });
  }, [userLoc, radiusKm]);

  // ── Центрування на активному об'єкті ──────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !activePlace) return;
    map.flyTo({ center: [activePlace.lng, activePlace.lat], zoom: Math.max(map.getZoom(), 15), duration: 600 });
  }, [activePlace]);

  // ── Геолокація / геокодинг ────────────────────────────────────────────────
  const useMyLocation = () => {
    setError(null);
    if (!navigator.geolocation) { setError(L("Геолокація недоступна", "Geolocation unavailable")); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      () => { setError(L("Не вдалося отримати місцезнаходження", "Could not get location")); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const searchAddress = async () => {
    const q = address.trim();
    if (!q) return;
    setError(null);
    setGeocoding(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=uk&countrycodes=ua&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { "Accept-Language": "uk" } });
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (data.length === 0) { setError(L("Адресу не знайдено", "Address not found")); return; }
      setUserLoc({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
    } catch {
      setError(L("Помилка пошуку адреси", "Address search failed"));
    } finally {
      setGeocoding(false);
    }
  };

  const toggleCat = (k: CatKey) => {
    setEnabled(prev => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  const fmtDist = (km: number) => (km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`);

  return (
    <div className="relative min-h-screen bg-[#fff2e8] font-odesa-regular text-[#002f5e]">
      <style>{`
        .nb-user-marker {
          width: 18px; height: 18px; border-radius: 50%;
          background: ${GOLD}; border: 3px solid ${CREAM};
          box-shadow: 0 0 0 6px ${GOLD}33, 0 3px 10px rgba(0,0,0,0.35);
        }
      `}</style>

      {/* Той самий фоновий патерн, що й на сторінках районів/гідів.
          absolute, не fixed — див. коментар у DistrictsPage про iOS overscroll. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "url(/districtspattern.svg)", backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.1 }}
      />

      <PageBrow />

      {/* ── Заголовок сторінки ──────────────────────────────────────────── */}
      <div className="container-edge relative z-10 pb-6 pt-8 md:pb-8 md:pt-12">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#002f5e] text-[#fff2e8] md:h-12 md:w-12">
            <Compass className="h-5 w-5" />
          </span>
          <h1 className="text-[34px] leading-[0.95] text-[#002f5e] font-odesa-bold md:text-[46px]">{L("Поблизу", "Nearby")}</h1>
        </div>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.5] text-[#002f5e]/70 font-odesa-regular md:max-w-[640px] md:text-[16px]">
          {L("Вкажіть адресу або увімкніть геолокацію — і ми покажемо цікаві місця навколо вас.",
             "Enter an address or enable geolocation — we'll show interesting places around you.")}
        </p>
      </div>

      {/* ── Панель керування: адреса, радіус, категорії ─────────────────── */}
      <div className="container-edge relative z-10 pb-6">
        <div
          className="flex flex-col gap-5 rounded-[26px] bg-[#fffaf3] p-5 md:p-6"
          style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.05), 0 12px 32px -10px rgba(0,47,94,0.22)" }}
        >
          {/* Адреса + GPS */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1.5">
              {/* Видима мітка, а не лише placeholder: placeholder зникає, щойно
                  користувач починає вводити, і поле лишається без назви. */}
              <label htmlFor="nearby-address" className="text-[13px] font-odesa-medium text-[#002f5e]/70">
                {L("Адреса для пошуку", "Address to search from")}
              </label>
              <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-5 py-3 ring-1 ring-[#002f5e]/10 transition-shadow focus-within:ring-2 focus-within:ring-[#df9b3b]">
                <Search className="h-[18px] w-[18px] shrink-0 text-[#9c6200]" aria-hidden="true" />
                <input
                  id="nearby-address"
                  type="text"
                  autoComplete="street-address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") searchAddress(); }}
                  placeholder={L("Напр. Дерибасівська, Одеса", "e.g. Deribasivska, Odesa")}
                  className="w-full bg-transparent text-[15px] text-[#002f5e] outline-none font-odesa-regular placeholder:text-[#002f5e]/70"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={searchAddress}
              disabled={geocoding || !address.trim()}
              className="tap sm:self-end inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-[14px] font-odesa-semi text-[#002f5e] transition-all hover:-translate-y-0.5 hover:brightness-105 disabled:translate-y-0 disabled:opacity-40 disabled:brightness-100"
              style={{ backgroundColor: GOLD, boxShadow: "0 10px 24px -10px rgba(223,155,59,0.7)" }}
            >
              {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {L("Знайти", "Search")}
            </button>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="tap sm:self-end inline-flex items-center justify-center gap-2 rounded-full bg-[#002f5e] px-6 py-3 text-[14px] font-odesa-medium text-[#fff2e8] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:translate-y-0 disabled:opacity-40"
              style={{ boxShadow: "0 10px 24px -10px rgba(0,47,94,0.5)" }}
            >
              {locating ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: GOLD }} /> : <LocateFixed className="h-4 w-4" style={{ color: GOLD }} />}
              {L("Моє місцезнаходження", "My location")}
            </button>
          </div>

          {error && <p className="text-[13px] font-odesa-medium text-[#9f1f47]">{error}</p>}

          {/* Радіус */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] uppercase tracking-wide font-odesa-medium text-[#002f5e]/70">{L("Радіус", "Radius")}</span>
            {RADII.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRadiusKm(r)}
                className="shrink-0 rounded-full px-4 py-1.5 text-[13px] font-odesa-semi transition-all duration-200"
                style={radiusKm === r
                  ? { backgroundColor: GOLD, color: NAVY, boxShadow: "0 6px 14px -6px rgba(223,155,59,0.7)" }
                  : { backgroundColor: "rgba(0,47,94,0.07)", color: "rgba(0,47,94,0.6)" }}
              >
                {r < 1 ? `${r * 1000} м` : `${r} км`}
              </button>
            ))}
          </div>

          {/* Категорії */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12px] uppercase tracking-wide font-odesa-medium text-[#002f5e]/70">{L("Категорії", "Categories")}</span>
            {CAT_ORDER.map(k => {
              const on = enabled.has(k);
              const c = CATEGORIES[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleCat(k)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-odesa-semi transition-all duration-200 hover:-translate-y-0.5"
                  style={on
                    ? { backgroundColor: c.color, color: "#fff", boxShadow: `0 8px 20px -10px ${c.color}` }
                    : { backgroundColor: "rgba(0,47,94,0.07)", color: "rgba(0,47,94,0.55)" }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: on ? "#fff" : c.color }} />
                  {L(c.uk, c.en)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Карта + список ──────────────────────────────────────────────── */}
      <main id="main-content" tabIndex={-1} className="container-edge relative z-10 pb-tabbar md:pb-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Карта */}
          <div
            className="relative overflow-hidden rounded-[26px]"
            style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.06), 0 18px 50px -22px rgba(0,47,94,0.4)" }}
          >
            <div ref={containerRef} className="h-[420px] w-full md:h-[600px]" />

            {!userLoc && (
              <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-center">
                <div className="pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-odesa-medium"
                  style={{ backgroundColor: "rgba(0,47,94,0.9)", color: CREAM, backdropFilter: "blur(6px)" }}>
                  <Navigation className="h-4 w-4" style={{ color: GOLD_SOFT }} />
                  {L("Увімкніть геолокацію або введіть адресу", "Enable geolocation or enter an address")}
                </div>
              </div>
            )}

            {/* Картка активного об'єкта */}
            <AnimatePresence>
              {activePlace && (
                <motion.div
                  key={activePlace.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-3 top-3 w-[240px] overflow-hidden rounded-[20px] p-4"
                  style={{ backgroundColor: NAVY, border: `1px solid ${CREAM}26`, boxShadow: "0 20px 50px -16px rgba(0,0,0,0.7)" }}
                >
                  <button type="button" onClick={() => setActiveId(null)}
                    aria-label={L("Закрити", "Close")}
                    className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                    style={{ backgroundColor: "rgba(0,0,0,0.55)" }}>
                    <X className="h-3.5 w-3.5" style={{ color: CREAM }} aria-hidden="true" />
                  </button>
                  <p className="mb-1 text-[10px] uppercase tracking-wider font-odesa-medium" style={{ color: GOLD_SOFT }}>
                    {L(CATEGORIES[activePlace.category].uk, CATEGORIES[activePlace.category].en)}
                  </p>
                  <p className="pr-5 font-odesa-medium text-[16px] leading-[1.2]" style={{ color: CREAM }}>{activePlace.name}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] font-odesa-regular" style={{ color: `${CREAM}75` }}>
                    <MapPin className="h-3.5 w-3.5" style={{ color: GOLD_SOFT }} /> {fmtDist(activePlace.distKm)} {L("від вас", "away")}
                  </p>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${activePlace.lat}&mlon=${activePlace.lng}#map=18/${activePlace.lat}/${activePlace.lng}`}
                    target="_blank" rel="noreferrer"
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[12px] font-odesa-semi transition-transform hover:scale-[1.02]"
                    style={{ background: `linear-gradient(135deg, ${GOLD_SOFT}, ${GOLD})`, color: NAVY }}
                  >
                    {L("Прокласти шлях", "Get directions")} <Navigation className="h-3.5 w-3.5" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Список */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-[22px] leading-none text-[#002f5e] font-odesa-bold">{L("Знайдено", "Found")}</h2>
              {userLoc && (
                <span className="rounded-full bg-[#002f5e]/8 px-2.5 py-1 text-[12px] leading-none text-[#002f5e]/70 font-odesa-medium">
                  {nearby.length}
                </span>
              )}
            </div>

            <div className="flex max-h-[600px] flex-col gap-2 overflow-y-auto pr-1">
              {!userLoc ? (
                <div className="rounded-[20px] border border-dashed border-[#002f5e]/20 px-5 py-12 text-center text-[14px] text-[#002f5e]/70 font-odesa-regular">
                  {L("Дозвольте геолокацію або введіть адресу, щоб побачити місця поблизу", "Allow geolocation or enter an address to see nearby places")}
                </div>
              ) : nearby.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[#002f5e]/20 px-5 py-12 text-center text-[14px] text-[#002f5e]/70 font-odesa-regular">
                  {L("Поблизу нічого не знайдено — збільшіть радіус або додайте категорії", "Nothing nearby — increase the radius or enable more categories")}
                </div>
              ) : (
                nearby.map(p => {
                  const active = p.id === activeId;
                  const c = CATEGORIES[p.category];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveId(p.id)}
                      className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 text-left transition-all hover:-translate-y-0.5"
                      style={{
                        boxShadow: active
                          ? `0 0 0 2px ${c.color}, 0 12px 28px -12px ${c.color}80`
                          : "0 0 0 1px rgba(0,47,94,0.05), 0 8px 22px -12px rgba(0,47,94,0.22)",
                      }}
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-odesa-medium text-[15px] leading-tight">{p.name}</span>
                        <span className="text-[12px] font-odesa-regular text-[#002f5e]/70">{L(c.uk, c.en)}</span>
                      </span>
                      <span className="shrink-0 text-[13px] font-odesa-semi" style={{ color: c.color }}>{fmtDist(p.distKm)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
