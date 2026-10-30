-- Migration: архів подій + глобальні налаштування сайту.
--
-- 1) tourism_objects.archive_after — останній день, коли подія актуальна.
--    Наступного дня (за київським часом) фронтенд прибирає її зі списків
--    і показує в архіві /podiyi?arkhiv. Порожньо = дата береться з репертуару
--    (див. src/lib/eventArchive.ts).
ALTER TABLE public.tourism_objects
  ADD COLUMN IF NOT EXISTS archive_after date;

-- 2) site_settings — прості перемикачі для всього сайту (ключ → JSONB).
--    Перший ключ: winter_theme = { mode: "off" | "preview" | "on", tokenHash }.
--    tokenHash — SHA-256 секретного токена з прихованого посилання; сам токен
--    у базі не зберігається, тож публічне читання таблиці його не розкриває.
CREATE TABLE IF NOT EXISTS public.site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read site settings" ON public.site_settings;
CREATE POLICY "public read site settings" ON public.site_settings
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "authenticated all site settings" ON public.site_settings;
CREATE POLICY "authenticated all site settings" ON public.site_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON public.site_settings FROM anon;
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticator;

INSERT INTO public.site_settings (key, value)
VALUES ('winter_theme', '{"mode": "off"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
