import pg from "pg";

const { Client } = pg;
const connectionString =
  process.env.DATABASE_URL || "postgresql://authenticator:changeme123@localhost:5432/tourism";

const regions = [{ id: "region-odesa", name: "Одеська область", slug: "odeska-oblast" }];

const districts = [
  { id: "district-odeskyi", region_id: "region-odesa", name: "Одеський район", slug: "odeskyi-raion" },
  { id: "district-bilhorod", region_id: "region-odesa", name: "Білгород-Дністровський район", slug: "bilhorod-dnistrovskyi-raion" },
];

const cities = [
  { id: "city-odesa", district_id: "district-odeskyi", name: "Одеса", slug: "odesa" },
  { id: "city-bilhorod", district_id: "district-bilhorod", name: "Білгород-Дністровський", slug: "bilhorod-dnistrovskyi" },
  { id: "city-bolhrad", district_id: "district-bilhorod", name: "Болград", slug: "bolhrad" },
];

const tourismObjects = [
  {
    id: "obj-event-bessarabia",
    district_id: "district-bilhorod",
    city_id: "city-bolhrad",
    type: "event",
    name: "Фестиваль вина та смаку Бессарабії",
    slug: "festyval-vyna-ta-smaku-bessarabii",
    published: true,
  },
  {
    id: "obj-hotel-fortetsia",
    district_id: "district-bilhorod",
    city_id: "city-bilhorod",
    type: "hotel",
    name: "Fortetsia View Hotel",
    slug: "fortetsia-view-hotel",
    published: true,
  },
  {
    id: "obj-restaurant-rybnyi",
    district_id: "district-bilhorod",
    city_id: "city-bilhorod",
    type: "restaurant",
    name: "Рибний двір",
    slug: "rybnyy-dvir",
    published: true,
  },
];

const contentCards = [
  {
    id: "card-destination-bilhorod",
    page_key: "index",
    section_key: "directions",
    card_type: "destination",
    title: "Білгород-Дністровський",
    subtitle: "",
    image_url: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
    href: "/napryamky/bilhorod-dnistrovskyi",
    city_id: "city-bilhorod",
    district_id: "district-bilhorod",
    region_id: "region-odesa",
    sort_order: 1,
    published: true,
    payload: {},
  },
  {
    id: "card-event-bessarabia",
    page_key: "index",
    section_key: "events",
    card_type: "event",
    title: "Фестиваль вина та смаку Бессарабії",
    subtitle: "Болград, 24.04 - 03.05.2026",
    image_url: "https://images.unsplash.com/photo-1532635042-a6f6ad4745f9?auto=format&fit=crop&w=1200&q=80",
    href: "/podiyi/festyval-vyna-ta-smaku-bessarabii",
    city_id: "city-bolhrad",
    district_id: "district-bilhorod",
    region_id: "region-odesa",
    sort_order: 1,
    published: true,
    payload: { badgeTop: "до", badgeDay: "3", badgeMonth: "травень" },
  },
  {
    id: "card-hotel-fortetsia",
    page_key: "city-bilhorod",
    section_key: "hotels",
    card_type: "hotel",
    title: "Fortetsia View Hotel",
    subtitle: "Білгород-Дністровський",
    image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    href: "/hoteli/fortetsia-view-hotel",
    city_id: "city-bilhorod",
    district_id: "district-bilhorod",
    region_id: "region-odesa",
    sort_order: 1,
    published: true,
    payload: { rating: "4.8" },
  },
  {
    id: "card-restaurant-rybnyi",
    page_key: "city-bilhorod",
    section_key: "restaurants",
    card_type: "restaurant",
    title: "Рибний двір",
    subtitle: "Білгород-Дністровський",
    image_url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
    href: "/restorany/rybnyy-dvir",
    city_id: "city-bilhorod",
    district_id: "district-bilhorod",
    region_id: "region-odesa",
    sort_order: 1,
    published: true,
    payload: {},
  },
];

/** Upsert plain objects into a table by `id`, JSON-encoding object columns (jsonb). */
async function upsertRows(client, table, rows) {
  for (const row of rows) {
    const cols = Object.keys(row);
    const values = cols.map((c) =>
      row[c] !== null && typeof row[c] === "object" ? JSON.stringify(row[c]) : row[c],
    );
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const setCols = cols.filter((c) => c !== "id").map((c) => `${c} = EXCLUDED.${c}`);
    await client.query(
      `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders.join(", ")})
       ON CONFLICT (id) DO UPDATE SET ${setCols.join(", ")}`,
      values,
    );
  }
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();
  // service_role has the table grants + bypassrls; authenticator is a member of it.
  await client.query("SET ROLE service_role");

  const steps = [
    ["regions", regions],
    ["districts", districts],
    ["cities", cities],
    ["tourism_objects", tourismObjects],
    ["content_cards", contentCards],
  ];
  for (const [table, rows] of steps) {
    await upsertRows(client, table, rows);
    console.log(`Seeded ${table} (${rows.length})`);
  }

  await client.end();
  console.log("DB seed completed");
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
