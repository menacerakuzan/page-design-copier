import { useMemo } from "react";

/**
 * Фон блоку «Сервіси»: розсип дрібних значків самих сервісів — зірочки
 * AI-гіда, сердечка «Мого маршруту», мітки «Поблизу», галочки гідів,
 * а ще крапки й кільця. Різного розміру й нахилу, ледь помітні, тихо
 * погойдуються. Тане догори й донизу.
 */
const SHAPES = {
  sparkle: "M12 2c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
  pin: "M12 21s-6-5.7-6-11a6 6 0 0 1 12 0c0 5.3-6 11-6 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  check: "M12 3l2.3 1.7 2.9-.2.9 2.7 2.4 1.6-.9 2.7.9 2.7-2.4 1.6-.9 2.7-2.9-.2L12 21l-2.3-1.7-2.9.2-.9-2.7-2.4-1.6.9-2.7-.9-2.7 2.4-1.6.9-2.7 2.9.2zM8.5 12l2.4 2.4 4.6-4.6",
  ring: "M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z",
  plus: "M12 6v12M6 12h12",
} as const;
type Shape = keyof typeof SHAPES;

const COLORS = ["#9f1f47", "#df9b3b", "#002f5e"];
// Заливка для сердечок і зірочок, решта — контуром.
const FILLED: Shape[] = ["sparkle", "heart"];

export function ScatterBackdrop() {
  const items = useMemo(() => {
    let seed = 11;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const kinds: Shape[] = ["sparkle", "heart", "pin", "check", "ring", "plus", "sparkle", "heart", "pin"];
    // Рівномірно по сітці 8×5 з випадковим зсувом — щоб не злипалось.
    const out = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        if (rnd() < 0.18) continue;
        const kind = kinds[Math.floor(rnd() * kinds.length)];
        out.push({
          kind,
          x: (col + 0.15 + rnd() * 0.7) * (100 / 8),
          y: (row + 0.15 + rnd() * 0.7) * (100 / 5),
          size: 12 + rnd() * 16,
          rot: -25 + rnd() * 50,
          color: COLORS[Math.floor(rnd() * COLORS.length)],
          op: 0.16 + rnd() * 0.14,
          dur: 5 + rnd() * 4,
          delay: -rnd() * 6,
        });
      }
    }
    return out;
  }, []);

  const fade = "linear-gradient(to bottom, transparent 0%, #000 10%, #000 90%, transparent 100%)";
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true" style={{ maskImage: fade, WebkitMaskImage: fade }}>
      {items.map((it, i) => {
        const filled = FILLED.includes(it.kind);
        return (
          <span key={i} className="float-soft absolute" style={{ left: `${it.x}%`, top: `${it.y}%`, animationDuration: `${it.dur}s`, animationDelay: `${it.delay}s` }}>
            <svg
              viewBox="0 0 24 24"
              width={it.size}
              height={it.size}
              style={{ transform: `rotate(${it.rot}deg)`, opacity: it.op }}
              fill={filled ? it.color : "none"}
              stroke={filled ? "none" : it.color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fillRule="evenodd"
            >
              <path d={SHAPES[it.kind]} />
            </svg>
          </span>
        );
      })}
    </div>
  );
}
