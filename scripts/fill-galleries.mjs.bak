#!/usr/bin/env node
/**
 * Авто-наповнення галерей об'єктів фото з Wikimedia Commons / Wikipedia.
 *
 * Двофазний, безпечний для держсайту процес:
 *   1) DRY-RUN (за замовчуванням): нічого не змінює. Пише manifest.json + preview.html
 *      зі знайденими фото, оцінкою впевненості, ліцензією/автором, відстанню.
 *   2) --apply: завантажує відібрані фото → вантажить у storage → генерує apply.sql
 *      (page_configs upsert + content_cards INSERT з published=false = ЧЕРНЕТКА).
 *      SQL НЕ виконується автоматично — його запускають окремо через psql після огляду.
 *
 * Картки створюються published=false → на сайті не видно, в адмінці видно для підтвердження.
 *
 * Використання:
 *   node scripts/fill-galleries.mjs <objects.json> [--apply] [--out=DIR]
 *        [--radius=300] [--min-width=1200] [--limit=6] [--min-photos=2]
 *
 * objects.json — масив { id, type, name, slug, map_url, page_config, existing_gallery }.
 * STORAGE_BASE (env) — база storage для аплоаду (default https://tourism.od.gov.ua).
 */

import fs from "node:fs";
import path from "node:path";

// ── DEFAULT_SECTIONS (копія з src/types/pages.ts) — для створення page_config ──
const DEFAULT_SECTIONS = {
  attraction: [
    { kind: "description", title: "Про об'єкт", visible: true, sortOrder: 1 },
    { kind: "contact_info", title: "Контакти", visible: true, sortOrder: 2 },
    { kind: "map", title: "Карта", visible: true, sortOrder: 3 },
    { kind: "gallery", title: "Галерея", visible: true, sortOrder: 4 },
    { kind: "related_events", title: "Пов'язані події", visible: true, sortOrder: 5, bgColor: "#3d0820" },
    { kind: "related_restaurants", title: "Ресторани поруч", visible: true, sortOrder: 6, bgColor: "#2a1200" },
    { kind: "related_hotels", title: "Готелі поруч", visible: true, sortOrder: 7, bgColor: "#062820" },
  ],
  event: [
    { kind: "description", title: "Про подію", visible: true, sortOrder: 1 },
    { kind: "event_dates", title: "Дати та деталі", visible: true, sortOrder: 2 },
    { kind: "contact_info", title: "Контакти", visible: true, sortOrder: 3 },
    { kind: "map", title: "Місце проведення", visible: true, sortOrder: 4 },
    { kind: "ticket_info", title: "Квитки", visible: true, sortOrder: 5 },
    { kind: "gallery", title: "Галерея", visible: true, sortOrder: 6 },
    { kind: "related_attractions", title: "Пам'ятки поруч", visible: true, sortOrder: 7, bgColor: "#001a3d" },
  ],
  restaurant: [
    { kind: "description", title: "Про заклад", visible: true, sortOrder: 1 },
    { kind: "contact_info", title: "Контакти", visible: true, sortOrder: 2 },
    { kind: "hours", title: "Години роботи", visible: true, sortOrder: 3 },
    { kind: "amenities", title: "Зручності", visible: true, sortOrder: 4 },
    { kind: "menu_link", title: "Меню", visible: true, sortOrder: 5 },
    { kind: "map", title: "Карта", visible: true, sortOrder: 6 },
    { kind: "gallery", title: "Галерея", visible: true, sortOrder: 7 },
    { kind: "related_hotels", title: "Готелі поруч", visible: false, sortOrder: 8, bgColor: "#062820" },
  ],
  hotel: [
    { kind: "description", title: "Про готель", visible: true, sortOrder: 1 },
    { kind: "contact_info", title: "Контакти", visible: true, sortOrder: 2 },
    { kind: "amenities", title: "Зручності та послуги", visible: true, sortOrder: 3 },
    { kind: "map", title: "Карта", visible: true, sortOrder: 4 },
    { kind: "gallery", title: "Галерея", visible: true, sortOrder: 5 },
    { kind: "related_attractions", title: "Пам'ятки поруч", visible: true, sortOrder: 6, bgColor: "#001a3d" },
    { kind: "related_restaurants", title: "Ресторани поруч", visible: true, sortOrder: 7, bgColor: "#2a1200" },
    { kind: "related_events", title: "Найближчі події", visible: false, sortOrder: 8, bgColor: "#3d0820" },
  ],
};

