#!/usr/bin/env node
/**
 * Одноразовий імпорт реєстру гідів із WordPress-сайту guides.odesatourism.site
 * (в адмінці WP немає експорту, а сторінки зібрані Gutenberg-блоками).
 *
 * Парсить картки з двох сторінок:
 *   - головна (/)              → повний реєстр АГО
 *   - /reestr-15565-2016/      → гіди, сертифіковані за ДСТУ 15565:2016
 * і збирає: прізвище, ім'я, номер у реєстрі, мови, персональну сторінку, фото.
 *
 * Фото дзеркалиться на наш storage-server (щоб сторінка не залежала від WP),
 * результат пишеться у src/data/guides.json.
 *
 * Використання:
 *   node scripts/scrape-guides.mjs            # DRY-RUN: парсинг + звіт, без запису
 *   node scripts/scrape-guides.mjs --apply    # завантажити фото + записати JSON
 */

import "../server/assistant/loadEnv.mjs";
import fs from "node:fs";

const APPLY = process.argv.includes("--apply");
const WP_BASE = "https://guides.odesatourism.site";
const STORAGE_URL = process.env.STORAGE_URL || "http://127.0.0.1:5100/storage/v1";
const STORAGE_ANON_KEY = process.env.POSTGREST_ANON_KEY || process.env.VITE_API_ANON_KEY;
const PUBLIC_BASE = "https://tourism.od.gov.ua/storage/v1/object/public/media";
const OUT_PATH = "src/data/guides.json";

const decode = (s) =>
  s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function fetchHtml(url) {
  const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${res.status} on ${url}`);
  return res.text();
}

/** Кожна картка гіда — колонка з фоном #7ca2f233: фото + h4 (ім'я) + абзаци. */
function parseCards(html) {
  const guides = [];
  const blocks = html.split('style="background-color:#7ca2f233"').slice(1);
  for (const block of blocks) {
    const imgMatch = block.match(/<img[^>]+src="([^"]+)"/);
    const nameMatch = block.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
    if (!nameMatch) continue;

    const nameParts = nameMatch[1].split(/<br\s*\/?>/i).map(decode).filter(Boolean);
    const surname = nameParts[0] ?? "";
    const firstName = nameParts.slice(1).join(" ");

    const certMatch = block.match(/<p[^>]*>\s*(\d{6}-\d{3})\s*<\/p>/);
    const langMatch = block.match(/мови:([\s\S]*?)<\/p>/);
    const pageMatch = block.match(/href="(https:\/\/guides\.odesatourism\.site\/reestr\/([^/"]+)\/?)"/);

    guides.push({
      slug: pageMatch?.[2] ?? `${surname}-${firstName}`.toLowerCase(),
      surname,
      firstName,
      cert: certMatch?.[1] ?? null,
      languages: langMatch ? decode(langMatch[1]).split(",").map((l) => l.trim()).filter(Boolean) : [],
      personalUrl: pageMatch?.[1] ?? null,
      photoUrl: imgMatch?.[1] ?? null,
      dstu: false,
    });
  }
  return guides;
}

async function mirrorPhoto(photoUrl, slug) {
  const res = await fetch(photoUrl, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`photo ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = (photoUrl.split(".").pop() || "png").toLowerCase().replace(/[^a-z]/g, "") || "png";
  const path = `guides/${slug}.${ext}`;
  const up = await fetch(`${STORAGE_URL}/object/media/${path}`, {
    method: "POST",
    headers: {
      apikey: STORAGE_ANON_KEY,
      Authorization: `Bearer ${STORAGE_ANON_KEY}`,
      "Content-Type": ext === "png" ? "image/png" : "image/jpeg",
      "x-upsert": "true",
    },
    body: buf,
  });
  if (!up.ok) throw new Error(`storage upload ${up.status}: ${(await up.text()).slice(0, 200)}`);
  return `${PUBLIC_BASE}/${path}`;
}

async function main() {
  console.log(`Тягну реєстр АГО з ${WP_BASE}/ ...`);
  const mainHtml = await fetchHtml(`${WP_BASE}/`);
  const guides = parseCards(mainHtml);

  console.log(`Тягну реєстр ДСТУ з ${WP_BASE}/reestr-15565-2016/ ...`);
  const dstuHtml = await fetchHtml(`${WP_BASE}/reestr-15565-2016/`);
  const dstuSlugs = new Set(parseCards(dstuHtml).map((g) => g.slug));
  for (const g of guides) g.dstu = dstuSlugs.has(g.slug);

  console.log(`\nЗнайдено гідів: ${guides.length} (ДСТУ: ${guides.filter((g) => g.dstu).length})`);
  for (const g of guides) {
    console.log(`  ${g.dstu ? "★" : " "} ${g.surname} ${g.firstName}  ${g.cert ?? "—"}  [${g.languages.join(", ")}] ${g.photoUrl ? "📷" : "без фото"}`);
  }

  if (!APPLY) {
    console.log("\nЦе був DRY-RUN. Для дзеркалення фото і запису JSON: node scripts/scrape-guides.mjs --apply");
    return;
  }

  console.log("\nДзеркалю фото на storage-server ...");
  for (const g of guides) {
    if (!g.photoUrl) continue;
    try {
      g.photoUrl = await mirrorPhoto(g.photoUrl, g.slug);
      console.log(`  ✓ ${g.slug}`);
    } catch (e) {
      console.log(`  ✗ ${g.slug}: ${e.message} (лишаю оригінальний URL)`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(guides, null, 2) + "\n");
  console.log(`\nЗаписано ${guides.length} гідів у ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
