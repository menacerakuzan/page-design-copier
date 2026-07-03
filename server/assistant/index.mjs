// Сервіс «Туристичного асистента»: проксі до OpenAI Chat Completions із
// function-calling. БЕЗ стрімінгу — звичайний JSON запит/відповідь (надійно,
// без проблем із буферизацією SSE у проксі/фаєрволах). Ключ OpenAI живе лише
// тут (server-only) і ніколи не потрапляє у фронтенд-бандл.
//
// Запуск:  node index.mjs   (з каталогу server/assistant; читає ../../.env.local)
// Прод:    окремий процес (pm2/systemd), reverse-proxy /api/ -> :ASSISTANT_PORT

import express from "express";
import OpenAI from "openai";

import { config, assertConfig } from "./config.mjs";
import { getCatalog } from "./catalog.mjs";
import { buildSystemPrompt } from "./prompt.mjs";
import { toolDefs, runTool } from "./tools.mjs";

assertConfig();

// timeout — щоб мережеве зависання ставало помилкою, а не «вічним думанням».
// maxRetries — SDK сам повторить транзієнтні збої (429/5xx/мережа).
const openai = new OpenAI({ apiKey: config.openaiApiKey, timeout: 60_000, maxRetries: 2 });

const app = express();
app.use(express.json({ limit: "256kb" }));

// ── Простий rate-limit по IP ─────────────────────────────────────────────
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < config.rateLimitWindowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > config.rateLimitMax;
}

app.get("/api/assistant/health", (_req, res) => {
  res.json({ ok: true, model: config.model, build: "json-v4" });
});

/**
 * Ганяє agentic-loop (модель ↔ інструмент search_objects) і повертає фінальний
 * текст відповіді. Патерн — точно за офіційною документацією OpenAI:
 *   1) create з tools; 2) якщо є tool_calls — виконати й додати role:"tool";
 *   3) повторювати, доки модель не поверне відповідь без tool_calls.
 */
async function runConversation(history, lang) {
  const catalog = await getCatalog();
  const messages = [{ role: "system", content: buildSystemPrompt(catalog, lang) }, ...history];

  for (let round = 0; round < config.maxToolRounds; round++) {
    // eslint-disable-next-line no-console
    console.log(`[assistant] round ${round}: calling OpenAI (${config.model})…`);
    const completion = await openai.chat.completions.create({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      tools: toolDefs,
      tool_choice: "auto",
      messages,
    });

    const msg = completion.choices?.[0]?.message;
    const toolCalls = msg?.tool_calls ?? [];
    // eslint-disable-next-line no-console
    console.log(
      `[assistant] round ${round}: reply (finish=${completion.choices?.[0]?.finish_reason}, ` +
        `textLen=${(msg?.content || "").length}, toolCalls=${toolCalls.length})`,
    );

    if (!toolCalls.length) {
      return (msg?.content || "").trim();
    }

    // Обовʼязково додаємо повний assistant-хід із tool_calls…
    messages.push(msg);
    // …а далі — по одному tool-результату на кожен виклик.
    for (const call of toolCalls) {
      let args = {};
      try {
        args = JSON.parse(call.function?.arguments || "{}");
      } catch {
        args = {};
      }
      let output;
      try {
        output = await runTool(call.function?.name, args);
      } catch (err) {
        output = JSON.stringify({ error: String(err?.message || err) });
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: output });
    }
  }

  // Ліміт раундів вичерпано без фінальної відповіді.
  return lang === "en"
    ? "Sorry, I couldn't finish that request. Please rephrase. 🙏"
    : "Вибачте, не вдалося завершити запит. Спробуйте переформулювати. 🙏";
}

app.post("/api/assistant", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "?").trim();
  if (rateLimited(ip)) {
    res.status(429).json({ error: "rate_limited" });
    return;
  }

  const lang = req.body?.lang === "en" ? "en" : "uk";
  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];

  // Санітизація історії: лише user/assistant з текстом, останні N, з лімітом довжини.
  const history = rawMessages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-config.maxHistory)
    .map((m) => ({ role: m.role, content: m.content.slice(0, config.maxUserChars) }));

  if (!history.length || history[history.length - 1].role !== "user") {
    res.status(400).json({ error: "last_message_must_be_user" });
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[assistant] request lang=${lang} msgs=${history.length}`);

  try {
    const reply = await runConversation(history, lang);
    // eslint-disable-next-line no-console
    console.log(`[assistant] done (replyLen=${reply.length})`);
    res.json({ reply });
  } catch (err) {
    const status = err?.status;
    // eslint-disable-next-line no-console
    console.error("[assistant] error:", status || "", err?.name || "", err?.message || err);
    if (status === 429) {
      res.status(429).json({ error: "rate_limited" });
    } else {
      res.status(502).json({ error: "assistant_failed" });
    }
  }
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[assistant] listening on :${config.port} (model=${config.model}) [build: JSON v4]`);
});
