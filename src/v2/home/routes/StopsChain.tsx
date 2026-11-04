import { useId, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flag, MapPin } from "lucide-react";
import { Img } from "@/components/Img";
import type { Route } from "@/lib/routesRepository";
import { EASE, PillLink } from "@/v2/components/ui";
import type { RoutesData } from "./useRoutesData";
import { useWidth } from "./useWidth";

const MAX = 5;
const LABEL = 36; // висота підпису над колом (2 рядки)

type P = { x: number; y: number };

/** Кубічна Безьє в точці t. */
const bez = (a: P, c1: P, c2: P, b: P, t: number): P => {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
};

/**
 * Стежка між двома точками: основа — плавна крива (униз від картки, потім
 * убік до наступної), поверх — м'які хвилясті вигини, що згасають на кінцях.
 */
function trail(a: P, b: P, dir: 1 | -1) {
  const c1 = { x: a.x + dir * Math.abs(b.x - a.x) * 0.25, y: a.y + Math.max(20, (b.y - a.y) * 0.9) };
  const c2 = { x: b.x - dir * Math.abs(b.x - a.x) * 0.45, y: b.y };
  const N = 48;
  const pts: P[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = bez(a, c1, c2, b, t);
    const q = bez(a, c1, c2, b, Math.min(1, t + 0.01));
    // Нормаль до кривої.
    const dx = q.x - p.x;
    const dy = q.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const off = Math.sin(t * Math.PI * 3) * Math.sin(t * Math.PI) * 6;
    pts.push({ x: p.x - (dy / len) * off, y: p.y + (dx / len) * off });
  }
  return pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join("");
}

/**
 * Варіант 1: зупинки маршруту на «аркуші блокнота» — фото-прямокутники
 * з назвами над ними, «драбинкою» згори вниз (ліворуч, правіше, ліворуч…),
 * з'єднані фігурною пунктирною стежкою: з низу верхньої картки — у бік
 * наступної. Більше 5 зупинок — стежка йде у хвилю внизу.
 */
