# Туристичний ІІ-асистент — серверний сервіс

Окремий Node-процес: тонкий проксі до **OpenAI Chat Completions** зі стрімінгом
(SSE) + пошук по базі через PostgREST. Ключ OpenAI живе **лише тут** і ніколи не
потрапляє у фронтенд-бандл.

## Ендпоінти
- `POST /api/assistant` — тіло `{ messages: [{role:'user'|'assistant', content}], lang: 'uk'|'en' }`; відповідь — **звичайний JSON** `{ reply: "…" }` (без стрімінгу — надійно, без проблем із буферизацією SSE у проксі/фаєрволах). Помилки: `429 {error:'rate_limited'}`, `502 {error:'assistant_failed'}`.
- `GET /api/assistant/health` — `{ ok, model, build }`.

Всередині — agentic-loop за офіційним патерном OpenAI function-calling: `create` з
`tools` → якщо є `tool_calls`, виконуємо `search_objects` і додаємо `role:"tool"` →
повторюємо, доки модель не поверне фінальний текст.

## Конфіг (env)
Головне — `OPENAI_API_KEY` і `ASSISTANT_MODEL` (модель міняється однією змінною).
Повний перелік — у кореневому `.env.example`. Значення читаються процесом із env,
дефолти — у `config.mjs`.

## Локальний запуск
Сервер САМ читає кореневі `.env.local` / `.env` (без ручного export). Треба лише,
щоб там був справжній `OPENAI_API_KEY`, а `VITE_API_ANON_KEY` (або
`POSTGREST_ANON_KEY`) містив повний anon-JWT.

```bash
cd server/assistant
npm install        # один раз
npm start          # читає ../../.env.local автоматично
curl localhost:8790/api/assistant/health
```

> Не передавай `…` як значення (`OPENAI_API_KEY=… npm start`) — це плейсхолдер, а не
> ключ. Просто впиши справжні значення у `.env.local` і запусти `npm start`.
> Обрізаний anon-ключ із «…» тепер ігнорується (береться `VITE_API_ANON_KEY`).
Vite (dev) проксіює `/api` → `http://127.0.0.1:8790`, тож фронтенд бачить асистента
same-origin (див. `vite.config.ts`).

## Прод
Запускати як окремий процес (pm2/systemd) на тому ж хості, що й сайт, і додати у
reverse-proxy (nginx) локацію `/api/` → `http://127.0.0.1:8790` — поряд із наявними
`/rest/v1` та `/storage/v1`.

Приклад nginx:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8790;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_buffering off;            # важливо для SSE-стріму
    proxy_read_timeout 300s;
}
```
