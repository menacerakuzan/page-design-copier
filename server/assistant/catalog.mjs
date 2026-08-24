// Каталог даних для асистента: тягне ієрархію з PostgREST (ті самі таблиці, що й
// loadHierarchySnapshot у фронтенді), кешує в памʼяті з TTL і дає компактний
// пошук об'єктів. Модель отримує лише РЕАЛЬНІ об'єкти звідси (за slug) — тож не
// може вигадати телефон/адресу/сторінку.

import { config } from "./config.mjs";

const OBJ_COLS =
  "id,slug,name,name_en,type,published,district_id,city_id,subtitle,subtitle_en,description,description_en,detailed_info,detailed_info_en,tourism_types,address,address_en,phone,website,image_url,latitude,longitude,event_dates,hours,amenities";

// Тексти в БД — HTML з редактора; для пошуку та відповіді моделі потрібен
// чистий текст (теги лише з'їдали ліміт сніпета і шуміли в пошуку).
const stripHtml = (s) =>
  (s || "")
    .toString()
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

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
      description: stripHtml(o.description || o.description_en),
      detailedInfo: stripHtml(o.detailed_info || o.detailed_info_en),
      address: o.address || o.address_en || null,
      phone: o.phone || null,
      website: o.website || null,
      hasImage: Boolean(o.image_url),
      hasCoords: o.latitude != null && o.longitude != null,
      eventDates: o.event_dates || null,
      hours: o.hours || null,
      amenities: o.amenities || null,
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

// Модель НЕ бачить реальних slug'ів районів/міст (вони латиницею, напр.
// "berezivskyy-rayon") — вона передає українську назву як є ("березівський",
// "болградський район", інколи у відмінюваній формі "березівському"). Точне
// порівняння зі slug мовчки повертало 0 об'єктів завжди, коли модель не вгадає
// slug буквально. Тому: точний slug — ОК, а якщо ні, порівнюємо нечітко з
// україномовною назвою (обидва боки, + перші 6 символів "кореня" слова —
// стабільна частина при відмінюванні: "березівськ|ому" vs "березівськ|ий").
const stem = (s) => norm(s).replace(/['’ʼ-]/g, "").replace(/\s*район\s*$/, "").trim();
const matchesPlace = (input, name) => {
  if (!input) return true;
  const a = stem(input);
  const b = stem(name);
  if (!a || !b) return false;
  return b.includes(a) || a.includes(b) || (a.length >= 4 && a.slice(0, 6) === b.slice(0, 6));
};

// ── Морфологічно-стійке порівняння слів ─────────────────────────────────────
// Люди питають у відмінках («аккерманської фортеці», «в музеї Філатова»), а
// буквальний includes() це не ловить («фортеці» ⊄ «фортеця») — і пошук мовчки
// повертав 0. Порівнюємо "корені": обрізаємо закінчення (останні ~3 символи,
// але лишаємо мінімум 4) з ОБОХ боків — «фортец|і» ≈ «фортец|я»,
// «аккерманськ|ої» ≈ «аккерманськ|а».
const tokenize = (s) =>
  norm(s)
    .replace(/['’ʼ`]/g, "")
    .split(/[^a-zа-яіїєґ0-9]+/i)
    .filter(Boolean);

const wordStem = (w) => (w.length <= 4 ? w : w.slice(0, Math.max(4, w.length - 3)));

const wordMatchesTokens = (queryWord, hayTokens) => {
  if (queryWord.length <= 3) return hayTokens.some((t) => t === queryWord);
  const qs = wordStem(queryWord);
  return hayTokens.some((t) => t.startsWith(qs) || queryWord.startsWith(wordStem(t)));
};

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

  // Query — жорсткий фільтр ЛИШЕ коли це єдиний спосіб звузити вибірку. Якщо
  // вже є districtSlug/citySlug, район/місто й так достатньо звужують — а
  // query часто містить тематичне слово ("кухня", "цікаві місця"), якого
  // буквально немає в терсовому описі об'єкта (напр. "Файний мед" — просто
  // "Виробництво"). Тоді query стає лише РАНЖУВАННЯМ (підняти релевантніше
  // вище), а не відсіканням. Реальний баг: "кухня" + districtSlug → 0
  // результатів, хоча в районі є 2 гастрономічні об'єкти без слова "кухня" в тексті.
  const hasLocationFilter = Boolean(districtSlug || citySlug);

  const baseFilter = (it) => {
    if (type && it.type !== type) return false;
    if (districtSlug && it.districtSlug !== districtSlug && !matchesPlace(districtSlug, it.districtName)) return false;
    if (citySlug && it.citySlug !== citySlug && !matchesPlace(citySlug, it.cityName)) return false;
    if (tourismType) {
      const tt = it.tourismTypes.map(norm);
      if (!tt.some((t) => t.includes(norm(tourismType)))) return false;
    }
    return true;
  };

  let results = cat.items.filter((it) => {
    if (!baseFilter(it)) return false;
    if (words.length && !hasLocationFilter) {
      const hayTokens = tokenize(
        `${it.name} ${it.nameEn || ""} ${it.subtitle} ${it.description} ${it.detailedInfo} ${it.tourismTypes.join(" ")} ${it.districtName || ""} ${it.cityName || ""}`,
      );
      if (!words.some((w) => wordMatchesTokens(w, hayTokens))) return false;
    }
    return true;
  });

  // Легке ранжування: якщо query не використали як жорсткий фільтр (бо вже є
  // districtSlug/citySlug) — піднімаємо збіги нагору замість повного ігнору,
  // далі фото/координати. Збіг у НАЗВІ важить більше, ніж у тексті опису.
  const nameMatchScore = (it) => {
    if (!words.length) return 0;
    const nameTokens = tokenize(`${it.name} ${it.nameEn || ""}`);
    const bodyTokens = tokenize(`${it.subtitle} ${it.description} ${it.tourismTypes.join(" ")}`);
    const inName = words.filter((w) => wordMatchesTokens(w, nameTokens)).length;
    const inBody = words.filter((w) => wordMatchesTokens(w, bodyTokens)).length;
    return inName * 10 + inBody;
  };
  results = results
    .slice()
    .sort((a, b) =>
      nameMatchScore(b) - nameMatchScore(a) ||
      Number(b.hasImage) - Number(a.hasImage) ||
      Number(b.hasCoords) - Number(a.hasCoords),
    );

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
      short: (it.subtitle || it.description || "").toString().slice(0, 180),
      address: it.address,
      phone: it.phone,
      hasCoords: it.hasCoords,
      // Прапорець для моделі: у цього об'єкта є розгорнутий текст — по деталі
      // варто сходити в get_object_details, а не казати "інформації немає".
      hasDetails: Boolean(it.detailedInfo || it.description.length > 180),
    })),
  };
}

