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
};

export type City = {
  id: EntityId;
  districtId: EntityId;
  name: string;
  slug: string;
};

export type TourismObjectType = "event" | "hotel" | "restaurant" | "attraction";

export type TourismObject = {
  id: EntityId;
  districtId: EntityId;
  cityId: EntityId;
  type: TourismObjectType;
  name: string;
  slug: string;
  published: boolean;
};
