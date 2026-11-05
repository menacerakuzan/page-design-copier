import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, Heart, Navigation, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useBasket } from "@/lib/basketContext";
import { loadGuides } from "@/lib/guidesRepository";
import { useV2 } from "@/v2/i18n";
import { Reveal, SectionHead } from "@/v2/components/ui";
import { ScatterBackdrop } from "./toolkit/ScatterBackdrop";
import { usePauseOffscreen } from "@/v2/lib/usePauseOffscreen";

/** Міні-діалог: питання → «друкує…» → відповідь (програється при появі). */
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

  return (
    <div ref={ref} className="flex min-h-[118px] flex-col gap-2" aria-hidden="true">
      <AnimatePresence>
        {step >= 1 && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="max-w-[85%] self-end rounded-[18px] rounded-br-md bg-o-sand px-3.5 py-2 text-[13.5px] text-o-winedeep">
            {t("aiQ")}
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="typing flex gap-1.5 self-start rounded-[18px] rounded-bl-md bg-o-sand/15 px-3.5 py-3.5">
            <span className="h-2 w-2 rounded-full bg-o-sand" /><span className="h-2 w-2 rounded-full bg-o-sand" /><span className="h-2 w-2 rounded-full bg-o-sand" />
          </motion.div>
        )}
        {step >= 3 && (
          <motion.div key="answer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-[90%] self-start rounded-[18px] rounded-bl-md bg-o-sand/15 px-3.5 py-2 text-[13.5px] leading-relaxed">
            {t("aiA")}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Corner = () => (
  <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-current transition-all duration-300 group-hover:rotate-45 group-hover:border-o-sand group-hover:bg-o-sand group-hover:text-o-sea" aria-hidden="true">
    <ArrowUpRight className="h-[18px] w-[18px]" />
  </span>
);

export function Toolkit() {
  const { t } = useV2();
  const { count } = useBasket();
  const pauseRef = usePauseOffscreen<HTMLElement>();
  const { data: guides } = useQuery({ queryKey: ["guides-published"], queryFn: () => loadGuides(true) });

  return (
    <section ref={pauseRef} aria-labelledby="tools-title" className="relative isolate overflow-hidden py-16 sm:py-20">
      <ScatterBackdrop />
      <div className="mx-auto max-w-[1280px] px-5 sm:px-10">
        <SectionHead id="tools-title" inline kicker={t("toolsKicker")} line1={t("toolsTitle1")} line2={t("toolsTitle2")} />

        <div className="mt-8 grid gap-3.5 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[188px_188px]">
          {/* AI-гід */}
          <Reveal className="md:col-span-2 lg:row-span-2">
            <Link to="/asystent" className="grain group relative flex h-full min-h-[330px] flex-col overflow-hidden rounded-[18px] bg-o-wine p-5 text-o-sand sm:p-6">
              <Corner />
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-o-sun text-o-winedeep"><Sparkles className="h-[18px] w-[18px]" aria-hidden="true" /></span>
              <h3 className="mt-4 max-w-[380px] text-[23px] font-bold leading-[1.05] tracking-[-0.02em] sm:text-[26px]">{t("aiTitle")}</h3>
              <p className="mt-2 max-w-[380px] text-[14px] text-o-sand/75">{t("aiDesc")}</p>
              <div className="mt-auto pt-4"><ChatDemo /></div>
              <span className="mt-3 inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-o-sand px-4 py-2 text-[13.5px] font-semibold text-o-winedeep transition-colors group-hover:bg-o-sun">{t("aiCta")}</span>
            </Link>
          </Reveal>

          {/* Мій маршрут */}
          <Reveal delay={0.08} className="lg:col-span-2">
            <Link to="/koshyk" className="group relative flex h-full min-h-[170px] overflow-hidden rounded-[18px] bg-o-sun p-5 text-o-deep">
              <Corner />
              <div className="relative z-10 flex flex-col">
                <Heart className="h-6 w-6 fill-o-wine text-o-wine" aria-hidden="true" />
                <h3 className="mt-3 text-[19px] font-bold leading-none tracking-[-0.015em]">{t("tripTitle")}</h3>
                <p className="mt-2 max-w-[300px] text-[14px] text-o-deep/70">{t("tripDesc")}</p>
                <p className="mt-auto pt-4 text-[15px] font-semibold"><span className="text-[26px] font-extrabold leading-none">{count}</span> {t("tripCount")}</p>
              </div>
              {/* Пунктирний маршрут з трьома зупинками */}
              <svg viewBox="0 0 220 160" className="pointer-events-none absolute bottom-2 right-3 hidden w-[180px] sm:block text-o-deep/70 transition-transform duration-700 group-hover:-translate-y-1" aria-hidden="true">
                <path d="M20 140 C 60 60, 120 150, 150 80 S 200 30, 205 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="1 9" strokeLinecap="round" />
                <circle cx="20" cy="140" r="8" fill="#fff2e8" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="150" cy="80" r="8" fill="#fff2e8" stroke="currentColor" strokeWidth="2.5" />
                <path d="M205 4c-7 0-12 5-12 12 0 9 12 20 12 20s12-11 12-20c0-7-5-12-12-12z" fill="#9f1f47" />
              </svg>
            </Link>
          </Reveal>

          {/* Поблизу */}
          <Reveal delay={0.14}>
            <Link to="/poblizu" className="group relative flex h-full min-h-[170px] flex-col overflow-hidden rounded-[18px] bg-o-sea p-5 text-o-sand">
              <Corner />
              <div className="absolute -bottom-10 -right-10 h-36 w-36" aria-hidden="true">
                <span className="ping-soft absolute inset-0 rounded-full border border-o-sun/60" />
                <span className="ping-soft absolute inset-0 rounded-full border border-o-sun/60 [animation-delay:1.3s]" />
                <span className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-o-sun shadow-[0_0_0_6px_rgba(223,155,59,0.25)]" />
              </div>
              <Navigation className="h-6 w-6 text-o-sun" aria-hidden="true" />
              <h3 className="mt-3 text-[19px] font-bold leading-none">{t("nearbyTitle")}</h3>
              <p className="mt-2 max-w-[200px] text-[14px] text-o-sand/70">{t("nearbyDesc")}</p>
            </Link>
          </Reveal>

          {/* Гіди */}
          <Reveal delay={0.2}>
            <Link to="/hidy" className="group relative flex h-full min-h-[170px] flex-col overflow-hidden rounded-[18px] bg-o-shell p-5 ring-1 ring-o-sea/10">
              <Corner />
              <BadgeCheck className="h-6 w-6 text-o-wine" aria-hidden="true" />
              <h3 className="mt-3 text-[19px] font-bold leading-none">{t("guidesTitle")}</h3>
              <p className="mt-2 text-[14px] text-o-sea/65">{t("guidesDesc")}</p>
              <p className="mt-auto text-[28px] font-extrabold leading-none text-o-wine">{guides?.length ?? "—"}</p>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
