import { useMemo } from "react";
import type { TourismObjectType } from "@/types/hierarchy";
import { makeDefaultConfig, type PageSection } from "@/types/pages";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useWithDetails } from "@/hooks/useDetails";
import { usePageConfig } from "@/hooks/usePageConfig";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { withoutArchivedEvents } from "@/lib/eventArchive";
import { getObjectCoords, haversineKm } from "@/lib/geo";
import { useV2 } from "@/v2/i18n";
import { kmFromOdesa } from "@/v2/lib/geo";
import { projectLonLat } from "@/v2/lib/districtShapes";
import { useDistricts } from "@/v2/districts/useDistricts";
import { useRoutesData } from "@/v2/home/routes/useRoutesData";
import type { Place } from "@/v2/district/useDistrictPage";

/** Місце поруч — з відстанню, км (якщо в обох є координати). */
export type NearPlace = Place & { km?: number };
export type Photo = { url: string; title?: string };

/** Повні ряди по 4: до 8 місць; якщо їх 5–7 — лише 4 (без «хвоста» в другому ряду). */
const fullRows = <T,>(list: T[]) => (list.length < 4 ? list : list.slice(0, Math.min(8, list.length - (list.length % 4))));

/** Радіус «Поруч», км — як на старій сторінці. */
const RADIUS = 30;

/**
 * Усе для сторінки туристичного об'єкта (місце, подія, ресторан, готель):
 * сам об'єкт, його пункт і район, фото (головне + галерея з адмінки),
 * координати й відстань від Одеси, місця поруч, маршрути через нього,
 * місце проведення (для події) і блоки з конструктора.
 */
export function usePlacePage(type: TourismObjectType, slug: string | undefined) {
  const { tl } = useV2();
  const { items } = useDistricts();
  const { data: snap, isLoading } = useHierarchySnapshot();
  const routesData = useRoutesData();

  // Повний опис — окремим запитом (у публічному знімку його немає); іде паралельно.
  const o = useWithDetails(snap?.objects.find((x) => x.slug === slug && x.type === type && x.published), "object", slug, type);
  const city = snap?.cities.find((c) => c.id === o?.cityId);
  const district = items.find((d) => d.d.id === o?.districtId);

  const { config } = usePageConfig(type, o?.id ?? null);
  // Галерею адмінка зберігає під ключем «{тип}-{id}» (див. AdminPageEditor).
  const { data: cards } = usePageContentCards(o ? `${type}-${o.id}` : "");

  const sections = useMemo<PageSection[]>(() => {
    if (!o) return [];
    const cfg = config ?? makeDefaultConfig(type, o.id);
    return [...cfg.sections].filter((s) => s.visible).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [config, o, type]);

  /** Головне фото + галерея (без відео й повторів). */
  const photos = useMemo<Photo[]>(() => {
    if (!o) return [];
    const list: Photo[] = o.imageUrl ? [{ url: o.imageUrl }] : [];
    const gallery = (cards ?? [])
      .filter((c) => c.pageKey === `${type}-${o.id}` && c.sectionKey?.startsWith("gallery-") && c.imageUrl && !c.payload?.videoUrl)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const c of gallery) if (!list.some((p) => p.url === c.imageUrl)) list.push({ url: c.imageUrl!, title: c.title || undefined });
    return list;
  }, [cards, o, type]);

  const coords = o ? getObjectCoords(o) : null;
  const km = coords ? Math.round(kmFromOdesa(coords.lat, coords.lng)) : null;
  /** Точка на карті області (одиниці SVG районів). */
  const xy = coords ? projectLonLat(coords.lng, coords.lat) : null;

  /** Поруч: інші місця (не події) у радіусі 30 км від найближчого; без координат — з того ж пункту. */
  const nearby = useMemo<NearPlace[]>(() => {
    if (!o || !snap) return [];
    const cityName = new Map(snap.cities.map((c) => [c.id, tl(c.name, c.nameEn)]));
    const pool = withoutArchivedEvents(snap.objects.filter((x) => x.published && x.id !== o.id && x.type !== "event"));
    const toPlace = (x: (typeof pool)[number], d?: number): NearPlace => ({
      o: x,
      name: tl(x.name, x.nameEn),
      town: x.cityId ? cityName.get(x.cityId) : undefined,
      km: d,
    });
    if (coords) {
      const near = pool
        .map((x) => {
          const c = getObjectCoords(x);
          return c ? { x, d: haversineKm(coords, c) } : null;
        })
        .filter((v): v is { x: (typeof pool)[number]; d: number } => !!v && v.d <= RADIUS)
        .sort((a, b) => a.d - b.d);
      if (near.length) return fullRows(near.map((v) => toPlace(v.x, v.d)));
    }
    return o.cityId ? fullRows(pool.filter((x) => x.cityId === o.cityId).map((x) => toPlace(x))) : [];
  }, [o, snap, coords?.lat, coords?.lng, tl]); // eslint-disable-line react-hooks/exhaustive-deps

  const routes = useMemo(() => (o ? routesData.routes.filter((r) => (r.objectIds ?? []).includes(o.id)) : []), [o, routesData.routes]);
  const venue = o?.venueId ? snap?.objects.find((x) => x.id === o.venueId && x.published) : undefined;

  return {
    o,
    type,
    name: o ? tl(o.name, o.nameEn) : "",
    subtitle: o ? tl(o.subtitle, o.subtitleEn) : "",
    city,
    cityName: city ? tl(city.name, city.nameEn) : "",
    district,
    sections,
    photos,
    coords,
    km,
    xy,
    nearby,
    routes,
    routesData,
    venue,
    snap,
    /** Порожньо: секції ExtraSection шукають тут галерею — її малюємо самі. */
    cards: [] as NonNullable<typeof cards>,
    loading: isLoading && !snap,
  };
}

export type PlacePageData = ReturnType<typeof usePlacePage>;
