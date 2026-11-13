import { useState } from "react";
import { X } from "lucide-react";
import { useV2 } from "@/v2/i18n";
import { DISTRICT_SHAPES, MAP_H, MAP_W } from "@/v2/lib/districtShapes";
import type { RoutesPageData } from "./useRoutesPage";

/**
 * Карта-фільтр у шапці: просто сім районів. Клік додає район до вибору
 * (винний), ще клік — прибирає; обрати можна скільки завгодно. Показуються
 * маршрути, що проходять хоча б одним обраним районом; нічого не обрано —
 * усі маршрути.
 */
export function DistrictPicker({ data }: { data: RoutesPageData }) {
  const { t, lang } = useV2();
  const [hover, setHover] = useState<string | null>(null);
  const { districts, toggleDistrict, clearDistricts, districtNames } = data;
  const slugs = Object.keys(DISTRICT_SHAPES);
  const picked = districts.map((s) => districtNames.get(s)?.short).filter(Boolean);

  return (
    <figure className="flex items-center gap-5 lg:flex-col lg:items-end lg:gap-1.5">
      <svg
        viewBox={`-6 -6 ${MAP_W + 12} ${MAP_H + 12}`}
        className="h-[150px] w-auto shrink-0 overflow-visible sm:h-[170px] lg:h-[180px]"
        role="group"
        aria-label={lang === "en" ? "Filter routes by district" : "Фільтр маршрутів за районами"}
        onMouseLeave={() => setHover(null)}
      >
        {slugs.map((slug) => {
          const on = districts.includes(slug);
          const hot = hover === slug;
          return (
            <path
              key={slug}
              d={DISTRICT_SHAPES[slug].d}
              role="button"
              tabIndex={0}
              aria-pressed={on}
              aria-label={districtNames.get(slug)?.name ?? slug}
              onMouseEnter={() => setHover(slug)}
              onFocus={() => setHover(slug)}
              onBlur={() => setHover(null)}
              onClick={() => toggleDistrict(slug)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggleDistrict(slug))}
              fill={on ? (hot ? "#b8325c" : "#9f1f47") : hot ? "rgba(159,31,71,0.2)" : "rgba(0,47,94,0.06)"}
              stroke={on ? "#fff2e8" : "rgba(0,47,94,0.38)"}
              strokeWidth={on ? 3 : 1.6}
              strokeLinejoin="round"
              className="cursor-pointer outline-none transition-[fill,stroke] duration-300 focus-visible:stroke-o-sun"
            />
          );
        })}
      </svg>

      {/* Підпис: район під курсором, обрані райони або підказка */}
      <figcaption className="min-w-0 max-w-[260px] text-[13px] leading-snug lg:text-right" aria-live="polite">
        {hover ? (
          <span className="font-semibold text-o-wine">{districtNames.get(hover)?.name}</span>
        ) : picked.length ? (
          <span className="font-semibold text-o-sea">{picked.join(", ")}</span>
        ) : (
          <span className="text-o-sea/50">{t("rtPickDistrict")}</span>
        )}
        {districts.length > 0 && (
          <button
            type="button"
            onClick={clearDistricts}
            className="mt-2 flex items-center gap-1 rounded-full bg-o-sea/[0.06] px-2.5 py-1 text-[12px] font-semibold text-o-sea/75 transition-colors hover:bg-o-wine hover:text-o-sand lg:ml-auto"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            {t("rtReset")}
          </button>
        )}
      </figcaption>
    </figure>
  );
}
