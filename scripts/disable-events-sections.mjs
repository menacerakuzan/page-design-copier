#!/usr/bin/env node
/**
 * Вимикає (visible:false) секції подій — "places_event" (район/місто) та
 * "related_events" (тур. об'єкт) — у ВСІХ наявних page_configs. Сама секція
 * НЕ видаляється (функціонал лишається, адмін може ввімкнути назад вручну) —
 * лише перемикається visible.
 *
 * Використання:
 *   DATABASE_URL=postgresql://authenticator:changeme123@localhost:5432/tourism \
 *     node scripts/disable-events-sections.mjs            # DRY-RUN
 *   DATABASE_URL=... node scripts/disable-events-sections.mjs --apply
 */

import "../server/assistant/loadEnv.mjs";
import pg from "pg";

const { Client } = pg;
const APPLY = process.argv.includes("--apply");
const connectionString =
  process.env.DATABASE_URL || "postgresql://authenticator:changeme123@localhost:5432/tourism";

const EVENT_KINDS = new Set(["places_event", "related_events"]);

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  await client.query("SET ROLE authenticated");

  const { rows } = await client.query(
    `select id, entity_type, sections_json from public.page_configs`,
  );

  console.log(`${rows.length} page_configs у БД. ${APPLY ? "РЕЖИМ ЗАПИСУ" : "DRY-RUN (без змін)"}\n`);

  let changed = 0;
  for (const row of rows) {
    // sections_json зберігається як JSON-РЯДОК всередині колонки (додаток сам
    // робить JSON.stringify/JSON.parse) — тому парсимо вручну, інакше
    // Array.isArray на сирому рядку завжди false.
    let sections;
    try {
      sections = JSON.parse(row.sections_json ?? "[]");
    } catch {
      sections = [];
    }
    if (!Array.isArray(sections)) sections = [];
    let touched = false;
    const next = sections.map((s) => {
      if (EVENT_KINDS.has(s.kind) && s.visible) {
        touched = true;
        return { ...s, visible: false };
      }
      return s;
    });
    if (!touched) continue;

    changed++;
    console.log(`✓ ${row.id} (${row.entity_type}) — вимкнено секцію(ї) подій`);
    if (APPLY) {
      // ВАЖЛИВО: sections_json — jsonb-колонка, що зберігає JSON-РЯДОК
      // (додаток сам робить JSON.stringify/JSON.parse, тобто подвійне
      // кодування). Якщо просто передати JSON.stringify(next) як параметр —
      // node-postgres/Postgres приведе валідний JSON-текст до jsonb МАСИВУ
      // (а не рядка), і застосунок впаде на JSON.parse(масив) з помилкою
      // "Unexpected identifier "object"" (масив.toString() → "[object
      // Object],..."). to_jsonb($1::text) примусово загортає як jsonb-РЯДОК.
      await client.query(`update public.page_configs set sections_json = to_jsonb($1::text) where id = $2`, [
        JSON.stringify(next),
        row.id,
      ]);
    }
  }

  await client.end();

  console.log(`\n── Підсумок ──`);
  console.log(`  Змінено: ${changed} з ${rows.length}`);
  if (!APPLY && changed) console.log(`\n  Це був DRY-RUN. Для запису: node scripts/disable-events-sections.mjs --apply`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
