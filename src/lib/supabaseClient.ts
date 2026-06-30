import { createPostgrestClient } from "@/data/postgrest";

/**
 * The data-layer client. Historically a `@supabase/supabase-js` instance; now a
 * hand-written PostgREST client (the backend is self-hosted PostgREST, not
 * Supabase cloud). The `supabase` export name is kept so repositories calling
 * `supabase.from(...)` are unchanged. `env.ts` validates configuration at load.
 */
export const supabase = createPostgrestClient();
