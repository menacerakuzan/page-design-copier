#!/usr/bin/env bash
# Запуск локального бэкенда для tourism (PostgREST поверх БД "tourism").
#
# БД "tourism" уже восстановлена из дампа в локальный PostgreSQL на 127.0.0.1:5432
# (отдельная база, рядом с другими проектами их не трогает). Этот скрипт поднимает
# только PostgREST на :3100. Фронтенд ходит к нему через прокси Vite (/rest/v1).
#
# Использование:
#   ./scripts/start-local-backend.sh      # запустить PostgREST (если ещё не запущен)
# Затем в другом терминале:
#   npm run dev
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGREST="$DIR/.local-bin/postgrest"
LOG="/tmp/postgrest.log"
STORAGE_DIR="$DIR/../storage-server"
STORAGE_LOG="/tmp/storage-server.log"

# ─── Storage server (media + on-the-fly resize) on :5100 ─────────────────────
# Serves /storage/v1/object/public/... and /storage/v1/render/image/... locally.
if [ -d "$STORAGE_DIR" ]; then
  if curl -s -m 3 -o /dev/null "http://127.0.0.1:5100/storage/v1/bucket/media"; then
    echo "Storage server уже запущен на :5100"
  else
    if [ ! -d "$STORAGE_DIR/node_modules/sharp" ]; then
      echo "Устанавливаю зависимости storage-server..."
      (cd "$STORAGE_DIR" && npm install --silent)
    fi
    echo "Запускаю storage server на :5100 (лог: $STORAGE_LOG)..."
    (cd "$STORAGE_DIR" && nohup node server.js > "$STORAGE_LOG" 2>&1 &)
    sleep 1
    curl -s -m 5 -o /dev/null "http://127.0.0.1:5100/storage/v1/bucket/media" \
      && echo "OK — storage server отвечает" \
      || { echo "Не удалось поднять storage server, смотри $STORAGE_LOG"; tail -20 "$STORAGE_LOG"; }
  fi
else
  echo "⚠ storage-server не найден ($STORAGE_DIR) — медиа/ресайз работать не будут"
fi

if [ ! -x "$PGREST" ]; then
  echo "Распаковываю PostgREST..."
  mkdir -p "$DIR/.local-bin"
  tar -xJf "$DIR/postgrest-v12.2.3-linux-static-x64.tar.xz" -C "$DIR/.local-bin"
fi

if curl -s -m 3 -o /dev/null "http://127.0.0.1:3100/cities?limit=1"; then
  echo "PostgREST уже запущен на :3100"
  exit 0
fi

echo "Запускаю PostgREST на :3100 (лог: $LOG)..."
PGRST_DB_URI="postgres://authenticator:changeme123@127.0.0.1:5432/tourism" \
PGRST_DB_SCHEMAS="public" \
PGRST_DB_ANON_ROLE="anon" \
PGRST_JWT_SECRET="super-secret-jwt-token-min-32-chars-long" \
PGRST_SERVER_PORT="3100" \
PGRST_SERVER_HOST="127.0.0.1" \
nohup "$PGREST" > "$LOG" 2>&1 &

sleep 1
if curl -s -m 5 -o /dev/null "http://127.0.0.1:3100/cities?limit=1"; then
  echo "OK — PostgREST отвечает. Теперь: npm run dev"
else
  echo "Не удалось поднять PostgREST, смотри $LOG"
  tail -20 "$LOG"
  exit 1
fi
