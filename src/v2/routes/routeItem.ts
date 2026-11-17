import { useMemo } from "react";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import type { Route } from "@/lib/routesRepository";
import { routeGeometry } from "@/lib/routeGeometry";
import { getObjectCoords } from "@/lib/geo";
import { MAP_H, MAP_W, projectLonLat } from "@/v2/lib/districtShapes";
import { shortName } from "@/v2/districts/useDistricts";
import { useV2 } from "@/v2/i18n";

/** Маршрут для міні-карти: сам маршрут + лінія на карті області (в одиницях SVG-карти районів). */
export type RouteItem = {
  r: Route;
  /** Точки лінії [x, y] на карті; одна точка — маршрут в одному місці. */
  line: [number, number][];
  /** Зупинки з координатами — пронумеровані мітки на міні-карті. */
  marks: { x: number; y: number; name: string }[];
  /** Райони, якими проходить маршрут (slug). */
  districts: string[];
};

type Snap = NonNullable<ReturnType<typeof useHierarchySnapshot>["data"]>;
type Tl = ReturnType<typeof useV2>["tl"];

/** Точки поза картою області (помилкові координати) не малюємо. */
const inMap = ([x, y]: [number, number]) => x > -20 && x < MAP_W + 20 && y > -20 && y < MAP_H + 20;

/**
 * Лінія маршруту (з точок посилання Google Maps, а як їх немає — з координат
 * зупинок), пронумеровані зупинки й райони — для міні-карти (RoutePreviewMap).
 */
export function toRouteItem(r: Route, snap: Snap, tl: Tl): RouteItem {
  const districtOf = new Map(snap.districts.map((x) => [x.id, x.slug]));
  const g = routeGeometry(r, snap.objects);
  const line = g.coords.filter(([lng, lat]) => inMap(projectLonLat(lng, lat))).map(([lng, lat]) => projectLonLat(lng, lat));
  // Координати зупинки: з самого об'єкта, а якщо їх там немає — з точки
  // посилання Google Maps, до якої цей об'єкт прив'язаний в адмінці.
  const fromLink = new Map(g.waypoints.map((w) => [w.object.id, g.coords[w.coordIndex]]));
  const marks = g.stops.flatMap((o) => {
    const c = getObjectCoords(o);
    const p = c ? ([c.lng, c.lat] as [number, number]) : fromLink.get(o.id);
    if (!p) return [];
    const [x, y] = projectLonLat(p[0], p[1]);
    return inMap([x, y]) ? [{ x, y, name: tl(o.name, o.nameEn) }] : [];
  });
  const districts = [...new Set(g.stops.map((o) => districtOf.get(o.districtId)).filter(Boolean) as string[])];
  return { r, line, marks, districts };
}

/** Короткі назви районів для підписів на міні-карті (slug → назва). */
export function useDistrictNames() {
  const { tl } = useV2();
  const { data: snap } = useHierarchySnapshot();
  return useMemo(() => {
    const m = new Map<string, { name: string; short: string }>();
    for (const x of snap?.districts ?? []) {
      const name = tl(x.name, x.nameEn);
      m.set(x.slug, { name, short: shortName(name) });
    }
    return m;
  }, [snap, tl]);
}

/**
 * Міні-карта для однієї картки. Знімок ієрархії — з кешу. null замість маршруту —
 * нічого не рахувати (сторінка «Маршрути» передає картці вже пораховане).
 */
export function useRouteItem(r: Route | null): RouteItem | null {
  const { tl } = useV2();
  const { data: snap } = useHierarchySnapshot();
  return useMemo(() => (r && snap ? toRouteItem(r, snap, tl) : null), [r, snap, tl]);
}
