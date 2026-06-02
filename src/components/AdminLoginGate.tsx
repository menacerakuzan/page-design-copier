import { useEffect, useState } from "react";
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

type Props = { children: React.ReactNode };

export default function AdminLoginGate({ children }: Props) {
  const [session, setSession] = useState<Session | null | "loading">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) { setSession(null); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // local mode — пропускаємо авторизацію
  if (!hasSupabaseConfig) return <>{children}</>;
  if (session === "loading") return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff2e8]">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#002f5e] border-t-transparent" />
    </div>
  );
  if (session) return <>{children}</>;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: err } = await supabase!.auth.signInWithPassword({ email, password });
    if (err) setError("Невірний email або пароль");
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff2e8] px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="font-odesa-medium text-[42px] leading-none text-[#002f5e]">ОДЕЩИНА</h1>
          <p className="mt-2 text-[14px] text-[#002f5e]/45 font-odesa-regular">Адміністрування</p>
        </div>
        <form onSubmit={handleLogin} className="rounded-[28px] border border-[#002f5e]/10 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-[#002f5e]/50">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full rounded-xl border border-[#002f5e]/15 bg-[#fff2e8] px-4 py-3 text-[15px] text-[#002f5e] placeholder:text-[#002f5e]/30 focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-[#002f5e]/50">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-[#002f5e]/15 bg-[#fff2e8] px-4 py-3 text-[15px] text-[#002f5e] placeholder:text-[#002f5e]/30 focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition"
              />
            </div>
            {error && (
              <p className="rounded-xl bg-[#9f1f47]/8 px-4 py-2.5 text-[13px] text-[#9f1f47]">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#002f5e] py-3 text-[15px] font-medium text-[#fff2e8] transition hover:bg-[#002f5e]/85 disabled:opacity-60"
            >
              {submitting
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : "Увійти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
