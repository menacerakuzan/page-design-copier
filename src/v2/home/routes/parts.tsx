import { motion, useReducedMotion } from "framer-motion";
import { MapPin, Route as RouteIcon } from "lucide-react";
import { TAG_ICON } from "./tagIcons";
import type { RoutesData } from "./useRoutesData";

/**
 * Складена паперова мапа-гармошка біля кнопки «Відкрити маршрут»: по ній
 * один раз малюється шлях від старту до мітки, що підстрибує на фініші.
 */
export function FoldedMap({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 260 170" className={className} aria-hidden="true">
      {/* Три панелі гармошки */}
      <g stroke="#002f5e" strokeOpacity=".22" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M10 34 90 14v130l-80 20z" fill="#fbebdc" />
        <path d="M90 14l80 20v130l-80-20z" fill="#f1d9c3" />
        <path d="M170 34l80-20v130l-80 20z" fill="#fbebdc" />
      </g>
      {/* Річка й берег — ледь помітно */}
      <path d="M10 128q30-14 50-6t30 2 40 6 40-6 40 2 40-8" fill="none" stroke="#002f5e" strokeOpacity=".16" strokeWidth="1.4" />
      <path d="M200 40q10 18 30 22" fill="none" stroke="#002f5e" strokeOpacity=".14" strokeWidth="1.2" />
      {/* Маршрут */}
      <motion.path
        d="M32 132C58 70 104 128 132 88S196 40 222 66"
        fill="none"
        stroke="#9f1f47"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="3 7"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
      />
      {/* Старт */}
      <circle cx="32" cy="132" r="6" fill="#fff2e8" stroke="#9f1f47" strokeWidth="2.4" />
      {/* Проміжна зупинка */}
      <circle cx="132" cy="88" r="4.5" fill="#df9b3b" />
      {/* Мітка на фініші */}
      <g className="float-soft" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <path d="M222 30c-8 0-13 6-13 13 0 10 13 23 13 23s13-13 13-23c0-7-5-13-13-13z" fill="#9f1f47" />
        <circle cx="222" cy="43" r="4.6" fill="#fff2e8" />
      </g>
    </svg>
  );
}



/** Фільтри — компактні «таблетки» з маленькою іконкою; обрана — винна.
 *  Рядок гортається вбік, а прокрутка обрізає все за рамкою — тому знизу
 *  є запас (pb-5 / -mb-4), щоб тінь обраної таблетки не зрізалась. */
export function TagChips({ d, tags, value, onChange }: { d: RoutesData; tags: string[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="no-scrollbar -mx-5 -mb-4 flex gap-1.5 overflow-x-auto px-5 pb-5 pt-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label={d.t("routesKicker")}>
      {[null, ...tags].map((id) => {
        const Icon = id ? TAG_ICON[id] ?? MapPin : RouteIcon;
        const on = value === id;
        return (
          <button
            key={id ?? "all"}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(id)}
            className={`group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-all duration-300 ${
              on ? "bg-o-wine text-o-sand shadow-[0_8px_18px_-10px_rgba(159,31,71,0.9)]" : "bg-o-sea/[0.05] text-o-sea/80 hover:bg-o-sea/[0.1] hover:text-o-sea"
            }`}
          >
            <Icon className={`h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${on ? "text-o-sun" : "text-o-wine"}`} aria-hidden="true" />
            {id ? d.tagLabel(id) : d.t("allTags")}
          </button>
        );
      })}
    </div>
  );
}
