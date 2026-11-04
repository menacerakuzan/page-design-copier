/**
 * Фон блоку «Готові маршрути»: кілька ледь помітних звивистих пунктирних
 * доріг через увесь блок, з крапками-зупинками. Пунктир повільно «їде».
 * Тане догори й донизу.
 */
const ROADS = [
  { d: "M-40 70C180 20 330 120 560 66S900 10 1100 70 1330 110 1480 50", c: "#002f5e", o: 0.12, dur: 70 },
  { d: "M-40 380C160 300 300 470 470 410S760 290 930 380 1240 520 1480 430", c: "#9f1f47", o: 0.16, dur: 60 },
  { d: "M-40 600C140 690 330 530 520 600S860 730 1030 630 1300 530 1480 620", c: "#002f5e", o: 0.1, dur: 75 },
  { d: "M-40 830C200 760 380 900 600 840S980 740 1180 830 1380 880 1480 850", c: "#9f1f47", o: 0.12, dur: 68 },
];
// Крапки-зупинки лише на краях, щоб не лізти на текст списку.
const STOPS: [number, number, string][] = [
  [560, 66, "#002f5e"],
  [60, 352, "#9f1f47"],
  [1395, 445, "#9f1f47"],
  [70, 640, "#002f5e"],
  [1390, 600, "#002f5e"],
  [600, 840, "#9f1f47"],
];

export function RoadsBackdrop() {
  const fade = "linear-gradient(to bottom, transparent 0%, #000 4%, #000 88%, transparent 100%)";
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      style={{ maskImage: fade, WebkitMaskImage: fade }}
    >
      {ROADS.map((r, i) => (
        <path
          key={i}
          d={r.d}
          fill="none"
          stroke={r.c}
          strokeOpacity={r.o}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="2 10"
          vectorEffect="non-scaling-stroke"
          className="road-move"
          style={{ animationDuration: `${r.dur}s` }}
        />
      ))}
      {STOPS.map(([x, y, c], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="9" fill="none" stroke={c} strokeOpacity=".14" strokeWidth="1.5" />
          <circle cx={x} cy={y} r="3.5" fill={c} fillOpacity=".22" />
        </g>
      ))}
    </svg>
  );
}
