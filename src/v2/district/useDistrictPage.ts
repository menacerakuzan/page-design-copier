import { useMemo } from "react";
import type { City, TourismObject, TourismObjectType } from "@/types/hierarchy";
import type { PageSection } from "@/types/pages";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { useV2 } from "@/v2/i18n";
import { useDistricts } from "@/v2/districts/useDistricts";
import { useRoutesData } from "@/v2/home/routes/useRoutesData";

/** Місце для списку: об'єкт + назва населеного пункту. */
export type Place = { o: TourismObject; name: string; town?: string };

/** Населений пункт і скільки в ньому місць. */
export type Town = { c: City; name: string; places: number };

/** Види об'єктів у тому порядку, як їх показує конструктор сторінки. */
export const PLACE_KIND: Record<string, TourismObjectType> = {
  places_attraction: "attraction",
  places_event: "event",
  places_restaurant: "restaurant",
  places_hotel: "hotel",
};

/**
 * Усе для сторінки району: сам район (з «характером» зі сторінки «Райони»),
 * сусіди за тим самим порядком, населені пункти, місця за типами, маршрути,
 * що проходять районом, і блоки сторінки з конструктора в адмінці.
 */
export function useDistrictPage(slug: string | undefined) {
  const { tl } = useV2();
  const { items, loading } = useDistricts();
  const { data: snap } = useHierarchySnapshot();
  const routesData = useRoutesData();

  const index = items.findIndex((i) => i.slug === slug);
  const it = index >= 0 ? items[index] : undefined;
  const prev = index > 0 ? items[index - 1] : items[items.length - 1];
  const next = index >= 0 && index < items.length - 1 ? items[index + 1] : items[0];

  const { config } = usePageConfig("district", it?.d.id ?? null);
  const pageKey = `district-${it?.d.id ?? ""}`;
  const { data: cards } = usePageContentCards(pageKey);

  const sections = useMemo<PageSection[]>(
    () => [...(config?.sections ?? [])].filter((s) => s.visible).sort((a, b) => a.sortOrder - b.sortOrder),
    [config],
  );

  const { towns, placesByType } = useMemo(() => {
    const empty = { towns: [] as Town[], placesByType: {} as Record<TourismObjectType, Place[]> };
    if (!it || !snap) return empty;
    const own = snap.objects.filter((o) => o.published && o.districtId === it.d.id);
    const cityName = new Map(it.cities.map((c) => [c.id, tl(c.name, c.nameEn)]));
    const toPlace = (o: TourismObject): Place => ({
      o,
      name: tl(o.name, o.nameEn),
      town: o.cityId ? cityName.get(o.cityId) : undefined,
    });
    const byType = { attraction: [], event: [], restaurant: [], hotel: [] } as Record<TourismObjectType, Place[]>;
    for (const o of own) byType[o.type]?.push(toPlace(o));

    const towns: Town[] = it.cities.map((c) => ({
      c,
      name: tl(c.name, c.nameEn),
      places: own.filter((o) => o.cityId === c.id).length,
    }));
    return { towns, placesByType: byType };
  }, [it, snap, tl]);

  // Маршрути, що мають хоч одну зупинку в цьому районі.
  const routes = useMemo(() => {
    if (!it || !snap) return [];
    const ids = new Set(snap.objects.filter((o) => o.districtId === it.d.id).map((o) => o.id));
    return routesData.routes.filter((r) => (r.objectIds ?? []).some((id) => ids.has(id)));
  }, [it, snap, routesData.routes]);

  return {
    it,
    index,
    total: items.length,
    prev: it ? prev : undefined,
    next: it ? next : undefined,
    sections,
    cards: (cards ?? []).filter((c) => c.pageKey === pageKey),
    towns,
    placesByType,
    routes,
    routesData,
    loading: loading || !snap,
  };
}

export type DistrictPageData = ReturnType<typeof useDistrictPage>;
