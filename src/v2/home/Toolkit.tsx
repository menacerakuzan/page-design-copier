import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, BookOpen, Heart, Sparkles, type LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useBasket } from "@/lib/basketContext";
import { loadGuides } from "@/lib/guidesRepository";
import { useV2 } from "@/v2/i18n";
import { useArticles } from "@/v2/info/useArticles";
import { Reveal, SectionHead } from "@/v2/components/ui";
import { ScatterBackdrop } from "./toolkit/ScatterBackdrop";
import { usePauseOffscreen } from "@/v2/lib/usePauseOffscreen";

/**
 * Міні-діалог: питання → «друкує…» → відповідь (програється при появі).
 * Місце під увесь діалог зайняте одразу (бульбашки лише проявляються), а
 * «друкує…» стоїть на місці майбутньої відповіді — тож нічого не смикається
 * й не зсуває картку (раніше на мить були видні і «друкує…», і відповідь).
 */
function ChatDemo() {
  const { t } = useV2();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? 3 : 0);
  useEffect(() => {
    if (!inView || reduce) return;
    const ids = [setTimeout(() => setStep(1), 300), setTimeout(() => setStep(2), 1100), setTimeout(() => setStep(3), 2600)];
    return () => ids.forEach(clearTimeout);
  }, [inView, reduce]);

  const bubble = (on: boolean) => ({
    initial: false as const,
    animate: on ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.96 },
    transition: { duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <div ref={ref} className="flex flex-col gap-2" aria-hidden="true">
      <motion.div {...bubble(step >= 1)} className="max-w-[85%] self-end rounded-[18px] rounded-br-md bg-o-sand px-3.5 py-2 text-[13.5px] text-o-winedeep">
        {t("aiQ")}
      </motion.div>
      <div className="relative max-w-[90%] self-start">
        <motion.div {...bubble(step >= 3)} className="rounded-[18px] rounded-bl-md bg-o-sand/15 px-3.5 py-2 text-[13.5px] leading-relaxed">
          {t("aiA")}
        </motion.div>
        <motion.div
          initial={false}
          animate={{ opacity: step === 2 ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.25 }}
          className="typing absolute left-0 top-0 flex gap-1.5 rounded-[18px] rounded-bl-md bg-o-sand/15 px-3.5 py-3.5"
        >
          <span className="h-2 w-2 rounded-full bg-o-sand" /><span className="h-2 w-2 rounded-full bg-o-sand" /><span className="h-2 w-2 rounded-full bg-o-sand" />
        </motion.div>
      </div>
    </div>
  );
}

