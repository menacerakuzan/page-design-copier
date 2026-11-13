import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Тимчасовий перемикач «старий / новий дизайн» на час тестування редизайну.
 *
 * Адреси сторінок однакові для обох дизайнів. Новий вмикається:
 *   - посиланням /v2 або /v2/<будь-яка сторінка> (напр. /v2/raion/izmayilskyy-rayon);
 *   - параметром ?v2 до будь-якої адреси (напр. /raion/izmayilskyy-rayon?v2).
 * Вимикається параметром ?v2=0.
 *
 * Режим пам'ятається в sessionStorage — тобто окремо для кожної вкладки:
 * в одній вкладці можна дивитись старий дизайн, у сусідній — новий.
 * Коли новий дизайн замінить старий остаточно — цей файл прибрати.
 */
const KEY = "design-v2";

const readStored = (): boolean => {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

const writeStored = (v2: boolean) => {
  try {
    if (v2) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {
    /* приватний режим тощо — режим просто не запам'ятається */
  }
};

const isV2Path = (pathname: string) => pathname === "/v2" || pathname.startsWith("/v2/");

/** Що каже сама адреса: true / false — увімкнути / вимкнути, null — нічого. */
function fromUrl(pathname: string, search: string): boolean | null {
  const p = new URLSearchParams(search);
  if (p.has("v2")) return p.get("v2") !== "0";
  if (isV2Path(pathname)) return true;
  return null;
}

const DesignCtx = createContext(false);

/** Має стояти всередині BrowserRouter. */
export function DesignModeProvider({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation();
  const [v2, setV2] = useState(() => fromUrl(pathname, search) ?? readStored());

  // Синхронно під час рендеру, щоб не мигнув «не той» дизайн.
  const wanted = fromUrl(pathname, search);
  if (wanted !== null && wanted !== v2) setV2(wanted);

  useEffect(() => writeStored(v2), [v2]);

  // Нова версія — лише для тестування: не пускаємо її в пошукові системи.
  useEffect(() => {
    if (!v2) return;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, [v2]);

  return <DesignCtx.Provider value={v2}>{children}</DesignCtx.Provider>;
}

/** true — у цій вкладці показуємо новий дизайн. */
export const useDesignV2 = () => useContext(DesignCtx);

/** Показати новий або старий варіант залежно від режиму вкладки. */
export function ByDesign({ v2, old }: { v2: ReactNode; old: ReactNode }) {
  return <>{useDesignV2() ? v2 : old}</>;
}

/**
 * /v2/<шлях> і ?v2 — лише «вхідні двері»: прибираємо їх з адреси, щоб далі
 * сторінки мали звичайні адреси (режим уже запам'ятав DesignModeProvider).
 */
export function DesignUrlCleanup() {
  const { pathname, search, hash } = useLocation();
  const p = new URLSearchParams(search);
  if (!isV2Path(pathname) && !p.has("v2")) return null;
  p.delete("v2");
  const rest = p.toString();
  const path = isV2Path(pathname) ? pathname.slice(3) || "/" : pathname;
  return <Navigate to={`${path}${rest ? `?${rest}` : ""}${hash}`} replace />;
}
