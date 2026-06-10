import {
  cities as seedCities,
  districts as seedDistricts,
  regions as seedRegions,
  tourismObjects as seedObjects,
} from "@/data/hierarchyMockData";
import { fallbackContentCards } from "@/data/contentCardsFallback";
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient";
import { AdminChangeLog, ContentCardEntity } from "@/types/cms";
import { City, District, Region, TourismObject } from "@/types/hierarchy";

type Snapshot = {
  regions: Region[];
  districts: District[];
  cities: City[];
  objects: TourismObject[];
  contentCards: ContentCardEntity[];
};

const tableNames = {
  regions: "regions",
  districts: "districts",
  cities: "cities",
  objects: "tourism_objects",
  contentCards: "content_cards",
  changeLogs: "admin_change_logs",
} as const;

const isTableMissingError = (error: any) => {
  const code = error?.code ?? "";
  const message = String(error?.message ?? "").toLowerCase();
  return code === "42P01" || message.includes("does not exist");
};

const normalizePayload = (payload: any): Record<string, any> => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) return payload;
  return {};
};

const mapDbCard = (row: any): ContentCardEntity => ({
  id: row.id,
  pageKey: row.page_key,
  sectionKey: row.section_key,
  cardType: row.card_type,
  title: row.title,
  titleEn: row.title_en ?? null,
  subtitle: row.subtitle ?? null,
  subtitleEn: row.subtitle_en ?? null,
  imageUrl: row.image_url ?? null,
  href: row.href ?? null,
  cityId: row.city_id ?? null,
  districtId: row.district_id ?? null,
  regionId: row.region_id ?? null,
  sortOrder: row.sort_order ?? 0,
  published: Boolean(row.published),
  payload: normalizePayload(row.payload),
});

const toDbCard = (card: ContentCardEntity) => ({
  id: card.id,
  page_key: card.pageKey,
  section_key: card.sectionKey,
  card_type: card.cardType,
  title: card.title,
  subtitle: card.subtitle,
  image_url: card.imageUrl,
  href: card.href,
  city_id: card.cityId,
  district_id: card.districtId,
  region_id: card.regionId,
  sort_order: card.sortOrder,
  published: card.published,
  payload: normalizePayload(card.payload),
});

const mapDbObject = (row: any): TourismObject => ({
  id: row.id,
  districtId: row.district_id,
  cityId: row.city_id,
  type: row.type,
  name: row.name,
  nameEn: row.name_en ?? undefined,
  slug: row.slug,
  published: Boolean(row.published),
  subtitle: row.subtitle ?? undefined,
  subtitleEn: row.subtitle_en ?? undefined,
  description: row.description ?? undefined,
  descriptionEn: row.description_en ?? undefined,
  detailedInfo: row.detailed_info ?? undefined,
  detailedInfoEn: row.detailed_info_en ?? undefined,
  imageUrl: row.image_url ?? undefined,
  videoUrl: row.video_url ?? undefined,
  mapUrl: row.map_url ?? undefined,
  address: row.address ?? undefined,
  addressEn: row.address_en ?? undefined,
  phone: row.phone ?? undefined,
  website: row.website ?? undefined,
  eventDates: row.event_dates ?? undefined,
  hours: row.hours ?? undefined,
  hoursEn: row.hours_en ?? undefined,
  amenities: row.amenities ?? undefined,
  amenitiesEn: row.amenities_en ?? undefined,
  tourismTypes: row.tourism_types ?? [],
  reelUrl: row.reel_url ?? undefined,
  reelImageUrl: row.reel_image_url ?? undefined,
  venueId: row.venue_id ?? undefined,
  repertoire: row.repertoire ?? undefined,
  heroFontSize: row.hero_font_size ?? undefined,
});

const mapDbDistrict = (row: any): District => ({
  id: row.id,
  regionId: row.region_id,
  name: row.name,
  nameEn: row.name_en ?? undefined,
  slug: row.slug,
  subtitle: row.subtitle ?? undefined,
  subtitleEn: row.subtitle_en ?? undefined,
  description: row.description ?? undefined,
  descriptionEn: row.description_en ?? undefined,
  detailedInfo: row.detailed_info ?? undefined,
  imageUrl: row.image_url ?? undefined,
  videoUrl: row.video_url ?? undefined,
  reelUrl: row.reel_url ?? undefined,
});

