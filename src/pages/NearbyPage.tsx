import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, LocateFixed, Search, MapPin, X, Loader2, Navigation } from "lucide-react";
import { useLang } from "@/lib/langContext";
import SiteFooter from "@/components/SiteFooter";
import { haversineKm, type LatLng } from "@/lib/geo";

const NAVY = "#002f5e";
const CREAM = "#fff2e8";
const GOLD = "#df9b3b";
const GOLD_SOFT = "#f4c878";

const star = "✦";

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
    <div className="min-h-screen bg-[#fff2e8] font-odesa-regular text-[#002f5e]">
      <style>{`
        .nb-user-marker {
          width: 18px; height: 18px; border-radius: 50%;
          background: ${GOLD}; border: 3px solid ${CREAM};
          box-shadow: 0 0 0 6px ${GOLD}33, 0 3px 10px rgba(0,0,0,0.35);
        }
      `}</style>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#002f5e] pb-16 pt-0 text-[#fff2e8]">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.08]"
          style={{ backgroundImage: "url(/shieldtile.svg)", backgroundSize: "180px 203px", backgroundRepeat: "repeat" }} />
        <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 md:px-5">
          <div className="rounded-b-[48px] bg-[#fff2e8] px-6 pb-4 pt-4 text-[#002f5e]">
            <div className="flex items-center justify-between gap-4 text-[14px] font-odesa-medium">
              <Link to="/" className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70">
                <ChevronLeft className="h-4 w-4" /> {L("На головну", "Home")}
              </Link>
              <div className="flex items-center gap-3 text-[#002f5e]/65">
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>{L("Поблизу", "Nearby")}</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>Одещина</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
              </div>
              <Link to="/" className="transition-opacity hover:opacity-70">{L("Головна", "Home")}</Link>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-14 max-w-[1400px] px-4 md:px-10">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-[12px] uppercase tracking-[0.08em] font-odesa-medium text-[#df9b3b]">
            {L("Що відвідати", "What to visit")}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 font-odesa-medium text-[56px] leading-[0.92] md:text-[100px]">
            {L("Поблизу", "Nearby")}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-5 max-w-[560px] text-[18px] leading-[1.55] text-[#fff2e8]/65 font-odesa-regular">
            {L("Вкажіть адресу або увімкніть геолокацію — і ми покажемо цікаві місця навколо вас.",
               "Enter an address or enable geolocation — we'll show interesting places around you.")}
          </motion.p>
        </div>
      </section>

      {/* Controls */}
      <section className="px-4 pt-10 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="relative flex flex-col gap-5 overflow-hidden rounded-[28px] p-6 md:p-7"
            style={{ background: "linear-gradient(135deg, #00386f 0%, #002f5e 55%, #00254a 100%)", boxShadow: "0 26px 60px -28px rgba(0,47,94,0.6)" }}>
            {/* теплий акцент у куті */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full" aria-hidden="true"
              style={{ background: "radial-gradient(circle, rgba(223,155,59,0.28), transparent 70%)" }} />
            <div className="pointer-events-none absolute -left-20 bottom-0 h-44 w-44 rounded-full" aria-hidden="true"
              style={{ background: "radial-gradient(circle, rgba(159,31,71,0.22), transparent 70%)" }} />

            {/* Address + GPS */}
            <div className="relative flex flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-full bg-[#fff2e8] px-5 py-3 transition-shadow focus-within:ring-2 focus-within:ring-[#df9b3b]">
                <Search className="h-[18px] w-[18px] shrink-0 text-[#df9b3b]" />
                <input
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") searchAddress(); }}
                  placeholder={L("Введіть адресу, напр. Дерибасівська, Одеса", "Enter address, e.g. Deribasivska, Odesa")}
                  className="w-full bg-transparent text-[15px] text-[#002f5e] outline-none placeholder:text-[#002f5e]/40"
                />
              </div>
              <button
                type="button"
                onClick={searchAddress}
                disabled={geocoding || !address.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-[14px] font-odesa-semi text-[#002f5e] shadow-lg transition-all hover:brightness-105 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40 disabled:brightness-100"
                style={{ backgroundColor: GOLD, boxShadow: "0 10px 24px -10px rgba(223,155,59,0.7)" }}
              >
                {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {L("Знайти", "Search")}
              </button>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-[14px] font-odesa-medium text-[#fff2e8] transition-colors hover:bg-[#fff2e8]/10 disabled:opacity-40"
                style={{ borderColor: "rgba(255,242,232,0.45)" }}
              >
                {locating ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: GOLD }} /> : <LocateFixed className="h-4 w-4" style={{ color: GOLD }} />}
                {L("Моє місцезнаходження", "My location")}
              </button>
            </div>

            {error && <p className="relative text-[13px] font-odesa-medium" style={{ color: "#ff9bb3" }}>{error}</p>}

            {/* Radius */}
            <div className="relative flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[13px] uppercase tracking-wide font-odesa-medium text-[#fff2e8]/60">{L("Радіус", "Radius")}</span>
              {RADII.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusKm(r)}
                  className="rounded-full border px-5 py-1.5 text-[13px] font-odesa-medium transition-all"
                  style={radiusKm === r
                    ? { backgroundColor: GOLD, borderColor: GOLD, color: NAVY, boxShadow: "0 8px 20px -8px rgba(223,155,59,0.7)" }
                    : { borderColor: "rgba(255,242,232,0.3)", color: "rgba(255,242,232,0.75)" }}
                >
                  {r < 1 ? `${r * 1000} м` : `${r} км`}
                </button>
              ))}
            </div>

            {/* Categories */}
            <div className="relative flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[13px] uppercase tracking-wide font-odesa-medium text-[#fff2e8]/60">{L("Категорії", "Categories")}</span>
              {CAT_ORDER.map(k => {
                const on = enabled.has(k);
                const c = CATEGORIES[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleCat(k)}
                    className="flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-odesa-medium transition-all hover:-translate-y-0.5"
                    style={on
                      ? { backgroundColor: c.color, borderColor: c.color, color: "#fff", boxShadow: `0 8px 20px -10px ${c.color}` }
                      : { borderColor: "rgba(255,242,232,0.28)", color: "rgba(255,242,232,0.6)" }}
                  >
                    <span className="flex h-4 w-4 items-center justify-center rounded-[5px]"
                      style={{ backgroundColor: on ? "rgba(255,255,255,0.25)" : "transparent", border: `2px solid ${on ? "#fff" : "rgba(255,242,232,0.4)"}` }}>
                      {on && <span className="text-[10px] font-bold leading-none text-white">✓</span>}
                    </span>
                    {L(c.uk, c.en)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Map + list */}
      <section className="px-4 py-10 md:px-10">
        <div className="mx-auto grid max-w-[1400px] gap-6 lg:grid-cols-[1fr_360px]">
          {/* Map */}
          <div className="relative overflow-hidden rounded-[24px]"
            style={{ border: `1px solid ${NAVY}1f`, boxShadow: "0 18px 50px -22px rgba(0,47,94,0.4)" }}>
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

            {/* Active object card */}
            <AnimatePresence>
              {activePlace && (
                <motion.div
                  key={activePlace.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute right-3 top-3 w-[240px] overflow-hidden rounded-[18px] p-4"
                  style={{ backgroundColor: NAVY, border: `1px solid ${CREAM}26`, boxShadow: "0 20px 50px -16px rgba(0,0,0,0.7)" }}
                >
                  <button onClick={() => setActiveId(null)}
                    className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full transition-opacity hover:opacity-70"
                    style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                    <X className="h-3.5 w-3.5" style={{ color: CREAM }} />
                  </button>
                  <p className="mb-1 text-[10px] uppercase tracking-wider font-odesa-medium" style={{ color: CATEGORIES[activePlace.category].color }}>
                    {L(CATEGORIES[activePlace.category].uk, CATEGORIES[activePlace.category].en)}
                  </p>
                  <p className="pr-5 font-odesa-medium text-[16px] leading-[1.2]" style={{ color: CREAM }}>{activePlace.name}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] font-odesa-regular" style={{ color: `${CREAM}75` }}>
                    <MapPin className="h-3.5 w-3.5" style={{ color: GOLD_SOFT }} /> {fmtDist(activePlace.distKm)} {L("від вас", "away")}
                  </p>
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${activePlace.lat}&mlon=${activePlace.lng}#map=18/${activePlace.lat}/${activePlace.lng}`}
                    target="_blank" rel="noreferrer"
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-[12px] font-odesa-medium transition-transform hover:scale-[1.02]"
                    style={{ background: `linear-gradient(135deg, ${GOLD_SOFT}, ${GOLD})`, color: NAVY }}
                  >
                    {L("Прокласти шлях", "Get directions")} <Navigation className="h-3.5 w-3.5" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* List */}
          <div className="flex flex-col">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-odesa-medium text-[22px]">{L("Поблизу", "Nearby")}</h2>
              {userLoc && <span className="text-[13px] font-odesa-regular text-[#002f5e]/50">{nearby.length} {L("об'єктів", "places")}</span>}
            </div>

            <div className="flex max-h-[600px] flex-col gap-2 overflow-y-auto pr-1">
              {!userLoc ? (
                <div className="rounded-[18px] border border-dashed border-[#002f5e]/20 px-5 py-12 text-center text-[14px] text-[#002f5e]/45">
                  {L("Дозвольте геолокацію або введіть адресу, щоб побачити місця поблизу", "Allow geolocation or enter an address to see nearby places")}
                </div>
              ) : nearby.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[#002f5e]/20 px-5 py-12 text-center text-[14px] text-[#002f5e]/45">
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
                      className="flex items-center gap-3 rounded-[16px] border px-4 py-3 text-left transition-all hover:-translate-y-0.5"
                      style={{
                        borderColor: active ? c.color : `${NAVY}12`,
                        backgroundColor: active ? `${c.color}12` : "#fff",
                      }}
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-odesa-medium text-[15px] leading-tight">{p.name}</span>
                        <span className="text-[12px] font-odesa-regular text-[#002f5e]/50">{L(c.uk, c.en)}</span>
                      </span>
                      <span className="shrink-0 text-[13px] font-odesa-medium" style={{ color: c.color }}>{fmtDist(p.distKm)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
