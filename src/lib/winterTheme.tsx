import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminToken } from "@/lib/adminAuth";
import { loadWinterSetting, sha256Hex, type WinterMode } from "@/lib/siteSettings";

/**
 * Зимова тема.
 *
 * Вмикається в адмінці (Сайт → Зимова тема). Поки режим «прихований перегляд»,
 * тему бачать лише ті, хто відкрив приховане посилання `?winter=<токен>`
 * (токен запам'ятовується в цьому браузері), і залогінені адміністратори.
 * `?winter=off` — забути токен і повернутись до звичайного сайту.
 *
 * Уся зимова графіка (гірлянда, сніг, ялинки, заставка) — в окремих lazy-чанках
 * src/components/winter/*, тож звичайні відвідувачі її навіть не завантажують.
 */

const TOKEN_KEY = "odesa-winter-token";
const LIGHTS_KEY = "odesa-winter-lights";

type WinterContextValue = {
  active: boolean;
  mode: WinterMode;
  /**
   * Святкові ефекти (мерехтіння гірлянди, сніг, анімації персонажів).
   * Відвідувач вимикає їх шнурком гірлянди — це і є механізм «пауза» для
   * рухомого контенту довше 5 с (WCAG 2.2.2). Вибір запам'ятовуємо.
   */
  lightsOn: boolean;
  setLightsOn: (on: boolean) => void;
};

const WinterContext = createContext<WinterContextValue>({
  active: false,
  mode: "off",
  lightsOn: true,
  setLightsOn: () => {},
});

const readStorage = (key: string) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const writeStorage = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* приватний режим — просто не запам'ятаємо */ }
};

/** Забирає ?winter=… з адреси (щоб токен не розлітався далі при копіюванні посилання). */
function consumeUrlToken(): string | null {
  if (typeof window === "undefined") return readStorage(TOKEN_KEY);
  const url = new URL(window.location.href);
  const param = url.searchParams.get("winter");
  if (param === null) return readStorage(TOKEN_KEY);
  url.searchParams.delete("winter");
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  if (param === "off" || param === "") {
    writeStorage(TOKEN_KEY, null);
    return null;
  }
  writeStorage(TOKEN_KEY, param);
  return param;
}

export function WinterThemeProvider({ children }: { children: ReactNode }) {
  const [token] = useState(consumeUrlToken);
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [lightsOn, setLightsOnState] = useState(() => readStorage(LIGHTS_KEY) !== "off");

  const { data: setting } = useQuery({
    queryKey: ["site-settings", "winter"],
    queryFn: loadWinterSetting,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!token || !globalThis.crypto?.subtle) return;
    let alive = true;
    sha256Hex(token).then((h) => { if (alive) setTokenHash(h); }, () => {});
    return () => { alive = false; };
  }, [token]);

  const mode = setting?.mode ?? "off";
  const active =
    mode === "on" ||
    (mode === "preview" && (!!getAdminToken() || (!!tokenHash && tokenHash === setting?.tokenHash)));

  useEffect(() => {
    const root = document.documentElement;
    if (active) {
      root.dataset.season = "winter";
      root.dataset.winterFx = lightsOn ? "on" : "off";
    } else {
      delete root.dataset.season;
      delete root.dataset.winterFx;
    }
  }, [active, lightsOn]);

  const value = useMemo<WinterContextValue>(() => ({
    active,
    mode,
    lightsOn,
    setLightsOn: (on) => {
      setLightsOnState(on);
      writeStorage(LIGHTS_KEY, on ? null : "off");
    },
  }), [active, mode, lightsOn]);

  return <WinterContext.Provider value={value}>{children}</WinterContext.Provider>;
}

export const useWinterTheme = () => useContext(WinterContext);
