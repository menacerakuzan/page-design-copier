// Швидка діагностика: перевіряє ключ OpenAI і доступ до PostgREST напряму.
// Запуск:  node check.mjs   (з каталогу server/assistant)

import { config } from "./config.mjs";
import OpenAI from "openai";
import { getCatalog } from "./catalog.mjs";

const mask = (s) => (s ? `${s.slice(0, 7)}…${s.slice(-4)} (${s.length} chars)` : "MISSING");

console.log("== Конфіг ==");
console.log("model:            ", config.model);
console.log("OPENAI_API_KEY:   ", mask(config.openaiApiKey));
console.log("POSTGREST_URL:    ", config.postgrestUrl);
console.log("anon key:         ", mask(config.postgrestAnonKey));
console.log();

// 1) PostgREST
process.stdout.write("== PostgREST: ");
try {
  const cat = await getCatalog();
  console.log(`OK (${cat.items.length} об'єктів, ${cat.districts.length} районів) ==`);
} catch (e) {
  console.log(`ПОМИЛКА == ${e?.message || e}`);
}

// 2) OpenAI (без стрімінгу — швидка перевірка ключа/квоти)
process.stdout.write("== OpenAI: ");
try {
  const openai = new OpenAI({ apiKey: config.openaiApiKey, timeout: 30_000, maxRetries: 0 });
  const t = Date.now();
  const r = await openai.chat.completions.create({
    model: config.model,
    max_tokens: 5,
    messages: [{ role: "user", content: "Скажи 'ок'." }],
  });
  console.log(`OK (${Date.now() - t}ms) == відповідь: ${JSON.stringify(r.choices[0]?.message?.content)}`);
} catch (e) {
  console.log("ПОМИЛКА ==");
  console.log("  status:", e?.status);
  console.log("  type:  ", e?.error?.type || e?.code);
  console.log("  msg:   ", e?.message);
  if (e?.status === 429) console.log("  → Схоже на брак кредитів/квоти. Додайте білінг на platform.openai.com.");
  if (e?.status === 401) console.log("  → Невірний OPENAI_API_KEY.");
}
process.exit(0);
