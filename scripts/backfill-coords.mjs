#!/usr/bin/env node
/**
 * Бекфіл координат (latitude/longitude) для tourism_objects.
 *
 * Більшість об'єктів мають map_url = скорочене посилання maps.app.goo.gl без
 * координат у тексті. Скрипт резолвить такі посилання (слідує HTTP-редіректу),
 * витягує координати з фінального URL / тіла відповіді і записує їх у колонки
 * latitude/longitude. Заповнює лише порожні координати (не перезаписує наявні).
 *
 * Використання (потрібен привілейований DATABASE_URL — власник/суперюзер БД,
 * бо роль `authenticator` не має прямого SQL-доступу до схеми public):
 *   DATABASE_URL=postgresql://OWNER:PASS@localhost:5432/tourism \
 *     node scripts/backfill-coords.mjs            # DRY-RUN: нічого не змінює, лише звіт
 *   DATABASE_URL=... node scripts/backfill-coords.mjs --apply   # записати координати
 *
 * Env:
 *   DATABASE_URL  (default postgresql://authenticator:changeme123@localhost:5432/tourism —
 *                  переважно замініть на власника БД, інакше permission denied)
 */

import fs from "node:fs";
import pg from "pg";

const { Client } = pg;
const APPLY = process.argv.includes("--apply");
const connectionString =
  process.env.DATABASE_URL || "postgresql://authenticator:changeme123@localhost:5432/tourism";

// ── Витяг координат з рядка URL (портовано з src/lib/geo.ts + додаткові патерни) ──
//
// ВАЖЛИВО: !3d!4d (координати самого маркера місця) МАЄ перевірятись ПЕРШИМ,
// перед @lat,lng (це лише центр видимого вьюпорта карти на момент, коли лінк
// розшарили — може бути де завгодно, якщо людина перед копіюванням посилання
// прокрутила/віддалила карту). Раніше порядок був зворотний, і саме тому один
// об'єкт (EquiLife, Чорноморськ) отримав координати в Угорщині — !3d!4d у його
// URL вказував на правильне місце (46.32, 30.63), а @lat,lng випадково влучив
// у 47.98, 22.73. Аудит (2026-07-25) знайшов 42 таких розбіжності по всій базі.
function extractCoords(url) {
  if (!url) return null;
  const patterns = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, //  !3dLAT!4dLNG — маркер місця, пріоритетний
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/, //  ?q=lat,lng
    /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/, //  ll=lat,lng
    /[?&]destination=(-?\d+\.\d+),(-?\d+\.\d+)/, //  destination=lat,lng
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, //  /@lat,lng — viewport, лише як запасний варіант
    /\/(-?\d+\.\d+),(-?\d+\.\d+)/, //  /lat,lng
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[2]);
      // Реальна санітарна перевірка діапазону — Одещина й сусідні області
      // (не "будь-яка точка Землі", як було раніше: Math.abs(lat) <= 90).
      if (lat >= 44 && lat <= 49 && lng >= 26 && lng <= 32) return { lat, lng };
    }
  }
  return null;
}

// Резолв одного map_url → координати. Слідує редіректу для коротких посилань.
async function resolveCoords(mapUrl) {
  const firstLine = String(mapUrl).split("\n").find(Boolean) ?? "";
  if (!firstLine) return null;

  // 1) Вже містить координати?
  const direct = extractCoords(firstLine);
  if (direct) return direct;

  // 2) Скорочене / будь-яке посилання → слідуємо редіректу, читаємо фінальний URL і тіло.
  try {
    const res = await fetch(firstLine, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; coords-backfill/1.0)" },
    });
    const fromFinalUrl = extractCoords(res.url);
    if (fromFinalUrl) return fromFinalUrl;
    const body = await res.text();
    return extractCoords(body);
  } catch (e) {
    return null;
  }
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  // authenticator є NOINHERIT-членом authenticated (secure-auth.sql) — без
  // явного SET ROLE політика RLS "authenticated write tourism_objects" не діє
  // на цю сесію: UPDATE мовчки зачепить 0 рядків замість помилки.
  await client.query("SET ROLE authenticated");

  const { rows } = await client.query(
    `select id, name, type, slug, map_url
       from public.tourism_objects
      where (latitude is null or longitude is null)
        and map_url is not null
        and map_url <> ''
      order by name`,
  );

  console.log(`${rows.length} об'єктів без координат із map_url. ${APPLY ? "РЕЖИМ ЗАПИСУ" : "DRY-RUN (без змін)"}\n`);

  const resolved = [];
  const unresolved = [];

  for (const row of rows) {
    const coords = await resolveCoords(row.map_url);
    if (coords) {
      resolved.push({ ...row, ...coords });
      console.log(`✓ ${row.name}  →  ${coords.lat}, ${coords.lng}`);
      if (APPLY) {
        await client.query(
          `update public.tourism_objects set latitude = $1, longitude = $2 where id = $3`,
          [coords.lat, coords.lng, row.id],
        );
      }
    } else {
      unresolved.push({ id: row.id, name: row.name, slug: row.slug, type: row.type, map_url: row.map_url });
      console.log(`✗ ${row.name}  (не вдалося отримати координати)`);
    }
    // Ввічлива пауза, щоб не спамити Google.
    await new Promise((r) => setTimeout(r, 250));
  }

  await client.end();

  const outPath = "scripts/backfill-coords.unresolved.json";
  fs.writeFileSync(outPath, JSON.stringify(unresolved, null, 2));

  console.log(`\n── Підсумок ──`);
  console.log(`  Отримано координати: ${resolved.length}`);
  console.log(`  Не вдалося:          ${unresolved.length}  →  ${outPath} (довнести вручну в адмінці)`);
  if (!APPLY && resolved.length) console.log(`\n  Це був DRY-RUN. Для запису: node scripts/backfill-coords.mjs --apply`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
