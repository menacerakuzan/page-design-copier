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
};
