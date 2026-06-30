import { createPostgrestClient } from "@/data/postgrest";

/**
 * The data-layer client — a hand-written PostgREST client over the self-hosted
 * API (configuration validated in env.ts at load). Repositories import `db` and
 * call `db.from(table)...`.
 */
export const db = createPostgrestClient();
