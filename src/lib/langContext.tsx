import { createContext, useContext, useState, ReactNode } from "react";
import { translations, TranslationKey } from "@/lib/i18n";

type Lang = "uk" | "en";

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
}>({ lang: "uk", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("uk");
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  // t(key) — UI переклади
  const t = (key: TranslationKey) => translations[ctx.lang][key] as string;
  // tl(uk, en) — переклади з БД
  const tl = (uk?: string | null, en?: string | null) =>
    (ctx.lang === "en" && en) ? en : (uk ?? "");
  return { ...ctx, t, tl };
}