export function StopsChain({ d, r }: { d: RoutesData; r: Route }) {
  const all = d.stopsOf(r);
  const stops = all.slice(0, MAX);
  const more = all.length - stops.length;
  const box = useRef<HTMLDivElement>(null);
  const w = useWidth(box);
  const maskId = useId();
  const n = stops.length;

  const narrow = w > 0 && w < 480;
  const D = narrow ? 80 : 88; // діаметр кола
  const LW = narrow ? 146 : 176; // ширина підпису
  const item = LABEL + 6 + D;
  const step = item * 0.66;
  const WAVE = more > 0 ? 64 : 0;
  const H = n ? (n - 1) * step + item + WAVE + 6 : 0;

  // Центр кола й верх блоку (підпис + коло).
  const pos = (i: number) => {
    const cx = w * (i % 2 === 0 ? (narrow ? 0.28 : 0.3) : narrow ? 0.72 : 0.66);
    const y = i * step;
    const cy = y + LABEL + 6 + D / 2;
    return { cx, y, cy };
  };

  // Стежки: з низу кола i — у бік кола i+1.
  let path = "";
  for (let i = 1; i < n; i++) {
    const q = pos(i - 1);
    const p = pos(i);
    const toRight = p.cx > q.cx;
    const a = { x: q.cx + (toRight ? 1 : -1) * D * 0.36, y: q.cy + D * 0.36 + 6 };
    const b = { x: p.cx + (toRight ? -1 : 1) * (D / 2 + 8), y: p.cy + 4 };
    path += trail(a, b, toRight ? 1 : -1);
  }
  if (more > 0 && n) {
    const q = pos(n - 1);
    const a = { x: q.cx, y: q.cy + D / 2 + 6 };
    path += trail(a, { x: w / 2, y: H - 18 }, a.x < w / 2 ? 1 : -1);
  }

  return (
    // Тонка рамка + «картографія» всередині: сітка, що тане до країв,
    // роза вітрів і масштабна лінійка — як у блоці карти районів.
    <div className="relative overflow-hidden rounded-[28px] bg-o-sand px-5 pb-6 pt-5 ring-1 ring-o-sea/[0.12] sm:px-7 sm:pb-7 sm:pt-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage: "linear-gradient(#002f5e 1px, transparent 1px), linear-gradient(90deg, #002f5e 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          backgroundPosition: "center",
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, #000 35%, transparent 100%)",
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, #000 35%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      {/* Роза вітрів — правий верхній кут */}
      <svg viewBox="-56 -62 112 118" className="pointer-events-none absolute right-5 top-5 w-[74px] sm:right-7 sm:top-6 sm:w-[86px]" aria-hidden="true">
        <g stroke="#002f5e" strokeOpacity=".32" fill="none">
          <circle r="34" strokeDasharray="2 4" />
          <circle r="22" />
          <path d="M0 -44 L5 -5 L0 0 L-5 -5 Z M0 44 L5 5 L0 0 L-5 5 Z" fill="#002f5e" fillOpacity=".3" />
          <path d="M-44 0 L-5 -5 L0 0 L-5 5 Z M44 0 L5 -5 L0 0 L5 5 Z" />
        </g>
        <text y="-50" textAnchor="middle" fontSize="12" fontWeight={700} fill="#002f5e" fillOpacity=".45">{d.lang === "en" ? "N" : "Пн"}</text>
      </svg>

      {/* Старт */}
      <p className="relative mb-1 inline-flex items-center gap-1.5 rounded-full bg-o-sea px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-o-sand">
        <MapPin className="h-3 w-3" aria-hidden="true" />
        {d.lang === "en" ? "Start" : "Старт"}
      </p>

      <div ref={box} className="relative" style={{ height: H || 160 }}>
        {w > 0 && n > 1 && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <defs>
              <mask id={maskId} maskUnits="userSpaceOnUse">
                <motion.path key={r.id} d={path} fill="none" stroke="#fff" strokeWidth="26" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: "easeInOut" }} />
              </mask>
            </defs>
            {/* М'яка тінь стежки + пунктир */}
            <path d={path} fill="none" stroke="#9f1f47" strokeOpacity=".08" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" mask={`url(#${maskId})`} />
            <path d={path} fill="none" stroke="#9f1f47" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1.5 8" mask={`url(#${maskId})`} />
            {more > 0 && (
              <g fill="none" stroke="#002f5e" strokeLinecap="round" transform={`translate(${w / 2 - 60} ${H - 24})`}>
                <path d="M0 8q7.5-7 15 0t15 0 15 0 15 0 15 0 15 0 15 0 15 0" strokeOpacity=".3" strokeWidth="2" />
                <path d="M15 19q7.5-7 15 0t15 0 15 0 15 0 15 0 15 0" strokeOpacity=".16" strokeWidth="2" />
              </g>
            )}
          </svg>
        )}

        {w > 0 &&
          stops.map((s, i) => {
            const p = pos(i);
            const finish = i === n - 1 && more === 0 && n > 1;
            return (
              <motion.div
                key={`${r.id}-${s.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.25, ease: EASE }}
                className="absolute"
                style={{ left: p.cx - LW / 2, top: p.y, width: LW, zIndex: 10 + i }}
              >
                <Link to={s.href} className="group flex flex-col items-center text-center">
                  {/* Назва над колом */}
                  <span className="flex items-end justify-center" style={{ height: LABEL }}>
                    <span className="line-clamp-2 text-[13px] font-bold leading-tight transition-colors group-hover:text-o-wine">{s.name}</span>
                  </span>
                  {/* Коло з фото: біле кільце + тонке пунктирне коло навколо */}
                  <span className="relative mt-1.5 block" style={{ width: D, height: D }}>
                    <span className="absolute -inset-[7px] rounded-full border border-dashed border-o-wine/35 transition-transform duration-700 group-hover:rotate-45" aria-hidden="true" />
                    <span className="block h-full w-full overflow-hidden rounded-full bg-o-sand2 ring-4 ring-o-sand shadow-[0_14px_26px_-14px_rgba(0,30,70,0.65)] transition-transform duration-500 group-hover:scale-[1.06]">
                      <Img src={s.image} w={220} alt="" className="h-full w-full object-cover" />
                    </span>
                    <span className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-o-wine text-[12px] font-bold text-o-sand ring-2 ring-o-sand">{i + 1}</span>
                    {finish && (
                      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-o-sun text-o-sea ring-2 ring-o-sand" title={d.lang === "en" ? "Finish" : "Фініш"}>
                        <Flag className="h-3 w-3" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                </Link>
              </motion.div>
            );
          })}

        {more > 0 && (
          <p className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[12px] font-semibold text-o-sea/50">
            + {more} {d.stopsWord(more)}
          </p>
        )}
      </div>
      {/* Низ рамки: кнопка маршруту й легенда */}
      <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3">
        <PillLink to={`/marshruty/${r.id}`} tone="sun">
          {d.t("openRoute")}
        </PillLink>
        <p className="flex items-center gap-2 text-[11.5px] font-medium text-o-sea/55" aria-hidden="true">
          <svg width="34" height="8" viewBox="0 0 34 8">
            <path d="M1 4q4-4 8 0t8 0 8 0 8 0" fill="none" stroke="#9f1f47" strokeWidth="2" strokeLinecap="round" strokeDasharray="1.5 5" />
          </svg>
          {d.lang === "en" ? "route" : "маршрут"}
          {r.distance && <span className="text-o-sea/40">· {r.distance}</span>}
        </p>
      </div>
    </div>
  );
}
