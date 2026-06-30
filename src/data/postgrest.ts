import { env, API_URL } from "@/env";

/**
 * Minimal typed PostgREST client over `fetch` — a hand-written replacement for
 * `@supabase/supabase-js`, which the project only ever used as a query builder.
 * It implements exactly the subset the repositories use:
 *   from().select().eq().order().limit().single()/maybeSingle()
 *   from().insert()/upsert({onConflict})/update().eq()/delete().eq()
 * and emits standard PostgREST query strings, so the existing MSW tests validate
 * the request contract unchanged.
 */

export interface PostgrestError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

export interface PostgrestResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

const REST = `${API_URL}/rest/v1`;

function authHeaders(): Record<string, string> {
  return {
    apikey: env.VITE_API_ANON_KEY,
    Authorization: `Bearer ${env.VITE_API_ANON_KEY}`,
  };
}

class QueryBuilder<T = unknown> implements PromiseLike<PostgrestResult<T>> {
  private cols = "*";
  private filters: string[] = [];
  private orders: string[] = [];
  private limitN?: number;
  private rowMode: "many" | "maybe" | "one" = "many";
  private method: "GET" | "POST" | "PATCH" | "DELETE" = "GET";
  private body?: unknown;
  private prefer: string[] = [];
  private onConflict?: string;

  constructor(private readonly table: string) {}

  select(cols = "*") {
    this.cols = cols;
    return this;
  }
  eq(col: string, val: unknown) {
    this.filters.push(`${encodeURIComponent(col)}=eq.${encodeURIComponent(String(val))}`);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push(opts?.ascending === false ? `${col}.desc` : col);
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  maybeSingle() {
    this.rowMode = "maybe";
    return this;
  }
  single() {
    this.rowMode = "one";
    return this;
  }
  insert(body: unknown) {
    this.method = "POST";
    this.body = body;
    this.prefer.push("return=minimal");
    return this;
  }
  upsert(body: unknown, opts?: { onConflict?: string }) {
    this.method = "POST";
    this.body = body;
    this.prefer.push("resolution=merge-duplicates", "return=minimal");
    this.onConflict = opts?.onConflict;
    return this;
  }
  update(body: unknown) {
    this.method = "PATCH";
    this.body = body;
    this.prefer.push("return=minimal");
    return this;
  }
  delete() {
    this.method = "DELETE";
    this.prefer.push("return=minimal");
    return this;
  }

  private url(): string {
    const parts: string[] = [];
    if (this.method === "GET") parts.push(`select=${encodeURIComponent(this.cols)}`);
    parts.push(...this.filters);
    if (this.orders.length) parts.push(`order=${this.orders.join(",")}`);
    if (this.limitN != null) parts.push(`limit=${this.limitN}`);
    if (this.onConflict) parts.push(`on_conflict=${encodeURIComponent(this.onConflict)}`);
    const qs = parts.join("&");
    return `${REST}/${this.table}${qs ? `?${qs}` : ""}`;
  }

  private async exec(): Promise<PostgrestResult<T>> {
    const headers = authHeaders();
    if (this.body !== undefined) headers["Content-Type"] = "application/json";
    if (this.prefer.length) headers["Prefer"] = this.prefer.join(",");

    let res: Response;
    try {
      res = await fetch(this.url(), {
        method: this.method,
        headers,
        body: this.body !== undefined ? JSON.stringify(this.body) : undefined,
      });
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } };
    }

    if (!res.ok) {
      let error: PostgrestError = { message: `HTTP ${res.status}` };
      try {
        const j = (await res.json()) as Partial<PostgrestError>;
        error = { ...j, message: j.message ?? error.message };
      } catch {
        /* non-JSON error body */
      }
      return { data: null, error };
    }

    let json: unknown = null;
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (this.rowMode !== "many") {
      const row = Array.isArray(json) ? (json[0] ?? null) : (json ?? null);
      if (this.rowMode === "one" && row == null) {
        return { data: null, error: { code: "PGRST116", message: "No rows found" } };
      }
      return { data: row as T, error: null };
    }
    return { data: (json ?? []) as T, error: null };
  }

  then<R1 = PostgrestResult<T>, R2 = never>(
    onfulfilled?: ((v: PostgrestResult<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.exec().then(onfulfilled, onrejected);
  }
}

export interface PostgrestClient {
  from<T = unknown>(table: string): QueryBuilder<T>;
}

export function createPostgrestClient(): PostgrestClient {
  return { from: <T = unknown>(table: string) => new QueryBuilder<T>(table) };
}
