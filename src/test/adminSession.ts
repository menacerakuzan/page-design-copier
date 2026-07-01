/**
 * Seed a logged-in admin session for tests. The frontend only decodes the token's
 * `exp` (PostgREST verifies the signature server-side), so a well-formed but
 * unsigned token with a far-future expiry is enough to pass the login gate.
 */
export function loginTestAdmin(): void {
  const payload = btoa(JSON.stringify({ role: "authenticated", exp: 9999999999 }));
  sessionStorage.setItem("tourism_admin_jwt", `header.${payload}.sig`);
}
