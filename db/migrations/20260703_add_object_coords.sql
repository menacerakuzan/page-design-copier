-- Migration: add latitude/longitude to tourism_objects for the Route Basket map.
-- Coordinates power the "Створити маршрут" map page (MapLibre route between basket
-- items). Most map_url values are shortened maps.app.goo.gl links without inline
-- coords, so these columns are backfilled via scripts/backfill-coords.mjs and can be
-- edited manually in the admin object editor.
ALTER TABLE public.tourism_objects
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;
