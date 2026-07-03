// Єдине джерело конфігурації сервісу асистента. Усі значення — з env зі
// зрозумілими дефолтами. МОДЕЛЬ НЕ ЗАХАРДКОДЖЕНА: щоб змінити модель, достатньо
// виставити ASSISTANT_MODEL (напр. gpt-4o, gpt-4.1-mini) — код правити не треба.

// Підвантажуємо .env.local / .env, щоб `npm start` працював без ручного export.
import "./loadEnv.mjs";

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// HTTP-заголовки приймають лише байти 0–255. Символи на кшталт «…» (U+2026)
// означають ОБРІЗАНИЙ вставлений ключ — такий ігноруємо.
const asciiOnly = (v) => Boolean(v) && !/[^\x00-\xFF]/.test(v);

// Беремо перший валідний anon-ключ: POSTGREST_ANON_KEY, інакше VITE_API_ANON_KEY.
function pickAnonKey() {
  const candidates = [process.env.POSTGREST_ANON_KEY, process.env.VITE_API_ANON_KEY];
  for (const c of candidates) {
    const v = (c || "").trim();
    if (!v) continue;
    if (asciiOnly(v)) return v;
    // eslint-disable-next-line no-console
    console.warn("[assistant] ігнорую anon-ключ із недопустимими символами (обрізаний «…»?)");
  }
  return "";
}

export const config = {
  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  model: process.env.ASSISTANT_MODEL || "gpt-4o-mini",
  temperature: num(process.env.ASSISTANT_TEMPERATURE, 0.6),
  maxTokens: num(process.env.ASSISTANT_MAX_TOKENS, 1200),
  // Скільки останніх повідомлень історії передавати моделі (пари user/assistant).
  maxHistory: num(process.env.ASSISTANT_MAX_HISTORY, 20),

  // HTTP
  port: num(process.env.ASSISTANT_PORT, 8790),

  // PostgREST (read-only, той самий anon-ключ, що й фронтенд)
  postgrestUrl: (process.env.POSTGREST_URL || "http://127.0.0.1:3100").replace(/\/$/, ""),
  postgrestAnonKey: pickAnonKey(),

  // Каталог кешується в памʼяті на цей час (мс)
  catalogTtlMs: num(process.env.ASSISTANT_CATALOG_TTL_MS, 5 * 60 * 1000),

  // Простий rate-limit по IP
  rateLimitWindowMs: num(process.env.ASSISTANT_RATE_WINDOW_MS, 60 * 1000),
  rateLimitMax: num(process.env.ASSISTANT_RATE_MAX, 20),

  // Ліміти вводу
  maxUserChars: num(process.env.ASSISTANT_MAX_USER_CHARS, 2000),
  // Максимум раундів agentic-loop (виклики інструментів) на один запит
  maxToolRounds: num(process.env.ASSISTANT_MAX_TOOL_ROUNDS, 4),
  // Жорсткий вотчдог на весь запит: якщо OpenAI не відповідає — не «думаємо
  // вічно», а віддаємо помилку.
  requestTimeoutMs: num(process.env.ASSISTANT_REQUEST_TIMEOUT_MS, 55_000),
  // Затримка між рядками при віддачі готової відповіді у чат (ефект «набору»).
  // 0 — вимкнути (віддати миттєво).
  uiChunkDelayMs: num(process.env.ASSISTANT_UI_CHUNK_DELAY_MS, 25),
};

export function assertConfig() {
  if (!config.openaiApiKey || !asciiOnly(config.openaiApiKey.trim())) {
    throw new Error(
      "OPENAI_API_KEY не заданий або недійсний. Впишіть справжній ключ у .env.local " +
        "(OPENAI_API_KEY=sk-...) і просто запустіть `npm start` — не передавайте «…» як значення.",
    );
  }
  if (!config.postgrestAnonKey) {
    // eslint-disable-next-line no-console
    console.warn(
      "[assistant] Порожній anon-ключ для PostgREST. Впишіть повний VITE_API_ANON_KEY у .env.local " +
        "(або POSTGREST_ANON_KEY) — інакше каталог не завантажиться.",
    );
  }
}
