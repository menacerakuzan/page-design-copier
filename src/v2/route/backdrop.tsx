/*
 * Фон сторінки маршруту — «Горизонталі»: топографічні лінії висот, як на
 * туристичній мапі місцевості (виділяється серед сторінок: у районів і
 * пунктів — сітка, у списку маршрутів — «Стежки»). Одна плитка SVG, ледь
 * помітна; донизу тане перед підвалом.
 */

const fade = "linear-gradient(180deg, #000 0%, #000 calc(100% - 160px), transparent 100%)";

/** Детермінований «випадковий» генератор — щоб плитка була однакова щоразу. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ── 1. Горизонталі: топографічні лінії висот, як на туристичній мапі ── */

function contourTile() {
  const S = 560;
  const rand = rng(7);
  // Пагорби: центр, кількість ліній, крок
  const hills = [
    { x: 140, y: 150, n: 6, r0: 14 },
    { x: 420, y: 120, n: 4, r0: 10 },
    { x: 330, y: 390, n: 7, r0: 12 },
    { x: 90, y: 440, n: 3, r0: 10 },
  ];
  let paths = "";
  for (const h of hills) {
    const ph = [rand() * 6, rand() * 6, rand() * 6];
    for (let i = 0; i < h.n; i++) {
      const r = h.r0 + i * 13;
      let d = "";
      const N = 64;
      for (let k = 0; k <= N; k++) {
        const a = (k / N) * Math.PI * 2;
        const wob = 1 + 0.16 * Math.sin(a * 2 + ph[0]) + 0.09 * Math.sin(a * 3 + ph[1] + i * 0.3) + 0.05 * Math.sin(a * 5 + ph[2]);
        const px = h.x + Math.cos(a) * r * wob * 1.25;
        const py = h.y + Math.sin(a) * r * wob * 0.85;
        d += `${k ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`;
      }
      // Кожна п'ята лінія — товща (як «потовщені горизонталі» на картах)
      const w = i === h.n - 1 && h.n > 4 ? 1.6 : 1;
      paths += `<path d="${d}Z" fill="none" stroke="#002f5e" stroke-width="${w}"/>`;
    }
  }
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${paths}</svg>`, size: S };
}

const TILE = contourTile();

export function ContoursBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: 0.08,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(TILE.svg)}")`,
        backgroundSize: `${TILE.size}px ${TILE.size}px`,
        backgroundPosition: "center top",
        WebkitMaskImage: fade,
        maskImage: fade,
      }}
      aria-hidden="true"
    />
  );
}
