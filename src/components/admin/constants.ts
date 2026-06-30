import { TourismObjectType } from "@/types/hierarchy";

export const TOURISM_TYPES = [
  "Гастрономічний туризм",
  "Історико-культурний туризм",
  "Медико-оздоровчий туризм",
  "Морський туризм",
  "Релігійний туризм",
  "Розважальний туризм",
  "Сільський та зелений туризм",
  "Спортивний туризм",
];

export const PLACE_TYPES: { value: TourismObjectType; label: string; color: string }[] = [
  { value: "attraction", label: "Туристичний об'єкт", color: "#002f5e" },
  { value: "event",      label: "Подія",              color: "#9f1f47" },
  { value: "restaurant", label: "Ресторан",            color: "#eea846" },
  { value: "hotel",      label: "Готель",              color: "#17a358" },
];