// ── args ──
const args = process.argv.slice(2);
const objectsPath = args.find((a) => !a.startsWith("--"));
const flag = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.split("=")[1] : d; };
const APPLY = args.includes("--apply");
const OUT = flag("out", path.resolve("gallery-fill-out"));
const RADIUS = +flag("radius", 300);
const MIN_W = +flag("min-width", 1200);
const LIMIT = +flag("limit", 6);
const MIN_PHOTOS = +flag("min-photos", 2);
const STORAGE_BASE = process.env.STORAGE_BASE || "https://tourism.od.gov.ua";
const UPLOAD_BASE = process.env.UPLOAD_BASE || STORAGE_BASE;        // куди робити HTTP PUT (якщо не LOCAL_DIR)
const PUBLIC_BASE = process.env.PUBLIC_BASE || STORAGE_BASE;        // базовий URL, що пишемо в БД
const LOCAL_DIR = process.env.LOCAL_DIR || "";                      // якщо задано — пишемо файли прямо в цю теку
const UA = "OdeshchynaTourismBot/1.0 (https://tourism.od.gov.ua; tourism@od.gov.ua)";

if (!objectsPath) { console.error("Вкажи objects.json"); process.exit(1); }
const objects = JSON.parse(fs.readFileSync(objectsPath, "utf8"));
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);

// ── coords ──
function extractCoords(url) {
  if (!url) return null;
  let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/); if (m) return { lat: +m[1], lng: +m[2] };
  m = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/); if (m) return { lat: +m[1], lng: +m[2] };
  m = url.match(/[?&](?:q|ll|center|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/); if (m) return { lat: +m[1], lng: +m[2] };
  return null;
}
async function resolveCoords(url) {
  if (!url) return null;
  const direct = extractCoords(url); if (direct) return direct;
  if (/goo\.gl/.test(url)) {
    try { const r = await fetch(url, { redirect: "follow", headers: { "User-Agent": UA } }); return extractCoords(r.url); }
    catch { return null; }
  }
  return null;
}

// ── name scoring (з транслітерацією uk→lat + stem-prefix) ──
const STOP = new Set(["музей","церква","храм","собор","парк","санаторій","центр","національний","природний",
  "історико","краєзнавчий","народний","народознавчий","етнографічний","сільський","міський","комплекс",
  "the","of","and","культури"]);
const TR = { а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ie",ж:"zh",з:"z",и:"y",і:"i",ї:"i",й:"i",к:"k",л:"l",
  м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"iu",я:"ia",ё:"e",ъ:"" };
