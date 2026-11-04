import { motion, useReducedMotion } from "framer-motion";
import { Clock, Footprints, MapPin, Route as RouteIcon } from "lucide-react";
import { TAG_ICON } from "./tagIcons";
import { Img } from "@/components/Img";
import type { Route } from "@/lib/routesRepository";
import type { RoutesData } from "./useRoutesData";

/**
 * Прикраса біля заголовка: складена паперова мапа-гармошка, по якій
 * малюється маршрут від старту до мітки, що підстрибує на фініші.
 */
export function FoldedMap() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 260 170" className="pointer-events-none absolute right-[110px] top-[46px] hidden w-[190px] -rotate-3 lg:block" aria-hidden="true">
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



/** Фільтри — компактні «таблетки» з маленькою іконкою; обрана — винна. */
export function TagChips({ d, tags, value, onChange }: { d: RoutesData; tags: string[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 py-1 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={d.t("routesKicker")}>
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

/** Час · відстань · кількість зупинок — що є. */
export function RouteMeta({ d, r, light = false }: { d: RoutesData; r: Route; light?: boolean }) {
  const n = d.stopsOf(r).length;
  const tone = light ? "text-o-sand/80" : "text-o-sea/60";
  const icon = light ? "text-o-sun" : "text-o-wine";
  return (
    <span className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] ${tone}`}>
      {r.duration && <span className="inline-flex items-center gap-1.5"><Clock className={`h-3.5 w-3.5 ${icon}`} aria-hidden="true" />{r.duration}</span>}
      {r.distance && <span className="inline-flex items-center gap-1.5"><Footprints className={`h-3.5 w-3.5 ${icon}`} aria-hidden="true" />{r.distance}</span>}
      {n > 0 && <span className="inline-flex items-center gap-1.5"><MapPin className={`h-3.5 w-3.5 ${icon}`} aria-hidden="true" />{n} {d.stopsWord(n)}</span>}
    </span>
  );
}

/** Список маршрутів праворуч: більші фото, назва, час/відстань/зупинки. */
export function RouteList({ d, list, current, onPick }: { d: RoutesData; list: Route[]; current?: Route; onPick: (id: string) => void }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {list.map((r) => {
        const on = r.id === current?.id;
        return (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => onPick(r.id)}
              aria-pressed={on}
              className={`group relative flex w-full items-center gap-4 rounded-[18px] p-2 pr-4 text-left transition-colors ${on ? "bg-o-sand2" : "hover:bg-o-sand2/60"}`}
            >
              {/* Винна позначка обраного */}
              <span className={`absolute -left-3 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full bg-o-wine transition-all duration-300 ${on ? "opacity-100" : "scale-y-0 opacity-0"}`} aria-hidden="true" />
              <span className={`relative h-[84px] w-[112px] shrink-0 overflow-hidden rounded-[14px] bg-o-sand2 transition-shadow ${on ? "shadow-[0_12px_24px_-14px_rgba(0,30,70,0.6)]" : ""}`}>
                <Img src={r.imageUrl} w={300} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`line-clamp-2 text-[15.5px] font-bold leading-snug transition-colors ${on ? "text-o-wine" : "group-hover:text-o-wine"}`}>{d.tl(r.name, r.nameEn)}</span>
                <span className="mt-1.5 block">
                  <RouteMeta d={d} r={r} />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
