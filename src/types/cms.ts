export type CardType =
  | "event"
  | "hotel"
  | "restaurant"
  | "attraction"
  | "destination"
  | "offer"
  | "info"
  | "text";

export type ColorPreset = {
  id: string;
  name: string;
  pageBg: string;
  text: string;
  accent: string;
  panel: string;
};

export type ContentCardEntity = {
  id: string;
  pageKey: string;
  sectionKey: string;
  cardType: CardType;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string | null;
  cityId: string | null;
  districtId: string | null;
  regionId: string | null;
  sortOrder: number;
  published: boolean;
  payload: Record<string, any>;
};

export type ContentCardConfig = {
  id: string;
  type: CardType;
  title: string;
  slug: string;
  city: string;
  presetId: string;
  published: boolean;
};

export type AuditEntityType =
  | "tourism_object"
  | "content_card"
  | "region"
  | "district"
  | "city";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "rollback";

export type AdminChangeLog = {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  beforeData: Record<string, any> | null;
  afterData: Record<string, any> | null;
  actorEmail: string | null;
  createdAt: string;
};
