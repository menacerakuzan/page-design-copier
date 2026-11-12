import { useState } from "react";
import { Grid2x2, Grid3x3 } from "lucide-react";
import { useV2 } from "@/v2/i18n";

export type GridCols = 3 | 4;

const KEY = "v2-grid-cols";

/** Скільки карток у ряду на ПК (4 — за замовчуванням). Вибір запам'ятовується в браузері відвідувача. */
export function useGridCols() {
  const [cols, setCols] = useState<GridCols>(() => {
    try {
      return localStorage.getItem(KEY) === "3" ? 3 : 4;
    } catch {
      return 4;
    }
  });
  const set = (c: GridCols) => {
    setCols(c);
    try {
      localStorage.setItem(KEY, String(c));
    } catch {
      /* приватний режим тощо — просто не запам'ятовуємо */
    }
  };
  return [cols, set] as const;
}

/** Класи сітки карток: на телефоні — 2 в ряд, на ПК — 4 або 3. */
export const gridColsClass = (cols: GridCols) =>
  cols === 3 ? "grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3" : "grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4";

/**
 * Перемикач щільності сітки: 4 в ряд / 3 в ряд — дві іконки-сітки в «пігулці»
 * тієї ж висоти, що й фільтри-чипи поруч (32px). Видно лише на ПК (на телефоні завжди 2 в ряд).
 */
export function GridToggle({ cols, onChange, className = "" }: { cols: GridCols; onChange: (c: GridCols) => void; className?: string }) {
  const { lang } = useV2();
  const items = [
    { c: 4 as const, Icon: Grid3x3, label: lang === "en" ? "4 per row" : "По 4 в ряд" },
    { c: 3 as const, Icon: Grid2x2, label: lang === "en" ? "3 per row" : "По 3 в ряд" },
  ];
  return (
    <div role="group" aria-label={lang === "en" ? "Grid density" : "Вигляд сітки"} className={`hidden h-8 shrink-0 items-center rounded-full bg-o-sea/[0.06] p-[3px] lg:flex ${className}`}>
      {items.map(({ c, Icon, label }) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={cols === c}
          aria-label={label}
          title={label}
          className={`flex h-[26px] w-8 items-center justify-center rounded-full transition-colors ${cols === c ? "bg-o-wine text-o-sand" : "text-o-sea/60 hover:text-o-wine"}`}
        >
          <Icon className="h-[15px] w-[15px]" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
