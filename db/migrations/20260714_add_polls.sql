-- Migration: опитування (створюються в адмінці, показуються віджетом на
-- головній). Питання зберігаються масивом у JSONB `questions`:
--   [{ id, text, imageUrl?, videoUrl?, options: [{ id, text }], multiple? }]
-- Відповіді відвідувачів — у poll_responses.answers:
--   { [questionId]: optionId | optionId[] }
-- На відміну від page_configs.sections_json, тут звичайний JSONB без
-- подвійного кодування — репозиторій (pollsRepository.ts) працює з ним напряму.

CREATE TABLE IF NOT EXISTS public.polls (
  id text PRIMARY KEY,
  title text NOT NULL,
  title_en text,
  active boolean NOT NULL DEFAULT false,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_responses (
  id text PRIMARY KEY,
  poll_id text NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS poll_responses_poll_id_idx ON public.poll_responses(poll_id);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;

-- Відвідувачі бачать лише активні опитування; адмінка (authenticated) — все.
DROP POLICY IF EXISTS "public read active polls" ON public.polls;
CREATE POLICY "public read active polls" ON public.polls
  FOR SELECT TO public USING (active = true);

DROP POLICY IF EXISTS "authenticated all polls" ON public.polls;
CREATE POLICY "authenticated all polls" ON public.polls
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Відповіді: анонімні відвідувачі можуть лише додавати; читає лише адмінка.
DROP POLICY IF EXISTS "anon insert responses" ON public.poll_responses;
CREATE POLICY "anon insert responses" ON public.poll_responses
  FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated all responses" ON public.poll_responses;
CREATE POLICY "authenticated all responses" ON public.poll_responses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON public.polls FROM anon;
GRANT SELECT ON public.polls TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polls TO authenticator;

REVOKE ALL ON public.poll_responses FROM anon;
GRANT INSERT ON public.poll_responses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.poll_responses TO authenticator;

-- Підхопити нові таблиці без рестарту PostgREST
NOTIFY pgrst, 'reload schema';
