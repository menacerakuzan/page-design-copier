#!/usr/bin/env bash
# One-time: pull the media files that still live only on the old Supabase Cloud
# host into the LOCAL storage-server, so the DB can drop the supabase host and
# everything is served locally. Idempotent — skips files already present.
set -uo pipefail

UP="/home/etrig/Desktop/tourism_site/tourism_new/tourism/storage-server/uploads/media"
URLS="/tmp/all_urls.txt"
ok=0; skip=0; fail=0

while IFS= read -r url; do
  case "$url" in
    *supabase.co*) ;;            # only the supabase-hosted ones
    *) continue ;;
  esac
  rel="${url#*/storage/v1/object/public/media/}"
  dest="$UP/$rel"
  if [ -f "$dest" ] && [ "$(stat -c%s "$dest" 2>/dev/null || echo 0)" -gt 100 ]; then
    skip=$((skip+1)); continue
  fi
  mkdir -p "$(dirname "$dest")"
  code=$(curl -sk -L --max-time 120 -o "$dest" -w "%{http_code}" "$url")
  sz=$(stat -c%s "$dest" 2>/dev/null || echo 0)
  if [ "$code" = "200" ] && [ "$sz" -gt 100 ]; then
    echo "OK   $code ${sz}b  $rel"; ok=$((ok+1))
  else
    echo "FAIL $code ${sz}b  $rel"; rm -f "$dest"; fail=$((fail+1))
  fi
done < "$URLS"

echo "=== DONE ok=$ok skip=$skip fail=$fail ==="