/** Кругла стрілка в куті картки. light — для світлих карток (при наведенні стає винною). */
const Corner = ({ light = false }: { light?: boolean }) => (
  <span
    className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-current transition-all duration-300 group-hover:rotate-45 ${
      light ? "group-hover:border-o-wine group-hover:bg-o-wine group-hover:text-o-sand" : "group-hover:border-o-sand group-hover:bg-o-sand group-hover:text-o-sea"
    }`}
    aria-hidden="true"
  >
    <ArrowUpRight className="h-[18px] w-[18px]" />
  </span>
);

/** 1 гід · 2 гіди · 5 гідів (англ. guide/guides). */
const guidesWord = (n: number, en: boolean) => {
  if (en) return n === 1 ? "guide" : "guides";
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "гід";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "гіди";
  return "гідів";
};

/** 1 стаття · 2 статті · 5 статей (англ. article/articles). */
const articlesWord = (n: number, en: boolean) => {
  if (en) return n === 1 ? "article" : "articles";
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "стаття";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "статті";
  return "статей";
};

/** Рядок сервісу на телефоні: значок · назва й опис · стрілка. */
function ServiceRow({ to, Icon, title, desc, iconCls, extra }: { to: string; Icon: LucideIcon; title: string; desc: string; iconCls: string; extra?: ReactNode }) {
  return (
    <li>
      <Link to={to} className="group flex items-center gap-4 px-4 py-3.5 transition-colors active:bg-o-sand2/60">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconCls}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[15.5px] font-bold leading-tight">
            {title}
            {extra}
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-o-sea/60">{desc}</span>
        </span>
        <ArrowUpRight className="h-5 w-5 shrink-0 text-o-wine/70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </li>
  );
}

export function Toolkit() {
  const { t, list, lang } = useV2();
  const { count } = useBasket();
  const pauseRef = usePauseOffscreen<HTMLElement>();
  const { data: guides } = useQuery({ queryKey: ["guides-published"], queryFn: () => loadGuides(true) });
  const en = lang === "en";
  const prompts = list("chips").slice(0, 4);
  const guidesLine = guides?.length ? `${guides.length} ${guidesWord(guides.length, en)} ${en ? "in the registry" : "у реєстрі"}` : "";
  const { list: articles } = useArticles();
  const articlesLine = articles.length ? `${articles.length} ${articlesWord(articles.length, en)}` : "";

  return (
    <section ref={pauseRef} aria-labelledby="tools-title" className="relative isolate overflow-hidden py-12 sm:py-20">
      <ScatterBackdrop />
      <div className="mx-auto max-w-[1280px] px-5 sm:px-10">
        <SectionHead id="tools-title" inline kicker={t("toolsKicker")} line1={t("toolsTitle1")} line2={t("toolsTitle2")} />

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3.5 sm:mt-8 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[212px_212px]">
          {/* AI-гід. Уся картка веде в чат, а підказки-питання — у чат одразу з цим питанням. */}
          <Reveal className="md:col-span-2 lg:row-span-2">
            <div className="layers group relative flex h-full flex-col overflow-hidden rounded-[18px] bg-o-wine p-5 text-o-sand sm:p-6 lg:min-h-[330px]">
              <Corner />
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-o-sun text-o-winedeep"><Sparkles className="h-[18px] w-[18px]" aria-hidden="true" /></span>
              {/* Невидиме посилання на всю картку; підказки-питання лежать над ним (!z-10 — бо .layers
                  ставить усім дітям z-index: 1 сильнішим селектором) */}
              <Link to="/asystent" aria-label={t("aiTitle")} className="absolute inset-0 z-[2] rounded-[18px]" />
              <h3 className="mt-4 max-w-[380px] text-[23px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[26px]">{t("aiTitle")}</h3>
              <p className="mt-2 max-w-[380px] text-[14px] text-o-sand/75">{t("aiDesc")}</p>

              <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-o-sun">{t("aiAsk")}</p>
              <ul className="no-scrollbar relative !z-10 -mx-5 mt-2 flex shrink-0 gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0">
                {prompts.map((q) => (
                  <li key={q} className="shrink-0">
                    <Link to={`/asystent?q=${encodeURIComponent(q)}`} className="inline-flex rounded-full bg-o-sand/[0.12] px-3.5 py-1.5 text-[13px] font-medium ring-1 ring-o-sand/20 transition-colors hover:bg-o-sand hover:text-o-winedeep">
                      {q}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-4"><ChatDemo /></div>
              <span className="mt-3 inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-o-sand px-4 py-2 text-[13.5px] font-semibold text-o-winedeep transition-colors group-hover:bg-o-sun">{t("aiCta")}</span>
            </div>
          </Reveal>

          {/* Телефон: решта сервісів — одним світлим списком замість трьох великих карток */}
          <Reveal delay={0.08} className="md:hidden">
            <ul className="divide-y divide-o-sea/[0.08] overflow-hidden rounded-[18px] bg-o-shell ring-1 ring-o-sea/10">
              <ServiceRow
                to="/koshyk"
                Icon={Heart}
                iconCls="bg-o-sun/25 text-o-wine [&>svg]:fill-o-wine"
                title={t("tripTitle")}
                desc={t("tripDesc")}
                extra={count > 0 ? <span className="rounded-full bg-o-wine px-2 py-0.5 text-[11px] font-bold text-o-sand">{count}</span> : undefined}
              />
              <ServiceRow to="/info" Icon={BookOpen} iconCls="bg-o-wine/10 text-o-wine" title={t("usefulTitle")} desc={t("usefulDesc")} />
              <ServiceRow to="/hidy" Icon={BadgeCheck} iconCls="bg-o-wine/10 text-o-wine" title={t("guidesTitle")} desc={guidesLine || t("guidesDesc")} />
            </ul>
          </Reveal>

          {/* Мій маршрут */}
          <Reveal delay={0.08} className="hidden md:block lg:col-span-2">
            <Link to="/koshyk" className="group relative flex h-full min-h-[170px] overflow-hidden rounded-[18px] bg-o-sun p-5 text-o-deep">
              <Corner />
              <div className="relative z-10 flex flex-col">
                <Heart className="h-6 w-6 fill-o-wine text-o-wine" aria-hidden="true" />
                <h3 className="mt-3 text-[19px] font-bold leading-none tracking-[-0.015em]">{t("tripTitle")}</h3>
                <p className="mt-2 max-w-[300px] text-[14px] text-o-deep/70">{t("tripDesc")}</p>
                {/* Поки маршрут порожній — запрошення, а не «0» */}
                <p className="mt-auto pt-4 text-[15px] font-semibold">
                  {count > 0 ? (
                    <>
                      <span className="text-[26px] font-extrabold leading-none">{count}</span> {t("tripCount")}
                    </>
                  ) : (
                    t("tripFirst")
                  )}
                </p>
              </div>
              {/* Пунктирний маршрут з трьома зупинками */}
              <svg viewBox="0 0 220 160" className="pointer-events-none absolute bottom-2 right-3 hidden w-[180px] text-o-deep/70 transition-transform duration-700 group-hover:-translate-y-1 sm:block" aria-hidden="true">
                <path d="M20 140 C 60 60, 120 150, 150 80 S 200 30, 205 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="1 9" strokeLinecap="round" />
                <circle cx="20" cy="140" r="8" fill="#fff2e8" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="150" cy="80" r="8" fill="#fff2e8" stroke="currentColor" strokeWidth="2.5" />
                <path d="M205 4c-7 0-12 5-12 12 0 9 12 20 12 20s12-11 12-20c0-7-5-12-12-12z" fill="#9f1f47" />
              </svg>
            </Link>
          </Reveal>

          {/* Корисне — світла картка зі стосиком нахилених «сторінок» у куті */}
          <Reveal delay={0.14} className="hidden md:block">
            <Link to="/info" className="group relative flex h-full min-h-[170px] flex-col overflow-hidden rounded-[18px] bg-o-shell p-5 ring-1 ring-o-sea/10">
              <Corner light />
              <svg viewBox="0 0 120 110" className="pointer-events-none absolute -bottom-3 -right-2 w-[84px] opacity-80 transition-[transform,opacity] duration-700 group-hover:-translate-y-1 group-hover:rotate-[-2deg] group-hover:opacity-100" aria-hidden="true">
                <rect x="30" y="14" width="74" height="92" rx="7" fill="#f8e6d6" stroke="#9f1f47" strokeOpacity=".25" transform="rotate(10 67 60)" />
                <g transform="rotate(-5 60 60)">
                  <rect x="18" y="12" width="74" height="92" rx="7" fill="#fffaf5" stroke="#9f1f47" strokeOpacity=".35" />
                  <rect x="28" y="24" width="30" height="5" rx="2.5" fill="#9f1f47" fillOpacity=".55" />
                  <path d="M28 40H82M28 50H82M28 60H70M28 70H82M28 80H62" stroke="#002f5e" strokeOpacity=".18" strokeWidth="3" strokeLinecap="round" />
                </g>
              </svg>
              <BookOpen className="h-6 w-6 text-o-wine" aria-hidden="true" />
              <h3 className="mt-3 text-[19px] font-bold leading-none">{t("usefulTitle")}</h3>
              <p className="relative mt-2 max-w-[170px] text-[14px] text-o-sea/65">{t("usefulDesc")}</p>
              {articlesLine && <p className="mt-auto pt-3 text-[14px] font-semibold text-o-wine">{articlesLine}</p>}
            </Link>
          </Reveal>

          {/* Гіди */}
          <Reveal delay={0.2} className="hidden md:block">
            <Link to="/hidy" className="group relative flex h-full min-h-[170px] flex-col overflow-hidden rounded-[18px] bg-o-shell p-5 ring-1 ring-o-sea/10">
              <Corner light />
              <BadgeCheck className="h-6 w-6 text-o-wine" aria-hidden="true" />
              <h3 className="mt-3 text-[19px] font-bold leading-none">{t("guidesTitle")}</h3>
              <p className="mt-2 text-[14px] text-o-sea/65">{t("guidesDesc")}</p>
              {guidesLine && <p className="mt-auto pt-3 text-[14px] font-semibold text-o-wine">{guidesLine}</p>}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
