#!/usr/bin/env bash
# Apply the server-side auth migration (scripts/secure-auth.sql) and seed the
# admin user from .env.local (VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD) as a bcrypt
# hash. The plaintext password never leaves this machine and is not stored.
#
# After running this, restart PostgREST so PGRST_APP_SETTINGS_JWT_SECRET is loaded
# (scripts/start-local-backend.sh does that).
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$DIR/.env.local"
export PGHOST="${PGHOST:-localhost}" PGPORT="${PGPORT:-5432}" PGUSER="${PGUSER:-veteran_bot}" PGDATABASE="${PGDATABASE:-tourism}"
export PGPASSWORD="${PGPASSWORD:-veteran_bot_pass}"

EMAIL=$(grep -E '^VITE_ADMIN_EMAIL=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
# Server-side password: prefer the non-VITE ADMIN_PASSWORD; fall back to the old
# VITE_ADMIN_PASSWORD name if a legacy .env.local still uses it.
PW=$(grep -E '^ADMIN_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
[ -z "$PW" ] && PW=$(grep -E '^VITE_ADMIN_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
EMAIL="${EMAIL:-admin@tourism.od.gov.ua}"
if [ -z "$PW" ]; then
  echo "ADMIN_PASSWORD пуст в $ENV_FILE — задай пароль перед сидированием." >&2
  exit 1
fi

echo "Применяю scripts/secure-auth.sql ..."
psql -v ON_ERROR_STOP=1 -f "$DIR/scripts/secure-auth.sql"

echo "Сидирую админа ($EMAIL) ..."
psql -v ON_ERROR_STOP=1 -v email="$EMAIL" -v pw="$PW" <<'SQL'
INSERT INTO basic_auth.users (email, pass, role)
VALUES (:'email', extensions.crypt(:'pw', extensions.gen_salt('bf')), 'authenticated')
ON CONFLICT (email) DO UPDATE SET pass = EXCLUDED.pass, role = EXCLUDED.role;
SQL

echo "Готово. Перезапусти PostgREST: ./scripts/start-local-backend.sh (после kill старого)."
