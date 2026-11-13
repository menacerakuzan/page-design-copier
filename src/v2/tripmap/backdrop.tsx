/*
 * Фон сторінки «Ваш маршрут» — розкидані значки зупинок (мітки на мапі):
 * різного розміру й кольору, злегка повернуті. Одна плитка SVG, що
 * повторюється; ледь помітно; донизу тане перед підвалом.
 */

const fade = "linear-gradient(180deg, #000 0%, #000 calc(100% - 160px), transparent 100%)";

function pinsTile() {
  const S = 560;
  // x, y, масштаб, поворот, колір — небагато й дрібні
  const pins: [number, number, number, number, string][] = [
    [70, 90, 0.6, -8, "#9f1f47"],
    [330, 60, 0.5, 6, "#002f5e"],
    [470, 250, 0.65, 10, "#9f1f47"],
    [190, 330, 0.55, -6, "#002f5e"],
    [400, 470, 0.5, 8, "#9f1f47"],
  ];
  const pin = (c: string) =>
    `<path d="M0 -22c-7 0-12 5-12 11.5 0 8.5 12 20.5 12 20.5s12-12 12-20.5C12 -17 7 -22 0 -22z" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><circle cy="-10.5" r="4" fill="none" stroke="${c}" stroke-width="2"/>`;
  const body = pins.map(([x, y, k, r, c]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${k})">${pin(c)}</g>`).join("");
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${body}</svg>`, size: S };
}

const TILE = pinsTile();

export function PinsBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity: 0.1,
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
