import "@/v2/v2.css";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, ExternalLink, Search, X } from "lucide-react";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import { loadGuides, type Guide } from "@/lib/guidesRepository";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { Reveal } from "@/v2/components/ui";
import { LegendBackdrop } from "./backdrop";
import { GuideArt } from "./GuideArt";

/** Мови з реєстру → коротка позначка й назва (самоназвою — так звичніше гостям). */
const LANGS: Record<string, { code: string; name: string }> = {
  українська: { code: "UA", name: "Українська" },
  english: { code: "EN", name: "English" },
  deutsche: { code: "DE", name: "Deutsch" },
  deutsch: { code: "DE", name: "Deutsch" },
  français: { code: "FR", name: "Français" },
  francais: { code: "FR", name: "Français" },
  polski: { code: "PL", name: "Polski" },
  español: { code: "ES", name: "Español" },
  italiano: { code: "IT", name: "Italiano" },
  türkçe: { code: "TR", name: "Türkçe" },
};
const lang = (raw: string) => LANGS[raw.trim().toLowerCase()] ?? { code: raw.slice(0, 2).toUpperCase(), name: raw };

/**
 * Нова сторінка «Гіди» (/hidy): реєстр гідів Асоціації гідів Одеси —
 * компактні картки-«бейджі» (ініціали з печаткою ДСТУ, прізвище й ім'я, мови
 * короткими позначками, № у реєстрі), пошук за прізвищем, фільтр за мовою
 * й «лише ДСТУ» (у адресі: ?lang=EN&dstu=1). Унизу — що означає ДСТУ і
 * посилання на реєстр. Стара src/pages/GuidesPage лишається до кінця редизайну.
 */
