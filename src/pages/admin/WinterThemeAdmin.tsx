import { useEffect, useState } from "react";
import { Copy, EyeOff, Link2, RefreshCw, Snowflake, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  loadWinterSetting, saveWinterSetting, makePreviewToken, sha256Hex,
  type WinterMode, type WinterThemeSetting,
} from "@/lib/siteSettings";

type ShowToast = (msg: string, ok?: boolean) => void;

const MODES: { id: WinterMode; title: string; desc: string; icon: React.ReactNode }[] = [
  { id: "off", title: "Вимкнено", desc: "Звичайний сайт для всіх.", icon: <EyeOff className="h-4 w-4" /> },
  { id: "preview", title: "Прихований перегляд", desc: "Бачать лише ті, хто відкрив приховане посилання, і адміністратори в цій вкладці.", icon: <Link2 className="h-4 w-4" /> },
  { id: "on", title: "Для всіх", desc: "Гірлянда, сніг, заставка й зимовий блок на головній — для всіх відвідувачів.", icon: <Users className="h-4 w-4" /> },
];

/**
 * Сайт → Зимова тема. Токен прихованого посилання показуємо лише одразу після
 * генерації: у базі зберігається тільки його SHA-256, тож «загублене» посилання
 * не відновити — треба згенерувати нове (старе при цьому перестає працювати).
 */
export default function WinterThemeAdmin({ showToast }: { showToast: ShowToast }) {
  const queryClient = useQueryClient();
  const [setting, setSetting] = useState<WinterThemeSetting | null>(null);
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadWinterSetting().then(setSetting);
  }, []);

  const persist = async (next: WinterThemeSetting, msg: string) => {
    setSaving(true);
    try {
      await saveWinterSetting(next);
      setSetting(next);
      await queryClient.invalidateQueries({ queryKey: ["site-settings", "winter"] });
      showToast(msg);
    } catch (e) {
      showToast((e as { message?: string })?.message ?? "Не вдалося зберегти. Чи застосована міграція 20261029?", false);
    } finally {
      setSaving(false);
    }
  };

  const generateLink = async () => {
    if (!setting) return;
    const token = makePreviewToken();
    const tokenHash = await sha256Hex(token);
    await persist({ ...setting, tokenHash, mode: setting.mode === "off" ? "preview" : setting.mode }, "Нове приховане посилання створено");
    setLink(`${window.location.origin}/?winter=${token}`);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      showToast("Посилання скопійовано");
    } catch {
      showToast("Скопіюйте посилання вручну", false);
    }
  };

  if (!setting) {
    return <div className="flex justify-center py-20"><span className="h-8 w-8 animate-spin rounded-full border-2 border-[#002f5e] border-t-transparent" /></div>;
  }

  return (
    <div className="max-w-[760px]">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#002f5e] text-[#fff2e8]"><Snowflake className="h-5 w-5" /></span>
        <div>
          <h2 className="text-[22px] font-semibold text-[#002f5e]">Зимова тема</h2>
          <p className="text-[13px] text-[#002f5e]/70">Новорічне оформлення: гірлянда зі шнурком-вимикачем, сніг, ялинки, Святий Миколай, заставка і «замерзле вікно» на головній.</p>
        </div>
      </div>

      <div className="grid gap-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={saving}
            onClick={() => m.id !== setting.mode && persist({ ...setting, mode: m.id }, `Режим: ${m.title}`)}
            aria-pressed={setting.mode === m.id}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
              setting.mode === m.id ? "border-[#002f5e] bg-[#002f5e] text-[#fff2e8]" : "border-[#002f5e]/15 bg-white text-[#002f5e] hover:border-[#002f5e]/40"
            }`}
          >
            <span className="mt-0.5">{m.icon}</span>
            <span>
              <span className="block text-[15px] font-medium">{m.title}</span>
              <span className={`block text-[13px] ${setting.mode === m.id ? "text-[#fff2e8]/75" : "text-[#002f5e]/65"}`}>{m.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[#002f5e]/15 bg-white p-4">
        <p className="text-[13px] font-medium uppercase tracking-wide text-[#002f5e]/70">Приховане посилання</p>
        <p className="mt-1 text-[13px] text-[#002f5e]/70">
          {setting.tokenHash
            ? "Посилання вже існує. Його не видно повторно — якщо загубили, згенеруйте нове (старе перестане працювати)."
            : "Посилання ще не створено."}{" "}
          Хто відкрив посилання, бачить тему, доки режим не «Вимкнено». Вийти з перегляду: додати до адреси <code>?winter=off</code>.
        </p>
        {link && (
          <div className="mt-3 flex items-center gap-2">
            <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-xl border border-[#002f5e]/15 bg-[#002f5e]/5 px-3 py-2 font-mono text-[12px] text-[#002f5e]" />
            <button type="button" onClick={copy} className="flex items-center gap-1.5 rounded-xl bg-[#002f5e] px-3 py-2 text-[13px] text-[#fff2e8]"><Copy className="h-4 w-4" /> Копіювати</button>
          </div>
        )}
        <button type="button" disabled={saving} onClick={generateLink} className="mt-3 flex items-center gap-2 rounded-xl border border-[#002f5e]/20 px-4 py-2 text-[13px] text-[#002f5e] hover:bg-[#002f5e]/5 disabled:opacity-60">
          <RefreshCw className="h-4 w-4" /> {setting.tokenHash ? "Згенерувати нове посилання" : "Створити посилання"}
        </button>
      </div>
    </div>
  );
}
