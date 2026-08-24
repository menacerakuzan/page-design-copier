#!/usr/bin/env node
/**
 * Генерує public/sitemap.xml зі всіх опублікованих сторінок (райони, міста,
 * тур. об'єкти, маршрути) + статичних розділів. Розрахований на build-крок
 * (npm run build) — читає з PostgREST (той самий anon-ключ, що й фронтенд).
 *
 * Fail-safe: якщо БД недоступна — НЕ падає (щоб не ламати білд), лишає
 * попередній sitemap.xml (якщо він є) і виводить попередження в stderr.
 *
 * Використання:  node scripts/generate-sitemap.mjs
 */

import "../server/assistant/loadEnv.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(here, "..", "public", "sitemap.xml");

const SITE_URL = "https://tourism.od.gov.ua";
const POSTGREST_URL = process.env.POSTGREST_URL || "http://127.0.0.1:3100";
const ANON_KEY = process.env.POSTGREST_ANON_KEY || process.env.VITE_API_ANON_KEY;

const OBJECT_TYPE_SLUG = {
  attraction: "mistse",
  event: "podiyi",
  restaurant: "restorany",
  hotel: "hoteli",
};

// Статичні розділи сайту (без службових /admin, /koshyk, /marshrut, /asystent).
const STATIC_PATHS = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/districts", priority: "0.8", changefreq: "weekly" },
  { path: "/types", priority: "0.7", changefreq: "monthly" },
  { path: "/marshruty", priority: "0.7", changefreq: "weekly" },
  { path: "/hidy", priority: "0.6", changefreq: "monthly" },
  { path: "/poblizu", priority: "0.5", changefreq: "monthly" },
  { path: "/info", priority: "0.6", changefreq: "weekly" },
];

async function pg(query) {
  const res = await fetch(`${POSTGREST_URL}/${query}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`PostgREST ${res.status} on ${query}`);
  return res.json();
}

function xmlEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc, { priority = "0.5", changefreq = "monthly" } = {}) {
  return `  <url>\n    <loc>${xmlEscape(SITE_URL + loc)}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function main() {
  if (!ANON_KEY) throw new Error("POSTGREST_ANON_KEY / VITE_API_ANON_KEY не задано");

  const [districts, cities, objects, routes] = await Promise.all([
    pg("districts?select=slug"),
    pg("cities?select=slug"),
    pg("tourism_objects?select=slug,type&published=eq.true"),
    pg("routes?select=id&published=eq.true"),
  ]);

  const entries = [
    ...STATIC_PATHS.map((p) => urlEntry(p.path, p)),
    ...districts.map((d) => urlEntry(`/raion/${d.slug}`, { priority: "0.7", changefreq: "weekly" })),
    ...cities.map((c) => urlEntry(`/napryamky/${c.slug}`, { priority: "0.7", changefreq: "weekly" })),
    ...objects.map((o) =>
      urlEntry(`/${OBJECT_TYPE_SLUG[o.type] ?? "mistse"}/${o.slug}`, { priority: "0.6", changefreq: "monthly" }),
    ),
    ...routes.map((r) => urlEntry(`/marshruty/${r.id}`, { priority: "0.6", changefreq: "monthly" })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join("\n") +
    `\n</urlset>\n`;

  fs.writeFileSync(outPath, xml);
  console.log(`[sitemap] записано ${entries.length} URL у ${outPath}`);
}

main().catch((err) => {
  console.warn(`[sitemap] ПОПЕРЕДЖЕННЯ: не вдалося згенерувати sitemap.xml (${err.message}). `
    + `Білд продовжується, лишається попередній файл, якщо є.`);
  process.exit(0); // не валимо build
});
