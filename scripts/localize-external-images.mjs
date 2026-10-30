/**
 * Переносить зовнішні («хотлінкнуті») фото в наше сховище.
 *
 * Чому: частина обкладинок об'єктів посилалась напряму на чужі сайти
 * (travels.in.ua, ukrainaincognita.com, fbcdn, …). Такі фото зникають без
 * нашої участі: сайт падає (Cloudflare 526), вмикає захист від хотлінку (403),
 * видаляє файл (404), а посилання Facebook CDN просто протухають. Локальні
 * файли в storage-server з цим не стикаються.
 *
 * Що робить:
 *   1. Збирає image_url з tourism_objects, cities, districts, content_cards,
 *      що вказують не на наше сховище.
 *   2. Робочі — завантажує в storage-server/uploads/media і переписує URL у БД.
 *   3. Биті, але з власною галереєю — ставить обкладинкою перше фото галереї.
 *   4. Решту битих лишає і друкує список — їм треба підібрати нове фото.
 *
 * Використання:
 *   node scripts/localize-external-images.mjs                            # лише звіт, нічого не змінює
 *   DB_ROLE=authenticated node scripts/localize-external-images.mjs --apply
 *     # завантажити й переписати; authenticator перемикається в роль адмінки
 *     # (authenticated), яка має право UPDATE — так само пише й сама адмінка
 *
 * Env:
 *   DATABASE_URL  (default postgresql://authenticator:changeme123@localhost:5432/tourism)
 *   UPLOAD_DIR    (default /opt/tourism/storage-server/uploads/media)
 *   PUBLIC_BASE   (default https://tourism.od.gov.ua) — префікс URL, що пишемо в БД
 *   DB_ROLE       роль, у яку перемкнутись після підключення (SET ROLE), напр. authenticated
 */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

const { Client } = pg;
const APPLY = process.argv.includes("--apply");
const connectionString = process.env.DATABASE_URL || "postgresql://authenticator:changeme123@localhost:5432/tourism";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "/opt/tourism/storage-server/uploads/media";
const PUBLIC_BASE = (process.env.PUBLIC_BASE || "https://tourism.od.gov.ua").replace(/\/$/, "");
const OURS = /^(https?:\/\/tourism\.od\.gov\.ua)?\/storage\/v1\/object\/public\//;

const TABLES = [
  { table: "tourism_objects", label: "name" },
  { table: "cities", label: "name" },
  { table: "districts", label: "name" },
  { table: "content_cards", label: "title" },
];

const EXT_BY_TYPE = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wikimedia та інші CDN відповідають 429 на часті запити — чекаємо й пробуємо ще.
async function download(url) {
  for (let attempt = 0; ; attempt++) {
    const got = await downloadOnce(url);
    if (got.error !== "HTTP 429" || attempt >= 3) return got;
    await sleep(5_000 * (attempt + 1));
  }
}

async function downloadOnce(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (tourism.od.gov.ua media localizer)", Accept: "image/*" },
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const type = (res.headers.get("content-type") || "").split(";")[0].trim();
    if (!type.startsWith("image/")) return { error: `не зображення (${type || "без типу"})` };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1024) return { error: `підозріло малий файл (${buf.length} б)` };
    return { buf, ext: EXT_BY_TYPE[type] || "jpg" };
  } catch (e) {
    return { error: e.name === "AbortError" ? "таймаут" : e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  if (process.env.DB_ROLE) await client.query(`SET ROLE ${client.escapeIdentifier(process.env.DB_ROLE)}`);
  const coverFromGallery = async (row) => {
    const { rows: g } = await client.query(
      `select image_url from public.content_cards
        where page_key like $1 and section_key like 'gallery-%' and coalesce(image_url, '') <> ''
        order by sort_order limit 1`,
      [`%-${row.id}`],
    );
    if (!g[0] || !OURS.test(g[0].image_url)) return false;
    console.log(`${APPLY ? "GAL " : "гал."} tourism_objects/${row.id}  ${row.label} ← перше фото галереї`);
    if (APPLY) await client.query(`update public.tourism_objects set image_url = $1 where id = $2`, [g[0].image_url, row.id]);
    return true;
  };
  const cache = new Map(); // url → нова адреса або { error }
  const broken = [];
  let moved = 0;
  let fromGallery = 0;

  for (const { table, label } of TABLES) {
    const { rows } = await client.query(
      `select id, ${label} as label, image_url from public.${table}
        where image_url ~ '^https?://' and image_url !~ '^https?://tourism\\.od\\.gov\\.ua/storage/'`,
    );
    for (const row of rows) {
      if (OURS.test(row.image_url)) continue;
      let result = cache.get(row.image_url);
      if (!result) {
        await sleep(400);
        const got = await download(row.image_url);
        if (got.error) {
          result = { error: got.error };
        } else {
          const hash = crypto.createHash("sha1").update(got.buf).digest("hex").slice(0, 12);
          const name = `ext-${hash}.${got.ext}`;
          if (APPLY) await fs.writeFile(path.join(UPLOAD_DIR, name), got.buf);
          result = { url: `${PUBLIC_BASE}/storage/v1/object/public/media/${name}` };
        }
        cache.set(row.image_url, result);
      }

      if (result.url) {
        moved++;
        console.log(`${APPLY ? "OK  " : "буде"} ${table}/${row.id}  ${row.label?.slice(0, 50) ?? ""}`);
        if (APPLY) await client.query(`update public.${table} set image_url = $1 where id = $2`, [result.url, row.id]);
        continue;
      }

      // Битий зовнішній URL: для об'єкта пробуємо перше фото його власної галереї.
      if (table === "tourism_objects" && (await coverFromGallery(row))) {
        fromGallery++;
        continue;
      }
      broken.push({ table, id: row.id, label: row.label, url: row.image_url, error: result.error });
    }
  }

  // Об'єкти взагалі без обкладинки — теж у звіт (галерея як підказка).
  const { rows: noCover } = await client.query(
    `select id, name as label from public.tourism_objects where coalesce(image_url, '') = ''`,
  );
  const empty = [];
  for (const row of noCover) {
    if (await coverFromGallery(row)) fromGallery++;
    else empty.push(row);
  }

  await client.end();
  console.log(`\n${APPLY ? "Перенесено" : "Можна перенести"}: ${moved}; обкладинка з галереї: ${fromGallery}`);
  if (broken.length) {
    console.log(`\nБиті фото без заміни (${broken.length}) — підберіть нові в адмінці:`);
    for (const b of broken) console.log(`  ${b.table}/${b.id}  ${b.label}  [${b.error}]  ${b.url}`);
  }
  if (empty.length) {
    console.log(`\nОб'єкти без обкладинки (${empty.length}):`);
    for (const e of empty) console.log(`  tourism_objects/${e.id}  ${e.label}`);
  }
  if (!APPLY) console.log("\nЦе був звіт. Запустіть з --apply, щоб застосувати.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
