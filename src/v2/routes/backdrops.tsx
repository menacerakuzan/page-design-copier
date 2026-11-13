/*
 * Фон сторінки «Маршрути» між пунктирними «дорогами» — «Стежки» (обрано
 * власником): по аркушу розкидані маленькі маршрути — кільце старту, винний
 * пунктир і мітка фінішу. Одна плитка SVG, що повторюється; ледь помітна,
 * донизу тане перед підвалом. Інші варіанти («Горизонталі», «Умовні
 * позначки») — у useful/v2/routes/backdrops-all.tsx.
 */

// Згори стежки починаються нижче першої пунктирної «дороги» (смуга ~200px),
// щоб не лізли на неї; донизу — тануть перед підвалом.
const fade = "linear-gradient(180deg, transparent 0, transparent 190px, #000 300px, #000 calc(100% - 160px), transparent 100%)";

function trailsTile() {
  const S = 520;
  const trails = [
    { d: "M60 90 C120 40 170 150 230 100", s: [60, 90], e: [230, 100] },
    { d: "M330 60 C380 110 440 40 470 120", s: [330, 60], e: [470, 120] },
    { d: "M120 300 C160 240 250 360 300 290 S380 250 400 320", s: [120, 300], e: [400, 320] },
    { d: "M40 440 C90 400 140 480 200 430", s: [40, 440], e: [200, 430] },
    { d: "M320 450 C360 410 420 490 480 440", s: [320, 450], e: [480, 440] },
  ];
  const pin = (x: number, y: number) =>
    `<g transform="translate(${x} ${y - 2})"><path d="M0 -14c-4 0-7 3-7 7 0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z" fill="#9f1f47"/><circle cy="-7" r="2.4" fill="#fff2e8"/></g>`;
  let out = "";
  for (const t of trails) {
    out += `<path d="${t.d}" fill="none" stroke="#9f1f47" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 7"/>`;
    out += `<circle cx="${t.s[0]}" cy="${t.s[1]}" r="4" fill="none" stroke="#002f5e" stroke-width="1.6"/>`;
    out += pin(t.e[0], t.e[1]);
  }
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${out}</svg>`, size: S };
}

const TILE = trailsTile();

export function TrailsBackdrop({ opacity = 0.1 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
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
