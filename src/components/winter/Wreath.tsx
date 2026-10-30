/**
 * Різдвяний вінок. Гілки генеруються детерміновано (seeded PRNG) з окремих
 * хвоїнок у трьох шарах глибини — темний, середній, світлий — тож вінок
 * виглядає «пухким», а не як зелений бублик. Зверху на кінчиках — іній,
 * далі грона ягід, шишки, кульки у кольорах сайту (синій, золото), теплі
 * вогники та атласний бант бордового кольору сайту.
 *
 * Усе — один SVG; геометрія рахується один раз на модуль (≈2 тис. відрізків
 * у кількох <path>), тож навіть два вінки на сторінці коштують копійки.
 */

const CX = 150;
const CY = 150;
const R = 94;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

type Layer = { needles: string; stems: string; frost: string; tips: string };

/** Шар гілочок: `count` гілочок навколо кола, хвоїнки обабіч стебла під кутом уперед. */
function sprigLayer(seed: number, count: number, spread: number, length: [number, number], needle: number): Layer {
  const rand = rng(seed);
  let needles = "";
  let stems = "";
  let frost = "";
  let tips = "";
  for (let k = 0; k < count; k++) {
    const theta = (k / count) * Math.PI * 2 + rand() * 0.18;
    const rr = R + (rand() * 2 - 1) * spread;
    // Гілочки «течуть» за годинниковою стрілкою, зовнішні трохи відхилені назовні.
    const phi = theta + Math.PI / 2 + (rand() - 0.5) * 0.7 + ((rr - R) / R) * 1.6;
    const len = length[0] + rand() * (length[1] - length[0]);
    const bend = (rand() - 0.5) * 0.5;
    const bx = CX + rr * Math.cos(theta);
    const by = CY + rr * Math.sin(theta);
    const steps = 7;
    stems += `M${f(bx)} ${f(by)}`;
    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      const a = phi + bend * t;
      const x = bx + Math.cos(phi + bend * t * 0.5) * len * t;
      const y = by + Math.sin(phi + bend * t * 0.5) * len * t;
      stems += `L${f(x)} ${f(y)}`;
      const nl = needle * (1.15 - 0.55 * t) * (0.85 + rand() * 0.3);
      for (const side of [-1, 1]) {
        const na = a + side * (0.95 + rand() * 0.25);
        const nx = x + Math.cos(na) * nl;
        const ny = y + Math.sin(na) * nl;
        const seg = `M${f(x)} ${f(y)}L${f(nx)} ${f(ny)}`;
        // Іній лягає на верхню половину вінка, ближче до кінчиків.
        if (Math.sin(theta) < 0 && t > 0.55 && rand() < 0.22) frost += seg;
        else if (t > 0.7) tips += seg;
        else needles += seg;
      }
    }
  }
  return { needles, stems, frost, tips };
}

const BACK = sprigLayer(11, 72, 24, [30, 46], 9);
const MID = sprigLayer(23, 66, 18, [26, 40], 8.2);
const FRONT = sprigLayer(37, 54, 13, [22, 32], 7.4);

// Декор по колу; кут 90° — низ, там бант, тож його оминаємо.
const deg = (d: number) => (d * Math.PI) / 180;
const at = (d: number, r = R) => [CX + r * Math.cos(deg(d)), CY + r * Math.sin(deg(d))] as const;

const BERRIES = [-150, -95, -40, 10, 150, 195, 240, 300].map((d, i) => {
  const [x, y] = at(d, R + (i % 2 ? 9 : -8));
  return [
    [x, y],
    [x + 6, y + 3],
    [x + 1.5, y + 7],
  ] as const;
});
const BALLS: { d: number; r: number; tone: "navy" | "gold" | "ice"; off: number }[] = [
  { d: -120, r: 8.5, tone: "navy", off: 12 },
  { d: -60, r: 6.5, tone: "gold", off: -12 },
  { d: 35, r: 7.5, tone: "ice", off: 13 },
  { d: 140, r: 7.5, tone: "navy", off: -10 },
  { d: 205, r: 6.5, tone: "gold", off: 12 },
  { d: 270, r: 6, tone: "ice", off: -14 },
];
const CONES = [-15, 175, 255].map((d, i) => ({ pos: at(d, R + (i === 1 ? 10 : -6)), rot: d + 90 }));
const LIGHTS = Array.from({ length: 16 }, (_, i) => {
  const d = -170 + i * 21.5;
  return { pos: at(d, R + ((i * 7) % 3 - 1) * 12), delay: (i * 0.41) % 2.4 };
}).filter(({ pos }) => pos[1] < CY + R * 0.82);

