-- ─────────────────────────────────────────────────────────────────────────────
-- Server-side admin auth for the self-hosted PostgREST stack.
--
-- Before: anon (public key, baked in the bundle) had full INSERT/UPDATE/DELETE on
-- every table and the login was a client-side password compare — anyone could
-- write/delete all data straight through the API.
--
-- After:
--   * anon is READ-ONLY (public SELECT only).
--   * Writes require the `authenticated` role, reachable ONLY via a JWT minted by
--     public.login(email, password) after a bcrypt password check in the DB.
--   * The JWT is signed (HS256) with the PostgREST secret, exposed to SQL as the
--     `app.settings.jwt_secret` GUC (set via PGRST_APP_SETTINGS_JWT_SECRET) so the
--     secret is never hardcoded here.
--
-- Idempotent: safe to re-run. Password seeding is done separately (see
-- scripts/apply-secure-auth.sh) so no plaintext lives in this file.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- crypt(), gen_salt(), hmac() (lives in schema "extensions" here)

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $$;
GRANT authenticated TO authenticator;

CREATE SCHEMA IF NOT EXISTS basic_auth;
REVOKE ALL ON SCHEMA basic_auth FROM PUBLIC;

-- Credentials store (never exposed via the API — no grants to anon/authenticated).
CREATE TABLE IF NOT EXISTS basic_auth.users (
  email text PRIMARY KEY,
  pass  text NOT NULL,
  role  name NOT NULL DEFAULT 'authenticated'
);

-- ─── JWT signing (HS256), adapted from pgjwt (MIT) ───────────────────────────
CREATE OR REPLACE FUNCTION basic_auth.url_encode(data bytea) RETURNS text
  LANGUAGE sql IMMUTABLE AS $$
  SELECT translate(encode(data, 'base64'), E'+/=\n', '-_');
$$;

CREATE OR REPLACE FUNCTION basic_auth.algorithm_sign(signables text, secret text, algorithm text)
  RETURNS text LANGUAGE sql IMMUTABLE AS $$
  WITH alg AS (
    SELECT CASE algorithm
      WHEN 'HS256' THEN 'sha256'
      WHEN 'HS384' THEN 'sha384'
      WHEN 'HS512' THEN 'sha512'
      ELSE '' END AS id)
  SELECT basic_auth.url_encode(extensions.hmac(signables, secret, alg.id)) FROM alg;
$$;

CREATE OR REPLACE FUNCTION basic_auth.sign(payload json, secret text, algorithm text DEFAULT 'HS256')
  RETURNS text LANGUAGE sql IMMUTABLE AS $$
  WITH header AS (
    SELECT basic_auth.url_encode(convert_to('{"alg":"' || algorithm || '","typ":"JWT"}', 'utf8')) AS data),
  pl AS (
    SELECT basic_auth.url_encode(convert_to(payload::text, 'utf8')) AS data),
  signables AS (
    SELECT header.data || '.' || pl.data AS data FROM header, pl)
  SELECT signables.data || '.' || basic_auth.algorithm_sign(signables.data, secret, algorithm) FROM signables;
$$;

-- ─── login RPC: exposed at POST /rest/v1/rpc/login ───────────────────────────
CREATE OR REPLACE FUNCTION public.login(email text, password text)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  usr    basic_auth.users;
  secret text := current_setting('app.settings.jwt_secret', true);
BEGIN
  IF secret IS NULL OR length(secret) < 32 THEN
    RAISE EXCEPTION 'auth misconfigured' USING errcode = 'PT500';
  END IF;

  SELECT * INTO usr FROM basic_auth.users AS u WHERE u.email = login.email;

  IF usr.email IS NULL OR usr.pass <> extensions.crypt(login.password, usr.pass) THEN
    RAISE EXCEPTION 'Невірний email або пароль' USING errcode = 'PT401';
  END IF;

  RETURN basic_auth.sign(
    json_build_object(
      'role',  usr.role,
      'email', usr.email,
      'iss',   'postgrest',
      'exp',   (extract(epoch FROM now()) + 60 * 60 * 8)::integer   -- 8 hours
    ),
    secret
  );
END;
$$;

REVOKE ALL ON FUNCTION public.login(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.login(text, text) TO anon;

-- ─── Lock down table access: anon read-only, writes → authenticated ──────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cities','districts','content_cards','routes','tourism_objects','regions','page_configs','admin_change_logs']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    -- drop the old permissive "editor full …" policy (writable by anyone)
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'editor full ' ||
      CASE t
        WHEN 'admin_change_logs' THEN 'audit logs'
        WHEN 'content_cards' THEN 'cards'
        WHEN 'tourism_objects' THEN 'objects'
        WHEN 'page_configs' THEN 'page configs'
        ELSE t END, t);
    -- writes (and full read of unpublished rows) for authenticated only
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'authenticated write ' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      'authenticated write ' || t, t);
    -- table-level: anon may only read
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    -- table-level: authenticated needs the underlying grants; RLS above only filters rows
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

-- Public read policies for the site (routes had RLS off before → add one).
DROP POLICY IF EXISTS "public read routes" ON public.routes;
CREATE POLICY "public read routes" ON public.routes FOR SELECT TO public USING (true);
-- (cities/districts/regions/page_configs already have "public read …" SELECT
--  policies; content_cards/tourism_objects keep their published=true read policy;
--  admin_change_logs intentionally has NO public read.)

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
