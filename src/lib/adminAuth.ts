import { API_URL, env } from "@/env";

/**
 * Admin session = a short-lived JWT minted server-side by the `login` RPC after a
 * bcrypt password check in the DB. The token carries `role: authenticated`, which
 * is the ONLY role PostgREST lets write (anon is read-only). No password lives in
 * the frontend bundle anymore — the login form just posts to the RPC.
 */
const TOKEN_KEY = "tourism_admin_jwt";
const REST = `${API_URL}/rest/v1`;

function decodeExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = JSON.parse(json).exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

/** The current admin JWT, or null if absent/expired (expired tokens are cleared). */
export function getAdminToken(): string | null {
  try {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const exp = decodeExp(token);
    if (exp !== null && exp * 1000 <= Date.now()) {
      sessionStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function isAdminAuthed(): boolean {
  return getAdminToken() !== null;
}

export function adminLogout(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Exchange credentials for a JWT via POST /rest/v1/rpc/login. Throws on failure. */
export async function loginAdmin(email: string, password: string): Promise<void> {
  const res = await fetch(`${REST}/rpc/login`, {
    method: "POST",
    headers: {
      apikey: env.VITE_API_ANON_KEY,
      Authorization: `Bearer ${env.VITE_API_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let message = "Невірний email або пароль";
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }

  // The RPC returns the token as a JSON string.
  const token = await res.json();
  if (typeof token !== "string" || !token) throw new Error("Невірна відповідь сервера");
  sessionStorage.setItem(TOKEN_KEY, token);
}
