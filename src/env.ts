import { z } from "zod";

/**
 * Single, validated source of truth for runtime configuration. Parsing at module
 * load means a misconfigured deploy fails fast and loudly instead of producing
 * confusing 404s deep in the data layer.
 */
const schema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_API_ANON_KEY: z.string().min(1),
  VITE_OPENWEATHER_KEY: z.string().optional().default(""),
  VITE_ADMIN_EMAIL: z.string().default("admin@tourism.od.gov.ua"),
  // NB: no admin password here — auth is server-side (see src/lib/adminAuth.ts).
  // A VITE_-prefixed secret would be inlined into the client bundle.
});

const parsed = schema.safeParse(import.meta.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration — check your .env.local (VITE_API_URL, VITE_API_ANON_KEY).");
}

export const env = parsed.data;

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
