import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import shieldUrl from "@/v2/assets/shield.svg";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Герб області, зафарбований поточним кольором тексту (CSS-маска). */
export function Shield({ className = "h-8 w-[26px]" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        WebkitMaskImage: `url(${shieldUrl})`,
        maskImage: `url(${shieldUrl})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label="Одещина — на головну">
      <Shield className="h-[30px] w-[24px]" />
      <span className="wordmark text-[21px] leading-none">Одещина</span>
    </Link>
  );
}

/** Плавна поява при прокрутці (м'яко, один раз). */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const reduce = useReducedMotion();
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </Comp>
  );
}

/** Заголовок секції: маленький кікер + великий заголовок із курсивним другим рядком. */
export function SectionHead({
  kicker,
  line1,
  line2,
  lead,
  action,
  tone = "light",
  id,
  inline = false,
}: {
  kicker: string;
  line1: string;
  line2: string;
  lead?: string;
  /** short — коротший підпис для телефона (там посилання стоїть поруч із кікером). */
  action?: { to: string; label: string; short?: string };
  tone?: "light" | "dark";
  id?: string;
  /** Обидві частини заголовка в один рядок. */
  inline?: boolean;
}) {
  const dark = tone === "dark";
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <Reveal className={inline ? "" : "max-w-[760px]"}>
        <p className={`mb-3 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] ${dark ? "text-o-sun" : "text-o-wine"}`}>
          <span className={`h-px w-8 ${dark ? "bg-o-sun" : "bg-o-wine"}`} aria-hidden="true" />
          {kicker}
          {/* Телефон: замість великої кнопки під заголовком — коротке посилання праворуч */}
          {action && (
            <Link
              to={action.to}
              className={`-my-2 ml-auto inline-flex items-center gap-1 py-2 text-[13.5px] normal-case tracking-normal underline decoration-1 underline-offset-4 md:hidden ${dark ? "text-o-sand decoration-o-sun" : "text-o-sea decoration-o-wine/40"}`}
            >
              {action.short ?? action.label}
              <ArrowUpRight className={`h-4 w-4 ${dark ? "text-o-sun" : "text-o-wine"}`} aria-hidden="true" />
            </Link>
          )}
        </p>
        <h2 id={id} className="text-[30px] font-bold leading-[1] tracking-[-0.02em] sm:text-[36px] lg:text-[44px]">
          {line1} <span className={`ital leading-[1.05] ${inline ? "" : "block"} ${dark ? "text-o-sun" : "text-o-wine"}`}>{line2}</span>
        </h2>
        {lead && <p className={`mt-4 max-w-[520px] text-[15px] leading-relaxed ${dark ? "text-o-sand/75" : "text-o-sea/70"}`}>{lead}</p>}
      </Reveal>
      {action && (
        <Reveal delay={0.1} className="hidden md:block">
          <PillLink to={action.to} tone={dark ? "sand" : "sea"}>{action.label}</PillLink>
        </Reveal>
      )}
    </div>
  );
}

/** Кругла кнопка-посилання зі стрілкою, що «виїжджає» при наведенні. */
export function PillLink({
  to,
  children,
  tone = "sea",
  className = "",
}: {
  to: string;
  children: ReactNode;
  tone?: "sea" | "sand" | "sun" | "wine";
  className?: string;
}) {
  const tones = {
    sea: ["bg-o-sea text-o-sand hover:bg-o-wine", "bg-o-sand/15"],
    sand: ["bg-o-sand text-o-sea hover:bg-o-sun", "bg-o-sea/10"],
    sun: ["bg-o-sun text-o-deep hover:bg-o-sand", "bg-o-deep/10"],
    wine: ["bg-o-wine text-o-sand hover:bg-o-sea", "bg-o-sand/15"],
  };
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-3 whitespace-nowrap rounded-full py-1.5 pl-5 pr-1.5 text-[14px] font-semibold transition-colors duration-300 ${tones[tone][0]} ${className}`}
    >
      {children}
      <span className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ${tones[tone][1]}`}>
        <span className="relative block h-4 w-4 overflow-hidden">
          <ArrowUpRight className="absolute inset-0 h-4 w-4 transition-transform duration-300 group-hover:-translate-y-4 group-hover:translate-x-4" aria-hidden="true" />
          <ArrowUpRight className="absolute inset-0 h-4 w-4 -translate-x-4 translate-y-4 transition-transform duration-300 group-hover:translate-x-0 group-hover:translate-y-0" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