export default function GuidesPage() {
  const { t, lang: ui } = useV2();
  useSeo({ title: `${t("gdTitle1")} ${t("gdTitle2")}`, description: t("gdLead"), lang: ui });
  const { data: guides = [], isLoading } = useQuery({ queryKey: ["guides-published"], queryFn: () => loadGuides(true) });
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const reduce = useReducedMotion();
  const code = params.get("lang");
  const dstu = params.get("dstu") === "1";
  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true, preventScrollReset: true });
  };

  const langs = useMemo(() => {
    const m = new Map<string, { code: string; name: string; n: number }>();
    for (const g of guides) for (const l of g.languages) {
      const x = lang(l);
      const cur = m.get(x.code);
      if (cur) cur.n++;
      else m.set(x.code, { ...x, n: 1 });
    }
    return [...m.values()].sort((a, b) => b.n - a.n);
  }, [guides]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return guides.filter(
      (g) =>
        (!code || g.languages.some((l) => lang(l).code === code)) &&
        (!dstu || g.dstu) &&
        (!needle || `${g.surname} ${g.firstName}`.toLowerCase().includes(needle)),
    );
  }, [guides, code, dstu, q]);

  const dstuCount = guides.filter((g) => g.dstu).length;
  const registry = guides.find((g) => g.personalUrl)?.personalUrl?.match(/^https?:\/\/[^/]+\/[^/]+\//)?.[0];
  const chip = (on: boolean) =>
    `inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition-colors ${
      on ? "bg-o-wine text-o-sand shadow-[0_8px_18px_-10px_rgba(159,31,71,0.9)]" : "bg-o-sea/[0.05] text-o-sea/80 hover:bg-o-sea/[0.1] hover:text-o-sea"
    }`;

  return (
    <div className="v2 min-h-screen">
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <LegendBackdrop />
        {/* relative — щоб вміст лежав над фоном */}
        <div className="relative mx-auto max-w-[1280px] px-5 pb-16 pt-4 sm:px-10 sm:pb-24 sm:pt-6">
          {/* Заголовок */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <Reveal className="max-w-[720px]">
              <p className="mb-3 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
                <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
                {t("gdKicker")}
              </p>
              <h1 className="text-[40px] font-bold leading-[1] tracking-[-0.025em] sm:text-[56px] lg:text-[64px]">
                {t("gdTitle1")} <span className="ital text-o-wine">{t("gdTitle2")}</span>
              </h1>
              <p className="mt-4 max-w-[600px] text-[15.5px] leading-relaxed text-o-sea/70 sm:text-[16.5px]">{t("gdLead")}</p>
            </Reveal>
            {/* Ілюстрація: прапорець гіда й «Привіт / Hello / Hallo» */}
            <Reveal delay={0.08} className="hidden lg:block">
              <GuideArt className="-mb-2 w-[230px]" />
            </Reveal>
          </div>

          {/* Пошук і фільтри */}
          {guides.length > 0 && (
            <div className="mt-10 flex flex-col gap-3 sm:mt-12 lg:flex-row lg:items-center">
              <label className="relative block lg:w-[300px] lg:shrink-0">
                <span className="sr-only">{t("gdSearch")}</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-o-sea/45" aria-hidden="true" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("gdSearch")}
                  className="h-11 w-full rounded-full bg-[#fffaf5] pl-11 pr-10 text-[14.5px] text-o-sea outline-none ring-1 ring-o-sea/10 transition-shadow placeholder:text-o-sea/40 focus:ring-2 focus:ring-o-wine/40"
                />
                {q && (
                  <button type="button" onClick={() => setQ("")} aria-label={t("gdReset")} className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-o-sea/50 hover:bg-o-sea/[0.06] hover:text-o-wine">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </label>
              <div role="group" aria-label={t("gdLangs")} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 pt-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
                <button type="button" onClick={() => set("lang", null)} aria-pressed={!code} className={chip(!code)}>
                  {t("gdAllLangs")}
                </button>
                {langs.map((l) => (
                  <button key={l.code} type="button" onClick={() => set("lang", code === l.code ? null : l.code)} aria-pressed={code === l.code} className={chip(code === l.code)}>
                    <span className={`text-[11px] font-bold tracking-wider ${code === l.code ? "text-o-sunsoft" : "text-o-wine"}`}>{l.code}</span>
                    {l.name}
                    <span className={`text-[11.5px] ${code === l.code ? "text-o-sand/60" : "text-o-sea/40"}`}>{l.n}</span>
                  </button>
                ))}
                {dstuCount > 0 && (
                  <button
                    type="button"
                    onClick={() => set("dstu", dstu ? null : "1")}
                    aria-pressed={dstu}
                    className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold transition-colors lg:ml-auto ${
                      dstu ? "bg-o-sun text-o-winedeep shadow-[0_8px_18px_-10px_rgba(223,155,59,0.9)]" : "bg-o-sun/15 text-o-winedeep/80 hover:bg-o-sun/25"
                    }`}
                  >
                    <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    {t("gdOnlyDstu")}
                    <span className="text-[11.5px] opacity-60">{dstuCount}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Картки */}
          {isLoading ? (
            <div className="flex justify-center py-24">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
            </div>
          ) : shown.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[16px] text-o-sea/60">{t("gdNone")}</p>
              {(q || code || dstu) && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setParams(new URLSearchParams(), { replace: true, preventScrollReset: true });
                  }}
                  className="mt-5 rounded-full border border-o-sea/20 px-5 py-2 text-[14px] font-semibold transition-colors hover:border-o-wine hover:text-o-wine"
                >
                  {t("gdReset")}
                </button>
              )}
            </div>
          ) : (
            <motion.ul
              key={`${code}-${dstu}`}
              initial={reduce ? false : { opacity: 0.35 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
            >
              {shown.map((g, i) => (
                <Reveal as="li" key={g.id} delay={(i % 4) * 0.04} y={14}>
                  <GuideCard g={g} />
                </Reveal>
              ))}
            </motion.ul>
          )}

          {/* Що означає ДСТУ + джерело */}
          {guides.length > 0 && (
            <Reveal className="mt-16 grid gap-6 rounded-[24px] bg-[#fffaf5] p-6 shadow-[0_20px_40px_-34px_rgba(0,10,30,0.55)] ring-1 ring-o-sea/[0.06] sm:mt-20 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-8 sm:p-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-o-sun text-o-winedeep">
                <BadgeCheck className="h-7 w-7" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[18px] font-bold leading-snug">{t("gdAboutTitle")}</p>
                <p className="mt-1.5 max-w-[680px] text-[14.5px] leading-relaxed text-o-sea/70">{t("gdAboutText")}</p>
              </div>
              {registry && (
                <a href={registry} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 self-start rounded-full px-5 py-3 text-[14px] font-semibold ring-1 ring-o-sea/20 transition-colors hover:text-o-wine hover:ring-o-wine/40 sm:self-center">
                  {t("gdRegistry")}
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </Reveal>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/** Відтінки квадратика з ініціалами. */
const TONES = ["bg-o-wine/[0.09] text-o-wine", "bg-o-sea/[0.07] text-o-sea", "bg-o-sun/20 text-o-winedeep"];
const tone = (s: string) => [...s].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length;

/**
 * Картка гіда — компактний «бейдж» (без фото): ініціали з печаткою ДСТУ,
 * прізвище, ім'я, мови короткими позначками, № у реєстрі. Уся картка веде на
 * персональну сторінку гіда в реєстрі (якщо є).
 */
function GuideCard({ g }: { g: Guide }) {
  const { t } = useV2();
  const Comp = g.personalUrl ? "a" : "div";
  const link = g.personalUrl ? { href: g.personalUrl, target: "_blank", rel: "noreferrer" } : {};
  const initials = `${g.surname[0] ?? ""}${g.firstName[0] ?? ""}`;
  return (
    <Comp
      {...link}
      className="group relative flex h-full flex-col rounded-[20px] bg-[#fffaf5] p-3.5 shadow-[0_14px_28px_-24px_rgba(0,10,30,0.55)] ring-1 ring-o-sea/[0.06] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_22px_36px_-24px_rgba(0,10,30,0.6)]"
    >
      {/* Верх: ініціали (колір — за прізвищем, щоб сусіди різнились) з печаткою ДСТУ, прізвище й ім'я */}
      <span className="flex items-center gap-4">
        <span className="relative shrink-0">
          <span className={`ital flex h-[64px] w-[64px] items-center justify-center rounded-[16px] text-[24px] font-bold ${TONES[tone(g.surname)]}`}>{initials}</span>
          {g.dstu && (
            <span title={t("gdDstuFull")} className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-o-sun text-o-winedeep ring-[3px] ring-[#fffaf5]">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{t("gdDstuFull")}</span>
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16.5px] font-bold leading-tight transition-colors group-hover:text-o-wine">{g.surname}</span>
          <span className="block truncate text-[14px] text-o-sea/65">{g.firstName}</span>
          {g.cert && <span className="mt-1 block truncate text-[11.5px] tabular-nums text-o-sea/40" title={t("gdNumber")}>№ {g.cert}</span>}
        </span>
      </span>
      {/* Низ — за пунктиром, як на бейджі: мови й посилання на сторінку гіда */}
      <span className="mt-3.5 flex items-center gap-1.5 border-t border-dashed border-o-sea/15 pt-3">
        {g.languages.map((l) => {
          const x = lang(l);
          return (
            <span key={l} title={x.name} className="rounded-[6px] bg-o-wine/[0.08] px-1.5 py-0.5 text-[10.5px] font-bold tracking-wider text-o-wine">
              {x.code}
            </span>
          );
        })}
        {g.personalUrl && (
          <span className="ml-auto inline-flex items-center gap-1 text-[12.5px] font-semibold text-o-sea/55 transition-colors group-hover:text-o-wine">
            {t("gdPage")}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        )}
      </span>
    </Comp>
  );
}
