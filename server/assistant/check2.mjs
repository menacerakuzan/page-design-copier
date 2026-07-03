// Ізолює, ЯКИЙ саме варіант виклику OpenAI зависає у твоїй мережі.
// Запуск:  node check2.mjs   (з каталогу server/assistant)
// Кожен варіант має власний тайм-аут 25с, тож скрипт не зависне назавжди.

import { config } from "./config.mjs";
import OpenAI from "openai";
import { getCatalog } from "./catalog.mjs";
import { buildSystemPrompt } from "./prompt.mjs";
import { toolDefs } from "./tools.mjs";

const cat = await getCatalog();
const sys = buildSystemPrompt(cat, "uk");
console.log("system prompt length:", sys.length, "| tools:", toolDefs.length, "| model:", config.model);
console.log();

const userMsg = { role: "user", content: "Порадь місце біля моря в Одесі. Дуже коротко." };

async function trial(name, params, opts) {
  const openai = new OpenAI({ apiKey: config.openaiApiKey, timeout: 25_000, maxRetries: 0 });
  const t = Date.now();
  try {
    const r = await openai.chat.completions.create(params, opts);
    const m = r.choices[0].message;
    console.log(
      `[${name}] OK ${Date.now() - t}ms finish=${r.choices[0].finish_reason} ` +
        `toolCalls=${(m.tool_calls || []).length} text="${(m.content || "").slice(0, 40)}"`,
    );
  } catch (e) {
    console.log(`[${name}] ERR ${Date.now() - t}ms status=${e?.status || ""} name=${e?.name} msg=${e?.message}`);
  }
}

await trial("A plain (no tools)", { model: config.model, max_tokens: 200, messages: [userMsg] }, {});
await trial(
  "B +system +tools",
  { model: config.model, max_tokens: 200, tools: toolDefs, messages: [{ role: "system", content: sys }, userMsg] },
  {},
);
const ac = new AbortController();
await trial(
  "C +system +tools +signal (=SERVER)",
  { model: config.model, max_tokens: 200, tools: toolDefs, messages: [{ role: "system", content: sys }, userMsg] },
  { signal: ac.signal },
);

process.exit(0);
