import { db } from "@/lib/apiClient";

export type Route = {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  content?: string;
  contentEn?: string;
  imageUrl?: string;
  videoUrl?: string;
  mapUrl?: string;
  mapUrl2?: string;
  links?: string;
  objectIds?: string[];
  waypointObjectIds?: (string | null)[];
  duration?: string;
  distance?: string;
  tags?: string[];
  published: boolean;
  sortOrder: number;
};

export const ROUTE_TAG_OPTIONS = [
  { id: "sport",    label: "Спортивний",     emoji: "🏃" },
  { id: "culture",  label: "Культурний",     emoji: "🎨" },
  { id: "religion", label: "Релігійний",     emoji: "⛪" },
  { id: "odesa",    label: "По Одесі",       emoji: "🌊" },
  { id: "nature",   label: "Природний",      emoji: "🌿" },
  { id: "gastro",   label: "Гастрономічний", emoji: "🍷" },
  { id: "history",  label: "Історичний",     emoji: "🏛" },
  { id: "beach",    label: "Пляжний",        emoji: "🏖" },
  { id: "wine",     label: "Винний",         emoji: "🍇" },
  { id: "eco",      label: "Еко",            emoji: "🌱" },
] as const;

const mapRow = (row: any): Route => ({
  id: row.id,
  name: row.name,
  nameEn: row.name_en ?? undefined,
  description: row.description ?? undefined,
  descriptionEn: row.description_en ?? undefined,
  content: row.content ?? undefined,
  contentEn: row.content_en ?? undefined,
  imageUrl: row.image_url ?? undefined,
  videoUrl: row.video_url ?? undefined,
  mapUrl: row.map_url ?? undefined,
  mapUrl2: row.map_url_2 ?? undefined,
  links: row.links ?? undefined,
  objectIds: row.object_ids ?? [],
  waypointObjectIds: row.waypoint_object_ids ?? [],
  duration: row.duration ?? undefined,
  distance: row.distance ?? undefined,
  tags: Array.isArray(row.tags) ? row.tags : [],
  published: Boolean(row.published),
  sortOrder: row.sort_order ?? 0,
});

const toRow = (r: Route) => ({
  id: r.id,
  name: r.name,
  name_en: r.nameEn ?? null,
  description: r.description ?? null,
  description_en: r.descriptionEn ?? null,
  content: r.content ?? null,
  content_en: r.contentEn ?? null,
  image_url: r.imageUrl ?? null,
  video_url: r.videoUrl ?? null,
  map_url: r.mapUrl ?? null,
  map_url_2: r.mapUrl2 ?? null,
  links: r.links ?? null,
  object_ids: r.objectIds ?? [],
  waypoint_object_ids: r.waypointObjectIds ?? [],
  duration: r.duration ?? null,
  distance: r.distance ?? null,
  tags: r.tags ?? [],
  published: r.published,
  sort_order: r.sortOrder,
});

export async function loadRoutes(publishedOnly = false): Promise<Route[]> {
  let q = db.from("routes").select("*").order("sort_order").order("name");
  if (publishedOnly) q = q.eq("published", true);
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return (data ?? []).map(mapRow);
}

export async function upsertRoute(route: Route): Promise<void> {
  const { error } = await db.from("routes").upsert(toRow(route));
  if (error) throw error;
}

export async function deleteRoute(id: string): Promise<void> {
  const { error } = await db.from("routes").delete().eq("id", id);
  if (error) throw error;
}

const TAG_ORDER_CARD_ID = "route-tag-order-settings";

export async function loadRouteTagOrder(): Promise<string[]> {
  const { data } = await db
    .from("content_cards")
    .select("payload")
    .eq("id", TAG_ORDER_CARD_ID)
    .maybeSingle();
  const order = (data?.payload as any)?.order;
  return Array.isArray(order) ? order : [];
}

export async function saveRouteTagOrder(order: string[]): Promise<void> {
  const { error } = await db.from("content_cards").upsert({
    id: TAG_ORDER_CARD_ID,
    page_key: "settings",
    section_key: "route-tag-order",
    card_type: "config",
    title: "Route Tag Order",
    subtitle: null,
    image_url: null,
    href: null,
    city_id: null,
    district_id: null,
    region_id: null,
    sort_order: 0,
    published: true,
    payload: { order },
  });
  if (error) throw error;
}
