--
-- PostgreSQL database dump
--

\restrict uZD8JaIamdw6DsTA1YYHFWc7EHcbJ5do9yxQybDXYrqCP0th1J4A3q563t14gfu

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10 (Debian 17.10-0+deb13u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
begin
    if not exists (
        select 1
        from pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


--
-- Name: send(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(c.column_name order by c.ordinal_position),
            '{}'::text[]
        )
        from
            information_schema.columns c
        where
            format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                format('%I.%I', c.table_schema, c.table_name)::regclass,
                c.column_name,
                'SELECT'
            );
    table_col_names text[] = coalesce(
            array_agg(pa.attname),
            '{}'::text[]
        )
        from
            pg_attribute pa
        where
            pa.attrelid = new.entity
            and pa.attnum > 0;
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        -- Filtered column is valid
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        -- Type is sanitized and safe for string interpolation
        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;
        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        else
            -- raises an exception if value is not coercable to type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    -- Validate that selected_columns reference columns the role can SELECT
    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint on
    -- (subscription_id, entity, filters) can't be tricked by a different filter order
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value),
        '{}'
    ) from unnest(new.filters) f;

    -- Normalize selected_columns order so ARRAY['a','b'] and ARRAY['b','a'] are
    -- treated as the same subscription group in apply_rls
    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: admin_change_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_change_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    action text NOT NULL,
    before_data jsonb,
    after_data jsonb,
    actor_email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_change_logs_action_check CHECK ((action = ANY (ARRAY['create'::text, 'update'::text, 'delete'::text, 'rollback'::text]))),
    CONSTRAINT admin_change_logs_entity_type_check CHECK ((entity_type = ANY (ARRAY['tourism_object'::text, 'content_card'::text, 'region'::text, 'district'::text, 'city'::text])))
);


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id text NOT NULL,
    district_id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    description text,
    detailed_info text,
    image_url text,
    video_url text,
    subtitle text,
    reel_url text,
    weather_city_name text
);


--
-- Name: content_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_cards (
    id text NOT NULL,
    page_key text NOT NULL,
    section_key text NOT NULL,
    card_type text NOT NULL,
    title text NOT NULL,
    subtitle text,
    image_url text,
    href text,
    city_id text,
    district_id text,
    region_id text,
    sort_order integer DEFAULT 0 NOT NULL,
    published boolean DEFAULT true NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: districts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.districts (
    id text NOT NULL,
    region_id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    subtitle text,
    description text,
    detailed_info text,
    image_url text,
    video_url text,
    reel_url text
);


--
-- Name: page_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_configs (
    id text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    sections_json jsonb DEFAULT '[]'::jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT page_configs_entity_type_check CHECK ((entity_type = ANY (ARRAY['district'::text, 'city'::text, 'attraction'::text, 'event'::text, 'restaurant'::text, 'hotel'::text])))
);


--
-- Name: regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regions (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tourism_objects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tourism_objects (
    id text NOT NULL,
    district_id text NOT NULL,
    city_id text NOT NULL,
    type text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    subtitle text,
    description text,
    detailed_info text,
    image_url text,
    video_url text,
    map_url text,
    address text,
    phone text,
    website text,
    event_dates text,
    hours text,
    amenities text,
    tourism_types text[],
    reel_url text,
    CONSTRAINT tourism_objects_type_check CHECK ((type = ANY (ARRAY['event'::text, 'hotel'::text, 'restaurant'::text, 'attraction'::text])))
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
680a5fb9-0174-483e-ad71-c22da88d5b60	680a5fb9-0174-483e-ad71-c22da88d5b60	{"sub": "680a5fb9-0174-483e-ad71-c22da88d5b60", "email": "vinilxd9@gmail.com", "email_verified": true, "phone_verified": false}	email	2026-04-28 15:35:20.530983+00	2026-04-28 15:35:20.531068+00	2026-04-28 15:35:20.531068+00	96eba478-4e0d-48b3-bf0b-b27591d814c5
e1c89195-f7a1-40b4-a9e2-94503008071c	e1c89195-f7a1-40b4-a9e2-94503008071c	{"sub": "e1c89195-f7a1-40b4-a9e2-94503008071c", "email": "tourism@od.gov.ua", "email_verified": false, "phone_verified": false}	email	2026-06-02 13:47:16.4283+00	2026-06-02 13:47:16.428359+00	2026-06-02 13:47:16.428359+00	f7d3a96a-1bbd-43ec-88f4-44d3aa1f4bec
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8	2026-04-28 15:37:50.086665+00	2026-04-28 15:37:50.086665+00	otp	4855995c-6763-4687-9280-f01c79edcb0c
7425e2a4-d4ee-464b-ac0f-79fa84e651ef	2026-04-28 17:38:19.704573+00	2026-04-28 17:38:19.704573+00	otp	fab593c5-c838-4ee1-9e29-c1778f0c0d43
57824fab-50a7-4f3e-b60e-2af0993d1b1f	2026-06-02 13:49:03.867519+00	2026-06-02 13:49:03.867519+00	password	323b21d4-e3cb-4092-9789-cb2d08df310c
15960671-792b-4ef2-8784-299ef927def8	2026-06-02 13:51:38.076604+00	2026-06-02 13:51:38.076604+00	password	a8dabfe3-0612-4c6c-aa74-611fd4f72170
ee6bc4c8-92e6-4ef8-a38e-623a5d001d13	2026-06-02 14:15:45.579412+00	2026-06-02 14:15:45.579412+00	password	85c67bec-f5c1-4be9-aae7-0c924bf35c1b
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	1	qqhql63utdaq	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-28 15:37:50.074953+00	2026-04-28 16:35:53.643462+00	\N	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	3	7mt3vmlnxjed	680a5fb9-0174-483e-ad71-c22da88d5b60	f	2026-04-28 17:38:19.698904+00	2026-04-28 17:38:19.698904+00	\N	7425e2a4-d4ee-464b-ac0f-79fa84e651ef
00000000-0000-0000-0000-000000000000	2	5legjavfpir3	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-28 16:35:53.656842+00	2026-04-28 18:53:56.509051+00	qqhql63utdaq	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	4	nakobfj4nwxk	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-28 18:53:56.519357+00	2026-04-29 08:43:21.985366+00	5legjavfpir3	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	5	b3m6anrbsxdx	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-29 08:43:22.002032+00	2026-04-29 09:41:49.195566+00	nakobfj4nwxk	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	6	hiocwanobinr	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-29 09:41:49.211984+00	2026-04-29 11:08:08.742174+00	b3m6anrbsxdx	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	7	cr4jj7qqtej4	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-29 11:08:08.754303+00	2026-04-30 06:39:33.465154+00	hiocwanobinr	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	8	feejbdrr5hyi	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-30 06:39:33.483188+00	2026-04-30 07:37:39.369985+00	cr4jj7qqtej4	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	9	le5ycn2iox5p	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-30 07:37:39.379013+00	2026-04-30 08:42:21.730304+00	feejbdrr5hyi	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	10	rnec42rwoctn	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-30 08:42:21.745826+00	2026-04-30 09:54:17.642172+00	le5ycn2iox5p	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	12	cvywjodvo2sl	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-30 09:54:17.644033+00	2026-04-30 11:13:50.917789+00	rnec42rwoctn	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	13	wbdhvl5foq4i	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-30 11:13:50.932159+00	2026-04-30 12:18:44.571621+00	cvywjodvo2sl	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	14	oleeksbpe4yj	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-30 12:18:44.584191+00	2026-04-30 13:57:31.267013+00	wbdhvl5foq4i	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	15	uuteof7vtmpv	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-04-30 13:57:31.281589+00	2026-05-05 07:15:52.351859+00	oleeksbpe4yj	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	16	bdr6wt63kzo2	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-05 07:15:52.368914+00	2026-05-06 13:33:30.373282+00	uuteof7vtmpv	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	17	wcuewjscy6uh	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-06 13:33:30.385693+00	2026-05-07 08:53:13.822548+00	bdr6wt63kzo2	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	18	an3geywyz3ed	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-07 08:53:13.838412+00	2026-05-10 09:09:03.321767+00	wcuewjscy6uh	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	19	c5rdtxwe5wil	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-10 09:09:03.340612+00	2026-05-11 07:56:14.379315+00	an3geywyz3ed	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	20	xoy5biu5alna	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-11 07:56:14.395533+00	2026-05-11 09:42:24.212118+00	c5rdtxwe5wil	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	21	yivtvngo6746	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-11 09:42:24.224219+00	2026-05-11 11:08:23.570807+00	xoy5biu5alna	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	22	cslgwim3ekja	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-11 11:08:23.581316+00	2026-05-11 12:51:46.191207+00	yivtvngo6746	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	23	m6wemdq672gy	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-11 12:51:46.201058+00	2026-05-11 14:38:49.920505+00	cslgwim3ekja	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	24	y4gw6fshj7tx	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-11 14:38:49.939714+00	2026-05-12 07:32:36.948366+00	m6wemdq672gy	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	25	zuybqwc3f745	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-12 07:32:36.971323+00	2026-05-12 08:43:45.470703+00	y4gw6fshj7tx	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	26	pybotnhzvryn	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-12 08:43:45.489911+00	2026-05-12 09:48:44.674678+00	zuybqwc3f745	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	27	msygbcpncg5c	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-12 09:48:44.692797+00	2026-05-12 12:22:25.684262+00	pybotnhzvryn	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	28	i5dwkasqedry	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-12 12:22:25.693864+00	2026-05-15 07:52:34.658305+00	msygbcpncg5c	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	29	5ivkxvqutxcl	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-15 07:52:34.683822+00	2026-05-15 08:51:26.106733+00	i5dwkasqedry	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	30	h22mjesvpeh5	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-15 08:51:26.132728+00	2026-05-15 09:57:38.41243+00	5ivkxvqutxcl	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	31	ajjke26hr7jq	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-15 09:57:38.431976+00	2026-05-15 11:17:56.666793+00	h22mjesvpeh5	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	32	yxskwdawruql	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-15 11:17:56.688209+00	2026-05-15 20:11:39.171403+00	ajjke26hr7jq	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	33	ogvankgrlh2m	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-15 20:11:39.190216+00	2026-05-26 07:43:56.315215+00	yxskwdawruql	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	34	g5yx7xhzat2j	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-26 07:43:56.337434+00	2026-05-29 21:11:45.263507+00	ogvankgrlh2m	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	35	hfpzwsab7t3h	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-05-29 21:11:45.290544+00	2026-06-02 07:14:21.33872+00	g5yx7xhzat2j	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	36	2k4sqjodjhos	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-06-02 07:14:21.361299+00	2026-06-02 08:29:28.440387+00	hfpzwsab7t3h	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	37	pb77kx33nzj5	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-06-02 08:29:28.456729+00	2026-06-02 10:07:17.340464+00	2k4sqjodjhos	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	38	2zmpvpc2iv7v	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-06-02 10:07:17.354771+00	2026-06-02 11:50:01.406818+00	pb77kx33nzj5	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	39	tovuxem4tj6s	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-06-02 11:50:01.421623+00	2026-06-02 12:56:32.255268+00	2zmpvpc2iv7v	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	41	di7mumogyc3t	e1c89195-f7a1-40b4-a9e2-94503008071c	f	2026-06-02 13:49:03.847161+00	2026-06-02 13:49:03.847161+00	\N	57824fab-50a7-4f3e-b60e-2af0993d1b1f
00000000-0000-0000-0000-000000000000	42	3pa7mzukenjr	e1c89195-f7a1-40b4-a9e2-94503008071c	f	2026-06-02 13:51:38.070934+00	2026-06-02 13:51:38.070934+00	\N	15960671-792b-4ef2-8784-299ef927def8
00000000-0000-0000-0000-000000000000	40	qzsjz2vpyx3n	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-06-02 12:56:32.270692+00	2026-06-02 13:55:33.400657+00	tovuxem4tj6s	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	43	scseysxdws7s	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-06-02 13:55:33.406742+00	2026-06-02 14:56:57.692373+00	qzsjz2vpyx3n	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	45	kzdje5oqnthx	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-06-02 14:56:57.710571+00	2026-06-02 17:59:27.837767+00	scseysxdws7s	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	44	7vz5vx7alo4u	e1c89195-f7a1-40b4-a9e2-94503008071c	t	2026-06-02 14:15:45.547295+00	2026-06-03 06:18:38.739346+00	\N	ee6bc4c8-92e6-4ef8-a38e-623a5d001d13
00000000-0000-0000-0000-000000000000	46	dy57sakfom64	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-06-02 17:59:27.84915+00	2026-06-03 06:23:40.183156+00	kzdje5oqnthx	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	47	wabu45rtb4ne	e1c89195-f7a1-40b4-a9e2-94503008071c	t	2026-06-03 06:18:38.753511+00	2026-06-03 07:17:16.168577+00	7vz5vx7alo4u	ee6bc4c8-92e6-4ef8-a38e-623a5d001d13
00000000-0000-0000-0000-000000000000	48	f33wqh6tzvyx	680a5fb9-0174-483e-ad71-c22da88d5b60	t	2026-06-03 06:23:40.189498+00	2026-06-03 07:22:34.84041+00	dy57sakfom64	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	50	5xonuqvmlnrc	680a5fb9-0174-483e-ad71-c22da88d5b60	f	2026-06-03 07:22:34.867288+00	2026-06-03 07:22:34.867288+00	f33wqh6tzvyx	180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8
00000000-0000-0000-0000-000000000000	49	cm3dp4jrvza6	e1c89195-f7a1-40b4-a9e2-94503008071c	t	2026-06-03 07:17:16.184697+00	2026-06-03 08:15:30.302838+00	wabu45rtb4ne	ee6bc4c8-92e6-4ef8-a38e-623a5d001d13
00000000-0000-0000-0000-000000000000	51	cavw46s664gv	e1c89195-f7a1-40b4-a9e2-94503008071c	f	2026-06-03 08:15:30.313021+00	2026-06-03 08:15:30.313021+00	cm3dp4jrvza6	ee6bc4c8-92e6-4ef8-a38e-623a5d001d13
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
7425e2a4-d4ee-464b-ac0f-79fa84e651ef	680a5fb9-0174-483e-ad71-c22da88d5b60	2026-04-28 17:38:19.690683+00	2026-04-28 17:38:19.690683+00	\N	aal1	\N	\N	Mozilla/5.0 (iPhone; CPU iPhone OS 26_2_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/147.0.7727.99 Mobile/15E148 Safari/604.1	46.211.52.90	\N	\N	\N	\N	\N
57824fab-50a7-4f3e-b60e-2af0993d1b1f	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-02 13:49:03.81914+00	2026-06-02 13:49:03.81914+00	\N	aal1	\N	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	193.200.212.129	\N	\N	\N	\N	\N
15960671-792b-4ef2-8784-299ef927def8	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-02 13:51:38.05577+00	2026-06-02 13:51:38.05577+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	193.200.212.129	\N	\N	\N	\N	\N
180dc3d9-3ad9-45fa-ba29-9f0cefb47ac8	680a5fb9-0174-483e-ad71-c22da88d5b60	2026-04-28 15:37:50.067465+00	2026-06-03 07:22:34.887651+00	\N	aal1	\N	2026-06-03 07:22:34.887532	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15	193.200.212.129	\N	\N	\N	\N	\N
ee6bc4c8-92e6-4ef8-a38e-623a5d001d13	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-02 14:15:45.498324+00	2026-06-03 08:15:30.331972+00	\N	aal1	\N	2026-06-03 08:15:30.331859	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	193.200.212.129	\N	\N	\N	\N	\N
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	e1c89195-f7a1-40b4-a9e2-94503008071c	authenticated	authenticated	tourism@od.gov.ua	$2a$10$Vvo72TBjfqziAi/xSDMT1ur5omnwHDJFGJefCFIV6dbScsvIFPFwq	2026-06-02 13:47:16.434755+00	\N		\N		\N			\N	2026-06-02 14:15:45.492859+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-06-02 13:47:16.406885+00	2026-06-03 08:15:30.320493+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	680a5fb9-0174-483e-ad71-c22da88d5b60	authenticated	authenticated	vinilxd9@gmail.com	$2a$10$9VgWb/lKmq1mSsKAsU8CL.fRWdvfad4BOIlJcHREQ4hk20ya/K5sy	2026-04-28 15:37:50.060744+00	\N		2026-04-28 15:37:18.595059+00		2026-04-28 17:38:02.769637+00			\N	2026-04-28 17:38:19.690075+00	{"provider": "email", "providers": ["email"]}	{"sub": "680a5fb9-0174-483e-ad71-c22da88d5b60", "email": "vinilxd9@gmail.com", "email_verified": true, "phone_verified": false}	\N	2026-04-28 15:35:20.507759+00	2026-06-03 07:22:34.874298+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: admin_change_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_change_logs (id, entity_type, entity_id, action, before_data, after_data, actor_email, created_at) FROM stdin;
0124d71b-2fa9-4032-a3c5-3700f0cc9e45	tourism_object	obj-event-1777390785730	create	\N	{"id": "obj-event-1777390785730", "name": "123123123", "slug": "123123123", "type": "event", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-04-28 15:39:46.698741+00
01e61576-9a3e-4529-bb57-9dc152797191	content_card	card-event-1777390785730	create	\N	{"id": "card-event-1777390785730", "href": "/podiyi/123123123", "title": "123123123", "city_id": "city-bilhorod", "payload": {"badgeDay": "1", "badgeTop": "до", "badgeMonth": "травень"}, "page_key": "index", "subtitle": "123123123", "card_type": "event", "image_url": "https://images.pexels.com/photos/36685404/pexels-photo-36685404.jpeg?_gl=1*1mhsthc*_ga*MTA4Nzc5MjE1LjE3NzcyODIzMzE.*_ga_8JE65Q40S6*czE3NzczOTA3NTckbzIkZzEkdDE3NzczOTA3NjIkajU1JGwwJGgw", "published": true, "region_id": "region-odesa", "sort_order": 2, "district_id": "district-bilhorod", "section_key": "events"}	vinilxd9@gmail.com	2026-04-28 15:39:47.247257+00
594f21f4-808b-4bcd-9e70-34b2d2e4d1bc	district	district-1777392109635	create	\N	{"id": "district-1777392109635", "name": "Новий район", "slug": "district-1777392109635", "region_id": "region-odesa"}	vinilxd9@gmail.com	2026-04-28 16:01:51.120585+00
ec8971eb-bad2-42f6-9289-d9d470aa52f4	content_card	card-1777392182236	create	\N	{"id": "card-1777392182236", "href": null, "title": "Нова картка", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "attraction", "image_url": null, "published": false, "region_id": "region-odesa", "sort_order": 6, "district_id": null, "section_key": "new-section"}	vinilxd9@gmail.com	2026-04-28 16:03:02.926812+00
9e74e102-a74e-48d7-9b42-61c1a0c43f3e	content_card	card-1777392182236	delete	{"id": "card-1777392182236", "href": null, "title": "Нова картка", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "attraction", "image_url": null, "published": false, "region_id": "region-odesa", "created_at": "2026-04-28T16:03:02.62412+00:00", "sort_order": 6, "district_id": null, "section_key": "new-section"}	\N	vinilxd9@gmail.com	2026-04-28 16:03:35.467664+00
db5c21ff-0c2c-492c-9082-eeb374ddaa8a	tourism_object	obj-event-1777390785730	delete	{"id": "obj-event-1777390785730", "name": "123123123", "slug": "123123123", "type": "event", "city_id": "city-bilhorod", "published": true, "created_at": "2026-04-28T15:39:46.233437+00:00", "district_id": "district-bilhorod"}	\N	vinilxd9@gmail.com	2026-04-28 16:13:28.275566+00
9ac1802e-34a4-430b-907c-f2f103546421	tourism_object	obj-hotel-1777393683394	create	\N	{"id": "obj-hotel-1777393683394", "name": "123123123123", "slug": "123123123123", "type": "hotel", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-04-28 16:28:04.750739+00
cac6d4c1-8f3b-495f-ba7e-00134170a6ad	content_card	card-hotel-1777393683394	create	\N	{"id": "card-hotel-1777393683394", "href": "/hoteli/123123123123", "title": "123123123123", "city_id": "city-bilhorod", "payload": {"rating": "4.8"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "213123312123", "card_type": "hotel", "image_url": null, "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hotels"}	vinilxd9@gmail.com	2026-04-28 16:28:05.351666+00
27eeae23-975f-4fd0-80f2-c1f2e1d49f84	content_card	card-detail-hero-1777393683394	create	\N	{"id": "card-detail-hero-1777393683394", "href": null, "title": "123123123123", "city_id": "city-bilhorod", "payload": {}, "page_key": "detail-hotel-123123123123", "subtitle": "213123312123", "card_type": "hotel", "image_url": null, "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hero"}	vinilxd9@gmail.com	2026-04-28 16:28:05.825879+00
ae2aad62-4839-432e-bd94-7185a3f4f985	content_card	card-detail-overview-1777393683394	create	\N	{"id": "card-detail-overview-1777393683394", "href": null, "title": "Опис", "city_id": "city-bilhorod", "payload": {"text": "123213213"}, "page_key": "detail-hotel-123123123123", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "overview"}	vinilxd9@gmail.com	2026-04-28 16:28:06.366521+00
a5d9e371-6efe-4aa2-87a8-7adf45a2cc54	content_card	card-detail-info-1777393683394	create	\N	{"id": "card-detail-info-1777393683394", "href": null, "title": "Зручності та сервіси", "city_id": "city-bilhorod", "payload": {"mapUrl": null, "rating": "3", "gallery": [], "payments": ["123213231231", "312213", "231213"], "amenities": ["ывавыа", "авывыфвыф", "ыфвыфвывф"], "workSlots": [{"to": "20:00", "days": "ПН-НД", "from": "10:00"}, {"to": "", "days": "", "from": ""}], "eventDates": [{"to": "", "from": "", "label": "Основні дати"}]}, "page_key": "detail-hotel-123123123123", "subtitle": "Додайте параметри", "card_type": "info", "image_url": null, "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "info"}	vinilxd9@gmail.com	2026-04-28 16:28:06.8222+00
bee64002-e00b-4ab2-bfb3-8cd24c023cf1	content_card	card-detail-contacts-1777393683394	create	\N	{"id": "card-detail-contacts-1777393683394", "href": "/hoteli/123123123123", "title": "Контакти", "city_id": "city-bilhorod", "payload": {"phone": "123123213", "address": "12321323"}, "page_key": "detail-hotel-123123123123", "subtitle": "12321323", "card_type": "info", "image_url": null, "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "contacts"}	vinilxd9@gmail.com	2026-04-28 16:28:07.349237+00
3d55bdda-5411-4796-949a-7ff71953a045	content_card	card-hotel-1777393683394	delete	{"id": "card-hotel-1777393683394", "href": "/hoteli/123123123123", "title": "123123123123", "city_id": "city-bilhorod", "payload": {"rating": "4.8"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "213123312123", "card_type": "hotel", "image_url": null, "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T16:28:04.990771+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hotels"}	\N	vinilxd9@gmail.com	2026-04-28 16:31:22.004706+00
80768195-f1c5-43aa-9c68-d22a3ce63b9c	content_card	card-detail-hero-1777393683394	delete	{"id": "card-detail-hero-1777393683394", "href": null, "title": "123123123123", "city_id": "city-bilhorod", "payload": {}, "page_key": "detail-hotel-123123123123", "subtitle": "213123312123", "card_type": "hotel", "image_url": null, "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T16:28:05.508028+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hero"}	\N	vinilxd9@gmail.com	2026-04-28 16:31:27.13717+00
6c03c9e0-ccb4-4d42-be06-1e3016f7ec50	content_card	card-event-1777390785730	delete	{"id": "card-event-1777390785730", "href": "/podiyi/123123123", "title": "123123123", "city_id": "city-bilhorod", "payload": {"badgeDay": "1", "badgeTop": "до", "badgeMonth": "травень"}, "page_key": "index", "subtitle": "123123123", "card_type": "event", "image_url": "https://images.pexels.com/photos/36685404/pexels-photo-36685404.jpeg?_gl=1*1mhsthc*_ga*MTA4Nzc5MjE1LjE3NzcyODIzMzE.*_ga_8JE65Q40S6*czE3NzczOTA3NTckbzIkZzEkdDE3NzczOTA3NjIkajU1JGwwJGgw", "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T15:39:46.908268+00:00", "sort_order": 2, "district_id": "district-bilhorod", "section_key": "events"}	\N	vinilxd9@gmail.com	2026-04-28 16:31:33.040277+00
33d20962-a74b-4f9a-9542-6a9011b37693	content_card	card-hotel-fortetsia	update	{"id": "card-hotel-fortetsia", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"rating": "4.8"}, "page_key": "city-bilhorod", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T13:23:38.194287+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hotels"}	{"id": "card-hotel-fortetsia", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"rating": "4.8"}, "page_key": "city-bilhorod", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hotels"}	vinilxd9@gmail.com	2026-04-28 16:31:37.188683+00
0b23b19d-ad30-4539-819f-0d08aca9220c	content_card	card-detail-contacts-1777393683394	delete	{"id": "card-detail-contacts-1777393683394", "href": "/hoteli/123123123123", "title": "Контакти", "city_id": "city-bilhorod", "payload": {"phone": "123123213", "address": "12321323"}, "page_key": "detail-hotel-123123123123", "subtitle": "12321323", "card_type": "info", "image_url": null, "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T16:28:07.04969+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "contacts"}	\N	vinilxd9@gmail.com	2026-04-28 16:32:05.68873+00
c676bd44-22b5-4b8d-af46-31188d96e358	content_card	card-detail-overview-1777393683394	delete	{"id": "card-detail-overview-1777393683394", "href": null, "title": "Опис", "city_id": "city-bilhorod", "payload": {"text": "123213213"}, "page_key": "detail-hotel-123123123123", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T16:28:06.041508+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "overview"}	\N	vinilxd9@gmail.com	2026-04-28 16:32:14.298245+00
fb9069b2-35ce-4793-bf61-3e4dee8520b8	tourism_object	obj-restaurant-1777531841344	create	\N	{"id": "obj-restaurant-1777531841344", "name": "231312123123213", "slug": "231312123123213", "type": "restaurant", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-04-30 06:50:42.244606+00
4280b9b4-6adc-4060-b734-90248d50722a	content_card	card-restaurant-1777531841344	create	\N	{"id": "card-restaurant-1777531841344", "href": "/restorany/231312123123213", "title": "231312123123213", "city_id": "city-bilhorod", "payload": {}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "312312123123213", "card_type": "restaurant", "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/2013_Volkswagen_Take_UP%21_1.0.jpg/3840px-2013_Volkswagen_Take_UP%21_1.0.jpg", "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "restaurants"}	vinilxd9@gmail.com	2026-04-30 06:50:42.618733+00
34fc24ba-c3b5-4a01-ac01-41d2f5806a3e	content_card	card-detail-hero-1777531841344	create	\N	{"id": "card-detail-hero-1777531841344", "href": null, "title": "231312123123213", "city_id": "city-bilhorod", "payload": {}, "page_key": "detail-restaurant-231312123123213", "subtitle": "312312123123213", "card_type": "restaurant", "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/2013_Volkswagen_Take_UP%21_1.0.jpg/3840px-2013_Volkswagen_Take_UP%21_1.0.jpg", "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hero"}	vinilxd9@gmail.com	2026-04-30 06:50:42.944167+00
962d4f50-f01b-4387-ac05-8f3a5bbe4336	content_card	card-detail-overview-1777531841344	create	\N	{"id": "card-detail-overview-1777531841344", "href": null, "title": "Опис", "city_id": "city-bilhorod", "payload": {"text": "alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka"}, "page_key": "detail-restaurant-231312123123213", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "overview"}	vinilxd9@gmail.com	2026-04-30 06:50:43.258458+00
89231da8-72c5-48dd-aaad-b19149700016	content_card	card-detail-info-1777531841344	create	\N	{"id": "card-detail-info-1777531841344", "href": null, "title": "Меню та атмосфера", "city_id": "city-bilhorod", "payload": {"mapUrl": "https://www.google.com/maps/place/Парк+Шевченко/@46.4617472,30.752768,13z/data=!4m6!3m5!1s0x40c63174dc37f265:0xfea9f20f084ede2c!8m2!3d46.4785607!4d30.7557663!16s%2Fg%2F121kq7j7!5m1!1e4?entry=ttu&g_ep=EgoyMDI2MDQyNy4wIKXMDSoASAFQAw%3D%3D", "rating": "4.8", "gallery": ["https://images.unsplash.com/photo-1776977507261-81e4ab0dd806?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://plus.unsplash.com/premium_photo-1776931377795-73b1693c2c34?q=80&w=2021&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1777033481363-96640776ae62?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"], "payments": ["alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka"], "amenities": ["alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka"], "workSlots": [{"to": "20:00", "days": "ПН-НД", "from": "10:00"}], "eventDates": [{"to": "", "from": "", "label": "Основні дати"}]}, "page_key": "detail-restaurant-231312123123213", "subtitle": "Додайте параметри", "card_type": "info", "image_url": null, "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "info"}	vinilxd9@gmail.com	2026-04-30 06:50:43.556656+00
49ce3058-1db7-4778-9efe-a58fe736a535	content_card	card-detail-contacts-1777531841344	create	\N	{"id": "card-detail-contacts-1777531841344", "href": "/restorany/231312123123213", "title": "Контакти", "city_id": "city-bilhorod", "payload": {"phone": "alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka", "address": "alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka"}, "page_key": "detail-restaurant-231312123123213", "subtitle": "alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka", "card_type": "info", "image_url": null, "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "contacts"}	vinilxd9@gmail.com	2026-04-30 06:50:43.880784+00
20787e46-0933-41b8-bf70-64249ec328c6	content_card	card-detail-gallery-1777531841344	create	\N	{"id": "card-detail-gallery-1777531841344", "href": null, "title": "Галерея", "city_id": "city-bilhorod", "payload": {"images": ["https://images.unsplash.com/photo-1776977507261-81e4ab0dd806?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://plus.unsplash.com/premium_photo-1776931377795-73b1693c2c34?q=80&w=2021&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1777033481363-96640776ae62?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"]}, "page_key": "detail-restaurant-231312123123213", "subtitle": null, "card_type": "restaurant", "image_url": "https://images.unsplash.com/photo-1776977507261-81e4ab0dd806?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "gallery"}	vinilxd9@gmail.com	2026-04-30 06:50:44.178254+00
e8ff749f-1600-4759-8f6e-9c18f35c8258	content_card	card-1777538611623	delete	{"id": "card-1777538611623", "href": null, "title": "Нова картка", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "attraction", "image_url": null, "published": false, "region_id": "region-odesa", "created_at": "2026-04-30T08:43:31.964135+00:00", "sort_order": 5, "district_id": null, "section_key": "new-section"}	\N	vinilxd9@gmail.com	2026-04-30 08:43:39.3719+00
946e60ed-39bc-4348-89c3-bd592bd1bc02	content_card	card-detail-hero-1777531841344	delete	{"id": "card-detail-hero-1777531841344", "href": null, "title": "231312123123213", "city_id": "city-bilhorod", "payload": {}, "page_key": "detail-restaurant-231312123123213", "subtitle": "312312123123213", "card_type": "restaurant", "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/2013_Volkswagen_Take_UP%21_1.0.jpg/3840px-2013_Volkswagen_Take_UP%21_1.0.jpg", "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T06:50:42.729226+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hero"}	\N	vinilxd9@gmail.com	2026-04-30 07:23:22.51352+00
5e00eed1-dd57-4440-b10d-76a4cafbaf50	content_card	card-restaurant-1777531841344	delete	{"id": "card-restaurant-1777531841344", "href": "/restorany/231312123123213", "title": "231312123123213", "city_id": "city-bilhorod", "payload": {}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "312312123123213", "card_type": "restaurant", "image_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/2013_Volkswagen_Take_UP%21_1.0.jpg/3840px-2013_Volkswagen_Take_UP%21_1.0.jpg", "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T06:50:42.398722+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "restaurants"}	\N	vinilxd9@gmail.com	2026-04-30 07:23:26.752318+00
b1baae9d-bab2-46e9-88e2-06a4e437f853	content_card	card-detail-gallery-1777531841344	delete	{"id": "card-detail-gallery-1777531841344", "href": null, "title": "Галерея", "city_id": "city-bilhorod", "payload": {"images": ["https://images.unsplash.com/photo-1776977507261-81e4ab0dd806?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://plus.unsplash.com/premium_photo-1776931377795-73b1693c2c34?q=80&w=2021&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1777033481363-96640776ae62?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"]}, "page_key": "detail-restaurant-231312123123213", "subtitle": null, "card_type": "restaurant", "image_url": "https://images.unsplash.com/photo-1776977507261-81e4ab0dd806?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T06:50:43.984761+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "gallery"}	\N	vinilxd9@gmail.com	2026-04-30 07:23:35.258385+00
f2ff9c96-6d59-439e-bb29-c554ac3bdf77	content_card	card-detail-info-1777393683394	delete	{"id": "card-detail-info-1777393683394", "href": null, "title": "Зручності та сервіси", "city_id": "city-bilhorod", "payload": {"mapUrl": null, "rating": "3", "gallery": [], "payments": ["123213231231", "312213", "231213"], "amenities": ["ывавыа", "авывыфвыф", "ыфвыфвывф"], "workSlots": [{"to": "20:00", "days": "ПН-НД", "from": "10:00"}, {"to": "", "days": "", "from": ""}], "eventDates": [{"to": "", "from": "", "label": "Основні дати"}]}, "page_key": "detail-hotel-123123123123", "subtitle": "Додайте параметри", "card_type": "info", "image_url": null, "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T16:28:06.533601+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "info"}	\N	vinilxd9@gmail.com	2026-04-30 07:23:42.810749+00
aea32745-1031-4c90-8ec1-4e8fb7843ec9	content_card	card-detail-overview-1777531841344	delete	{"id": "card-detail-overview-1777531841344", "href": null, "title": "Опис", "city_id": "city-bilhorod", "payload": {"text": "alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka"}, "page_key": "detail-restaurant-231312123123213", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T06:50:43.055967+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "overview"}	\N	vinilxd9@gmail.com	2026-04-30 07:23:52.724361+00
f580a19a-9f7a-41a4-925e-40b5478cb69c	content_card	card-detail-info-1777531841344	delete	{"id": "card-detail-info-1777531841344", "href": null, "title": "Меню та атмосфера", "city_id": "city-bilhorod", "payload": {"mapUrl": "https://www.google.com/maps/place/Парк+Шевченко/@46.4617472,30.752768,13z/data=!4m6!3m5!1s0x40c63174dc37f265:0xfea9f20f084ede2c!8m2!3d46.4785607!4d30.7557663!16s%2Fg%2F121kq7j7!5m1!1e4?entry=ttu&g_ep=EgoyMDI2MDQyNy4wIKXMDSoASAFQAw%3D%3D", "rating": "4.8", "gallery": ["https://images.unsplash.com/photo-1776977507261-81e4ab0dd806?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://plus.unsplash.com/premium_photo-1776931377795-73b1693c2c34?q=80&w=2021&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1777033481363-96640776ae62?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"], "payments": ["alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka"], "amenities": ["alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka"], "workSlots": [{"to": "20:00", "days": "ПН-НД", "from": "10:00"}], "eventDates": [{"to": "", "from": "", "label": "Основні дати"}]}, "page_key": "detail-restaurant-231312123123213", "subtitle": "Додайте параметри", "card_type": "info", "image_url": null, "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T06:50:43.357114+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "info"}	\N	vinilxd9@gmail.com	2026-04-30 07:23:59.328339+00
63a9e3a3-b135-426f-a06f-61d45a007e90	content_card	card-detail-contacts-1777531841344	delete	{"id": "card-detail-contacts-1777531841344", "href": "/restorany/231312123123213", "title": "Контакти", "city_id": "city-bilhorod", "payload": {"phone": "alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka", "address": "alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka"}, "page_key": "detail-restaurant-231312123123213", "subtitle": "alskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlkaalskdjaslkjdlka", "card_type": "info", "image_url": null, "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T06:50:43.663336+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "contacts"}	\N	vinilxd9@gmail.com	2026-04-30 07:24:06.004015+00
b2b35e2b-5ed0-43e0-8a28-8c62153b283a	tourism_object	obj-hotel-1777393683394	delete	{"id": "obj-hotel-1777393683394", "name": "123123123123", "slug": "123123123123", "type": "hotel", "city_id": "city-bilhorod", "published": true, "created_at": "2026-04-28T16:28:03.918867+00:00", "district_id": "district-bilhorod"}	\N	vinilxd9@gmail.com	2026-04-30 07:24:34.442413+00
347c9ae8-206a-4fbf-8c3c-20a4e8b57c15	tourism_object	obj-restaurant-1777531841344	delete	{"id": "obj-restaurant-1777531841344", "name": "231312123123213", "slug": "231312123123213", "type": "restaurant", "city_id": "city-bilhorod", "published": true, "created_at": "2026-04-30T06:50:41.80149+00:00", "district_id": "district-bilhorod"}	\N	vinilxd9@gmail.com	2026-04-30 07:24:44.541918+00
e01583b8-4fc7-4a2a-a9f7-5f5cdba14a0b	district	district-1777392109635	delete	{"id": "district-1777392109635", "name": "Новий район", "slug": "district-1777392109635", "region_id": "region-odesa", "created_at": "2026-04-28T16:01:50.469786+00:00"}	\N	vinilxd9@gmail.com	2026-04-30 07:24:57.585412+00
cbc42ad0-766f-498c-a454-77845a0f91bf	city	city-bolhrad	delete	{"id": "city-bolhrad", "name": "Болград", "slug": "bolhrad", "created_at": "2026-04-28T13:23:37.956743+00:00", "district_id": "district-bilhorod"}	\N	vinilxd9@gmail.com	2026-04-30 07:25:05.922912+00
f75a1158-49be-4a6e-a2f6-e45006950748	city	city-odesa	delete	{"id": "city-odesa", "name": "Одеса", "slug": "odesa", "created_at": "2026-04-28T13:23:37.956743+00:00", "district_id": "district-odeskyi"}	\N	vinilxd9@gmail.com	2026-04-30 07:25:13.433542+00
7206eca5-8994-4a08-9411-3aef19bf4a57	content_card	card-1777538611623	create	\N	{"id": "card-1777538611623", "href": null, "title": "Нова картка", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "attraction", "image_url": null, "published": false, "region_id": "region-odesa", "sort_order": 5, "district_id": null, "section_key": "new-section"}	vinilxd9@gmail.com	2026-04-30 08:43:32.351531+00
a8846d9e-7a6c-49fe-b5e6-776b0f870ac2	content_card	card-1777541684288	create	\N	{"id": "card-1777541684288", "href": null, "title": "Нова картка", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "attraction", "image_url": null, "published": false, "region_id": "region-odesa", "sort_order": 5, "district_id": null, "section_key": "new-section"}	vinilxd9@gmail.com	2026-04-30 09:34:44.883581+00
2ce55dbb-1cb5-4f66-8d95-16d4fa105fcd	content_card	card-1777541684288	update	{"id": "card-1777541684288", "href": null, "title": "Нова картка", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "attraction", "image_url": null, "published": false, "region_id": "region-odesa", "created_at": "2026-04-30T09:34:44.500469+00:00", "sort_order": 5, "district_id": null, "section_key": "new-section"}	{"id": "card-1777541684288", "href": null, "title": "Нова картка", "city_id": "city-bilhorod", "payload": {}, "page_key": "index", "subtitle": null, "card_type": "hotel", "image_url": null, "published": false, "region_id": "region-odesa", "sort_order": 5, "district_id": "district-bilhorod", "section_key": "new-section"}	vinilxd9@gmail.com	2026-04-30 09:35:19.181658+00
7e9b02fc-d27d-46f8-a448-9cb56564a177	content_card	card-1777541684288	delete	{"id": "card-1777541684288", "href": null, "title": "Нова картка", "city_id": "city-bilhorod", "payload": {}, "page_key": "index", "subtitle": null, "card_type": "hotel", "image_url": null, "published": false, "region_id": "region-odesa", "created_at": "2026-04-30T09:34:44.500469+00:00", "sort_order": 5, "district_id": "district-bilhorod", "section_key": "new-section"}	\N	vinilxd9@gmail.com	2026-04-30 09:57:21.167103+00
8c6a4af0-0e91-4f20-a050-1cfd83bf92a4	tourism_object	obj-restaurant-rybnyi	update	{"id": "obj-restaurant-rybnyi", "name": "Рибний двір", "slug": "rybnyy-dvir", "type": "restaurant", "city_id": "city-bilhorod", "published": true, "created_at": "2026-04-28T13:23:38.084302+00:00", "district_id": "district-bilhorod"}	{"id": "obj-restaurant-rybnyi", "name": "Рибний двір", "slug": "rybnyy-dvir", "type": "restaurant", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-04-30 11:14:50.820777+00
2d95dea6-73ec-4214-90bf-c3df39492264	tourism_object	obj-restaurant-rybnyi	update	{"id": "obj-restaurant-rybnyi", "name": "Рибний двір", "slug": "rybnyy-dvir", "type": "restaurant", "city_id": "city-bilhorod", "published": true, "created_at": "2026-04-28T13:23:38.084302+00:00", "district_id": "district-bilhorod"}	{"id": "obj-restaurant-rybnyi", "name": "Рибний двір", "slug": "rybnyy-dvir", "type": "restaurant", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-04-30 11:14:55.52897+00
ab0ef2ed-fda3-495b-b2e8-d127a346b226	tourism_object	obj-restaurant-rybnyi	update	{"id": "obj-restaurant-rybnyi", "name": "Рибний двір", "slug": "rybnyy-dvir", "type": "restaurant", "city_id": "city-bilhorod", "published": true, "created_at": "2026-04-28T13:23:38.084302+00:00", "district_id": "district-bilhorod"}	{"id": "obj-restaurant-rybnyi", "name": "Рибний двір", "slug": "rybnyy-dvir", "type": "restaurant", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-04-30 11:14:55.716156+00
f2a8b7d5-7bb6-4552-9fce-8409cd2b151c	tourism_object	obj-restaurant-rybnyi	update	{"id": "obj-restaurant-rybnyi", "name": "Рибний двір", "slug": "rybnyy-dvir", "type": "restaurant", "city_id": "city-bilhorod", "published": true, "created_at": "2026-04-28T13:23:38.084302+00:00", "district_id": "district-bilhorod"}	{"id": "obj-restaurant-rybnyi", "name": "Рибний двір", "slug": "rybnyy-dvir", "type": "restaurant", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-04-30 11:15:00.226634+00
31a48a0a-a8ab-4220-9955-bc62d0233f4d	content_card	card-placement-obj-restaurant-rybnyi-city-bilhorod-dnistrovskyi-1777547700156	create	\N	{"id": "card-placement-obj-restaurant-rybnyi-city-bilhorod-dnistrovskyi-1777547700156", "href": "/restorany/rybnyy-dvir", "title": "Рибний двір", "city_id": "city-bilhorod", "payload": {"status": "published", "cuisine": null, "summary": "Рибний двір", "objectId": "obj-restaurant-rybnyi", "objectType": "restaurant", "priceRange": null, "tourism_object_id": "obj-restaurant-rybnyi"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "Білгород-Дністровський", "card_type": "restaurant", "image_url": "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "restaurants"}	vinilxd9@gmail.com	2026-04-30 11:15:00.728064+00
6a589141-a842-48d7-9112-0aecba127014	content_card	card-placement-obj-restaurant-rybnyi-district-bilhorod-dnistrovskyi-raion-1777547700653	create	\N	{"id": "card-placement-obj-restaurant-rybnyi-district-bilhorod-dnistrovskyi-raion-1777547700653", "href": "/restorany/rybnyy-dvir", "title": "Рибний двір", "city_id": "city-bilhorod", "payload": {"status": "published", "cuisine": null, "summary": "Рибний двір", "objectId": "obj-restaurant-rybnyi", "objectType": "restaurant", "priceRange": null, "tourism_object_id": "obj-restaurant-rybnyi"}, "page_key": "district-bilhorod-dnistrovskyi-raion", "subtitle": "Білгород-Дністровський", "card_type": "restaurant", "image_url": "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "main"}	vinilxd9@gmail.com	2026-04-30 11:15:01.162503+00
df0991c5-a906-4d9c-89f9-b67717e83c8b	content_card	card-placement-obj-restaurant-rybnyi-index-1777547701091	create	\N	{"id": "card-placement-obj-restaurant-rybnyi-index-1777547701091", "href": "/restorany/rybnyy-dvir", "title": "Рибний двір", "city_id": "city-bilhorod", "payload": {"status": "published", "cuisine": null, "summary": "Рибний двір", "objectId": "obj-restaurant-rybnyi", "objectType": "restaurant", "priceRange": null, "tourism_object_id": "obj-restaurant-rybnyi"}, "page_key": "index", "subtitle": "Білгород-Дністровський", "card_type": "restaurant", "image_url": "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "featured"}	vinilxd9@gmail.com	2026-04-30 11:15:01.608002+00
5f4eab73-a0cb-46ea-879c-25999aae5f47	tourism_object	obj-hotel-fortetsia	update	{"id": "obj-hotel-fortetsia", "name": "Fortetsia View Hotel", "slug": "fortetsia-view-hotel", "type": "hotel", "city_id": "city-bilhorod", "published": true, "created_at": "2026-04-28T13:23:38.084302+00:00", "district_id": "district-bilhorod"}	{"id": "obj-hotel-fortetsia", "name": "Fortetsia View Hotel", "slug": "fortetsia-view-hotel", "type": "hotel", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-04-30 11:15:44.579206+00
47142254-6702-4b85-932b-3fe1d7aaacab	content_card	card-detail-overview-1778486313816-rsvt4b	create	\N	{"id": "card-detail-overview-1778486313816-rsvt4b", "href": null, "title": "Опис", "city_id": "city-bilhorod", "payload": {"text": "", "objectId": "obj-event-1778486313816-rsvt4b", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "detail-event-event-1778486313816-rsvt4b", "subtitle": null, "card_type": "text", "image_url": null, "published": false, "region_id": "region-odesa", "sort_order": 2, "district_id": "district-bilhorod", "section_key": "overview"}	vinilxd9@gmail.com	2026-05-11 07:58:34.775525+00
609a241d-62b6-413d-bcba-4e32025158e7	content_card	card-placement-obj-hotel-fortetsia-city-bilhorod-dnistrovskyi-1777547744508	create	\N	{"id": "card-placement-obj-hotel-fortetsia-city-bilhorod-dnistrovskyi-1777547744508", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "hotels"}	vinilxd9@gmail.com	2026-04-30 11:15:45.048026+00
53b03e1b-e5ab-4ea5-b10b-7806b9ff567c	content_card	card-placement-obj-hotel-fortetsia-district-bilhorod-dnistrovskyi-raion-1777547744975	create	\N	{"id": "card-placement-obj-hotel-fortetsia-district-bilhorod-dnistrovskyi-raion-1777547744975", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "district-bilhorod-dnistrovskyi-raion", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "main"}	vinilxd9@gmail.com	2026-04-30 11:15:45.482746+00
0d1811cb-7dc2-4458-b439-98704ac3b03f	content_card	card-placement-obj-hotel-fortetsia-index-1777547745405	create	\N	{"id": "card-placement-obj-hotel-fortetsia-index-1777547745405", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "index", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "featured"}	vinilxd9@gmail.com	2026-04-30 11:15:45.892958+00
24a8593f-46fc-4bc8-8a06-1bf3dc25a6ae	content_card	card-hotel-fortetsia	update	{"id": "card-hotel-fortetsia", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"rating": "4.8"}, "page_key": "city-bilhorod", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T13:23:38.194287+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hotels"}	{"id": "card-hotel-fortetsia", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"rating": "4.8", "objectId": "obj-hotel-fortetsia", "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "city-bilhorod", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hotels"}	vinilxd9@gmail.com	2026-04-30 11:18:17.65935+00
85b65a36-64c6-46f4-a43d-c50ecfdadf56	content_card	card-hotel-fortetsia	update	{"id": "card-hotel-fortetsia", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"rating": "4.8"}, "page_key": "city-bilhorod", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T13:23:38.194287+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hotels"}	{"id": "card-hotel-fortetsia", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"rating": "4.8", "objectId": "obj-hotel-fortetsia", "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "city-bilhorod", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hotels"}	vinilxd9@gmail.com	2026-04-30 11:18:17.662858+00
cfc86739-89a5-4dd2-a5f1-bc1fd66bf70d	content_card	card-hotel-fortetsia	update	{"id": "card-hotel-fortetsia", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"rating": "4.8"}, "page_key": "city-bilhorod", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T13:23:38.194287+00:00", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hotels"}	{"id": "card-hotel-fortetsia", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"rating": "4.8", "objectId": "obj-hotel-fortetsia", "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "city-bilhorod", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hotels"}	vinilxd9@gmail.com	2026-04-30 11:18:17.662247+00
a65cb6d4-56b8-4242-9942-b0d643d16a6e	content_card	card-hotel-1777547883541	create	\N	{"id": "card-hotel-1777547883541", "href": "/hoteli/fortetsia-view-hotel", "title": "Новий блок", "city_id": "city-bilhorod", "payload": {"objectId": "obj-hotel-fortetsia", "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "detail-hotel-fortetsia-view-hotel", "subtitle": null, "card_type": "hotel", "image_url": null, "published": true, "region_id": "region-odesa", "sort_order": 2, "district_id": "district-bilhorod", "section_key": "overview"}	vinilxd9@gmail.com	2026-04-30 11:18:17.961594+00
a2ed69dd-54ca-4648-aa6a-d88297fa342f	tourism_object	obj-hotel-fortetsia	update	{"id": "obj-hotel-fortetsia", "name": "Fortetsia View Hotel", "slug": "fortetsia-view-hotel", "type": "hotel", "city_id": "city-bilhorod", "published": true, "created_at": "2026-04-28T13:23:38.084302+00:00", "district_id": "district-bilhorod"}	{"id": "obj-hotel-fortetsia", "name": "Fortetsia View Hotel", "slug": "fortetsia-view-hotel", "type": "hotel", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-04-30 11:18:24.990658+00
48302753-0d7a-47c7-b0b7-a5597c14a730	content_card	card-placement-obj-hotel-fortetsia-city-bilhorod-dnistrovskyi-1777547744508	update	{"id": "card-placement-obj-hotel-fortetsia-city-bilhorod-dnistrovskyi-1777547744508", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T11:15:44.847737+00:00", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "hotels"}	{"id": "card-placement-obj-hotel-fortetsia-city-bilhorod-dnistrovskyi-1777547744508", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "hotels"}	vinilxd9@gmail.com	2026-04-30 11:18:25.38036+00
feb19958-a50d-4b1c-a636-e4e7558e07b4	tourism_object	obj-hotel-fortetsia	update	{"id": "obj-hotel-fortetsia", "name": "Fortetsia View Hotel", "slug": "fortetsia-view-hotel", "type": "hotel", "city_id": "city-bilhorod", "published": true, "created_at": "2026-04-28T13:23:38.084302+00:00", "district_id": "district-bilhorod"}	{"id": "obj-hotel-fortetsia", "name": "Fortetsia View Hotel", "slug": "fortetsia-view-hotel", "type": "hotel", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-04-30 11:18:26.440505+00
08739d5c-67ff-4eb7-837d-9a8ef497ea40	content_card	card-placement-obj-hotel-fortetsia-district-bilhorod-dnistrovskyi-raion-1777547744975	update	{"id": "card-placement-obj-hotel-fortetsia-district-bilhorod-dnistrovskyi-raion-1777547744975", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "district-bilhorod-dnistrovskyi-raion", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T11:15:45.296179+00:00", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "main"}	{"id": "card-placement-obj-hotel-fortetsia-district-bilhorod-dnistrovskyi-raion-1777547744975", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "district-bilhorod-dnistrovskyi-raion", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "main"}	vinilxd9@gmail.com	2026-04-30 11:18:25.768539+00
8608f9af-bbf3-4db6-a48d-3d6d6d710f5d	content_card	card-placement-obj-hotel-fortetsia-city-bilhorod-dnistrovskyi-1777547744508	update	{"id": "card-placement-obj-hotel-fortetsia-city-bilhorod-dnistrovskyi-1777547744508", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T11:15:44.847737+00:00", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "hotels"}	{"id": "card-placement-obj-hotel-fortetsia-city-bilhorod-dnistrovskyi-1777547744508", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "hotels"}	vinilxd9@gmail.com	2026-04-30 11:18:26.826003+00
f3081db0-1eff-406e-be8d-ad58d699754c	content_card	card-placement-obj-hotel-fortetsia-index-1777547745405	update	{"id": "card-placement-obj-hotel-fortetsia-index-1777547745405", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "index", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T11:15:45.7109+00:00", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "featured"}	{"id": "card-placement-obj-hotel-fortetsia-index-1777547745405", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "index", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "featured"}	vinilxd9@gmail.com	2026-04-30 11:18:26.1561+00
125f6a5e-d915-499a-b0cf-44dff641b0f3	content_card	card-placement-obj-hotel-fortetsia-district-bilhorod-dnistrovskyi-raion-1777547744975	update	{"id": "card-placement-obj-hotel-fortetsia-district-bilhorod-dnistrovskyi-raion-1777547744975", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "district-bilhorod-dnistrovskyi-raion", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T11:15:45.296179+00:00", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "main"}	{"id": "card-placement-obj-hotel-fortetsia-district-bilhorod-dnistrovskyi-raion-1777547744975", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "district-bilhorod-dnistrovskyi-raion", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "main"}	vinilxd9@gmail.com	2026-04-30 11:18:27.198822+00
32429d3f-494c-4454-bfb0-2358f3920f98	content_card	card-placement-obj-hotel-fortetsia-index-1777547745405	update	{"id": "card-placement-obj-hotel-fortetsia-index-1777547745405", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "index", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-30T11:15:45.7109+00:00", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "featured"}	{"id": "card-placement-obj-hotel-fortetsia-index-1777547745405", "href": "/hoteli/fortetsia-view-hotel", "title": "Fortetsia View Hotel", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}, "page_key": "index", "subtitle": "Білгород-Дністровський", "card_type": "hotel", "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "featured"}	vinilxd9@gmail.com	2026-04-30 11:18:27.5771+00
5a7c3d24-f394-4e2d-97c4-1cfb30eb1a17	city	city-1778486218550	create	\N	{"id": "city-1778486218550", "name": "Нове місто 2", "slug": "--2", "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-05-11 07:56:58.987759+00
5d35273d-cc82-420b-868c-e2146f1ec15a	content_card	card-city-main-1778486218550	create	\N	{"id": "card-city-main-1778486218550", "href": null, "title": "Опис району", "city_id": "city-1778486218550", "payload": {"text": "Нове місто 2 — нова сторінка міста. Заповніть опис у адмінці."}, "page_key": "city---2", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "main"}	vinilxd9@gmail.com	2026-05-11 07:56:59.324611+00
7acae32c-2805-4b06-938e-f468df3fe3af	content_card	card-city-info-1-1778486218550	create	\N	{"id": "card-city-info-1-1778486218550", "href": null, "title": "Історія та культура", "city_id": "city-1778486218550", "payload": {}, "page_key": "city---2", "subtitle": null, "card_type": "info", "image_url": null, "published": true, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "info"}	vinilxd9@gmail.com	2026-05-11 07:56:59.60426+00
b37617fa-678d-4479-9194-64ecc7ca087e	tourism_object	obj-event-1778486313816-rsvt4b	create	\N	{"id": "obj-event-1778486313816-rsvt4b", "name": "Новий події", "slug": "event-1778486313816-rsvt4b", "type": "event", "city_id": "city-bilhorod", "published": false, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-05-11 07:58:34.24906+00
ac340969-ce9f-475a-a738-edbe4ffca3d8	content_card	card-detail-hero-1778486313816-rsvt4b	create	\N	{"id": "card-detail-hero-1778486313816-rsvt4b", "href": "/podiyi/event-1778486313816-rsvt4b", "title": "Новий події", "city_id": "city-bilhorod", "payload": {"objectId": "obj-event-1778486313816-rsvt4b", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "detail-event-event-1778486313816-rsvt4b", "subtitle": "Білгород-Дністровський", "card_type": "event", "image_url": null, "published": false, "region_id": "region-odesa", "sort_order": 1, "district_id": "district-bilhorod", "section_key": "hero"}	vinilxd9@gmail.com	2026-05-11 07:58:34.510808+00
bd1ab069-2253-41be-84d0-ad4daadbefe6	content_card	tourism-type-морський-туризм	create	\N	{"id": "tourism-type-морський-туризм", "href": null, "title": "Морський туризм", "city_id": null, "payload": {}, "page_key": "tourism-types", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405355665.png", "published": true, "region_id": null, "sort_order": 0, "district_id": null, "section_key": "type"}	vinilxd9@gmail.com	2026-06-02 13:02:47.103696+00
54b4b23b-89f2-460e-99a7-bf737768bf67	tourism_object	obj-event-1778486313816-rsvt4b	update	{"id": "obj-event-1778486313816-rsvt4b", "name": "Новий події", "slug": "event-1778486313816-rsvt4b", "type": "event", "city_id": "city-bilhorod", "published": false, "created_at": "2026-05-11T07:58:33.946387+00:00", "district_id": "district-bilhorod"}	{"id": "obj-event-1778486313816-rsvt4b", "name": "COMIC WAVE", "slug": "event-1778486313816-rsvt4b", "type": "event", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-05-11 07:59:13.249617+00
9851aa4a-cd55-4d0f-a846-8a821183c657	tourism_object	obj-event-1778486313816-rsvt4b	update	{"id": "obj-event-1778486313816-rsvt4b", "name": "COMIC WAVE", "slug": "event-1778486313816-rsvt4b", "type": "event", "city_id": "city-bilhorod", "published": true, "created_at": "2026-05-11T07:58:33.946387+00:00", "district_id": "district-bilhorod"}	{"id": "obj-event-1778486313816-rsvt4b", "name": "COMIC WAVE", "slug": "event-1778486313816-rsvt4b", "type": "event", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-05-11 08:01:11.018445+00
a66f6b58-c51d-45b4-ac08-7820b16f5b57	content_card	card-placement-obj-event-1778486313816-rsvt4b-city-bilhorod-dnistrovskyi-1778486471045	create	\N	{"id": "card-placement-obj-event-1778486313816-rsvt4b-city-bilhorod-dnistrovskyi-1778486471045", "href": "/podiyi/event-1778486313816-rsvt4b", "title": "COMIC WAVE", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "Білгород-Дністровський", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "events"}	vinilxd9@gmail.com	2026-05-11 08:01:11.526771+00
de99ffd9-2cd8-48f5-8967-b60979fff0e0	tourism_object	obj-event-1778486313816-rsvt4b	update	{"id": "obj-event-1778486313816-rsvt4b", "name": "COMIC WAVE", "slug": "event-1778486313816-rsvt4b", "type": "event", "city_id": "city-bilhorod", "published": true, "created_at": "2026-05-11T07:58:33.946387+00:00", "district_id": "district-bilhorod"}	{"id": "obj-event-1778486313816-rsvt4b", "name": "COMIC WAVE", "slug": "event-1778486313816-rsvt4b", "type": "event", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-05-11 08:01:11.792798+00
fcb1823b-895b-4f9f-944c-2f15c3727674	content_card	card-placement-obj-event-1778486313816-rsvt4b-index-1778486471546	create	\N	{"id": "card-placement-obj-event-1778486313816-rsvt4b-index-1778486471546", "href": "/podiyi/event-1778486313816-rsvt4b", "title": "COMIC WAVE", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "index", "subtitle": "Білгород-Дністровський", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "featured"}	vinilxd9@gmail.com	2026-05-11 08:01:11.981156+00
20be11c3-ce6b-4d7f-8ada-574d245a14a5	content_card	card-placement-obj-event-1778486313816-rsvt4b-city-bilhorod-dnistrovskyi-1778486471814	create	\N	{"id": "card-placement-obj-event-1778486313816-rsvt4b-city-bilhorod-dnistrovskyi-1778486471814", "href": "/podiyi/event-1778486313816-rsvt4b", "title": "COMIC WAVE", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "Білгород-Дністровський", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "events"}	vinilxd9@gmail.com	2026-05-11 08:01:12.29411+00
76c5def7-f74a-4bac-9d82-ef8b13813768	content_card	card-placement-obj-event-1778486313816-rsvt4b-index-1778486472317	create	\N	{"id": "card-placement-obj-event-1778486313816-rsvt4b-index-1778486472317", "href": "/podiyi/event-1778486313816-rsvt4b", "title": "COMIC WAVE", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "index", "subtitle": "Білгород-Дністровський", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "featured"}	vinilxd9@gmail.com	2026-05-11 08:01:12.699298+00
8810e810-ea6c-4f9a-b4ea-8f395cc1642e	city	city-1778486218550	delete	{"id": "city-1778486218550", "name": "Нове місто 2", "slug": "--2", "created_at": "2026-05-11T07:56:58.676165+00:00", "district_id": "district-bilhorod"}	\N	vinilxd9@gmail.com	2026-05-11 08:01:34.462861+00
185414d5-a100-4525-807d-fba65c4d7df2	tourism_object	obj-event-1778486313816-rsvt4b	update	{"id": "obj-event-1778486313816-rsvt4b", "name": "COMIC WAVE", "slug": "event-1778486313816-rsvt4b", "type": "event", "city_id": "city-bilhorod", "published": true, "created_at": "2026-05-11T07:58:33.946387+00:00", "district_id": "district-bilhorod"}	{"id": "obj-event-1778486313816-rsvt4b", "name": "COMIC WAVE", "slug": "event-1778486313816-rsvt4b", "type": "event", "city_id": "city-bilhorod", "published": true, "district_id": "district-bilhorod"}	vinilxd9@gmail.com	2026-05-11 08:01:39.596126+00
34edcbb3-337f-4d45-808e-855ef86fa3e0	content_card	card-placement-obj-event-1778486313816-rsvt4b-city-bilhorod-dnistrovskyi-1778486471814	delete	{"id": "card-placement-obj-event-1778486313816-rsvt4b-city-bilhorod-dnistrovskyi-1778486471814", "href": "/podiyi/event-1778486313816-rsvt4b", "title": "COMIC WAVE", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "Білгород-Дністровський", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg", "published": true, "region_id": "region-odesa", "created_at": "2026-05-11T08:01:12.119194+00:00", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "events"}	\N	vinilxd9@gmail.com	2026-05-11 08:01:40.372625+00
dd954089-1898-449c-909a-5e22f5accead	tourism_object	obj-event-1778486313816-rsvt4b	delete	{"id": "obj-event-1778486313816-rsvt4b", "name": "COMIC WAVE", "slug": "event-1778486313816-rsvt4b", "type": "event", "city_id": "city-bilhorod", "published": true, "created_at": "2026-05-11T07:58:33.946387+00:00", "district_id": "district-bilhorod"}	\N	vinilxd9@gmail.com	2026-05-11 08:02:29.149999+00
9a5e96e0-ae2e-43be-bdc5-270b22cf01b9	content_card	card-placement-obj-event-1778486313816-rsvt4b-city-bilhorod-dnistrovskyi-1778486471045	update	{"id": "card-placement-obj-event-1778486313816-rsvt4b-city-bilhorod-dnistrovskyi-1778486471045", "href": "/podiyi/event-1778486313816-rsvt4b", "title": "COMIC WAVE", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "Білгород-Дністровський", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg", "published": true, "region_id": "region-odesa", "created_at": "2026-05-11T08:01:11.315542+00:00", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "events"}	{"id": "card-placement-obj-event-1778486313816-rsvt4b-city-bilhorod-dnistrovskyi-1778486471045", "href": "/podiyi/event-1778486313816-rsvt4b", "title": "COMIC WAVE", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "city-bilhorod-dnistrovskyi", "subtitle": "Білгород-Дністровський", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "events"}	vinilxd9@gmail.com	2026-05-11 08:01:39.969397+00
3b5ce31d-1e5b-4bf4-b464-441547a020bc	content_card	card-placement-obj-event-1778486313816-rsvt4b-index-1778486471546	update	{"id": "card-placement-obj-event-1778486313816-rsvt4b-index-1778486471546", "href": "/podiyi/event-1778486313816-rsvt4b", "title": "COMIC WAVE", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "index", "subtitle": "Білгород-Дністровський", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg", "published": true, "region_id": "region-odesa", "created_at": "2026-05-11T08:01:11.791531+00:00", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "featured"}	{"id": "card-placement-obj-event-1778486313816-rsvt4b-index-1778486471546", "href": "/podiyi/event-1778486313816-rsvt4b", "title": "COMIC WAVE", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "index", "subtitle": "Білгород-Дністровський", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg", "published": true, "region_id": "region-odesa", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "featured"}	vinilxd9@gmail.com	2026-05-11 08:01:40.739872+00
6eac4c8c-6e54-4d33-8c2f-526ef9d78670	content_card	card-placement-obj-event-1778486313816-rsvt4b-index-1778486472317	delete	{"id": "card-placement-obj-event-1778486313816-rsvt4b-index-1778486472317", "href": "/podiyi/event-1778486313816-rsvt4b", "title": "COMIC WAVE", "city_id": "city-bilhorod", "payload": {"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}, "page_key": "index", "subtitle": "Білгород-Дністровський", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg", "published": true, "region_id": "region-odesa", "created_at": "2026-05-11T08:01:12.517594+00:00", "sort_order": 999, "district_id": "district-bilhorod", "section_key": "featured"}	\N	vinilxd9@gmail.com	2026-05-11 08:01:41.159883+00
a8b1fe1b-00e7-4d95-87f1-51e1984a56ea	city	city-c7bgm0r7	create	\N	{"id": "city-c7bgm0r7", "name": "Одеса", "slug": "e-a", "subtitle": null, "image_url": "https://images.ohmyhosting.se/x0IB4OY4Zay74QT5blGP3ZIZCpc=/fit-in/1680x1050/smart/filters:quality(85)/https%3A%2F%2Fengelsbergideas.com%2Fwp-content%2Fuploads%2F2023%2F05%2FOdessa.jpg", "video_url": null, "description": null, "district_id": "district-odeskyi", "detailed_info": null}	vinilxd9@gmail.com	2026-05-15 08:06:51.901682+00
83f59eef-88f2-41c7-be27-6910f145006b	city	city-c7bgm0r7	update	{"id": "city-c7bgm0r7", "name": "Одеса", "slug": "e-a", "subtitle": null, "image_url": "https://images.ohmyhosting.se/x0IB4OY4Zay74QT5blGP3ZIZCpc=/fit-in/1680x1050/smart/filters:quality(85)/https%3A%2F%2Fengelsbergideas.com%2Fwp-content%2Fuploads%2F2023%2F05%2FOdessa.jpg", "video_url": null, "created_at": "2026-05-15T08:06:51.358156+00:00", "description": null, "district_id": "district-odeskyi", "detailed_info": null}	{"id": "city-c7bgm0r7", "name": "Одеса", "slug": "e-a", "subtitle": null, "image_url": "https://images.ohmyhosting.se/x0IB4OY4Zay74QT5blGP3ZIZCpc=/fit-in/1680x1050/smart/filters:quality(85)/https%3A%2F%2Fengelsbergideas.com%2Fwp-content%2Fuploads%2F2023%2F05%2FOdessa.jpg", "video_url": null, "description": null, "district_id": "district-odeskyi", "detailed_info": null}	vinilxd9@gmail.com	2026-05-15 08:07:37.730485+00
4a896a11-97eb-4f67-8576-b6b2d7212441	tourism_object	place-tq7a7qkq	create	\N	{"id": "place-tq7a7qkq", "name": "Одеський національний академічний театр опери та балету", "slug": "e-a-i-a-a-a-e-i-ea-e-a-a-e-g8j1md", "type": "attraction", "hours": null, "phone": null, "address": null, "city_id": "city-c7bgm0r7", "map_url": "https://maps.app.goo.gl/5RGoNbYxELpujfPk6", "website": null, "subtitle": "пам’ятка архітектури національного значення", "amenities": null, "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "video_url": null, "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n", "district_id": "district-odeskyi", "event_dates": null, "detailed_info": "Архітектурні особливості\\n\\nCтиль: віденське необароко;\\nрозкішний фасад із скульптурними композиціями;\\nпідковоподібна форма глядацької зали;\\nунікальна акустика;\\nбагатий декор інтер’єрів (ліпнина, позолота, кришталеві люстри).\\n\\nБудівля входить до переліку пам’яток архітектури національного значення України.\\n\\nМистецька діяльність\\n\\nРепертуар театру включає:\\n ✔ класичні та сучасні опери;\\n ✔ балетні постановки;\\n ✔ симфонічні концерти;\\n ✔ фестивальні та міжнародні проєкти;\\n ✔ гастрольні програми.\\n\\nТеатр має статус національного та є одним із провідних музичних театрів країни.\\n\\nТуристичне значення\\n\\nодна з головних архітектурних «візитівок» Одеси;\\nключовий об’єкт культурного туризму;\\nвходить до більшості оглядових екскурсій містом;\\nпопулярна фотолокація;\\nприваблює міжнародних туристів.\\n\\nТуристичні послуги\\n\\n✔ відвідування вистав;\\n✔ екскурсії історичною будівлею (за попереднім записом);\\n✔ групові культурні програми;\\n✔ фотосесії (за правилами театру).\\n\\nІнфраструктура\\n\\nглядацький зал на понад 1 600 місць;\\nкаси та онлайн-продаж квитків;\\nгардероб;\\nбуфет;\\nзручне розташування в історичному центрі міста.\\n", "tourism_types": ["Історико-культурний туризм"]}	vinilxd9@gmail.com	2026-05-15 08:13:40.482796+00
c86d13dd-7ed2-4dff-ad23-5783a7b668f3	content_card	card-0yyd5uh8	create	\N	{"id": "card-0yyd5uh8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-c7bgm0r7", "payload": {"row": 1, "colSpan": 1, "placeId": "place-tq7a7qkq", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-odeskyi", "section_key": "interesting"}	vinilxd9@gmail.com	2026-05-15 08:13:54.59744+00
7b0d20eb-daed-46c3-bd6d-19a222882ac6	content_card	card-0yyd5uh8	update	{"id": "card-0yyd5uh8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-c7bgm0r7", "payload": {"row": 1, "colSpan": 1, "placeId": "place-tq7a7qkq", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "created_at": "2026-05-15T08:13:54.386808+00:00", "sort_order": 0, "district_id": "district-odeskyi", "section_key": "interesting"}	{"id": "card-0yyd5uh8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-c7bgm0r7", "payload": {"row": 1, "colSpan": 1, "placeId": "place-tq7a7qkq", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": false, "region_id": null, "sort_order": 0, "district_id": "district-odeskyi", "section_key": "interesting"}	vinilxd9@gmail.com	2026-05-15 08:13:56.851648+00
5c34f79d-b4a6-4ee7-ab02-ccbff0d4554a	content_card	card-destination-bilhorod	delete	{"id": "card-destination-bilhorod", "href": "/napryamky/bilhorod-dnistrovskyi", "title": "Білгород-Дністровський", "city_id": null, "payload": {}, "page_key": "index", "subtitle": "", "card_type": "destination", "image_url": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T13:23:38.194287+00:00", "sort_order": 1, "district_id": null, "section_key": "directions"}	\N	vinilxd9@gmail.com	2026-06-02 07:20:44.636302+00
3ab86e58-8494-4b8b-840a-d9dcc8a26b74	content_card	card-0yyd5uh8	update	{"id": "card-0yyd5uh8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-c7bgm0r7", "payload": {"row": 1, "colSpan": 1, "placeId": "place-tq7a7qkq", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": false, "region_id": null, "created_at": "2026-05-15T08:13:54.386808+00:00", "sort_order": 0, "district_id": "district-odeskyi", "section_key": "interesting"}	{"id": "card-0yyd5uh8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-c7bgm0r7", "payload": {"row": 1, "colSpan": 1, "placeId": "place-tq7a7qkq", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-odeskyi", "section_key": "interesting"}	vinilxd9@gmail.com	2026-05-15 08:13:57.509536+00
e21d45df-e357-49d4-9d82-8e267a76e5e2	content_card	card-0yyd5uh8	update	{"id": "card-0yyd5uh8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-c7bgm0r7", "payload": {"row": 1, "colSpan": 1, "placeId": "place-tq7a7qkq", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "created_at": "2026-05-15T08:13:54.386808+00:00", "sort_order": 0, "district_id": "district-odeskyi", "section_key": "interesting"}	{"id": "card-0yyd5uh8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-c7bgm0r7", "payload": {"row": 1, "colSpan": 2, "placeId": "place-tq7a7qkq", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-odeskyi", "section_key": "interesting"}	vinilxd9@gmail.com	2026-05-15 08:14:01.437596+00
64db423b-6331-49aa-8248-4eef4682ebd1	content_card	card-0yyd5uh8	update	{"id": "card-0yyd5uh8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-c7bgm0r7", "payload": {"row": 1, "colSpan": 2, "placeId": "place-tq7a7qkq", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "created_at": "2026-05-15T08:13:54.386808+00:00", "sort_order": 0, "district_id": "district-odeskyi", "section_key": "interesting"}	{"id": "card-0yyd5uh8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-c7bgm0r7", "payload": {"row": 1, "colSpan": 2, "placeId": "place-tq7a7qkq", "textSize": "lg", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-odeskyi", "section_key": "interesting"}	vinilxd9@gmail.com	2026-05-15 08:14:04.703549+00
c9896739-4eda-49b4-9ad1-09e962cac6df	content_card	card-7k2dwi9y	create	\N	{"id": "card-7k2dwi9y", "href": null, "title": "Тестова картка ЦІКАВЕ", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": "Тестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕ"}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "sort_order": 1, "district_id": null, "section_key": "interesting"}	vinilxd9@gmail.com	2026-05-15 08:15:18.559571+00
956ca7ad-6c60-400c-9f75-8c72c20e9524	content_card	card-7k2dwi9y	update	{"id": "card-7k2dwi9y", "href": null, "title": "Тестова картка ЦІКАВЕ", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": "Тестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕ"}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "created_at": "2026-05-15T08:15:18.213248+00:00", "sort_order": 1, "district_id": null, "section_key": "interesting"}	{"id": "card-7k2dwi9y", "href": null, "title": "Тестова картка ЦІКАВЕ", "city_id": null, "payload": {"row": 1, "colSpan": 2, "descSize": "sm", "textSize": "md", "description": "Тестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕ"}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "sort_order": 1, "district_id": null, "section_key": "interesting"}	vinilxd9@gmail.com	2026-05-15 08:15:24.186396+00
6225f3b6-560f-4e54-bd92-756c45bbdbca	content_card	card-7k2dwi9y	update	{"id": "card-7k2dwi9y", "href": null, "title": "Тестова картка ЦІКАВЕ", "city_id": null, "payload": {"row": 1, "colSpan": 2, "descSize": "sm", "textSize": "md", "description": "Тестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕ"}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "created_at": "2026-05-15T08:15:18.213248+00:00", "sort_order": 1, "district_id": null, "section_key": "interesting"}	{"id": "card-7k2dwi9y", "href": null, "title": "Тестова картка ЦІКАВЕ", "city_id": null, "payload": {"row": 2, "colSpan": 2, "descSize": "sm", "textSize": "md", "description": "Тестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕ"}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "sort_order": 1, "district_id": null, "section_key": "interesting"}	vinilxd9@gmail.com	2026-05-15 08:15:25.782424+00
eb8d3bca-8000-4eb9-a668-84c7f1c113a2	district	district-kdh3d5fc	create	\N	{"id": "district-kdh3d5fc", "name": "Одеський район", "slug": "e-a", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780385285286-j7d2dkfy8ef.png", "region_id": "region-odesa", "video_url": null, "description": null, "detailed_info": null}	vinilxd9@gmail.com	2026-06-02 07:29:19.979535+00
b2dbf571-e492-41f9-8662-04825a51f547	content_card	card-7k2dwi9y	update	{"id": "card-7k2dwi9y", "href": null, "title": "Тестова картка ЦІКАВЕ", "city_id": null, "payload": {"row": 2, "colSpan": 2, "descSize": "sm", "textSize": "md", "description": "Тестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕ"}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "created_at": "2026-05-15T08:15:18.213248+00:00", "sort_order": 1, "district_id": null, "section_key": "interesting"}	{"id": "card-7k2dwi9y", "href": null, "title": "Тестова картка ЦІКАВЕ", "city_id": null, "payload": {"row": 2, "colSpan": 2, "descSize": "md", "textSize": "md", "description": "Тестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕ"}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "sort_order": 1, "district_id": null, "section_key": "interesting"}	vinilxd9@gmail.com	2026-05-15 08:15:27.827928+00
64e9bb57-a6c2-450b-bb49-30126b2fe892	content_card	card-rxe5djz8	create	\N	{"id": "card-rxe5djz8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-c7bgm0r7", "payload": {"placeId": "place-tq7a7qkq", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-odeskyi", "section_key": "attractions"}	vinilxd9@gmail.com	2026-05-15 08:16:57.266013+00
c17e0a5f-614b-4deb-94ae-8d388875b83c	city	city-bilhorod	update	{"id": "city-bilhorod", "name": "Білгород-Дністровський", "slug": "bilhorod-dnistrovskyi", "subtitle": null, "image_url": null, "video_url": null, "created_at": "2026-04-28T13:23:37.956743+00:00", "description": null, "district_id": "district-bilhorod", "detailed_info": null}	{"id": "city-bilhorod", "name": "Білгород-Дністровський", "slug": "i-i", "subtitle": null, "image_url": null, "video_url": null, "description": null, "district_id": "district-bilhorod", "detailed_info": null}	vinilxd9@gmail.com	2026-05-15 20:13:22.713394+00
b33f38cb-220b-4825-aeb5-5eca51f12d7f	district	district-bilhorod	delete	{"id": "district-bilhorod", "name": "Білгород-Дністровський район", "slug": "bilhorod-dnistrovskyi-raion", "subtitle": null, "image_url": null, "region_id": "region-odesa", "video_url": null, "created_at": "2026-04-28T13:23:37.824432+00:00", "description": null, "detailed_info": null}	\N	vinilxd9@gmail.com	2026-06-02 07:20:02.302349+00
1894f371-acae-4f20-b25c-cf37cf1d1f1a	district	district-odeskyi	delete	{"id": "district-odeskyi", "name": "Одеський район", "slug": "odeskyi-raion", "subtitle": null, "image_url": null, "region_id": "region-odesa", "video_url": null, "created_at": "2026-04-28T13:23:37.824432+00:00", "description": null, "detailed_info": null}	\N	vinilxd9@gmail.com	2026-06-02 07:20:05.573138+00
6288dacf-f7bb-4b5c-aa85-a067be12b025	content_card	card-0yyd5uh8	delete	{"id": "card-0yyd5uh8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": null, "payload": {"row": 1, "colSpan": 2, "placeId": "place-tq7a7qkq", "textSize": "lg", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "created_at": "2026-05-15T08:13:54.386808+00:00", "sort_order": 0, "district_id": null, "section_key": "interesting"}	\N	vinilxd9@gmail.com	2026-06-02 07:20:28.411656+00
8a5d14f5-4d8a-4eba-b2f2-15ea846b3944	content_card	card-7k2dwi9y	delete	{"id": "card-7k2dwi9y", "href": null, "title": "Тестова картка ЦІКАВЕ", "city_id": null, "payload": {"row": 2, "colSpan": 2, "descSize": "md", "textSize": "md", "description": "Тестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕТестова картка ЦІКАВЕ"}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "created_at": "2026-05-15T08:15:18.213248+00:00", "sort_order": 1, "district_id": null, "section_key": "interesting"}	\N	vinilxd9@gmail.com	2026-06-02 07:20:32.838529+00
83726b42-af50-49e2-8941-88c0e64e003b	content_card	card-rxe5djz8	delete	{"id": "card-rxe5djz8", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": null, "payload": {"placeId": "place-tq7a7qkq", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\nТеатр є однією з найвизначніших архітектурних пам’яток України та символом Одеси.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "created_at": "2026-05-15T08:16:56.771812+00:00", "sort_order": 0, "district_id": null, "section_key": "attractions"}	\N	vinilxd9@gmail.com	2026-06-02 07:20:37.566637+00
d3e12225-20cd-4f4d-ac4f-511cc7631d9a	content_card	card-event-bessarabia	delete	{"id": "card-event-bessarabia", "href": "/podiyi/festyval-vyna-ta-smaku-bessarabii", "title": "Фестиваль вина та смаку Бессарабії", "city_id": null, "payload": {"badgeDay": "3", "badgeTop": "до", "badgeMonth": "травень"}, "page_key": "index", "subtitle": "Болград, 24.04 - 03.05.2026", "card_type": "event", "image_url": "https://images.unsplash.com/photo-1532635042-a6f6ad4745f9?auto=format&fit=crop&w=1200&q=80", "published": true, "region_id": "region-odesa", "created_at": "2026-04-28T13:23:38.194287+00:00", "sort_order": 1, "district_id": null, "section_key": "events"}	\N	vinilxd9@gmail.com	2026-06-02 07:20:40.886524+00
b7f43cf4-26e5-4b40-babc-3c059baa12f3	district	district-kdh3d5fc	update	{"id": "district-kdh3d5fc", "name": "Одеський район", "slug": "e-a", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780385285286-j7d2dkfy8ef.png", "region_id": "region-odesa", "video_url": null, "created_at": "2026-06-02T07:29:19.63542+00:00", "description": null, "detailed_info": null}	{"id": "district-kdh3d5fc", "name": "Одеський район", "slug": "e-a", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780385285286-j7d2dkfy8ef.png", "region_id": "region-odesa", "video_url": null, "description": null, "detailed_info": null}	vinilxd9@gmail.com	2026-06-02 07:30:29.27753+00
d290c6df-409d-4686-b65d-a9d528dd90ab	content_card	card-b777ywo3	create	\N	{"id": "card-b777ywo3", "href": "/napryamky/district-kdh3d5fc", "title": "Одеський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780385285286-j7d2dkfy8ef.png", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-kdh3d5fc", "section_key": "directions"}	vinilxd9@gmail.com	2026-06-02 07:30:45.160814+00
2d501ebd-e8ce-4dff-b141-3366edebb6d2	district	district-kdh3d5fc	update	{"id": "district-kdh3d5fc", "name": "Одеський район", "slug": "e-a", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780385285286-j7d2dkfy8ef.png", "region_id": "region-odesa", "video_url": null, "created_at": "2026-06-02T07:29:19.63542+00:00", "description": null, "detailed_info": null}	{"id": "district-kdh3d5fc", "name": "Одеський район", "slug": "e-a", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780385285286-j7d2dkfy8ef.png", "region_id": "region-odesa", "video_url": null, "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\n"}	vinilxd9@gmail.com	2026-06-02 07:49:27.910956+00
3f335a1a-f235-4134-8f92-a4ee675f0592	district	district-kdh3d5fc	delete	{"id": "district-kdh3d5fc", "name": "Одеський район", "slug": "e-a", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780385285286-j7d2dkfy8ef.png", "region_id": "region-odesa", "video_url": null, "created_at": "2026-06-02T07:29:19.63542+00:00", "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\n"}	\N	\N	2026-06-02 07:50:16.038623+00
7f6c8393-09f9-4ad3-a00f-0c8ff62ef977	district	district-lnl5yh41	create	\N	{"id": "district-lnl5yh41", "name": "Одеський район", "slug": "odeskyy-rayon", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780386656833-v4byot5lrur.png", "region_id": "region-odesa", "video_url": null, "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\n"}	\N	2026-06-02 07:51:07.492228+00
176ca631-ab7a-41f5-a3ae-c4e39d043ce2	content_card	card-b777ywo3	delete	{"id": "card-b777ywo3", "href": "/napryamky/district-kdh3d5fc", "title": "Одеський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780385285286-j7d2dkfy8ef.png", "published": true, "region_id": null, "created_at": "2026-06-02T07:30:44.868734+00:00", "sort_order": 0, "district_id": null, "section_key": "directions"}	\N	\N	2026-06-02 07:51:44.076147+00
e35184ae-4d1f-4728-950b-ad7e1655236c	content_card	card-1g5idjct	create	\N	{"id": "card-1g5idjct", "href": "/raion/odeskyy-rayon", "title": "Одеський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780386656833-v4byot5lrur.png", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-lnl5yh41", "section_key": "directions"}	\N	2026-06-02 07:51:46.185783+00
88f4b0e9-1ca0-49ee-a177-59f303bcce80	content_card	card-h4rrr0co	delete	{"id": "card-h4rrr0co", "href": "/napryamky/district-uvv38np5", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "created_at": "2026-06-02T11:40:46.233414+00:00", "sort_order": 1, "district_id": null, "section_key": "directions"}	\N	vinilxd9@gmail.com	2026-06-02 12:39:07.052748+00
bfa5abb7-336d-4c27-bea2-25f3576b59da	district	district-lnl5yh41	update	{"id": "district-lnl5yh41", "name": "Одеський район", "slug": "odeskyy-rayon", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780386656833-v4byot5lrur.png", "region_id": "region-odesa", "video_url": null, "created_at": "2026-06-02T07:51:07.36495+00:00", "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\n"}	{"id": "district-lnl5yh41", "name": "Одеський район", "slug": "e-a", "subtitle": "popa", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780386656833-v4byot5lrur.png", "region_id": "region-odesa", "video_url": null, "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\n"}	vinilxd9@gmail.com	2026-06-02 07:55:46.167859+00
b4e84ae4-36ba-4907-ad26-044a5e00506d	district	district-lnl5yh41	delete	{"id": "district-lnl5yh41", "name": "Одеський район", "slug": "e-a", "subtitle": "popa", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780386656833-v4byot5lrur.png", "region_id": "region-odesa", "video_url": null, "created_at": "2026-06-02T07:51:07.36495+00:00", "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\n"}	\N	\N	2026-06-02 08:00:25.848176+00
6a67ffca-bc03-4b2a-b1e9-2f3103bb5a83	content_card	card-1g5idjct	delete	{"id": "card-1g5idjct", "href": "/raion/odeskyy-rayon", "title": "Одеський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780386656833-v4byot5lrur.png", "published": true, "region_id": null, "created_at": "2026-06-02T07:51:46.080958+00:00", "sort_order": 0, "district_id": null, "section_key": "directions"}	\N	\N	2026-06-02 08:00:31.352585+00
f6182455-80af-4fd1-9beb-047d1937da0c	district	district-c6ididsh	create	\N	{"id": "district-c6ididsh", "name": "Одеський район", "slug": "odeskyy-rayon", "subtitle": "Туристичний паспорт", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780387299909-xyfts4zyf4i.png", "region_id": "region-odesa", "video_url": null, "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\nОсобливе місце займає культурна спадщина району. Історичний центр Одеси, внесений до Списку всесвітньої спадщини ЮНЕСКО, Одеський національний академічний театр опери та балету, Потьомкінські сходи, Приморський бульвар та численні архітектурні пам’ятки формують унікальний туристичний образ регіону.\\nОдеський район також відомий своїми виноробнями, фермерськими господарствами, гастрономічними локаціями та закладами гостинності. Тут можна скуштувати локальні вина, морепродукти, фермерські сири та інші традиційні продукти півдня України. Численні фестивалі, культурні події та гастрономічні заходи протягом року роблять район одним із найдинамічніших туристичних напрямків країни.\\nОдеський район — це місце, де в межах однієї подорожі можна поєднати морський відпочинок, знайомство з історією та культурою, гастрономічні відкриття, відпочинок на природі та оздоровлення. Саме це різноманіття вражень робить його однією з найпривабливіших туристичних дестинацій України.\\n"}	\N	2026-06-02 08:01:45.337726+00
535474d7-816d-49d7-8a45-6d7f2fae0a5f	content_card	card-xiu6i1c5	create	\N	{"id": "card-xiu6i1c5", "href": "/raion/odeskyy-rayon", "title": "Одеський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780387299909-xyfts4zyf4i.png", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-c6ididsh", "section_key": "directions"}	\N	2026-06-02 08:01:54.102126+00
56d9f9db-b97e-4a71-a70d-e2e5a03aba55	district	district-c6ididsh	update	{"id": "district-c6ididsh", "name": "Одеський район", "slug": "odeskyy-rayon", "subtitle": "Туристичний паспорт", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780387299909-xyfts4zyf4i.png", "region_id": "region-odesa", "video_url": null, "created_at": "2026-06-02T08:01:45.22002+00:00", "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\nОсобливе місце займає культурна спадщина району. Історичний центр Одеси, внесений до Списку всесвітньої спадщини ЮНЕСКО, Одеський національний академічний театр опери та балету, Потьомкінські сходи, Приморський бульвар та численні архітектурні пам’ятки формують унікальний туристичний образ регіону.\\nОдеський район також відомий своїми виноробнями, фермерськими господарствами, гастрономічними локаціями та закладами гостинності. Тут можна скуштувати локальні вина, морепродукти, фермерські сири та інші традиційні продукти півдня України. Численні фестивалі, культурні події та гастрономічні заходи протягом року роблять район одним із найдинамічніших туристичних напрямків країни.\\nОдеський район — це місце, де в межах однієї подорожі можна поєднати морський відпочинок, знайомство з історією та культурою, гастрономічні відкриття, відпочинок на природі та оздоровлення. Саме це різноманіття вражень робить його однією з найпривабливіших туристичних дестинацій України.\\n"}	{"id": "district-c6ididsh", "name": "Одеський район", "slug": "odeskyy-rayon", "subtitle": "Туристичний паспорт", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780387299909-xyfts4zyf4i.png", "region_id": "region-odesa", "video_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780388673274-z07a9vrwjci.mp4", "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\nОсобливе місце займає культурна спадщина району. Історичний центр Одеси, внесений до Списку всесвітньої спадщини ЮНЕСКО, Одеський національний академічний театр опери та балету, Потьомкінські сходи, Приморський бульвар та численні архітектурні пам’ятки формують унікальний туристичний образ регіону.\\nОдеський район також відомий своїми виноробнями, фермерськими господарствами, гастрономічними локаціями та закладами гостинності. Тут можна скуштувати локальні вина, морепродукти, фермерські сири та інші традиційні продукти півдня України. Численні фестивалі, культурні події та гастрономічні заходи протягом року роблять район одним із найдинамічніших туристичних напрямків країни.\\nОдеський район — це місце, де в межах однієї подорожі можна поєднати морський відпочинок, знайомство з історією та культурою, гастрономічні відкриття, відпочинок на природі та оздоровлення. Саме це різноманіття вражень робить його однією з найпривабливіших туристичних дестинацій України.\\n"}	\N	2026-06-02 08:24:40.881133+00
5cdaed44-8fc3-4dbe-95f5-efdbbe013d42	city	city-s56s03ad	create	\N	{"id": "city-s56s03ad", "name": "Овідіополь", "slug": "ovidiopol", "subtitle": "Туристичний паспорт", "image_url": "https://travels.in.ua/api/Photo/PhotoStreamCIL/3896", "video_url": null, "description": "Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.\\n", "district_id": "district-c6ididsh", "detailed_info": "Територія сучасного Овідіополя була заселена ще з давніх часів. Археологічні дослідження виявили тут залишки шести давніх поселень: два належать до скіфського періоду (IV–III ст. до н. е.), два - до сарматського (II ст. до н. е. - III ст. н. е.), а ще два містять пам’ятки черняхівської культури (III-V ст. н. е.).\\nУ XVI столітті на цьому місці існувало місто-фортеця Чорногрод, засноване Василем Красним. Пізніше тут виникло кримськотатарське поселення Хаджидер, яке було важливим торговим пунктом і портом. Під час російсько-турецької війни 1768-1774 років поселення було зруйноване запорозькими козаками.\\nПісля завершення російсько-турецької війни 1787-1791 років біля колишнього Хаджидера розпочалося будівництво нової фортеці та адміралтейства. Фортеця була зведена у 1793 році за проєктом інженера Франца де Волана під керівництвом інженер-капітана Є. Ферстера. Вона стала частиною системи оборонних укріплень на новому кордоні з Османською імперією разом із Тираспольською та Хаджибейською фортецями.\\nУ 1795 році за указом імператриці Катерини II фортецю і місто було перейменовано на Овідіополь. Назву пов’язують із легендою про римського поета Овідія, який перебував у засланні на узбережжі Чорного моря.\\n"}	\N	2026-06-02 08:49:40.079409+00
feacc353-3e0c-4248-89a3-f5afcc955200	city	city-s56s03ad	update	{"id": "city-s56s03ad", "name": "Овідіополь", "slug": "ovidiopol", "subtitle": "Туристичний паспорт", "image_url": "https://travels.in.ua/api/Photo/PhotoStreamCIL/3896", "video_url": null, "created_at": "2026-06-02T08:49:39.894187+00:00", "description": "Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.\\n", "district_id": "district-c6ididsh", "detailed_info": "Територія сучасного Овідіополя була заселена ще з давніх часів. Археологічні дослідження виявили тут залишки шести давніх поселень: два належать до скіфського періоду (IV–III ст. до н. е.), два - до сарматського (II ст. до н. е. - III ст. н. е.), а ще два містять пам’ятки черняхівської культури (III-V ст. н. е.).\\nУ XVI столітті на цьому місці існувало місто-фортеця Чорногрод, засноване Василем Красним. Пізніше тут виникло кримськотатарське поселення Хаджидер, яке було важливим торговим пунктом і портом. Під час російсько-турецької війни 1768-1774 років поселення було зруйноване запорозькими козаками.\\nПісля завершення російсько-турецької війни 1787-1791 років біля колишнього Хаджидера розпочалося будівництво нової фортеці та адміралтейства. Фортеця була зведена у 1793 році за проєктом інженера Франца де Волана під керівництвом інженер-капітана Є. Ферстера. Вона стала частиною системи оборонних укріплень на новому кордоні з Османською імперією разом із Тираспольською та Хаджибейською фортецями.\\nУ 1795 році за указом імператриці Катерини II фортецю і місто було перейменовано на Овідіополь. Назву пов’язують із легендою про римського поета Овідія, який перебував у засланні на узбережжі Чорного моря.\\n"}	{"id": "city-s56s03ad", "name": "Овідіополь", "slug": "ovidiopol", "subtitle": "Туристичний паспорт", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780390215526-0kqh1hc2mxja.jpeg", "video_url": null, "description": "Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.\\n", "district_id": "district-c6ididsh", "detailed_info": "Територія сучасного Овідіополя була заселена ще з давніх часів. Археологічні дослідження виявили тут залишки шести давніх поселень: два належать до скіфського періоду (IV–III ст. до н. е.), два - до сарматського (II ст. до н. е. - III ст. н. е.), а ще два містять пам’ятки черняхівської культури (III-V ст. н. е.).\\nУ XVI столітті на цьому місці існувало місто-фортеця Чорногрод, засноване Василем Красним. Пізніше тут виникло кримськотатарське поселення Хаджидер, яке було важливим торговим пунктом і портом. Під час російсько-турецької війни 1768-1774 років поселення було зруйноване запорозькими козаками.\\nПісля завершення російсько-турецької війни 1787-1791 років біля колишнього Хаджидера розпочалося будівництво нової фортеці та адміралтейства. Фортеця була зведена у 1793 році за проєктом інженера Франца де Волана під керівництвом інженер-капітана Є. Ферстера. Вона стала частиною системи оборонних укріплень на новому кордоні з Османською імперією разом із Тираспольською та Хаджибейською фортецями.\\nУ 1795 році за указом імператриці Катерини II фортецю і місто було перейменовано на Овідіополь. Назву пов’язують із легендою про римського поета Овідія, який перебував у засланні на узбережжі Чорного моря.\\n"}	\N	2026-06-02 08:50:18.711766+00
e606299f-6693-436c-b8ea-fbb3a133f5d3	city	city-s56s03ad	update	{"id": "city-s56s03ad", "name": "Овідіополь", "slug": "ovidiopol", "subtitle": "Туристичний паспорт", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780390215526-0kqh1hc2mxja.jpeg", "video_url": null, "created_at": "2026-06-02T08:49:39.894187+00:00", "description": "Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.\\n", "district_id": "district-c6ididsh", "detailed_info": "Територія сучасного Овідіополя була заселена ще з давніх часів. Археологічні дослідження виявили тут залишки шести давніх поселень: два належать до скіфського періоду (IV–III ст. до н. е.), два - до сарматського (II ст. до н. е. - III ст. н. е.), а ще два містять пам’ятки черняхівської культури (III-V ст. н. е.).\\nУ XVI столітті на цьому місці існувало місто-фортеця Чорногрод, засноване Василем Красним. Пізніше тут виникло кримськотатарське поселення Хаджидер, яке було важливим торговим пунктом і портом. Під час російсько-турецької війни 1768-1774 років поселення було зруйноване запорозькими козаками.\\nПісля завершення російсько-турецької війни 1787-1791 років біля колишнього Хаджидера розпочалося будівництво нової фортеці та адміралтейства. Фортеця була зведена у 1793 році за проєктом інженера Франца де Волана під керівництвом інженер-капітана Є. Ферстера. Вона стала частиною системи оборонних укріплень на новому кордоні з Османською імперією разом із Тираспольською та Хаджибейською фортецями.\\nУ 1795 році за указом імператриці Катерини II фортецю і місто було перейменовано на Овідіополь. Назву пов’язують із легендою про римського поета Овідія, який перебував у засланні на узбережжі Чорного моря.\\n"}	{"id": "city-s56s03ad", "name": "Овідіополь", "slug": "ovidiopol", "subtitle": "Туристичний паспорт", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780390215526-0kqh1hc2mxja.jpeg", "video_url": null, "description": "Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.\\n", "district_id": "district-c6ididsh", "detailed_info": "Територія сучасного Овідіополя була заселена ще з давніх часів. Археологічні дослідження виявили тут залишки шести давніх поселень: два належать до скіфського періоду (IV–III ст. до н. е.), два - до сарматського (II ст. до н. е. - III ст. н. е.), а ще два містять пам’ятки черняхівської культури (III-V ст. н. е.).\\nУ XVI столітті на цьому місці існувало місто-фортеця Чорногрод, засноване Василем Красним. Пізніше тут виникло кримськотатарське поселення Хаджидер, яке було важливим торговим пунктом і портом. Під час російсько-турецької війни 1768-1774 років поселення було зруйноване запорозькими козаками.\\nПісля завершення російсько-турецької війни 1787-1791 років біля колишнього Хаджидера розпочалося будівництво нової фортеці та адміралтейства. Фортеця була зведена у 1793 році за проєктом інженера Франца де Волана під керівництвом інженер-капітана Є. Ферстера. Вона стала частиною системи оборонних укріплень на новому кордоні з Османською імперією разом із Тираспольською та Хаджибейською фортецями.\\nУ 1795 році за указом імператриці Катерини II фортецю і місто було перейменовано на Овідіополь. Назву пов’язують із легендою про римського поета Овідія, який перебував у засланні на узбережжі Чорного моря.\\n"}	\N	2026-06-02 08:52:29.585265+00
817b4f8b-0296-40f2-81c5-dec21023a930	city	city-p4xh35h1	create	\N	{"id": "city-p4xh35h1", "name": "Одеса", "slug": "odesa", "subtitle": null, "image_url": "https://omr.gov.ua/images/galleries/maxi/51834.jpg", "video_url": null, "description": null, "district_id": "district-c6ididsh", "detailed_info": null}	\N	2026-06-02 09:01:36.115853+00
bae1134c-28c8-4ac1-a6ae-f78e6d4e6cd5	tourism_object	place-e39bxti7	create	\N	{"id": "place-e39bxti7", "name": "VIVAT BALLET!", "slug": "vivat-ballet-u00u9c", "type": "event", "hours": null, "phone": null, "address": null, "city_id": "city-p4xh35h1", "map_url": "https://maps.app.goo.gl/XQ2tQkSjc72eevSUA", "website": null, "subtitle": "Гала-концерт на два відділення", "amenities": null, "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1776830861.jpg", "published": true, "video_url": null, "description": "Очікуємо на витонченому гала-концерті «Vivat, ballet!», яка поєднає улюблені глядачами світові шедеври балетної класики та хіти сучасної хореографії, що вражають красою і технікою, вишуканістю і майстерністю, занурюють глядача в особливий, емоціональний світ прекрасного. Цим номерам аплодувала Європа та кращі театральні зали світу, і ось – вони на славетній сцені Одеської опери.", "district_id": "district-c6ididsh", "event_dates": "10 - 11 ЛИПНЯ 2026", "detailed_info": null, "tourism_types": ["Розважальний туризм", "Історико-культурний туризм"]}	\N	2026-06-02 09:03:53.969451+00
81800a2e-739c-45aa-bb41-754d69f41f41	content_card	card-houw3nwx	create	\N	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "sort_order": 7, "district_id": "district-btn5o6n3", "section_key": "directions"}	vinilxd9@gmail.com	2026-06-02 12:39:10.068891+00
df2f452c-2870-4f50-a219-220ec6702bbb	content_card	card-9i8o9wbp	create	\N	{"id": "card-9i8o9wbp", "href": null, "title": "VIVAT BALLET!", "city_id": "city-p4xh35h1", "payload": {"placeId": "place-e39bxti7", "badgeDay": "10", "badgeTop": "до", "badgeMonth": "", "description": "Очікуємо на витонченому гала-концерті «Vivat, ballet!», яка поєднає улюблені глядачами світові шедеври балетної класики та хіти сучасної хореографії, що вражають красою і технікою, вишуканістю і майстерністю, занурюють глядача в особливий, емоціональний світ прекрасного. Цим номерам аплодувала Європа та кращі театральні зали світу, і ось – вони на славетній сцені Одеської опери."}, "page_key": "index", "subtitle": "Одеса", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1776830861.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-c6ididsh", "section_key": "events"}	\N	2026-06-02 09:04:17.286667+00
1005d00f-5dff-484a-b05e-303804ab2ac6	content_card	card-9i8o9wbp	update	{"id": "card-9i8o9wbp", "href": null, "title": "VIVAT BALLET!", "city_id": "city-p4xh35h1", "payload": {"placeId": "place-e39bxti7", "badgeDay": "10", "badgeTop": "до", "badgeMonth": "", "description": "Очікуємо на витонченому гала-концерті «Vivat, ballet!», яка поєднає улюблені глядачами світові шедеври балетної класики та хіти сучасної хореографії, що вражають красою і технікою, вишуканістю і майстерністю, занурюють глядача в особливий, емоціональний світ прекрасного. Цим номерам аплодувала Європа та кращі театральні зали світу, і ось – вони на славетній сцені Одеської опери."}, "page_key": "index", "subtitle": "Одеса", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1776830861.jpg", "published": true, "region_id": null, "created_at": "2026-06-02T09:04:17.193716+00:00", "sort_order": 0, "district_id": "district-c6ididsh", "section_key": "events"}	{"id": "card-9i8o9wbp", "href": null, "title": "VIVAT BALLET!", "city_id": "city-p4xh35h1", "payload": {"placeId": "place-e39bxti7", "badgeDay": "", "badgeTop": "10 - 11", "badgeMonth": "липня", "description": "Очікуємо на витонченому гала-концерті «Vivat, ballet!», яка поєднає улюблені глядачами світові шедеври балетної класики та хіти сучасної хореографії, що вражають красою і технікою, вишуканістю і майстерністю, занурюють глядача в особливий, емоціональний світ прекрасного. Цим номерам аплодувала Європа та кращі театральні зали світу, і ось – вони на славетній сцені Одеської опери."}, "page_key": "index", "subtitle": "Одеса", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1776830861.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-c6ididsh", "section_key": "events"}	\N	2026-06-02 09:04:54.040162+00
d7833a5f-ac87-462d-bb45-7ac01d00730a	district	district-c6ididsh	update	{"id": "district-c6ididsh", "name": "Одеський район", "slug": "odeskyy-rayon", "subtitle": "Туристичний паспорт", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780387299909-xyfts4zyf4i.png", "region_id": "region-odesa", "video_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780388673274-z07a9vrwjci.mp4", "created_at": "2026-06-02T08:01:45.22002+00:00", "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\nОсобливе місце займає культурна спадщина району. Історичний центр Одеси, внесений до Списку всесвітньої спадщини ЮНЕСКО, Одеський національний академічний театр опери та балету, Потьомкінські сходи, Приморський бульвар та численні архітектурні пам’ятки формують унікальний туристичний образ регіону.\\nОдеський район також відомий своїми виноробнями, фермерськими господарствами, гастрономічними локаціями та закладами гостинності. Тут можна скуштувати локальні вина, морепродукти, фермерські сири та інші традиційні продукти півдня України. Численні фестивалі, культурні події та гастрономічні заходи протягом року роблять район одним із найдинамічніших туристичних напрямків країни.\\nОдеський район — це місце, де в межах однієї подорожі можна поєднати морський відпочинок, знайомство з історією та культурою, гастрономічні відкриття, відпочинок на природі та оздоровлення. Саме це різноманіття вражень робить його однією з найпривабливіших туристичних дестинацій України.\\n"}	{"id": "district-c6ididsh", "name": "Одеський район", "slug": "odeskyy-rayon", "subtitle": "Туристичний паспорт", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780387299909-xyfts4zyf4i.png", "region_id": "region-odesa", "video_url": null, "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\nОсобливе місце займає культурна спадщина району. Історичний центр Одеси, внесений до Списку всесвітньої спадщини ЮНЕСКО, Одеський національний академічний театр опери та балету, Потьомкінські сходи, Приморський бульвар та численні архітектурні пам’ятки формують унікальний туристичний образ регіону.\\nОдеський район також відомий своїми виноробнями, фермерськими господарствами, гастрономічними локаціями та закладами гостинності. Тут можна скуштувати локальні вина, морепродукти, фермерські сири та інші традиційні продукти півдня України. Численні фестивалі, культурні події та гастрономічні заходи протягом року роблять район одним із найдинамічніших туристичних напрямків країни.\\nОдеський район — це місце, де в межах однієї подорожі можна поєднати морський відпочинок, знайомство з історією та культурою, гастрономічні відкриття, відпочинок на природі та оздоровлення. Саме це різноманіття вражень робить його однією з найпривабливіших туристичних дестинацій України.\\n"}	\N	2026-06-02 09:06:19.492057+00
dabc7ee2-44d7-4cf5-ae94-b5bee9e0461c	tourism_object	place-e39bxti7	update	{"id": "place-e39bxti7", "name": "VIVAT BALLET!", "slug": "vivat-ballet-u00u9c", "type": "event", "hours": null, "phone": null, "address": null, "city_id": "city-p4xh35h1", "map_url": "https://maps.app.goo.gl/XQ2tQkSjc72eevSUA", "website": null, "subtitle": "Гала-концерт на два відділення", "amenities": null, "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1776830861.jpg", "published": true, "video_url": null, "created_at": "2026-06-02T09:03:53.851725+00:00", "description": "Очікуємо на витонченому гала-концерті «Vivat, ballet!», яка поєднає улюблені глядачами світові шедеври балетної класики та хіти сучасної хореографії, що вражають красою і технікою, вишуканістю і майстерністю, занурюють глядача в особливий, емоціональний світ прекрасного. Цим номерам аплодувала Європа та кращі театральні зали світу, і ось – вони на славетній сцені Одеської опери.", "district_id": "district-c6ididsh", "event_dates": "10 - 11 ЛИПНЯ 2026", "detailed_info": null, "tourism_types": ["Розважальний туризм", "Історико-культурний туризм"]}	{"id": "place-e39bxti7", "name": "VIVAT BALLET!", "slug": "vivat-ballet-u00u9c", "type": "event", "hours": null, "phone": null, "address": null, "city_id": "city-p4xh35h1", "map_url": "https://maps.app.goo.gl/XQ2tQkSjc72eevSUA", "website": null, "subtitle": "Гала-концерт на два відділення", "amenities": null, "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1776830861.jpg", "published": true, "video_url": null, "description": "Очікуємо на витонченому гала-концерті «Vivat, ballet!», яка поєднає улюблені глядачами світові шедеври балетної класики та хіти сучасної хореографії, що вражають красою і технікою, вишуканістю і майстерністю, занурюють глядача в особливий, емоціональний світ прекрасного. Цим номерам аплодувала Європа та кращі театральні зали світу, і ось – вони на славетній сцені Одеської опери.", "district_id": "district-c6ididsh", "event_dates": "10 - 11 ЛИПНЯ 2026", "detailed_info": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", "tourism_types": ["Розважальний туризм", "Історико-культурний туризм"]}	\N	2026-06-02 09:09:24.876367+00
1570eb1c-8a58-43dd-b590-07ba97aabe1a	tourism_object	place-5yr7dl7x	create	\N	{"id": "place-5yr7dl7x", "name": "Hotel Bristol Odesa", "slug": "hotel-bristol-odesa-udwtyb", "type": "hotel", "hours": null, "phone": "+380991234567", "address": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://bristol-hotel.com.ua", "subtitle": "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequa", "amenities": "Просторий вестибюль, Ресторан класичної кухні, Лаунж-бар, SPA-зона (сауна, джакузі), Фітнес-зал, Переговорні та конференц-зали, Бізнес-центр, Послуги пральні та хімчистки, Трансфер, паркування, 24/7 рецепція, room service, консьєрж-сервіс, допомога з трансфером, бронювання екскурсій, кейтеринг, організація свят, бізнес-послуги", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "video_url": null, "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. ", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", "tourism_types": []}	\N	2026-06-02 09:19:35.71155+00
4926141d-80e9-457c-a065-1c257b65a516	tourism_object	place-zcowiw5a	create	\N	{"id": "place-zcowiw5a", "name": "Tatar Bunar", "slug": "tatar-bunar-e57xwc", "type": "restaurant", "hours": "Пн-Нд 10:00-22:00", "phone": "+380971234567", "address": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.instagram.com/tatar.bunar.odesa/ ", "subtitle": "ресторан / заклад харчування", "amenities": null, "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "video_url": null, "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Гастрономічний профіль\\nКухня:\\nазіатсько-середземноморські елементи з локальними традиціями;\\nавтентичні та сучасні страви бессарабського регіону (вареники, супи, мамалига, бринза, локальні супи тощо);\\nвипічка ручної роботи, приготована в дров’яній печі;\\nвикористання якісних місцевих продуктів і українських вин.\\nРесторан подає страви, що ґрунтуються на кухонних традиціях Півдня України і Бессарабії, адаптованих у сучасній інтерпретації.\\nТуристична привабливість\\n✔ унікальне гастрономічне місце з регіональними мотивами;\\n✔ популярний як серед місцевих, так і серед гостей міста;\\n✔ входить до гастрономічних рекомендацій Одеси;\\n✔ можливість поєднати з відвідуванням інших культурних та туристичних об’єктів центру міста.\\nІнфраструктура\\n – просторі зали для обідів та вечерь;\\n – літня тераса (за сезоном);\\n – винна карта з українськими винами;\\n – літній сад і можливість організації подій;\\n – оформлення інтер’єру з елементами місцевої культури.\\nТуристичне значення\\n«Tatar Bunar» - важлива гастрономічна точка Одеси, що презентує автентичну бессарабську кухню в сучасному форматі. Заклад не лише працює як ресторан, але й сприяє культурному та гастрономічному туризму, інтегруючись у локальні маршрути та пропозиції для туристів, охочих знайомитись із кулінарною спадщиною південного регіону України. \\n", "tourism_types": ["Гастрономічний туризм"]}	\N	2026-06-02 09:23:44.217859+00
57da4139-4be7-4877-8aa7-26a42b824f57	content_card	card-ehav4ou1	create	\N	{"id": "card-ehav4ou1", "href": null, "title": "Hotel Bristol Odesa", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-5yr7dl7x", "textSize": "md", "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. "}, "page_key": "index", "subtitle": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "card_type": "hotel", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:24:02.691283+00
fac3ec9c-2533-4f81-b57f-3c7486cd8a74	content_card	tourism-type-гастрономічний-туризм	create	\N	{"id": "tourism-type-гастрономічний-туризм", "href": null, "title": "Гастрономічний туризм", "city_id": null, "payload": {}, "page_key": "tourism-types", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405345653.png", "published": true, "region_id": null, "sort_order": 0, "district_id": null, "section_key": "type"}	vinilxd9@gmail.com	2026-06-02 13:02:28.630916+00
50bf6bbc-680e-4d6a-9dd8-983875ac2d89	content_card	card-acl93be4	create	\N	{"id": "card-acl93be4", "href": null, "title": "Tatar Bunar", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-zcowiw5a", "textSize": "md", "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n"}, "page_key": "index", "subtitle": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "card_type": "restaurant", "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "region_id": null, "sort_order": 1, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:24:04.500679+00
c8078984-7555-45c7-9198-f40d1858a8c2	content_card	card-ehav4ou1	update	{"id": "card-ehav4ou1", "href": null, "title": "Hotel Bristol Odesa", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-5yr7dl7x", "textSize": "md", "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. "}, "page_key": "index", "subtitle": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "card_type": "hotel", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "region_id": null, "created_at": "2026-06-02T09:24:02.579124+00:00", "sort_order": 0, "district_id": "district-c6ididsh", "section_key": "interesting"}	{"id": "card-ehav4ou1", "href": null, "title": "Hotel Bristol Odesa", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 2, "placeId": "place-5yr7dl7x", "textSize": "md", "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. "}, "page_key": "index", "subtitle": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "card_type": "hotel", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:24:10.658395+00
1ccf3447-b617-4efb-89c8-8db423e6bd5d	tourism_object	place-5yr7dl7x	update	{"id": "place-5yr7dl7x", "name": "Hotel Bristol Odesa", "slug": "hotel-bristol-odesa-udwtyb", "type": "hotel", "hours": null, "phone": "+380991234567", "address": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://bristol-hotel.com.ua", "subtitle": "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequa", "amenities": "Просторий вестибюль, Ресторан класичної кухні, Лаунж-бар, SPA-зона (сауна, джакузі), Фітнес-зал, Переговорні та конференц-зали, Бізнес-центр, Послуги пральні та хімчистки, Трансфер, паркування, 24/7 рецепція, room service, консьєрж-сервіс, допомога з трансфером, бронювання екскурсій, кейтеринг, організація свят, бізнес-послуги", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "video_url": null, "created_at": "2026-06-02T09:19:35.525983+00:00", "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. ", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", "tourism_types": []}	{"id": "place-5yr7dl7x", "name": "Hotel Bristol Odesa", "slug": "hotel-bristol-odesa-udwtyb", "type": "hotel", "hours": null, "phone": "+380991234567", "address": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://bristol-hotel.com.ua", "subtitle": "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequa", "amenities": "Просторий вестибюль, Ресторан класичної кухні, Лаунж-бар, SPA-зона (сауна, джакузі), Фітнес-зал", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "video_url": null, "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. ", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", "tourism_types": []}	\N	2026-06-02 09:25:59.549971+00
e375c52a-710e-4987-b0cd-4f1f03ec7178	tourism_object	place-91d5orj4	create	\N	{"id": "place-91d5orj4", "name": "Одеський національний академічний театр опери та балету", "slug": "odeskyy-natsionalnyy-akademichnyy-teatr-opery-ta-baletu-4vowjn", "type": "attraction", "hours": null, "phone": null, "address": null, "city_id": "city-p4xh35h1", "map_url": "https://maps.app.goo.gl/XQ2tQkSjc72eevSUA", "website": null, "subtitle": "пам’ятка архітектури національного значення", "amenities": null, "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "video_url": null, "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Одеський національний академічний театр опери та балету є однією з найвизначніших архітектурних пам’яток України та головним символом міста Одеси. Його історія розпочалася у 1810 році, коли було відкрито першу будівлю театру. Після нищівної пожежі 1873 року споруду відбудували заново за грандіозним проєктом відомих віденських архітекторів Фердинанда Фельнера та Германа Гельмера, а урочисте відкриття сучасної будівлі відбулося у 1887 році. Сьогодні ця велична споруда закономірно входить до переліку пам’яток архітектури національного значення.\\nГоловною окрасою театру є його унікальні архітектурні особливості. Будівля виконана у витонченому стилі віденського необароко та приваблює погляди розкішним фасадом із величними скульптурними композиціями. Внутрішній простір вражає підковоподібною формою глядацької зали, яка славиться своєю неповторною акустикою, а також багатим декором інтер’єрів з вишуканою ліпниною, яскравою позолотою та розкішними кришталевими люстрами.\\nМаючи статус національного, театр залишається одним із провідних музичних осередків країни. Його багата мистецька діяльність та різноплановий репертуар включають класичні та сучасні опери, витончені балетні постановки, масштабні симфонічні концерти, а також різноманітні фестивальні, міжнародні проєкти та захопливі гастрольні програми.", "tourism_types": ["Історико-культурний туризм"]}	\N	2026-06-02 09:36:02.632531+00
f7af8773-f2ca-4568-b97d-757f7cb8086a	content_card	card-gmy20dew	create	\N	{"id": "card-gmy20dew", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-p4xh35h1", "payload": {"placeId": "place-91d5orj4", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": "district-c6ididsh", "section_key": "attractions"}	\N	2026-06-02 09:36:12.007737+00
b2b7f0bd-07cf-4d1b-ad8c-d8e04649bc83	content_card	tourism-type-історико-культурний-туризм	create	\N	{"id": "tourism-type-історико-культурний-туризм", "href": null, "title": "Історико-культурний туризм", "city_id": null, "payload": {}, "page_key": "tourism-types", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405349569.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": null, "section_key": "type"}	vinilxd9@gmail.com	2026-06-02 13:02:31.071533+00
c61570e4-2e42-4a11-9ddc-2f615f7be68e	content_card	card-hkjkn9fr	create	\N	{"id": "card-hkjkn9fr", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-91d5orj4", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "sort_order": 2, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:36:30.999872+00
d3fb192f-d34d-4510-a3b7-06de24764b27	content_card	card-kw2mkhw5	create	\N	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "sort_order": 3, "district_id": null, "section_key": "interesting"}	\N	2026-06-02 09:36:59.82983+00
55d1c4a2-b7a7-43c1-ba2f-1322d6ec2895	content_card	card-kw2mkhw5	update	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "created_at": "2026-06-02T09:36:59.718153+00:00", "sort_order": 3, "district_id": null, "section_key": "interesting"}	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "sort_order": 2, "district_id": null, "section_key": "interesting"}	\N	2026-06-02 09:37:01.314331+00
a5596716-68cf-48b7-978f-e79091b0ea6e	content_card	card-hkjkn9fr	update	{"id": "card-hkjkn9fr", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-91d5orj4", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "created_at": "2026-06-02T09:36:30.904373+00:00", "sort_order": 2, "district_id": "district-c6ididsh", "section_key": "interesting"}	{"id": "card-hkjkn9fr", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-91d5orj4", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "sort_order": 3, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:37:01.324452+00
05202a52-200d-4145-bb81-0fa2acccef72	content_card	card-kw2mkhw5	update	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "created_at": "2026-06-02T09:36:59.718153+00:00", "sort_order": 2, "district_id": null, "section_key": "interesting"}	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "sort_order": 1, "district_id": null, "section_key": "interesting"}	\N	2026-06-02 09:37:02.817564+00
2749d8d5-726c-4c01-b352-4d43d2197969	content_card	card-acl93be4	update	{"id": "card-acl93be4", "href": null, "title": "Tatar Bunar", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-zcowiw5a", "textSize": "md", "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n"}, "page_key": "index", "subtitle": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "card_type": "restaurant", "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "region_id": null, "created_at": "2026-06-02T09:24:04.408171+00:00", "sort_order": 1, "district_id": "district-c6ididsh", "section_key": "interesting"}	{"id": "card-acl93be4", "href": null, "title": "Tatar Bunar", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-zcowiw5a", "textSize": "md", "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n"}, "page_key": "index", "subtitle": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "card_type": "restaurant", "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "region_id": null, "sort_order": 2, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:37:02.858728+00
addca274-cb14-44b8-8ca9-e6dd99631d90	content_card	card-kw2mkhw5	update	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "created_at": "2026-06-02T09:36:59.718153+00:00", "sort_order": 1, "district_id": null, "section_key": "interesting"}	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "sort_order": 2, "district_id": null, "section_key": "interesting"}	\N	2026-06-02 09:37:04.136564+00
e0ca2cd4-dcc9-431f-a183-c910b6f8cb49	content_card	card-kw2mkhw5	update	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "created_at": "2026-06-02T09:36:59.718153+00:00", "sort_order": 2, "district_id": null, "section_key": "interesting"}	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "sort_order": 1, "district_id": null, "section_key": "interesting"}	\N	2026-06-02 09:37:05.98669+00
f0648113-b37b-47fc-996a-29eba5244ca2	content_card	card-acl93be4	update	{"id": "card-acl93be4", "href": null, "title": "Tatar Bunar", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-zcowiw5a", "textSize": "md", "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n"}, "page_key": "index", "subtitle": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "card_type": "restaurant", "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "region_id": null, "created_at": "2026-06-02T09:24:04.408171+00:00", "sort_order": 2, "district_id": "district-c6ididsh", "section_key": "interesting"}	{"id": "card-acl93be4", "href": null, "title": "Tatar Bunar", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-zcowiw5a", "textSize": "md", "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n"}, "page_key": "index", "subtitle": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "card_type": "restaurant", "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "region_id": null, "sort_order": 1, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:37:04.135485+00
1581c4d8-be76-47ed-bfde-faeb5dbda9ef	content_card	card-acl93be4	update	{"id": "card-acl93be4", "href": null, "title": "Tatar Bunar", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-zcowiw5a", "textSize": "md", "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n"}, "page_key": "index", "subtitle": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "card_type": "restaurant", "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "region_id": null, "created_at": "2026-06-02T09:24:04.408171+00:00", "sort_order": 1, "district_id": "district-c6ididsh", "section_key": "interesting"}	{"id": "card-acl93be4", "href": null, "title": "Tatar Bunar", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-zcowiw5a", "textSize": "md", "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n"}, "page_key": "index", "subtitle": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "card_type": "restaurant", "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "region_id": null, "sort_order": 2, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:37:05.985743+00
c2fe0363-069f-40ee-8c47-9fdec815a07b	content_card	card-kw2mkhw5	update	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "created_at": "2026-06-02T09:36:59.718153+00:00", "sort_order": 1, "district_id": null, "section_key": "interesting"}	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "sort_order": 0, "district_id": null, "section_key": "interesting"}	\N	2026-06-02 09:37:07.157984+00
cbcb2c90-49e7-4457-bf1d-f5d87cba0939	content_card	card-hkjkn9fr	update	{"id": "card-hkjkn9fr", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-p4xh35h1", "payload": {"row": 2, "colSpan": 1, "placeId": "place-91d5orj4", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "created_at": "2026-06-02T09:36:30.904373+00:00", "sort_order": 3, "district_id": "district-c6ididsh", "section_key": "interesting"}	{"id": "card-hkjkn9fr", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-p4xh35h1", "payload": {"row": 2, "colSpan": 3, "placeId": "place-91d5orj4", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "sort_order": 3, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:37:33.485004+00
74669757-db4d-457e-b0e4-0a7d141bf6dc	content_card	card-ehav4ou1	update	{"id": "card-ehav4ou1", "href": null, "title": "Hotel Bristol Odesa", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 2, "placeId": "place-5yr7dl7x", "textSize": "md", "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. "}, "page_key": "index", "subtitle": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "card_type": "hotel", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "region_id": null, "created_at": "2026-06-02T09:24:02.579124+00:00", "sort_order": 0, "district_id": "district-c6ididsh", "section_key": "interesting"}	{"id": "card-ehav4ou1", "href": null, "title": "Hotel Bristol Odesa", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 2, "placeId": "place-5yr7dl7x", "textSize": "md", "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. "}, "page_key": "index", "subtitle": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "card_type": "hotel", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "region_id": null, "sort_order": 1, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:37:07.199143+00
bfd28cb8-8ce2-436d-9763-c409d272b663	content_card	card-hkjkn9fr	update	{"id": "card-hkjkn9fr", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-p4xh35h1", "payload": {"row": 1, "colSpan": 1, "placeId": "place-91d5orj4", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "created_at": "2026-06-02T09:36:30.904373+00:00", "sort_order": 3, "district_id": "district-c6ididsh", "section_key": "interesting"}	{"id": "card-hkjkn9fr", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-p4xh35h1", "payload": {"row": 2, "colSpan": 1, "placeId": "place-91d5orj4", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "sort_order": 3, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:37:16.683193+00
ea42c9e7-a458-4b9a-9110-9155f4808cda	content_card	card-hkjkn9fr	update	{"id": "card-hkjkn9fr", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-p4xh35h1", "payload": {"row": 2, "colSpan": 3, "placeId": "place-91d5orj4", "textSize": "md", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "created_at": "2026-06-02T09:36:30.904373+00:00", "sort_order": 3, "district_id": "district-c6ididsh", "section_key": "interesting"}	{"id": "card-hkjkn9fr", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": "city-p4xh35h1", "payload": {"row": 2, "colSpan": 3, "placeId": "place-91d5orj4", "textSize": "lg", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "sort_order": 3, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	2026-06-02 09:37:35.638826+00
50b075e0-e44f-47bb-a3ca-59dfba0b8c13	tourism_object	place-zcowiw5a	update	{"id": "place-zcowiw5a", "name": "Tatar Bunar", "slug": "tatar-bunar-e57xwc", "type": "restaurant", "hours": "Пн-Нд 10:00-22:00", "phone": "+380971234567", "address": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.instagram.com/tatar.bunar.odesa/ ", "subtitle": "ресторан / заклад харчування", "amenities": null, "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "video_url": null, "created_at": "2026-06-02T09:23:44.088648+00:00", "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Гастрономічний профіль\\nКухня:\\nазіатсько-середземноморські елементи з локальними традиціями;\\nавтентичні та сучасні страви бессарабського регіону (вареники, супи, мамалига, бринза, локальні супи тощо);\\nвипічка ручної роботи, приготована в дров’яній печі;\\nвикористання якісних місцевих продуктів і українських вин.\\nРесторан подає страви, що ґрунтуються на кухонних традиціях Півдня України і Бессарабії, адаптованих у сучасній інтерпретації.\\nТуристична привабливість\\n✔ унікальне гастрономічне місце з регіональними мотивами;\\n✔ популярний як серед місцевих, так і серед гостей міста;\\n✔ входить до гастрономічних рекомендацій Одеси;\\n✔ можливість поєднати з відвідуванням інших культурних та туристичних об’єктів центру міста.\\nІнфраструктура\\n – просторі зали для обідів та вечерь;\\n – літня тераса (за сезоном);\\n – винна карта з українськими винами;\\n – літній сад і можливість організації подій;\\n – оформлення інтер’єру з елементами місцевої культури.\\nТуристичне значення\\n«Tatar Bunar» - важлива гастрономічна точка Одеси, що презентує автентичну бессарабську кухню в сучасному форматі. Заклад не лише працює як ресторан, але й сприяє культурному та гастрономічному туризму, інтегруючись у локальні маршрути та пропозиції для туристів, охочих знайомитись із кулінарною спадщиною південного регіону України. \\n", "tourism_types": ["Гастрономічний туризм"]}	{"id": "place-zcowiw5a", "name": "Tatar Bunar", "slug": "tatar-bunar-e57xwc", "type": "restaurant", "hours": "Пн-Нд 10:00-22:00", "phone": "+380971234567", "address": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "city_id": "city-p4xh35h1", "map_url": "https://maps.app.goo.gl/6K2TmVww3JWfuF8p6", "website": "https://www.instagram.com/tatar.bunar.odesa/ ", "subtitle": "ресторан / заклад харчування", "amenities": null, "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "video_url": null, "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Гастрономічний профіль\\nКухня:\\nазіатсько-середземноморські елементи з локальними традиціями;\\nавтентичні та сучасні страви бессарабського регіону (вареники, супи, мамалига, бринза, локальні супи тощо);\\nвипічка ручної роботи, приготована в дров’яній печі;\\nвикористання якісних місцевих продуктів і українських вин.\\nРесторан подає страви, що ґрунтуються на кухонних традиціях Півдня України і Бессарабії, адаптованих у сучасній інтерпретації.\\nТуристична привабливість\\n✔ унікальне гастрономічне місце з регіональними мотивами;\\n✔ популярний як серед місцевих, так і серед гостей міста;\\n✔ входить до гастрономічних рекомендацій Одеси;\\n✔ можливість поєднати з відвідуванням інших культурних та туристичних об’єктів центру міста.\\nІнфраструктура\\n – просторі зали для обідів та вечерь;\\n – літня тераса (за сезоном);\\n – винна карта з українськими винами;\\n – літній сад і можливість організації подій;\\n – оформлення інтер’єру з елементами місцевої культури.\\nТуристичне значення\\n«Tatar Bunar» - важлива гастрономічна точка Одеси, що презентує автентичну бессарабську кухню в сучасному форматі. Заклад не лише працює як ресторан, але й сприяє культурному та гастрономічному туризму, інтегруючись у локальні маршрути та пропозиції для туристів, охочих знайомитись із кулінарною спадщиною південного регіону України. \\n", "tourism_types": ["Гастрономічний туризм"]}	\N	2026-06-02 10:00:22.807646+00
3fa5a516-083e-412b-a71b-404d78dc87af	tourism_object	place-5yr7dl7x	update	{"id": "place-5yr7dl7x", "name": "Hotel Bristol Odesa", "slug": "hotel-bristol-odesa-udwtyb", "type": "hotel", "hours": null, "phone": "+380991234567", "address": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://bristol-hotel.com.ua", "subtitle": "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequa", "amenities": "Просторий вестибюль, Ресторан класичної кухні, Лаунж-бар, SPA-зона (сауна, джакузі), Фітнес-зал", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "video_url": null, "created_at": "2026-06-02T09:19:35.525983+00:00", "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. ", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", "tourism_types": []}	{"id": "place-5yr7dl7x", "name": "Hotel Bristol Odesa", "slug": "hotel-bristol-odesa-udwtyb", "type": "hotel", "hours": null, "phone": "+380991234567", "address": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://bristol-hotel.com.ua", "subtitle": "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequa", "amenities": "Просторий вестибюль, Ресторан класичної кухні, Лаунж-бар, SPA-зона, сауна, Фітнес-зал", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "video_url": null, "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. ", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", "tourism_types": []}	\N	2026-06-02 10:01:44.486614+00
468c68ce-76af-4830-b5f9-5e2964330121	tourism_object	place-lrwps4o6	create	\N	{"id": "place-lrwps4o6", "name": "Одеський національний художній музей", "slug": "odeskyy-natsionalnyy-khudozhniy-muzey-e6udma", "type": "attraction", "hours": null, "phone": null, "address": null, "city_id": "city-p4xh35h1", "map_url": "https://maps.app.goo.gl/JYW7RgtZx1hLuUNJ6", "website": null, "subtitle": null, "amenities": null, "image_url": "https://city-afisha.od.ua/wp-content/uploads/2025/04/odes-musey.webp", "published": true, "video_url": null, "description": "Будівлю, в якій розташовано Одеський художній музей, було збудовано в період між 1824 і 1828 роками. Автор проекту невідомий. Після закінчення будівництва споруду освідчив відомий одеський архітектор Франс Карлович Боффо. Першою власницею палацу була графиня Ольга Станіславівна Наришкіна (уроджена Потоцька).\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "У 1888 році палац придбав одеський міський голова Григорій Григорович Маразлі — відомий громадський діяч, колекціонер і меценат. У 1892 році він передав палац місту з метою створення в ньому музею витончених мистецтв. Відкриття музею відбулося 24 жовтня (6 листопада) 1899 року.\\nАрхітектура палацу втілює в собі кращі традиції класицизму початку ХІХ століття. Центрична композиція споруди вирізняється строгою та гармонійною витонченістю — двоповерховий корпус з портиком із шести колон корінфського ордеру, що підтримують фронтон, і два симетрично розташовані одноповерхові фліґелі, з’єднані округлими галереями.\\n", "tourism_types": ["Історико-культурний туризм"]}	\N	2026-06-02 10:05:44.341371+00
6001b139-dfa4-4137-b529-16b34f6f1d4f	content_card	card-5dqk6q4h	create	\N	{"id": "card-5dqk6q4h", "href": null, "title": "Одеський національний художній музей", "city_id": "city-p4xh35h1", "payload": {"placeId": "place-lrwps4o6", "description": "Будівлю, в якій розташовано Одеський художній музей, було збудовано в період між 1824 і 1828 роками. Автор проекту невідомий. Після закінчення будівництва споруду освідчив відомий одеський архітектор Франс Карлович Боффо. Першою власницею палацу була графиня Ольга Станіславівна Наришкіна (уроджена Потоцька).\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://city-afisha.od.ua/wp-content/uploads/2025/04/odes-musey.webp", "published": true, "region_id": null, "sort_order": 1, "district_id": "district-c6ididsh", "section_key": "attractions"}	\N	2026-06-02 10:05:57.113058+00
711b731d-cd31-4604-b09c-a723743e2775	content_card	tourism-type-медико-оздоровчий-туризм	create	\N	{"id": "tourism-type-медико-оздоровчий-туризм", "href": null, "title": "Медико-оздоровчий туризм", "city_id": null, "payload": {}, "page_key": "tourism-types", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405353036.png", "published": true, "region_id": null, "sort_order": 0, "district_id": null, "section_key": "type"}	vinilxd9@gmail.com	2026-06-02 13:02:37.351788+00
42e9ae31-fdab-41a5-b577-6d3b87cd1d6e	district	district-uvv38np5	create	\N	{"id": "district-uvv38np5", "name": "Роздільнянський район", "slug": "i-a", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "region_id": "region-odesa", "video_url": null, "description": "Роздільнянський район — це близька та доступна природна дестинація Одещини, де безкраї степи поєднуються з мальовничими водоймами та цікавою історичною спадщиною. Лише за годину їзди від Одеси на туристів чекають спокійний відпочинок на природі, риболовля, екологічні маршрути та знайомство з самобутньою культурою півдня України.", "detailed_info": "Головними природними перлинами району є Кучурганське водосховище, схили Хаджибейського лиману, ботанічний заказник «Костянська балка» та екокомплекс «Рідна природа», які створюють чудові можливості для сімейного відпочинку, фототуризму та екологічних подорожей.\\nОсобливий колорит району формує багатонаціональна історія краю. Тут збереглися унікальні пам’ятки німецької колоніальної спадщини, серед яких величні католицькі костели та старовинні храми, що доповнюють туристичні маршрути культурно-пізнавального спрямування.\\nРоздільнянщина також знайомить гостей із локальними фермерськими традиціями, сільською гостинністю та атмосферою справжнього степового краю. Це ідеальне місце для одноденної подорожі, відпочинку на природі та відкриття маловідомих, але надзвичайно цікавих куточків Одещини.\\n\\n"}	\N	2026-06-02 11:35:35.835431+00
2bed132a-542a-48e9-80c9-8764ce372a6f	content_card	card-h4rrr0co	create	\N	{"id": "card-h4rrr0co", "href": "/napryamky/district-uvv38np5", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "sort_order": 1, "district_id": "district-uvv38np5", "section_key": "directions"}	\N	2026-06-02 11:40:46.364481+00
b1881059-c16c-4dca-919d-4010b6a5c861	tourism_object	place-ge0ykka5	create	\N	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "hotel", "hours": null, "phone": null, "address": "вул. Дерибасівська, 12", "city_id": "city-p4xh35h1", "map_url": null, "website": null, "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	\N	2026-06-02 11:43:15.749018+00
f82ecfc4-d2ba-4022-918d-4e093752d231	tourism_object	place-ge0ykka5	update	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "hotel", "hours": null, "phone": null, "address": "вул. Дерибасівська, 12", "city_id": "city-p4xh35h1", "map_url": null, "website": null, "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "created_at": "2026-06-02T11:43:15.561364+00:00", "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "hotel", "hours": null, "phone": null, "address": "вул. Дерибасівська, 12", "city_id": "city-p4xh35h1", "map_url": null, "website": null, "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	\N	2026-06-02 11:43:28.911573+00
48084b1a-0e9a-4b12-b8a5-9a9740658b96	tourism_object	place-ge0ykka5	update	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "hotel", "hours": null, "phone": null, "address": "вул. Дерибасівська, 12", "city_id": "city-p4xh35h1", "map_url": null, "website": null, "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "created_at": "2026-06-02T11:43:15.561364+00:00", "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "hotel", "hours": null, "phone": null, "address": "вул. Дерибасівська, 12  вул. Академіка Філатова, 31/1", "city_id": "city-p4xh35h1", "map_url": null, "website": null, "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	\N	2026-06-02 11:45:58.029444+00
0f606a09-55c6-41e9-a34e-ee5468a4fd92	tourism_object	place-ge0ykka5	update	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "hotel", "hours": null, "phone": null, "address": "вул. Дерибасівська, 12  вул. Академіка Філатова, 31/1", "city_id": "city-p4xh35h1", "map_url": null, "website": null, "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "created_at": "2026-06-02T11:43:15.561364+00:00", "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "hotel", "hours": null, "phone": null, "address": "вул. Дерибасівська, 12  вул. Академіка Філатова, 31/1", "city_id": "city-p4xh35h1", "map_url": null, "website": null, "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	\N	2026-06-02 11:46:06.876022+00
eb45e271-eecf-4f3c-b708-a2e8e2738c52	tourism_object	place-ge0ykka5	update	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "hotel", "hours": null, "phone": null, "address": "вул. Дерибасівська, 12  вул. Академіка Філатова, 31/1", "city_id": "city-p4xh35h1", "map_url": null, "website": null, "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "created_at": "2026-06-02T11:43:15.561364+00:00", "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "hotel", "hours": null, "phone": "+380507780108", "address": "вул. Дерибасівська, 12  ", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.gastronomodesa.com/uk", "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	\N	2026-06-02 11:49:11.245844+00
b666a8b8-31fd-413a-91ea-e37221ba111a	tourism_object	place-ge0ykka5	update	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "hotel", "hours": null, "phone": "+380507780108", "address": "вул. Дерибасівська, 12  ", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.gastronomodesa.com/uk", "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "created_at": "2026-06-02T11:43:15.561364+00:00", "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "restaurant", "hours": null, "phone": "+380507780108", "address": "вул. Дерибасівська, 12  ", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.gastronomodesa.com/uk", "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	\N	2026-06-02 11:50:50.027765+00
04c8afb0-ecf0-43be-b648-f8e502c8f355	district	district-hwb8a005	create	\N	{"id": "district-hwb8a005", "name": "Подільський район", "slug": "podilskyy-rayon", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401411712-hy0soiyv8t8.png", "region_id": "region-odesa", "video_url": null, "description": "Подільський район — це зелена перлина півночі Одещини, де мальовничі ліси, річкові долини та автентична атмосфера створюють ідеальні умови для спокійного відпочинку. На відміну від морського узбережжя, тут туристів зустрічають хвилясті ландшафти Подільської височини, чисте повітря та унікальна природа.", "detailed_info": "Головними природними скарбами району є Савранський ліс — один із найбільших лісових масивів області, долини річок Кодима та Савранка, численні ставки, джерела та природоохоронні території. Це чудове місце для екотуризму, піших прогулянок, веломандрівок і відпочинку на природі.\\nПодільський район зберігає багату історико-культурну спадщину, традиції багатонаціонального Поділля та самобутню гастрономію. Тут можна скуштувати домашні фермерські продукти, познайомитися з місцевими традиціями та відчути справжню гостинність українського села.\\nЦе територія тихого туризму, де немає метушні великих курортів, зате є можливість відновити сили, насолодитися природою та відкрити для себе іншу, маловідому й надзвичайно щиру Одещину.\\n"}	\N	2026-06-02 11:56:56.86798+00
997e1ae9-b597-4194-ba6d-d5b35635c907	tourism_object	place-ge0ykka5	update	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "restaurant", "hours": null, "phone": "+380507780108", "address": "вул. Дерибасівська, 12  ", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.gastronomodesa.com/uk", "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "created_at": "2026-06-02T11:43:15.561364+00:00", "description": "Перший заклад «Гастроном» було відкрито у 2024 році в самому серці Одеси — на вулиці Дерибасівській, 12.\\nІдея проєкту виникла з простого, але показового спостереження: прогулюючись Дерибасівською, можна побачити безліч закладів, що представляють інші регіони — львівські круасани, шоколад, кав’ярні. Водночас справжнього одеського ресторану в центрі міста довгий час не було.\\nСаме тому з’явилася ідея створити «Гастроном» — місце, яке відроджує одеську кухню та повертає їй заслужене місце в самому серці Одеси. Заклад органічно вписується у міський контекст і водночас формує нову гастрономічну точку тяжіння.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Концепція та позиціонування\\n«Гастроном» — це занурення в атмосферу  старої Одеси, де кожна деталь працює на відчуття дому, ностальгії та справжнього смаку.\\nЗнайомство починається з перших акцентів — закусок, як-от тюлечка власного посолу, і продовжується через інтер’єр, що відтворює естетику старої Одеси.\\nМеню поєднує:\\nкласичні страви — фаршмак, ікра з синьки\\nсучасне переосмислення — нові інтерпретації перцю та голубців\\nлокальні продукти — риба та морепродукти Чорного моря\\nдомашні акценти — свіжа випічка та власна консервація\\nЦе кухня, яку неможливо забути, бо вона про справжній смак Одеси.\\nУнікальні особливості\\nатмосфера старої Одеси в інтер’єрі та деталях\\nпоєднання класики та сучасної подачі\\nформат ресторану з елементами гастролавки ( магазин зі своєю продукцією)\\n\\nКонкурентні переваги\\n«Гастроном» — це не лише ресторан, а й можливість забрати частинку Одеси з собою.\\nГості можуть:\\nпридбати фірмову консервацію\\nобрати авторські напої\\nзібрати подарункову авоську з одеськими делікатесами\\nМеню та гастрономічні особливості\\nМеню побудоване за принципом зрозумілої, близької кожному домашньої кухні з одеським характером.\\nОсновні розділи меню:\\nсніданки\\nзакусончик\\nсалатики\\nсупчики\\nяк у мами з бабусею (страви по-домашньому)\\nосновні гарячі страви (сковорідки, печінка, котлетка з пюрешкою)\\nФастфуд по-одеськи (особливість закладу):\\nЦаца\\nбулочка з біфштексом\\nбулочка з курочкою\\nchicken chips (курячі кульки у панко)\\nсмажені пельмені\\nкільця кальмару\\nхрумка креветка\\nхрумка курка з картоплею під сирним соусом\\nЛокальні продукти:\\nулов дня: бичок, салакка, мойва\\n А також різноманітна  власна випічка (солодка і не солодка)\\n\\nСервіс\\nРівень обслуговування\\nПереступивши поріг «Гастроному», гість одразу потрапляє у знайомий простір — ніби в одеський дворик, у якому він вже колись був: у дитинстві або бачив у старих фільмах. Це відчуття впізнаваності та тепла виникає миттєво і супроводжує протягом усього перебування.\\nТут панує невимушена атмосфера, жива комунікація та відсутність формальної дистанції — усе побудовано на щирості, відкритості та одеській гостинності.\\n\\nФормат взаємодії\\nОсобливу роль у створенні атмосфери відіграють вечори з живою музикою, які проходять щовихідних на обох локаціях.\\nУ ці моменти простір перетворюється на єдину спільноту: гості підспівують і танцюють\\nЦе створює відчуття цілісності, коли всі навколо стають частиною одного настрою та одного вечора.\\n", "tourism_types": ["Гастрономічний туризм"]}	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "restaurant", "hours": null, "phone": "+380507780108", "address": "вул. Дерибасівська, 12  ", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.gastronomodesa.com/uk", "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "description": "«Гастроном» — ресторан з атмосферою старої Одеси, що поєднує ностальгічний інтер’єр і сучасний гастрономічний підхід. Простір створює відчуття одеського дворика з теплою, невимушеною атмосферою.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Меню поєднує класичні одеські та домашні страви з сучасними інтерпретаціями й локальними продуктами Чорного моря. У страви входять традиційні закуски, рибні позиції, домашня випічка та авторські варіації знайомих рецептів.\\nРесторан із елементами гастролавки, де можна не лише скуштувати страви, а й придбати фірмову продукцію: консервацію, напої та гастрономічні сувеніри.\\n\\nУнікальні особливості\\n- атмосфера старої Одеси в інтер’єрі та подачі\\n- поєднання класичної та сучасної кухні\\n- формат ресторану + магазин локальних продуктів\\n- можливість придбати «одеські смаколики» з собою\\n\\nЗаклад створює відчуття домашнього простору з одеським характером. Обслуговування орієнтоване на невимушене спілкування та гостинність. У вихідні проводяться вечори з живою музикою, що формують атмосферу спільного відпочинку та живої взаємодії гостей.", "tourism_types": ["Гастрономічний туризм"]}	\N	2026-06-02 11:59:43.584613+00
4e2cbd3f-f129-45d1-9df0-5e07a0798376	district	district-fvvgs41u	create	\N	{"id": "district-fvvgs41u", "name": "Березівський район", "slug": "berezivskyy-rayon", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "region_id": "region-odesa", "video_url": null, "description": "Березівський район — це край безкраїх степів, мальовничих річкових долин і тихого відпочинку далеко від міської метушні. Територію району прикрашають Тилігульський та Хаджибейський лимани, річки Великий і Малий Куяльник, Тилігул, Балай та численні балки, що формують неповторні природні ландшафти.\\n", "detailed_info": "Особливу туристичну цінність мають долина річки Тилігул, степові урочища поблизу Златоустового, Маринового та Новокальчевого, а також численні природоохоронні території. Серед них — Тилігульський регіональний ландшафтний парк, заказники «Коса Стрілка», «Верхній ліс», Каїрівський, Осинівський та інші природні пам’ятки.\\nБерезівщина зберігає й багату історико-культурну спадщину. Символом району є садиба Курісів — одна з найвідоміших архітектурних пам’яток Одещини. Інтерес для мандрівників також становлять костел Святого Северина, Свято-Іоанно-Богословська церква, старовинні козацькі цвинтарі, кам’яний вітряк в Адамівці та історичні споруди Северинівки.\\nРайон приваблює шанувальників зеленого туризму, сільського відпочинку та гастрономічних подорожей. Тут можна познайомитися з життям фермерських господарств, скуштувати натуральні сири, ковбаси, мед та іншу локальну продукцію, а також відчути справжню гостинність степового краю.\\nБерезівський район — це місце для тих, хто цінує тишу, природну красу, автентичну атмосферу українського села та неспішний відпочинок серед степових просторів Одещини.\\n"}	\N	2026-06-02 11:59:53.980212+00
4bdd16e6-03cf-4bb3-b686-6eedd1c0ad21	district	district-jnun99rr	create	\N	{"id": "district-jnun99rr", "name": "Болградський район", "slug": "bolhradskyy-rayon", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401679505-nm3n4674yl.png", "region_id": "region-odesa", "video_url": null, "description": "Болградський район — серце Української Бессарабії, край виноградників, етнічних традицій та гостинності. Тут на туристів чекає унікальне поєднання болгарської, гагаузької, молдавської та української культур, що створює особливу атмосферу, не схожу на жоден інший регіон України.\\n", "detailed_info": "Головною природною окрасою району є озеро Ялпуг — найбільше природне озеро України, яке приваблює любителів відпочинку на воді, рибальства та мальовничих краєвидів. Безкраї степи, виноградники та сонячні бессарабські пейзажі створюють ідеальні умови для подорожей, фототуризму та відпочинку на природі.\\nБолградщина є одним із провідних центрів винного туризму Одещини. Тут працюють сімейні виноробні, проводяться дегустації локальних вин, а традиційна бессарабська кухня дивує автентичними стравами та старовинними рецептами, що передаються поколіннями.\\nКультурною візитівкою району є місто Болград зі Спасо-Преображенським собором, історичною Болградською гімназією та багатою спадщиною болгарських переселенців. Особливе місце в туристичному календарі займає Bolgrad Wine Fest — фестиваль, який щороку збирає поціновувачів вина, гастрономії та бессарабських традицій.\\nБолградський район — це подорож за новими смаками, культурою та враженнями, де кожен гість відкриває справжню душу Бессарабії."}	\N	2026-06-02 12:01:27.274955+00
428dddb0-03a6-45a4-a3ae-ec0130df97df	tourism_object	place-ge0ykka5	update	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "restaurant", "hours": null, "phone": "+380507780108", "address": "вул. Дерибасівська, 12  ", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.gastronomodesa.com/uk", "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "created_at": "2026-06-02T11:43:15.561364+00:00", "description": "«Гастроном» — ресторан з атмосферою старої Одеси, що поєднує ностальгічний інтер’єр і сучасний гастрономічний підхід. Простір створює відчуття одеського дворика з теплою, невимушеною атмосферою.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Меню поєднує класичні одеські та домашні страви з сучасними інтерпретаціями й локальними продуктами Чорного моря. У страви входять традиційні закуски, рибні позиції, домашня випічка та авторські варіації знайомих рецептів.\\nРесторан із елементами гастролавки, де можна не лише скуштувати страви, а й придбати фірмову продукцію: консервацію, напої та гастрономічні сувеніри.\\n\\nУнікальні особливості\\n- атмосфера старої Одеси в інтер’єрі та подачі\\n- поєднання класичної та сучасної кухні\\n- формат ресторану + магазин локальних продуктів\\n- можливість придбати «одеські смаколики» з собою\\n\\nЗаклад створює відчуття домашнього простору з одеським характером. Обслуговування орієнтоване на невимушене спілкування та гостинність. У вихідні проводяться вечори з живою музикою, що формують атмосферу спільного відпочинку та живої взаємодії гостей.", "tourism_types": ["Гастрономічний туризм"]}	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "restaurant", "hours": null, "phone": "+380507780108", "address": "вул. Дерибасівська, 12  ", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.gastronomodesa.com/uk", "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "description": "«Гастроном» — ресторан з атмосферою старої Одеси, що поєднує ностальгічний інтер’єр і сучасний гастрономічний підхід. Простір створює відчуття одеського дворика з теплою, невимушеною атмосферою.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Меню поєднує класичні одеські та домашні страви з сучасними інтерпретаціями й локальними продуктами Чорного моря. У страви входять традиційні закуски, рибні позиції, домашня випічка та авторські варіації знайомих рецептів.\\nРесторан із елементами гастролавки, де можна не лише скуштувати страви, а й придбати фірмову продукцію: консервацію, напої та гастрономічні сувеніри.\\n\\nУнікальні особливості\\n- атмосфера старої Одеси в інтер’єрі та подачі\\n- поєднання класичної та сучасної кухні\\n- формат ресторану + магазин локальних продуктів\\n- можливість придбати «одеські смаколики» з собою\\n\\nЗаклад створює відчуття домашнього простору з одеським характером. Обслуговування орієнтоване на невимушене спілкування та гостинність. У вихідні проводяться вечори з живою музикою, що формують атмосферу спільного відпочинку та живої взаємодії гостей.", "tourism_types": ["Гастрономічний туризм"]}	\N	2026-06-02 12:01:36.341836+00
b1429d46-94ad-4aa3-98ca-5fa90e937c51	district	district-inxqkycm	create	\N	{"id": "district-inxqkycm", "name": "Ізмаїльський район", "slug": "izmayilskyy-rayon", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401741532-3ic4253e3ho.png", "region_id": "region-odesa", "video_url": null, "description": "Ізмаїльський район — справжня перлина українського Придунав’я, де величний Дунай, мальовничі озера та багатонаціональна культура створюють один із найунікальніших туристичних регіонів України. Це край дикої природи, водних маршрутів, автентичних традицій і незабутніх вражень.\\n", "detailed_info": "Головною туристичною візитівкою району є Вилкове — знаменита «українська Венеція», де замість вулиць простягаються канали, а човен залишається звичним транспортом. Подорожі єриками, екскурсії до знаменитого «0 км Дунаю», спостереження за птахами та знайомство з життям дельти Дунаю відкривають гостям особливий світ природи та гармонії.\\nПриродне багатство району доповнюють Дунайський біосферний заповідник, озера Ялпуг, Кугурлуй, Катлабух і Китай, які створюють ідеальні умови для екотуризму, риболовлі, фотоподорожей та активного відпочинку на воді.\\nІзмаїльщина вражає також своєю культурною різноманітністю. Старовинний Ізмаїл, багатонаціональні громади Придунав’я, старообрядницька спадщина Вилкового та традиції болгар, гагаузів, молдован і українців формують неповторний колорит регіону.\\nОсобливе місце у туристичному досвіді займає місцева гастрономія: дунайський оселедець, свіжа риба, ароматна юшка, домашні вина та традиційні страви народів Бессарабії. Ізмаїльський район — це подорож до серця Дунаю, де природа, культура та гостинність поєднуються в єдину незабутню історію.\\n\\n"}	\N	2026-06-02 12:02:26.267862+00
a60ee32e-f9c8-48be-9301-f7339cbed910	district	district-c6ididsh	update	{"id": "district-c6ididsh", "name": "Одеський район", "slug": "odeskyy-rayon", "subtitle": "Туристичний паспорт", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780387299909-xyfts4zyf4i.png", "region_id": "region-odesa", "video_url": null, "created_at": "2026-06-02T08:01:45.22002+00:00", "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\nОсобливе місце займає культурна спадщина району. Історичний центр Одеси, внесений до Списку всесвітньої спадщини ЮНЕСКО, Одеський національний академічний театр опери та балету, Потьомкінські сходи, Приморський бульвар та численні архітектурні пам’ятки формують унікальний туристичний образ регіону.\\nОдеський район також відомий своїми виноробнями, фермерськими господарствами, гастрономічними локаціями та закладами гостинності. Тут можна скуштувати локальні вина, морепродукти, фермерські сири та інші традиційні продукти півдня України. Численні фестивалі, культурні події та гастрономічні заходи протягом року роблять район одним із найдинамічніших туристичних напрямків країни.\\nОдеський район — це місце, де в межах однієї подорожі можна поєднати морський відпочинок, знайомство з історією та культурою, гастрономічні відкриття, відпочинок на природі та оздоровлення. Саме це різноманіття вражень робить його однією з найпривабливіших туристичних дестинацій України.\\n"}	{"id": "district-c6ididsh", "name": "Одеський район", "slug": "odeskyy-rayon", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780387299909-xyfts4zyf4i.png", "region_id": "region-odesa", "video_url": null, "description": "Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.", "detailed_info": "Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\\nОсобливе місце займає культурна спадщина району. Історичний центр Одеси, внесений до Списку всесвітньої спадщини ЮНЕСКО, Одеський національний академічний театр опери та балету, Потьомкінські сходи, Приморський бульвар та численні архітектурні пам’ятки формують унікальний туристичний образ регіону.\\nОдеський район також відомий своїми виноробнями, фермерськими господарствами, гастрономічними локаціями та закладами гостинності. Тут можна скуштувати локальні вина, морепродукти, фермерські сири та інші традиційні продукти півдня України. Численні фестивалі, культурні події та гастрономічні заходи протягом року роблять район одним із найдинамічніших туристичних напрямків країни.\\nОдеський район — це місце, де в межах однієї подорожі можна поєднати морський відпочинок, знайомство з історією та культурою, гастрономічні відкриття, відпочинок на природі та оздоровлення. Саме це різноманіття вражень робить його однією з найпривабливіших туристичних дестинацій України.\\n"}	\N	2026-06-02 12:02:53.321308+00
546467a8-c18f-4864-99c8-cf1fe55c092f	content_card	tourism-type-сільський-та-зелений-туризм	create	\N	{"id": "tourism-type-сільський-та-зелений-туризм", "href": null, "title": "Сільський та зелений туризм", "city_id": null, "payload": {}, "page_key": "tourism-types", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405363765.jpg", "published": true, "region_id": null, "sort_order": 0, "district_id": null, "section_key": "type"}	vinilxd9@gmail.com	2026-06-02 13:02:46.239186+00
5d14c908-ac78-441f-a370-3eb067f6d74c	content_card	tourism-type-розважальний-туризм	create	\N	{"id": "tourism-type-розважальний-туризм", "href": null, "title": "Розважальний туризм", "city_id": null, "payload": {}, "page_key": "tourism-types", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405360582.png", "published": true, "region_id": null, "sort_order": 0, "district_id": null, "section_key": "type"}	vinilxd9@gmail.com	2026-06-02 13:02:46.760851+00
76a481c3-9a74-4d97-946d-3d938bf0c3be	district	district-07uz711u	create	\N	{"id": "district-07uz711u", "name": "Білгород-Дністровський район", "slug": "bilhorod-dnistrovskyy-rayon", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401841038-zawqt7rid7e.png", "region_id": "region-odesa", "video_url": null, "description": "Білгород-Дністровський район — один із найяскравіших туристичних регіонів Одещини, де поєднуються морське узбережжя, велична історична спадщина та унікальні гастрономічні традиції. Це місце, де кожна подорож дарує нові враження — від відпочинку біля моря до знайомства з багатовіковою історією Північного Причорномор’я.", "detailed_info": "Головною туристичною перлиною району є Білгород-Дністровська фортеця — одна з найбільших і найкраще збережених середньовічних фортець Східної Європи. Поруч розташовані археологічні пам’ятки античного міста Тіра та історичний центр Білгорода-Дністровського, що відкривають багатовікову історію краю.\\nЛюбителів морського відпочинку приваблюють курортні території Затоки та Кароліно-Бугаза з широкими піщаними пляжами, теплим морем і мальовничими краєвидами. Особливу природну цінність становить Національний природний парк «Тузлівські лимани» — один із найунікальніших природоохоронних комплексів України, де можна спостерігати за птахами, насолоджуватися дикою природою та відкривати красу чорноморського узбережжя.\\nБілгород-Дністровський район також є центром гастрономічного туризму. Саме тут розташовані відомі виноробні, крафтові сироварні та фермерські господарства, які пропонують дегустації локальних вин, сирів і традиційних страв півдня України.\\nБілгород-Дністровський район — це ідеальне поєднання моря, історії, природи та гастрономії, що робить його однією з найпривабливіших туристичних дестинацій Одещини для відпочинку у будь-яку пору року.\\n"}	\N	2026-06-02 12:04:05.639155+00
df4b822c-629c-4828-ad01-70970bf7daf7	content_card	card-covbcs7h	create	\N	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "sort_order": 2, "district_id": "district-fvvgs41u", "section_key": "directions"}	\N	2026-06-02 12:04:19.494551+00
a5344fd9-7033-43a4-8002-4516d50dd1ed	content_card	card-uqpzfems	create	\N	{"id": "card-uqpzfems", "href": "/raion/bilhorod-dnistrovskyy-rayon", "title": "Білгород-Дністровський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401841038-zawqt7rid7e.png", "published": true, "region_id": null, "sort_order": 3, "district_id": "district-07uz711u", "section_key": "directions"}	\N	2026-06-02 12:04:20.875314+00
2fb5c37a-1be4-4b96-9cc2-4d269676d375	content_card	card-tmcfrrpm	create	\N	{"id": "card-tmcfrrpm", "href": "/raion/bolhradskyy-rayon", "title": "Болградський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401679505-nm3n4674yl.png", "published": true, "region_id": null, "sort_order": 4, "district_id": "district-jnun99rr", "section_key": "directions"}	\N	2026-06-02 12:04:22.978808+00
b6d7deb4-f361-4b16-b796-6737fb4d342f	content_card	card-s5k7wx4v	create	\N	{"id": "card-s5k7wx4v", "href": "/raion/izmayilskyy-rayon", "title": "Ізмаїльський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401741532-3ic4253e3ho.png", "published": true, "region_id": null, "sort_order": 5, "district_id": "district-inxqkycm", "section_key": "directions"}	\N	2026-06-02 12:04:25.245242+00
34bfa66b-b92b-41ce-9792-e26dda195449	content_card	card-zpw78fmi	create	\N	{"id": "card-zpw78fmi", "href": "/raion/podilskyy-rayon", "title": "Подільський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401411712-hy0soiyv8t8.png", "published": true, "region_id": null, "sort_order": 6, "district_id": "district-hwb8a005", "section_key": "directions"}	\N	2026-06-02 12:04:27.594406+00
91835d31-35fb-46d9-afa3-26795231d305	district	district-uvv38np5	delete	{"id": "district-uvv38np5", "name": "Роздільнянський район", "slug": "i-a", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "region_id": "region-odesa", "video_url": null, "created_at": "2026-06-02T11:35:35.661471+00:00", "description": "Роздільнянський район — це близька та доступна природна дестинація Одещини, де безкраї степи поєднуються з мальовничими водоймами та цікавою історичною спадщиною. Лише за годину їзди від Одеси на туристів чекають спокійний відпочинок на природі, риболовля, екологічні маршрути та знайомство з самобутньою культурою півдня України.", "detailed_info": "Головними природними перлинами району є Кучурганське водосховище, схили Хаджибейського лиману, ботанічний заказник «Костянська балка» та екокомплекс «Рідна природа», які створюють чудові можливості для сімейного відпочинку, фототуризму та екологічних подорожей.\\nОсобливий колорит району формує багатонаціональна історія краю. Тут збереглися унікальні пам’ятки німецької колоніальної спадщини, серед яких величні католицькі костели та старовинні храми, що доповнюють туристичні маршрути культурно-пізнавального спрямування.\\nРоздільнянщина також знайомить гостей із локальними фермерськими традиціями, сільською гостинністю та атмосферою справжнього степового краю. Це ідеальне місце для одноденної подорожі, відпочинку на природі та відкриття маловідомих, але надзвичайно цікавих куточків Одещини.\\n\\n"}	\N	vinilxd9@gmail.com	2026-06-02 12:38:03.554555+00
89ba88fe-3d83-4623-a8e4-c7c93da4e4eb	district	district-btn5o6n3	create	\N	{"id": "district-btn5o6n3", "name": "Роздільнянський район", "slug": "rozdilnyanskyy-rayon", "subtitle": null, "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "region_id": "region-odesa", "video_url": null, "description": "Роздільнянський район — це близька та доступна природна дестинація Одещини, де безкраї степи поєднуються з мальовничими водоймами та цікавою історичною спадщиною. Лише за годину їзди від Одеси на туристів чекають спокійний відпочинок на природі, риболовля, екологічні маршрути та знайомство з самобутньою культурою півдня України.", "detailed_info": "Головними природними перлинами району є Кучурганське водосховище, схили Хаджибейського лиману, ботанічний заказник «Костянська балка» та екокомплекс «Рідна природа», які створюють чудові можливості для сімейного відпочинку, фототуризму та екологічних подорожей.\\nОсобливий колорит району формує багатонаціональна історія краю. Тут збереглися унікальні пам’ятки німецької колоніальної спадщини, серед яких величні католицькі костели та старовинні храми, що доповнюють туристичні маршрути культурно-пізнавального спрямування.\\nРоздільнянщина також знайомить гостей із локальними фермерськими традиціями, сільською гостинністю та атмосферою справжнього степового краю. Це ідеальне місце для одноденної подорожі, відпочинку на природі та відкриття маловідомих, але надзвичайно цікавих куточків Одещини.\\n"}	vinilxd9@gmail.com	2026-06-02 12:38:35.751606+00
b56c1b84-0541-432a-9ce1-8e037547ba45	content_card	tourism-type-релігійний-туризм	create	\N	{"id": "tourism-type-релігійний-туризм", "href": null, "title": "Релігійний туризм", "city_id": null, "payload": {}, "page_key": "tourism-types", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405357803.png", "published": true, "region_id": null, "sort_order": 0, "district_id": null, "section_key": "type"}	vinilxd9@gmail.com	2026-06-02 13:02:47.104545+00
d0195ce9-4dcf-443d-b540-556a8dfee121	content_card	tourism-type-спортивний-туризм	create	\N	{"id": "tourism-type-спортивний-туризм", "href": null, "title": "Спортивний туризм", "city_id": null, "payload": {}, "page_key": "tourism-types", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405399490.png", "published": true, "region_id": null, "sort_order": 0, "district_id": null, "section_key": "type"}	vinilxd9@gmail.com	2026-06-02 13:03:22.472729+00
2eeb79d2-710b-446a-8579-34d36c687b9a	content_card	card-houw3nwx	update	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:39:09.803311+00:00", "sort_order": 7, "district_id": "district-btn5o6n3", "section_key": "directions"}	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": false, "region_id": null, "sort_order": 7, "district_id": "district-btn5o6n3", "section_key": "directions"}	\N	2026-06-02 13:22:59.737331+00
a1a1acbc-1185-4925-884d-ee72835bd63a	content_card	card-houw3nwx	update	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": false, "region_id": null, "created_at": "2026-06-02T12:39:09.803311+00:00", "sort_order": 7, "district_id": "district-btn5o6n3", "section_key": "directions"}	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "sort_order": 7, "district_id": "district-btn5o6n3", "section_key": "directions"}	\N	2026-06-02 13:23:01.186521+00
b821ab75-9469-4b62-af6d-57d89b08d0db	content_card	card-houw3nwx	update	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:39:09.803311+00:00", "sort_order": 7, "district_id": "district-btn5o6n3", "section_key": "directions"}	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "sort_order": 6, "district_id": "district-btn5o6n3", "section_key": "directions"}	\N	2026-06-02 13:23:02.55854+00
f20bcd3a-bea8-4106-816a-63daed6903c8	content_card	card-zpw78fmi	update	{"id": "card-zpw78fmi", "href": "/raion/podilskyy-rayon", "title": "Подільський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401411712-hy0soiyv8t8.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:27.45966+00:00", "sort_order": 6, "district_id": "district-hwb8a005", "section_key": "directions"}	{"id": "card-zpw78fmi", "href": "/raion/podilskyy-rayon", "title": "Подільський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401411712-hy0soiyv8t8.png", "published": true, "region_id": null, "sort_order": 7, "district_id": "district-hwb8a005", "section_key": "directions"}	\N	2026-06-02 13:23:02.581182+00
19dc37e2-92a8-42bc-9286-3ec3f1cc1476	content_card	card-s5k7wx4v	update	{"id": "card-s5k7wx4v", "href": "/raion/izmayilskyy-rayon", "title": "Ізмаїльський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401741532-3ic4253e3ho.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:25.146328+00:00", "sort_order": 5, "district_id": "district-inxqkycm", "section_key": "directions"}	{"id": "card-s5k7wx4v", "href": "/raion/izmayilskyy-rayon", "title": "Ізмаїльський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401741532-3ic4253e3ho.png", "published": true, "region_id": null, "sort_order": 4, "district_id": "district-inxqkycm", "section_key": "directions"}	\N	2026-06-02 13:23:09.056557+00
76e86a89-3d15-49f4-a41f-cea626982ce7	content_card	card-tmcfrrpm	update	{"id": "card-tmcfrrpm", "href": "/raion/bolhradskyy-rayon", "title": "Болградський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401679505-nm3n4674yl.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:22.877981+00:00", "sort_order": 4, "district_id": "district-jnun99rr", "section_key": "directions"}	{"id": "card-tmcfrrpm", "href": "/raion/bolhradskyy-rayon", "title": "Болградський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401679505-nm3n4674yl.png", "published": true, "region_id": null, "sort_order": 5, "district_id": "district-jnun99rr", "section_key": "directions"}	\N	2026-06-02 13:23:09.071394+00
894990ee-6b2e-4af2-8b55-80912d65333f	content_card	card-kw2mkhw5	delete	{"id": "card-kw2mkhw5", "href": null, "title": "Текстова картка", "city_id": null, "payload": {"row": 1, "colSpan": 1, "descSize": "sm", "textSize": "md", "description": ""}, "page_key": "index", "subtitle": null, "card_type": "text", "image_url": null, "published": true, "region_id": null, "created_at": "2026-06-02T09:36:59.718153+00:00", "sort_order": 0, "district_id": null, "section_key": "interesting"}	\N	\N	2026-06-02 13:40:51.801033+00
75c947ee-247d-44ef-a483-a17109df733c	content_card	card-s5k7wx4v	update	{"id": "card-s5k7wx4v", "href": "/raion/izmayilskyy-rayon", "title": "Ізмаїльський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401741532-3ic4253e3ho.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:25.146328+00:00", "sort_order": 4, "district_id": "district-inxqkycm", "section_key": "directions"}	{"id": "card-s5k7wx4v", "href": "/raion/izmayilskyy-rayon", "title": "Ізмаїльський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401741532-3ic4253e3ho.png", "published": true, "region_id": null, "sort_order": 3, "district_id": "district-inxqkycm", "section_key": "directions"}	\N	2026-06-02 13:23:10.772434+00
f078d185-5086-4487-894a-01c68c7054f7	content_card	card-uqpzfems	update	{"id": "card-uqpzfems", "href": "/raion/bilhorod-dnistrovskyy-rayon", "title": "Білгород-Дністровський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401841038-zawqt7rid7e.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:20.772265+00:00", "sort_order": 3, "district_id": "district-07uz711u", "section_key": "directions"}	{"id": "card-uqpzfems", "href": "/raion/bilhorod-dnistrovskyy-rayon", "title": "Білгород-Дністровський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401841038-zawqt7rid7e.png", "published": true, "region_id": null, "sort_order": 4, "district_id": "district-07uz711u", "section_key": "directions"}	\N	2026-06-02 13:23:10.829192+00
405fb2de-6b5a-433f-ba5f-ae9a91e5e5f7	content_card	card-s5k7wx4v	update	{"id": "card-s5k7wx4v", "href": "/raion/izmayilskyy-rayon", "title": "Ізмаїльський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401741532-3ic4253e3ho.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:25.146328+00:00", "sort_order": 3, "district_id": "district-inxqkycm", "section_key": "directions"}	{"id": "card-s5k7wx4v", "href": "/raion/izmayilskyy-rayon", "title": "Ізмаїльський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401741532-3ic4253e3ho.png", "published": true, "region_id": null, "sort_order": 2, "district_id": "district-inxqkycm", "section_key": "directions"}	\N	2026-06-02 13:23:14.184854+00
da663798-8e2a-476f-a417-242ea671b5d9	content_card	card-covbcs7h	update	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:19.38473+00:00", "sort_order": 2, "district_id": "district-fvvgs41u", "section_key": "directions"}	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "sort_order": 3, "district_id": "district-fvvgs41u", "section_key": "directions"}	\N	2026-06-02 13:23:14.22813+00
06049f91-e30d-4f04-884d-e0a557a7a1c5	content_card	card-covbcs7h	update	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:19.38473+00:00", "sort_order": 5, "district_id": "district-fvvgs41u", "section_key": "directions"}	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "sort_order": 6, "district_id": "district-fvvgs41u", "section_key": "directions"}	\N	2026-06-02 13:23:33.175807+00
db13900a-3e0c-4834-bd65-5716c1480b69	content_card	card-houw3nwx	update	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:39:09.803311+00:00", "sort_order": 5, "district_id": "district-btn5o6n3", "section_key": "directions"}	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "sort_order": 6, "district_id": "district-btn5o6n3", "section_key": "directions"}	\N	2026-06-02 13:23:33.937939+00
59aadbce-98e3-411d-953f-44f4b0633268	content_card	card-houw3nwx	update	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:39:09.803311+00:00", "sort_order": 6, "district_id": "district-btn5o6n3", "section_key": "directions"}	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "sort_order": 5, "district_id": "district-btn5o6n3", "section_key": "directions"}	\N	2026-06-02 13:23:36.192897+00
dce4344e-f953-4005-b0dc-2c95c83f699a	content_card	card-uqpzfems	update	{"id": "card-uqpzfems", "href": "/raion/bilhorod-dnistrovskyy-rayon", "title": "Білгород-Дністровський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401841038-zawqt7rid7e.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:20.772265+00:00", "sort_order": 4, "district_id": "district-07uz711u", "section_key": "directions"}	{"id": "card-uqpzfems", "href": "/raion/bilhorod-dnistrovskyy-rayon", "title": "Білгород-Дністровський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401841038-zawqt7rid7e.png", "published": true, "region_id": null, "sort_order": 3, "district_id": "district-07uz711u", "section_key": "directions"}	\N	2026-06-02 13:23:17.162099+00
f13c88db-fbff-46aa-bb5f-457214909657	content_card	card-covbcs7h	update	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:19.38473+00:00", "sort_order": 3, "district_id": "district-fvvgs41u", "section_key": "directions"}	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "sort_order": 4, "district_id": "district-fvvgs41u", "section_key": "directions"}	\N	2026-06-02 13:23:17.161396+00
5298340e-df24-46ee-8188-2471a8374b00	content_card	card-covbcs7h	update	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:19.38473+00:00", "sort_order": 6, "district_id": "district-fvvgs41u", "section_key": "directions"}	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "sort_order": 5, "district_id": "district-fvvgs41u", "section_key": "directions"}	\N	2026-06-02 13:23:33.928954+00
6c815528-33b2-401a-8c2c-9959cebe62dd	content_card	card-covbcs7h	update	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:19.38473+00:00", "sort_order": 6, "district_id": "district-fvvgs41u", "section_key": "directions"}	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "sort_order": 7, "district_id": "district-fvvgs41u", "section_key": "directions"}	\N	2026-06-02 13:23:38.000541+00
4674fade-5897-42ff-9ec4-f2879b79d60f	content_card	card-covbcs7h	update	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:19.38473+00:00", "sort_order": 4, "district_id": "district-fvvgs41u", "section_key": "directions"}	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "sort_order": 5, "district_id": "district-fvvgs41u", "section_key": "directions"}	\N	2026-06-02 13:23:22.947074+00
846d7af0-a5eb-4bf1-b2d0-1130f87d2d79	content_card	card-covbcs7h	update	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:19.38473+00:00", "sort_order": 5, "district_id": "district-fvvgs41u", "section_key": "directions"}	{"id": "card-covbcs7h", "href": "/raion/berezivskyy-rayon", "title": "Березівський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png", "published": true, "region_id": null, "sort_order": 6, "district_id": "district-fvvgs41u", "section_key": "directions"}	\N	2026-06-02 13:23:36.191496+00
173c27be-297b-4e22-9b69-91aa150f50dd	tourism_object	place-ge0ykka5	update	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "restaurant", "hours": null, "phone": "+380507780108", "address": "вул. Дерибасівська, 12  ", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.gastronomodesa.com/uk", "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "created_at": "2026-06-02T11:43:15.561364+00:00", "description": "«Гастроном» — ресторан з атмосферою старої Одеси, що поєднує ностальгічний інтер’єр і сучасний гастрономічний підхід. Простір створює відчуття одеського дворика з теплою, невимушеною атмосферою.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Меню поєднує класичні одеські та домашні страви з сучасними інтерпретаціями й локальними продуктами Чорного моря. У страви входять традиційні закуски, рибні позиції, домашня випічка та авторські варіації знайомих рецептів.\\nРесторан із елементами гастролавки, де можна не лише скуштувати страви, а й придбати фірмову продукцію: консервацію, напої та гастрономічні сувеніри.\\n\\nУнікальні особливості\\n- атмосфера старої Одеси в інтер’єрі та подачі\\n- поєднання класичної та сучасної кухні\\n- формат ресторану + магазин локальних продуктів\\n- можливість придбати «одеські смаколики» з собою\\n\\nЗаклад створює відчуття домашнього простору з одеським характером. Обслуговування орієнтоване на невимушене спілкування та гостинність. У вихідні проводяться вечори з живою музикою, що формують атмосферу спільного відпочинку та живої взаємодії гостей.", "tourism_types": ["Гастрономічний туризм"]}	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "restaurant", "hours": null, "phone": "+380507780108", "address": "вул. Дерибасівська, 12  ", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.gastronomodesa.com/uk", "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "description": "«Гастроном» — ресторан з атмосферою старої Одеси, що поєднує ностальгічний інтер’єр і сучасний гастрономічний підхід. Простір створює відчуття одеського дворика з теплою, невимушеною атмосферою.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Меню поєднує класичні одеські та домашні страви з сучасними інтерпретаціями й локальними продуктами Чорного моря. У страви входять традиційні закуски, рибні позиції, домашня випічка та авторські варіації знайомих рецептів.\\nРесторан із елементами гастролавки, де можна не лише скуштувати страви, а й придбати фірмову продукцію: консервацію, напої та гастрономічні сувеніри.\\n\\nУнікальні особливості\\n- атмосфера старої Одеси в інтер’єрі та подачі\\n- поєднання класичної та сучасної кухні\\n- формат ресторану + магазин локальних продуктів\\n- можливість придбати «одеські смаколики» з собою\\n\\nЗаклад створює відчуття домашнього простору з одеським характером. Обслуговування орієнтоване на невимушене спілкування та гостинність. У вихідні проводяться вечори з живою музикою, що формують атмосферу спільного відпочинку та живої взаємодії гостей.", "tourism_types": ["Гастрономічний туризм"]}	\N	2026-06-02 13:23:49.086532+00
6a985506-087c-4f86-b358-5cd6301d3f0d	content_card	card-tmcfrrpm	update	{"id": "card-tmcfrrpm", "href": "/raion/bolhradskyy-rayon", "title": "Болградський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401679505-nm3n4674yl.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:22.877981+00:00", "sort_order": 5, "district_id": "district-jnun99rr", "section_key": "directions"}	{"id": "card-tmcfrrpm", "href": "/raion/bolhradskyy-rayon", "title": "Болградський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401679505-nm3n4674yl.png", "published": true, "region_id": null, "sort_order": 4, "district_id": "district-jnun99rr", "section_key": "directions"}	\N	2026-06-02 13:23:22.948548+00
737e7007-5d0e-4573-843f-7e089aeac28e	content_card	card-uqpzfems	update	{"id": "card-uqpzfems", "href": "/raion/bilhorod-dnistrovskyy-rayon", "title": "Білгород-Дністровський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401841038-zawqt7rid7e.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:20.772265+00:00", "sort_order": 3, "district_id": "district-07uz711u", "section_key": "directions"}	{"id": "card-uqpzfems", "href": "/raion/bilhorod-dnistrovskyy-rayon", "title": "Білгород-Дністровський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401841038-zawqt7rid7e.png", "published": true, "region_id": null, "sort_order": 4, "district_id": "district-07uz711u", "section_key": "directions"}	\N	2026-06-02 13:23:26.583671+00
0373ae9c-0e04-4a2f-8acc-f4b57271c7bd	content_card	card-zpw78fmi	update	{"id": "card-zpw78fmi", "href": "/raion/podilskyy-rayon", "title": "Подільський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401411712-hy0soiyv8t8.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:27.45966+00:00", "sort_order": 7, "district_id": "district-hwb8a005", "section_key": "directions"}	{"id": "card-zpw78fmi", "href": "/raion/podilskyy-rayon", "title": "Подільський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401411712-hy0soiyv8t8.png", "published": true, "region_id": null, "sort_order": 6, "district_id": "district-hwb8a005", "section_key": "directions"}	\N	2026-06-02 13:23:38.004685+00
c515981b-bc2b-4fd7-be38-4a7121f11801	content_card	card-tmcfrrpm	update	{"id": "card-tmcfrrpm", "href": "/raion/bolhradskyy-rayon", "title": "Болградський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401679505-nm3n4674yl.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:04:22.877981+00:00", "sort_order": 4, "district_id": "district-jnun99rr", "section_key": "directions"}	{"id": "card-tmcfrrpm", "href": "/raion/bolhradskyy-rayon", "title": "Болградський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401679505-nm3n4674yl.png", "published": true, "region_id": null, "sort_order": 3, "district_id": "district-jnun99rr", "section_key": "directions"}	\N	2026-06-02 13:23:26.5947+00
2c4cff76-1984-4aa4-89df-525052e0d845	content_card	card-houw3nwx	update	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "created_at": "2026-06-02T12:39:09.803311+00:00", "sort_order": 6, "district_id": "district-btn5o6n3", "section_key": "directions"}	{"id": "card-houw3nwx", "href": "/raion/rozdilnyanskyy-rayon", "title": "Роздільнянський район", "city_id": null, "payload": {}, "page_key": "index", "subtitle": null, "card_type": "destination", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png", "published": true, "region_id": null, "sort_order": 5, "district_id": "district-btn5o6n3", "section_key": "directions"}	\N	2026-06-02 13:23:33.171885+00
c5051ecc-0b60-4c7d-aff5-57f501d746a4	tourism_object	place-5yr7dl7x	delete	{"id": "place-5yr7dl7x", "name": "Hotel Bristol Odesa", "slug": "hotel-bristol-odesa-udwtyb", "type": "hotel", "hours": null, "phone": "+380991234567", "address": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://bristol-hotel.com.ua", "subtitle": "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequa", "amenities": "Просторий вестибюль, Ресторан класичної кухні, Лаунж-бар, SPA-зона, сауна, Фітнес-зал", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "video_url": null, "created_at": "2026-06-02T09:19:35.525983+00:00", "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. ", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", "tourism_types": []}	\N	\N	2026-06-02 13:40:05.079404+00
e1e117c4-5a25-4f57-b934-9531b8a03175	tourism_object	place-zcowiw5a	delete	{"id": "place-zcowiw5a", "name": "Tatar Bunar", "slug": "tatar-bunar-e57xwc", "type": "restaurant", "hours": "Пн-Нд 10:00-22:00", "phone": "+380971234567", "address": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "city_id": "city-p4xh35h1", "map_url": "https://maps.app.goo.gl/6K2TmVww3JWfuF8p6", "website": "https://www.instagram.com/tatar.bunar.odesa/ ", "subtitle": "ресторан / заклад харчування", "amenities": null, "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "video_url": null, "created_at": "2026-06-02T09:23:44.088648+00:00", "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Гастрономічний профіль\\nКухня:\\nазіатсько-середземноморські елементи з локальними традиціями;\\nавтентичні та сучасні страви бессарабського регіону (вареники, супи, мамалига, бринза, локальні супи тощо);\\nвипічка ручної роботи, приготована в дров’яній печі;\\nвикористання якісних місцевих продуктів і українських вин.\\nРесторан подає страви, що ґрунтуються на кухонних традиціях Півдня України і Бессарабії, адаптованих у сучасній інтерпретації.\\nТуристична привабливість\\n✔ унікальне гастрономічне місце з регіональними мотивами;\\n✔ популярний як серед місцевих, так і серед гостей міста;\\n✔ входить до гастрономічних рекомендацій Одеси;\\n✔ можливість поєднати з відвідуванням інших культурних та туристичних об’єктів центру міста.\\nІнфраструктура\\n – просторі зали для обідів та вечерь;\\n – літня тераса (за сезоном);\\n – винна карта з українськими винами;\\n – літній сад і можливість організації подій;\\n – оформлення інтер’єру з елементами місцевої культури.\\nТуристичне значення\\n«Tatar Bunar» - важлива гастрономічна точка Одеси, що презентує автентичну бессарабську кухню в сучасному форматі. Заклад не лише працює як ресторан, але й сприяє культурному та гастрономічному туризму, інтегруючись у локальні маршрути та пропозиції для туристів, охочих знайомитись із кулінарною спадщиною південного регіону України. \\n", "tourism_types": ["Гастрономічний туризм"]}	\N	\N	2026-06-02 13:40:09.545951+00
8668ff92-30d5-4adf-b1e1-2ae15bc4171c	tourism_object	place-ge0ykka5	delete	{"id": "place-ge0ykka5", "name": "Гастроном", "slug": "a-d0yvjx", "type": "restaurant", "hours": null, "phone": "+380507780108", "address": "вул. Дерибасівська, 12  ", "city_id": "city-p4xh35h1", "map_url": null, "website": "https://www.gastronomodesa.com/uk", "subtitle": "ресторан одеської кухні", "amenities": null, "image_url": null, "published": true, "video_url": null, "created_at": "2026-06-02T11:43:15.561364+00:00", "description": "«Гастроном» — ресторан з атмосферою старої Одеси, що поєднує ностальгічний інтер’єр і сучасний гастрономічний підхід. Простір створює відчуття одеського дворика з теплою, невимушеною атмосферою.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Меню поєднує класичні одеські та домашні страви з сучасними інтерпретаціями й локальними продуктами Чорного моря. У страви входять традиційні закуски, рибні позиції, домашня випічка та авторські варіації знайомих рецептів.\\nРесторан із елементами гастролавки, де можна не лише скуштувати страви, а й придбати фірмову продукцію: консервацію, напої та гастрономічні сувеніри.\\n\\nУнікальні особливості\\n- атмосфера старої Одеси в інтер’єрі та подачі\\n- поєднання класичної та сучасної кухні\\n- формат ресторану + магазин локальних продуктів\\n- можливість придбати «одеські смаколики» з собою\\n\\nЗаклад створює відчуття домашнього простору з одеським характером. Обслуговування орієнтоване на невимушене спілкування та гостинність. У вихідні проводяться вечори з живою музикою, що формують атмосферу спільного відпочинку та живої взаємодії гостей.", "tourism_types": ["Гастрономічний туризм"]}	\N	\N	2026-06-02 13:40:14.931403+00
97d13100-1151-4c62-8289-7df3012d45a3	tourism_object	place-91d5orj4	delete	{"id": "place-91d5orj4", "name": "Одеський національний академічний театр опери та балету", "slug": "odeskyy-natsionalnyy-akademichnyy-teatr-opery-ta-baletu-4vowjn", "type": "attraction", "hours": null, "phone": null, "address": null, "city_id": "city-p4xh35h1", "map_url": "https://maps.app.goo.gl/XQ2tQkSjc72eevSUA", "website": null, "subtitle": "пам’ятка архітектури національного значення", "amenities": null, "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "video_url": null, "created_at": "2026-06-02T09:36:02.48469+00:00", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "Одеський національний академічний театр опери та балету є однією з найвизначніших архітектурних пам’яток України та головним символом міста Одеси. Його історія розпочалася у 1810 році, коли було відкрито першу будівлю театру. Після нищівної пожежі 1873 року споруду відбудували заново за грандіозним проєктом відомих віденських архітекторів Фердинанда Фельнера та Германа Гельмера, а урочисте відкриття сучасної будівлі відбулося у 1887 році. Сьогодні ця велична споруда закономірно входить до переліку пам’яток архітектури національного значення.\\nГоловною окрасою театру є його унікальні архітектурні особливості. Будівля виконана у витонченому стилі віденського необароко та приваблює погляди розкішним фасадом із величними скульптурними композиціями. Внутрішній простір вражає підковоподібною формою глядацької зали, яка славиться своєю неповторною акустикою, а також багатим декором інтер’єрів з вишуканою ліпниною, яскравою позолотою та розкішними кришталевими люстрами.\\nМаючи статус національного, театр залишається одним із провідних музичних осередків країни. Його багата мистецька діяльність та різноплановий репертуар включають класичні та сучасні опери, витончені балетні постановки, масштабні симфонічні концерти, а також різноманітні фестивальні, міжнародні проєкти та захопливі гастрольні програми.", "tourism_types": ["Історико-культурний туризм"]}	\N	\N	2026-06-02 13:40:17.448256+00
48a54fdd-ce45-4c56-b0fd-d0292c4ed4ba	city	city-zqcmp1iz	update	{"id": "city-zqcmp1iz", "name": "Доброслав", "slug": "dobroslav", "reel_url": "Kurisove, UA", "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780474235289-fkort9lrknt.jpg", "video_url": null, "created_at": "2026-06-03T08:11:01.49494+00:00", "description": "<p>Доброслав — яскравий приклад того, як невелике селище може стати сучасним, комфортним і привабливим туристичним центром. Розташований неподалік Одеси, він вражає гостей доглянутими вулицями, оригінальними громадськими просторами, великою кількістю парків та особливою атмосферою затишку й гостинності.</p><p></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Історія Доброслава бере свій початок понад два століття тому. Засноване у 1802 році, селище пройшло шлях від невеликого поселення на важливому поштовому шляху до сучасного адміністративного центру громади, який сьогодні є одним із найуспішніших прикладів розвитку малих населених пунктів України.</p><p>Справжньою візитівкою Доброслава стали його тематичні парки та зелені зони відпочинку. У селищі створено понад десять унікальних парків, кожен із яких має власну концепцію та атмосферу. Особливе місце займає знаменита «Долина квітів» — мальовничий простір, який щороку приваблює тисячі відвідувачів різнобарвними квітковими композиціями та фотолокаціями.</p><p>Під час прогулянок Доброславом гостей зустрічають сучасні фонтани, затишні сквери, оригінальні артоб’єкти та комфортні громадські простори. Селище стало відомим далеко за межами Одещини завдяки креативним проєктам громади та нестандартним підходам до благоустрою. Одним із символів населеного пункту стала новорічна ялинка, створена з морських черепашок, яка увійшла до Книги національних рекордів України.</p><p>Доброслав активно розвиває культурно-подієвий туризм. Протягом року тут відбуваються фестивалі, концерти, ярмарки та тематичні заходи, які об’єднують мешканців і гостей громади. Завдяки цьому селище стало популярною локацією для сімейного відпочинку та подорожей вихідного дня.</p><p>Розвинена інфраструктура, заклади харчування, спортивні та дитячі майданчики, сучасні громадські простори й зручне транспортне сполучення роблять Доброслав комфортним для відвідування в будь-яку пору року.</p><p>Доброслав — це територія креативних ідей, красивих парків та успішних громадських ініціатив. Місце, де сучасний благоустрій гармонійно поєднується з південною гостинністю та любов’ю до свого краю.</p>", "weather_city_name": null}	{"id": "city-zqcmp1iz", "name": "Доброслав", "slug": "dobroslav", "reel_url": "Kurisove, UA", "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780474235289-fkort9lrknt.jpg", "video_url": null, "description": "<p>Доброслав — яскравий приклад того, як невелике селище може стати сучасним, комфортним і привабливим туристичним центром. Розташований неподалік Одеси, він вражає гостей доглянутими вулицями, оригінальними громадськими просторами, великою кількістю парків та особливою атмосферою затишку й гостинності.</p><p></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Історія Доброслава бере свій початок понад два століття тому. Засноване у 1802 році, селище пройшло шлях від невеликого поселення на важливому поштовому шляху до сучасного адміністративного центру громади, який сьогодні є одним із найуспішніших прикладів розвитку малих населених пунктів України.</p><p>Справжньою візитівкою Доброслава стали його тематичні парки та зелені зони відпочинку. У селищі створено понад десять унікальних парків, кожен із яких має власну концепцію та атмосферу. Особливе місце займає знаменита «Долина квітів» — мальовничий простір, який щороку приваблює тисячі відвідувачів різнобарвними квітковими композиціями та фотолокаціями.</p><p>Під час прогулянок Доброславом гостей зустрічають сучасні фонтани, затишні сквери, оригінальні артоб’єкти та комфортні громадські простори. Селище стало відомим далеко за межами Одещини завдяки креативним проєктам громади та нестандартним підходам до благоустрою. Одним із символів населеного пункту стала новорічна ялинка, створена з морських черепашок, яка увійшла до Книги національних рекордів України.</p><p>Доброслав активно розвиває культурно-подієвий туризм. Протягом року тут відбуваються фестивалі, концерти, ярмарки та тематичні заходи, які об’єднують мешканців і гостей громади. Завдяки цьому селище стало популярною локацією для сімейного відпочинку та подорожей вихідного дня.</p><p>Розвинена інфраструктура, заклади харчування, спортивні та дитячі майданчики, сучасні громадські простори й зручне транспортне сполучення роблять Доброслав комфортним для відвідування в будь-яку пору року.</p><p>Доброслав — це територія креативних ідей, красивих парків та успішних громадських ініціатив. Місце, де сучасний благоустрій гармонійно поєднується з південною гостинністю та любов’ю до свого краю.</p>", "weather_city_name": null}	tourism@od.gov.ua	2026-06-03 08:16:15.072036+00
bd47ce9c-9c93-4569-95c6-c6a7f0ec36a0	tourism_object	place-e39bxti7	delete	{"id": "place-e39bxti7", "name": "VIVAT BALLET!", "slug": "vivat-ballet-u00u9c", "type": "event", "hours": null, "phone": null, "address": null, "city_id": "city-p4xh35h1", "map_url": "https://maps.app.goo.gl/XQ2tQkSjc72eevSUA", "website": null, "subtitle": "Гала-концерт на два відділення", "amenities": null, "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1776830861.jpg", "published": true, "video_url": null, "created_at": "2026-06-02T09:03:53.851725+00:00", "description": "Очікуємо на витонченому гала-концерті «Vivat, ballet!», яка поєднає улюблені глядачами світові шедеври балетної класики та хіти сучасної хореографії, що вражають красою і технікою, вишуканістю і майстерністю, занурюють глядача в особливий, емоціональний світ прекрасного. Цим номерам аплодувала Європа та кращі театральні зали світу, і ось – вони на славетній сцені Одеської опери.", "district_id": "district-c6ididsh", "event_dates": "10 - 11 ЛИПНЯ 2026", "detailed_info": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", "tourism_types": ["Розважальний туризм", "Історико-культурний туризм"]}	\N	\N	2026-06-02 13:40:19.609511+00
c0df1e4d-4ee2-4b42-b5d9-2a40ab4e644e	tourism_object	place-lrwps4o6	delete	{"id": "place-lrwps4o6", "name": "Одеський національний художній музей", "slug": "odeskyy-natsionalnyy-khudozhniy-muzey-e6udma", "type": "attraction", "hours": null, "phone": null, "address": null, "city_id": "city-p4xh35h1", "map_url": "https://maps.app.goo.gl/JYW7RgtZx1hLuUNJ6", "website": null, "subtitle": null, "amenities": null, "image_url": "https://city-afisha.od.ua/wp-content/uploads/2025/04/odes-musey.webp", "published": true, "video_url": null, "created_at": "2026-06-02T10:05:44.225856+00:00", "description": "Будівлю, в якій розташовано Одеський художній музей, було збудовано в період між 1824 і 1828 роками. Автор проекту невідомий. Після закінчення будівництва споруду освідчив відомий одеський архітектор Франс Карлович Боффо. Першою власницею палацу була графиня Ольга Станіславівна Наришкіна (уроджена Потоцька).\\n", "district_id": "district-c6ididsh", "event_dates": null, "detailed_info": "У 1888 році палац придбав одеський міський голова Григорій Григорович Маразлі — відомий громадський діяч, колекціонер і меценат. У 1892 році він передав палац місту з метою створення в ньому музею витончених мистецтв. Відкриття музею відбулося 24 жовтня (6 листопада) 1899 року.\\nАрхітектура палацу втілює в собі кращі традиції класицизму початку ХІХ століття. Центрична композиція споруди вирізняється строгою та гармонійною витонченістю — двоповерховий корпус з портиком із шести колон корінфського ордеру, що підтримують фронтон, і два симетрично розташовані одноповерхові фліґелі, з’єднані округлими галереями.\\n", "tourism_types": ["Історико-культурний туризм"]}	\N	\N	2026-06-02 13:40:21.444155+00
ae176517-1cb2-4bf7-abbc-52711ad025d9	city	city-s56s03ad	delete	{"id": "city-s56s03ad", "name": "Овідіополь", "slug": "ovidiopol", "subtitle": "Туристичний паспорт", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780390215526-0kqh1hc2mxja.jpeg", "video_url": null, "created_at": "2026-06-02T08:49:39.894187+00:00", "description": "Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.\\n", "district_id": "district-c6ididsh", "detailed_info": "Територія сучасного Овідіополя була заселена ще з давніх часів. Археологічні дослідження виявили тут залишки шести давніх поселень: два належать до скіфського періоду (IV–III ст. до н. е.), два - до сарматського (II ст. до н. е. - III ст. н. е.), а ще два містять пам’ятки черняхівської культури (III-V ст. н. е.).\\nУ XVI столітті на цьому місці існувало місто-фортеця Чорногрод, засноване Василем Красним. Пізніше тут виникло кримськотатарське поселення Хаджидер, яке було важливим торговим пунктом і портом. Під час російсько-турецької війни 1768-1774 років поселення було зруйноване запорозькими козаками.\\nПісля завершення російсько-турецької війни 1787-1791 років біля колишнього Хаджидера розпочалося будівництво нової фортеці та адміралтейства. Фортеця була зведена у 1793 році за проєктом інженера Франца де Волана під керівництвом інженер-капітана Є. Ферстера. Вона стала частиною системи оборонних укріплень на новому кордоні з Османською імперією разом із Тираспольською та Хаджибейською фортецями.\\nУ 1795 році за указом імператриці Катерини II фортецю і місто було перейменовано на Овідіополь. Назву пов’язують із легендою про римського поета Овідія, який перебував у засланні на узбережжі Чорного моря.\\n"}	\N	\N	2026-06-02 13:40:35.359673+00
9b8213cf-5054-4e3f-a705-dc773896214a	city	city-p4xh35h1	delete	{"id": "city-p4xh35h1", "name": "Одеса", "slug": "odesa", "subtitle": null, "image_url": "https://omr.gov.ua/images/galleries/maxi/51834.jpg", "video_url": null, "created_at": "2026-06-02T09:01:35.955641+00:00", "description": null, "district_id": "district-c6ididsh", "detailed_info": null}	\N	\N	2026-06-02 13:40:37.465797+00
1c4afbc7-fd02-4443-b22c-a5e42005f328	content_card	card-ehav4ou1	delete	{"id": "card-ehav4ou1", "href": null, "title": "Hotel Bristol Odesa", "city_id": null, "payload": {"row": 1, "colSpan": 2, "placeId": "place-5yr7dl7x", "textSize": "md", "description": "Готель був побудований в 1898–1899 роки за проєктом архітекторів Олександра Бернардацці і Адольфа Мінкуса навпроти будівлі Купецької біржі і поруч з будівлею Державного банку, і на той час і зараз один з найкрасивіших готелів Одеси. "}, "page_key": "index", "subtitle": "вул. Італійська, 15, м. Одеса, Одеський район, Одеська область", "card_type": "hotel", "image_url": "https://bristol-hotel.com.ua/assets/uploads/2024/12/1.jpg", "published": true, "region_id": null, "created_at": "2026-06-02T09:24:02.579124+00:00", "sort_order": 1, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	\N	2026-06-02 13:40:54.123678+00
4159ce67-c1e0-4eb4-b873-10495b141dee	content_card	card-acl93be4	delete	{"id": "card-acl93be4", "href": null, "title": "Tatar Bunar", "city_id": null, "payload": {"row": 1, "colSpan": 1, "placeId": "place-zcowiw5a", "textSize": "md", "description": "«Tatar Bunar» - сучасний ресторан, який спеціалізується на бессарабській кухні з етнографічними мотивами південного регіону Одеської області. Заклад відображає мікс кулінарних традицій, сформованих під впливом української, молдавської, болгарської та інших етнокультур, що характерні для Бессарабії.\\n"}, "page_key": "index", "subtitle": "вул. Леонтовича, 13, м.Одеса, Одеський район, Одеська область.", "card_type": "restaurant", "image_url": "https://expolight.net/storage/files/cache/project/tatar-bunar/24-10-02-0372-73169c82cf847720aebfdbf7604e4a4b-w1440.webp", "published": true, "region_id": null, "created_at": "2026-06-02T09:24:04.408171+00:00", "sort_order": 2, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	\N	2026-06-02 13:40:56.540382+00
81248316-2642-4e20-8f10-601d377f567e	content_card	card-hkjkn9fr	delete	{"id": "card-hkjkn9fr", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": null, "payload": {"row": 2, "colSpan": 3, "placeId": "place-91d5orj4", "textSize": "lg", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "created_at": "2026-06-02T09:36:30.904373+00:00", "sort_order": 3, "district_id": "district-c6ididsh", "section_key": "interesting"}	\N	\N	2026-06-02 13:40:58.902144+00
d8027204-63d9-4464-be0c-f0572066d4e4	content_card	card-gmy20dew	delete	{"id": "card-gmy20dew", "href": null, "title": "Одеський національний академічний театр опери та балету", "city_id": null, "payload": {"placeId": "place-91d5orj4", "description": "Перша будівля театру в Одесі була відкрита у 1810 році. Після пожежі 1873 року споруду було збудовано заново за проєктом віденських архітекторів Фердинанда Фельнера та Германа Гельмера. Урочисте відкриття сучасної будівлі відбулося у 1887 році.\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://slovo.odessa.ua/uploads/posts/2018-11/1542886736_operniy_02.jpg", "published": true, "region_id": null, "created_at": "2026-06-02T09:36:11.912204+00:00", "sort_order": 0, "district_id": "district-c6ididsh", "section_key": "attractions"}	\N	\N	2026-06-02 13:41:02.075806+00
02f406e0-1a02-4dd7-834f-4b5cfa1800da	content_card	card-5dqk6q4h	delete	{"id": "card-5dqk6q4h", "href": null, "title": "Одеський національний художній музей", "city_id": null, "payload": {"placeId": "place-lrwps4o6", "description": "Будівлю, в якій розташовано Одеський художній музей, було збудовано в період між 1824 і 1828 роками. Автор проекту невідомий. Після закінчення будівництва споруду освідчив відомий одеський архітектор Франс Карлович Боффо. Першою власницею палацу була графиня Ольга Станіславівна Наришкіна (уроджена Потоцька).\\n"}, "page_key": "index", "subtitle": "Одеса", "card_type": "attraction", "image_url": "https://city-afisha.od.ua/wp-content/uploads/2025/04/odes-musey.webp", "published": true, "region_id": null, "created_at": "2026-06-02T10:05:57.001568+00:00", "sort_order": 1, "district_id": "district-c6ididsh", "section_key": "attractions"}	\N	\N	2026-06-02 13:41:04.094541+00
28e752a2-75d3-4b4c-825d-3dcdc3bf7245	content_card	card-9i8o9wbp	delete	{"id": "card-9i8o9wbp", "href": null, "title": "VIVAT BALLET!", "city_id": null, "payload": {"placeId": "place-e39bxti7", "badgeDay": "", "badgeTop": "10 - 11", "badgeMonth": "липня", "description": "Очікуємо на витонченому гала-концерті «Vivat, ballet!», яка поєднає улюблені глядачами світові шедеври балетної класики та хіти сучасної хореографії, що вражають красою і технікою, вишуканістю і майстерністю, занурюють глядача в особливий, емоціональний світ прекрасного. Цим номерам аплодувала Європа та кращі театральні зали світу, і ось – вони на славетній сцені Одеської опери."}, "page_key": "index", "subtitle": "Одеса", "card_type": "event", "image_url": "https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1776830861.jpg", "published": true, "region_id": null, "created_at": "2026-06-02T09:04:17.193716+00:00", "sort_order": 0, "district_id": "district-c6ididsh", "section_key": "events"}	\N	\N	2026-06-02 13:41:07.54189+00
dbc06f79-e765-425a-861c-f1b53531e7e6	city	city-amctg0e7	create	\N	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "subtitle": "Районний центр", "image_url": "https://en.wikipedia.org/wiki/File:%D0%A1%D0%BF%D0%B0%D1%81%D0%BE-%D0%9F%D1%80%D0%B5%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D1%81%D1%8C%D0%BA%D0%B8%D0%B9_%D1%81%D0%BE%D0%B1%D0%BE%D1%80,_%D0%91%D0%BE%D0%BB%D0%B3%D1%80%D0%B0%D0%B4_2017.jpg", "video_url": null, "description": "Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України.\\nУ 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.\\n", "district_id": "district-jnun99rr", "detailed_info": "Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність.\\nМісто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі.\\n\\n\\nПоряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території.\\n\\n\\nБолград має виражену спеціалізацію у:\\n– еногастрономічному туризмі (виноробні півдня Одещини);\\n– етнокультурному туризмі (болгарська спадщина);\\n – подієвому туризмі (винні фестивалі, національні свята);\\n – зеленому туризмі (узбережжя озера Ялпуг та ін.)."}	\N	2026-06-02 13:50:35.247259+00
f5e17f5a-6d33-4639-b834-b7470fd4ac98	city	city-amctg0e7	update	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "reel_url": null, "subtitle": "Районний центр", "image_url": "https://en.wikipedia.org/wiki/File:%D0%A1%D0%BF%D0%B0%D1%81%D0%BE-%D0%9F%D1%80%D0%B5%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D1%81%D1%8C%D0%BA%D0%B8%D0%B9_%D1%81%D0%BE%D0%B1%D0%BE%D1%80,_%D0%91%D0%BE%D0%BB%D0%B3%D1%80%D0%B0%D0%B4_2017.jpg", "video_url": null, "created_at": "2026-06-02T13:50:35.090756+00:00", "description": "Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України.\\nУ 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.\\n", "district_id": "district-jnun99rr", "detailed_info": "Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність.\\nМісто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі.\\n\\n\\nПоряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території.\\n\\n\\nБолград має виражену спеціалізацію у:\\n– еногастрономічному туризмі (виноробні півдня Одещини);\\n– етнокультурному туризмі (болгарська спадщина);\\n – подієвому туризмі (винні фестивалі, національні свята);\\n – зеленому туризмі (узбережжя озера Ялпуг та ін.)."}	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "subtitle": "Районний центр", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780408501483-cp4ntb6cqpq.webp", "video_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780408551527-7r440dwh3es.mp4", "description": "Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України.\\nУ 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.\\n", "district_id": "district-jnun99rr", "detailed_info": "Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність.\\nМісто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі.\\n\\n\\nПоряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території.\\n\\n\\nБолград має виражену спеціалізацію у:\\n– еногастрономічному туризмі (виноробні півдня Одещини);\\n– етнокультурному туризмі (болгарська спадщина);\\n – подієвому туризмі (винні фестивалі, національні свята);\\n – зеленому туризмі (узбережжя озера Ялпуг та ін.)."}	\N	2026-06-02 13:56:03.331046+00
8602b5dd-fa0b-426a-b7e6-a46a434ee825	city	city-amctg0e7	update	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "reel_url": null, "subtitle": "Районний центр", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780408501483-cp4ntb6cqpq.webp", "video_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780408551527-7r440dwh3es.mp4", "created_at": "2026-06-02T13:50:35.090756+00:00", "description": "Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України.\\nУ 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.\\n", "district_id": "district-jnun99rr", "detailed_info": "Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність.\\nМісто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі.\\n\\n\\nПоряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території.\\n\\n\\nБолград має виражену спеціалізацію у:\\n– еногастрономічному туризмі (виноробні півдня Одещини);\\n– етнокультурному туризмі (болгарська спадщина);\\n – подієвому туризмі (винні фестивалі, національні свята);\\n – зеленому туризмі (узбережжя озера Ялпуг та ін.)."}	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "subtitle": "Районний центр", "image_url": null, "video_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780408551527-7r440dwh3es.mp4", "description": "Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України.\\nУ 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.\\n", "district_id": "district-jnun99rr", "detailed_info": "Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність.\\nМісто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі.\\n\\n\\nПоряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території.\\n\\n\\nБолград має виражену спеціалізацію у:\\n– еногастрономічному туризмі (виноробні півдня Одещини);\\n– етнокультурному туризмі (болгарська спадщина);\\n – подієвому туризмі (винні фестивалі, національні свята);\\n – зеленому туризмі (узбережжя озера Ялпуг та ін.)."}	\N	2026-06-02 13:57:38.204332+00
4c8d8d31-0a3e-4fdc-8c9d-90072d02b41c	city	city-amctg0e7	update	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "reel_url": null, "subtitle": "Районний центр", "image_url": null, "video_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780408551527-7r440dwh3es.mp4", "created_at": "2026-06-02T13:50:35.090756+00:00", "description": "Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України.\\nУ 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.\\n", "district_id": "district-jnun99rr", "detailed_info": "Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність.\\nМісто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі.\\n\\n\\nПоряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території.\\n\\n\\nБолград має виражену спеціалізацію у:\\n– еногастрономічному туризмі (виноробні півдня Одещини);\\n– етнокультурному туризмі (болгарська спадщина);\\n – подієвому туризмі (винні фестивалі, національні свята);\\n – зеленому туризмі (узбережжя озера Ялпуг та ін.)."}	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "subtitle": "Районний центр", "image_url": null, "video_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780408551527-7r440dwh3es.mp4", "description": "Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України.\\nУ 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.\\n", "district_id": "district-jnun99rr", "detailed_info": "Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність.\\nМісто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі.\\n\\n\\nПоряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території.\\n\\n\\nБолград має виражену спеціалізацію у:\\n– еногастрономічному туризмі (виноробні півдня Одещини);\\n– етнокультурному туризмі (болгарська спадщина);\\n – подієвому туризмі (винні фестивалі, національні свята);\\n – зеленому туризмі (узбережжя озера Ялпуг та ін.)."}	\N	2026-06-02 13:57:56.925287+00
5de113a5-8efc-45d4-8ad7-f86a31fbcb0d	city	city-7z4cirq1	create	\N	{"id": "city-7z4cirq1", "name": "Чорноморськ", "slug": "chornomorsk", "subtitle": "Місто", "image_url": null, "video_url": "https://drive.google.com/file/d/1lNkPHIpj87yDD4W2r3liQhOi_gNJo3ER/view?usp=sharing", "description": "Чорноморськ - молоде, перспективне місто-курорт, що по праву вважається перлиною одеського узбережжя. Поєднує сучасну інфраструктуру, компактність та комфортний морський клімат.\\n", "district_id": "district-c6ididsh", "detailed_info": "Місто приваблює гостей 12 кілометрами широких безкоштовних піщаних пляжів із пологим входом у море, що робить відпочинок комфортним як для дорослих, так і для дітей. Завдяки компактним розмірам Чорноморська його можна перетнути пішки менш ніж за годину, насолоджуючись затишною атмосферою та морськими краєвидами.\\n\\nСтепове повітря, насичене морським бризом, створює особливий мікроклімат, а тепле літо з температурою від +22 до +32 °C та комфортною температурою морської води забезпечує чудові умови для відпочинку протягом усього курортного сезону.\\n\\nМіський пляж Чорноморська багато років поспіль підтверджував відповідність міжнародним стандартам якості та екологічної безпеки, що свідчить про високий рівень благоустрою та сервісу. Для відпочивальників облаштовані рятувальні та медичні пункти, душові кабіни, роздягальні та зони відпочинку.\\n\\nДля проживання гостям доступний широкий вибір варіантів — від сучасних готелів і апартаментів до баз відпочинку та затишного приватного сектору. У місті працюють численні кафе, ресторани та розважальні заклади, торгові центри, супермаркети, аптеки та медичні установи.\\n\\nОсобливої атмосфери Чорноморськ набуває у вечірній час, коли центральна частина міста та мальовнича набережна з ілюмінацією стають улюбленим місцем прогулянок, зустрічей і відпочинку.\\n\\nЧорноморськ — це море, комфорт і гостинність, які дарують можливість насолодитися справжнім відпочинком на узбережжі Чорного моря."}	\N	2026-06-02 14:04:46.171332+00
d212ecd3-73b8-4e2f-96c8-ef62b23fc28c	city	city-7z4cirq1	update	{"id": "city-7z4cirq1", "name": "Чорноморськ", "slug": "chornomorsk", "reel_url": null, "subtitle": "Місто", "image_url": null, "video_url": "https://drive.google.com/file/d/1lNkPHIpj87yDD4W2r3liQhOi_gNJo3ER/view?usp=sharing", "created_at": "2026-06-02T14:04:46.063449+00:00", "description": "Чорноморськ - молоде, перспективне місто-курорт, що по праву вважається перлиною одеського узбережжя. Поєднує сучасну інфраструктуру, компактність та комфортний морський клімат.\\n", "district_id": "district-c6ididsh", "detailed_info": "Місто приваблює гостей 12 кілометрами широких безкоштовних піщаних пляжів із пологим входом у море, що робить відпочинок комфортним як для дорослих, так і для дітей. Завдяки компактним розмірам Чорноморська його можна перетнути пішки менш ніж за годину, насолоджуючись затишною атмосферою та морськими краєвидами.\\n\\nСтепове повітря, насичене морським бризом, створює особливий мікроклімат, а тепле літо з температурою від +22 до +32 °C та комфортною температурою морської води забезпечує чудові умови для відпочинку протягом усього курортного сезону.\\n\\nМіський пляж Чорноморська багато років поспіль підтверджував відповідність міжнародним стандартам якості та екологічної безпеки, що свідчить про високий рівень благоустрою та сервісу. Для відпочивальників облаштовані рятувальні та медичні пункти, душові кабіни, роздягальні та зони відпочинку.\\n\\nДля проживання гостям доступний широкий вибір варіантів — від сучасних готелів і апартаментів до баз відпочинку та затишного приватного сектору. У місті працюють численні кафе, ресторани та розважальні заклади, торгові центри, супермаркети, аптеки та медичні установи.\\n\\nОсобливої атмосфери Чорноморськ набуває у вечірній час, коли центральна частина міста та мальовнича набережна з ілюмінацією стають улюбленим місцем прогулянок, зустрічей і відпочинку.\\n\\nЧорноморськ — це море, комфорт і гостинність, які дарують можливість насолодитися справжнім відпочинком на узбережжі Чорного моря."}	{"id": "city-7z4cirq1", "name": "Чорноморськ", "slug": "chornomorsk", "subtitle": "Місто", "image_url": "https://travels.in.ua/,/locality/6885", "video_url": null, "description": "Чорноморськ - молоде, перспективне місто-курорт, що по праву вважається перлиною одеського узбережжя. Поєднує сучасну інфраструктуру, компактність та комфортний морський клімат.\\n", "district_id": "district-c6ididsh", "detailed_info": "Місто приваблює гостей 12 кілометрами широких безкоштовних піщаних пляжів із пологим входом у море, що робить відпочинок комфортним як для дорослих, так і для дітей. Завдяки компактним розмірам Чорноморська його можна перетнути пішки менш ніж за годину, насолоджуючись затишною атмосферою та морськими краєвидами.\\n\\nСтепове повітря, насичене морським бризом, створює особливий мікроклімат, а тепле літо з температурою від +22 до +32 °C та комфортною температурою морської води забезпечує чудові умови для відпочинку протягом усього курортного сезону.\\n\\nМіський пляж Чорноморська багато років поспіль підтверджував відповідність міжнародним стандартам якості та екологічної безпеки, що свідчить про високий рівень благоустрою та сервісу. Для відпочивальників облаштовані рятувальні та медичні пункти, душові кабіни, роздягальні та зони відпочинку.\\n\\nДля проживання гостям доступний широкий вибір варіантів — від сучасних готелів і апартаментів до баз відпочинку та затишного приватного сектору. У місті працюють численні кафе, ресторани та розважальні заклади, торгові центри, супермаркети, аптеки та медичні установи.\\n\\nОсобливої атмосфери Чорноморськ набуває у вечірній час, коли центральна частина міста та мальовнича набережна з ілюмінацією стають улюбленим місцем прогулянок, зустрічей і відпочинку.\\n\\nЧорноморськ — це море, комфорт і гостинність, які дарують можливість насолодитися справжнім відпочинком на узбережжі Чорного моря."}	\N	2026-06-02 14:10:32.840465+00
8f9f4ad9-0c81-42da-a549-a2ff5432034a	city	city-pzp3jwc6	create	\N	{"id": "city-pzp3jwc6", "name": "Пужайкове", "slug": "puzhaykove", "reel_url": "https://drive.google.com/file/d/1Ik1NGGwgmhwQw9upI3e1mpXHYXwXFwIa/view?usp=sharing", "subtitle": "Село", "image_url": null, "video_url": null, "description": "<p style=\\"text-align: left;\\">Пужайкове - автентичне село з традиційною забудовою, мальовничими природними ландшафтами та збереженим сільським укладом життя. Територія відзначається поєднанням степових просторів, балок і лісових масивів, що формують характерний для півночі Одещини краєвид.</p><p><br></p>", "district_id": "district-hwb8a005", "detailed_info": "<p>Село має давню історію формування як аграрне поселення Подільського краю. Розвиток території був пов’язаний із землеробством і тваринництвом, що визначило традиційний уклад життя та планування забудови.</p><p style=\\"text-align: justify;\\">У ХІХ–ХХ століттях Пужайкове розвивалося як типовий сільський населений пункт північної Одещини, зберігши риси історичного планування та локальні культурні традиції.</p><h3 style=\\"text-align: justify;\\"><strong>Туристичний потенціал</strong></h3><ul><li><p style=\\"text-align: justify;\\">Зелений та агротуризм – можливість занурення в традиційне сільське середовище.</p></li><li><p style=\\"text-align: justify;\\">Етнографічна привабливість – місцеві звичаї, кухня, народні традиції Поділля.</p></li><li><p style=\\"text-align: justify;\\">Природні маршрути – простір для піших та велосипедних прогулянок.</p></li><li><p style=\\"text-align: justify;\\">Локальні події громади – участь у культурних та громадських заходах.</p></li></ul><p></p>"}	tourism@od.gov.ua	2026-06-02 14:12:01.391094+00
d061c15c-7258-40ed-9ece-b82409b26f1e	city	city-pzp3jwc6	update	{"id": "city-pzp3jwc6", "name": "Пужайкове", "slug": "puzhaykove", "reel_url": "https://drive.google.com/file/d/1Ik1NGGwgmhwQw9upI3e1mpXHYXwXFwIa/view?usp=sharing", "subtitle": "Село", "image_url": null, "video_url": null, "created_at": "2026-06-02T14:12:00.892602+00:00", "description": "<p style=\\"text-align: left;\\">Пужайкове - автентичне село з традиційною забудовою, мальовничими природними ландшафтами та збереженим сільським укладом життя. Територія відзначається поєднанням степових просторів, балок і лісових масивів, що формують характерний для півночі Одещини краєвид.</p><p><br></p>", "district_id": "district-hwb8a005", "detailed_info": "<p>Село має давню історію формування як аграрне поселення Подільського краю. Розвиток території був пов’язаний із землеробством і тваринництвом, що визначило традиційний уклад життя та планування забудови.</p><p style=\\"text-align: justify;\\">У ХІХ–ХХ століттях Пужайкове розвивалося як типовий сільський населений пункт північної Одещини, зберігши риси історичного планування та локальні культурні традиції.</p><h3 style=\\"text-align: justify;\\"><strong>Туристичний потенціал</strong></h3><ul><li><p style=\\"text-align: justify;\\">Зелений та агротуризм – можливість занурення в традиційне сільське середовище.</p></li><li><p style=\\"text-align: justify;\\">Етнографічна привабливість – місцеві звичаї, кухня, народні традиції Поділля.</p></li><li><p style=\\"text-align: justify;\\">Природні маршрути – простір для піших та велосипедних прогулянок.</p></li><li><p style=\\"text-align: justify;\\">Локальні події громади – участь у культурних та громадських заходах.</p></li></ul><p></p>"}	{"id": "city-pzp3jwc6", "name": "Пужайкове", "slug": "puzhaykove", "reel_url": null, "subtitle": "Село", "image_url": null, "video_url": null, "description": "<p style=\\"text-align: left;\\">Пужайкове - автентичне село з традиційною забудовою, мальовничими природними ландшафтами та збереженим сільським укладом життя. Територія відзначається поєднанням степових просторів, балок і лісових масивів, що формують характерний для півночі Одещини краєвид.</p><p><br></p>", "district_id": "district-hwb8a005", "detailed_info": "<p>Село має давню історію формування як аграрне поселення Подільського краю. Розвиток території був пов’язаний із землеробством і тваринництвом, що визначило традиційний уклад життя та планування забудови.</p><p style=\\"text-align: justify;\\">У ХІХ–ХХ століттях Пужайкове розвивалося як типовий сільський населений пункт північної Одещини, зберігши риси історичного планування та локальні культурні традиції.</p><h3 style=\\"text-align: justify;\\"><strong>Туристичний потенціал</strong></h3><ul><li><p style=\\"text-align: justify;\\">Зелений та агротуризм – можливість занурення в традиційне сільське середовище.</p></li><li><p style=\\"text-align: justify;\\">Етнографічна привабливість – місцеві звичаї, кухня, народні традиції Поділля.</p></li><li><p style=\\"text-align: justify;\\">Природні маршрути – простір для піших та велосипедних прогулянок.</p></li><li><p style=\\"text-align: justify;\\">Локальні події громади – участь у культурних та громадських заходах.</p></li></ul><p></p>"}	tourism@od.gov.ua	2026-06-02 14:14:03.419893+00
8e83dd5c-3ba3-4eea-a84f-f775ee652bfd	city	city-7z4cirq1	update	{"id": "city-7z4cirq1", "name": "Чорноморськ", "slug": "chornomorsk", "reel_url": null, "subtitle": "Місто", "image_url": "https://travels.in.ua/,/locality/6885", "video_url": null, "created_at": "2026-06-02T14:04:46.063449+00:00", "description": "Чорноморськ - молоде, перспективне місто-курорт, що по праву вважається перлиною одеського узбережжя. Поєднує сучасну інфраструктуру, компактність та комфортний морський клімат.\\n", "district_id": "district-c6ididsh", "detailed_info": "Місто приваблює гостей 12 кілометрами широких безкоштовних піщаних пляжів із пологим входом у море, що робить відпочинок комфортним як для дорослих, так і для дітей. Завдяки компактним розмірам Чорноморська його можна перетнути пішки менш ніж за годину, насолоджуючись затишною атмосферою та морськими краєвидами.\\n\\nСтепове повітря, насичене морським бризом, створює особливий мікроклімат, а тепле літо з температурою від +22 до +32 °C та комфортною температурою морської води забезпечує чудові умови для відпочинку протягом усього курортного сезону.\\n\\nМіський пляж Чорноморська багато років поспіль підтверджував відповідність міжнародним стандартам якості та екологічної безпеки, що свідчить про високий рівень благоустрою та сервісу. Для відпочивальників облаштовані рятувальні та медичні пункти, душові кабіни, роздягальні та зони відпочинку.\\n\\nДля проживання гостям доступний широкий вибір варіантів — від сучасних готелів і апартаментів до баз відпочинку та затишного приватного сектору. У місті працюють численні кафе, ресторани та розважальні заклади, торгові центри, супермаркети, аптеки та медичні установи.\\n\\nОсобливої атмосфери Чорноморськ набуває у вечірній час, коли центральна частина міста та мальовнича набережна з ілюмінацією стають улюбленим місцем прогулянок, зустрічей і відпочинку.\\n\\nЧорноморськ — це море, комфорт і гостинність, які дарують можливість насолодитися справжнім відпочинком на узбережжі Чорного моря."}	{"id": "city-7z4cirq1", "name": "Чорноморськ", "slug": "chornomorsk", "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780409688674-4yxdlmbty9o.jpg", "video_url": null, "description": "Чорноморськ - молоде, перспективне місто-курорт, що по праву вважається перлиною одеського узбережжя. Поєднує сучасну інфраструктуру, компактність та комфортний морський клімат.\\n", "district_id": "district-c6ididsh", "detailed_info": "Місто приваблює гостей 12 кілометрами широких безкоштовних піщаних пляжів із пологим входом у море, що робить відпочинок комфортним як для дорослих, так і для дітей. Завдяки компактним розмірам Чорноморська його можна перетнути пішки менш ніж за годину, насолоджуючись затишною атмосферою та морськими краєвидами.\\n\\n\\nСтепове повітря, насичене морським бризом, створює особливий мікроклімат, а тепле літо з комфортною температурою морської води забезпечує чудові умови для відпочинку протягом усього курортного сезону.\\n\\nМіський пляж Чорноморська багато років поспіль підтверджував відповідність міжнародним стандартам якості та екологічної безпеки, що свідчить про високий рівень благоустрою та сервісу. Для відпочивальників облаштовані рятувальні та медичні пункти, душові кабіни, роздягальні та зони відпочинку.\\n\\n\\nДля проживання гостям доступний широкий вибір варіантів — від сучасних готелів і апартаментів до баз відпочинку та затишного приватного сектору. У місті працюють численні кафе, ресторани та розважальні заклади, торгові центри, супермаркети, аптеки та медичні установи.\\n\\nОсобливої атмосфери Чорноморськ набуває у вечірній час, коли центральна частина міста та мальовнича набережна з ілюмінацією стають улюбленим місцем прогулянок, зустрічей і відпочинку.\\n\\nЧорноморськ — це море, комфорт і гостинність, які дарують можливість насолодитися справжнім відпочинком на узбережжі Чорного моря."}	\N	2026-06-02 14:15:06.563659+00
a7214451-aaa3-4937-bd9c-b0dda22423f4	city	city-pzp3jwc6	update	{"id": "city-pzp3jwc6", "name": "Пужайкове", "slug": "puzhaykove", "reel_url": null, "subtitle": "Село", "image_url": null, "video_url": null, "created_at": "2026-06-02T14:12:00.892602+00:00", "description": "<p style=\\"text-align: left;\\">Пужайкове - автентичне село з традиційною забудовою, мальовничими природними ландшафтами та збереженим сільським укладом життя. Територія відзначається поєднанням степових просторів, балок і лісових масивів, що формують характерний для півночі Одещини краєвид.</p><p><br></p>", "district_id": "district-hwb8a005", "detailed_info": "<p>Село має давню історію формування як аграрне поселення Подільського краю. Розвиток території був пов’язаний із землеробством і тваринництвом, що визначило традиційний уклад життя та планування забудови.</p><p style=\\"text-align: justify;\\">У ХІХ–ХХ століттях Пужайкове розвивалося як типовий сільський населений пункт північної Одещини, зберігши риси історичного планування та локальні культурні традиції.</p><h3 style=\\"text-align: justify;\\"><strong>Туристичний потенціал</strong></h3><ul><li><p style=\\"text-align: justify;\\">Зелений та агротуризм – можливість занурення в традиційне сільське середовище.</p></li><li><p style=\\"text-align: justify;\\">Етнографічна привабливість – місцеві звичаї, кухня, народні традиції Поділля.</p></li><li><p style=\\"text-align: justify;\\">Природні маршрути – простір для піших та велосипедних прогулянок.</p></li><li><p style=\\"text-align: justify;\\">Локальні події громади – участь у культурних та громадських заходах.</p></li></ul><p></p>"}	{"id": "city-pzp3jwc6", "name": "Пужайкове", "slug": "puzhaykove", "reel_url": null, "subtitle": "Село", "image_url": null, "video_url": null, "description": "<p style=\\"text-align: left;\\">Пужайкове - автентичне село з традиційною забудовою, мальовничими природними ландшафтами та збереженим сільським укладом життя. Територія відзначається поєднанням степових просторів, балок і лісових масивів, що формують характерний для півночі Одещини краєвид.</p><p><br></p>", "district_id": "district-hwb8a005", "detailed_info": "<p>Село має давню історію формування як аграрне поселення Подільського краю. Розвиток території був пов’язаний із землеробством і тваринництвом, що визначило традиційний уклад життя та планування забудови.</p><p style=\\"text-align: justify;\\">У ХІХ–ХХ століттях Пужайкове розвивалося як типовий сільський населений пункт північної Одещини, зберігши риси історичного планування та локальні культурні традиції.</p><h3 style=\\"text-align: justify;\\"><strong>Туристичний потенціал</strong></h3><ul><li><p style=\\"text-align: justify;\\">Зелений та агротуризм – можливість занурення в традиційне сільське середовище.</p></li><li><p style=\\"text-align: justify;\\">Етнографічна привабливість – місцеві звичаї, кухня, народні традиції Поділля.</p></li><li><p style=\\"text-align: justify;\\">Природні маршрути – простір для піших та велосипедних прогулянок.</p></li><li><p style=\\"text-align: justify;\\">Локальні події громади – участь у культурних та громадських заходах.</p></li></ul><p></p>"}	tourism@od.gov.ua	2026-06-02 14:17:09.347008+00
15c7579e-e348-4c6f-8344-01fdd8830864	city	city-amctg0e7	update	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "reel_url": null, "subtitle": "Районний центр", "image_url": null, "video_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780408551527-7r440dwh3es.mp4", "created_at": "2026-06-02T13:50:35.090756+00:00", "description": "Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України.\\nУ 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.\\n", "district_id": "district-jnun99rr", "detailed_info": "Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність.\\nМісто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі.\\n\\n\\nПоряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території.\\n\\n\\nБолград має виражену спеціалізацію у:\\n– еногастрономічному туризмі (виноробні півдня Одещини);\\n– етнокультурному туризмі (болгарська спадщина);\\n – подієвому туризмі (винні фестивалі, національні свята);\\n – зеленому туризмі (узбережжя озера Ялпуг та ін.)."}	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "reel_url": null, "subtitle": "Районний центр", "image_url": null, "video_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780408551527-7r440dwh3es.mp4", "description": "<p>Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України. У 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.</p>", "district_id": "district-jnun99rr", "detailed_info": "<p>Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність. Місто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі. Поряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території. Болград має виражену спеціалізацію у: – еногастрономічному туризмі (виноробні півдня Одещини); – етнокультурному туризмі (болгарська спадщина); – подієвому туризмі (винні фестивалі, національні свята); – зеленому туризмі (узбережжя озера Ялпуг та ін.).</p>"}	tourism@od.gov.ua	2026-06-02 14:17:42.817265+00
e7b16649-affb-4e9c-b0e0-b06d0b5aa92f	city	city-amctg0e7	update	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "reel_url": null, "subtitle": "Районний центр", "image_url": null, "video_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780408551527-7r440dwh3es.mp4", "created_at": "2026-06-02T13:50:35.090756+00:00", "description": "<p>Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України. У 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.</p>", "district_id": "district-jnun99rr", "detailed_info": "<p>Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність. Місто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі. Поряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території. Болград має виражену спеціалізацію у: – еногастрономічному туризмі (виноробні півдня Одещини); – етнокультурному туризмі (болгарська спадщина); – подієвому туризмі (винні фестивалі, національні свята); – зеленому туризмі (узбережжя озера Ялпуг та ін.).</p>"}	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "reel_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780410001483-102rz8infnsr.mp4", "subtitle": "Районний центр", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780410034294-9wt9szcfqj6.webp", "video_url": null, "description": "<p>Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України. У 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.</p>", "district_id": "district-jnun99rr", "detailed_info": "<p>Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність. Місто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі. Поряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території. Болград має виражену спеціалізацію у: – еногастрономічному туризмі (виноробні півдня Одещини); – етнокультурному туризмі (болгарська спадщина); – подієвому туризмі (винні фестивалі, національні свята); – зеленому туризмі (узбережжя озера Ялпуг та ін.).</p>"}	tourism@od.gov.ua	2026-06-02 14:20:36.241634+00
fa3bb1d7-541f-48a9-bb45-f61faa041d2a	city	city-7z4cirq1	update	{"id": "city-7z4cirq1", "name": "Чорноморськ", "slug": "chornomorsk", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780409688674-4yxdlmbty9o.jpg", "video_url": null, "created_at": "2026-06-02T14:04:46.063449+00:00", "description": "Чорноморськ - молоде, перспективне місто-курорт, що по праву вважається перлиною одеського узбережжя. Поєднує сучасну інфраструктуру, компактність та комфортний морський клімат.\\n", "district_id": "district-c6ididsh", "detailed_info": "Місто приваблює гостей 12 кілометрами широких безкоштовних піщаних пляжів із пологим входом у море, що робить відпочинок комфортним як для дорослих, так і для дітей. Завдяки компактним розмірам Чорноморська його можна перетнути пішки менш ніж за годину, насолоджуючись затишною атмосферою та морськими краєвидами.\\n\\n\\nСтепове повітря, насичене морським бризом, створює особливий мікроклімат, а тепле літо з комфортною температурою морської води забезпечує чудові умови для відпочинку протягом усього курортного сезону.\\n\\nМіський пляж Чорноморська багато років поспіль підтверджував відповідність міжнародним стандартам якості та екологічної безпеки, що свідчить про високий рівень благоустрою та сервісу. Для відпочивальників облаштовані рятувальні та медичні пункти, душові кабіни, роздягальні та зони відпочинку.\\n\\n\\nДля проживання гостям доступний широкий вибір варіантів — від сучасних готелів і апартаментів до баз відпочинку та затишного приватного сектору. У місті працюють численні кафе, ресторани та розважальні заклади, торгові центри, супермаркети, аптеки та медичні установи.\\n\\nОсобливої атмосфери Чорноморськ набуває у вечірній час, коли центральна частина міста та мальовнича набережна з ілюмінацією стають улюбленим місцем прогулянок, зустрічей і відпочинку.\\n\\nЧорноморськ — це море, комфорт і гостинність, які дарують можливість насолодитися справжнім відпочинком на узбережжі Чорного моря."}	{"id": "city-7z4cirq1", "name": "Чорноморськ", "slug": "chornomorsk", "reel_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780467661780-kpg18yv11a8.mp4", "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780409688674-4yxdlmbty9o.jpg", "video_url": null, "description": "<p>Чорноморськ - молоде, перспективне місто-курорт, що по праву вважається перлиною одеського узбережжя. Поєднує сучасну інфраструктуру, компактність та комфортний морський клімат.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Місто приваблює гостей 12 кілометрами широких безкоштовних піщаних пляжів із пологим входом у море, що робить відпочинок комфортним як для дорослих, так і для дітей. Завдяки компактним розмірам Чорноморська його можна перетнути пішки менш ніж за годину, насолоджуючись затишною атмосферою та морськими краєвидами. Степове повітря, насичене морським бризом, створює особливий мікроклімат, а тепле літо з комфортною температурою морської води забезпечує чудові умови для відпочинку протягом усього курортного сезону. Міський пляж Чорноморська багато років поспіль підтверджував відповідність міжнародним стандартам якості та екологічної безпеки, що свідчить про високий рівень благоустрою та сервісу. Для відпочивальників облаштовані рятувальні та медичні пункти, душові кабіни, роздягальні та зони відпочинку. Для проживання гостям доступний широкий вибір варіантів — від сучасних готелів і апартаментів до баз відпочинку та затишного приватного сектору. У місті працюють численні кафе, ресторани та розважальні заклади, торгові центри, супермаркети, аптеки та медичні установи. Особливої атмосфери Чорноморськ набуває у вечірній час, коли центральна частина міста та мальовнича набережна з ілюмінацією стають улюбленим місцем прогулянок, зустрічей і відпочинку. Чорноморськ — це море, комфорт і гостинність, які дарують можливість насолодитися справжнім відпочинком на узбережжі Чорного моря.</p>"}	tourism@od.gov.ua	2026-06-03 06:21:21.780534+00
75f9ba08-d390-45d9-928f-1cc9fbe6522a	city	city-jei7cmx8	create	\N	{"id": "city-jei7cmx8", "name": "Білгород-Дністровський", "slug": "bilhorod-dnistrovskyy", "reel_url": null, "subtitle": "Районний центр", "image_url": "https://travels.in.ua/,/locality/4467/bilhorod-dnistrovskyi-city", "video_url": null, "description": "<p>Білгород-Дністровський — місто, де понад дві з половиною тисячі років історії оживають просто на ваших очах. Розташований на мальовничому березі Дністровського лиману, всього за 80 кілометрів від Одеси, він є одним із найдавніших міст не лише України, а й усієї Східної Європи.</p><p>Тут кожен камінь зберігає пам’ять про великі цивілізації. Давньогрецька Тіра, середньовічний Аккерман, османський торговий центр та сучасне українське місто — Білгород-Дністровський об’єднав у собі епохи, культури та народи, створивши унікальний історичний простір.</p><p></p>", "district_id": "district-07uz711u", "detailed_info": "<p>Головною окрасою міста є велична Аккерманська фортеця — одна з найбільших і найкраще збережених середньовічних фортець Східної Європи. Її могутні стіни височіють над водами Дністровського лиману, відкриваючи захопливі панорами та створюючи неповторну атмосферу подорожі в часі. Фортеця площею понад 9 гектарів є справжньою візитівкою Півдня України та місцем, яке щороку приваблює тисячі відвідувачів.</p><p>Білгород-Дністровський зачаровує поєднанням античної спадщини, середньовічної архітектури та східного колориту. Тут можна прогулятися старовинними вулицями, насолодитися краєвидами лиману, відкрити для себе археологічні пам’ятки та відчути дух багатовікової історії.</p><p>Місто пропонує комфортні умови для подорожей: сучасні готелі, затишні садиби, ресторани з місцевою кухнею, туристичні послуги та зручне транспортне сполучення з Одесою й популярними курортами регіону.</p><p>У довоєнні роки Білгород-Дністровський був відомий масштабними історичними фестивалями, лицарськими турнірами, музичними подіями та культурними ярмарками, які збирали гостей з усієї України та з-за кордону.</p><p>Білгород-Дністровський — це унікальна можливість за один день пройти шлях від античності до сучасності, відчути велич середньовічної фортеці та насолодитися красою південних краєвидів. Це місто, яке неможливо просто відвідати — його хочеться відкривати знову і знову.</p>"}	tourism@od.gov.ua	2026-06-03 06:26:11.393488+00
70cf1822-8547-4b0f-840f-251d9af6f8eb	city	city-jei7cmx8	update	{"id": "city-jei7cmx8", "name": "Білгород-Дністровський", "slug": "bilhorod-dnistrovskyy", "reel_url": null, "subtitle": "Районний центр", "image_url": "https://travels.in.ua/,/locality/4467/bilhorod-dnistrovskyi-city", "video_url": null, "created_at": "2026-06-03T06:26:11.083471+00:00", "description": "<p>Білгород-Дністровський — місто, де понад дві з половиною тисячі років історії оживають просто на ваших очах. Розташований на мальовничому березі Дністровського лиману, всього за 80 кілометрів від Одеси, він є одним із найдавніших міст не лише України, а й усієї Східної Європи.</p><p>Тут кожен камінь зберігає пам’ять про великі цивілізації. Давньогрецька Тіра, середньовічний Аккерман, османський торговий центр та сучасне українське місто — Білгород-Дністровський об’єднав у собі епохи, культури та народи, створивши унікальний історичний простір.</p><p></p>", "district_id": "district-07uz711u", "detailed_info": "<p>Головною окрасою міста є велична Аккерманська фортеця — одна з найбільших і найкраще збережених середньовічних фортець Східної Європи. Її могутні стіни височіють над водами Дністровського лиману, відкриваючи захопливі панорами та створюючи неповторну атмосферу подорожі в часі. Фортеця площею понад 9 гектарів є справжньою візитівкою Півдня України та місцем, яке щороку приваблює тисячі відвідувачів.</p><p>Білгород-Дністровський зачаровує поєднанням античної спадщини, середньовічної архітектури та східного колориту. Тут можна прогулятися старовинними вулицями, насолодитися краєвидами лиману, відкрити для себе археологічні пам’ятки та відчути дух багатовікової історії.</p><p>Місто пропонує комфортні умови для подорожей: сучасні готелі, затишні садиби, ресторани з місцевою кухнею, туристичні послуги та зручне транспортне сполучення з Одесою й популярними курортами регіону.</p><p>У довоєнні роки Білгород-Дністровський був відомий масштабними історичними фестивалями, лицарськими турнірами, музичними подіями та культурними ярмарками, які збирали гостей з усієї України та з-за кордону.</p><p>Білгород-Дністровський — це унікальна можливість за один день пройти шлях від античності до сучасності, відчути велич середньовічної фортеці та насолодитися красою південних краєвидів. Це місто, яке неможливо просто відвідати — його хочеться відкривати знову і знову.</p>"}	{"id": "city-jei7cmx8", "name": "Білгород-Дністровський", "slug": "bilhorod-dnistrovskyy", "reel_url": null, "subtitle": "Районний центр", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468066497-mr7fwxi3i3d.jpg", "video_url": null, "description": "<p>Білгород-Дністровський — місто, де понад дві з половиною тисячі років історії оживають просто на ваших очах. Розташований на мальовничому березі Дністровського лиману, всього за 80 кілометрів від Одеси, він є одним із найдавніших міст не лише України, а й усієї Східної Європи.</p><p>Тут кожен камінь зберігає пам’ять про великі цивілізації. Давньогрецька Тіра, середньовічний Аккерман, османський торговий центр та сучасне українське місто — Білгород-Дністровський об’єднав у собі епохи, культури та народи, створивши унікальний історичний простір.</p><p></p>", "district_id": "district-07uz711u", "detailed_info": "<p>Головною окрасою міста є велична Аккерманська фортеця — одна з найбільших і найкраще збережених середньовічних фортець Східної Європи. Її могутні стіни височіють над водами Дністровського лиману, відкриваючи захопливі панорами та створюючи неповторну атмосферу подорожі в часі. Фортеця площею понад 9 гектарів є справжньою візитівкою Півдня України та місцем, яке щороку приваблює тисячі відвідувачів.</p><p>Білгород-Дністровський зачаровує поєднанням античної спадщини, середньовічної архітектури та східного колориту. Тут можна прогулятися старовинними вулицями, насолодитися краєвидами лиману, відкрити для себе археологічні пам’ятки та відчути дух багатовікової історії.</p><p>Місто пропонує комфортні умови для подорожей: сучасні готелі, затишні садиби, ресторани з місцевою кухнею, туристичні послуги та зручне транспортне сполучення з Одесою й популярними курортами регіону.</p><p>У довоєнні роки Білгород-Дністровський був відомий масштабними історичними фестивалями, лицарськими турнірами, музичними подіями та культурними ярмарками, які збирали гостей з усієї України та з-за кордону.</p><p>Білгород-Дністровський — це унікальна можливість за один день пройти шлях від античності до сучасності, відчути велич середньовічної фортеці та насолодитися красою південних краєвидів. Це місто, яке неможливо просто відвідати — його хочеться відкривати знову і знову.</p>"}	tourism@od.gov.ua	2026-06-03 06:28:50.493493+00
201f5e14-568c-43cb-a60e-59b3795dd499	city	city-amctg0e7	update	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "reel_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780410001483-102rz8infnsr.mp4", "subtitle": "Районний центр", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780410034294-9wt9szcfqj6.webp", "video_url": null, "created_at": "2026-06-02T13:50:35.090756+00:00", "description": "<p>Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України. У 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.</p>", "district_id": "district-jnun99rr", "detailed_info": "<p>Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність. Місто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі. Поряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території. Болград має виражену спеціалізацію у: – еногастрономічному туризмі (виноробні півдня Одещини); – етнокультурному туризмі (болгарська спадщина); – подієвому туризмі (винні фестивалі, національні свята); – зеленому туризмі (узбережжя озера Ялпуг та ін.).</p>"}	{"id": "city-amctg0e7", "name": "Болград", "slug": "bolhrad", "reel_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780410001483-102rz8infnsr.mp4", "subtitle": "Районний центр", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780410034294-9wt9szcfqj6.webp", "video_url": null, "description": "<p>Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України. У 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.</p>", "district_id": "district-jnun99rr", "detailed_info": "<p>Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність. Місто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі. Поряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території. Болград має виражену спеціалізацію у: – еногастрономічному туризмі (виноробні півдня Одещини); – етнокультурному туризмі (болгарська спадщина); – подієвому туризмі (винні фестивалі, національні свята); – зеленому туризмі (узбережжя озера Ялпуг та ін.).</p>"}	tourism@od.gov.ua	2026-06-03 06:30:32.711298+00
3ae8b448-6f1d-44fe-855a-b381859a71c2	city	city-jei7cmx8	update	{"id": "city-jei7cmx8", "name": "Білгород-Дністровський", "slug": "bilhorod-dnistrovskyy", "reel_url": null, "subtitle": "Районний центр", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468066497-mr7fwxi3i3d.jpg", "video_url": null, "created_at": "2026-06-03T06:26:11.083471+00:00", "description": "<p>Білгород-Дністровський — місто, де понад дві з половиною тисячі років історії оживають просто на ваших очах. Розташований на мальовничому березі Дністровського лиману, всього за 80 кілометрів від Одеси, він є одним із найдавніших міст не лише України, а й усієї Східної Європи.</p><p>Тут кожен камінь зберігає пам’ять про великі цивілізації. Давньогрецька Тіра, середньовічний Аккерман, османський торговий центр та сучасне українське місто — Білгород-Дністровський об’єднав у собі епохи, культури та народи, створивши унікальний історичний простір.</p><p></p>", "district_id": "district-07uz711u", "detailed_info": "<p>Головною окрасою міста є велична Аккерманська фортеця — одна з найбільших і найкраще збережених середньовічних фортець Східної Європи. Її могутні стіни височіють над водами Дністровського лиману, відкриваючи захопливі панорами та створюючи неповторну атмосферу подорожі в часі. Фортеця площею понад 9 гектарів є справжньою візитівкою Півдня України та місцем, яке щороку приваблює тисячі відвідувачів.</p><p>Білгород-Дністровський зачаровує поєднанням античної спадщини, середньовічної архітектури та східного колориту. Тут можна прогулятися старовинними вулицями, насолодитися краєвидами лиману, відкрити для себе археологічні пам’ятки та відчути дух багатовікової історії.</p><p>Місто пропонує комфортні умови для подорожей: сучасні готелі, затишні садиби, ресторани з місцевою кухнею, туристичні послуги та зручне транспортне сполучення з Одесою й популярними курортами регіону.</p><p>У довоєнні роки Білгород-Дністровський був відомий масштабними історичними фестивалями, лицарськими турнірами, музичними подіями та культурними ярмарками, які збирали гостей з усієї України та з-за кордону.</p><p>Білгород-Дністровський — це унікальна можливість за один день пройти шлях від античності до сучасності, відчути велич середньовічної фортеці та насолодитися красою південних краєвидів. Це місто, яке неможливо просто відвідати — його хочеться відкривати знову і знову.</p>"}	{"id": "city-jei7cmx8", "name": "Білгород-Дністровський", "slug": "bilhorod-dnistrovskyy", "reel_url": null, "subtitle": "Районний центр", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468066497-mr7fwxi3i3d.jpg", "video_url": null, "description": "<p>Білгород-Дністровський — місто, де понад дві з половиною тисячі років історії оживають просто на ваших очах. Розташований на мальовничому березі Дністровського лиману, всього за 80 кілометрів від Одеси, він є одним із найдавніших міст не лише України, а й усієї Східної Європи.</p><p>Тут кожен камінь зберігає пам’ять про великі цивілізації. Давньогрецька Тіра, середньовічний Аккерман, османський торговий центр та сучасне українське місто — Білгород-Дністровський об’єднав у собі епохи, культури та народи, створивши унікальний історичний простір.</p><p></p>", "district_id": "district-07uz711u", "detailed_info": "<p>Головною окрасою міста є велична Аккерманська фортеця — одна з найбільших і найкраще збережених середньовічних фортець Східної Європи. Її могутні стіни височіють над водами Дністровського лиману, відкриваючи захопливі панорами та створюючи неповторну атмосферу подорожі в часі. Фортеця площею понад 9 гектарів є справжньою візитівкою Півдня України та місцем, яке щороку приваблює тисячі відвідувачів.</p><p>Білгород-Дністровський зачаровує поєднанням античної спадщини, середньовічної архітектури та східного колориту. Тут можна прогулятися старовинними вулицями, насолодитися краєвидами лиману, відкрити для себе археологічні пам’ятки та відчути дух багатовікової історії.</p><p>Місто пропонує комфортні умови для подорожей: сучасні готелі, затишні садиби, ресторани з місцевою кухнею, туристичні послуги та зручне транспортне сполучення з Одесою й популярними курортами регіону.</p><p>У довоєнні роки Білгород-Дністровський був відомий масштабними історичними фестивалями, лицарськими турнірами, музичними подіями та культурними ярмарками, які збирали гостей з усієї України та з-за кордону.</p><p>Білгород-Дністровський — це унікальна можливість за один день пройти шлях від античності до сучасності, відчути велич середньовічної фортеці та насолодитися красою південних краєвидів. Це місто, яке неможливо просто відвідати — його хочеться відкривати знову і знову.</p>"}	tourism@od.gov.ua	2026-06-03 06:30:56.407207+00
04549926-97f8-43bf-9ed5-d007413aacec	city	city-8cd5z47b	create	\N	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://travels.in.ua/ru-RU/locality/6858 ", "video_url": null, "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>"}	tourism@od.gov.ua	2026-06-03 06:36:48.27668+00
0712c552-02d4-479f-9f26-476c6de59f72	city	city-8cd5z47b	update	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://travels.in.ua/ru-RU/locality/6858 ", "video_url": null, "created_at": "2026-06-03T06:36:47.839383+00:00", "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>"}	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg", "video_url": null, "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>"}	tourism@od.gov.ua	2026-06-03 06:37:41.862722+00
474c4169-c3e9-4b22-b933-91a96eb05d83	city	city-8cd5z47b	update	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg", "video_url": null, "created_at": "2026-06-03T06:36:47.839383+00:00", "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>"}	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg", "video_url": null, "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>"}	tourism@od.gov.ua	2026-06-03 06:38:12.639232+00
cc465e94-b2b3-423a-a771-0ab4fe252dd9	city	city-8cd5z47b	update	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg", "video_url": null, "created_at": "2026-06-03T06:36:47.839383+00:00", "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>"}	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg", "video_url": null, "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>"}	tourism@od.gov.ua	2026-06-03 06:38:43.652239+00
80127d98-6404-4b1a-8d8c-b0b40fb0e672	city	city-8cd5z47b	update	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg", "video_url": null, "created_at": "2026-06-03T06:36:47.839383+00:00", "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>"}	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg", "video_url": null, "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>"}	tourism@od.gov.ua	2026-06-03 06:46:09.115+00
5e1cc17d-286c-4ffe-a4ae-85435bab8663	city	city-i9fv1hcc	create	\N	{"id": "city-i9fv1hcc", "name": "Санжійка", "slug": "sanzhiyka", "reel_url": null, "subtitle": "Село", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780469504189-u4atc2relw.PNG", "video_url": null, "description": "<p>Санжійка — один із наймальовничіших куточків узбережжя Одещини, де безкрає Чорне море зустрічається з високими береговими схилами, а тиша та природна краса створюють ідеальні умови для відпочинку далеко від міської метушні.</p><p></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташоване всього за 25 кілометрів від Одеси та неподалік від Чорноморська, це затишне приморське село приваблює гостей унікальними морськими панорамами, чистим повітрям та особливою атмосферою спокою. Санжійка стала справжньою знахідкою для тих, хто цінує природні ландшафти, неквапливі прогулянки та можливість насолодитися красою узбережжя в його первозданному вигляді.</p><p>Візитівкою села є високі глинисті схили, з яких відкриваються захопливі краєвиди на Чорне море. Саме тут можна спостерігати неймовірні світанки та заходи сонця, робити яскраві фотографії та милуватися безмежним морським горизонтом. Узбережжя Санжійки давно стало популярною локацією для фототуризму та романтичних прогулянок.</p><p>Особливе місце в історії села займає Санжійський маяк — один із впізнаваних символів чорноморського узбережжя. Протягом багатьох десятиліть він допомагав морякам безпечно орієнтуватися серед морських шляхів і сьогодні залишається важливою частиною місцевого колориту та улюбленою фотолокацією.</p><p>Санжійка має цікаву історію, що бере початок ще наприкінці XVIII століття, коли на цих берегах було створено сторожовий пункт для забезпечення безпеки мореплавства. Відтоді село нерозривно пов’язане з морем, навігацією та життям чорноморського узбережжя.</p><p>Для гостей доступні гостьові будинки, приватні садиби, бази відпочинку та сезонні заклади харчування. Зручне транспортне сполучення дозволяє легко дістатися сюди з Одеси та інших туристичних центрів регіону.</p><p>Санжійка — це місце, де можна відчути справжню гармонію з природою, насолодитися морськими пейзажами та відкрити для себе одну з найкрасивіших прибережних локацій Одещини.</p>"}	tourism@od.gov.ua	2026-06-03 06:52:45.242888+00
908d9297-b62c-4182-8b75-44686efccb51	city	city-7hu3eslk	create	\N	{"id": "city-7hu3eslk", "name": "Кароліно-Бугаз", "slug": "karolino-buhaz", "reel_url": null, "subtitle": "Село", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780469741247-sn3fr8gzob.webp", "video_url": null, "description": "<p>Кароліно-Бугаз — перлина чорноморського узбережжя Одещини, де безкраї піщані пляжі, морський простір і унікальні природні ландшафти створюють ідеальні умови для відпочинку та відновлення сил.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований лише за 50 кілометрів від Одеси, Кароліно-Бугаз займає особливе місце серед курортних територій регіону. Селище знаходиться на вузькій піщаній косі між Чорним морем та Дністровським лиманом — унікальній природній зоні, яка формує особливий мікроклімат із поєднанням морського та степового повітря. Саме ця природна особливість протягом багатьох років приваблювала сюди тисячі відпочивальників з усієї України та з-за кордону.</p><p>Історія Кароліно-Бугазу бере свій початок ще у XVIII столітті. Давнє поселення Бугаз, розташоване на стратегічно важливому перешийку між морем і лиманом, стало основою для майбутнього курорту. Сучасна назва населеного пункту поєднала історичну назву місцевості та ім’я Кароля Сцибора-Мархоцького, який відіграв важливу роль у відродженні поселення на початку XIX століття.</p><p>Кароліно-Бугаз заслужено вважається одним із найвідоміших центрів пляжного відпочинку Одещини. Широкі піщані пляжі, просторе узбережжя, мальовничі морські пейзажі та неймовірні заходи сонця створюють атмосферу справжнього курортного раю. Це місце завжди приваблювало поціновувачів сімейного відпочинку, морських прогулянок та відпочинку серед природи.</p><p>Селище має розвинену туристичну інфраструктуру: бази відпочинку, пансіонати, готелі, приватний сектор, кафе, ресторани та численні рекреаційні зони. Близькість до Одеси робить його одним із найзручніших напрямків для літнього відпочинку на узбережжі Чорного моря.</p><p>Сьогодні Кароліно-Бугаз залишається одним із найвідоміших курортних брендів Одещини та важливою складовою туристичного потенціалу регіону. Його природна унікальність, багаторічна курортна історія та вигідне розташування формують значний потенціал для майбутнього розвитку туристичної галузі після відновлення безпечних умов для відпочинку.</p><p>Кароліно-Бугаз — це місце, де море, лиман і безмежні горизонти створюють неповторний образ південного узбережжя України.</p>"}	tourism@od.gov.ua	2026-06-03 06:55:45.880222+00
f8ebd3eb-366c-47c6-a5b7-5bc0bd1f60aa	city	city-jei7cmx8	update	{"id": "city-jei7cmx8", "name": "Білгород-Дністровський", "slug": "bilhorod-dnistrovskyy", "reel_url": null, "subtitle": "Районний центр", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468066497-mr7fwxi3i3d.jpg", "video_url": null, "created_at": "2026-06-03T06:26:11.083471+00:00", "description": "<p>Білгород-Дністровський — місто, де понад дві з половиною тисячі років історії оживають просто на ваших очах. Розташований на мальовничому березі Дністровського лиману, всього за 80 кілометрів від Одеси, він є одним із найдавніших міст не лише України, а й усієї Східної Європи.</p><p>Тут кожен камінь зберігає пам’ять про великі цивілізації. Давньогрецька Тіра, середньовічний Аккерман, османський торговий центр та сучасне українське місто — Білгород-Дністровський об’єднав у собі епохи, культури та народи, створивши унікальний історичний простір.</p><p></p>", "district_id": "district-07uz711u", "detailed_info": "<p>Головною окрасою міста є велична Аккерманська фортеця — одна з найбільших і найкраще збережених середньовічних фортець Східної Європи. Її могутні стіни височіють над водами Дністровського лиману, відкриваючи захопливі панорами та створюючи неповторну атмосферу подорожі в часі. Фортеця площею понад 9 гектарів є справжньою візитівкою Півдня України та місцем, яке щороку приваблює тисячі відвідувачів.</p><p>Білгород-Дністровський зачаровує поєднанням античної спадщини, середньовічної архітектури та східного колориту. Тут можна прогулятися старовинними вулицями, насолодитися краєвидами лиману, відкрити для себе археологічні пам’ятки та відчути дух багатовікової історії.</p><p>Місто пропонує комфортні умови для подорожей: сучасні готелі, затишні садиби, ресторани з місцевою кухнею, туристичні послуги та зручне транспортне сполучення з Одесою й популярними курортами регіону.</p><p>У довоєнні роки Білгород-Дністровський був відомий масштабними історичними фестивалями, лицарськими турнірами, музичними подіями та культурними ярмарками, які збирали гостей з усієї України та з-за кордону.</p><p>Білгород-Дністровський — це унікальна можливість за один день пройти шлях від античності до сучасності, відчути велич середньовічної фортеці та насолодитися красою південних краєвидів. Це місто, яке неможливо просто відвідати — його хочеться відкривати знову і знову.</p>"}	{"id": "city-jei7cmx8", "name": "Білгород-Дністровський", "slug": "bilhorod-dnistrovskyy", "reel_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780469895979-aeawyddokgl.mp4", "subtitle": "Районний центр", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468066497-mr7fwxi3i3d.jpg", "video_url": null, "description": "<p>Білгород-Дністровський — місто, де понад дві з половиною тисячі років історії оживають просто на ваших очах. Розташований на мальовничому березі Дністровського лиману, всього за 80 кілометрів від Одеси, він є одним із найдавніших міст не лише України, а й усієї Східної Європи.</p><p>Тут кожен камінь зберігає пам’ять про великі цивілізації. Давньогрецька Тіра, середньовічний Аккерман, османський торговий центр та сучасне українське місто — Білгород-Дністровський об’єднав у собі епохи, культури та народи, створивши унікальний історичний простір.</p><p></p>", "district_id": "district-07uz711u", "detailed_info": "<p>Головною окрасою міста є велична Аккерманська фортеця — одна з найбільших і найкраще збережених середньовічних фортець Східної Європи. Її могутні стіни височіють над водами Дністровського лиману, відкриваючи захопливі панорами та створюючи неповторну атмосферу подорожі в часі. Фортеця площею понад 9 гектарів є справжньою візитівкою Півдня України та місцем, яке щороку приваблює тисячі відвідувачів.</p><p>Білгород-Дністровський зачаровує поєднанням античної спадщини, середньовічної архітектури та східного колориту. Тут можна прогулятися старовинними вулицями, насолодитися краєвидами лиману, відкрити для себе археологічні пам’ятки та відчути дух багатовікової історії.</p><p>Місто пропонує комфортні умови для подорожей: сучасні готелі, затишні садиби, ресторани з місцевою кухнею, туристичні послуги та зручне транспортне сполучення з Одесою й популярними курортами регіону.</p><p>У довоєнні роки Білгород-Дністровський був відомий масштабними історичними фестивалями, лицарськими турнірами, музичними подіями та культурними ярмарками, які збирали гостей з усієї України та з-за кордону.</p><p>Білгород-Дністровський — це унікальна можливість за один день пройти шлях від античності до сучасності, відчути велич середньовічної фортеці та насолодитися красою південних краєвидів. Це місто, яке неможливо просто відвідати — його хочеться відкривати знову і знову.</p>"}	tourism@od.gov.ua	2026-06-03 06:58:49.176598+00
a7606edd-9634-4001-aee7-84ec1153a698	city	city-pzp3jwc6	update	{"id": "city-pzp3jwc6", "name": "Пужайкове", "slug": "puzhaykove", "reel_url": null, "subtitle": "Село", "image_url": null, "video_url": null, "created_at": "2026-06-02T14:12:00.892602+00:00", "description": "<p style=\\"text-align: left;\\">Пужайкове - автентичне село з традиційною забудовою, мальовничими природними ландшафтами та збереженим сільським укладом життя. Територія відзначається поєднанням степових просторів, балок і лісових масивів, що формують характерний для півночі Одещини краєвид.</p><p><br></p>", "district_id": "district-hwb8a005", "detailed_info": "<p>Село має давню історію формування як аграрне поселення Подільського краю. Розвиток території був пов’язаний із землеробством і тваринництвом, що визначило традиційний уклад життя та планування забудови.</p><p style=\\"text-align: justify;\\">У ХІХ–ХХ століттях Пужайкове розвивалося як типовий сільський населений пункт північної Одещини, зберігши риси історичного планування та локальні культурні традиції.</p><h3 style=\\"text-align: justify;\\"><strong>Туристичний потенціал</strong></h3><ul><li><p style=\\"text-align: justify;\\">Зелений та агротуризм – можливість занурення в традиційне сільське середовище.</p></li><li><p style=\\"text-align: justify;\\">Етнографічна привабливість – місцеві звичаї, кухня, народні традиції Поділля.</p></li><li><p style=\\"text-align: justify;\\">Природні маршрути – простір для піших та велосипедних прогулянок.</p></li><li><p style=\\"text-align: justify;\\">Локальні події громади – участь у культурних та громадських заходах.</p></li></ul><p></p>"}	{"id": "city-pzp3jwc6", "name": "Пужайкове", "slug": "puzhaykove", "reel_url": null, "subtitle": "Село", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470019935-g5uyu13p3wh.jpg", "video_url": null, "description": "<p style=\\"text-align: left;\\">Пужайкове - автентичне село з традиційною забудовою, мальовничими природними ландшафтами та збереженим сільським укладом життя. Територія відзначається поєднанням степових просторів, балок і лісових масивів, що формують характерний для півночі Одещини краєвид.</p><p><br></p>", "district_id": "district-hwb8a005", "detailed_info": "<p>Село має давню історію формування як аграрне поселення Подільського краю. Розвиток території був пов’язаний із землеробством і тваринництвом, що визначило традиційний уклад життя та планування забудови.</p><p style=\\"text-align: justify;\\">У ХІХ–ХХ століттях Пужайкове розвивалося як типовий сільський населений пункт північної Одещини, зберігши риси історичного планування та локальні культурні традиції.</p><h3 style=\\"text-align: justify;\\"><strong>Туристичний потенціал</strong></h3><ul><li><p style=\\"text-align: justify;\\">Зелений та агротуризм – можливість занурення в традиційне сільське середовище.</p></li><li><p style=\\"text-align: justify;\\">Етнографічна привабливість – місцеві звичаї, кухня, народні традиції Поділля.</p></li><li><p style=\\"text-align: justify;\\">Природні маршрути – простір для піших та велосипедних прогулянок.</p></li><li><p style=\\"text-align: justify;\\">Локальні події громади – участь у культурних та громадських заходах.</p></li></ul><p></p>"}	tourism@od.gov.ua	2026-06-03 07:01:10.381358+00
cbd2b317-c8b6-4fac-868e-c01c83253f9d	city	city-nnvds0fi	create	\N	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>"}	tourism@od.gov.ua	2026-06-03 07:07:10.114104+00
a9726b4f-ae41-4c8f-a550-21e7c139451e	city	city-7hu3eslk	update	{"id": "city-7hu3eslk", "name": "Кароліно-Бугаз", "slug": "karolino-buhaz", "reel_url": null, "subtitle": "Село", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780469741247-sn3fr8gzob.webp", "video_url": null, "created_at": "2026-06-03T06:55:45.411331+00:00", "description": "<p>Кароліно-Бугаз — перлина чорноморського узбережжя Одещини, де безкраї піщані пляжі, морський простір і унікальні природні ландшафти створюють ідеальні умови для відпочинку та відновлення сил.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований лише за 50 кілометрів від Одеси, Кароліно-Бугаз займає особливе місце серед курортних територій регіону. Селище знаходиться на вузькій піщаній косі між Чорним морем та Дністровським лиманом — унікальній природній зоні, яка формує особливий мікроклімат із поєднанням морського та степового повітря. Саме ця природна особливість протягом багатьох років приваблювала сюди тисячі відпочивальників з усієї України та з-за кордону.</p><p>Історія Кароліно-Бугазу бере свій початок ще у XVIII столітті. Давнє поселення Бугаз, розташоване на стратегічно важливому перешийку між морем і лиманом, стало основою для майбутнього курорту. Сучасна назва населеного пункту поєднала історичну назву місцевості та ім’я Кароля Сцибора-Мархоцького, який відіграв важливу роль у відродженні поселення на початку XIX століття.</p><p>Кароліно-Бугаз заслужено вважається одним із найвідоміших центрів пляжного відпочинку Одещини. Широкі піщані пляжі, просторе узбережжя, мальовничі морські пейзажі та неймовірні заходи сонця створюють атмосферу справжнього курортного раю. Це місце завжди приваблювало поціновувачів сімейного відпочинку, морських прогулянок та відпочинку серед природи.</p><p>Селище має розвинену туристичну інфраструктуру: бази відпочинку, пансіонати, готелі, приватний сектор, кафе, ресторани та численні рекреаційні зони. Близькість до Одеси робить його одним із найзручніших напрямків для літнього відпочинку на узбережжі Чорного моря.</p><p>Сьогодні Кароліно-Бугаз залишається одним із найвідоміших курортних брендів Одещини та важливою складовою туристичного потенціалу регіону. Його природна унікальність, багаторічна курортна історія та вигідне розташування формують значний потенціал для майбутнього розвитку туристичної галузі після відновлення безпечних умов для відпочинку.</p><p>Кароліно-Бугаз — це місце, де море, лиман і безмежні горизонти створюють неповторний образ південного узбережжя України.</p>"}	{"id": "city-7hu3eslk", "name": "Кароліно-Бугаз", "slug": "karolino-buhaz", "reel_url": null, "subtitle": "Село", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780469741247-sn3fr8gzob.webp", "video_url": null, "description": "<p>Кароліно-Бугаз — перлина чорноморського узбережжя Одещини, де безкраї піщані пляжі, морський простір і унікальні природні ландшафти створюють ідеальні умови для відпочинку та відновлення сил.</p>", "district_id": "district-07uz711u", "detailed_info": "<p>Розташований лише за 50 кілометрів від Одеси, Кароліно-Бугаз займає особливе місце серед курортних територій регіону. Селище знаходиться на вузькій піщаній косі між Чорним морем та Дністровським лиманом — унікальній природній зоні, яка формує особливий мікроклімат із поєднанням морського та степового повітря. Саме ця природна особливість протягом багатьох років приваблювала сюди тисячі відпочивальників з усієї України та з-за кордону.</p><p>Історія Кароліно-Бугазу бере свій початок ще у XVIII столітті. Давнє поселення Бугаз, розташоване на стратегічно важливому перешийку між морем і лиманом, стало основою для майбутнього курорту. Сучасна назва населеного пункту поєднала історичну назву місцевості та ім’я Кароля Сцибора-Мархоцького, який відіграв важливу роль у відродженні поселення на початку XIX століття.</p><p>Кароліно-Бугаз заслужено вважається одним із найвідоміших центрів пляжного відпочинку Одещини. Широкі піщані пляжі, просторе узбережжя, мальовничі морські пейзажі та неймовірні заходи сонця створюють атмосферу справжнього курортного раю. Це місце завжди приваблювало поціновувачів сімейного відпочинку, морських прогулянок та відпочинку серед природи.</p><p>Селище має розвинену туристичну інфраструктуру: бази відпочинку, пансіонати, готелі, приватний сектор, кафе, ресторани та численні рекреаційні зони. Близькість до Одеси робить його одним із найзручніших напрямків для літнього відпочинку на узбережжі Чорного моря.</p><p>Сьогодні Кароліно-Бугаз залишається одним із найвідоміших курортних брендів Одещини та важливою складовою туристичного потенціалу регіону. Його природна унікальність, багаторічна курортна історія та вигідне розташування формують значний потенціал для майбутнього розвитку туристичної галузі після відновлення безпечних умов для відпочинку.</p><p>Кароліно-Бугаз — це місце, де море, лиман і безмежні горизонти створюють неповторний образ південного узбережжя України.</p>"}	tourism@od.gov.ua	2026-06-03 07:07:35.396313+00
b4bc4dc2-52a0-424e-85e0-fb0051f6f951	city	city-8cd5z47b	update	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg", "video_url": null, "created_at": "2026-06-03T06:36:47.839383+00:00", "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>"}	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg", "video_url": null, "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>"}	tourism@od.gov.ua	2026-06-03 07:14:30.423346+00
bdf8936d-0add-422a-b034-c164280398f4	city	city-nnvds0fi	update	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "created_at": "2026-06-03T07:07:09.781902+00:00", "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>"}	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>"}	vinilxd9@gmail.com	2026-06-03 07:18:53.186115+00
b5dadd51-642a-4c7c-9448-577aacedad9d	city	city-nnvds0fi	update	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "created_at": "2026-06-03T07:07:09.781902+00:00", "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": null}	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": "Bilyayivka"}	vinilxd9@gmail.com	2026-06-03 07:23:01.684496+00
6d7fd47d-10ce-4858-9d85-4850dd029cda	city	city-nnvds0fi	update	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "created_at": "2026-06-03T07:07:09.781902+00:00", "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": "Bilyayivka"}	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": "Bilyayivka"}	vinilxd9@gmail.com	2026-06-03 07:23:48.502976+00
8b54d508-f6fc-429d-a54f-8c9ff5f6b93a	city	city-nnvds0fi	update	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "created_at": "2026-06-03T07:07:09.781902+00:00", "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": "Bilyayivka"}	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": "Bilyayivka, UA"}	vinilxd9@gmail.com	2026-06-03 07:30:19.508263+00
04b8a418-315f-4ba5-8bf8-adaa1df27a73	city	city-nnvds0fi	update	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "created_at": "2026-06-03T07:07:09.781902+00:00", "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": "Bilyayivka, UA"}	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": "Bilyayivka"}	vinilxd9@gmail.com	2026-06-03 07:34:38.556745+00
a0c944a2-5881-40bd-9238-044971024f1e	city	city-nnvds0fi	update	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "created_at": "2026-06-03T07:07:09.781902+00:00", "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": "Bilyayivka"}	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": "Bilyayivka"}	vinilxd9@gmail.com	2026-06-03 07:34:48.036047+00
4ced3baa-b2ee-4ec8-b8ce-dd7c7781f06e	city	city-8cd5z47b	update	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg", "video_url": null, "created_at": "2026-06-03T06:36:47.839383+00:00", "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>", "weather_city_name": null}	{"id": "city-8cd5z47b", "name": "Овідіополь", "slug": "ovidiopol", "reel_url": null, "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg", "video_url": null, "description": "<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>", "weather_city_name": "Ovidiopol"}	vinilxd9@gmail.com	2026-06-03 07:41:35.901598+00
e4ef1185-488a-49a8-9d02-bbadc45d3bd8	city	city-nnvds0fi	update	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "created_at": "2026-06-03T07:07:09.781902+00:00", "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": "Bilyayivka"}	{"id": "city-nnvds0fi", "name": "Біляївка", "slug": "bilyayivka", "reel_url": null, "subtitle": "Місто", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg", "video_url": null, "description": "<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>", "weather_city_name": "Bilyayivka"}	vinilxd9@gmail.com	2026-06-03 07:41:46.958626+00
c529d827-409c-402a-a898-3020ef26a97b	city	city-zqcmp1iz	create	\N	{"id": "city-zqcmp1iz", "name": "Доброслав", "slug": "dobroslav", "reel_url": "Dobroslav. UA", "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780474235289-fkort9lrknt.jpg", "video_url": null, "description": "<p>Доброслав — яскравий приклад того, як невелике селище може стати сучасним, комфортним і привабливим туристичним центром. Розташований неподалік Одеси, він вражає гостей доглянутими вулицями, оригінальними громадськими просторами, великою кількістю парків та особливою атмосферою затишку й гостинності.</p><p></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Історія Доброслава бере свій початок понад два століття тому. Засноване у 1802 році, селище пройшло шлях від невеликого поселення на важливому поштовому шляху до сучасного адміністративного центру громади, який сьогодні є одним із найуспішніших прикладів розвитку малих населених пунктів України.</p><p>Справжньою візитівкою Доброслава стали його тематичні парки та зелені зони відпочинку. У селищі створено понад десять унікальних парків, кожен із яких має власну концепцію та атмосферу. Особливе місце займає знаменита «Долина квітів» — мальовничий простір, який щороку приваблює тисячі відвідувачів різнобарвними квітковими композиціями та фотолокаціями.</p><p>Під час прогулянок Доброславом гостей зустрічають сучасні фонтани, затишні сквери, оригінальні артоб’єкти та комфортні громадські простори. Селище стало відомим далеко за межами Одещини завдяки креативним проєктам громади та нестандартним підходам до благоустрою. Одним із символів населеного пункту стала новорічна ялинка, створена з морських черепашок, яка увійшла до Книги національних рекордів України.</p><p>Доброслав активно розвиває культурно-подієвий туризм. Протягом року тут відбуваються фестивалі, концерти, ярмарки та тематичні заходи, які об’єднують мешканців і гостей громади. Завдяки цьому селище стало популярною локацією для сімейного відпочинку та подорожей вихідного дня.</p><p>Розвинена інфраструктура, заклади харчування, спортивні та дитячі майданчики, сучасні громадські простори й зручне транспортне сполучення роблять Доброслав комфортним для відвідування в будь-яку пору року.</p><p>Доброслав — це територія креативних ідей, красивих парків та успішних громадських ініціатив. Місце, де сучасний благоустрій гармонійно поєднується з південною гостинністю та любов’ю до свого краю.</p>", "weather_city_name": null}	tourism@od.gov.ua	2026-06-03 08:11:02.064014+00
cc43f3dd-e44a-4b1f-88ad-688604de8064	city	city-zqcmp1iz	update	{"id": "city-zqcmp1iz", "name": "Доброслав", "slug": "dobroslav", "reel_url": "Dobroslav. UA", "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780474235289-fkort9lrknt.jpg", "video_url": null, "created_at": "2026-06-03T08:11:01.49494+00:00", "description": "<p>Доброслав — яскравий приклад того, як невелике селище може стати сучасним, комфортним і привабливим туристичним центром. Розташований неподалік Одеси, він вражає гостей доглянутими вулицями, оригінальними громадськими просторами, великою кількістю парків та особливою атмосферою затишку й гостинності.</p><p></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Історія Доброслава бере свій початок понад два століття тому. Засноване у 1802 році, селище пройшло шлях від невеликого поселення на важливому поштовому шляху до сучасного адміністративного центру громади, який сьогодні є одним із найуспішніших прикладів розвитку малих населених пунктів України.</p><p>Справжньою візитівкою Доброслава стали його тематичні парки та зелені зони відпочинку. У селищі створено понад десять унікальних парків, кожен із яких має власну концепцію та атмосферу. Особливе місце займає знаменита «Долина квітів» — мальовничий простір, який щороку приваблює тисячі відвідувачів різнобарвними квітковими композиціями та фотолокаціями.</p><p>Під час прогулянок Доброславом гостей зустрічають сучасні фонтани, затишні сквери, оригінальні артоб’єкти та комфортні громадські простори. Селище стало відомим далеко за межами Одещини завдяки креативним проєктам громади та нестандартним підходам до благоустрою. Одним із символів населеного пункту стала новорічна ялинка, створена з морських черепашок, яка увійшла до Книги національних рекордів України.</p><p>Доброслав активно розвиває культурно-подієвий туризм. Протягом року тут відбуваються фестивалі, концерти, ярмарки та тематичні заходи, які об’єднують мешканців і гостей громади. Завдяки цьому селище стало популярною локацією для сімейного відпочинку та подорожей вихідного дня.</p><p>Розвинена інфраструктура, заклади харчування, спортивні та дитячі майданчики, сучасні громадські простори й зручне транспортне сполучення роблять Доброслав комфортним для відвідування в будь-яку пору року.</p><p>Доброслав — це територія креативних ідей, красивих парків та успішних громадських ініціатив. Місце, де сучасний благоустрій гармонійно поєднується з південною гостинністю та любов’ю до свого краю.</p>", "weather_city_name": null}	{"id": "city-zqcmp1iz", "name": "Доброслав", "slug": "dobroslav", "reel_url": "Kurisove, UA", "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780474235289-fkort9lrknt.jpg", "video_url": null, "description": "<p>Доброслав — яскравий приклад того, як невелике селище може стати сучасним, комфортним і привабливим туристичним центром. Розташований неподалік Одеси, він вражає гостей доглянутими вулицями, оригінальними громадськими просторами, великою кількістю парків та особливою атмосферою затишку й гостинності.</p><p></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Історія Доброслава бере свій початок понад два століття тому. Засноване у 1802 році, селище пройшло шлях від невеликого поселення на важливому поштовому шляху до сучасного адміністративного центру громади, який сьогодні є одним із найуспішніших прикладів розвитку малих населених пунктів України.</p><p>Справжньою візитівкою Доброслава стали його тематичні парки та зелені зони відпочинку. У селищі створено понад десять унікальних парків, кожен із яких має власну концепцію та атмосферу. Особливе місце займає знаменита «Долина квітів» — мальовничий простір, який щороку приваблює тисячі відвідувачів різнобарвними квітковими композиціями та фотолокаціями.</p><p>Під час прогулянок Доброславом гостей зустрічають сучасні фонтани, затишні сквери, оригінальні артоб’єкти та комфортні громадські простори. Селище стало відомим далеко за межами Одещини завдяки креативним проєктам громади та нестандартним підходам до благоустрою. Одним із символів населеного пункту стала новорічна ялинка, створена з морських черепашок, яка увійшла до Книги національних рекордів України.</p><p>Доброслав активно розвиває культурно-подієвий туризм. Протягом року тут відбуваються фестивалі, концерти, ярмарки та тематичні заходи, які об’єднують мешканців і гостей громади. Завдяки цьому селище стало популярною локацією для сімейного відпочинку та подорожей вихідного дня.</p><p>Розвинена інфраструктура, заклади харчування, спортивні та дитячі майданчики, сучасні громадські простори й зручне транспортне сполучення роблять Доброслав комфортним для відвідування в будь-яку пору року.</p><p>Доброслав — це територія креативних ідей, красивих парків та успішних громадських ініціатив. Місце, де сучасний благоустрій гармонійно поєднується з південною гостинністю та любов’ю до свого краю.</p>", "weather_city_name": null}	tourism@od.gov.ua	2026-06-03 08:11:34.491018+00
2b8ffed3-5cf4-4c94-b68c-2b2f2f70730b	city	city-zqcmp1iz	update	{"id": "city-zqcmp1iz", "name": "Доброслав", "slug": "dobroslav", "reel_url": "Kurisove, UA", "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780474235289-fkort9lrknt.jpg", "video_url": null, "created_at": "2026-06-03T08:11:01.49494+00:00", "description": "<p>Доброслав — яскравий приклад того, як невелике селище може стати сучасним, комфортним і привабливим туристичним центром. Розташований неподалік Одеси, він вражає гостей доглянутими вулицями, оригінальними громадськими просторами, великою кількістю парків та особливою атмосферою затишку й гостинності.</p><p></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Історія Доброслава бере свій початок понад два століття тому. Засноване у 1802 році, селище пройшло шлях від невеликого поселення на важливому поштовому шляху до сучасного адміністративного центру громади, який сьогодні є одним із найуспішніших прикладів розвитку малих населених пунктів України.</p><p>Справжньою візитівкою Доброслава стали його тематичні парки та зелені зони відпочинку. У селищі створено понад десять унікальних парків, кожен із яких має власну концепцію та атмосферу. Особливе місце займає знаменита «Долина квітів» — мальовничий простір, який щороку приваблює тисячі відвідувачів різнобарвними квітковими композиціями та фотолокаціями.</p><p>Під час прогулянок Доброславом гостей зустрічають сучасні фонтани, затишні сквери, оригінальні артоб’єкти та комфортні громадські простори. Селище стало відомим далеко за межами Одещини завдяки креативним проєктам громади та нестандартним підходам до благоустрою. Одним із символів населеного пункту стала новорічна ялинка, створена з морських черепашок, яка увійшла до Книги національних рекордів України.</p><p>Доброслав активно розвиває культурно-подієвий туризм. Протягом року тут відбуваються фестивалі, концерти, ярмарки та тематичні заходи, які об’єднують мешканців і гостей громади. Завдяки цьому селище стало популярною локацією для сімейного відпочинку та подорожей вихідного дня.</p><p>Розвинена інфраструктура, заклади харчування, спортивні та дитячі майданчики, сучасні громадські простори й зручне транспортне сполучення роблять Доброслав комфортним для відвідування в будь-яку пору року.</p><p>Доброслав — це територія креативних ідей, красивих парків та успішних громадських ініціатив. Місце, де сучасний благоустрій гармонійно поєднується з південною гостинністю та любов’ю до свого краю.</p>", "weather_city_name": null}	{"id": "city-zqcmp1iz", "name": "Доброслав", "slug": "dobroslav", "reel_url": "Kurisove, UA", "subtitle": "Селище", "image_url": "https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780474235289-fkort9lrknt.jpg", "video_url": null, "description": "<p>Доброслав — яскравий приклад того, як невелике селище може стати сучасним, комфортним і привабливим туристичним центром. Розташований неподалік Одеси, він вражає гостей доглянутими вулицями, оригінальними громадськими просторами, великою кількістю парків та особливою атмосферою затишку й гостинності.</p><p></p>", "district_id": "district-c6ididsh", "detailed_info": "<p>Історія Доброслава бере свій початок понад два століття тому. Засноване у 1802 році, селище пройшло шлях від невеликого поселення на важливому поштовому шляху до сучасного адміністративного центру громади, який сьогодні є одним із найуспішніших прикладів розвитку малих населених пунктів України.</p><p>Справжньою візитівкою Доброслава стали його тематичні парки та зелені зони відпочинку. У селищі створено понад десять унікальних парків, кожен із яких має власну концепцію та атмосферу. Особливе місце займає знаменита «Долина квітів» — мальовничий простір, який щороку приваблює тисячі відвідувачів різнобарвними квітковими композиціями та фотолокаціями.</p><p>Під час прогулянок Доброславом гостей зустрічають сучасні фонтани, затишні сквери, оригінальні артоб’єкти та комфортні громадські простори. Селище стало відомим далеко за межами Одещини завдяки креативним проєктам громади та нестандартним підходам до благоустрою. Одним із символів населеного пункту стала новорічна ялинка, створена з морських черепашок, яка увійшла до Книги національних рекордів України.</p><p>Доброслав активно розвиває культурно-подієвий туризм. Протягом року тут відбуваються фестивалі, концерти, ярмарки та тематичні заходи, які об’єднують мешканців і гостей громади. Завдяки цьому селище стало популярною локацією для сімейного відпочинку та подорожей вихідного дня.</p><p>Розвинена інфраструктура, заклади харчування, спортивні та дитячі майданчики, сучасні громадські простори й зручне транспортне сполучення роблять Доброслав комфортним для відвідування в будь-яку пору року.</p><p>Доброслав — це територія креативних ідей, красивих парків та успішних громадських ініціатив. Місце, де сучасний благоустрій гармонійно поєднується з південною гостинністю та любов’ю до свого краю.</p>", "weather_city_name": null}	tourism@od.gov.ua	2026-06-03 08:15:41.612349+00
\.


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cities (id, district_id, name, slug, created_at, description, detailed_info, image_url, video_url, subtitle, reel_url, weather_city_name) FROM stdin;
city-7z4cirq1	district-c6ididsh	Чорноморськ	chornomorsk	2026-06-02 14:04:46.063449+00	<p>Чорноморськ - молоде, перспективне місто-курорт, що по праву вважається перлиною одеського узбережжя. Поєднує сучасну інфраструктуру, компактність та комфортний морський клімат.</p>	<p>Місто приваблює гостей 12 кілометрами широких безкоштовних піщаних пляжів із пологим входом у море, що робить відпочинок комфортним як для дорослих, так і для дітей. Завдяки компактним розмірам Чорноморська його можна перетнути пішки менш ніж за годину, насолоджуючись затишною атмосферою та морськими краєвидами. Степове повітря, насичене морським бризом, створює особливий мікроклімат, а тепле літо з комфортною температурою морської води забезпечує чудові умови для відпочинку протягом усього курортного сезону. Міський пляж Чорноморська багато років поспіль підтверджував відповідність міжнародним стандартам якості та екологічної безпеки, що свідчить про високий рівень благоустрою та сервісу. Для відпочивальників облаштовані рятувальні та медичні пункти, душові кабіни, роздягальні та зони відпочинку. Для проживання гостям доступний широкий вибір варіантів — від сучасних готелів і апартаментів до баз відпочинку та затишного приватного сектору. У місті працюють численні кафе, ресторани та розважальні заклади, торгові центри, супермаркети, аптеки та медичні установи. Особливої атмосфери Чорноморськ набуває у вечірній час, коли центральна частина міста та мальовнича набережна з ілюмінацією стають улюбленим місцем прогулянок, зустрічей і відпочинку. Чорноморськ — це море, комфорт і гостинність, які дарують можливість насолодитися справжнім відпочинком на узбережжі Чорного моря.</p>	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780409688674-4yxdlmbty9o.jpg	\N	Місто	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780467661780-kpg18yv11a8.mp4	\N
city-amctg0e7	district-jnun99rr	Болград	bolhrad	2026-06-02 13:50:35.090756+00	<p>Місто засноване у 1821 році болгарськими переселенцями, які прибули на південь Бессарабії після російсько-турецьких війн. Болград став центром болгарської громади на території сучасної України. У 1858 році в місті відкрито Болградську гімназію - перший болгарський середній навчальний заклад нового типу. Місто відігравало значну роль у формуванні болгарської національної інтелігенції XIX століття.</p>	<p>Болград зберіг регулярне планування центральної частини, характерне для міст Південної Бессарабії XIX століття. Частина історичної забудови має культурну цінність. Місто є осередком болгарської культури в Україні, що проявляється у мові, традиціях, гастрономії та фестивальному русі. Поряд із містом розташоване озеро Ялпуг - найбільше природне озеро України. Воно є важливим рекреаційним ресурсом та елементом ландшафтної привабливості території. Болград має виражену спеціалізацію у: – еногастрономічному туризмі (виноробні півдня Одещини); – етнокультурному туризмі (болгарська спадщина); – подієвому туризмі (винні фестивалі, національні свята); – зеленому туризмі (узбережжя озера Ялпуг та ін.).</p>	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780410034294-9wt9szcfqj6.webp	\N	Районний центр	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780410001483-102rz8infnsr.mp4	\N
city-nnvds0fi	district-c6ididsh	Біляївка	bilyayivka	2026-06-03 07:07:09.781902+00	<p>Біляївка — місто, де козацька історія зустрічається з дивовижною природою Нижнього Дністра, а гастрономічні відкриття гармонійно поєднуються з атмосферою справжнього південного гостинного краю.</p>	<p>Розташована всього за годину їзди від Одеси, Біляївка є одним із найцікавіших туристичних напрямків Одещини для тих, хто прагне відкрити для себе автентичну історію, мальовничі природні ландшафти та місцеві гастрономічні традиції. Місто виникло наприкінці XVIII століття як поселення козаків Чорноморського козацького війська та донині зберігає пам’ять про своє славне минуле.</p><p>Справжнім скарбом Біляївки є її унікальне природне розташування. Місто знаходиться поруч із річкою Турунчук та територією Нижньодністровського національного природного парку — одного з найцінніших природних комплексів України. Тут на туристів чекають мальовничі водні простори, заплавні ліси, багатий світ флори та фауни, а також чудові можливості для екотуризму, прогулянок і відпочинку на природі.</p><p>Особливої популярності серед гостей набуває Біле озеро — мальовнича природна локація для відпочинку, риболовлі та спостереження за природою. Любителі активного туризму можуть відвідати екологічну стежку «Дністровія», яка знайомить із природною спадщиною дністровських плавнів та унікальними екосистемами регіону.</p><p>Біляївка також є центром гастрономічного туризму. Місцеві виноробні та фермерські господарства пропонують гостям можливість познайомитися зі смаками Одещини. Особливе місце займає сімейна винарня Шевченко, де можна відвідати екскурсії, дізнатися про особливості виноробства та продегустувати авторські вина.</p><p>Поціновувачам історії та культури місто пропонує цікаві архітектурні пам’ятки та музеї. Храми різних історичних періодів, Біляївський краєзнавчий музей, Музей води та меморіальні об’єкти розкривають багату історію краю та його нерозривний зв’язок із Дністром.</p><p>Протягом року в місті відбуваються культурні заходи, фестивалі та святкування Дня міста, які знайомлять гостей із традиціями та самобутністю місцевої громади.</p><p>Затишні заклади харчування, локальні виробники, бази відпочинку біля води та зручне транспортне сполучення роблять Біляївку комфортною для подорожей у будь-якому форматі — від сімейного відпочинку до екологічних та гастрономічних турів.</p><p>Біляївка — це місце, де оживає козацька історія, вражає природа Дністра та відкривається справжній смак південної Одещини.</p>	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470423847-1yc4swxday7.jpg	\N	Місто	\N	Bilyayivka
city-pzp3jwc6	district-hwb8a005	Пужайкове	puzhaykove	2026-06-02 14:12:00.892602+00	<p style="text-align: left;">Пужайкове - автентичне село з традиційною забудовою, мальовничими природними ландшафтами та збереженим сільським укладом життя. Територія відзначається поєднанням степових просторів, балок і лісових масивів, що формують характерний для півночі Одещини краєвид.</p><p><br></p>	<p>Село має давню історію формування як аграрне поселення Подільського краю. Розвиток території був пов’язаний із землеробством і тваринництвом, що визначило традиційний уклад життя та планування забудови.</p><p style="text-align: justify;">У ХІХ–ХХ століттях Пужайкове розвивалося як типовий сільський населений пункт північної Одещини, зберігши риси історичного планування та локальні культурні традиції.</p><h3 style="text-align: justify;"><strong>Туристичний потенціал</strong></h3><ul><li><p style="text-align: justify;">Зелений та агротуризм – можливість занурення в традиційне сільське середовище.</p></li><li><p style="text-align: justify;">Етнографічна привабливість – місцеві звичаї, кухня, народні традиції Поділля.</p></li><li><p style="text-align: justify;">Природні маршрути – простір для піших та велосипедних прогулянок.</p></li><li><p style="text-align: justify;">Локальні події громади – участь у культурних та громадських заходах.</p></li></ul><p></p>	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780470019935-g5uyu13p3wh.jpg	\N	Село	\N	\N
city-7hu3eslk	district-07uz711u	Кароліно-Бугаз	karolino-buhaz	2026-06-03 06:55:45.411331+00	<p>Кароліно-Бугаз — перлина чорноморського узбережжя Одещини, де безкраї піщані пляжі, морський простір і унікальні природні ландшафти створюють ідеальні умови для відпочинку та відновлення сил.</p>	<p>Розташований лише за 50 кілометрів від Одеси, Кароліно-Бугаз займає особливе місце серед курортних територій регіону. Селище знаходиться на вузькій піщаній косі між Чорним морем та Дністровським лиманом — унікальній природній зоні, яка формує особливий мікроклімат із поєднанням морського та степового повітря. Саме ця природна особливість протягом багатьох років приваблювала сюди тисячі відпочивальників з усієї України та з-за кордону.</p><p>Історія Кароліно-Бугазу бере свій початок ще у XVIII столітті. Давнє поселення Бугаз, розташоване на стратегічно важливому перешийку між морем і лиманом, стало основою для майбутнього курорту. Сучасна назва населеного пункту поєднала історичну назву місцевості та ім’я Кароля Сцибора-Мархоцького, який відіграв важливу роль у відродженні поселення на початку XIX століття.</p><p>Кароліно-Бугаз заслужено вважається одним із найвідоміших центрів пляжного відпочинку Одещини. Широкі піщані пляжі, просторе узбережжя, мальовничі морські пейзажі та неймовірні заходи сонця створюють атмосферу справжнього курортного раю. Це місце завжди приваблювало поціновувачів сімейного відпочинку, морських прогулянок та відпочинку серед природи.</p><p>Селище має розвинену туристичну інфраструктуру: бази відпочинку, пансіонати, готелі, приватний сектор, кафе, ресторани та численні рекреаційні зони. Близькість до Одеси робить його одним із найзручніших напрямків для літнього відпочинку на узбережжі Чорного моря.</p><p>Сьогодні Кароліно-Бугаз залишається одним із найвідоміших курортних брендів Одещини та важливою складовою туристичного потенціалу регіону. Його природна унікальність, багаторічна курортна історія та вигідне розташування формують значний потенціал для майбутнього розвитку туристичної галузі після відновлення безпечних умов для відпочинку.</p><p>Кароліно-Бугаз — це місце, де море, лиман і безмежні горизонти створюють неповторний образ південного узбережжя України.</p>	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780469741247-sn3fr8gzob.webp	\N	Село	\N	\N
city-i9fv1hcc	district-c6ididsh	Санжійка	sanzhiyka	2026-06-03 06:52:44.885845+00	<p>Санжійка — один із наймальовничіших куточків узбережжя Одещини, де безкрає Чорне море зустрічається з високими береговими схилами, а тиша та природна краса створюють ідеальні умови для відпочинку далеко від міської метушні.</p><p></p>	<p>Розташоване всього за 25 кілометрів від Одеси та неподалік від Чорноморська, це затишне приморське село приваблює гостей унікальними морськими панорамами, чистим повітрям та особливою атмосферою спокою. Санжійка стала справжньою знахідкою для тих, хто цінує природні ландшафти, неквапливі прогулянки та можливість насолодитися красою узбережжя в його первозданному вигляді.</p><p>Візитівкою села є високі глинисті схили, з яких відкриваються захопливі краєвиди на Чорне море. Саме тут можна спостерігати неймовірні світанки та заходи сонця, робити яскраві фотографії та милуватися безмежним морським горизонтом. Узбережжя Санжійки давно стало популярною локацією для фототуризму та романтичних прогулянок.</p><p>Особливе місце в історії села займає Санжійський маяк — один із впізнаваних символів чорноморського узбережжя. Протягом багатьох десятиліть він допомагав морякам безпечно орієнтуватися серед морських шляхів і сьогодні залишається важливою частиною місцевого колориту та улюбленою фотолокацією.</p><p>Санжійка має цікаву історію, що бере початок ще наприкінці XVIII століття, коли на цих берегах було створено сторожовий пункт для забезпечення безпеки мореплавства. Відтоді село нерозривно пов’язане з морем, навігацією та життям чорноморського узбережжя.</p><p>Для гостей доступні гостьові будинки, приватні садиби, бази відпочинку та сезонні заклади харчування. Зручне транспортне сполучення дозволяє легко дістатися сюди з Одеси та інших туристичних центрів регіону.</p><p>Санжійка — це місце, де можна відчути справжню гармонію з природою, насолодитися морськими пейзажами та відкрити для себе одну з найкрасивіших прибережних локацій Одещини.</p>	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780469504189-u4atc2relw.PNG	\N	Село	\N	\N
city-jei7cmx8	district-07uz711u	Білгород-Дністровський	bilhorod-dnistrovskyy	2026-06-03 06:26:11.083471+00	<p>Білгород-Дністровський — місто, де понад дві з половиною тисячі років історії оживають просто на ваших очах. Розташований на мальовничому березі Дністровського лиману, всього за 80 кілометрів від Одеси, він є одним із найдавніших міст не лише України, а й усієї Східної Європи.</p><p>Тут кожен камінь зберігає пам’ять про великі цивілізації. Давньогрецька Тіра, середньовічний Аккерман, османський торговий центр та сучасне українське місто — Білгород-Дністровський об’єднав у собі епохи, культури та народи, створивши унікальний історичний простір.</p><p></p>	<p>Головною окрасою міста є велична Аккерманська фортеця — одна з найбільших і найкраще збережених середньовічних фортець Східної Європи. Її могутні стіни височіють над водами Дністровського лиману, відкриваючи захопливі панорами та створюючи неповторну атмосферу подорожі в часі. Фортеця площею понад 9 гектарів є справжньою візитівкою Півдня України та місцем, яке щороку приваблює тисячі відвідувачів.</p><p>Білгород-Дністровський зачаровує поєднанням античної спадщини, середньовічної архітектури та східного колориту. Тут можна прогулятися старовинними вулицями, насолодитися краєвидами лиману, відкрити для себе археологічні пам’ятки та відчути дух багатовікової історії.</p><p>Місто пропонує комфортні умови для подорожей: сучасні готелі, затишні садиби, ресторани з місцевою кухнею, туристичні послуги та зручне транспортне сполучення з Одесою й популярними курортами регіону.</p><p>У довоєнні роки Білгород-Дністровський був відомий масштабними історичними фестивалями, лицарськими турнірами, музичними подіями та культурними ярмарками, які збирали гостей з усієї України та з-за кордону.</p><p>Білгород-Дністровський — це унікальна можливість за один день пройти шлях від античності до сучасності, відчути велич середньовічної фортеці та насолодитися красою південних краєвидів. Це місто, яке неможливо просто відвідати — його хочеться відкривати знову і знову.</p>	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468066497-mr7fwxi3i3d.jpg	\N	Районний центр	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780469895979-aeawyddokgl.mp4	\N
city-zqcmp1iz	district-c6ididsh	Доброслав	dobroslav	2026-06-03 08:11:01.49494+00	<p>Доброслав — яскравий приклад того, як невелике селище може стати сучасним, комфортним і привабливим туристичним центром. Розташований неподалік Одеси, він вражає гостей доглянутими вулицями, оригінальними громадськими просторами, великою кількістю парків та особливою атмосферою затишку й гостинності.</p><p></p>	<p>Історія Доброслава бере свій початок понад два століття тому. Засноване у 1802 році, селище пройшло шлях від невеликого поселення на важливому поштовому шляху до сучасного адміністративного центру громади, який сьогодні є одним із найуспішніших прикладів розвитку малих населених пунктів України.</p><p>Справжньою візитівкою Доброслава стали його тематичні парки та зелені зони відпочинку. У селищі створено понад десять унікальних парків, кожен із яких має власну концепцію та атмосферу. Особливе місце займає знаменита «Долина квітів» — мальовничий простір, який щороку приваблює тисячі відвідувачів різнобарвними квітковими композиціями та фотолокаціями.</p><p>Під час прогулянок Доброславом гостей зустрічають сучасні фонтани, затишні сквери, оригінальні артоб’єкти та комфортні громадські простори. Селище стало відомим далеко за межами Одещини завдяки креативним проєктам громади та нестандартним підходам до благоустрою. Одним із символів населеного пункту стала новорічна ялинка, створена з морських черепашок, яка увійшла до Книги національних рекордів України.</p><p>Доброслав активно розвиває культурно-подієвий туризм. Протягом року тут відбуваються фестивалі, концерти, ярмарки та тематичні заходи, які об’єднують мешканців і гостей громади. Завдяки цьому селище стало популярною локацією для сімейного відпочинку та подорожей вихідного дня.</p><p>Розвинена інфраструктура, заклади харчування, спортивні та дитячі майданчики, сучасні громадські простори й зручне транспортне сполучення роблять Доброслав комфортним для відвідування в будь-яку пору року.</p><p>Доброслав — це територія креативних ідей, красивих парків та успішних громадських ініціатив. Місце, де сучасний благоустрій гармонійно поєднується з південною гостинністю та любов’ю до свого краю.</p>	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780474235289-fkort9lrknt.jpg	\N	Селище	Kurisove, UA	\N
city-8cd5z47b	district-c6ididsh	Овідіополь	ovidiopol	2026-06-03 06:36:47.839383+00	<p>Овідіополь - історичне місто на березі Дністровського лиману, яке поєднує давню історію, вигідне географічне розташування та потенціал для розвитку рекреаційного і культурно-пізнавального туризму. Завдяки близькості до Одеси та курортних територій узбережжя Чорного моря місто є зручним туристичним пунктом для подорожей півднем Одеської області.</p><p><br></p>	<p>Розташований неподалік Одеси та популярних курортів Чорноморського узбережжя, Овідіополь відкриває перед мандрівниками унікальну можливість доторкнутися до різних історичних епох. Територія сучасного міста була заселена ще в античні часи, про що свідчать археологічні пам’ятки скіфської, сарматської та черняхівської культур. Протягом століть тут існували давні фортеці, торгові поселення та порти, які залишили помітний слід в історії Північного Причорномор’я.</p><p>Назва міста оповита романтичною легендою про видатного римського поета Овідія, який перебував у засланні на берегах Чорного моря. Саме ця історія надихає сучасний Овідіополь на створення власного туристичного образу, пов’язаного з античною спадщиною.</p><p>Особливої уваги заслуговує проєкт реконструкції давньогрецької галери «Персей» — унікального судна, відтвореного за стародавніми технологіями без використання металевих цвяхів. Галера стала символом туристичних амбіцій громади та нагадуванням про морське минуле регіону. У перспективі Овідіополь планує створення цілого туристичного комплексу з античною тематикою, центром реконструкції стародавніх суден та стилізованою історичною пристанню.</p><p>Сьогодні Овідіополь приваблює гостей чудовими краєвидами Дністровського лиману, можливостями для риболовлі, водного відпочинку та прогулянок на природі. Узбережжя лиману створює ідеальні умови для спокійного сімейного відпочинку, фотоподорожей та знайомства з природними багатствами Одещини.</p><p>Для туристів доступна необхідна інфраструктура: заклади харчування, готелі, бази відпочинку та зручне автомобільне сполучення з Одесою і курортними територіями області.</p><p>Овідіополь — це місце, де історія оживає на берегах лиману, а давні легенди, морські традиції та південна гостинність створюють неповторну атмосферу для подорожей і відкриттів.</p>	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780468649334-u9of4mhvtrq.jpg	\N	Селище	\N	Ovidiopol
\.


--
-- Data for Name: content_cards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content_cards (id, page_key, section_key, card_type, title, subtitle, image_url, href, city_id, district_id, region_id, sort_order, published, payload, created_at) FROM stdin;
card-zpw78fmi	index	directions	destination	Подільський район	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401411712-hy0soiyv8t8.png	/raion/podilskyy-rayon	\N	district-hwb8a005	\N	6	t	{}	2026-06-02 12:04:27.45966+00
card-covbcs7h	index	directions	destination	Березівський район	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png	/raion/berezivskyy-rayon	\N	district-fvvgs41u	\N	7	t	{}	2026-06-02 12:04:19.38473+00
card-xiu6i1c5	index	directions	destination	Одеський район	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780387299909-xyfts4zyf4i.png	/raion/odeskyy-rayon	\N	district-c6ididsh	\N	0	t	{}	2026-06-02 08:01:53.985591+00
tourism-type-гастрономічний-туризм	tourism-types	type	destination	Гастрономічний туризм	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405345653.png	\N	\N	\N	\N	0	t	{}	2026-06-02 13:02:28.155675+00
tourism-type-релігійний-туризм	tourism-types	type	destination	Релігійний туризм	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405357803.png	\N	\N	\N	\N	0	t	{}	2026-06-02 13:02:46.422799+00
card-tmcfrrpm	index	directions	destination	Болградський район	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401679505-nm3n4674yl.png	/raion/bolhradskyy-rayon	\N	district-jnun99rr	\N	3	t	{}	2026-06-02 12:04:22.877981+00
card-houw3nwx	index	directions	destination	Роздільнянський район	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png	/raion/rozdilnyanskyy-rayon	\N	district-btn5o6n3	\N	5	t	{}	2026-06-02 12:39:09.803311+00
card-city-info-1-1778486218550	city---2	info	info	Історія та культура	\N	\N	\N	\N	\N	region-odesa	1	t	{}	2026-05-11 07:56:59.414324+00
card-city-main-1778486218550	city---2	main	text	Опис району	\N	\N	\N	\N	\N	region-odesa	1	t	{"text": "Нове місто 2 — нова сторінка міста. Заповніть опис у адмінці."}	2026-05-11 07:56:59.129106+00
card-detail-hero-1778486313816-rsvt4b	detail-event-event-1778486313816-rsvt4b	hero	event	Новий події	Білгород-Дністровський	\N	/podiyi/event-1778486313816-rsvt4b	\N	\N	region-odesa	1	f	{"objectId": "obj-event-1778486313816-rsvt4b", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}	2026-05-11 07:58:34.333429+00
card-placement-obj-restaurant-rybnyi-city-bilhorod-dnistrovskyi-1777547700156	city-bilhorod-dnistrovskyi	restaurants	restaurant	Рибний двір	Білгород-Дністровський	https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80	/restorany/rybnyy-dvir	\N	\N	region-odesa	999	t	{"status": "published", "cuisine": null, "summary": "Рибний двір", "objectId": "obj-restaurant-rybnyi", "objectType": "restaurant", "priceRange": null, "tourism_object_id": "obj-restaurant-rybnyi"}	2026-04-30 11:15:00.533594+00
card-placement-obj-restaurant-rybnyi-district-bilhorod-dnistrovskyi-raion-1777547700653	district-bilhorod-dnistrovskyi-raion	main	restaurant	Рибний двір	Білгород-Дністровський	https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80	/restorany/rybnyy-dvir	\N	\N	region-odesa	999	t	{"status": "published", "cuisine": null, "summary": "Рибний двір", "objectId": "obj-restaurant-rybnyi", "objectType": "restaurant", "priceRange": null, "tourism_object_id": "obj-restaurant-rybnyi"}	2026-04-30 11:15:00.966955+00
card-restaurant-rybnyi	city-bilhorod	restaurants	restaurant	Рибний двір	Білгород-Дністровський	https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80	/restorany/rybnyy-dvir	\N	\N	region-odesa	1	t	{}	2026-04-28 13:23:38.194287+00
card-placement-obj-restaurant-rybnyi-index-1777547701091	index	featured	restaurant	Рибний двір	Білгород-Дністровський	https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80	/restorany/rybnyy-dvir	\N	\N	region-odesa	999	t	{"status": "published", "cuisine": null, "summary": "Рибний двір", "objectId": "obj-restaurant-rybnyi", "objectType": "restaurant", "priceRange": null, "tourism_object_id": "obj-restaurant-rybnyi"}	2026-04-30 11:15:01.398539+00
card-detail-overview-1778486313816-rsvt4b	detail-event-event-1778486313816-rsvt4b	overview	text	Опис	\N	\N	\N	\N	\N	region-odesa	2	f	{"text": "", "objectId": "obj-event-1778486313816-rsvt4b", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}	2026-05-11 07:58:34.59737+00
card-hotel-fortetsia	city-bilhorod	hotels	hotel	Fortetsia View Hotel	Білгород-Дністровський	https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80	/hoteli/fortetsia-view-hotel	\N	\N	region-odesa	1	t	{"rating": "4.8", "objectId": "obj-hotel-fortetsia", "tourism_object_id": "obj-hotel-fortetsia"}	2026-04-28 13:23:38.194287+00
card-hotel-1777547883541	detail-hotel-fortetsia-view-hotel	overview	hotel	Новий блок	\N	\N	/hoteli/fortetsia-view-hotel	\N	\N	region-odesa	2	t	{"objectId": "obj-hotel-fortetsia", "tourism_object_id": "obj-hotel-fortetsia"}	2026-04-30 11:18:17.764219+00
card-placement-obj-hotel-fortetsia-city-bilhorod-dnistrovskyi-1777547744508	city-bilhorod-dnistrovskyi	hotels	hotel	Fortetsia View Hotel	Білгород-Дністровський	https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80	/hoteli/fortetsia-view-hotel	\N	\N	region-odesa	999	t	{"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}	2026-04-30 11:15:44.847737+00
card-placement-obj-hotel-fortetsia-district-bilhorod-dnistrovskyi-raion-1777547744975	district-bilhorod-dnistrovskyi-raion	main	hotel	Fortetsia View Hotel	Білгород-Дністровський	https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80	/hoteli/fortetsia-view-hotel	\N	\N	region-odesa	999	t	{"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}	2026-04-30 11:15:45.296179+00
card-placement-obj-hotel-fortetsia-index-1777547745405	index	featured	hotel	Fortetsia View Hotel	Білгород-Дністровський	https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80	/hoteli/fortetsia-view-hotel	\N	\N	region-odesa	999	t	{"status": "published", "summary": "Fortetsia View Hotel", "objectId": "obj-hotel-fortetsia", "amenities": [], "objectType": "hotel", "priceRange": null, "tourism_object_id": "obj-hotel-fortetsia"}	2026-04-30 11:15:45.7109+00
card-placement-obj-event-1778486313816-rsvt4b-index-1778486471546	index	featured	event	COMIC WAVE	Білгород-Дністровський	https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg	/podiyi/event-1778486313816-rsvt4b	\N	\N	region-odesa	999	t	{"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}	2026-05-11 08:01:11.791531+00
card-placement-obj-event-1778486313816-rsvt4b-city-bilhorod-dnistrovskyi-1778486471045	city-bilhorod-dnistrovskyi	events	event	COMIC WAVE	Білгород-Дністровський	https://d2q8nf5aywi2aj.cloudfront.net/uploads/resize/shows/logo/630x891_1773765763.jpg	/podiyi/event-1778486313816-rsvt4b	\N	\N	region-odesa	999	t	{"status": "published", "summary": "", "objectId": "obj-event-1778486313816-rsvt4b", "eventDate": null, "eventDates": [], "objectType": "event", "tourism_object_id": "obj-event-1778486313816-rsvt4b"}	2026-05-11 08:01:11.315542+00
tourism-type-розважальний-туризм	tourism-types	type	destination	Розважальний туризм	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405360582.png	\N	\N	\N	\N	0	t	{}	2026-06-02 13:02:46.238287+00
tourism-type-спортивний-туризм	tourism-types	type	destination	Спортивний туризм	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405399490.png	\N	\N	\N	\N	0	t	{}	2026-06-02 13:03:22.182362+00
card-s5k7wx4v	index	directions	destination	Ізмаїльський район	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401741532-3ic4253e3ho.png	/raion/izmayilskyy-rayon	\N	district-inxqkycm	\N	2	t	{}	2026-06-02 12:04:25.146328+00
tourism-type-історико-культурний-туризм	tourism-types	type	destination	Історико-культурний туризм	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405349569.jpg	\N	\N	\N	\N	0	t	{}	2026-06-02 13:02:30.83353+00
tourism-type-медико-оздоровчий-туризм	tourism-types	type	destination	Медико-оздоровчий туризм	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405353036.png	\N	\N	\N	\N	0	t	{}	2026-06-02 13:02:36.860611+00
tourism-type-сільський-та-зелений-туризм	tourism-types	type	destination	Сільський та зелений туризм	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405363765.jpg	\N	\N	\N	\N	0	t	{}	2026-06-02 13:02:45.963401+00
tourism-type-морський-туризм	tourism-types	type	destination	Морський туризм	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/tourism-types/1780405355665.png	\N	\N	\N	\N	0	t	{}	2026-06-02 13:02:46.422643+00
article-demo-odeska-oblast	articles	article	text	Одещина: повний путівник для мандрівника	Море, фортеці, вино і бессарабська кухня — все що потрібно знати перед поїздкою	https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80	\N	\N	\N	\N	0	t	{"content": "\\n<h2>Що таке туристична Одещина?</h2>\\n<p>Одеська область — це унікальний регіон на півдні України, де зустрічаються <strong>три стихії</strong>: Чорне море, степові простори та дунайські плавні. Тут збереглися сліди давньогрецьких колоній, середньовічних фортець і бессарабських культур — і все це в межах одного регіону.</p>\\n<p>Від <strong>Акерманської фортеці</strong> до виноградників Болграду, від одеських катакомб до реліктових лиманів — кожен куточок області приховує власну неповторну історію.</p>\\n\\n<blockquote>«Одеса — це не просто місто. Це стан душі, де гумор, архітектура і море зливаються в одне неповторне ціле.» — Ісаак Бабель</blockquote>\\n\\n<h2>П'ять причин відвідати Одещину</h2>\\n<p>Якщо ви ще не вирішили, чи варто їхати — ось п'ять аргументів, які розвіють всі сумніви:</p>\\n<ul>\\n<li><strong>Море і пляжі</strong> — понад 300 км узбережжя Чорного моря з різноманітними курортами від Затоки до Сергіївки</li>\\n<li><strong>Гастрономія</strong> — бессарабська кухня, свіжа риба з лиману, місцеві вина та унікальна одеська кулінарна традиція</li>\\n<li><strong>Історія</strong> — понад 2500 років безперервної присутності людини: від скіфів і греків до турецьких фортець і радянської архітектури</li>\\n<li><strong>Природа</strong> — Тузлівські лимани, Дунайський біосферний заповідник, реліктові степи та пелікани</li>\\n<li><strong>Люди</strong> — одесити з їхнім унікальним гумором, гостинністю та неповторним акцентом</li>\\n</ul>\\n\\n<h3>Морський туризм</h3>\\n<p>Пляжний сезон на Одещині триває з червня по вересень. Найпопулярніші напрямки — <strong>Аркадія</strong>, <strong>Затока</strong> та <strong>Коблеве</strong>. Для тих, хто шукає тишу — рекомендуємо лимани та дикі пляжі біля Тузлівських лиманів.</p>\\n\\n<h3>Екологічний туризм</h3>\\n<p>Одещина — один з найбагатших регіонів України за біорізноманіттям. <em>Дунайський біосферний заповідник</em> входить до мережі ЮНЕСКО і є домівкою для понад 300 видів птахів, включаючи рожевих пеліканів та кучерявих пеліканів — рідкісних навіть для Європи.</p>\\n\\n<blockquote>«Коли бачиш захід сонця над Тузлівськими лиманами, розумієш — є місця, які неможливо описати словами.» — мандрівник</blockquote>\\n\\n<h2>Гастрономічний маршрут Одещини</h2>\\n<p>Одеська кухня — це окрема культура. Тут поєднуються українські, єврейські, грецькі, болгарські та турецькі кулінарні традиції. Обов'язково спробуйте:</p>\\n<ol>\\n<li>Бички в томаті — одеська класика, яка стала символом міста</li>\\n<li>Форшмак — єврейська страва з оселедця, яку одесити вважають своєю</li>\\n<li>Бессарабські вина — Шардоне і Каберне з виноградників Болграду</li>\\n<li>Свіжу рибу в ресторанах на узбережжі лиману</li>\\n</ol>\\n\\n<h3>Де зупинитись</h3>\\n<p>Від бутик-готелів в центрі Одеси до затишних гостьових будинків у бессарабських селах — вибір великий. Для тих, хто хоче зануритись в атмосферу справжньої Одещини, рекомендуємо агро-садиби в Роздільнянському чи Білгород-Дністровському районах.</p>\\n\\n<h2>Практична інформація</h2>\\n<p>Найкращий час для відвідування — <strong>травень–вересень</strong>. Температура влітку досягає +35°C, море прогрівається до +27°C. Навесні і восени особливо гарно в степах та виноградниках.</p>\\n<p>Дістатись до Одеси можна <em>літаком</em> (міжнародний аеропорт), <em>потягом</em> (регулярне сполучення з Києвом і Львовом) або <em>автобусом</em>. По регіону зручно пересуватись орендованим авто.</p>\\n\\n<hr>\\n\\n<p>Одещина чекає на вас — з відкритими обіймами, теплим морем і незабутніми враженнями. <strong>Плануйте подорож вже сьогодні.</strong></p>\\n", "videoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ", "publishedAt": "02.06.2026"}	2026-06-02 13:09:17.882113+00
card-uqpzfems	index	directions	destination	Білгород-Дністровський район	\N	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401841038-zawqt7rid7e.png	/raion/bilhorod-dnistrovskyy-rayon	\N	district-07uz711u	\N	4	t	{}	2026-06-02 12:04:20.772265+00
\.


--
-- Data for Name: districts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.districts (id, region_id, name, slug, created_at, subtitle, description, detailed_info, image_url, video_url, reel_url) FROM stdin;
district-c6ididsh	region-odesa	Одеський район	odeskyy-rayon	2026-06-02 08:01:45.22002+00	\N	Одеський район — це туристичне серце Одещини, де гармонійно поєднуються морське узбережжя, лимани, природні ландшафти, багата культурна спадщина та сучасна туристична інфраструктура. Саме тут розташована Одеса — один із найвідоміших туристичних центрів України, а також численні курортні, оздоровчі та рекреаційні локації.	Район приваблює відпочинком на узбережжі Чорного моря, мальовничими берегами Куяльницького, Хаджибейського та Тилігульського лиманів, лікувальними грязями, природоохоронними територіями Нижньодністровського національного природного парку та регіонального ландшафтного парку «Тилігульський». Тут створені чудові умови для пляжного, екологічного, активного та оздоровчого туризму.\nОсобливе місце займає культурна спадщина району. Історичний центр Одеси, внесений до Списку всесвітньої спадщини ЮНЕСКО, Одеський національний академічний театр опери та балету, Потьомкінські сходи, Приморський бульвар та численні архітектурні пам’ятки формують унікальний туристичний образ регіону.\nОдеський район також відомий своїми виноробнями, фермерськими господарствами, гастрономічними локаціями та закладами гостинності. Тут можна скуштувати локальні вина, морепродукти, фермерські сири та інші традиційні продукти півдня України. Численні фестивалі, культурні події та гастрономічні заходи протягом року роблять район одним із найдинамічніших туристичних напрямків країни.\nОдеський район — це місце, де в межах однієї подорожі можна поєднати морський відпочинок, знайомство з історією та культурою, гастрономічні відкриття, відпочинок на природі та оздоровлення. Саме це різноманіття вражень робить його однією з найпривабливіших туристичних дестинацій України.\n	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780387299909-xyfts4zyf4i.png	\N	\N
district-hwb8a005	region-odesa	Подільський район	podilskyy-rayon	2026-06-02 11:56:56.749376+00	\N	Подільський район — це зелена перлина півночі Одещини, де мальовничі ліси, річкові долини та автентична атмосфера створюють ідеальні умови для спокійного відпочинку. На відміну від морського узбережжя, тут туристів зустрічають хвилясті ландшафти Подільської височини, чисте повітря та унікальна природа.	Головними природними скарбами району є Савранський ліс — один із найбільших лісових масивів області, долини річок Кодима та Савранка, численні ставки, джерела та природоохоронні території. Це чудове місце для екотуризму, піших прогулянок, веломандрівок і відпочинку на природі.\nПодільський район зберігає багату історико-культурну спадщину, традиції багатонаціонального Поділля та самобутню гастрономію. Тут можна скуштувати домашні фермерські продукти, познайомитися з місцевими традиціями та відчути справжню гостинність українського села.\nЦе територія тихого туризму, де немає метушні великих курортів, зате є можливість відновити сили, насолодитися природою та відкрити для себе іншу, маловідому й надзвичайно щиру Одещину.\n	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401411712-hy0soiyv8t8.png	\N	\N
district-fvvgs41u	region-odesa	Березівський район	berezivskyy-rayon	2026-06-02 11:59:53.882213+00	\N	Березівський район — це край безкраїх степів, мальовничих річкових долин і тихого відпочинку далеко від міської метушні. Територію району прикрашають Тилігульський та Хаджибейський лимани, річки Великий і Малий Куяльник, Тилігул, Балай та численні балки, що формують неповторні природні ландшафти.\n	Особливу туристичну цінність мають долина річки Тилігул, степові урочища поблизу Златоустового, Маринового та Новокальчевого, а також численні природоохоронні території. Серед них — Тилігульський регіональний ландшафтний парк, заказники «Коса Стрілка», «Верхній ліс», Каїрівський, Осинівський та інші природні пам’ятки.\nБерезівщина зберігає й багату історико-культурну спадщину. Символом району є садиба Курісів — одна з найвідоміших архітектурних пам’яток Одещини. Інтерес для мандрівників також становлять костел Святого Северина, Свято-Іоанно-Богословська церква, старовинні козацькі цвинтарі, кам’яний вітряк в Адамівці та історичні споруди Северинівки.\nРайон приваблює шанувальників зеленого туризму, сільського відпочинку та гастрономічних подорожей. Тут можна познайомитися з життям фермерських господарств, скуштувати натуральні сири, ковбаси, мед та іншу локальну продукцію, а також відчути справжню гостинність степового краю.\nБерезівський район — це місце для тих, хто цінує тишу, природну красу, автентичну атмосферу українського села та неспішний відпочинок серед степових просторів Одещини.\n	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401583749-a6x0oe8wlyb.png	\N	\N
district-jnun99rr	region-odesa	Болградський район	bolhradskyy-rayon	2026-06-02 12:01:27.168967+00	\N	Болградський район — серце Української Бессарабії, край виноградників, етнічних традицій та гостинності. Тут на туристів чекає унікальне поєднання болгарської, гагаузької, молдавської та української культур, що створює особливу атмосферу, не схожу на жоден інший регіон України.\n	Головною природною окрасою району є озеро Ялпуг — найбільше природне озеро України, яке приваблює любителів відпочинку на воді, рибальства та мальовничих краєвидів. Безкраї степи, виноградники та сонячні бессарабські пейзажі створюють ідеальні умови для подорожей, фототуризму та відпочинку на природі.\nБолградщина є одним із провідних центрів винного туризму Одещини. Тут працюють сімейні виноробні, проводяться дегустації локальних вин, а традиційна бессарабська кухня дивує автентичними стравами та старовинними рецептами, що передаються поколіннями.\nКультурною візитівкою району є місто Болград зі Спасо-Преображенським собором, історичною Болградською гімназією та багатою спадщиною болгарських переселенців. Особливе місце в туристичному календарі займає Bolgrad Wine Fest — фестиваль, який щороку збирає поціновувачів вина, гастрономії та бессарабських традицій.\nБолградський район — це подорож за новими смаками, культурою та враженнями, де кожен гість відкриває справжню душу Бессарабії.	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401679505-nm3n4674yl.png	\N	\N
district-inxqkycm	region-odesa	Ізмаїльський район	izmayilskyy-rayon	2026-06-02 12:02:26.161218+00	\N	Ізмаїльський район — справжня перлина українського Придунав’я, де величний Дунай, мальовничі озера та багатонаціональна культура створюють один із найунікальніших туристичних регіонів України. Це край дикої природи, водних маршрутів, автентичних традицій і незабутніх вражень.\n	Головною туристичною візитівкою району є Вилкове — знаменита «українська Венеція», де замість вулиць простягаються канали, а човен залишається звичним транспортом. Подорожі єриками, екскурсії до знаменитого «0 км Дунаю», спостереження за птахами та знайомство з життям дельти Дунаю відкривають гостям особливий світ природи та гармонії.\nПриродне багатство району доповнюють Дунайський біосферний заповідник, озера Ялпуг, Кугурлуй, Катлабух і Китай, які створюють ідеальні умови для екотуризму, риболовлі, фотоподорожей та активного відпочинку на воді.\nІзмаїльщина вражає також своєю культурною різноманітністю. Старовинний Ізмаїл, багатонаціональні громади Придунав’я, старообрядницька спадщина Вилкового та традиції болгар, гагаузів, молдован і українців формують неповторний колорит регіону.\nОсобливе місце у туристичному досвіді займає місцева гастрономія: дунайський оселедець, свіжа риба, ароматна юшка, домашні вина та традиційні страви народів Бессарабії. Ізмаїльський район — це подорож до серця Дунаю, де природа, культура та гостинність поєднуються в єдину незабутню історію.\n\n	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401741532-3ic4253e3ho.png	\N	\N
district-07uz711u	region-odesa	Білгород-Дністровський район	bilhorod-dnistrovskyy-rayon	2026-06-02 12:04:05.413693+00	\N	Білгород-Дністровський район — один із найяскравіших туристичних регіонів Одещини, де поєднуються морське узбережжя, велична історична спадщина та унікальні гастрономічні традиції. Це місце, де кожна подорож дарує нові враження — від відпочинку біля моря до знайомства з багатовіковою історією Північного Причорномор’я.	Головною туристичною перлиною району є Білгород-Дністровська фортеця — одна з найбільших і найкраще збережених середньовічних фортець Східної Європи. Поруч розташовані археологічні пам’ятки античного міста Тіра та історичний центр Білгорода-Дністровського, що відкривають багатовікову історію краю.\nЛюбителів морського відпочинку приваблюють курортні території Затоки та Кароліно-Бугаза з широкими піщаними пляжами, теплим морем і мальовничими краєвидами. Особливу природну цінність становить Національний природний парк «Тузлівські лимани» — один із найунікальніших природоохоронних комплексів України, де можна спостерігати за птахами, насолоджуватися дикою природою та відкривати красу чорноморського узбережжя.\nБілгород-Дністровський район також є центром гастрономічного туризму. Саме тут розташовані відомі виноробні, крафтові сироварні та фермерські господарства, які пропонують дегустації локальних вин, сирів і традиційних страв півдня України.\nБілгород-Дністровський район — це ідеальне поєднання моря, історії, природи та гастрономії, що робить його однією з найпривабливіших туристичних дестинацій Одещини для відпочинку у будь-яку пору року.\n	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780401841038-zawqt7rid7e.png	\N	\N
district-btn5o6n3	region-odesa	Роздільнянський район	rozdilnyanskyy-rayon	2026-06-02 12:38:35.522666+00	\N	Роздільнянський район — це близька та доступна природна дестинація Одещини, де безкраї степи поєднуються з мальовничими водоймами та цікавою історичною спадщиною. Лише за годину їзди від Одеси на туристів чекають спокійний відпочинок на природі, риболовля, екологічні маршрути та знайомство з самобутньою культурою півдня України.	Головними природними перлинами району є Кучурганське водосховище, схили Хаджибейського лиману, ботанічний заказник «Костянська балка» та екокомплекс «Рідна природа», які створюють чудові можливості для сімейного відпочинку, фототуризму та екологічних подорожей.\nОсобливий колорит району формує багатонаціональна історія краю. Тут збереглися унікальні пам’ятки німецької колоніальної спадщини, серед яких величні католицькі костели та старовинні храми, що доповнюють туристичні маршрути культурно-пізнавального спрямування.\nРоздільнянщина також знайомить гостей із локальними фермерськими традиціями, сільською гостинністю та атмосферою справжнього степового краю. Це ідеальне місце для одноденної подорожі, відпочинку на природі та відкриття маловідомих, але надзвичайно цікавих куточків Одещини.\n	https://yvqksgfqfxhegtpezukt.supabase.co/storage/v1/object/public/media/1780400130129-t3r4u65zqn.png	\N	\N
\.


--
-- Data for Name: page_configs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.page_configs (id, entity_type, entity_id, sections_json, updated_at) FROM stdin;
district-default-io7zmxqu	district	default	"[{\\"kind\\":\\"description\\",\\"title\\":\\"Про район\\",\\"visible\\":true,\\"sortOrder\\":1,\\"id\\":\\"dco4qqho\\"},{\\"kind\\":\\"cities_list\\",\\"title\\":\\"Міста\\",\\"visible\\":true,\\"sortOrder\\":2,\\"bgColor\\":\\"#ffdfc6\\",\\"id\\":\\"6yp648t0\\"},{\\"kind\\":\\"places_attraction\\",\\"title\\":\\"Туристичні об'єкти\\",\\"visible\\":true,\\"sortOrder\\":3,\\"bgColor\\":\\"#001a3d\\",\\"id\\":\\"0hgps74f\\"},{\\"kind\\":\\"places_event\\",\\"title\\":\\"Події\\",\\"visible\\":true,\\"sortOrder\\":4,\\"bgColor\\":\\"#3d0820\\",\\"id\\":\\"gp4fqgp8\\"},{\\"kind\\":\\"places_restaurant\\",\\"title\\":\\"Ресторани\\",\\"visible\\":true,\\"sortOrder\\":5,\\"bgColor\\":\\"#2a1200\\",\\"id\\":\\"8js98627\\"},{\\"kind\\":\\"places_hotel\\",\\"title\\":\\"Готелі\\",\\"visible\\":true,\\"sortOrder\\":6,\\"bgColor\\":\\"#062820\\",\\"id\\":\\"zowqf8yn\\"}]"	2026-06-02 07:19:29.229+00
attraction-default-2yyi6b05	attraction	default	"[{\\"kind\\":\\"description\\",\\"title\\":\\"Про об'єкт\\",\\"visible\\":true,\\"sortOrder\\":1,\\"id\\":\\"mzvji1xv\\"},{\\"kind\\":\\"contact_info\\",\\"title\\":\\"Контакти\\",\\"visible\\":true,\\"sortOrder\\":2,\\"id\\":\\"yjt96fsq\\"},{\\"kind\\":\\"map\\",\\"title\\":\\"Карта\\",\\"visible\\":true,\\"sortOrder\\":3,\\"id\\":\\"egneojdr\\"},{\\"kind\\":\\"gallery\\",\\"title\\":\\"Галерея\\",\\"visible\\":true,\\"sortOrder\\":4,\\"id\\":\\"qw8l3opf\\"},{\\"kind\\":\\"related_events\\",\\"title\\":\\"Пов'язані події\\",\\"visible\\":true,\\"sortOrder\\":5,\\"bgColor\\":\\"#3d0820\\",\\"id\\":\\"olgx5s4f\\"},{\\"kind\\":\\"related_restaurants\\",\\"title\\":\\"Ресторани поруч\\",\\"visible\\":true,\\"sortOrder\\":6,\\"bgColor\\":\\"#2a1200\\",\\"id\\":\\"y22lj55v\\"},{\\"kind\\":\\"related_hotels\\",\\"title\\":\\"Готелі поруч\\",\\"visible\\":true,\\"sortOrder\\":7,\\"bgColor\\":\\"#062820\\",\\"id\\":\\"1b2hal2t\\"}]"	2026-06-02 07:19:32.305+00
district-district-kdh3d5fc-yfa78a9i	district	district-kdh3d5fc	"[{\\"kind\\":\\"description\\",\\"title\\":\\"Про район\\",\\"visible\\":true,\\"sortOrder\\":1,\\"id\\":\\"8tm36e3s\\"},{\\"kind\\":\\"cities_list\\",\\"title\\":\\"Міста\\",\\"visible\\":true,\\"sortOrder\\":2,\\"bgColor\\":\\"#ffdfc6\\",\\"id\\":\\"4klkqyq2\\"},{\\"kind\\":\\"places_attraction\\",\\"title\\":\\"Туристичні об'єкти\\",\\"visible\\":true,\\"sortOrder\\":3,\\"bgColor\\":\\"#001a3d\\",\\"id\\":\\"b3tfonex\\"},{\\"kind\\":\\"places_event\\",\\"title\\":\\"Події\\",\\"visible\\":true,\\"sortOrder\\":4,\\"bgColor\\":\\"#3d0820\\",\\"id\\":\\"y9rxofkt\\"},{\\"kind\\":\\"places_restaurant\\",\\"title\\":\\"Ресторани\\",\\"visible\\":true,\\"sortOrder\\":5,\\"bgColor\\":\\"#2a1200\\",\\"id\\":\\"76xx9low\\"},{\\"kind\\":\\"places_hotel\\",\\"title\\":\\"Готелі\\",\\"visible\\":true,\\"sortOrder\\":6,\\"bgColor\\":\\"#062820\\",\\"id\\":\\"g31t3lf3\\"}]"	2026-06-02 07:29:29.066+00
district-district-c6ididsh-2d2hdd3n	district	district-c6ididsh	"[{\\"kind\\":\\"description\\",\\"title\\":\\"Про район\\",\\"visible\\":true,\\"sortOrder\\":1,\\"id\\":\\"x07e835i\\"},{\\"kind\\":\\"cities_list\\",\\"title\\":\\"Міста\\",\\"visible\\":true,\\"sortOrder\\":2,\\"bgColor\\":\\"#ffdfc6\\",\\"id\\":\\"zkovqzpd\\"},{\\"kind\\":\\"places_attraction\\",\\"title\\":\\"Туристичні об'єкти\\",\\"visible\\":true,\\"sortOrder\\":3,\\"bgColor\\":\\"#001a3d\\",\\"id\\":\\"1ahtyhm0\\"},{\\"kind\\":\\"places_event\\",\\"title\\":\\"Події\\",\\"visible\\":true,\\"sortOrder\\":4,\\"bgColor\\":\\"#3d0820\\",\\"id\\":\\"8bf9kohl\\"},{\\"kind\\":\\"places_restaurant\\",\\"title\\":\\"Ресторани\\",\\"visible\\":true,\\"sortOrder\\":5,\\"bgColor\\":\\"#2a1200\\",\\"id\\":\\"7aud8uny\\"},{\\"kind\\":\\"places_hotel\\",\\"title\\":\\"Готелі\\",\\"visible\\":true,\\"sortOrder\\":6,\\"bgColor\\":\\"#062820\\",\\"id\\":\\"hbk8kuhe\\"}]"	2026-06-02 08:53:09.687+00
event-default-zseogpn0	event	default	"[{\\"kind\\":\\"description\\",\\"title\\":\\"Про подію\\",\\"visible\\":true,\\"sortOrder\\":1,\\"id\\":\\"0erseb2g\\"},{\\"kind\\":\\"event_dates\\",\\"title\\":\\"Дати та деталі\\",\\"visible\\":true,\\"sortOrder\\":2,\\"id\\":\\"7em751qe\\"},{\\"kind\\":\\"contact_info\\",\\"title\\":\\"Контакти\\",\\"visible\\":true,\\"sortOrder\\":3,\\"id\\":\\"8ir8zlfe\\"},{\\"kind\\":\\"map\\",\\"title\\":\\"Місце проведення\\",\\"visible\\":true,\\"sortOrder\\":4,\\"id\\":\\"xwm36nts\\"},{\\"kind\\":\\"ticket_info\\",\\"title\\":\\"Квитки\\",\\"visible\\":true,\\"sortOrder\\":5,\\"id\\":\\"v6g5hlje\\"},{\\"kind\\":\\"gallery\\",\\"title\\":\\"Галерея\\",\\"visible\\":true,\\"sortOrder\\":6,\\"id\\":\\"buyqx3md\\"},{\\"kind\\":\\"related_attractions\\",\\"title\\":\\"Пам'ятки поруч\\",\\"visible\\":true,\\"sortOrder\\":7,\\"bgColor\\":\\"#001a3d\\",\\"id\\":\\"2wyk96tj\\"}]"	2026-06-02 08:53:32.792+00
restaurant-default-tg9s6iau	restaurant	default	"[{\\"kind\\":\\"description\\",\\"title\\":\\"Про заклад\\",\\"visible\\":true,\\"sortOrder\\":1,\\"id\\":\\"55ybn43i\\"},{\\"kind\\":\\"contact_info\\",\\"title\\":\\"Контакти\\",\\"visible\\":true,\\"sortOrder\\":2,\\"id\\":\\"kajcv8on\\"},{\\"kind\\":\\"hours\\",\\"title\\":\\"Години роботи\\",\\"visible\\":true,\\"sortOrder\\":3,\\"id\\":\\"j3cbdobs\\"},{\\"kind\\":\\"amenities\\",\\"title\\":\\"Зручності\\",\\"visible\\":true,\\"sortOrder\\":4,\\"id\\":\\"1u4mfwyb\\"},{\\"kind\\":\\"menu_link\\",\\"title\\":\\"Меню\\",\\"visible\\":true,\\"sortOrder\\":5,\\"id\\":\\"b1n9no1n\\"},{\\"kind\\":\\"map\\",\\"title\\":\\"Карта\\",\\"visible\\":true,\\"sortOrder\\":6,\\"id\\":\\"444gcs4f\\"},{\\"kind\\":\\"gallery\\",\\"title\\":\\"Галерея\\",\\"visible\\":true,\\"sortOrder\\":7,\\"id\\":\\"rq33g8ar\\"},{\\"kind\\":\\"related_hotels\\",\\"title\\":\\"Готелі поруч\\",\\"visible\\":false,\\"sortOrder\\":8,\\"bgColor\\":\\"#062820\\",\\"id\\":\\"ymp49td2\\"}]"	2026-06-02 08:53:33.216+00
hotel-default-s8q6wylv	hotel	default	"[{\\"kind\\":\\"description\\",\\"title\\":\\"Про готель\\",\\"visible\\":true,\\"sortOrder\\":1,\\"id\\":\\"4ck9sq9l\\"},{\\"kind\\":\\"contact_info\\",\\"title\\":\\"Контакти\\",\\"visible\\":true,\\"sortOrder\\":2,\\"id\\":\\"wt6qbatv\\"},{\\"kind\\":\\"amenities\\",\\"title\\":\\"Зручності та послуги\\",\\"visible\\":true,\\"sortOrder\\":3,\\"id\\":\\"2oirzbsg\\"},{\\"kind\\":\\"map\\",\\"title\\":\\"Карта\\",\\"visible\\":true,\\"sortOrder\\":4,\\"id\\":\\"ckik1c4n\\"},{\\"kind\\":\\"gallery\\",\\"title\\":\\"Галерея\\",\\"visible\\":true,\\"sortOrder\\":5,\\"id\\":\\"quv7381u\\"},{\\"kind\\":\\"related_attractions\\",\\"title\\":\\"Пам'ятки поруч\\",\\"visible\\":true,\\"sortOrder\\":6,\\"bgColor\\":\\"#001a3d\\",\\"id\\":\\"bbiu6avp\\"},{\\"kind\\":\\"related_restaurants\\",\\"title\\":\\"Ресторани поруч\\",\\"visible\\":true,\\"sortOrder\\":7,\\"bgColor\\":\\"#2a1200\\",\\"id\\":\\"lz31hopm\\"},{\\"kind\\":\\"related_events\\",\\"title\\":\\"Найближчі події\\",\\"visible\\":false,\\"sortOrder\\":8,\\"bgColor\\":\\"#3d0820\\",\\"id\\":\\"m8crb7lq\\"}]"	2026-06-02 08:53:33.758+00
city-default-01to1tjm	city	default	"[{\\"kind\\":\\"places_attraction\\",\\"title\\":\\"Туристичні об'єкти\\",\\"visible\\":true,\\"sortOrder\\":2,\\"bgColor\\":\\"#001a3d\\",\\"id\\":\\"jvhsclr8\\"},{\\"kind\\":\\"places_event\\",\\"title\\":\\"Події\\",\\"visible\\":true,\\"sortOrder\\":3,\\"bgColor\\":\\"#3d0820\\",\\"id\\":\\"p6uu887r\\"},{\\"kind\\":\\"places_restaurant\\",\\"title\\":\\"Ресторани\\",\\"visible\\":true,\\"sortOrder\\":4,\\"bgColor\\":\\"#2a1200\\",\\"id\\":\\"00w45fwr\\"},{\\"kind\\":\\"places_hotel\\",\\"title\\":\\"Готелі\\",\\"visible\\":true,\\"sortOrder\\":5,\\"bgColor\\":\\"#062820\\",\\"id\\":\\"qaze55fz\\"},{\\"id\\":\\"8us62osc\\",\\"kind\\":\\"description\\",\\"title\\":\\"Міста\\",\\"visible\\":true,\\"sortOrder\\":6}]"	2026-06-02 13:45:48.05+00
\.


--
-- Data for Name: regions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.regions (id, name, slug, created_at) FROM stdin;
region-odesa	Одеська область	odeska-oblast	2026-04-28 13:20:43.103412+00
\.


--
-- Data for Name: tourism_objects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tourism_objects (id, district_id, city_id, type, name, slug, published, created_at, subtitle, description, detailed_info, image_url, video_url, map_url, address, phone, website, event_dates, hours, amenities, tourism_types, reel_url) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-04-28 07:37:29
20211116045059	2026-04-28 07:37:29
20211116050929	2026-04-28 07:37:29
20211116051442	2026-04-28 07:37:29
20211116212300	2026-04-28 07:37:29
20211116213355	2026-04-28 07:37:29
20211116213934	2026-04-28 07:37:29
20211116214523	2026-04-28 07:37:29
20211122062447	2026-04-28 07:37:29
20211124070109	2026-04-28 07:37:29
20211202204204	2026-04-28 07:37:29
20211202204605	2026-04-28 07:37:30
20211210212804	2026-04-28 07:37:30
20211228014915	2026-04-28 07:37:30
20220107221237	2026-04-28 07:37:30
20220228202821	2026-04-28 07:37:30
20220312004840	2026-04-28 07:37:30
20220603231003	2026-04-28 07:37:30
20220603232444	2026-04-28 07:37:30
20220615214548	2026-04-28 07:37:30
20220712093339	2026-04-28 07:37:30
20220908172859	2026-04-28 07:37:30
20220916233421	2026-04-28 07:37:30
20230119133233	2026-04-28 07:37:30
20230128025114	2026-04-28 07:37:30
20230128025212	2026-04-28 07:37:30
20230227211149	2026-04-28 07:37:30
20230228184745	2026-04-28 07:37:30
20230308225145	2026-04-28 07:37:30
20230328144023	2026-04-28 07:37:30
20231018144023	2026-04-28 07:37:30
20231204144023	2026-04-28 07:37:30
20231204144024	2026-04-28 07:37:30
20231204144025	2026-04-28 07:37:30
20240108234812	2026-04-28 07:37:30
20240109165339	2026-04-28 07:37:30
20240227174441	2026-04-28 07:37:30
20240311171622	2026-04-28 07:37:30
20240321100241	2026-04-28 07:37:30
20240401105812	2026-04-28 07:37:30
20240418121054	2026-04-28 07:37:30
20240523004032	2026-04-28 07:37:31
20240618124746	2026-04-28 07:37:31
20240801235015	2026-04-28 07:37:31
20240805133720	2026-04-28 07:37:31
20240827160934	2026-04-28 07:37:31
20240919163303	2026-04-28 07:37:31
20240919163305	2026-04-28 07:37:31
20241019105805	2026-04-28 07:37:31
20241030150047	2026-04-28 07:37:31
20241108114728	2026-04-28 07:37:31
20241121104152	2026-04-28 07:37:31
20241130184212	2026-04-28 07:37:31
20241220035512	2026-04-28 07:37:31
20241220123912	2026-04-28 07:37:31
20241224161212	2026-04-28 07:37:31
20250107150512	2026-04-28 07:37:31
20250110162412	2026-04-28 07:37:31
20250123174212	2026-04-28 07:37:31
20250128220012	2026-04-28 07:37:31
20250506224012	2026-04-28 07:37:31
20250523164012	2026-04-28 07:37:31
20250714121412	2026-04-28 07:37:31
20250905041441	2026-04-28 07:37:31
20251103001201	2026-04-28 07:37:31
20251120212548	2026-04-28 07:37:31
20251120215549	2026-04-28 07:37:31
20260218120000	2026-04-28 07:37:31
20260326120000	2026-04-28 07:37:31
20260514120000	2026-06-03 07:21:19
20260527120000	2026-06-03 07:21:19
20260528120000	2026-06-03 07:21:19
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
media	media	\N	2026-06-02 07:19:20.553986+00	2026-06-02 07:19:20.553986+00	t	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-04-28 07:37:42.498063
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-04-28 07:37:42.54026
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-04-28 07:37:42.544781
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-04-28 07:37:42.56869
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-04-28 07:37:42.582401
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-04-28 07:37:42.585853
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-04-28 07:37:42.59182
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-04-28 07:37:42.596781
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-04-28 07:37:42.600547
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-04-28 07:37:42.604749
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-04-28 07:37:42.60848
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-04-28 07:37:42.613244
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-04-28 07:37:42.617725
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-04-28 07:37:42.62135
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-04-28 07:37:42.625217
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-04-28 07:37:42.665051
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-04-28 07:37:42.670512
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-04-28 07:37:42.674334
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-04-28 07:37:42.679735
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-04-28 07:37:42.686278
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-04-28 07:37:42.690146
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-04-28 07:37:42.697203
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-04-28 07:37:42.712823
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-04-28 07:37:42.721532
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-04-28 07:37:42.726422
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-04-28 07:37:42.730129
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-04-28 07:37:42.734292
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-04-28 07:37:42.737764
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-04-28 07:37:42.741026
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-04-28 07:37:42.744462
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-04-28 07:37:42.748306
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-04-28 07:37:42.751658
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-04-28 07:37:42.754818
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-04-28 07:37:42.758273
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-04-28 07:37:42.761469
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-04-28 07:37:42.764631
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-04-28 07:37:42.767925
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-04-28 07:37:42.771154
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-04-28 07:37:42.775468
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-04-28 07:37:42.786015
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-04-28 07:37:42.789225
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-04-28 07:37:42.792674
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-04-28 07:37:42.795924
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-04-28 07:37:42.799217
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-04-28 07:37:42.802561
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-04-28 07:37:42.806459
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-04-28 07:37:42.822891
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-04-28 07:37:42.829754
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-04-28 07:37:42.833636
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-04-28 07:37:42.851505
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-04-28 07:37:42.856469
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-04-28 07:37:43.769863
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-04-28 07:37:43.774909
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-04-28 07:37:43.791156
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-04-28 07:37:43.793574
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-04-28 07:37:43.795462
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-04-28 07:37:43.809015
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-04-28 07:37:43.812816
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-04-28 07:37:43.801311
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-05-15 08:04:03.058338
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-05-15 08:04:03.127127
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
937dfe50-60d9-4162-a3ef-4ba3db7a6afa	media	1780385285286-j7d2dkfy8ef.png	680a5fb9-0174-483e-ad71-c22da88d5b60	2026-06-02 07:28:07.503372+00	2026-06-02 07:28:07.503372+00	2026-06-02 07:28:07.503372+00	{"eTag": "\\"15ae82777f31df1e27169b89f857ade0\\"", "size": 2888492, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T07:28:08.000Z", "contentLength": 2888492, "httpStatusCode": 200}	9647f620-2d53-4c90-baa7-7b545cb9268d	680a5fb9-0174-483e-ad71-c22da88d5b60	{}
feb7e34f-4209-42ab-9ca9-2bec3c478461	media	1780386656833-v4byot5lrur.png	\N	2026-06-02 07:50:58.148978+00	2026-06-02 07:50:58.148978+00	2026-06-02 07:50:58.148978+00	{"eTag": "\\"15ae82777f31df1e27169b89f857ade0\\"", "size": 2888492, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T07:50:59.000Z", "contentLength": 2888492, "httpStatusCode": 200}	ed83aebf-86bd-47c2-930b-e974acbb15b1	\N	{}
c1142309-3ab7-4c0a-a491-63c7b233bade	media	1780387299909-xyfts4zyf4i.png	\N	2026-06-02 08:01:41.451805+00	2026-06-02 08:01:41.451805+00	2026-06-02 08:01:41.451805+00	{"eTag": "\\"15ae82777f31df1e27169b89f857ade0\\"", "size": 2888492, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T08:01:42.000Z", "contentLength": 2888492, "httpStatusCode": 200}	b98d9c82-1b11-485e-9437-96827eaca6ed	\N	{}
7d39c272-8aab-4d7c-92eb-e80171a93ccf	media	1780388673274-z07a9vrwjci.mp4	\N	2026-06-02 08:24:37.11321+00	2026-06-02 08:24:37.11321+00	2026-06-02 08:24:37.11321+00	{"eTag": "\\"9f6ce990f43ce2abc386af1a2814d13d-4\\"", "size": 19852418, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T08:24:37.000Z", "contentLength": 19852418, "httpStatusCode": 200}	91979afa-667a-44dc-ad01-ad6f3926e565	\N	{}
e9ba786a-4ec8-4700-b1c2-313c05229ad3	media	1780390215526-0kqh1hc2mxja.jpeg	\N	2026-06-02 08:50:16.36191+00	2026-06-02 08:50:16.36191+00	2026-06-02 08:50:16.36191+00	{"eTag": "\\"b6221acdd38981c47a7cc47aeceb8405\\"", "size": 321580, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T08:50:17.000Z", "contentLength": 321580, "httpStatusCode": 200}	faeef092-ef0c-4b2c-a213-c917a5797ed0	\N	{}
7744462e-d722-461f-81b4-0fc5a0a36cca	media	1780400130129-t3r4u65zqn.png	\N	2026-06-02 11:35:30.407519+00	2026-06-02 11:35:30.407519+00	2026-06-02 11:35:30.407519+00	{"eTag": "\\"66d14aa134d09aef03e05196f91203e6\\"", "size": 2000449, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T11:35:31.000Z", "contentLength": 2000449, "httpStatusCode": 200}	06ae37f9-e838-4408-b6da-651f2d2d5ebc	\N	{}
1754252c-c669-4f39-bbaa-e2f90cbf7b7c	media	1780400212808-ouu64zg4j4p.png	\N	2026-06-02 11:36:53.154468+00	2026-06-02 11:36:53.154468+00	2026-06-02 11:36:53.154468+00	{"eTag": "\\"0f24af3aeaaf5e3e5dcde4c3a2513dcb\\"", "size": 2806936, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T11:36:54.000Z", "contentLength": 2806936, "httpStatusCode": 200}	31a649a3-a88a-4197-8cb6-778b64ac48eb	\N	{}
2df6e55c-3a4f-430e-8177-3627000b10a0	media	1780400347931-05gtap9vaker.png	\N	2026-06-02 11:39:08.832608+00	2026-06-02 11:39:08.832608+00	2026-06-02 11:39:08.832608+00	{"eTag": "\\"0f24af3aeaaf5e3e5dcde4c3a2513dcb\\"", "size": 2806936, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T11:39:09.000Z", "contentLength": 2806936, "httpStatusCode": 200}	744fbc74-6798-40e0-91dc-bf859b5a72cf	\N	{}
aa462260-ed7c-41f2-8ae5-e143d669f7f9	media	1780400685676-vi9wq4x3uij.png	\N	2026-06-02 11:44:45.998492+00	2026-06-02 11:44:45.998492+00	2026-06-02 11:44:45.998492+00	{"eTag": "\\"0f24af3aeaaf5e3e5dcde4c3a2513dcb\\"", "size": 2806936, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T11:44:46.000Z", "contentLength": 2806936, "httpStatusCode": 200}	883de866-fe3d-4cbd-a5db-41f0461c7e78	\N	{}
b1fdeba8-da34-4656-ab70-ad06a37b942c	media	1780401411712-hy0soiyv8t8.png	\N	2026-06-02 11:56:53.774772+00	2026-06-02 11:56:53.774772+00	2026-06-02 11:56:53.774772+00	{"eTag": "\\"0f24af3aeaaf5e3e5dcde4c3a2513dcb\\"", "size": 2806936, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T11:56:54.000Z", "contentLength": 2806936, "httpStatusCode": 200}	ce509472-3c4d-498e-b1a5-384b662a773d	\N	{}
98ca1f07-1b40-4f73-8103-552bbdd6e8cb	media	1780401583749-a6x0oe8wlyb.png	\N	2026-06-02 11:59:50.340128+00	2026-06-02 11:59:50.340128+00	2026-06-02 11:59:50.340128+00	{"eTag": "\\"81f8e9ebf08ba5d828f24a92d35081a0\\"", "size": 2261592, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T11:59:51.000Z", "contentLength": 2261592, "httpStatusCode": 200}	5da22577-b994-4b09-b343-07f0e560531f	\N	{}
c056df37-7727-44b0-a8a8-bc709869c273	media	1780401679505-nm3n4674yl.png	\N	2026-06-02 12:01:20.444583+00	2026-06-02 12:01:20.444583+00	2026-06-02 12:01:20.444583+00	{"eTag": "\\"44d5a99c70d766dd01af856aed2ba0a5\\"", "size": 2432165, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T12:01:21.000Z", "contentLength": 2432165, "httpStatusCode": 200}	846d00d8-c04a-4c51-be7d-cb7728e53d23	\N	{}
25d64df8-ef31-4192-8033-60775a593615	media	1780401741532-3ic4253e3ho.png	\N	2026-06-02 12:02:22.575125+00	2026-06-02 12:02:22.575125+00	2026-06-02 12:02:22.575125+00	{"eTag": "\\"47394be178a51a7fdefbcda268f92f66\\"", "size": 2472502, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T12:02:23.000Z", "contentLength": 2472502, "httpStatusCode": 200}	720fe956-b0ef-42df-8902-86a0b9a0db9d	\N	{}
062f5b03-8f30-432e-8fd1-1d714acf142a	media	1780401841038-zawqt7rid7e.png	\N	2026-06-02 12:04:01.43723+00	2026-06-02 12:04:01.43723+00	2026-06-02 12:04:01.43723+00	{"eTag": "\\"aa096785b2791a01e3f6ed4c70bba352\\"", "size": 2372341, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T12:04:02.000Z", "contentLength": 2372341, "httpStatusCode": 200}	7fbdc1ec-9586-47f2-86b7-ab30b599185b	\N	{}
e7ca23e8-a3f5-4463-ab79-9497c1bfe13c	media	tourism-types/1780405345653.png	680a5fb9-0174-483e-ad71-c22da88d5b60	2026-06-02 13:02:27.811574+00	2026-06-02 13:02:27.811574+00	2026-06-02 13:02:27.811574+00	{"eTag": "\\"48a46171b01ccc74240fe40a371de167\\"", "size": 2217803, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T13:02:28.000Z", "contentLength": 2217803, "httpStatusCode": 200}	3e6294eb-2df6-4f6a-82a4-f23dbee5d734	680a5fb9-0174-483e-ad71-c22da88d5b60	{}
8a4d37a5-6dfc-490d-9e4e-3335366f9cb4	media	tourism-types/1780405349569.jpg	680a5fb9-0174-483e-ad71-c22da88d5b60	2026-06-02 13:02:30.202638+00	2026-06-02 13:02:30.202638+00	2026-06-02 13:02:30.202638+00	{"eTag": "\\"cd031bf4d204c4b13695b18b8ad8926d\\"", "size": 326990, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T13:02:31.000Z", "contentLength": 326990, "httpStatusCode": 200}	3f252123-5e37-4555-8fa5-7e2cf7159a08	680a5fb9-0174-483e-ad71-c22da88d5b60	{}
24508d3a-f3ed-4793-bbc6-c0cdddc1c8da	media	tourism-types/1780405353036.png	680a5fb9-0174-483e-ad71-c22da88d5b60	2026-06-02 13:02:35.706557+00	2026-06-02 13:02:35.706557+00	2026-06-02 13:02:35.706557+00	{"eTag": "\\"0c3259a67a5a7c1f3895411c0193f520\\"", "size": 2121468, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T13:02:36.000Z", "contentLength": 2121468, "httpStatusCode": 200}	cb146790-b067-4c53-96c6-862251a7c6bf	680a5fb9-0174-483e-ad71-c22da88d5b60	{}
3ca143dd-12c6-4561-aa88-b3adbf475588	media	tourism-types/1780405363765.jpg	680a5fb9-0174-483e-ad71-c22da88d5b60	2026-06-02 13:02:44.900718+00	2026-06-02 13:02:44.900718+00	2026-06-02 13:02:44.900718+00	{"eTag": "\\"f556b5eb4315673f66c814f3605aaff8\\"", "size": 244588, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T13:02:45.000Z", "contentLength": 244588, "httpStatusCode": 200}	2943199b-e58c-4462-8a25-0c08e6d0eebc	680a5fb9-0174-483e-ad71-c22da88d5b60	{}
1255b8da-962e-4c14-ada8-19b757868b1c	media	tourism-types/1780405360582.png	680a5fb9-0174-483e-ad71-c22da88d5b60	2026-06-02 13:02:45.493362+00	2026-06-02 13:02:45.493362+00	2026-06-02 13:02:45.493362+00	{"eTag": "\\"958b76bdb1c065cd7a80293ccb3f2644\\"", "size": 2234619, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T13:02:46.000Z", "contentLength": 2234619, "httpStatusCode": 200}	07f48490-f9b6-461a-ae50-04e770f289e9	680a5fb9-0174-483e-ad71-c22da88d5b60	{}
8eb2188a-a5f1-40cc-b70b-a5bbc3f81b65	media	tourism-types/1780405357803.png	680a5fb9-0174-483e-ad71-c22da88d5b60	2026-06-02 13:02:46.009459+00	2026-06-02 13:02:46.009459+00	2026-06-02 13:02:46.009459+00	{"eTag": "\\"3ff3a3ab93ca6f944fa5c39892da8783\\"", "size": 2244899, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T13:02:46.000Z", "contentLength": 2244899, "httpStatusCode": 200}	583beb46-3ba3-4d08-8482-b8083e732ab7	680a5fb9-0174-483e-ad71-c22da88d5b60	{}
78ee0ef6-49d0-4afc-b0c9-e834b19c25c1	media	tourism-types/1780405355665.png	680a5fb9-0174-483e-ad71-c22da88d5b60	2026-06-02 13:02:46.088461+00	2026-06-02 13:02:46.088461+00	2026-06-02 13:02:46.088461+00	{"eTag": "\\"b97ba64c3c7c8e2f34758c2d665be0c6\\"", "size": 2356040, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T13:02:47.000Z", "contentLength": 2356040, "httpStatusCode": 200}	ba5336de-afff-47ee-87a7-763ae3b24a9c	680a5fb9-0174-483e-ad71-c22da88d5b60	{}
70c6fb0f-e59c-4509-87e7-4d0bd95e4fee	media	tourism-types/1780405399490.png	680a5fb9-0174-483e-ad71-c22da88d5b60	2026-06-02 13:03:21.462137+00	2026-06-02 13:03:21.462137+00	2026-06-02 13:03:21.462137+00	{"eTag": "\\"f85e2d45b1b2b122a9430d68dc698c50\\"", "size": 2714444, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T13:03:22.000Z", "contentLength": 2714444, "httpStatusCode": 200}	303b22a8-5271-487e-bd58-ff629ff163b7	680a5fb9-0174-483e-ad71-c22da88d5b60	{}
180d8aa1-7aad-4528-b8ff-dd1e56447194	media	1780408501483-cp4ntb6cqpq.webp	\N	2026-06-02 13:55:01.023382+00	2026-06-02 13:55:01.023382+00	2026-06-02 13:55:01.023382+00	{"eTag": "\\"3a7b25981ad9d983a8d5bf541a28d518\\"", "size": 43252, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T13:55:01.000Z", "contentLength": 43252, "httpStatusCode": 200}	8f7e8593-1242-4fd5-8fce-99ddae0d51be	\N	{}
bb1147d5-2c9e-4491-af1b-a31a50148bac	media	1780408551527-7r440dwh3es.mp4	\N	2026-06-02 13:55:59.850076+00	2026-06-02 13:55:59.850076+00	2026-06-02 13:55:59.850076+00	{"eTag": "\\"273854be5332cad0fa541b6b5110380c-6\\"", "size": 27834924, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T13:56:00.000Z", "contentLength": 27834924, "httpStatusCode": 200}	84dd5765-8e31-48af-849e-4209c70460d7	\N	{}
50114146-a68f-49a4-82aa-e9152642bc0a	media	1780409688674-4yxdlmbty9o.jpg	\N	2026-06-02 14:14:48.181927+00	2026-06-02 14:14:48.181927+00	2026-06-02 14:14:48.181927+00	{"eTag": "\\"f6acf8a122593a52344a6162befb49ac\\"", "size": 356912, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T14:14:49.000Z", "contentLength": 356912, "httpStatusCode": 200}	0930bdd6-9650-410e-a57d-945193a93627	\N	{}
c4602726-d392-4dd6-8090-119d346a8d84	media	1780410001483-102rz8infnsr.mp4	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-02 14:20:08.656497+00	2026-06-02 14:20:08.656497+00	2026-06-02 14:20:08.656497+00	{"eTag": "\\"273854be5332cad0fa541b6b5110380c-6\\"", "size": 27834924, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T14:20:08.000Z", "contentLength": 27834924, "httpStatusCode": 200}	5ed9b5da-835c-4b58-b990-ca4ac6450cab	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
328a17d5-0f7b-4fba-bc12-a2444564c9c7	media	1780410034294-9wt9szcfqj6.webp	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-02 14:20:33.63091+00	2026-06-02 14:20:33.63091+00	2026-06-02 14:20:33.63091+00	{"eTag": "\\"3a7b25981ad9d983a8d5bf541a28d518\\"", "size": 43252, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T14:20:34.000Z", "contentLength": 43252, "httpStatusCode": 200}	97919fc8-35b4-4da0-a4f8-6b7cfa90120e	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
4ba1a7cf-f29f-45ee-b8cf-bb776ed154bf	media	1780410166328-pqjh67xocs.mp4	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-02 14:22:56.766975+00	2026-06-02 14:22:56.766975+00	2026-06-02 14:22:56.766975+00	{"eTag": "\\"273854be5332cad0fa541b6b5110380c-6\\"", "size": 27834924, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-06-02T14:22:57.000Z", "contentLength": 27834924, "httpStatusCode": 200}	208311f2-c0ea-40f1-91fc-1bf27bcd7430	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
9019c3eb-79c5-4966-bdea-ec842b87d33a	media	1780467644546-exn92dygru.mp4	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 06:20:51.438429+00	2026-06-03 06:20:51.438429+00	2026-06-03 06:20:51.438429+00	{"eTag": "\\"d14ae63656277c40bc66729d48c99cc8-6\\"", "size": 28703733, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T06:20:51.000Z", "contentLength": 28703733, "httpStatusCode": 200}	dbe6dfa0-47a3-41ca-b89c-b58bc515ba3c	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
13041eb0-29db-4bd2-a177-e92c94375f20	media	1780467661780-kpg18yv11a8.mp4	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 06:21:14.93644+00	2026-06-03 06:21:14.93644+00	2026-06-03 06:21:14.93644+00	{"eTag": "\\"d14ae63656277c40bc66729d48c99cc8-6\\"", "size": 28703733, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T06:21:15.000Z", "contentLength": 28703733, "httpStatusCode": 200}	c52fec42-f549-4f01-ab9c-62cf2f7774d3	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
5891a2c0-5827-42b0-b27c-1dbc29ca4496	media	1780468066497-mr7fwxi3i3d.jpg	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 06:27:46.882503+00	2026-06-03 06:27:46.882503+00	2026-06-03 06:27:46.882503+00	{"eTag": "\\"d883b16303ec5e3418da2fe9326a545e\\"", "size": 209978, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T06:27:47.000Z", "contentLength": 209978, "httpStatusCode": 200}	4c9389ac-026f-42cc-ad32-163eb35e1e5e	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
4907d04c-fb25-4707-a38b-7ccaa01d63f3	media	1780468630232-by5a4ly52cj.jpg	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 06:37:10.675057+00	2026-06-03 06:37:10.675057+00	2026-06-03 06:37:10.675057+00	{"eTag": "\\"c6ee1c4b994952191514a7760e3a3d73\\"", "size": 85029, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T06:37:11.000Z", "contentLength": 85029, "httpStatusCode": 200}	9ab4eac2-c68c-4c08-9162-cee75cc7beb3	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
11c19dcd-b4a0-4c2c-84a1-434fa7078900	media	1780468649334-u9of4mhvtrq.jpg	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 06:37:29.616619+00	2026-06-03 06:37:29.616619+00	2026-06-03 06:37:29.616619+00	{"eTag": "\\"c6ee1c4b994952191514a7760e3a3d73\\"", "size": 85029, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T06:37:30.000Z", "contentLength": 85029, "httpStatusCode": 200}	86a17d52-d71f-4cd4-b4de-11ca85ab3017	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
549ddce1-c21c-4929-b3af-2386aa5cf5c9	media	1780468639160-r4ldmrxx11.jpg	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 06:37:19.482658+00	2026-06-03 06:37:19.482658+00	2026-06-03 06:37:19.482658+00	{"eTag": "\\"c6ee1c4b994952191514a7760e3a3d73\\"", "size": 85029, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T06:37:20.000Z", "contentLength": 85029, "httpStatusCode": 200}	748ba50b-4e3b-45d2-b554-1b495412b4ee	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
21b288f9-a6da-4786-872c-0bf359802756	media	1780469363216-j1wpp3omcrp.webp	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 06:49:23.864592+00	2026-06-03 06:49:23.864592+00	2026-06-03 06:49:23.864592+00	{"eTag": "\\"fe9263f7ff8ff7be59cf51dd58b40c24\\"", "size": 113694, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T06:49:24.000Z", "contentLength": 113694, "httpStatusCode": 200}	a4842666-e109-4ad8-bb69-20031150f622	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
353b9f3d-7f77-46ca-92cb-6c9190267b9c	media	1780469504189-u4atc2relw.PNG	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 06:51:44.666658+00	2026-06-03 06:51:44.666658+00	2026-06-03 06:51:44.666658+00	{"eTag": "\\"591694d33b7134a1c6bcb7a39c3604a7\\"", "size": 230773, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T06:51:45.000Z", "contentLength": 230773, "httpStatusCode": 200}	246e0fdb-98c6-4d1d-ae47-d5ee1fbecf94	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
eafa3517-dddf-4464-a070-b7773159a31b	media	1780469741247-sn3fr8gzob.webp	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 06:55:41.600188+00	2026-06-03 06:55:41.600188+00	2026-06-03 06:55:41.600188+00	{"eTag": "\\"c22ed6efa58e5db6f087bf170f6d6372\\"", "size": 263682, "mimetype": "image/webp", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T06:55:42.000Z", "contentLength": 263682, "httpStatusCode": 200}	4c73a950-353a-49b6-abb3-1860d78d22bd	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
e49f3d67-eec1-4976-a664-a35e941b1503	media	1780469895979-aeawyddokgl.mp4	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 06:58:44.459229+00	2026-06-03 06:58:44.459229+00	2026-06-03 06:58:44.459229+00	{"eTag": "\\"cb8d2cc0d44d6b06bf4e32df11d52411-5\\"", "size": 23920705, "mimetype": "video/mp4", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T06:58:44.000Z", "contentLength": 23920705, "httpStatusCode": 200}	2e47d94c-c692-4175-9a40-92321b5ce4a7	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
3e39e668-c74c-4215-a0a0-6a42877a225a	media	1780470019935-g5uyu13p3wh.jpg	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 07:00:20.204847+00	2026-06-03 07:00:20.204847+00	2026-06-03 07:00:20.204847+00	{"eTag": "\\"de9c04fdea7a62cea60e38c896d1b4da\\"", "size": 22480, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T07:00:21.000Z", "contentLength": 22480, "httpStatusCode": 200}	d2c6e0ce-5aa9-442e-b466-ccd5b314ff8d	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
0cecdb74-614b-4f56-9e68-5be364f9eb0a	media	1780470423847-1yc4swxday7.jpg	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 07:07:04.258136+00	2026-06-03 07:07:04.258136+00	2026-06-03 07:07:04.258136+00	{"eTag": "\\"c5666f859d1046cfaf0d221e0d175b4a\\"", "size": 556137, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T07:07:05.000Z", "contentLength": 556137, "httpStatusCode": 200}	fae6bb82-89cd-4827-9fef-a14623791b2c	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
57c6fef1-c78b-4b09-b109-808ad39a8d65	media	1780474235289-fkort9lrknt.jpg	e1c89195-f7a1-40b4-a9e2-94503008071c	2026-06-03 08:10:36.130261+00	2026-06-03 08:10:36.130261+00	2026-06-03 08:10:36.130261+00	{"eTag": "\\"122e9af1fc95d96c3082c1d403e21548\\"", "size": 380914, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-03T08:10:37.000Z", "contentLength": 380914, "httpStatusCode": 200}	2279db51-6d57-4724-ab4b-d892876eac00	e1c89195-f7a1-40b4-a9e2-94503008071c	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 51, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: admin_change_logs admin_change_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_change_logs
    ADD CONSTRAINT admin_change_logs_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: cities cities_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_slug_key UNIQUE (slug);


--
-- Name: content_cards content_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_cards
    ADD CONSTRAINT content_cards_pkey PRIMARY KEY (id);


--
-- Name: districts districts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_pkey PRIMARY KEY (id);


--
-- Name: districts districts_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_slug_key UNIQUE (slug);


--
-- Name: page_configs page_configs_entity_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_configs
    ADD CONSTRAINT page_configs_entity_unique UNIQUE (entity_type, entity_id);


--
-- Name: page_configs page_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_configs
    ADD CONSTRAINT page_configs_pkey PRIMARY KEY (id);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- Name: regions regions_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_slug_key UNIQUE (slug);


--
-- Name: tourism_objects tourism_objects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tourism_objects
    ADD CONSTRAINT tourism_objects_pkey PRIMARY KEY (id);


--
-- Name: tourism_objects tourism_objects_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tourism_objects
    ADD CONSTRAINT tourism_objects_slug_key UNIQUE (slug);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: cities cities_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id) ON DELETE CASCADE;


--
-- Name: content_cards content_cards_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_cards
    ADD CONSTRAINT content_cards_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- Name: content_cards content_cards_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_cards
    ADD CONSTRAINT content_cards_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id) ON DELETE SET NULL;


--
-- Name: content_cards content_cards_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_cards
    ADD CONSTRAINT content_cards_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE SET NULL;


--
-- Name: districts districts_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE CASCADE;


--
-- Name: tourism_objects tourism_objects_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tourism_objects
    ADD CONSTRAINT tourism_objects_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: tourism_objects tourism_objects_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tourism_objects
    ADD CONSTRAINT tourism_objects_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_change_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_change_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: cities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

--
-- Name: content_cards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_cards ENABLE ROW LEVEL SECURITY;

--
-- Name: districts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_change_logs editor full audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "editor full audit logs" ON public.admin_change_logs USING (true) WITH CHECK (true);


--
-- Name: content_cards editor full cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "editor full cards" ON public.content_cards USING (true) WITH CHECK (true);


--
-- Name: cities editor full cities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "editor full cities" ON public.cities USING (true) WITH CHECK (true);


--
-- Name: districts editor full districts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "editor full districts" ON public.districts USING (true) WITH CHECK (true);


--
-- Name: tourism_objects editor full objects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "editor full objects" ON public.tourism_objects USING (true) WITH CHECK (true);


--
-- Name: page_configs editor full page configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "editor full page configs" ON public.page_configs USING (true) WITH CHECK (true);


--
-- Name: regions editor full regions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "editor full regions" ON public.regions USING (true) WITH CHECK (true);


--
-- Name: page_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: cities public read cities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read cities" ON public.cities FOR SELECT USING (true);


--
-- Name: districts public read districts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read districts" ON public.districts FOR SELECT USING (true);


--
-- Name: page_configs public read page configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read page configs" ON public.page_configs FOR SELECT USING (true);


--
-- Name: content_cards public read published cards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read published cards" ON public.content_cards FOR SELECT USING ((published = true));


--
-- Name: tourism_objects public read published objects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read published objects" ON public.tourism_objects FOR SELECT USING ((published = true));


--
-- Name: regions public read regions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "public read regions" ON public.regions FOR SELECT USING (true);


--
-- Name: regions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

--
-- Name: tourism_objects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tourism_objects ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects anon delete media; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "anon delete media" ON storage.objects FOR DELETE USING ((bucket_id = 'media'::text));


--
-- Name: objects anon update media; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "anon update media" ON storage.objects FOR UPDATE USING ((bucket_id = 'media'::text)) WITH CHECK ((bucket_id = 'media'::text));


--
-- Name: objects anon upload media; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "anon upload media" ON storage.objects FOR INSERT WITH CHECK ((bucket_id = 'media'::text));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: objects public read media; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "public read media" ON storage.objects FOR SELECT USING ((bucket_id = 'media'::text));


--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict uZD8JaIamdw6DsTA1YYHFWc7EHcbJ5do9yxQybDXYrqCP0th1J4A3q563t14gfu

