import { db } from "@/lib/apiClient";

export type Guide = {
  id: string;
  surname: string;
  firstName: string;
  cert?: string;
  languages: string[];
  personalUrl?: string;
  photoUrl?: string;
  dstu: boolean;
  published: boolean;
  sortOrder: number;
};

const mapRow = (row: any): Guide => ({
  id: row.id,
  surname: row.surname,
  firstName: row.first_name ?? "",
  cert: row.cert ?? undefined,
  languages: Array.isArray(row.languages) ? row.languages : [],
  personalUrl: row.personal_url ?? undefined,
  photoUrl: row.photo_url ?? undefined,
  dstu: Boolean(row.dstu),
  published: Boolean(row.published),
  sortOrder: row.sort_order ?? 0,
});

const toRow = (g: Guide) => ({
  id: g.id,
  surname: g.surname,
  first_name: g.firstName,
  cert: g.cert ?? null,
  languages: g.languages,
  personal_url: g.personalUrl ?? null,
  photo_url: g.photoUrl ?? null,
  dstu: g.dstu,
  published: g.published,
  sort_order: g.sortOrder,
});

export async function loadGuides(publishedOnly = false): Promise<Guide[]> {
  let q = db.from("guides").select("*").order("sort_order").order("surname");
  if (publishedOnly) q = q.eq("published", true);
  const { data, error } = await q;
  if (error) { console.error(error); return []; }
  return (data ?? []).map(mapRow);
}

export async function upsertGuide(guide: Guide): Promise<void> {
  const { error } = await db.from("guides").upsert(toRow(guide));
  if (error) throw error;
}

export async function deleteGuide(id: string): Promise<void> {
  const { error } = await db.from("guides").delete().eq("id", id);
  if (error) throw error;
}
