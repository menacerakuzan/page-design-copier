import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, Reorder, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Link2, MapPinOff, Navigation, Share2, Sparkles, X } from "lucide-react";
import { Img } from "@/components/Img";
import { objectDetailPath } from "@/lib/entityLinks";
import { useV2 } from "@/v2/i18n";
import { Reveal } from "@/v2/components/ui";
import { plural } from "@/v2/districts/parts";
import { FoldedMap } from "@/v2/home/routes/parts";
import type { RouteStop } from "@/v2/route/useRoutePage";
import { duration, type Leg, type TripRouteData } from "./useTripRoute";

/** «≈ 45 км · 50 хв» (по прямій — з позначкою «≈»). */
export function legLabel(l: Leg, unit: string, lang: string) {
  const km = l.km < 1 ? `${Math.round(l.km * 1000)} м` : `${l.km < 10 ? l.km.toFixed(1).replace(".", ",") : Math.round(l.km)} ${unit}`;
  return `${l.road ? "" : "≈ "}${km} · ${duration(l.min, lang)}`;
}

/** Заголовок: «Ваш маршрут», назад до збережених, банер «поділилися». */
export function RouteHead({ data, compact = false }: { data: TripRouteData; compact?: boolean }) {
  const { t } = useV2();
  return (
    <div>
      <Link to="/koshyk" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-o-sea/55 transition-colors hover:text-o-wine">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("rmBack")}
      </Link>
      <div className="flex items-end justify-between gap-8">
        <Reveal className="mt-4 max-w-[720px]">
          <h1 className={`font-bold leading-[1] tracking-[-0.025em] ${compact ? "text-[34px] sm:text-[44px]" : "text-[40px] sm:text-[56px] lg:text-[64px]"}`}>
            {t("rmTitle1")} <span className="ital text-o-wine">{t("rmTitle2")}</span>
          </h1>
          {!compact && <p className="mt-4 max-w-[600px] text-[15.5px] leading-relaxed text-o-sea/70 sm:text-[16.5px]">{t("rmLead")}</p>}
        </Reveal>
        {/* Один «стежковий» знак із фону — великим, праворуч від заголовка */}
        {!compact && <TrailMark className="mb-2 hidden w-[260px] shrink-0 lg:block" />}
      </div>
      {data.shared && <SharedBanner data={data} />}
    </div>
  );
}

function SharedBanner({ data }: { data: TripRouteData }) {
  const { t } = useV2();
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-o-sun/15 px-5 py-3.5 ring-1 ring-o-sun/40">
      <p className="text-[14.5px] font-semibold text-o-winedeep">{t("rmShared")}</p>
      {data.savedAll ? (
        <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-o-wine">
          <Check className="h-4 w-4" aria-hidden="true" />
          {t("rmSaved")}
        </span>
      ) : (
        <button type="button" onClick={data.saveShared} className="inline-flex h-10 items-center rounded-full bg-o-wine px-5 text-[14px] font-semibold text-o-sand transition-colors hover:bg-o-winedeep">
          {t("rmSave")}
        </button>
      )}
    </div>
  );
}

