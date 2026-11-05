import { useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Img } from "@/components/Img";
import type { Route } from "@/lib/routesRepository";
import { EASE, PillLink } from "@/v2/components/ui";
import type { RoutesData } from "./useRoutesData";
import { metaLine } from "./shared";
import { FoldedMap } from "./parts";
import { plain } from "@/v2/i18n";
import { useWidth } from "./useWidth";

const MAX = 6;

/**
 * Варіант 1 «Легкий ланцюжок»: назви маршрутів — текстовими вкладками,
 * під ними зупинки обраного маршруту одним рядком: фото-кружки на
 * пунктирній стежці через усю ширину. Без рамок, сітки й компаса.
 */
export function RoutesLight({ d, list }: { d: RoutesData; list: Route[] }) {
  const [sel, setSel] = useState<string | null>(null);
  const current = list.find((r) => r.id === sel) ?? list[0];
  if (!current) return null;
  const desc = plain(d.tl(current.description, current.descriptionEn));

  return (
    <div className="mt-7">
      {/* Вкладки-назви */}
      <div role="tablist" aria-label={d.t("routesKicker")} className="no-scrollbar -mx-5 flex gap-7 overflow-x-auto border-b border-o-sea/10 px-5 sm:mx-0 sm:px-0">
        {list.map((r) => {
          const on = r.id === current.id;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSel(r.id)}
              className={`relative max-w-[260px] shrink-0 truncate pb-3 pt-1 text-[15px] font-semibold transition-colors ${on ? "text-o-wine" : "text-o-sea/50 hover:text-o-sea"}`}
            >
              {d.tl(r.name, r.nameEn)}
              {on && <motion.span layoutId="rt-light-tab" className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-o-wine" transition={{ duration: 0.4, ease: EASE }} />}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        <AnimatePresence mode="wait">
          <motion.div key={current.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <Trail d={d} r={current} />
          </motion.div>
        </AnimatePresence>
        <div className="mt-6 grid gap-5 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12">
          <AnimatePresence mode="wait">
            <motion.div key={current.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="min-w-0">
              <h3 className="max-w-[720px] text-[22px] font-bold leading-tight tracking-[-0.015em] sm:text-[28px]">{d.tl(current.name, current.nameEn)}</h3>
              <p className="mt-2 text-[14px] text-o-sea/60">{metaLine(d, current)}</p>
              {/* Опис — два рядки */}
              {desc && <p className="mt-3 line-clamp-2 max-w-[660px] text-[15px] leading-relaxed text-o-sea/70">{desc}</p>}
            </motion.div>
          </AnimatePresence>
          {/* Кнопка й складена мапа — поза анімацією зміни маршруту: мапа малюється
              один раз, коли блок з'являється, і не перезапускається при перемиканні. */}
          <div className="flex items-center justify-between gap-6 lg:justify-end lg:self-center">
            <PillLink to={`/marshruty/${current.id}`} tone="wine">
              {d.t("openRoute")}
            </PillLink>
            <FoldedMap className="pointer-events-none w-[118px] shrink-0 -rotate-3 sm:w-[150px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Зупинки одним рядком: кружки трохи «гойдаються» вгору-вниз, між ними — пунктир. */
function Trail({ d, r }: { d: RoutesData; r: Route }) {
  const all = d.stopsOf(r);
  const stops = all.slice(0, MAX);
  const more = all.length - stops.length;
  const box = useRef<HTMLDivElement>(null);
  const w = useWidth(box);
  const maskId = useId();
  const n = stops.length + (more > 0 ? 1 : 0);

  const narrow = w > 0 && w < 640;
  const D = narrow ? 76 : 96; // діаметр кружка
  const SLOT = narrow ? 128 : 170; // мінімальна ширина на одну зупинку
  const inner = Math.max(w, n * SLOT); // на телефоні рядок може гортатися вбік
  const SWAY = narrow ? 14 : 20;
  const top = SWAY + 8;
  const H = top + D + SWAY + 50;

  const cx = (i: number) => (n === 1 ? inner / 2 : SLOT / 2 + (i * (inner - SLOT)) / (n - 1));
  const cy = (i: number) => top + D / 2 + (i % 2 === 0 ? -SWAY : SWAY) * (n > 1 ? 1 : 0);

  let path = "";
  for (let i = 0; i < n - 1; i++) {
    const x1 = cx(i) + D / 2 + 8;
    const x2 = cx(i + 1) - D / 2 - 8;
    const y1 = cy(i);
    const y2 = cy(i + 1);
    const k = (x2 - x1) / 2;
    path += `M${x1} ${y1}C${x1 + k} ${y1} ${x2 - k} ${y2} ${x2} ${y2}`;
  }

  return (
    <div ref={box} className="no-scrollbar -mx-5 mt-7 overflow-x-auto px-5 sm:mx-0 sm:mt-9 sm:px-0">
      <div className="relative" style={{ width: inner || "100%", height: H }}>
        {w > 0 && n > 1 && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse">
                <motion.path d={path} fill="none" stroke="#fff" strokeWidth="24" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: "easeInOut" }} />
              </mask>
            </defs>
            <path d={path} fill="none" stroke="#9f1f47" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1.5 8" mask={`url(#${maskId})`} />
          </svg>
        )}
        {w > 0 &&
          stops.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 + i * 0.12, ease: EASE }}
              className="absolute"
              style={{ left: cx(i) - SLOT / 2, top: cy(i) - D / 2, width: SLOT }}
            >
              <Link to={s.href} className="group flex flex-col items-center text-center">
                <span className="block overflow-hidden rounded-full bg-o-sand2 ring-4 ring-o-sand shadow-[0_14px_26px_-14px_rgba(0,30,70,0.6)] transition-transform duration-500 group-hover:scale-[1.06]" style={{ width: D, height: D }}>
                  <Img src={s.image} w={240} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="mt-2.5 line-clamp-2 px-1 text-[13px] font-semibold leading-tight transition-colors group-hover:text-o-wine">{s.name}</span>
              </Link>
            </motion.div>
          ))}
        {w > 0 && more > 0 && (
          <Link
            to={`/marshruty/${r.id}`}
            className="absolute flex items-center justify-center rounded-full border-2 border-dashed border-o-wine/35 text-[15px] font-bold text-o-wine transition-colors hover:bg-o-wine/5"
            style={{ left: cx(n - 1) - D / 2, top: cy(n - 1) - D / 2, width: D, height: D }}
          >
            +{more}
          </Link>
        )}
      </div>
    </div>
  );
}