const mapDbCity = (row: any): City => ({
  id: row.id,
  districtId: row.district_id,
  name: row.name,
  nameEn: row.name_en ?? undefined,
  slug: row.slug,
  settlementType: row.settlement_type ?? undefined,
  subtitle: row.subtitle ?? undefined,
  subtitleEn: row.subtitle_en ?? undefined,
  description: row.description ?? undefined,
  descriptionEn: row.description_en ?? undefined,
  detailedInfo: row.detailed_info ?? undefined,
  imageUrl: row.image_url ?? undefined,
  videoUrl: row.video_url ?? undefined,
  reelUrl: row.reel_url ?? undefined,
  weatherCityName: row.weather_city_name ?? undefined,
});

const toDbObject = (obj: TourismObject) => ({
  id: obj.id,
  district_id: obj.districtId,
  city_id: obj.cityId,
  type: obj.type,
  name: obj.name,
  slug: obj.slug,
  published: obj.published,
  subtitle: obj.subtitle ?? null,
  description: obj.description ?? null,
  detailed_info: obj.detailedInfo ?? null,
  image_url: obj.imageUrl ?? null,
  video_url: obj.videoUrl ?? null,
  reel_url: obj.reelUrl ?? null,
  map_url: obj.mapUrl ?? null,
  address: obj.address ?? null,
  phone: obj.phone ?? null,
  website: obj.website ?? null,
  event_dates: obj.eventDates ?? null,
  hours: obj.hours ?? null,
  amenities: obj.amenities ?? null,
  tourism_types: obj.tourismTypes ?? [],
  name_en: obj.nameEn ?? null,
  subtitle_en: obj.subtitleEn ?? null,
  description_en: obj.descriptionEn ?? null,
  detailed_info_en: obj.detailedInfoEn ?? null,
  address_en: obj.addressEn ?? null,
  hours_en: obj.hoursEn ?? null,
  amenities_en: obj.amenitiesEn ?? null,
  reel_image_url: obj.reelImageUrl ?? null,
  venue_id: obj.venueId ?? null,
  repertoire: obj.repertoire ?? null,
  hero_font_size: obj.heroFontSize ?? null,
});

const mapDbChange = (row: any): AdminChangeLog => ({
  id: row.id,
  entityType: row.entity_type,
  entityId: row.entity_id,
  action: row.action,
  beforeData: row.before_data ?? null,
  afterData: row.after_data ?? null,
  actorEmail: row.actor_email ?? null,
  createdAt: row.created_at,
});

const entityTableMap: Record<string, string> = {
  tourism_object: tableNames.objects,
  content_card: tableNames.contentCards,
  region: tableNames.regions,
  district: tableNames.districts,
  city: tableNames.cities,
};

async function getActorEmail() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

async function appendChangeLog(entry: {
  entityType: string;
  entityId: string;
  action: string;
  beforeData: Record<string, any> | null;
  afterData: Record<string, any> | null;
}) {
  if (!hasSupabaseConfig || !supabase) return;
  const actorEmail = await getActorEmail();
  const { error } = await supabase.from(tableNames.changeLogs).insert({
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    before_data: entry.beforeData,
    after_data: entry.afterData,
    actor_email: actorEmail,
  });
  if (error && !isTableMissingError(error)) {
    throw error;
  }
}

