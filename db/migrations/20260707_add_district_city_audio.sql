-- Migration: audio narration for district/city pages (same idea as
-- 20260706_add_object_audio.sql for tourism_objects).
ALTER TABLE public.districts
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS audio_url_en text;

ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS audio_url_en text;
