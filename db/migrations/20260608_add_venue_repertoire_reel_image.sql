-- Migration: add venue_id, repertoire, reel_image_url, hero_font_size to tourism_objects
ALTER TABLE public.tourism_objects
  ADD COLUMN IF NOT EXISTS venue_id text,
  ADD COLUMN IF NOT EXISTS repertoire text,
  ADD COLUMN IF NOT EXISTS reel_image_url text,
  ADD COLUMN IF NOT EXISTS hero_font_size text;