/**
 * Повна інформація про один об'єкт — для запитань "вглиб" ("розкажи більше",
 * "яка історія", "що там можна побачити"). Пошук лише за короткими сніпетами
 * из searchObjects змушував модель відповідати "в базі немає інформації",
 * хоча detailed_info в БД є — просто його ніколи не показували моделі.
 * Шукає за точним slug, а якщо не знайшло — нечітко за назвою (та сама
 * морфологічно-стійка логіка, що і в пошуку).
 */
export async function getObjectDetails(slugOrName = "") {
  const cat = await getCatalog();
  const q = norm(slugOrName);
  if (!q) return { error: "Порожній запит — передай slug або назву об'єкта." };

  let found = cat.items.find((it) => norm(it.slug) === q);
  if (!found) {
    const words = tokenize(q);
    let best = null;
    let bestScore = 0;
    for (const it of cat.items) {
      const nameTokens = tokenize(`${it.name} ${it.nameEn || ""}`);
      const score = words.filter((w) => wordMatchesTokens(w, nameTokens)).length;
      if (score > bestScore) {
        bestScore = score;
        best = it;
      }
    }
    // Вимагаємо збігу більшості слів назви, щоб не віддати випадковий об'єкт.
    if (best && bestScore >= Math.max(1, Math.ceil(words.length / 2))) found = best;
  }

  if (!found) return { error: `Об'єкт "${slugOrName}" не знайдено. Спробуй search_objects.` };

  return {
    slug: found.slug,
    type: found.type,
    name: found.name,
    nameEn: found.nameEn,
    district: found.districtName,
    city: found.cityName,
    tourismTypes: found.tourismTypes,
    subtitle: found.subtitle || null,
    description: found.description || null,
    detailedInfo: found.detailedInfo || null,
    address: found.address,
    phone: found.phone,
    website: found.website,
    hours: found.hours,
    eventDates: found.eventDates,
    amenities: found.amenities,
  };
}
