import { useMemo } from "react";
import type { Route } from "@/lib/routesRepository";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { withoutArchivedEvents } from "@/lib/eventArchive";
import { tourismTypeLabel } from "@/lib/sectionTitles";
import { useV2 } from "@/v2/i18n";
import { DISTRICT_SHAPES, projectLonLat } from "@/v2/lib/districtShapes";
import { useDistricts, type DistrictItem } from "@/v2/districts/useDistricts";
import { useRoutesData } from "@/v2/home/routes/useRoutesData";
import { COLOR_STYLE, MOOD_COLOR, PHOTO_BRIGHTNESS } from "@/v2/home/moods/colors";
import type { Place } from "@/v2/district/useDistrictPage";

/** Порядок видів, якщо в адмінці ще немає карток «tourism-types». */
const TYPES = [
  "Гастрономічний туризм",
  "Історико-культурний туризм",
  "Медико-оздоровчий туризм",
  "Морський туризм",
  "Релігійний туризм",
  "Розважальний туризм",
  "Сільський та зелений туризм",
  "Спортивний туризм",
];

/**
 * Короткий опис кожного виду — щоб було зрозуміло, за чим їхати.
 * Написано за місцями в БД. ПЕРЕВІРИТИ.
 */
const ABOUT: Record<string, [string, string]> = {
  "Гастрономічний туризм": ["Вино Шабо й Бессарабії, сири, дунайська риба і кухні багатьох народів краю.", "Shabo and Bessarabian wine, cheese, Danube fish and the cuisines of many peoples."],
  "Історико-культурний туризм": ["Фортеці, музеї, театри й старі садиби — понад дві з половиною тисячі років історії.", "Fortresses, museums, theatres and old manors — over two and a half thousand years of history."],
  "Медико-оздоровчий туризм": ["Лимани з цілющими грязями, санаторії й морське повітря.", "Estuaries with healing mud, sanatoriums and sea air."],
  "Морський туризм": ["Пляжі Чорного моря, лимани й коси — від Одеси до дельти Дунаю.", "Black Sea beaches, estuaries and spits — from Odesa to the Danube Delta."],
  "Релігійний туризм": ["Монастирі, храми й святині різних конфесій і народів Одещини.", "Monasteries, churches and shrines of the region's many faiths and peoples."],
  "Розважальний туризм": ["Парки, глемпінги, фестивалі й місця, куди їдуть по емоції.", "Parks, glamping, festivals and places to go for the fun of it."],
  "Сільський та зелений туризм": ["Садиби, ферми, заповідники й тиша степу та плавнів.", "Farmsteads, farms, nature reserves and the quiet of steppe and wetlands."],
  "Спортивний туризм": ["Вітрила, велосипед, сапи й активний відпочинок на воді та в степу.", "Sailing, cycling, SUP and active days on the water and in the steppe."],
};

/** Теги маршрутів, що відповідають виду туризму. */
const ROUTE_TAGS: Record<string, string[]> = {
  "Гастрономічний туризм": ["gastro", "wine"],
  "Історико-культурний туризм": ["culture", "history"],
  "Морський туризм": ["beach"],
  "Релігійний туризм": ["religion"],
  "Сільський та зелений туризм": ["nature", "eco"],
  "Спортивний туризм": ["sport"],
};

export type PlaceDot = Place & { district?: DistrictItem; xy?: [number, number] };

export type TourismType = {
  key: string;
  label: string;
  /** «Гастрономічний» + «туризм» (друге — шрифтом ss02). */
  head: string;
  tail: string;
  about: string;
  image?: string;
  /** Кольори плитки — ті самі, що на головній. */
  style: (typeof COLOR_STYLE)[keyof typeof COLOR_STYLE];
  photoFilter: string;
  places: PlaceDot[];
  districts: DistrictItem[];
  routes: Route[];
};

/**
 * Дані сторінки «Види туризму»: вісім видів (порядок і фото — з карток
 * адмінки, як на головній), для кожного — місця з районами й точками на
 * карті, маршрути за тегами та короткий опис.
 */
export function useTypesPage() {
  const { tl, lang } = useV2();
  const { items: districts } = useDistricts();
  const { data: snap } = useHierarchySnapshot();
  const { data: cards } = usePageContentCards("tourism-types");
  const routesData = useRoutesData();

  const types = useMemo<TourismType[]>(() => {
    if (!snap) return [];
    const fromCards = (cards ?? []).filter((c) => c.pageKey === "tourism-types" && c.sectionKey === "type").sort((a, b) => a.sortOrder - b.sortOrder);
    const keys = fromCards.length ? fromCards.map((c) => c.title) : TYPES;
    const image = new Map(fromCards.map((c) => [c.title, c.imageUrl ?? undefined]));
    const cityName = new Map(snap.cities.map((c) => [c.id, tl(c.name, c.nameEn)]));
    const districtById = new Map(districts.map((d) => [d.d.id, d]));
    const objects = withoutArchivedEvents(snap.objects.filter((o) => o.published));

    // Точки — лише ті, що лежать у контурах районів (частина координат у БД хибна).
    const ctx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
    const areas = Object.values(DISTRICT_SHAPES).map((s) => new Path2D(s.d));
    const inRegion = (x: number, y: number) => !ctx || areas.some((a) => ctx.isPointInPath(a, x, y));

    return keys.map((key) => {
      const label = tourismTypeLabel(key, lang);
      const words = label.split(" ");
      const c = COLOR_STYLE[MOOD_COLOR[key] ?? "wine"];
      const places: PlaceDot[] = objects
        .filter((o) => o.tourismTypes?.includes(key))
        .map((o) => {
          const xy = o.latitude && o.longitude ? projectLonLat(o.longitude, o.latitude) : undefined;
          return {
            o,
            name: tl(o.name, o.nameEn),
            town: o.cityId ? cityName.get(o.cityId) : undefined,
            district: districtById.get(o.districtId),
            xy: xy && inRegion(xy[0], xy[1]) ? xy : undefined,
          };
        });
      const ds = districts.filter((d) => places.some((p) => p.o.districtId === d.d.id));
      const tags = ROUTE_TAGS[key] ?? [];
      return {
        key,
        label,
        head: words.length > 1 ? words.slice(0, -1).join(" ") : label,
        tail: words.length > 1 ? words[words.length - 1] : "",
        about: ABOUT[key]?.[lang === "en" ? 1 : 0] ?? "",
        image: image.get(key),
        style: c,
        photoFilter: `grayscale(1) contrast(${c.photo.contrast}) brightness(${c.photo.brightness * (PHOTO_BRIGHTNESS[key] ?? 1)})`,
        places,
        districts: ds,
        routes: routesData.routes.filter((r) => (r.tags ?? []).some((t) => tags.includes(t))),
      };
    });
  }, [snap, cards, districts, routesData.routes, tl, lang]);

  return { types, districts, routesData, loading: !snap };
}

export type TypesPageData = ReturnType<typeof useTypesPage>;
