export type EntityId = string;

export type Region = {
  id: EntityId;
  name: string;
  nameEn?: string;
  slug: string;
};

export type District = {
  id: EntityId;
  regionId: EntityId;
  name: string;
  nameEn?: string;
  slug: string;
  subtitle?: string;
  subtitleEn?: string;
  description?: string;
  descriptionEn?: string;
  detailedInfo?: string;
  imageUrl?: string;
  videoUrl?: string;
  reelUrl?: string;
  sortOrder?: number;
  audioUrl?: string;
  audioUrlEn?: string;
};

export type SettlementType = "місто" | "село" | "селище" | "селище міського типу";

export type City = {
  id: EntityId;
  districtId: EntityId;
  name: string;
  nameEn?: string;
  slug: string;
  settlementType?: SettlementType;
  weatherCityName?: string;
  subtitle?: string;
  subtitleEn?: string;
  description?: string;
  descriptionEn?: string;
  detailedInfo?: string;
  imageUrl?: string;
  videoUrl?: string;
  reelUrl?: string;
  sortOrder?: number;
  audioUrl?: string;
  audioUrlEn?: string;
};

export type TourismObjectType = "event" | "hotel" | "restaurant" | "attraction";

export type TourismObject = {
  id: EntityId;
  districtId: EntityId;
  cityId: EntityId | null;
  type: TourismObjectType;
  name: string;
  nameEn?: string;
  slug: string;
  published: boolean;
  subtitle?: string;
  subtitleEn?: string;
  description?: string;
  descriptionEn?: string;
  detailedInfo?: string;
  detailedInfoEn?: string;
  imageUrl?: string;
  videoUrl?: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  addressEn?: string;
  phone?: string;
  website?: string;
  eventDates?: string;
  /** YYYY-MM-DD: останній день, коли подія актуальна; наступного дня — в архів. */
  archiveAfter?: string;
  hours?: string;
  hoursEn?: string;
  amenities?: string;
  amenitiesEn?: string;
  tourismTypes?: string[];
  reelUrl?: string;
  reelImageUrl?: string;
  venueId?: string;
  repertoire?: string;
  heroFontSize?: string;
  audioUrl?: string;
  audioUrlEn?: string;
};

/*
 * Публічний (легкий) знімок — без повних описів (detailedInfo*): це найважче в
 * базі, а потрібне лише на сторінці самого місця / міста / району, де його
 * довантажує useDetails. Тип без цих полів — щоб компілятор не дав прочитати
 * їх зі знімка (там їх немає). Див. loadPublicSnapshot в adminRepository.
 */
export type PublicTourismObject = Omit<TourismObject, "detailedInfo" | "detailedInfoEn">;
export type PublicCity = Omit<City, "detailedInfo">;
export type PublicDistrict = Omit<District, "detailedInfo">;

/** Повний опис, що довантажується окремо (useDetails). */
export type Details = { detailedInfo?: string; detailedInfoEn?: string };
