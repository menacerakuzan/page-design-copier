import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { loadRouteTagOrder, ROUTE_TAG_OPTIONS, type Route } from "@/lib/routesRepository";
import { routeGeometry } from "@/lib/routeGeometry";
import { getObjectCoords } from "@/lib/geo";
import { DISTRICT_SHAPES, MAP_H, MAP_W, projectLonLat } from "@/v2/lib/districtShapes";
import { useRoutesData } from "@/v2/home/routes/useRoutesData";
import { shortName } from "@/v2/districts/useDistricts";
import { useV2 } from "@/v2/i18n";

/** Маршрут для сторінки: сам маршрут + лінія на карті області (в одиницях SVG-карти районів). */
export type RouteItem = {
  r: Route;
  /** Точки лінії [x, y] на карті; одна точка — маршрут в одному місці. */
  line: [number, number][];
  /** Зупинки з координатами — пронумеровані мітки на міні-карті. */
  marks: { x: number; y: number; name: string }[];
  /** Райони, якими проходить маршрут (slug). */
  districts: string[];
};

/**
 * Дані сторінки «Маршрути»: опубліковані маршрути з їхніми зупинками, лінії на
 * карті (з точок посилання Google Maps, а як їх немає — з координат зупинок),
 * типи маршрутів у порядку з адмінки з лічильниками і фільтр ?tag= в адресі.
 */
export function useRoutesPage() {
  const d = useRoutesData();
  const { tl } = useV2();
  const { data: snap } = useHierarchySnapshot();
  const [params, setParams] = useSearchParams();
  const [tagOrder, setTagOrder] = useState<string[]>([]);

  useEffect(() => {
    loadRouteTagOrder()
      .then((order) => order.length && setTagOrder(order))
      .catch(() => {});
  }, []);

  const items = useMemo<RouteItem[]>(() => {
    if (!snap) return [];
    const districtOf = new Map(snap.districts.map((x) => [x.id, x.slug]));
    return d.routes.map((r) => {
      const g = routeGeometry(r, snap.objects);
      // Точки поза картою області (помилкові координати) не малюємо.
      const inMap = ([x, y]: [number, number]) => x > -20 && x < MAP_W + 20 && y > -20 && y < MAP_H + 20;
      const geoLine = g.coords.filter(([lng, lat]) => inMap(projectLonLat(lng, lat)));
      const line = geoLine.map(([lng, lat]) => projectLonLat(lng, lat));
      // Координати зупинки: з самого об'єкта, а якщо їх там немає — з точки
      // посилання Google Maps, до якої цей об'єкт прив'язаний в адмінці.
      const fromLink = new Map(g.waypoints.map((w) => [w.object.id, g.coords[w.coordIndex]]));
      const geoMarks = g.stops.flatMap((o) => {
        const c = getObjectCoords(o);
        const p = c ? ([c.lng, c.lat] as [number, number]) : fromLink.get(o.id);
        return p && inMap(projectLonLat(p[0], p[1])) ? [{ lng: p[0], lat: p[1], name: tl(o.name, o.nameEn) }] : [];
      });
      const marks = geoMarks.map((m) => {
        const [x, y] = projectLonLat(m.lng, m.lat);
        return { x, y, name: m.name };
      });
      const districts = [...new Set(g.stops.map((o) => districtOf.get(o.districtId)).filter(Boolean) as string[])];
      return { r, line, marks, districts };
    });
  }, [d.routes, snap, tl]);

  /** Назва району: повна («Білгород-Дністровський район») і коротка — для карток. */
  const districtNames = useMemo(() => {
    const m = new Map<string, { name: string; short: string }>();
    for (const x of snap?.districts ?? []) {
      const name = tl(x.name, x.nameEn);
      m.set(x.slug, { name, short: shortName(name) });
    }
    return m;
  }, [snap, tl]);

  // Фільтри в адресі: ?tag=wine&district=odeskyy-rayon,izmayilskyy-rayon (районів — скільки завгодно)
  const rawDistricts = params.get("district");
  const districts = useMemo(() => (rawDistricts ?? "").split(",").filter((x) => DISTRICT_SHAPES[x]), [rawDistricts]);
  const inDistrict = useMemo(
    () => (districts.length ? items.filter((x) => x.districts.some((s) => districts.includes(s))) : items),
    [items, districts],
  );

  /** Типи, що трапляються, — у порядку з адмінки (як немає — від найчастішого); лічильник — з урахуванням району. */
  const tags = useMemo(() => {
    const all = new Map<string, number>();
    for (const r of d.routes) for (const t of r.tags ?? []) all.set(t, (all.get(t) ?? 0) + 1);
    const here = new Map<string, number>();
    for (const x of inDistrict) for (const t of x.r.tags ?? []) here.set(t, (here.get(t) ?? 0) + 1);
    const ids = ROUTE_TAG_OPTIONS.map((o) => o.id as string).filter((id) => all.has(id));
    const rank = (id: string) => (tagOrder.includes(id) ? tagOrder.indexOf(id) : 999);
    ids.sort((a, b) => rank(a) - rank(b) || (all.get(b) ?? 0) - (all.get(a) ?? 0));
    return ids.map((id) => ({ id, count: here.get(id) ?? 0 }));
  }, [d.routes, inDistrict, tagOrder]);

  const raw = params.get("tag");
  const tag = tags.some((t) => t.id === raw) ? raw : null;
  const setParam = (name: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(name, v);
    else p.delete(name);
    setParams(p, { replace: true, preventScrollReset: true });
  };
  const setTag = (v: string | null) => setParam("tag", v);
  /** Додати район до вибору або прибрати з нього. */
  const toggleDistrict = (slug: string) => {
    const next = districts.includes(slug) ? districts.filter((x) => x !== slug) : [...districts, slug];
    setParam("district", next.length ? next.join(",") : null);
  };
  const clearDistricts = () => setParam("district", null);
  /** Скинути обидва фільтри разом (два setParam поспіль перезаписали б один одного). */
  const resetFilters = () => {
    const p = new URLSearchParams(params);
    p.delete("tag");
    p.delete("district");
    setParams(p, { replace: true, preventScrollReset: true });
  };

  const ofTag = useMemo(() => (tag ? items.filter((x) => x.r.tags?.includes(tag)) : items), [items, tag]);
  const shown = useMemo(
    () => (districts.length ? ofTag.filter((x) => x.districts.some((s) => districts.includes(s))) : ofTag),
    [ofTag, districts],
  );

  const stats = useMemo(() => {
    const stops = new Set<string>();
    const districts = new Set<string>();
    for (const x of items) {
      for (const s of d.stopsOf(x.r)) stops.add(s.id);
      for (const s of x.districts) districts.add(s);
    }
    return { routes: items.length, stops: stops.size, districts: districts.size };
  }, [items, d]);

  return { d, items, shown, tags, tag, setTag, districts, toggleDistrict, clearDistricts, resetFilters, districtNames, inDistrict, stats, loading: !d.ready };
}

export type RoutesPageData = ReturnType<typeof useRoutesPage>;
