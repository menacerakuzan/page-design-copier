import { useState } from "react";
import { loginAdmin, isAdminAuthed } from "@/lib/adminAuth";

type Props = { children: React.ReactNode };

export default function AdminLoginGate({ children }: Props) {
  const [authed, setAuthed] = useState(() => isAdminAuthed());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (authed) return <>{children}</>;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginAdmin(email, password);
      setAuthed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка входу");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff2e8] px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="font-odesa-medium text-[42px] leading-none text-[#002f5e]">ОДЕЩИНА</h1>
          <p className="mt-2 text-[14px] text-[#002f5e]/70 font-odesa-regular">Адміністрування</p>
        </div>
        <form onSubmit={handleLogin} className="rounded-[28px] border border-[#002f5e]/10 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-[#002f5e]/70">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@tourism.od.gov.ua" required
                className="w-full rounded-xl border border-[#002f5e]/15 bg-[#fff2e8] px-4 py-3 text-[15px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition" />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-wide text-[#002f5e]/70">Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full rounded-xl border border-[#002f5e]/15 bg-[#fff2e8] px-4 py-3 text-[15px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition" />
            </div>
            {error && <p className="rounded-xl bg-[#9f1f47]/8 px-4 py-2.5 text-[13px] text-[#9f1f47]">{error}</p>}
            <button type="submit" disabled={busy}
              className="mt-2 flex items-center justify-center rounded-xl bg-[#002f5e] py-3 text-[15px] font-medium text-[#fff2e8] transition hover:bg-[#002f5e]/85 disabled:opacity-60">
              {busy ? "Вхід…" : "Увійти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
