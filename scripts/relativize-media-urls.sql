-- Make all self-hosted storage URLs relative so the app is host-agnostic:
--   https://tourism.od.gov.ua/storage/v1/...        -> /storage/v1/...
--   https://<old-supabase>.supabase.co/storage/v1/... -> /storage/v1/...
--
-- After this the browser requests media same-origin; locally Vite proxies
-- /storage/v1 -> the storage-server (:5100), in prod the gateway serves it.
-- Both hosts only ever prefix storage paths (verified), so a plain host-prefix
-- strip is safe. External image hosts (unsplash, wikimedia, …) are left alone.
-- Audit rows in admin_change_logs are history and intentionally NOT rewritten.
-- Idempotent: re-running is a no-op once URLs are already relative.

BEGIN;

\set od  '''https://tourism.od.gov.ua'''
\set sb  '''https://yvqksgfqfxhegtpezukt.supabase.co'''

-- text columns
UPDATE cities SET
  image_url = replace(replace(image_url, :od, ''), :sb, ''),
  reel_url  = replace(replace(reel_url,  :od, ''), :sb, ''),
  video_url = replace(replace(video_url, :od, ''), :sb, '');

UPDATE districts SET
  image_url = replace(replace(image_url, :od, ''), :sb, ''),
  reel_url  = replace(replace(reel_url,  :od, ''), :sb, ''),
  video_url = replace(replace(video_url, :od, ''), :sb, '');

UPDATE content_cards SET
  image_url = replace(replace(image_url, :od, ''), :sb, '');

UPDATE routes SET
  image_url = replace(replace(image_url, :od, ''), :sb, ''),
  video_url = replace(replace(video_url, :od, ''), :sb, '');

UPDATE tourism_objects SET
  image_url      = replace(replace(image_url,      :od, ''), :sb, ''),
  reel_image_url = replace(replace(reel_image_url, :od, ''), :sb, ''),
  reel_url       = replace(replace(reel_url,       :od, ''), :sb, ''),
  video_url      = replace(replace(video_url,      :od, ''), :sb, '');

-- jsonb payloads (content_cards.payload embeds image URLs)
UPDATE content_cards SET
  payload = replace(replace(payload::text, :od, ''), :sb, '')::jsonb
WHERE payload::text ~ '(tourism\.od\.gov\.ua|supabase\.co)/storage/v1';

COMMIT;
