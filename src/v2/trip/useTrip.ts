import { useMemo } from "react";
import type { TourismObject } from "@/types/hierarchy";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useBasket } from "@/lib/basketContext";
import { getObjectCoords, haversineKm } from "@/lib/geo";
import { shortName } from "@/v2/districts/useDistricts";
import { useV2 } from "@/v2/i18n";

/** Збережене місце «Мого маршруту». */
export type TripItem = {
  o: TourismObject;
  name: string;
  /** «Шабо · Білгород-Дністровський» */
  where: string;
  districtSlug?: string;
  districtName?: string;
  lat?: number;
  lng?: number;
  /** Відстань до наступного місця зі списку (по прямій), км. */
  next?: number;
};

/**
 * Дані «Мого маршруту»: збережені (♡) місця у порядку зі сховища браузера,
 * райони, відстані між сусідніми місцями й загальна (по прямій), а також
 * кілька гарних місць, з яких можна почати, коли список порожній.
 */
export function useTrip() {
  const { tl } = useV2();
  const basket = useBasket();
  const { data: snap, isLoading } = useHierarchySnapshot();

  return useMemo(() => {
    const byId = new Map((snap?.objects ?? []).map((o) => [o.id, o]));
    const cities = new Map((snap?.cities ?? []).map((c) => [c.id, tl(c.name, c.nameEn)]));
    const districts = new Map((snap?.districts ?? []).map((d) => [d.id, d]));

    const items: TripItem[] = basket.ids
      .map((id) => byId.get(id))
      .filter((o): o is TourismObject => !!o)
      .map((o) => {
        const c = getObjectCoords(o);
        const d = districts.get(o.districtId);
        const dName = d ? shortName(tl(d.name, d.nameEn)) : undefined;
        const where = [...new Set([o.cityId ? cities.get(o.cityId) : "", dName].filter(Boolean))].join(" · ");
        return { o, name: tl(o.name, o.nameEn), where, districtSlug: d?.slug, districtName: d ? tl(d.name, d.nameEn) : undefined, lat: c?.lat, lng: c?.lng };
      });

    let km = 0;
    const placed = items.filter((x) => x.lat != null);
    for (let i = 0; i < placed.length - 1; i++) {
      const a = placed[i];
      const b = placed[i + 1];
      a.next = haversineKm({ lat: a.lat!, lng: a.lng! }, { lat: b.lat!, lng: b.lng! });
      km += a.next;
    }

    // Групи за районами (у порядку першої появи)
    const groups: { slug: string; name: string; items: TripItem[] }[] = [];
    for (const x of items) {
      const key = x.districtSlug ?? "—";
      const g = groups.find((y) => y.slug === key);
      if (g) g.items.push(x);
      else groups.push({ slug: key, name: x.districtName ?? "", items: [x] });
    }

    // З чого почати: опубліковані пам'ятки з фото й описом, по одній з різних районів
    const seen = new Set<string>();
    const starters = (snap?.objects ?? [])
      .filter((o) => o.published && o.type === "attraction" && o.imageUrl && !basket.ids.includes(o.id))
      .filter((o) => (seen.has(o.districtId) ? false : (seen.add(o.districtId), true)))
      .slice(0, 4);

    return {
      ...basket,
      loading: isLoading || !snap,
      items,
      placed: placed.length,
      km,
      groups,
      districtCount: groups.filter((g) => g.slug !== "—").length,
      starters,
      canBuild: placed.length >= 2,
    };
  }, [basket, snap, isLoading, tl]);
}

export type TripData = ReturnType<typeof useTrip>;
