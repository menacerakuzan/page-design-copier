import type { TourismObjectType } from "@/types/hierarchy";

/** URL-сегмент сторінки деталей для кожного типу об'єкта. */
export const objectTypeSlug: Record<TourismObjectType, string> = {
  attraction: "mistse",
  event: "podiyi",
  restaurant: "restorany",
  hotel: "hoteli",
};

/** Шлях до сторінки деталей об'єкта. */
export function objectDetailPath(type: TourismObjectType, slug: string): string {
  return `/${objectTypeSlug[type] ?? "mistse"}/${slug}`;
}

/** Людські підписи типів (uk / en). */
export function objectTypeLabel(type: TourismObjectType, lang: "uk" | "en" = "uk"): string {
  const uk: Record<TourismObjectType, string> = {
    attraction: "Туристичний об'єкт",
    event: "Подія",
    restaurant: "Ресторан",
    hotel: "Готель",
  };
  const en: Record<TourismObjectType, string> = {
    attraction: "Attraction",
    event: "Event",
    restaurant: "Restaurant",
    hotel: "Hotel",
  };
  return (lang === "en" ? en : uk)[type] ?? type;
}

/** Акцентний колір типу (читабельний на світлих картках). */
export const objectTypeColor: Record<TourismObjectType, string> = {
  attraction: "#c9973a", // золото
  event: "#9f1f47",      // вино
  restaurant: "#c2410c", // теракота
  hotel: "#0f766e",      // смарагд
};
