export type EntityId = string;

export type Region = {
  id: EntityId;
  name: string;
  slug: string;
};

export type District = {
  id: EntityId;
  regionId: EntityId;
  name: string;
  slug: string;
  subtitle?: string;
  description?: string;
  detailedInfo?: string;
  imageUrl?: string;
  videoUrl?: string;
  reelUrl?: string;
};

export type SettlementType = "місто" | "село" | "селище" | "селище міського типу";

export type City = {
  id: EntityId;
  districtId: EntityId;
  name: string;
  slug: string;
  settlementType?: SettlementType;
  /** English city name for OpenWeather API (e.g. "Odessa"). Falls back to `name` if not set. */
  weatherCityName?: string;
  subtitle?: string;
  description?: string;
  detailedInfo?: string;
  imageUrl?: string;
  videoUrl?: string;
  reelUrl?: string;
};

export type TourismObjectType = "event" | "hotel" | "restaurant" | "attraction";

export type TourismObject = {
  id: EntityId;
  districtId: EntityId;
  cityId: EntityId | null;
  type: TourismObjectType;
  name: string;
  slug: string;
  published: boolean;
  subtitle?: string;
  description?: string;
  detailedInfo?: string;
  imageUrl?: string;
  videoUrl?: string;
  mapUrl?: string;
  address?: string;
  phone?: string;
  website?: string;
  eventDates?: string;
  hours?: string;
  amenities?: string;
  tourismTypes?: string[];
  reelUrl?: string;
};
