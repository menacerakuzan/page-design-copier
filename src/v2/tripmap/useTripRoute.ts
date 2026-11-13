import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { TourismObject } from "@/types/hierarchy";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useBasket } from "@/lib/basketContext";
import { getObjectCoords, haversineKm, type LatLng } from "@/lib/geo";
import { shortName } from "@/v2/districts/useDistricts";
import { useV2 } from "@/v2/i18n";
import type { RouteStop } from "@/v2/route/useRoutePage";

/** Відрізок між сусідніми зупинками: по дорогах (OSRM) або по прямій ×1,3, поки дороги немає. */
export type Leg = { km: number; min: number; road: boolean };

/** Порядок «найближчий сусід» з кожного старту — беремо найкоротший. */
function optimize(ids: string[], at: (id: string) => LatLng | null) {
  const placed = ids.filter((id) => at(id));
  if (placed.length <= 2) return ids;
  const len = (o: string[]) => o.slice(1).reduce((s, id, i) => s + haversineKm(at(o[i])!, at(id)!), 0);
  let best = placed;
  let bestLen = Infinity;
  for (const start of placed) {
    const rest = placed.filter((x) => x !== start);
    const out = [start];
    while (rest.length) {
      const last = at(out[out.length - 1])!;
      let bi = 0;
      let bd = Infinity;
      rest.forEach((id, i) => {
        const d = haversineKm(last, at(id)!);
        if (d < bd) {
          bd = d;
          bi = i;
        }
      });
      out.push(rest.splice(bi, 1)[0]);
    }
    const l = len(out);
    if (l < bestLen) {
      bestLen = l;
      best = out;
    }
  }
  // Місця без координат — у кінець, як були
  return [...best, ...ids.filter((id) => !at(id))];
}

