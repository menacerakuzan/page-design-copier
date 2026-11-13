/*
 * Фон сторінки «Гіди» — «Умовні позначки»: значки з легенди туристичної мапи
 * (компас, мітка, прапорець, фортеця, виноград, хвилі, якір, дерево, храм,
 * бінокль) — про те, що гід проводить екскурсії. Ледь помітно; донизу тане.
 */

const fade = "linear-gradient(180deg, #000 0%, #000 calc(100% - 160px), transparent 100%)";

function legendTile() {
  const S = 460;
  const st = `fill="none" stroke="#002f5e" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"`;
  const icons: Record<string, string> = {
    // компас
    compass: `<circle r="11" ${st}/><path d="M0 -15V-11M0 11V15M-15 0H-11M11 0H15" ${st}/><path d="M0 -8L3 0L0 8L-3 0Z" fill="#9f1f47"/>`,
    // мітка
    pin: `<path d="M0 -12c-5 0-8 4-8 8 0 6 8 13 8 13s8-7 8-13c0-4-3-8-8-8z" ${st}/><circle cy="-4" r="2.6" ${st}/>`,
    // прапорець фінішу
    flag: `<path d="M-6 12V-12" ${st}/><path d="M-6 -12H8L4 -6L8 0H-6" ${st}/>`,
    // фортеця
    castle: `<path d="M-11 11V-4H-7V-8H-3V-4H3V-8H7V-4H11V11Z" ${st}/><path d="M-3 11V5A3 3 0 0 1 3 5V11" ${st}/>`,
    // виноград
    grape: `<circle cx="-4" cy="-2" r="3.2" ${st}/><circle cx="3" cy="-2" r="3.2" ${st}/><circle cx="-0.5" cy="4" r="3.2" ${st}/><circle cx="-0.5" cy="10" r="2.6" ${st}/><path d="M0 -6Q2 -11 6 -12" ${st}/>`,
    // хвилі (море, лимани)
    waves: `<path d="M-12 -3Q-8 -7 -4 -3T4 -3T12 -3M-12 4Q-8 0 -4 4T4 4T12 4" ${st}/>`,
    // якір
    anchor: `<circle cy="-10" r="2.6" ${st}/><path d="M0 -7V11M-6 -2H6M-10 4Q-9 11 0 11Q9 11 10 4" ${st}/>`,
    // дерево (природа)
    tree: `<path d="M0 12V2M0 -12L-8 2H8Z" ${st}/>`,
    // храм
    church: `<path d="M-8 12V0L0 -6L8 0V12Z" ${st}/><path d="M0 -6V-13M-2.5 -10.5H2.5" ${st}/>`,
    // бінокль
    binoc: `<circle cx="-5" cy="4" r="5" ${st}/><circle cx="5" cy="4" r="5" ${st}/><path d="M-5 -1V-7H-1V1M5 -1V-7H1V1" ${st}/>`,
  };
  const place: [string, number, number, number][] = [
    ["compass", 70, 70, -8],
    ["grape", 230, 50, 6],
    ["castle", 380, 90, -4],
    ["waves", 150, 170, 0],
    ["pin", 310, 200, 8],
    ["tree", 60, 260, -6],
    ["anchor", 420, 270, 10],
    ["church", 200, 320, 0],
    ["flag", 340, 390, -10],
    ["binoc", 90, 410, 6],
  ];
  const out = place.map(([k, x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})">${icons[k]}</g>`).join("");
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${out}</svg>`, size: S };
}

const TILE = legendTile();

export function LegendBackdrop() {
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
