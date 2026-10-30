import type { City, District, TourismObject } from "@/types/hierarchy";
import { objectDetailPath } from "@/lib/entityLinks";
import { parseHours, type ScheduleRow } from "./hours";

export const SITE_ORIGIN = "https://tourism.od.gov.ua";

/** Вільний текст довший за це не влізе в колонку навіть дрібним кеглем. */
const MAX_FREE_TEXT = 220;
const clip = (s: string) => {
  const t = s.replace(/\s+/gu, " ").trim();
  return t.length > MAX_FREE_TEXT ? `${t.slice(0, MAX_FREE_TEXT).replace(/\s+\S*$/u, "")}…` : t;
};

/** Усе, що потрібно постеру, — без залежності від React чи canvas. */
export type PosterItem = {
  slug: string;
  name: string;
  place: string;
  url: string;
  /** Підпис над рядками праворуч від коду; порожній — коду не буде з чим ділити блок. */
  infoTitle: string;
  schedule: ScheduleRow[];
};

/**
 * Постер завжди українською: це друкована табличка для об'єкта в області,
 * а англомовний відвідувач потрапить на англійську версію сторінки за кодом.
 */
export function posterItemFromObject(
  obj: TourismObject,
  cities: City[] = [],
  districts: District[] = [],
): PosterItem {
  const city = obj.cityId ? cities.find(c => c.id === obj.cityId) : undefined;
  const district = districts.find(d => d.id === (city?.districtId ?? obj.districtId));
  const place = [city?.name, district?.name].filter(Boolean).join(" · ");

  let infoTitle = "";
  let schedule: ScheduleRow[] = [];
  // Нерозпізнаний графік повертається одним рядком сирого тексту — його теж обрізаємо.
  const hours = parseHours(obj.hours).map(r => (r.days ? r : { days: "", time: clip(r.time) }));
  if (hours.length) {
    infoTitle = "ГРАФІК РОБОТИ";
    schedule = hours;
  } else if (obj.eventDates?.trim()) {
    infoTitle = "ДАТА ПРОВЕДЕННЯ";
    schedule = [{ days: "", time: clip(obj.eventDates) }];
  } else if (obj.address?.trim()) {
    infoTitle = "АДРЕСА";
    schedule = [{ days: "", time: clip(obj.address) }];
  }

  return {
    slug: obj.slug,
    // Лише стискаємо пробіли — дефіси є частиною складених назв
    // («історико-краєзнавчий», «Білгород-Дністровський»).
    name: obj.name.replace(/\s+/gu, " ").trim(),
    place,
    url: SITE_ORIGIN + objectDetailPath(obj.type, obj.slug),
    infoTitle,
    schedule,
  };
}

/** ASCII-безпечна і стабільна назва файлу. */
export function posterFileBase(item: PosterItem, n?: number): string {
  const slug = item.slug.replace(/[^a-z0-9-]+/giu, "-").replace(/^-+|-+$/gu, "") || "qr";
  return n == null ? `qr-${slug}` : `${String(n).padStart(2, "0")}-${slug}`;
}
