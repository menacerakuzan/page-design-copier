import { useMemo } from "react";

/**
 * Фон «Варто побачити» — «Рябь»: тихі хвилясті лінії (5–10% кольору) під
 * каруселлю, тануть догори й донизу. Інші варіанти фону — у useful/.
 */

const FADE_Y = "linear-gradient(to bottom, transparent 0%, #000 10%, #000 84%, transparent 100%)";

const RW = 1440;
const RH = 640;
const RL = 240; // довжина хвилі — на неї й зсувається кожен ряд (безшовно)
// Ряди йдуть і за межі шару — тож у зоні розмиття вгорі й унизу хвилі є і плавно тануть.
const R_GAP = RH / 16;
const R_ROWS = 19;

/** Ряди тонких хвилястих ліній, що повільно пливуть у різні боки. */
function Ripple() {
  const W = RW, H = RH;
  const paths = useMemo(() => {
    const W = RW, H = RH, L = RL, gap = R_GAP, rows = R_ROWS;
    return Array.from({ length: rows }, (_, i) => {
      const y0 = (i - 0.5) * gap;
      const t = Math.min(1, Math.max(0, y0 / H));
      // Посередині (де фото) хвилі вищі, до країв — спокійніші.
      const A = 3 + 9 * Math.sin(Math.PI * t);
      const ph = i * 0.9;
      let d = "";
      for (let x = -L; x <= W + L; x += 8) {
        const k = (x / L) * Math.PI * 2;
        const y = y0 + A * Math.sin(k + ph) + A * 0.35 * Math.sin(2 * k + ph * 1.7);
        d += `${x === -L ? "M" : "L"}${x} ${y.toFixed(1)}`;
      }
      return { d, dur: 26 + (i % 5) * 5, dir: i % 2 ? "reverse" : "normal", wine: i === 7 || i === 12 };
    });
  }, []);

  return (
    <svg
      className="h-full w-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ maskImage: FADE_Y, WebkitMaskImage: FADE_Y }}
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={p.wine ? "#9f1f47" : "#002f5e"}
          strokeOpacity={p.wine ? 0.12 : 0.09}
          strokeWidth={1.2}
          vectorEffect="non-scaling-stroke"
          className="ripple-row"
          style={{ animationDuration: `${p.dur}s`, animationDirection: p.dir }}
        />
      ))}
    </svg>
  );
}

/** Шар під каруселлю: виходить трохи вище (до заголовка) і нижче (до краю блоку). */
export function RippleBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 -bottom-10 -top-40 -z-10 sm:-bottom-14 sm:-top-44">
      <Ripple />
    </div>
  );
}
