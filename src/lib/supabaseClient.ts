import { createPostgrestClient } from "@/data/postgrest";

/**
 * The data-layer client. Historically a `@supabase/supabase-js` instance; now a
 * hand-written PostgREST client (the backend is self-hosted PostgREST, not
 * Supabase cloud). The `supabase` export name is kept so repositories calling
 * `supabase.from(...)` are unchanged. `env.ts` validates configuration at load,
 * so `hasSupabaseConfig` is always true (the old offline-fallback paths are dead
 * and being removed alongside this).
 */
export const supabase = createPostgrestClient();

/** @deprecated configuration is now validated in env.ts and always present. */
export const hasSupabaseConfig = true;