/** Підсумок великими цифрами: місць · км · у дорозі. */
export function Totals({ data, light = false, className = "" }: { data: TripRouteData; light?: boolean; className?: string }) {
  const { t, lang } = useV2();
  const n = data.stops.length;
  const items = [
    { v: String(n), w: plural(n, t("placeForms")) },
    { v: `${data.roadReady ? "" : "≈ "}${Math.round(data.total.km)}`, w: t("kmUnit") },
    { v: duration(data.total.min, lang), w: t("rmOnRoad") },
  ];
  return (
    <dl className={`flex flex-wrap gap-x-7 gap-y-2 ${className}`}>
      {items.map((x) => (
        <div key={x.w}>
          <dt className="sr-only">{x.w}</dt>
          <dd className="leading-tight">
            <span className={`text-[26px] font-extrabold tabular-nums ${light ? "text-o-sand" : "text-o-wine"}`}>{x.v}</span>{" "}
            <span className={`text-[13px] font-semibold ${light ? "text-o-sand/65" : "text-o-sea/55"}`}>{x.w}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Дії: найкоротший порядок (з підказкою, скільки зекономили), Google Maps, поділитися. */
export function RouteActions({ data, className = "", stretch = false }: { data: TripRouteData; className?: string; stretch?: boolean }) {
  const { t } = useV2();
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const ghost = `inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold ring-1 ring-o-sea/20 transition-colors hover:text-o-wine hover:ring-o-wine/40 ${stretch ? "flex-1 px-3 text-[13px]" : "px-4 text-[14px]"}`;
  const optimize = () => {
    const saved = data.optimizeOrder();
    setMsg(saved > 0.5 ? `${t("rmShorter")} ${Math.round(saved)} ${t("kmUnit")}` : t("rmAlreadyBest"));
    window.setTimeout(() => setMsg(""), 3000);
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: t("rmTitle1") + " " + t("rmTitle2"), url: data.shareUrl });
      else {
        await navigator.clipboard.writeText(data.shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* скасовано */
    }
  };
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {data.googleUrl && (
        <a href={data.googleUrl} target="_blank" rel="noreferrer" className={`inline-flex h-11 items-center justify-center gap-2 rounded-full bg-o-wine px-5 text-[14.5px] font-semibold text-o-sand transition-colors hover:bg-o-winedeep ${stretch ? "w-full" : ""}`}>
          <Navigation className="h-[17px] w-[17px]" aria-hidden="true" />
          {t("rmGoogle")}
        </a>
      )}
      {data.stops.length > 2 && (
        // Підказка-результат — плаваюча «бульбашка» над кнопкою: нічого не зсуває
        <span className={`relative ${stretch ? "flex flex-1" : "inline-flex"}`}>
          <button type="button" onClick={optimize} className={`${ghost} w-full`}>
            <Sparkles className="h-4 w-4 text-o-sun" aria-hidden="true" />
            {t("rmOptimize")}
          </button>
          <AnimatePresence>
            {msg && (
              // Центрування — на зовнішньому шарі: transform анімації перебив би -translate-x-1/2
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2.5 -translate-x-1/2">
                <motion.span
                  role="status"
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="relative block whitespace-nowrap rounded-full bg-o-sea px-3.5 py-1.5 text-[12.5px] font-semibold text-o-sand shadow-[0_12px_24px_-12px_rgba(0,20,50,0.7)]"
                >
                  <Sparkles className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-o-sun" aria-hidden="true" />
                  {msg}
                  <span className="absolute left-1/2 top-full -ml-1.5 border-x-[6px] border-t-[6px] border-x-transparent border-t-o-sea" aria-hidden="true" />
                </motion.span>
              </span>
            )}
          </AnimatePresence>
        </span>
      )}
      <button type="button" onClick={share} className={ghost}>
        {copied ? <Link2 className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
        {copied ? t("rmCopied") : t("rmShare")}
      </button>
    </div>
  );
}

/** Місця без координат — їх немає на карті. */
export function Missing({ data, className = "" }: { data: TripRouteData; className?: string }) {
  const { t } = useV2();
  if (!data.missing.length) return null;
  return (
    <div className={`rounded-[20px] bg-o-wine/[0.05] p-5 ring-1 ring-o-wine/15 ${className}`}>
      <p className="flex items-center gap-2 text-[14px] font-semibold text-o-wine">
        <MapPinOff className="h-4 w-4" aria-hidden="true" />
        {t("rmNoMapTitle")}
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {data.missing.map((m) => (
          <li key={m.o.id}>
            <Link to={objectDetailPath(m.o.type, m.o.slug)} className="text-[14px] text-o-sea/75 underline decoration-o-sea/25 underline-offset-2 hover:text-o-wine">
              {m.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Замало місць для маршруту. */
export function NotEnough() {
  const { t } = useV2();
  return (
    <Reveal className="mt-10 grid items-center gap-8 rounded-[28px] bg-[#fffaf5] p-6 shadow-[0_24px_50px_-36px_rgba(0,10,30,0.6)] ring-1 ring-o-sea/[0.06] sm:p-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <p className="text-[24px] font-bold leading-tight sm:text-[30px]">{t("trNeedTwo")}</p>
        <p className="mt-3 max-w-[520px] text-[15px] leading-relaxed text-o-sea/70">{t("rmNeedText")}</p>
        <Link to="/koshyk" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-o-wine px-5 text-[14.5px] font-semibold text-o-sand transition-colors hover:bg-o-winedeep">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("rmBack")}
        </Link>
      </div>
      <FoldedMap tone="cream" className="mx-auto hidden w-full max-w-[280px] -rotate-3 lg:block" />
    </Reveal>
  );
}

/**
 * Легка стрічка порядку зупинок під картою: маленькі картки (номер, кругле
 * фото, назва) в один ряд, між ними — пунктир із км і часом. Порядок
 * змінюється перетягуванням убік; × прибирає. Наведення — карта перелітає.
 */
export function StopStrip({ data, active, setActive }: { data: TripRouteData; active: number | null; setActive: (i: number | null) => void }) {
  const { t, lang } = useV2();
  // Краї, за якими є ще зупинки, м'яко тануть
  const box = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const check = () => setEdge({ start: el.scrollLeft < 6, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 6 });
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [data.stops.length]);
  const mask = `linear-gradient(90deg, ${edge.start ? "#000" : "transparent"} 0, #000 48px, #000 calc(100% - 64px), ${edge.end ? "#000" : "transparent"} 100%)`;
  return (
    // Прокрутка вбік обрізає все за краями — знизу запас під тінь (і під тінь при наведенні), від'ємне поле компенсує
    <div ref={box} className="no-scrollbar -mx-5 -mb-6 overflow-x-auto px-5 pb-12 pt-3 sm:-mx-10 sm:px-10" style={{ WebkitMaskImage: mask, maskImage: mask }}>
      <Reorder.Group axis="x" values={data.stops.map((s) => s.o.id)} onReorder={data.moveStop} className="flex w-max items-center" onMouseLeave={() => setActive(null)}>
        {data.stops.map((s, i) => (
          <StripItem key={s.o.id} s={s} leg={i < data.stops.length - 1 ? legLabel(data.legs[i], t("kmUnit"), lang) : ""} active={active === i} onActive={() => setActive(i)} onRemove={() => data.remove(s.o.id)} />
        ))}
      </Reorder.Group>
    </div>
  );
}

function StripItem({ s, leg, active, onActive, onRemove }: { s: RouteStop; leg: string; active: boolean; onActive: () => void; onRemove: () => void }) {
  const { t } = useV2();
  return (
    <Reorder.Item value={s.o.id} className="flex shrink-0 cursor-grab items-center active:cursor-grabbing" whileDrag={{ scale: 1.04, zIndex: 5 }}>
      <div
        onMouseEnter={onActive}
        className={`group relative flex w-[230px] items-center gap-3 rounded-[18px] bg-[#fffaf5] p-2.5 pr-8 ring-1 ring-o-sea/[0.06] transition-shadow ${
          active ? "shadow-[0_18px_34px_-20px_rgba(0,10,30,0.5)]" : "shadow-[0_12px_24px_-22px_rgba(0,10,30,0.55)]"
        }`}
      >
        <span className="relative shrink-0">
          <span className="block h-12 w-12 overflow-hidden rounded-full bg-o-sea/10">
            <Img src={s.o.imageUrl} w={120} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-o-wine text-[12px] font-bold text-o-sand ring-2 ring-[#fffaf5]">{s.n}</span>
        </span>
        <span className="min-w-0">
          <Link to={objectDetailPath(s.o.type, s.o.slug)} draggable={false} className="line-clamp-2 text-[13.5px] font-bold leading-snug transition-colors hover:text-o-wine">
            {s.name}
          </Link>
          {s.where && <span className="mt-0.5 block truncate text-[11.5px] text-o-sea/45">{s.where}</span>}
        </span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onRemove}
          aria-label={t("trRemove")}
          title={t("trRemove")}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-o-sea/30 opacity-0 transition-[opacity,colors] hover:bg-o-wine/10 hover:text-o-wine group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      {leg && (
        <span className="flex w-[150px] shrink-0 flex-col items-center px-2" aria-hidden="true">
          <span className="whitespace-nowrap text-[11.5px] font-semibold text-o-sea/50">{leg}</span>
          <span className="mt-1 w-full border-t-2 border-dotted border-o-wine/40" />
        </span>
      )}
    </Reorder.Item>
  );
}

/** Маленький маршрут — як на фоні («Стежки»): кільце старту, пунктир і мітка фінішу; м'яко проявляється. */
function TrailMark({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 260 120"
      className={className}
      aria-hidden="true"
      initial={reduce ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <path d="M22 92 C70 30 118 118 168 70 S228 34 238 46" fill="none" stroke="#9f1f47" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.1 9" />
      <circle cx="22" cy="92" r="7" fill="#fff2e8" stroke="#002f5e" strokeWidth="2.6" />
      <g transform="translate(238 46)">
        <path d="M0 -26c-7 0-12 5.3-12 11.8 0 8.7 12 21 12 21s12-12.3 12-21C12 -20.7 7 -26 0 -26z" fill="#9f1f47" />
        <circle cy="-14.5" r="4.3" fill="#fff2e8" />
      </g>
    </motion.svg>
  );
}
