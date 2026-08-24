#!/usr/bin/env node
/**
 * Прогонює QUESTIONS через живий /api/assistant і автоматично звіряє
 * відповіді з реальним каталогом (server/assistant/catalog.mjs) — та сама
 * функція пошуку, що використовує сам асистент, тож "ground truth" завжди
 * актуальний, без хардкоджених цифр, які могли б розсинхронізуватись із БД.
 *
 * Перевірки:
 *   - усі [[obj:slug]] у відповіді існують у реальному каталозі (анти-галюцинація)
 *   - для питань expect:"hasObjects" — модель не сказала "немає", хоча є дані
 *   - для питань expect:"shouldBeEmpty" — модель чесно каже "немає" (не вигадує)
 *   - для питань expect:"hasRoute" — є директива [[route: ...]]
 *
 * Використання:  node scripts/test-assistant.mjs
 * Результат:      reports/assistant-test-report.md + .json (сирі відповіді)
 */

import "./../server/assistant/loadEnv.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTIONS } from "./assistant-test-questions.mjs";
import { searchObjects, getCatalog } from "../server/assistant/catalog.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ASSISTANT_URL = process.env.ASSISTANT_TEST_URL || "http://127.0.0.1:8790/api/assistant";
const DELAY_MS = 2500; // тримаємось під rate-limit (20/60с) з запасом

const EMPTY_PHRASES = [
  "немає", "на жаль", "не знайшл", "не вдалося знайти", "відсутн", "not available", "no data", "couldn't find", "don't have",
];

function looksEmpty(text) {
  const t = text.toLowerCase();
  return EMPTY_PHRASES.some((p) => t.includes(p));
}

function extractObjRefs(text) {
  const re = /\[\[obj:([a-z0-9-]+)\]\]/gi;
  const out = [];
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

function extractRouteRefs(text) {
  return /\[\[route:/i.test(text);
}

async function askAssistant(question) {
  const res = await fetch(ASSISTANT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: question }], lang: "uk" }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return data.reply || "";
}

// Службові слова, що лише "шумлять" у ground-truth пошуку (сам пошук у
// catalog.mjs вимагає збігу ВСІХ слів — прибираємо загальні, лишаємо суть).
const STOPWORDS = new Set([
  "що", "як", "де", "куди", "чому", "який", "яка", "яке", "які", "чи", "і", "та", "або",
  "подивитись", "подивитися", "сходити", "піти", "розкажи", "розповісти", "порадь",
  "порадиш", "цікавого", "цікавить", "хочу", "можна", "є", "на", "у", "в", "для", "про",
  "найближчим", "часом", "заплановані", "які", "склади", "по", "3", "місця", "вихідні",
]);

// Реальна кількість об'єктів у каталозі, що відповідають ключовим словам
// питання (після відсіву службових слів) — той самий пошук, що робить сам
// асистент інструментом search_objects.
async function groundTruth(question) {
  const cleaned = question
    .toLowerCase()
    .replace(/[?!.,]/g, "")
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w))
    .join(" ");
  const { total } = await searchObjects({ query: cleaned, limit: 1 });
  return total;
}

// Множина всіх реальних slug'ів каталогу — для перевірки анти-галюцинації.
// ВАЖЛИВО: searchObjects() завжди обмежує limit до 20 (навмисно, для моделі) —
// тож тут беремо повний каталог напряму через getCatalog(), інакше майже все
// підряд хибно позначається як "вигадане".
async function realSlugSet() {
  const cat = await getCatalog();
  return new Set(cat.items.map((i) => i.slug));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`Прогоняю ${QUESTIONS.length} питань через ${ASSISTANT_URL}\n`);
  const knownSlugs = await realSlugSet();
  const results = [];

  for (const item of QUESTIONS) {
    process.stdout.write(`#${item.id} [${item.category}] "${item.q}" ... `);
    let reply = "";
    let error = null;
    try {
      reply = await askAssistant(item.q);
    } catch (e) {
      error = e.message;
    }

    const objRefs = extractObjRefs(reply);
    const fakeSlugs = objRefs.filter((s) => !knownSlugs.has(s));
    const hasRoute = extractRouteRefs(reply);
    const empty = looksEmpty(reply);
    const gt = error ? null : await groundTruth(item.q);

    let verdict = "✅";
    const notes = [];

    if (error) {
      verdict = "❌";
      notes.push(`Помилка запиту: ${error}`);
    } else {
      if (fakeSlugs.length > 0) {
        verdict = "❌";
        notes.push(`Вигадані slug (не існують у БД): ${fakeSlugs.join(", ")}`);
      }
      if (item.expect === "hasObjects" && empty && objRefs.length === 0) {
        verdict = "❌";
        notes.push(`Модель каже "немає", хоча ground-truth пошук знайшов ${gt} об'єктів`);
      }
      if (item.expect === "shouldBeEmpty" && !empty && objRefs.length > 0) {
        verdict = "⚠️";
        notes.push(`Очікувалась порожня категорія, але модель показала ${objRefs.length} об'єкт(и) — перевір вручну, чи не галюцинація`);
      }
      if (item.expect === "hasRoute" && !hasRoute) {
        verdict = verdict === "❌" ? verdict : "⚠️";
        notes.push(`Очікувалась директива [[route: ...]] — не знайдено`);
      }
      if (item.expect === "noFakeContacts") {
        notes.push(`Ручна перевірка контактів потрібна — див. текст відповіді нижче`);
        if (verdict === "✅") verdict = "⚠️";
      }
    }

    console.log(verdict);
    results.push({ ...item, reply, error, objRefs, fakeSlugs, hasRoute, empty, groundTruthTotal: gt, verdict, notes });
    await sleep(DELAY_MS);
  }

  const reportsDir = path.join(here, "..", "reports");
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, "assistant-test-raw.json"), JSON.stringify(results, null, 2));

  const lines = [];
  lines.push("# Звіт тестування ШІ-асистента\n");
  lines.push(`_Прогнано ${results.length} питань, ${new Date().toISOString().slice(0, 10)}._\n`);

  const counts = { "✅": 0, "⚠️": 0, "❌": 0 };
  results.forEach((r) => counts[r.verdict]++);
  lines.push(`## Зведення\n`);
  lines.push(`| Вердикт | Кількість |`);
  lines.push(`|---|---|`);
  lines.push(`| ✅ Ок | ${counts["✅"]} |`);
  lines.push(`| ⚠️ Потребує уваги | ${counts["⚠️"]} |`);
  lines.push(`| ❌ Проблема | ${counts["❌"]} |`);
  lines.push("");

  lines.push(`## Деталі\n`);
  for (const r of results) {
    lines.push(`### ${r.verdict} #${r.id} [${r.category}] ${r.q}\n`);
    if (r.notes.length) lines.push(r.notes.map((n) => `- ⚠️ ${n}`).join("\n") + "\n");
    lines.push(`**Відповідь:**\n\n> ${(r.reply || "(порожньо/помилка)").replace(/\n/g, "\n> ")}\n`);
    lines.push("");
  }

  fs.writeFileSync(path.join(reportsDir, "assistant-test-report.md"), lines.join("\n"));
  console.log(`\n── Підсумок ──`);
  console.log(`  ✅ ${counts["✅"]}   ⚠️ ${counts["⚠️"]}   ❌ ${counts["❌"]}`);
  console.log(`  Звіт: reports/assistant-test-report.md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
