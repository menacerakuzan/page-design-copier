import { useReducedMotion } from "framer-motion";
import { useV2 } from "@/v2/i18n";
import { Reveal } from "@/v2/components/ui";
import { DISTRICT_SHAPES, MAP_H, MAP_W } from "@/v2/lib/districtShapes";
import type { DistrictItem } from "./useDistricts";

/** Якір району в списку — однаковий в усіх варіантах (на нього веде клік по карті). */
export const anchor = (slug: string) => `d-${slug}`;

/** Плавно до району в списку (scroll-margin — у самого запису, під фіксованою шапкою). */
export function scrollToDistrict(slug: string, reduce: boolean | null) {
  document.getElementById(anchor(slug))?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/** Українська множина: forms = «місце|місця|місць». */
export function plural(n: number, forms: string) {
  const [one, few, many] = forms.split("|");
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

/** «35 місць · 5 населених пунктів» (short — «5 пунктів»). */
export function Stats({ it, short = false, className = "" }: { it: DistrictItem; short?: boolean; className?: string }) {
  const { t } = useV2();
  return (
    <p className={`text-[13.5px] leading-snug text-o-sea/60 ${className}`}>
      <span className="text-[15px] font-extrabold text-o-wine">{it.places}</span> {plural(it.places, t("placeForms"))}
      <span className="mx-1.5 text-o-sea/30" aria-hidden="true">·</span>
      <span className="text-[15px] font-extrabold text-o-wine">{it.cities.length}</span>{" "}
      {plural(it.cities.length, t(short ? "settlementShortForms" : "settlementForms"))}
    </p>
  );
}

/**
 * Невелика карта області праворуч від заголовка: показує, де який район.
 * Наведення на район у списку підсвічує його тут; клік по карті — до району в списку.
 */
function HeadMap({ items, hot, onHover }: { items: DistrictItem[]; hot: string | null; onHover: (slug: string | null) => void }) {
  const { lang } = useV2();
  const reduce = useReducedMotion();
  const current = items.find((i) => i.slug === hot);
  return (
    // Підпис — поверх місця під картою (absolute): довга назва («Білгород-Дністровський»)
    // інакше розширювала колонку, і карта смикалась ліворуч.
    <figure className="relative pb-7">
      <svg
        viewBox={`-6 -6 ${MAP_W + 12} ${MAP_H + 12}`}
        className="h-[170px] w-auto overflow-visible lg:h-[200px]"
        role="group"
        aria-label={lang === "en" ? "Map of Odesa Region districts" : "Карта районів Одеської області"}
        onMouseLeave={() => onHover(null)}
      >
        {items.map((it) => {
          const on = hot === it.slug;
          return (
            <path
              key={it.slug}
              d={DISTRICT_SHAPES[it.slug].d}
              tabIndex={0}
              role="link"
              aria-label={it.name}
              onMouseEnter={() => onHover(it.slug)}
              onFocus={() => onHover(it.slug)}
              onClick={() => scrollToDistrict(it.slug, reduce)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), scrollToDistrict(it.slug, reduce))}
              fill={on ? "#9f1f47" : "rgba(0,47,94,0.06)"}
              stroke={on ? "#fff2e8" : "rgba(0,47,94,0.4)"}
              strokeWidth={on ? 2.5 : 1.4}
              strokeLinejoin="round"
              className="cursor-pointer outline-none transition-[fill,stroke] duration-300 focus-visible:stroke-o-sun"
            />
          );
        })}
      </svg>
      {/* Підпис під картою: назва району під курсором */}
      <figcaption className="absolute bottom-0 right-0 whitespace-nowrap text-right text-[13px] font-semibold text-o-wine" aria-live="polite">
        {current?.short ?? ""}
      </figcaption>
    </figure>
  );
}

/** Заголовок сторінки: ліворуч кікер, h1 і фраза; праворуч (з md) — невелика карта. */
export function PageHead({ items, hot, onHover }: {
  items: DistrictItem[];
  hot: string | null;
  onHover: (slug: string | null) => void;
}) {
  const { t } = useV2();
  return (
    <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
      <Reveal>
        <p className="mb-3 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
          <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
          {t("distKicker")}
        </p>
        <h1 className="text-[38px] font-bold leading-[1] tracking-[-0.02em] sm:text-[48px] lg:text-[60px]">
          {t("distTitle1")} <span className="ital text-o-wine">{t("distTitle2")}</span>
        </h1>
        <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-o-sea/70 sm:text-[16px]">{t("distLead")}</p>
      </Reveal>
      {items.length > 0 && (
        <Reveal delay={0.1} className="hidden md:block">
          <HeadMap items={items} hot={hot} onHover={onHover} />
        </Reveal>
      )}
    </div>
  );
}

/* ── Фони сторінки (замість старих патернів) ───────────────────────────── */

/** «Сітка» — тонка сітка аркуша карти, рівна по всій сторінці (лише в самому низу м'яко сходить нанівець). */
export function GridBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.08]"
      style={{
        backgroundImage: "linear-gradient(#002f5e 1px, transparent 1px), linear-gradient(90deg, #002f5e 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        backgroundPosition: "center top",
        WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 calc(100% - 160px), transparent 100%)",
        maskImage: "linear-gradient(180deg, #000 0%, #000 calc(100% - 160px), transparent 100%)",
      }}
      aria-hidden="true"
    />
  );
}
