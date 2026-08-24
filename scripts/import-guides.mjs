#!/usr/bin/env node
/**
 * Одноразовий імпорт src/data/guides.json (див. scripts/scrape-guides.mjs) у
 * таблицю public.guides. Після цього гіди редагуються тільки через адмінку —
 * цей файл більше не є джерелом правди.
 *
 * Використання:
 *   DATABASE_URL=postgresql://authenticator:changeme123@localhost:5432/tourism \
 *     node scripts/import-guides.mjs            # DRY-RUN
 *   DATABASE_URL=... node scripts/import-guides.mjs --apply
 */

import "../server/assistant/loadEnv.mjs";
import fs from "node:fs";
import pg from "pg";

const { Client } = pg;
const APPLY = process.argv.includes("--apply");
const connectionString =
  process.env.DATABASE_URL || "postgresql://authenticator:changeme123@localhost:5432/tourism";

async function main() {
  const guides = JSON.parse(fs.readFileSync("src/data/guides.json", "utf8"));
  console.log(`${guides.length} гідів у src/data/guides.json. ${APPLY ? "РЕЖИМ ЗАПИСУ" : "DRY-RUN"}\n`);

  if (!APPLY) {
    guides.forEach((g, i) => console.log(`  ${i + 1}. ${g.surname} ${g.firstName}`));
    console.log("\nЦе був DRY-RUN. Для запису: node scripts/import-guides.mjs --apply");
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();
  // authenticator є NOINHERIT-членом authenticated (secure-auth.sql) — без
  // явного SET ROLE політики RLS "TO authenticated" на цю сесію не діють:
  // INSERT впаде з permission denied, а UPDATE мовчки зачепить 0 рядків.
  await client.query("SET ROLE authenticated");

  for (const [i, g] of guides.entries()) {
    await client.query(
      `insert into public.guides (id, surname, first_name, cert, languages, personal_url, photo_url, dstu, published, sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,true,$9)
       on conflict (id) do update set
         surname = excluded.surname, first_name = excluded.first_name, cert = excluded.cert,
         languages = excluded.languages, personal_url = excluded.personal_url,
         photo_url = excluded.photo_url, dstu = excluded.dstu`,
      [g.slug, g.surname, g.firstName, g.cert, g.languages, g.personalUrl, g.photoUrl, g.dstu, i],
    );
    console.log(`  ✓ ${g.surname} ${g.firstName}`);
  }

  await client.end();
  console.log(`\nІмпортовано ${guides.length} гідів у public.guides`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