export async function loadHierarchySnapshot(): Promise<Snapshot> {
  if (!hasSupabaseConfig || !supabase) {
    return {
      regions: seedRegions,
      districts: seedDistricts,
      cities: seedCities,
      objects: seedObjects,
      contentCards: fallbackContentCards,
    };
  }

  const [regionsRes, districtsRes, citiesRes, objectsRes, contentCardsRes] = await Promise.all([
    supabase.from(tableNames.regions).select("*").order("name"),
    supabase.from(tableNames.districts).select("*").order("name"),
    supabase.from(tableNames.cities).select("*").order("name"),
    supabase.from(tableNames.objects).select("*").order("name"),
    supabase.from(tableNames.contentCards).select("*").order("sort_order").order("title"),
  ]);

  if (regionsRes.error) throw regionsRes.error;
  if (districtsRes.error) throw districtsRes.error;
  if (citiesRes.error) throw citiesRes.error;
  if (objectsRes.error) throw objectsRes.error;
  if (contentCardsRes.error && !isTableMissingError(contentCardsRes.error)) throw contentCardsRes.error;

  return {
    regions: (regionsRes.data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
    })) as Region[],
    districts: (districtsRes.data ?? []).map(mapDbDistrict) as District[],
    cities: (citiesRes.data ?? []).map(mapDbCity) as City[],
    objects: (objectsRes.data ?? []).map(mapDbObject) as TourismObject[],
    contentCards: contentCardsRes.error
      ? fallbackContentCards
      : (contentCardsRes.data ?? []).map(mapDbCard),
  };
}

export async function loadPublishedContentCards(pageKey: string) {
  if (!hasSupabaseConfig || !supabase) {
    return fallbackContentCards
      .filter((card) => card.pageKey === pageKey && card.published)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }

  const { data, error } = await supabase
    .from(tableNames.contentCards)
    .select("*")
    .eq("page_key", pageKey)
    .eq("published", true)
    .order("sort_order")
    .order("title");
  if (error) {
    if (isTableMissingError(error)) {
      return fallbackContentCards
        .filter((card) => card.pageKey === pageKey && card.published)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
    }
    throw error;
  }
  return (data ?? []).map(mapDbCard);
}

export async function upsertTourismObject(obj: TourismObject) {
  if (!hasSupabaseConfig || !supabase) return obj;
  const { data: beforeData, error: beforeError } = await supabase
    .from(tableNames.objects)
    .select("*")
    .eq("id", obj.id)
    .maybeSingle();
  if (beforeError) throw beforeError;

  const dbObj = toDbObject(obj);
  const { error } = await supabase.from(tableNames.objects).upsert(dbObj);
  if (error) throw error;

  await appendChangeLog({
    entityType: "tourism_object",
    entityId: obj.id,
    action: beforeData ? "update" : "create",
    beforeData: beforeData ?? null,
    afterData: dbObj,
  });
  return obj;
}

export async function insertTourismObject(obj: TourismObject) {
  if (!hasSupabaseConfig || !supabase) return obj;
  const dbObj = toDbObject(obj);
  const { error } = await supabase.from(tableNames.objects).insert(dbObj);
  if (error) throw error;
  await appendChangeLog({
    entityType: "tourism_object",
    entityId: obj.id,
    action: "create",
    beforeData: null,
    afterData: dbObj,
  });
  return obj;
}

export async function deleteTourismObject(id: string) {
  if (!hasSupabaseConfig || !supabase) return;
  const { data: beforeData, error: beforeError } = await supabase
    .from(tableNames.objects)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (beforeError) throw beforeError;

  const { error } = await supabase.from(tableNames.objects).delete().eq("id", id);
  if (error) throw error;
  await appendChangeLog({
    entityType: "tourism_object",
    entityId: id,
    action: "delete",
    beforeData: beforeData ?? null,
    afterData: null,
  });
}

export async function upsertContentCard(card: ContentCardEntity) {
  if (!hasSupabaseConfig || !supabase) return card;
  const { data: beforeData, error: beforeError } = await supabase
    .from(tableNames.contentCards)
    .select("*")
    .eq("id", card.id)
    .maybeSingle();
  if (beforeError) throw beforeError;

  const dbCard = toDbCard(card);
  const { error } = await supabase.from(tableNames.contentCards).upsert(dbCard);
  if (error) throw error;
  await appendChangeLog({
    entityType: "content_card",
    entityId: card.id,
    action: beforeData ? "update" : "create",
    beforeData: beforeData ?? null,
    afterData: dbCard,
  });
  return card;
}

export async function insertContentCard(card: ContentCardEntity) {
  if (!hasSupabaseConfig || !supabase) return card;
  const dbCard = toDbCard(card);
  const { error } = await supabase.from(tableNames.contentCards).insert(dbCard);
  if (error) throw error;
  await appendChangeLog({
    entityType: "content_card",
    entityId: card.id,
    action: "create",
    beforeData: null,
    afterData: dbCard,
  });
  return card;
}

