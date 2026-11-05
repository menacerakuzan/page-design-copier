import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Facebook, Instagram, Pause, Play } from "lucide-react";
import { useBasket } from "@/lib/basketContext";
import { useLang } from "@/lib/langContext";
import { useV2 } from "@/v2/i18n";
import { EASE } from "@/v2/components/ui";

export const TikTok = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M14 3c.3 1.6 1.5 2.9 3 3.3V9a7 7 0 0 1-3-1v6.2a5.2 5.2 0 1 1-5.2-5.2h.2v2.8h-.2a2.4 2.4 0 1 0 2.4 2.4V3h2.8z" />
  </svg>
);

export const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/odesa_travel/", Icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/@odesa.travel", Icon: TikTok },
  { label: "Facebook", href: "https://www.facebook.com/share/1BMayDdZLc/", Icon: Facebook },
];

/** Керування фоновим відео: пауза (WCAG 2.2.2) і повага до «зменшити рух». */
export function useVideoToggle() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(!reduce);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) {
      const p = v.play() as Promise<void> | undefined;
      p?.catch?.(() => setPlaying(false));
    } else v.pause();
  }, [playing]);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  return { ref, playing, toggle };
}

export function PlayToggle({ playing, onToggle, className = "", labels }: {
  playing: boolean;
  onToggle: () => void;
  className?: string;
  labels?: [string, string];
}) {
  const { t } = useV2();
  const [pauseL, playL] = labels ?? [t("pauseVideo"), t("playVideo")];
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? pauseL : playL}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-o-deep/30 text-o-sand ring-1 ring-o-sand/30 backdrop-blur-md transition-colors hover:bg-o-sand hover:text-o-sea ${className}`}
    >
      {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}


/**
 * Шапка-«бровь» зі старої головної: пісочна смуга, що звисає згори із
 * заокругленим низом, «ОДЕЩИНА» по центру й навігація з обох боків.
 * На телефоні — лише «✦ ОДЕЩИНА ✦» (навігація там у доку знизу).
 */
export function Brow() {
  const { t: old } = useLang();
  const { count } = useBasket();
  const reduce = useReducedMotion();
  const toFooter = () => document.querySelector("footer")?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Підписи — зі старого словника сайту, щоб шапка збігалася один в один.
  const left = [
    { to: "/districts", label: old("districts") },
    { to: "/marshruty", label: old("routes") },
    { to: "/types", label: old("types") },
    { to: "/hidy", label: old("guides"), lgOnly: true },
  ];
  const right = [
    { to: "/koshyk", label: old("basket"), badge: count },
    { to: "/asystent", label: old("assistant") },
    { to: "/info", label: old("info"), lgOnly: true },
  ];
  const linkCls = (lgOnly?: boolean) =>
    `relative whitespace-nowrap transition-opacity hover:opacity-75 ${lgOnly ? "hidden lg:inline-block" : ""}`;

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: -24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: EASE }}
      className="relative z-20 mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10"
    >
      <div className="rounded-b-[36px] bg-o-sand px-4 pb-2.5 pt-2.5 text-[#00376c] shadow-[0_8px_24px_-18px_rgba(0,47,94,0.35)] md:rounded-b-[48px] md:px-5 md:pb-3.5 md:pt-3.5 lg:px-8">
        {/* Мобільний: лише слово-логотип між зірочками — навігація є в доку знизу */}
        <div className="flex items-center justify-center gap-3 md:hidden">
          <span className="text-[14px] leading-none" aria-hidden="true">✦</span>
          <Link to="/" className="wordmark text-center text-[30px] leading-[0.95]">Одещина</Link>
          <span className="text-[14px] leading-none" aria-hidden="true">✦</span>
        </div>

        {/* Десктоп: три колонки */}
        <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-5">
          <nav aria-label={old("mainNav")} className="flex items-center justify-start gap-3 text-[14px] font-medium leading-none lg:gap-6 lg:text-[16px] lg:font-semibold">
            {left.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkCls(n.lgOnly)}>{n.label}</NavLink>
            ))}
          </nav>

          <Link to="/" className="wordmark px-2 text-center text-[36px] leading-[0.95] transition-opacity hover:opacity-80">
            Одещина
          </Link>

          <nav aria-label={old("secondaryNav")} className="flex items-center justify-end gap-3 text-[14px] font-medium leading-none lg:gap-6 lg:text-[16px] lg:font-semibold">
            {right.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkCls(n.lgOnly)}>
                {n.label}
                {n.badge ? (
                  <span className="absolute -right-3.5 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-o-sun px-1 text-[10px] font-bold leading-none text-o-sea">
                    {n.badge > 99 ? "99+" : n.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
            <button type="button" onClick={toFooter} className="whitespace-nowrap transition-opacity hover:opacity-75">{old("contacts")}</button>
          </nav>
        </div>
      </div>
    </motion.header>
  );
}
