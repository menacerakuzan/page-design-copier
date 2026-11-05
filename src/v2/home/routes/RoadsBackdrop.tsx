/**
 * Фон блоку «Готові маршрути»: дві ледь помітні звивисті пунктирні дороги —
 * одна притиснута до верхнього краю блоку, друга до нижнього, щоб середина
 * (де зупинки й текст) лишалась вільною. Пунктир повільно «їде».
 * Кожна дорога — окрема смуга заввишки 200px, тож відстань до краю не
 * залежить від висоти блоку. Крапки-зупинки — лише біля країв екрана.
 */
const ROADS = [
  {
    edge: "top",
    d: "M-40 96C160 40 300 150 470 104S760 36 930 92 1240 156 1480 100",
    c: "#9f1f47",
    o: 0.16,
    dur: 60,
    stops: [[70, 79.8], [1385, 119.8]],
  },
  {
    edge: "bottom",
    d: "M-40 110C140 170 330 50 520 104S860 170 1030 96 1300 44 1480 104",
    c: "#002f5e",
    o: 0.12,
    dur: 72,
    stops: [[80, 127.2], [1375, 71.5]],
  },
] as const;

export function RoadsBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      {ROADS.map((r) => {
        // Смуга тане в бік краю блоку — м'який перехід до сусідньої секції.
        const fade = `linear-gradient(to ${r.edge === "top" ? "bottom" : "top"}, transparent 0%, #000 24%)`;
        return (
          <svg
            key={r.edge}
            className={`absolute inset-x-0 h-[200px] w-full ${r.edge === "top" ? "-top-4" : "-bottom-4"}`}
            viewBox="0 0 1440 200"
            preserveAspectRatio="xMidYMid slice"
            style={{ maskImage: fade, WebkitMaskImage: fade }}
          >
            <path
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
            {r.stops.map(([x, y]) => (
              <g key={x}>
                <circle cx={x} cy={y} r="9" fill="none" stroke={r.c} strokeOpacity=".14" strokeWidth="1.5" />
                <circle cx={x} cy={y} r="3.5" fill={r.c} fillOpacity=".22" />
              </g>
            ))}
          </svg>
        );
      })}
    </div>
  );
}
