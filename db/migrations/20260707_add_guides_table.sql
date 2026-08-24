-- Migration: add `guides` table (реєстр гідів Одеси, редагується в адмінці).
-- Дані спершу імпортовані одноразовим скрейпом (scripts/scrape-guides.mjs) з
-- guides.odesatourism.site у src/data/guides.json, звідти — в цю таблицю
-- (scripts/import-guides.mjs). Далі гіди редагуються тільки через адмінку.

CREATE TABLE IF NOT EXISTS public.guides (
  id text PRIMARY KEY,
  surname text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  cert text,
  languages text[] NOT NULL DEFAULT '{}',
  personal_url text,
  photo_url text,
  dstu boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read published guides" ON public.guides;
CREATE POLICY "public read published guides" ON public.guides
  FOR SELECT TO public USING (published = true);

DROP POLICY IF EXISTS "authenticated write guides" ON public.guides;
CREATE POLICY "authenticated write guides" ON public.guides
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- anon: лише читання опублікованих (як і решта таблиць після secure-auth.sql)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.guides FROM anon;
GRANT SELECT ON public.guides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guides TO authenticated;
-- authenticator: пряме підключення скриптів (import-guides.mjs і подібні) йде
-- саме цією роллю, а не через JWT/SET ROLE authenticated — тож потрібен
-- окремий грант, як і на решті таблиць (tourism_objects тощо).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guides TO authenticator;
