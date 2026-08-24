-- Migration: add audio_url/audio_url_en to tourism_objects for AI narration
-- (ElevenLabs TTS over description + detailed_info). Backfilled via
-- scripts/backfill-audio.mjs; playable from the object detail page.
ALTER TABLE public.tourism_objects
  ADD COLUMN IF NOT EXISTS audio_url text,
  ADD COLUMN IF NOT EXISTS audio_url_en text;
