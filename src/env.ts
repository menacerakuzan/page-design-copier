/**
 * Single, validated source of truth for runtime configuration. Parsing at module
 * load means a misconfigured deploy fails fast and loudly instead of producing
 * confusing 404s deep in the data layer.
 * (Перевірка вручну, без zod — щоб не тягнути ~50 КБ бібліотеки в головний бандл.)
 */
// NB: no admin password here — auth is server-side (see src/lib/adminAuth.ts).
// A VITE_-prefixed secret would be inlined into the client bundle.
const raw = import.meta.env as Record<string, string | undefined>;

const isUrl = (v: string | undefined) => {
  try {
    return !!v && !!new URL(v);
  } catch {
    return false;
  }
};

const errors: Record<string, string> = {};
if (!isUrl(raw.VITE_API_URL)) errors.VITE_API_URL = "must be a valid URL";
if (!raw.VITE_API_ANON_KEY) errors.VITE_API_ANON_KEY = "required";
if (Object.keys(errors).length) {
  console.error("Invalid environment configuration:", errors);
  throw new Error("Invalid environment configuration — check your .env.local (VITE_API_URL, VITE_API_ANON_KEY).");
}

export const env = {
  VITE_API_URL: raw.VITE_API_URL as string,
  VITE_API_ANON_KEY: raw.VITE_API_ANON_KEY as string,
  VITE_OPENWEATHER_KEY: raw.VITE_OPENWEATHER_KEY ?? "",
  VITE_ADMIN_EMAIL: raw.VITE_ADMIN_EMAIL ?? "admin@tourism.od.gov.ua",
};

/**
 * REST/storage origin. Same-origin by design (see vite.config.ts proxy / prod
 * reverse proxy), so we derive it from the page's own origin at runtime rather
 * than trusting VITE_API_URL literally — that value gets baked into the bundle
 * at build time, so a hardcoded `http://localhost:8080` breaks the moment the
 * app is opened from anywhere other than that exact host (e.g. a phone over a
 * tunnel, or a different port). VITE_API_URL remains as the fallback for
 * non-browser contexts and to keep env.ts's validation meaningful.
 */
export const API_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : env.VITE_API_URL.replace(/\/rest\/v1\/?$/, "");
