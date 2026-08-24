import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://authenticator:changeme123@localhost:5432/tourism",
});

async function translate(text) {
  if (!text || text.trim() === "") return null;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=uk&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    const translated = data[0].map((chunk) => chunk[0]).join("");
    return translated;
  } catch (e) {
    console.error("Translate error:", e.message);
    return null;
  }
}

async function translateTable(table, fields, idCol = "id") {
  console.log(`\n=== Translating ${table} ===`);

  const { rows } = await client.query(`SELECT ${idCol}, ${fields.join(", ")} FROM ${table}`);
  console.log(`  Found ${rows.length} rows`);

  for (const row of rows) {
    const updates = [];
    const values = [];
    let idx = 1;

    for (const field of fields) {
      const text = row[field];
      if (!text) continue;

      process.stdout.write(`  [${String(row[idCol]).slice(0, 20)}] ${field}: ${text.slice(0, 40)}... `);
      const translated = await translate(text);
      if (translated) {
        updates.push(`${field}_en = $${idx++}`);
        values.push(translated);
        console.log(`→ ${translated.slice(0, 40)}`);
      } else {
        console.log("→ SKIP");
      }

      await new Promise(r => setTimeout(r, 300));
    }

    if (updates.length > 0) {
      values.push(row[idCol]);
      await client.query(
        `UPDATE ${table} SET ${updates.join(", ")} WHERE ${idCol} = $${idx}`,
        values
      );
    }
  }
}

async function main() {
  await client.connect();
  // authenticator є NOINHERIT-членом authenticated (secure-auth.sql) — без
  // явного SET ROLE політики RLS на цю сесію не діють: UPDATE мовчки зачепить
  // 0 рядків замість помилки.
  await client.query("SET ROLE authenticated");
  console.log("Connected to DB");

  // districts
  await translateTable("districts", ["name", "subtitle", "description"]);

  // cities
  const { rows: cities } = await client.query("SELECT id, name FROM cities");
  console.log(`\n=== Translating cities (${cities.length}) ===`);
  for (const row of cities) {
    process.stdout.write(`  ${row.name} → `);
    const t = await translate(row.name);
    if (t) {
      await client.query("UPDATE cities SET name_en = $1 WHERE id = $2", [t, row.id]);
      console.log(t);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  // tourism_objects
  await translateTable("tourism_objects", ["name", "subtitle", "description", "detailed_info", "address", "hours", "amenities"]);

  // content_cards
  await translateTable("content_cards", ["title", "subtitle"], "id");

  console.log("\n✓ All done!");
  await client.end();
}

main().catch(console.error);
