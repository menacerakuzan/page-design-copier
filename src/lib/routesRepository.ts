import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient";

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
  published: boolean;
  sortOrder: number;
};

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
  published: r.published,
  sort_order: r.sortOrder,
});

export async function loadRoutes(publishedOnly = false): Promise<Route[]> {
  if (!hasSupabaseConfig || !supabase) return [];
  let q = supabase.from("routes").select("*").order("sort_order").order("name");
  if (publishedOnly) q = q.eq("published", true);
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return (data ?? []).map(mapRow);
}

export async function upsertRoute(route: Route): Promise<void> {
  if (!hasSupabaseConfig || !supabase) return;
  const { error } = await supabase.from("routes").upsert(toRow(route));
  if (error) throw error;
}

export async function deleteRoute(id: string): Promise<void> {
  if (!hasSupabaseConfig || !supabase) return;
  const { error } = await supabase.from("routes").delete().eq("id", id);
  if (error) throw error;
}
