import { useMemo } from "react";
import type { TourismObject, TourismObjectType } from "@/types/hierarchy";
import { makeDefaultConfig, type PageSection } from "@/types/pages";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useWithDetails } from "@/hooks/useDetails";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { useWeather } from "@/hooks/useWeather";
import { withoutArchivedEvents } from "@/lib/eventArchive";
import { useV2 } from "@/v2/i18n";
import { useDistricts } from "@/v2/districts/useDistricts";
import { useRoutesData } from "@/v2/home/routes/useRoutesData";
import { DISTRICT_SHAPES, projectLonLat } from "@/v2/lib/districtShapes";
import type { Place, Town } from "@/v2/district/useDistrictPage";

/** Населений пункт району з точкою на карті (середнє координат його місць). */
export type TownDot = Town & { xy?: [number, number] };

/**
 * Точка пункту на карті: середнє координат його місць, що лежать у межах
 * контуру району (у частини місць у базі хибні координати — їх відкидаємо).
 */
function townPoints(slug: string, objects: TourismObject[]) {
  const shape = DISTRICT_SHAPES[slug];
  const ctx = shape && typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
  const area = shape ? new Path2D(shape.d) : null;
  const acc = new Map<string, { x: number; y: number; n: number }>();
  for (const o of objects) {
    if (!o.cityId || !o.latitude || !o.longitude) continue;
    const [x, y] = projectLonLat(o.longitude, o.latitude);
    if (ctx && area && !ctx.isPointInPath(area, x, y)) continue;
    const a = acc.get(o.cityId) ?? { x: 0, y: 0, n: 0 };
    acc.set(o.cityId, { x: a.x + x, y: a.y + y, n: a.n + 1 });
  }
  return new Map([...acc].map(([id, a]) => [id, [a.x / a.n, a.y / a.n] as [number, number]]));
}

/**
 * Усе для сторінки населеного пункту: сам пункт, його район (з «характером»),
 * сусідні пункти району, місця за типами, маршрути через його місця, погода
 * і блоки сторінки з конструктора в адмінці.
 */
export function useTownPage(slug: string | undefined) {
  const { tl } = useV2();
  const { items, loading } = useDistricts();
  const { data: snap } = useHierarchySnapshot();
  const routesData = useRoutesData();

  // Повний опис міста — окремим запитом (у публічному знімку його немає).
  const c = useWithDetails(snap?.cities.find((x) => x.slug === slug), "city", slug);
  const district = items.find((d) => d.d.id === c?.districtId);

  const { config } = usePageConfig("city", c?.id ?? null);
  const pageKey = `city-${c?.id ?? ""}`;
  const { data: cards } = usePageContentCards(pageKey);
  const { data: weather } = useWeather(c?.weatherCityName?.trim() || null);

  const sections = useMemo<PageSection[]>(() => {
    if (!c) return [];
    const cfg = config ?? makeDefaultConfig("city", c.id);
    return [...cfg.sections].filter((s) => s.visible).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [config, c]);

  const { placesByType, towns } = useMemo(() => {
    const empty = { placesByType: {} as Record<TourismObjectType, Place[]>, towns: [] as TownDot[] };
    if (!c || !snap) return empty;
    const published = withoutArchivedEvents(snap.objects.filter((o) => o.published));
    const name = tl(c.name, c.nameEn);
    const byType = { attraction: [], event: [], restaurant: [], hotel: [] } as Record<TourismObjectType, Place[]>;
    for (const o of published) if (o.cityId === c.id) byType[o.type]?.push({ o, name: tl(o.name, o.nameEn), town: name });

    const inDistrict = published.filter((o) => o.districtId === c.districtId);
    const points = district ? townPoints(district.slug, inDistrict) : new Map();
    const towns: TownDot[] = snap.cities
      .filter((x) => x.districtId === c.districtId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
      .map((x) => ({
        c: x,
        name: tl(x.name, x.nameEn),
        places: inDistrict.filter((o) => o.cityId === x.id && o.type === "attraction").length,
        xy: points.get(x.id),
      }));
    return { placesByType: byType, towns };
  }, [c, snap, district, tl]);

  // Маршрути, що мають хоч одну зупинку в цьому пункті.
  const routes = useMemo(() => {
    if (!c || !snap) return [];
    const ids = new Set(snap.objects.filter((o) => o.cityId === c.id).map((o) => o.id));
    return routesData.routes.filter((r) => (r.objectIds ?? []).some((id) => ids.has(id)));
  }, [c, snap, routesData.routes]);

  const self = towns.find((x) => x.c.id === c?.id);

  return {
    c,
    name: c ? tl(c.name, c.nameEn) : "",
    subtitle: c ? tl(c.subtitle, c.subtitleEn) : "",
    district,
    sections,
    cards: (cards ?? []).filter((x) => x.pageKey === pageKey),
    placesByType,
    /** Усі пункти району (разом із цим), з точками на карті. */
    towns,
    /** Інші пункти району — для «Ще в районі». */
    siblings: towns.filter((x) => x.c.id !== c?.id),
    self,
    routes,
    routesData,
    weather: weather ?? null,
    loading: loading || !snap,
  };
}

export type TownPageData = ReturnType<typeof useTownPage>;

/** Місця потрібного виду для блоку конструктора (з фільтром адмінки). */
export function townPlacesFor(data: TownPageData, kind: TourismObjectType, s: PageSection): Place[] {
  let list = data.placesByType[kind] ?? [];
  if (s.filter?.entityIds?.length) {
    const byId = new Map(list.map((p) => [p.o.id, p]));
    list = s.filter.entityIds.map((id) => byId.get(id)).filter((p): p is Place => !!p);
  }
  if (s.filter?.limit) list = list.slice(0, s.filter.limit);
  return list;
}