export async function deleteContentCard(id: string) {
  if (!hasSupabaseConfig || !supabase) return;
  const { data: beforeData, error: beforeError } = await supabase
    .from(tableNames.contentCards)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (beforeError) throw beforeError;

  const { error } = await supabase.from(tableNames.contentCards).delete().eq("id", id);
  if (error) throw error;
  await appendChangeLog({
    entityType: "content_card",
    entityId: id,
    action: "delete",
    beforeData: beforeData ?? null,
    afterData: null,
  });
}

export async function loadChangeLogs(limit = 80) {
  if (!hasSupabaseConfig || !supabase) return [] as AdminChangeLog[];
  const { data, error } = await supabase
    .from(tableNames.changeLogs)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isTableMissingError(error)) return [] as AdminChangeLog[];
    throw error;
  }
  return (data ?? []).map(mapDbChange);
}

export async function rollbackChange(logId: string) {
  if (!hasSupabaseConfig || !supabase) return;
  const { data: logRow, error: logError } = await supabase
    .from(tableNames.changeLogs)
    .select("*")
    .eq("id", logId)
    .maybeSingle();
  if (logError) throw logError;
  if (!logRow) return;

  const table = entityTableMap[logRow.entity_type];
  if (!table) return;

  if (logRow.action === "create") {
    const { error } = await supabase.from(table).delete().eq("id", logRow.entity_id);
    if (error) throw error;
  } else if (logRow.before_data) {
    const { error } = await supabase.from(table).upsert(logRow.before_data);
    if (error) throw error;
  }

  await appendChangeLog({
    entityType: logRow.entity_type,
    entityId: logRow.entity_id,
    action: "rollback",
    beforeData: logRow.after_data ?? null,
    afterData: logRow.before_data ?? null,
  });
}

export async function syncContentCardsFromFallback() {
  if (!hasSupabaseConfig || !supabase) return;
  const rows = fallbackContentCards.map(toDbCard);
  const { error } = await supabase.from(tableNames.contentCards).upsert(rows);
  if (error) throw error;
}

export async function insertRegion(region: Region) {
  if (!hasSupabaseConfig || !supabase) return region;
  const dbRegion = { id: region.id, name: region.name, slug: region.slug };
  const { error } = await supabase.from(tableNames.regions).insert(dbRegion);
  if (error) throw error;
  await appendChangeLog({
    entityType: "region",
    entityId: region.id,
    action: "create",
    beforeData: null,
    afterData: dbRegion,
  });
  return region;
}

export async function insertDistrict(district: District) {
  if (!hasSupabaseConfig || !supabase) return district;
  const dbDistrict = {
    id: district.id,
    region_id: district.regionId,
    name: district.name,
    slug: district.slug,
    subtitle: district.subtitle ?? null,
    description: district.description ?? null,
    detailed_info: district.detailedInfo ?? null,
    image_url: district.imageUrl ?? null,
    video_url: district.videoUrl ?? null,
    reel_url: district.reelUrl ?? null,
    name_en: district.nameEn ?? null,
    subtitle_en: district.subtitleEn ?? null,
    description_en: district.descriptionEn ?? null,
  };
  const { error } = await supabase.from(tableNames.districts).upsert(dbDistrict);
  if (error) throw error;
  await appendChangeLog({
    entityType: "district",
    entityId: district.id,
    action: "create",
    beforeData: null,
    afterData: dbDistrict,
  });
  return district;
}

export async function upsertDistrict(district: District) {
  if (!hasSupabaseConfig || !supabase) return district;
  const { data: beforeData } = await supabase.from(tableNames.districts).select("*").eq("id", district.id).maybeSingle();
  const dbDistrict = {
    id: district.id,
    region_id: district.regionId,
    name: district.name,
    slug: district.slug,
    subtitle: district.subtitle ?? null,
    description: district.description ?? null,
    detailed_info: district.detailedInfo ?? null,
    image_url: district.imageUrl ?? null,
    video_url: district.videoUrl ?? null,
    reel_url: district.reelUrl ?? null,
    name_en: district.nameEn ?? null,
    subtitle_en: district.subtitleEn ?? null,
    description_en: district.descriptionEn ?? null,
  };
  const { error } = await supabase.from(tableNames.districts).upsert(dbDistrict);
  if (error) throw error;
  await appendChangeLog({
    entityType: "district",
    entityId: district.id,
    action: beforeData ? "update" : "create",
    beforeData: beforeData ?? null,
    afterData: dbDistrict,
  });
  return district;
}

