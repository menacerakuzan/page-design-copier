/**
 * Фон «Види туризму» — «Дудли»: дрібні значки подорожей, ледь помітні,
 * тануть догори й донизу (м'яко відділяють блок від сусідів).
 * Інші варіанти фону — у useful/.
 */

const FADE = "linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)";
const maskStyle = { maskImage: FADE, WebkitMaskImage: FADE } as const;

/** Дрібні лінійні значки подорожей, розкидані з поворотами. */
function Doodles() {
  const navy = "#002f5e";
  const wine = "#9f1f47";
  // [x, y, поворот, колір, малюнок]
  const glyphs: [number, number, number, string, string][] = [
    [34, 44, -12, navy, "M0-10v22M-7-6h14M-9 6c2 6 6 8 9 8s7-2 9-8M0-17a3 3 0 1 0 .01 0"], // якір
    [212, 92, 0, wine, "M0 0a6 6 0 1 0 .01 0M0-11v-4M0 11v4M-11 0h-4M11 0h4M-8-8l-3-3M8 8l3 3M8-8l3-3M-8 8l-3 3"], // сонце
    [96, 132, 15, navy, "M0-8 2-2 8 0 2 2 0 8-2 2-8 0-2-2z"], // зірочка
    [46, 196, 0, navy, "M-14 0q3.5-4 7 0t7 0 7 0 7 0"], // хвиля
    [186, 206, -20, wine, "M0 8c-6-6-4-14 6-18 3 9 1 15-6 18zM0 8l5-14"], // листок
    [150, 34, 10, wine, "M-4 0a2.6 2.6 0 1 0 .01 0M2 0a2.6 2.6 0 1 0 .01 0M-1 5a2.6 2.6 0 1 0 .01 0M-1-5a2.6 2.6 0 1 0 .01 0M-1-8c0-3 2-5 5-6"], // виноград
    [240, 168, 0, navy, "M-3 0a3 3 0 1 0 .01 0"], // крапка
    [120, 250, -8, navy, "M0-9v14M3-7l8 12H3zM-2-5l-6 10h6M-10 6h20l-3 4h-14z"], // вітрильник
  ];
  return (
    <svg className="h-full w-full" aria-hidden="true" style={maskStyle}>
      <defs>
        <pattern id="mood-doodles" width="260" height="280" patternUnits="userSpaceOnUse">
          {glyphs.map(([x, y, r, col, d], i) => (
            <path
              key={i}
              d={d}
              transform={`translate(${x} ${y}) rotate(${r})`}
              fill="none"
              stroke={col}
              strokeOpacity={col === navy ? 0.13 : 0.16}
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mood-doodles)" />
    </svg>
  );
}

export function DoodlesBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10">
      <Doodles />
    </div>
  );
}
