/**
 * Кольори плиток «Види туризму». Ключ — назва виду з БД.
 * wine / sea / sun / deep — сусіди в сітці 4×2 не повторюються.
 */
export type MoodColor = "wine" | "sea" | "sun" | "deep";

export const MOOD_COLOR: Record<string, MoodColor> = {
  "Гастрономічний туризм": "wine",
  "Морський туризм": "sea",
  "Релігійний туризм": "sun",
  "Розважальний туризм": "deep",
  "Спортивний туризм": "sun",
  "Сільський та зелений туризм": "wine",
  "Історико-культурний туризм": "sea",
  "Медико-оздоровчий туризм": "sun",
};

/** Фон плитки і колір лінії/тексту на ньому. Фото лягає на фон «м'яким світлом». */
/** photo — контраст і яскравість фото-тла: на світлому золоті фото темніше й контрастніше, інакше вицвітає. */
export const COLOR_STYLE: Record<MoodColor, { bg: string; ink: string; accent: string; photo: { contrast: number; brightness: number } }> = {
  wine: { photo: { contrast: 1.15, brightness: 1 }, bg: "#9f1f47", ink: "#fff2e8", accent: "#df9b3b" },
  sea: { photo: { contrast: 1.15, brightness: 1 }, bg: "#002f5e", ink: "#fff2e8", accent: "#df9b3b" },
  sun: { photo: { contrast: 1.45, brightness: 0.58 }, bg: "#df9b3b", ink: "#002f5e", accent: "#9f1f47" },
  deep: { photo: { contrast: 1.15, brightness: 1 }, bg: "#6e1131", ink: "#fff2e8", accent: "#df9b3b" },
};

/** Яскравість фото-тла для окремих видів (1 — як є). Світлі фото трохи пригашуємо. */
export const PHOTO_BRIGHTNESS: Record<string, number> = {
  "Гастрономічний туризм": 0.8,
  "Сільський та зелений туризм": 0.8,
};
