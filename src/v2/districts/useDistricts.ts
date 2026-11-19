import { useMemo } from "react";
import type { Details, PublicCity, PublicDistrict } from "@/types/hierarchy";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { plain, useV2 } from "@/v2/i18n";
import { DISTRICT_SHAPES } from "@/v2/lib/districtShapes";

/** Порядок на сторінці: спершу Одеський, далі — з півночі на південь, до Дунаю. */
const ORDER = [
  "odeskyy-rayon",
  "podilskyy-rayon",
  "berezivskyy-rayon",
  "rozdilnyanskyy-rayon",
  "bilhorod-dnistrovskyy-rayon",
  "bolhradskyy-rayon",
  "izmayilskyy-rayon",
];

/**
 * Короткий «характер» району — щоб було легше обрати, куди їхати.
 * Написано за описами районів у БД. ПЕРЕВІРИТИ.
 */
const TAGLINE: Record<string, [string, string]> = {
  "odeskyy-rayon": ["Море, лимани й сама Одеса", "The sea, estuaries and Odesa itself"],
  "podilskyy-rayon": ["Ліси й річкові долини півночі", "Forests and river valleys of the north"],
  "berezivskyy-rayon": ["Степи, лимани й тиша", "Steppe, estuaries and quiet"],
  "rozdilnyanskyy-rayon": ["Степ і водойми неподалік Одеси", "Steppe and lakes close to Odesa"],
  "bilhorod-dnistrovskyy-rayon": ["Фортеця, лиман і вино Шабо", "A fortress, an estuary and Shabo wine"],
  "bolhradskyy-rayon": ["Серце Бессарабії й виноградники", "The heart of Bessarabia and its vineyards"],
  "izmayilskyy-rayon": ["Дунай, дельта й Вилкове", "The Danube, its delta and Vylkove"],
};

/** Запасний варіант для нового району: фраза після тире з першого речення опису. */
const taglineFrom = (text: string) => {
  const m = text.match(/—\s*(?:це\s+)?([^,.]{4,60})/);
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : "";
};

export type DistrictItem = {
  /** Район зі знімка; повний опис (detailedInfo) є лише на сторінці району — її хук довантажує його. */
  d: PublicDistrict & Details;
  slug: string;
  name: string;
  /** Назва без слова «район» — для підписів на карті й плиток. */
  short: string;
  text: string;
  /** Короткий «характер» району одним рядком. */
  tagline: string;
  image?: string;
  cities: PublicCity[];
  /** Опубліковані туристичні об'єкти (як «місць» на головній). */
  places: number;
};

export const shortName = (name: string) => name.replace(/\s*(район|district)\s*$/i, "");

export function useDistricts() {
  const { tl, lang } = useV2();
  const { data: snap, isLoading } = useHierarchySnapshot();

  const items = useMemo<DistrictItem[]>(() => {
    if (!snap) return [];
    const objects = snap.objects.filter((o) => o.published);
    const rank = (slug: string) => {
      const i = ORDER.indexOf(slug);
      return i === -1 ? ORDER.length : i;
    };
    return [...snap.districts]
      .sort((a, b) => rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name))
      .map((d) => {
        const own = objects.filter((o) => o.districtId === d.id);
        const name = tl(d.name, d.nameEn);
        const text = plain(tl(d.description, d.descriptionEn));
        return {
          d,
          slug: d.slug,
          name,
          short: shortName(name),
          text,
          tagline: TAGLINE[d.slug]?.[lang === "en" ? 1 : 0] ?? taglineFrom(text),
          image: d.imageUrl,
          cities: snap.cities.filter((c) => c.districtId === d.id),
          places: own.filter((o) => o.type === "attraction").length,
        };
      });
  }, [snap, tl, lang]);

  return {
    items,
    /** Лише ті райони, для яких є контур на карті. */
    onMap: items.filter((i) => DISTRICT_SHAPES[i.slug]),
    loading: isLoading && !snap,
  };
}
