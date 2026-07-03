// Каталог даних для асистента: тягне ієрархію з PostgREST (ті самі таблиці, що й
// loadHierarchySnapshot у фронтенді), кешує в памʼяті з TTL і дає компактний
// пошук об'єктів. Модель отримує лише РЕАЛЬНІ об'єкти звідси (за slug) — тож не
// може вигадати телефон/адресу/сторінку.

import { config } from "./config.mjs";

const OBJ_COLS =
  "id,slug,name,name_en,type,published,district_id,city_id,subtitle,subtitle_en,description,description_en,tourism_types,address,address_en,phone,website,image_url,latitude,longitude,event_dates,hours";

let cache = { at: 0, data: null };
let inflight = null;

function headers() {
  return {
    apikey: config.postgrestAnonKey,
    Authorization: `Bearer ${config.postgrestAnonKey}`,
    Accept: "application/json",
  };
}

async function pg(path) {
  const res = await fetch(`${config.postgrestUrl}/${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(10_000), // не зависати, якщо PostgREST недоступний
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PostgREST ${res.status} on /${path}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function load() {
  const [districts, cities, objects] = await Promise.all([
    pg("districts?select=id,slug,name,name_en,region_id"),
    pg("cities?select=id,slug,name,name_en,district_id,settlement_type"),
    pg(`tourism_objects?select=${OBJ_COLS}&published=eq.true`),
  ]);

  const districtById = new Map(districts.map((d) => [d.id, d]));
  const cityById = new Map(cities.map((c) => [c.id, c]));

  const tourismTypes = new Set();
  const items = objects.map((o) => {
    const district = districtById.get(o.district_id) || null;
    const city = o.city_id ? cityById.get(o.city_id) || null : null;
    const tt = Array.isArray(o.tourism_types) ? o.tourism_types : [];
    tt.forEach((t) => t && tourismTypes.add(t));
    return {
      id: o.id,
      slug: o.slug,
      type: o.type, // attraction | event | restaurant | hotel
      name: o.name,
      nameEn: o.name_en || null,
      districtSlug: district?.slug || null,
      districtName: district?.name || null,
      citySlug: city?.slug || null,
      cityName: city?.name || null,
      tourismTypes: tt,
      subtitle: o.subtitle || o.subtitle_en || "",
      description: o.description || o.description_en || "",
      address: o.address || o.address_en || null,
      phone: o.phone || null,
      website: o.website || null,
      hasImage: Boolean(o.image_url),
      hasCoords: o.latitude != null && o.longitude != null,
      eventDates: o.event_dates || null,
      hours: o.hours || null,
    };
  });

  return {
    districts: districts.map((d) => ({ slug: d.slug, name: d.name })),
    cities: cities.map((c) => ({ slug: c.slug, name: c.name, districtId: c.district_id })),
    tourismTypes: [...tourismTypes].sort(),
    items,
  };
}

export async function getCatalog() {
  const fresh = cache.data && Date.now() - cache.at < config.catalogTtlMs;
  if (fresh) return cache.data;
  if (inflight) return inflight;
  inflight = load()
    .then((data) => {
      cache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  // Якщо є застарілий кеш, а мережа падає — краще віддати старе, ніж помилку.
  try {
    return await inflight;
  } catch (err) {
    if (cache.data) return cache.data;
    throw err;
  }
}

const norm = (s) => (s || "").toString().toLowerCase().trim();

// Компактний пошук об'єктів для інструмента моделі.
export async function searchObjects({
  query = "",
  type = "",
  tourismType = "",
  districtSlug = "",
  citySlug = "",
  limit = 8,
} = {}) {
  const cat = await getCatalog();
  const q = norm(query);
  const words = q.split(/\s+/).filter(Boolean);

  let results = cat.items.filter((it) => {
    if (type && it.type !== type) return false;
    if (districtSlug && it.districtSlug !== districtSlug) return false;
    if (citySlug && it.citySlug !== citySlug) return false;
    if (tourismType) {
      const tt = it.tourismTypes.map(norm);
      if (!tt.some((t) => t.includes(norm(tourismType)))) return false;
    }
    if (words.length) {
      const hay = norm(
        `${it.name} ${it.nameEn || ""} ${it.subtitle} ${it.description} ${it.tourismTypes.join(" ")} ${it.districtName || ""} ${it.cityName || ""}`,
      );
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });

  // Легке ранжування: коли є пошук — об'єкти з фото/координатами вище.
  results = results
    .slice()
    .sort((a, b) => Number(b.hasImage) - Number(a.hasImage) || Number(b.hasCoords) - Number(a.hasCoords));

  const capped = results.slice(0, Math.max(1, Math.min(20, Number(limit) || 8)));

  return {
    total: results.length,
    returned: capped.length,
    items: capped.map((it) => ({
      slug: it.slug,
      type: it.type,
      name: it.name,
      district: it.districtName,
      city: it.cityName,
      tourismTypes: it.tourismTypes,
      short: (it.subtitle || it.description || "").toString().slice(0, 160),
      address: it.address,
      phone: it.phone,
      hasCoords: it.hasCoords,
    })),
  };
}
