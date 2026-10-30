import type { TourismObject } from "@/types/hierarchy";
import type { Route } from "@/lib/routesRepository";
import { getObjectCoords } from "@/lib/geo";

/**
 * Точки з повного посилання Google Maps «Маршрути» (`/maps/dir/…`): у його
 * data-частині кожна зупинка закодована як `!1d<lng>!2d<lat>`. Короткі
 * посилання (maps.app.goo.gl), «Мої карти» (`/maps/d/viewer?mid=`) і посилання
 * на одну точку (`?q=lat,lng`) таких даних не містять.
 *
 * Окремий легкий модуль (а не RouteMap), щоб сторінки й адмінка могли
 * перевіряти посилання, не тягнучи MapLibre у свій бандл.
 */
export function extractCoords(url: string): [number, number][] {
  const pairs: [number, number][] = [];
  const regex = /!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/g;
  let m;
  while ((m = regex.exec(url)) !== null) pairs.push([parseFloat(m[1]), parseFloat(m[2])]);
  return pairs;
}

export type RouteWaypoint = { coordIndex: number; object: TourismObject };

export type RouteGeometry = {
  /** Зупинки у порядку маршруту (для списку на сторінці). */
  stops: TourismObject[];
  /**
   * Звідки взято лінію: з точок посилання, з координат прикріплених об'єктів,
   * або її немає зовсім (немає ні точок у посиланні, ні координат в об'єктів).
   */
  source: "link" | "objects" | "none";
  /** Координати [lng, lat] для карти; для source "link" карта бере їх із посилання сама. */
  coords: [number, number][];
  waypoints: RouteWaypoint[];
};

/**
 * Порядок зупинок: спершу ті, що прив'язані до точок посилання (у порядку
 * точок), далі решта прикріплених об'єктів у порядку, заданому в адмінці.
 */
export function orderedRouteObjectIds(route: Pick<Route, "objectIds" | "waypointObjectIds">): string[] {
  const out: string[] = [];
  for (const id of [...(route.waypointObjectIds ?? []), ...(route.objectIds ?? [])]) {
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

export function routeGeometry(
  route: Pick<Route, "mapUrl" | "objectIds" | "waypointObjectIds">,
  objects: TourismObject[],
): RouteGeometry {
  const byId = new Map(objects.filter(o => o.published).map(o => [o.id, o]));
  const stops = orderedRouteObjectIds(route)
    .map(id => byId.get(id))
    .filter((o): o is TourismObject => Boolean(o));

  const linkCoords = extractCoords(route.mapUrl ?? "");
  if (linkCoords.length > 0) {
    const waypoints = (route.waypointObjectIds ?? [])
      .map((id, i) => {
        const object = id ? byId.get(id) : undefined;
        return object ? { coordIndex: i, object } : null;
      })
      .filter((w): w is RouteWaypoint => Boolean(w));
    return { stops, source: "link", coords: linkCoords, waypoints };
  }

  // У посиланні немає точок — будуємо маршрут за координатами самих об'єктів.
  const placed = stops
    .map(object => ({ object, c: getObjectCoords(object) }))
    .filter((x): x is { object: TourismObject; c: NonNullable<ReturnType<typeof getObjectCoords>> } => Boolean(x.c));
  if (!placed.length) return { stops, source: "none", coords: [], waypoints: [] };
  return {
    stops,
    source: "objects",
    coords: placed.map(p => [p.c.lng, p.c.lat]),
    waypoints: placed.map((p, i) => ({ coordIndex: i, object: p.object })),
  };
}
