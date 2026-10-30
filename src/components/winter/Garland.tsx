import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from "framer-motion";
import { useWinterTheme } from "@/lib/winterTheme";
import { useLang } from "@/lib/langContext";

/**
 * Гірлянда вздовж верхнього краю екрана + шнурок-вимикач.
 *
 * Гірлянда — один SVG на всю ширину: провід провисає «фестонами», лампочки
 * висять уздовж кривої під кутом дотичної. Кольори — синій і червоний сайту,
 * золото й крижаний білий. Мерехтіння — CSS «біжучою хвилею» (затримка за
 * номером лампочки), тож працює без JS-таймерів і застигає при «зменшити рух».
 *
 * Шнурок (ідея — Pull Cord Lamp з 21st.dev, тут спрощено до пружини
 * framer-motion): потягни вниз — гірлянда і сніг вимикаються/вмикаються.
 * Це звичайна кнопка з aria-pressed, тож працює і з клавіатури.
 */

const COLORS = ["#3d8bff", "#e8304f", "#ffc23d", "#dff3ff", "#3d8bff", "#e8304f"];
const TOP = 3;

type Bulb = { x: number; y: number; angle: number; color: string; i: number };

function layout(width: number) {
  const swag = width < 640 ? 120 : width < 1200 ? 170 : 210;
  // Невелике провисання: лампочки мають лишатись над текстом шапки (~22 px від верху).
  const sag = width < 640 ? 3 : 6;
  const n = Math.max(2, Math.round(width / swag));
  const step = width / n;
  const perSwag = width < 640 ? 3 : 4;
  let d = `M0 ${TOP}`;
  const bulbs: Bulb[] = [];
  for (let k = 0; k < n; k++) {
    const x0 = k * step;
    const x1 = x0 + step;
    const cx = x0 + step / 2;
    const cy = TOP + sag * 2;
    d += ` Q${cx} ${cy} ${x1} ${TOP}`;
    for (let j = 1; j <= perSwag; j++) {
      const t = j / (perSwag + 1);
      const u = 1 - t;
      const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
      const y = u * u * TOP + 2 * u * t * cy + t * t * TOP;
      const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx);
      const dy = 2 * u * (cy - TOP) + 2 * t * (TOP - cy);
      const i = bulbs.length;
      bulbs.push({ x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI, color: COLORS[i % COLORS.length], i });
    }
  }
  return { d, bulbs };
}

export default function Garland() {
  const { lightsOn, setLightsOn } = useWinterTheme();
  const { lang } = useLang();
  const reduce = useReducedMotion();
  const [width, setWidth] = useState(() => (typeof window === "undefined" ? 1280 : window.innerWidth));

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const { d, bulbs } = layout(width);
  // Шнурок — біля правого краю, поза «пігулкою» шапки (вона закінчується за 60 px від краю).
  const cordX = width - (width < 640 ? 22 : 32);

  return (
    <div className="winter-garland pointer-events-none fixed inset-x-0 top-0 z-[45] h-[28px] print:hidden" data-lights={lightsOn ? "on" : "off"}>
      <svg width="100%" height="28" viewBox={`0 0 ${width} 28`} preserveAspectRatio="none" aria-hidden="true" className="overflow-visible">
        <defs>
          <radialGradient id="wg-glow">
            <stop offset="0" stopColor="#fff" stopOpacity=".9" />
            <stop offset=".35" stopColor="#fff" stopOpacity=".35" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={d} fill="none" stroke="#0b2440" strokeWidth="1.6" opacity=".85" />
        <path d={d} fill="none" stroke="#3b6a9a" strokeWidth=".6" opacity=".6" transform="translate(0 -.6)" />
        {bulbs.map((b) => (
          <g key={b.i} transform={`translate(${b.x} ${b.y}) rotate(${b.angle})${width < 640 ? " scale(.72)" : ""}`}>
            {/* лампочка висить перпендикулярно проводу */}
            <g transform="rotate(90) translate(2 0)">
              <circle className="wg-glow" cx="6.5" cy="0" r="7.5" fill={b.color} style={{ animationDelay: `${(b.i * 0.18) % 3.6}s` }} />
              <rect x="-1" y="-1.8" width="3.2" height="3.6" rx=".8" fill="#24364b" />
              <ellipse className="wg-bulb" cx="6.6" cy="0" rx="4.6" ry="2.7" fill={b.color} style={{ animationDelay: `${(b.i * 0.18) % 3.6}s` }} />
              <ellipse cx="5.6" cy="-.9" rx="1.5" ry=".6" fill="#fff" opacity=".75" />
            </g>
          </g>
        ))}
      </svg>
      <PullCord x={cordX} on={lightsOn} onToggle={() => setLightsOn(!lightsOn)} reduce={!!reduce} lang={lang} />
    </div>
  );
}

function PullCord({ x, on, onToggle, reduce, lang }: { x: number; on: boolean; onToggle: () => void; reduce: boolean; lang: "uk" | "en" }) {
  const y = useMotionValue(0);
  const cordHeight = useTransform(y, (v) => 46 + v);
  const swing = useMotionValue(0);
  const dragged = useRef(false);

  const jolt = () => {
    if (reduce) return;
    animate(swing, [0, -9, 6, -3, 0], { duration: 1.1, ease: "easeOut" });
  };
  const toggle = () => {
    onToggle();
    jolt();
  };

  const label = on
    ? (lang === "en" ? "Turn off the garland and snow" : "Вимкнути гірлянду і сніг")
    : (lang === "en" ? "Turn on the garland and snow" : "Увімкнути гірлянду і сніг");

  return (
    // Зовнішній шар — ледь помітне погойдування, внутрішній — поштовх після смикання.
    <motion.div
      className="absolute top-[3px] w-[30px] origin-top"
      style={{ left: x - 15 }}
      animate={reduce ? undefined : { rotate: [0, 2.2, 0, -2.2, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
     <motion.div className="relative origin-top" style={{ rotate: swing }}>
      <motion.div className="mx-auto w-px bg-gradient-to-b from-[#0b2440] to-[#5a7ea3]" style={{ height: cordHeight }} />
      <motion.button
        type="button"
        aria-pressed={on}
        aria-label={label}
        title={label}
        className="pointer-events-auto absolute left-1/2 top-[44px] -ml-[13px] flex h-[34px] w-[26px] cursor-grab touch-none flex-col items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#df9b3b] active:cursor-grabbing"
        style={{ y }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 34 }}
        dragElastic={0.15}
        dragSnapToOrigin
        onDragStart={() => { dragged.current = false; }}
        onDrag={(_, info) => { if (info.offset.y > 20) dragged.current = true; }}
        onDragEnd={() => { if (dragged.current) toggle(); }}
        onClick={() => {
          // Клік після перетягування вже оброблено в onDragEnd.
          if (dragged.current) { dragged.current = false; return; }
          toggle();
        }}
      >
        {/* ялинкова кулька: золотий ковпачок + червона куля з відблиском */}
        <span className="block h-[5px] w-[8px] rounded-t-sm bg-[#d9a336]" />
        <span
          className="block h-[22px] w-[22px] rounded-full shadow-[0_4px_10px_-2px_rgba(0,20,50,0.45)] transition-[filter] duration-500"
          style={{
            background: "radial-gradient(circle at 35% 30%, #ff8aa0 0%, #e8304f 35%, #9f1f47 75%, #6d1230 100%)",
            filter: on ? "none" : "saturate(0.35) brightness(0.8)",
          }}
        />
      </motion.button>
     </motion.div>
    </motion.div>
  );
}