const TONE = {
  navy: ["#5f93d6", "#1d4f91", "#0b2a55"],
  gold: ["#fff1c2", "#e3b04b", "#9c6a10"],
  ice: ["#ffffff", "#cfe3f6", "#7fa6cc"],
} as const;

export function Wreath({ className = "", hanging = false, idPrefix = "wr" }: { className?: string; hanging?: boolean; idPrefix?: string }) {
  const id = (n: string) => `${idPrefix}-${n}`;
  return (
    <svg viewBox={hanging ? "0 -240 300 540" : "0 0 300 300"} className={className} aria-hidden="true">
      <defs>
        <radialGradient id={id("berry")} cx=".35" cy=".3" r=".75">
          <stop offset="0" stopColor="#ff7a86" />
          <stop offset=".45" stopColor="#d01d39" />
          <stop offset="1" stopColor="#6d0a1c" />
        </radialGradient>
        {(Object.keys(TONE) as (keyof typeof TONE)[]).map((t) => (
          <radialGradient key={t} id={id(`ball-${t}`)} cx=".35" cy=".3" r=".8">
            <stop offset="0" stopColor={TONE[t][0]} />
            <stop offset=".5" stopColor={TONE[t][1]} />
            <stop offset="1" stopColor={TONE[t][2]} />
          </radialGradient>
        ))}
        <linearGradient id={id("ribbon")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d23a68" />
          <stop offset=".5" stopColor="#9f1f47" />
          <stop offset="1" stopColor="#5e1029" />
        </linearGradient>
        <linearGradient id={id("ribbon-v")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7d1638" />
          <stop offset=".45" stopColor="#c42a58" />
          <stop offset="1" stopColor="#7d1638" />
        </linearGradient>
        <radialGradient id={id("cone")} cx=".4" cy=".35" r=".8">
          <stop offset="0" stopColor="#a8754a" />
          <stop offset="1" stopColor="#4b2c17" />
        </radialGradient>
        <radialGradient id={id("glow")}>
          <stop offset="0" stopColor="#ffe6a6" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffe6a6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {hanging && (
        <g>
          {/* стрічка, на якій висить вінок */}
          <path d={`M${CX - 7} -240H${CX + 7}V${CY - R - 6}H${CX - 7}Z`} fill={`url(#${id("ribbon-v")})`} />
          <path d={`M${CX - 1.5} -240V${CY - R - 6}`} stroke="#e8597f" strokeOpacity=".5" strokeWidth="1" />
        </g>
      )}

      {/* тінь-основа кільця */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#04241c" strokeOpacity=".6" strokeWidth="50" />

      <g fill="none" strokeLinecap="round">
        <path d={BACK.stems} stroke="#072b21" strokeWidth="1.8" />
        <path d={BACK.needles + BACK.tips + BACK.frost} stroke="#0c3a2d" strokeWidth="2.1" />
        <path d={MID.stems} stroke="#0b3527" strokeWidth="1.5" />
        <path d={MID.needles} stroke="#155240" strokeWidth="1.9" />
        <path d={MID.tips} stroke="#1f6a4f" strokeWidth="1.7" />
        <path d={MID.frost} stroke="#d9e8f3" strokeOpacity=".5" strokeWidth="1.4" />
        <path d={FRONT.stems} stroke="#10402f" strokeWidth="1.3" />
        <path d={FRONT.needles} stroke="#22704f" strokeWidth="1.7" />
        <path d={FRONT.tips} stroke="#3a8c66" strokeWidth="1.5" />
        <path d={FRONT.frost} stroke="#eef5fb" strokeOpacity=".7" strokeWidth="1.3" />
      </g>

      {CONES.map(({ pos: [x, y], rot }, i) => (
        <g key={i} transform={`translate(${f(x)} ${f(y)}) rotate(${rot})`}>
          <ellipse rx="6.5" ry="10" fill={`url(#${id("cone")})`} />
          {[-5, -1, 3, 7].map((cy) => (
            <path key={cy} d={`M-5.5 ${cy}Q0 ${cy + 3.5} 5.5 ${cy}`} fill="none" stroke="#2e190b" strokeOpacity=".7" strokeWidth=".9" />
          ))}
          <path d="M-3 -6Q0 -8.5 3 -6" fill="none" stroke="#f2f8fd" strokeOpacity=".8" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}

      {BERRIES.map((cluster, i) => (
        <g key={i}>
          {cluster.map(([x, y], j) => (
            <g key={j}>
              <circle cx={f(x)} cy={f(y)} r="4.4" fill={`url(#${id("berry")})`} />
              <circle cx={f(x - 1.4)} cy={f(y - 1.5)} r="1.1" fill="#fff" opacity=".8" />
            </g>
          ))}
        </g>
      ))}

      {BALLS.map(({ d, r, tone, off }, i) => {
        const [x, y] = at(d, R + off);
        return (
          <g key={i}>
            <rect x={f(x - 2.4)} y={f(y - r - 3.2)} width="4.8" height="3.6" rx=".8" fill="#c8952f" />
            <circle cx={f(x)} cy={f(y)} r={r} fill={`url(#${id(`ball-${tone}`)})`} />
            <ellipse cx={f(x - r * 0.35)} cy={f(y - r * 0.38)} rx={f(r * 0.28)} ry={f(r * 0.16)} fill="#fff" opacity=".85" transform={`rotate(-35 ${f(x - r * 0.35)} ${f(y - r * 0.38)})`} />
          </g>
        );
      })}

      {LIGHTS.map(({ pos: [x, y], delay }, i) => (
        <g key={i} className="winter-twinkle" style={{ animationDelay: `${delay}s` }}>
          <circle cx={f(x)} cy={f(y)} r="6" fill={`url(#${id("glow")})`} />
          <circle cx={f(x)} cy={f(y)} r="1.7" fill="#fff6d8" />
        </g>
      ))}

      {/* бант */}
      <g transform={`translate(${CX} ${CY + R + 4})`}>
        <path d="M-4 4C-10 22 -18 40 -26 58L-17 53L-12 62C-6 42 -1 22 2 6Z" fill={`url(#${id("ribbon")})`} />
        <path d="M4 4C11 22 20 40 29 56L19 52L15 62C8 42 3 22 -2 6Z" fill={`url(#${id("ribbon")})`} />
        <path d="M-5 -2C-22 -22 -48 -18 -46 -2C-44 12 -22 10 -5 4Z" fill={`url(#${id("ribbon")})`} />
        <path d="M5 -2C22 -22 48 -18 46 -2C44 12 22 10 5 4Z" fill={`url(#${id("ribbon")})`} />
        <path d="M-8 -3C-22 -14 -38 -13 -40 -4" fill="none" stroke="#f07a9c" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 -3C22 -14 38 -13 40 -4" fill="none" stroke="#f07a9c" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M-6 0C-14 2 -24 4 -30 2" fill="none" stroke="#4a0c22" strokeOpacity=".5" strokeWidth="1.2" />
        <path d="M6 0C14 2 24 4 30 2" fill="none" stroke="#4a0c22" strokeOpacity=".5" strokeWidth="1.2" />
        <rect x="-8" y="-8" width="16" height="14" rx="5" fill="#b52552" />
        <rect x="-5" y="-6" width="5" height="10" rx="2.5" fill="#e0517b" opacity=".55" />
      </g>
    </svg>
  );
}
