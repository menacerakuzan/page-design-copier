import { describe, it, expect } from "vitest";
import { extractCoords, orderedRouteObjectIds, routeGeometry } from "./routeGeometry";
import type { TourismObject } from "@/types/hierarchy";

const obj = (id: string, extra: Partial<TourismObject> = {}): TourismObject => ({
  id, districtId: "d", cityId: null, type: "attraction", name: id, slug: id, published: true, ...extra,
});
const A = obj("a", { latitude: 46.1, longitude: 30.1 });
const B = obj("b", { latitude: 46.2, longitude: 30.2 });
const C = obj("c", { latitude: 46.3, longitude: 30.3 });
const NOPOS = obj("n");
const DRAFT = obj("x", { published: false, latitude: 46.4, longitude: 30.4 });
const all = [A, B, C, NOPOS, DRAFT];

const DIR = "https://www.google.com/maps/dir/A/B/data=!4m8!4m7!1m2!1m1!1s0x0!2m2!1d30.7309967!2d46.483237!1m2!1m1!1s0x0!2m2!1d30.7316085!2d46.4848165";
const MYMAPS = "https://www.google.com/maps/d/viewer?mid=17MvtHzKJ6Blpuuqi4WdeVZw4jeqHDQG0&ll=45.9,29.6&z=9";

describe("extractCoords", () => {
  it("бере точки з повного посилання «Маршрути» як [lng, lat]", () => {
    expect(extractCoords(DIR)).toEqual([[30.7309967, 46.483237], [30.7316085, 46.4848165]]);
  });
  it("короткі посилання, «Мої карти» й одна точка точок не мають", () => {
    expect(extractCoords("https://maps.app.goo.gl/b9EfC2aZFxTsDhGn7")).toEqual([]);
    expect(extractCoords(MYMAPS)).toEqual([]);
    expect(extractCoords("https://maps.google.com/maps?q=46.47,30.19&z=16")).toEqual([]);
  });
});

describe("routeGeometry", () => {
  it("посилання з точками — лінія з посилання, об'єкти прив'язані до точок", () => {
    const g = routeGeometry({ mapUrl: DIR, objectIds: ["b", "a"], waypointObjectIds: ["a", "b"] }, all);
    expect(g.source).toBe("link");
    expect(g.waypoints.map(w => [w.coordIndex, w.object.id])).toEqual([[0, "a"], [1, "b"]]);
    expect(g.stops.map(o => o.id)).toEqual(["a", "b"]);
  });

  it("посилання без точок («Дорога вина») — маршрут за координатами об'єктів у їх порядку", () => {
    const g = routeGeometry({ mapUrl: MYMAPS, objectIds: ["c", "a", "b"], waypointObjectIds: [] }, all);
    expect(g.source).toBe("objects");
    expect(g.coords).toEqual([[30.3, 46.3], [30.1, 46.1], [30.2, 46.2]]);
    expect(g.waypoints.map(w => [w.coordIndex, w.object.id])).toEqual([[0, "c"], [1, "a"], [2, "b"]]);
  });

  it("маршрут без посилання теж отримує карту", () => {
    expect(routeGeometry({ objectIds: ["a", "b"] }, all).source).toBe("objects");
  });

  it("об'єкт без координат лишається у списку зупинок, але не ламає нумерацію точок", () => {
    const g = routeGeometry({ objectIds: ["a", "n", "b"] }, all);
    expect(g.stops.map(o => o.id)).toEqual(["a", "n", "b"]);
    expect(g.waypoints.map(w => [w.coordIndex, w.object.id])).toEqual([[0, "a"], [1, "b"]]);
  });

  it("неопубліковані об'єкти не потрапляють ні в список, ні на карту", () => {
    const g = routeGeometry({ objectIds: ["a", "x"] }, all);
    expect(g.stops.map(o => o.id)).toEqual(["a"]);
    expect(g.coords).toHaveLength(1);
  });

  it("без посилання й без координат — карти немає", () => {
    expect(routeGeometry({ objectIds: ["n"] }, all)).toMatchObject({ source: "none", coords: [] });
    expect(routeGeometry({}, all).source).toBe("none");
  });
});

describe("orderedRouteObjectIds", () => {
  it("спершу прив'язані до точок (у порядку точок), далі решта, без дублів і порожніх", () => {
    expect(orderedRouteObjectIds({ waypointObjectIds: ["b", null, "a"], objectIds: ["a", "c", "b"] }))
      .toEqual(["b", "a", "c"]);
  });
});

