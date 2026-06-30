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
  VITE_ADMIN_PASSWORD: z.string().default(""),
});

const parsed = schema.safeParse(import.meta.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration — check your .env.local (VITE_API_URL, VITE_API_ANON_KEY).");
}

export const env = parsed.data;

/** REST/storage origin, with any trailing `/rest/v1` stripped. */
export const API_URL = env.VITE_API_URL.replace(/\/rest\/v1\/?$/, "");