export async function insertCity(city: City) {
  if (!hasSupabaseConfig || !supabase) return city;
  const dbCity = {
    id: city.id,
    district_id: city.districtId,
    name: city.name,
    slug: city.slug,
    subtitle: city.subtitle ?? null,
    description: city.description ?? null,
    detailed_info: city.detailedInfo ?? null,
    settlement_type: city.settlementType ?? null,
    image_url: city.imageUrl ?? null,
    video_url: city.videoUrl ?? null,
    reel_url: city.reelUrl ?? null,
    weather_city_name: city.weatherCityName ?? null,
    name_en: city.nameEn ?? null,
    subtitle_en: city.subtitleEn ?? null,
    description_en: city.descriptionEn ?? null,
  };
  const { error } = await supabase.from(tableNames.cities).upsert(dbCity);
  if (error) throw error;
  await appendChangeLog({
    entityType: "city",
    entityId: city.id,
    action: "create",
    beforeData: null,
    afterData: dbCity,
  });
  return city;
}

export async function upsertCity(city: City) {
  if (!hasSupabaseConfig || !supabase) return city;
  const { data: beforeData } = await supabase.from(tableNames.cities).select("*").eq("id", city.id).maybeSingle();
  const dbCity = {
    id: city.id,
    district_id: city.districtId,
    name: city.name,
    slug: city.slug,
    subtitle: city.subtitle ?? null,
    description: city.description ?? null,
    detailed_info: city.detailedInfo ?? null,
    settlement_type: city.settlementType ?? null,
    image_url: city.imageUrl ?? null,
    video_url: city.videoUrl ?? null,
    reel_url: city.reelUrl ?? null,
    weather_city_name: city.weatherCityName ?? null,
    name_en: city.nameEn ?? null,
    subtitle_en: city.subtitleEn ?? null,
    description_en: city.descriptionEn ?? null,
  };
  const { error } = await supabase.from(tableNames.cities).upsert(dbCity);
  if (error) throw error;
  await appendChangeLog({
    entityType: "city",
    entityId: city.id,
    action: beforeData ? "update" : "create",
    beforeData: beforeData ?? null,
    afterData: dbCity,
  });
  return city;
}

export async function deleteRegion(id: string) {
  if (!hasSupabaseConfig || !supabase) return;
  const { data: beforeData, error: beforeError } = await supabase
    .from(tableNames.regions)
    .select("*")
    .eq("id", id)
    .single();
  if (beforeError) throw beforeError;
  const { error } = await supabase.from(tableNames.regions).delete().eq("id", id);
  if (error) throw error;
  await appendChangeLog({
    entityType: "region",
    entityId: id,
    action: "delete",
    beforeData: beforeData ?? null,
    afterData: null,
  });
}

export async function deleteDistrict(id: string) {
  if (!hasSupabaseConfig || !supabase) return;
  const { data: beforeData, error: beforeError } = await supabase
    .from(tableNames.districts)
    .select("*")
    .eq("id", id)
    .single();
  if (beforeError) throw beforeError;
  const { error } = await supabase.from(tableNames.districts).delete().eq("id", id);
  if (error) throw error;
  await appendChangeLog({
    entityType: "district",
    entityId: id,
    action: "delete",
    beforeData: beforeData ?? null,
    afterData: null,
  });
}

export async function deleteCity(id: string) {
  if (!hasSupabaseConfig || !supabase) return;
  const { data: beforeData, error: beforeError } = await supabase
    .from(tableNames.cities)
    .select("*")
    .eq("id", id)
    .single();
  if (beforeError) throw beforeError;
  const { error } = await supabase.from(tableNames.cities).delete().eq("id", id);
  if (error) throw error;
  await appendChangeLog({
    entityType: "city",
    entityId: id,
    action: "delete",
    beforeData: beforeData ?? null,
    afterData: null,
  });
}
