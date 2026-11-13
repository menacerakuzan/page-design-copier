import { useMemo } from "react";
import type { TourismObject } from "@/types/hierarchy";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { getObjectCoords, haversineKm } from "@/lib/geo";
import { routeGeometry } from "@/lib/routeGeometry";
import { useRoutesData } from "@/v2/home/routes/useRoutesData";
import { shortName } from "@/v2/districts/useDistricts";
import { plain, useV2 } from "@/v2/i18n";

/** Зупинка маршруту для сторінки: об'єкт, координати (з об'єкта або з точки посилання) і відстань до наступної. */
export type RouteStop = {
  o: TourismObject;
  n: number;
  name: string;
  lng?: number;
  lat?: number;
  /** Населений пункт і район — коротко: «Шабо · Білгород-Дністровський». */
  where: string;
  /** Відстань до наступної зупинки по прямій, км. */
  next?: number;
};

/**
 * Дані сторінки маршруту: сам маршрут, зупинки по порядку (координати —
 * з об'єкта, а якщо їх немає — з прив'язаної точки посилання Google Maps),
 * лінія для карти, райони, посилання, схожі маршрути.
 */
export function useRoutePage(id: string | undefined) {
  const d = useRoutesData();
  const { tl } = useV2();
  const { data: snap } = useHierarchySnapshot();
  const route = d.routes.find((r) => r.id === id);

  return useMemo(() => {
    const base = { d, route, snap, loading: !d.ready, notFound: d.ready && !route };
    if (!route || !snap) {
      return { ...base, name: "", desc: "", content: "", stops: [] as RouteStop[], line: [] as [number, number][], linkLine: false, districts: [] as { slug: string; name: string }[], links: [] as { label: string; url: string }[], similar: [] as typeof d.routes, km: 0 };
    }
    const g = routeGeometry(route, snap.objects);
    const fromLink = new Map(g.waypoints.map((w) => [w.object.id, g.coords[w.coordIndex]]));
    const cities = new Map(snap.cities.map((c) => [c.id, tl(c.name, c.nameEn)]));
    const districtsById = new Map(snap.districts.map((x) => [x.id, x]));

    const stops: RouteStop[] = g.stops.map((o, i) => {
      const c = getObjectCoords(o);
      const p = c ? ([c.lng, c.lat] as [number, number]) : fromLink.get(o.id);
      const dist = districtsById.get(o.districtId);
      const where = [o.cityId ? cities.get(o.cityId) : "", dist ? shortName(tl(dist.name, dist.nameEn)) : ""].filter(Boolean);
      return { o, n: i + 1, name: tl(o.name, o.nameEn), lng: p?.[0], lat: p?.[1], where: [...new Set(where)].join(" · ") };
    });
    // Відстань до наступної — по прямій (дорогою зазвичай на 20–40% довше)
    let km = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
        a.next = haversineKm({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
        km += a.next;
      }
    }
    const placed = stops.filter((s) => s.lng != null && s.lat != null);
    // Лінія для карти — через самі зупинки (їхні координати), щоб маркери
    // стояли на лінії. Точки посилання Google Maps часто не збігаються з
    // об'єктами (вхід до парку, проміжна точка на трасі — до 35 км убік),
    // тож беремо їх, лише коли зупинок із координатами менше двох.
    const linkLine = placed.length < 2 && g.source === "link" && g.coords.length > 1;
    const line: [number, number][] = linkLine ? g.coords : placed.map((s) => [s.lng!, s.lat!]);

    const districtSlugs = [...new Set(g.stops.map((o) => districtsById.get(o.districtId)).filter(Boolean))];
    const districts = districtSlugs.map((x) => ({ slug: x!.slug, name: shortName(tl(x!.name, x!.nameEn)) }));

    const links = (route.links ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [label, ...rest] = l.split("|");
        const url = (rest.join("|") || label).trim();
        let host = label.trim();
        if (!rest.length) {
          try {
            host = new URL(url).hostname.replace(/^www\./, "");
          } catch {
            /* не URL — лишаємо як є */
          }
        }
        return { label: host, url };
      });

    // Схожі: спільні типи й райони, без самого маршруту
    const myDistricts = new Set(g.stops.map((o) => o.districtId));
    const myTags = new Set(route.tags ?? []);
    const similar = d.routes
      .filter((r) => r.id !== route.id)
      .map((r) => {
        const tags = (r.tags ?? []).filter((t) => myTags.has(t)).length;
        const dist = (r.objectIds ?? []).filter((oid) => myDistricts.has(snap.objects.find((o) => o.id === oid)?.districtId ?? "")).length;
        return { r, score: tags * 2 + dist };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.r);

    return {
      ...base,
      name: tl(route.name, route.nameEn),
      desc: plain(tl(route.description, route.descriptionEn)),
      content: tl(route.content, route.contentEn) ?? "",
      stops,
      line,
      linkLine,
      districts,
      links,
      similar,
      km,
    };
  }, [d, route, snap, tl]);
}

export type RoutePageData = ReturnType<typeof useRoutePage>;