function translit(s) { return s.split("").map((c) => TR[c] ?? c).join(""); }
function norm(s) { return (s || "").toLowerCase().replace(/ё/g, "е").replace(/['’"`.,()«»–—_\-]/g, " ").replace(/\s+/g, " ").trim(); }
// для кожного значущого слова повертаємо набір "needle"-основ (кир. + лат.), 6 символів
function specificStems(name) {
  const toks = norm(name).split(" ").filter((t) => t.length >= 4 && !STOP.has(t));
  return toks.map((t) => {
    const cyr = t.slice(0, 6);
    const lat = translit(t).slice(0, 6);
    return [...new Set([cyr, lat].filter((x) => x.length >= 4))];
  });
}
function titleScore(fileTitle, stems) {
  const t = norm(fileTitle);
  let s = 0;
  for (const variants of stems) if (variants.some((v) => t.includes(v))) s++;
  return s;
}

async function api(host, params) {
  const u = `https://${host}/w/api.php?${new URLSearchParams({ format: "json", ...params })}`;
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${host} ${r.status}`);
  return r.json();
}

async function imageInfo(host, titles) {
  if (!titles.length) return {};
  const out = {};
  for (let i = 0; i < titles.length; i += 25) {
    const j = await api(host, { action: "query", prop: "imageinfo",
      iiprop: "url|size|mime|extmetadata", iiurlwidth: "360", titles: titles.slice(i, i + 25).join("|") });
    for (const p of Object.values(j?.query?.pages ?? {})) {
      const ii = p.imageinfo?.[0]; if (ii) out[p.title] = ii;
    }
  }
  return out;
}

function meta(ii, key) { return ii?.extmetadata?.[key]?.value?.replace(/<[^>]+>/g, "").trim() || ""; }

async function commonsNear(lat, lng) {
  const j = await api("commons.wikimedia.org", { action: "query", list: "geosearch",
    gscoord: `${lat}|${lng}`, gsradius: String(RADIUS), gsnamespace: "6", gslimit: "40" });
  return j?.query?.geosearch ?? [];
}

// Wikipedia (uk) article at coords whose title matches the object → curated images
async function wikipediaImages(lat, lng, tokens) {
  const geo = await api("uk.wikipedia.org", { action: "query", list: "geosearch",
    gscoord: `${lat}|${lng}`, gsradius: "500", gslimit: "10" });
  const arts = geo?.query?.geosearch ?? [];
  let best = null, bestScore = 0;
  for (const a of arts) { const s = titleScore(a.title, tokens); if (s > bestScore) { bestScore = s; best = a; } }
  if (!best || bestScore < 1) return { article: null, files: [] };
  const j = await api("uk.wikipedia.org", { action: "query", prop: "images", titles: best.title, imlimit: "60" });
  const page = Object.values(j?.query?.pages ?? {})[0];
  const files = (page?.images ?? []).map((i) => i.title)
    .filter((t) => /\.(jpe?g|png|webp)$/i.test(t) && !/\b(icon|logo|flag|coat|map|locator|commons-logo|wiki)/i.test(t));
  return { article: best.title, files };
}

async function processObject(o) {
  const coords = await resolveCoords(o.map_url);
  const stems = specificStems(o.name);
  if (!coords) return { ...o, coords: null, status: "NO_COORDS", photos: [], suggestions: [] };

  const photoMap = new Map(); // title -> {title,url,thumb,width,height,dist,score,conf,license,author}

  // 1) Wikipedia article images (HIGH confidence)
  try {
    const { article, files } = await wikipediaImages(coords.lat, coords.lng, stems);
    if (files.length) {
      const info = await imageInfo("commons.wikimedia.org", files);
      for (const title of files) {
        const ii = info[title]; if (!ii || !/image\//.test(ii.mime || "")) continue;
        photoMap.set(title, { title, url: ii.url, thumb: ii.thumburl, width: ii.width, height: ii.height,
          dist: null, score: 99, conf: "HIGH", source: `wiki:${article}`,
          license: meta(ii, "LicenseShortName"), author: meta(ii, "Artist") });
      }
    }
  } catch {}

  // 2) Commons geosearch + name scoring
  try {
    const geo = await commonsNear(coords.lat, coords.lng);
    const titles = geo.map((g) => g.title);
    const info = await imageInfo("commons.wikimedia.org", titles);
    for (const g of geo) {
      const ii = info[g.title]; if (!ii || !/image\//.test(ii.mime || "")) continue;
      if ((ii.width || 0) < MIN_W) continue;
      const score = titleScore(g.title, stems);
      const conf = score >= 2 ? "HIGH" : score === 1 ? "MED" : "LOW";
      const prev = photoMap.get(g.title);
      if (!prev || prev.conf === "LOW") {
        photoMap.set(g.title, { title: g.title, url: ii.url, thumb: ii.thumburl, width: ii.width, height: ii.height,
          dist: g.dist, score, conf, source: "commons-geo",
          license: meta(ii, "LicenseShortName"), author: meta(ii, "Artist") });
      }
    }
  } catch {}

  const rank = { HIGH: 3, MED: 2, LOW: 1 };
  const all = [...photoMap.values()].sort((a, b) =>
    rank[b.conf] - rank[a.conf] || b.score - a.score || (b.width * b.height) - (a.width * a.height));

  const confident = all.filter((p) => p.conf === "HIGH" || p.conf === "MED").slice(0, LIMIT);
  const suggestions = all.filter((p) => p.conf === "LOW").slice(0, 6);
  const status = confident.length >= MIN_PHOTOS ? "AUTO" : confident.length > 0 ? "WEAK" : "MANUAL";
  return { ...o, coords, status, photos: confident, suggestions };
}

// ── storage upload (apply) ──
// Завантаження з Wikimedia з ретраями та беком (429/мережеві збої).
async function downloadWithRetry(srcUrl, tries = 5) {
  let wait = 1500;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(srcUrl, { headers: { "User-Agent": UA, "Referer": "https://commons.wikimedia.org/" } });
      if (res.status === 429 || res.status >= 500) { await sleep(wait); wait *= 2; continue; }
      if (!res.ok) throw new Error(`download ${res.status}`);
      const ct = res.headers.get("content-type") || "image/jpeg";
      return { buf: Buffer.from(await res.arrayBuffer()), ct };
    } catch (e) {
      if (i === tries - 1) throw e;
      await sleep(wait); wait *= 2;
    }
  }
  throw new Error("download retries exhausted");
}

async function storePhoto(srcUrl, ext) {
  const { buf, ct } = await downloadWithRetry(srcUrl);
  const name = `${Date.now()}-${uid()}.${ext}`;
  if (LOCAL_DIR) {
    // Пишемо файл прямо в теку storage (надійно, без мережевого аплоаду).
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DIR, name), buf);
  } else {
    const up = await fetch(`${UPLOAD_BASE}/storage/v1/object/media/${name}`, {
      method: "PUT", headers: { "Content-Type": ct }, body: buf });
    if (!up.ok) throw new Error(`upload ${up.status} ${await up.text().catch(() => "")}`);
  }
  return `${PUBLIC_BASE}/storage/v1/object/public/media/${name}`;
}

// ── SQL helpers ──
const q = (v) => v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`;
function gallerySectionId(o) {
  if (o.page_config) {
    const secs = typeof o.page_config === "string" ? JSON.parse(o.page_config) : o.page_config;
    const g = (secs || []).find((s) => s.kind === "gallery");
    if (g) return { id: g.id, configRow: null }; // config already exists
  }
  // build a fresh default config with a stable gallery id
  const sections = (DEFAULT_SECTIONS[o.type] || DEFAULT_SECTIONS.attraction).map((s) => ({ ...s, id: uid() }));
  const g = sections.find((s) => s.kind === "gallery");
  const config = { id: `${o.type}-${o.id}-${uid()}`, entityType: o.type, entityId: o.id, sections, updatedAt: new Date().toISOString() };
  return { id: g.id, configRow: config };
}

// ── run ──
const results = [];
for (const o of objects) {
  if (o.existing_gallery > 0) { results.push({ ...o, status: "SKIP_EXISTING", photos: [], suggestions: [] }); continue; }
  process.stderr.write(`· ${o.name} … `);
  const r = await processObject(o);
  process.stderr.write(`${r.status} (${r.photos.length})\n`);
  results.push(r);
  await sleep(300);
}

// manifest
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(results, null, 2));

// preview.html
const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const badge = (st) => ({ AUTO: "#2f9f5f", WEAK: "#df9b3b", MANUAL: "#9f1f47", NO_COORDS: "#9f1f47", SKIP_EXISTING: "#888" }[st] || "#888");
let html = `<!doctype html><meta charset=utf8><title>Gallery fill preview</title>
<style>body{font:14px/1.4 system-ui;background:#fff2e8;color:#002f5e;margin:0;padding:24px}
h2{margin:30px 0 6px}.b{display:inline-block;color:#fff;border-radius:8px;padding:2px 8px;font-size:12px}
.row{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0 4px}.c{width:180px}.c img{width:180px;height:130px;object-fit:cover;border-radius:10px}
.m{font-size:11px;color:#002f5e99}.s{opacity:.55}small{color:#002f5e88}</style>
<h1>Авто-галереї — попередній перегляд</h1>`;
for (const r of results) {
  html += `<h2>${esc(r.name)} <span class=b style=background:${badge(r.status)}>${r.status}</span> <small>${esc(r.type)}${r.coords ? ` · ${r.coords.lat.toFixed(4)},${r.coords.lng.toFixed(4)}` : ""}</small></h2>`;
  const draw = (arr, cls) => { if (!arr.length) return ""; let h = `<div class="row ${cls}">`;
    for (const p of arr) h += `<div class=c><img src="${esc(p.thumb || p.url)}"><div class=m>${p.width}×${p.height} · ${p.conf}${p.dist != null ? ` · ${p.dist.toFixed(0)}m` : ""}<br>${esc((p.license || "?"))} · ${esc((p.author || "").slice(0, 40))}</div></div>`;
    return h + `</div>`; };
  html += draw(r.photos, "");
  if (r.suggestions?.length) html += `<small>низька впевненість (не вставляється):</small>` + draw(r.suggestions, "s");
}
fs.writeFileSync(path.join(OUT, "preview.html"), html);

// summary
const by = (s) => results.filter((r) => r.status === s).length;
const totalPhotos = results.reduce((n, r) => n + r.photos.length, 0);
console.error(`\n──────── ПІДСУМОК ────────`);
console.error(`Об'єктів:        ${results.length}`);
console.error(`AUTO (≥${MIN_PHOTOS} фото):  ${by("AUTO")}`);
console.error(`WEAK (1 фото):   ${by("WEAK")}`);
console.error(`MANUAL:          ${by("MANUAL")}`);
console.error(`Без координат:    ${by("NO_COORDS")}`);
console.error(`Вже є галерея:    ${by("SKIP_EXISTING")}`);
console.error(`Фото до вставки: ${totalPhotos}`);
console.error(`\nПерегляд: ${path.join(OUT, "preview.html")}`);
console.error(`Маніфест: ${path.join(OUT, "manifest.json")}`);

// ── apply ──
if (APPLY) {
  console.error(`\n── APPLY: завантаження + збереження + генерація SQL`);
  console.error(`   ${LOCAL_DIR ? `LOCAL_DIR=${LOCAL_DIR}` : `UPLOAD_BASE=${UPLOAD_BASE}`} · PUBLIC_BASE=${PUBLIC_BASE} ──`);
  const lines = ["-- АВТО-ГАЛЕРЕЇ (чернетки, published=false). Перегляньте перед запуском.", "begin;"];
  for (const r of results) {
    if (r.status !== "AUTO" && r.status !== "WEAK") continue;
    const pageKey = `${r.type}-${r.id}`;
    // спершу зберігаємо фото; page_config/cards додаємо лише якщо хоч одне збереглось
    const stored = [];
    for (const p of r.photos) {
      const ext = (p.url.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      try { const url = await storePhoto(p.url, ext); stored.push({ ...p, publicUrl: url }); process.stderr.write("."); }
      catch (e) { process.stderr.write(`x(${e.message})`); }
      await sleep(900); // throttle до Wikimedia
    }
    if (!stored.length) { process.stderr.write(`\n  – ${r.name}: 0 фото (пропуск)\n`); continue; }
    const { id: secId, configRow } = gallerySectionId(r);
    if (configRow) {
      // sections_json зберігаємо як jsonb-STRING (double-encoded) — так само, як це
      // робить застосунок (rowToConfig робить JSON.parse), інакше конфіг не прочитається.
      lines.push(`insert into page_configs(id,entity_type,entity_id,sections_json,updated_at) values(${q(configRow.id)},${q(r.type)},${q(r.id)},to_jsonb(${q(JSON.stringify(configRow.sections))}::text),now()) on conflict (entity_type,entity_id) do nothing;`);
    }
    const sectionKey = `gallery-${secId}`;
    let order = 0;
    for (const p of stored) {
      order++;
      const payload = JSON.stringify({ colSpan: 1, textSize: "md", credit: `${p.author || ""} / ${p.license || ""} / Wikimedia Commons`.trim() });
      lines.push(`insert into content_cards(id,page_key,section_key,card_type,title,image_url,sort_order,published,payload,created_at) values(${q(uid())},${q(pageKey)},${q(sectionKey)},'destination','',${q(p.publicUrl)},${order},false,${q(payload)}::jsonb,now());`);
    }
    process.stderr.write(`\n  ✓ ${r.name}: ${order} фото\n`);
  }
  lines.push("commit;");
  fs.writeFileSync(path.join(OUT, "apply.sql"), lines.join("\n"));
  console.error(`\nSQL готовий: ${path.join(OUT, "apply.sql")}`);
  console.error(`Запустити:  PGPASSWORD=… psql -h localhost -U authenticator -d tourism -f ${path.join(OUT, "apply.sql")}`);
}