/** Шлях по дорогах для впорядкованих точок: лінія + відрізки (км, хв). Кеш у пам'яті. */
const cache = new Map<string, { geometry: [number, number][]; legs: { km: number; min: number }[] } | null>();
async function osrm(points: [number, number][]) {
  const key = points.map((p) => p.map((v) => v.toFixed(5)).join(",")).join(";");
  if (cache.has(key)) return cache.get(key)!;
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${key}?overview=full&geometries=geojson`);
    const json = res.ok ? await res.json() : null;
    const r = json?.routes?.[0];
    const out = r
      ? { geometry: r.geometry.coordinates as [number, number][], legs: (r.legs as { distance: number; duration: number }[]).map((l) => ({ km: l.distance / 1000, min: l.duration / 60 })) }
      : null;
    cache.set(key, out);
    return out;
  } catch {
    return null;
  }
}

/**
 * Дані сторінки «Маршрут по місцях» (/marshrut): місця з «Мого маршруту»
 * (або з посилання ?m=id1,id2,… — коли маршрутом поділилися), порядок,
 * найкоротший порядок, шлях по дорогах із км і часом, Google Maps, посилання.
 */
export function useTripRoute() {
  const { tl } = useV2();
  const basket = useBasket();
  const { data: snap, isLoading } = useHierarchySnapshot();
  const [params] = useSearchParams();
  const sharedIds = useMemo(() => (params.get("m") ?? "").split(",").filter(Boolean), [params]);
  const shared = sharedIds.length > 0;
  // Маршрут із посилання — свій порядок (у «Мій маршрут» не пишемо, поки не збережуть)
  const [sharedOrder, setSharedOrder] = useState<string[]>(sharedIds);
  useEffect(() => setSharedOrder(sharedIds), [sharedIds]);
  const ids = shared ? sharedOrder : basket.ids;
  const setOrder = shared ? setSharedOrder : basket.reorder;

  const base = useMemo(() => {
    const byId = new Map((snap?.objects ?? []).map((o) => [o.id, o]));
    const cities = new Map((snap?.cities ?? []).map((c) => [c.id, tl(c.name, c.nameEn)]));
    const districts = new Map((snap?.districts ?? []).map((d) => [d.id, d]));
    const at = (id: string) => {
      const o = byId.get(id);
      return o ? getObjectCoords(o) : null;
    };
    const objs = ids.map((id) => byId.get(id)).filter((o): o is TourismObject => !!o);
    const placedObjs = objs.filter((o) => getObjectCoords(o));
    const stops: RouteStop[] = placedObjs.map((o, i) => {
      const c = getObjectCoords(o)!;
      const d = districts.get(o.districtId);
      const where = [...new Set([o.cityId ? cities.get(o.cityId) : "", d ? shortName(tl(d.name, d.nameEn)) : ""].filter(Boolean))].join(" · ");
      return { o, n: i + 1, name: tl(o.name, o.nameEn), lat: c.lat, lng: c.lng, where };
    });
    const missing = objs.filter((o) => !getObjectCoords(o)).map((o) => ({ o, name: tl(o.name, o.nameEn) }));
    return { stops, missing, at, line: stops.map((s) => [s.lng!, s.lat!] as [number, number]) };
  }, [snap, ids, tl]);

  // Дороги: запит — коли порядок «устоявся» (під час перетягування не смикаємо сервіс)
  const lineKey = base.line.map((c) => c.join(",")).join(";");
  const [road, setRoad] = useState<{ key: string; geometry: [number, number][]; legs: { km: number; min: number }[] } | null>(null);
  const timer = useRef<number>();
  useEffect(() => {
    window.clearTimeout(timer.current);
    if (base.line.length < 2) return;
    let alive = true;
    timer.current = window.setTimeout(() => {
      osrm(base.line).then((r) => alive && r && setRoad({ key: lineKey, ...r }));
    }, 500);
    return () => {
      alive = false;
      window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineKey]);
  const fresh = road?.key === lineKey ? road : null;

  const legs: Leg[] = base.stops.slice(0, -1).map((s, i) => {
    const r = fresh?.legs[i];
    if (r) return { km: r.km, min: r.min, road: true };
    const b = base.stops[i + 1];
    const km = haversineKm({ lat: s.lat!, lng: s.lng! }, { lat: b.lat!, lng: b.lng! }) * 1.3;
    return { km, min: (km / 60) * 60, road: false };
  });
  const total = legs.reduce((a, l) => ({ km: a.km + l.km, min: a.min + l.min }), { km: 0, min: 0 });

  const googleUrl = (() => {
    const pts = base.stops.map((s) => `${s.lat},${s.lng}`);
    if (pts.length < 2) return "";
    const p = new URLSearchParams({ api: "1", origin: pts[0], destination: pts[pts.length - 1], travelmode: "driving" });
    if (pts.length > 2) p.set("waypoints", pts.slice(1, -1).join("|"));
    return `https://www.google.com/maps/dir/?${p.toString()}`;
  })();

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/marshrut?m=${ids.join(",")}` : "";

  /** Найкоротший порядок; повертає, на скільки км (по прямій) коротше. */
  const optimizeOrder = () => {
    const straight = (o: string[]) => {
      const p = o.map(base.at).filter(Boolean) as LatLng[];
      return p.slice(1).reduce((s, c, i) => s + haversineKm(p[i], c), 0);
    };
    const next = optimize(ids, base.at);
    const saved = straight(ids) - straight(next);
    setOrder(next);
    return saved;
  };

  /** Зберегти маршрут із посилання собі в «Мій маршрут». */
  const saveShared = () => sharedOrder.forEach((id) => basket.add(id));

  /** Перемістити зупинку з місця i на j (у межах місць з координатами). */
  const moveStop = (order: string[]) => {
    // order — лише id зупинок з координатами; місця без координат лишаємо в кінці
    const rest = ids.filter((id) => !order.includes(id));
    setOrder([...order, ...rest]);
  };

  return {
    ...base,
    loading: isLoading || !snap,
    shared,
    ids,
    legs,
    total,
    roadReady: !!fresh,
    geometry: base.line.length > 1 ? (fresh?.geometry ?? null) : undefined,
    googleUrl,
    shareUrl,
    optimizeOrder,
    moveStop,
    saveShared,
    remove: (id: string) => (shared ? setSharedOrder((o) => o.filter((x) => x !== id)) : basket.remove(id)),
    savedAll: shared && sharedOrder.every((id) => basket.has(id)),
  };
}

export type TripRouteData = ReturnType<typeof useTripRoute>;

/** «2 год 15 хв» / «45 хв» */
export function duration(min: number, lang: string) {
  const m = Math.round(min / 5) * 5;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (lang === "en") return h ? `${h} h${r ? ` ${r} min` : ""}` : `${r} min`;
  return h ? `${h} год${r ? ` ${r} хв` : ""}` : `${r} хв`;
}
