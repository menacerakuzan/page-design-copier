import { useState } from "react";
import { Link } from "react-router-dom";
import { resizedImageUrl } from "@/lib/img";
import { Img, PHOTO_FALLBACK } from "@/components/Img";
import { Reveal } from "@/v2/components/ui";
import { DISTRICT_SHAPES, shapeBox } from "@/v2/lib/districtShapes";
import { Stats, anchor } from "./parts";
import type { DistrictItem } from "./useDistricts";

/**
 * Фото, вписане в справжній контур району. Тінь намальована всередині самого
 * SVG (розмита копія контуру), а не CSS-фільтром: фільтр Chrome обрізав по
 * межах сусідніх плиток, коли одна з них піднімалась при наведенні.
 */
function Silhouette({ it }: { it: DistrictItem }) {
  const box = shapeBox(it.slug);
  const shape = DISTRICT_SHAPES[it.slug];
  if (!box || !shape) return null;
  // Квадратний кадр із запасом під тінь — щоб усі плитки були одного розміру.
  const size = Math.max(box.w, box.h);
  const side = size * 1.3;
  const vx = box.x + box.w / 2 - side / 2;
  const vy = box.y + box.h / 2 - side / 2;
  const id = `sil-${it.slug}`;
  const src = it.image ? resizedImageUrl(it.image, 760) : PHOTO_FALLBACK;
  // Одиниці карти → підйом і зсув тіні пропорційно розміру контуру.
  const lift = size * 0.035;
  return (
    <svg viewBox={`${vx} ${vy} ${side} ${side}`} className="aspect-square w-full" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-c`}>
          <path d={shape.d} />
        </clipPath>
        <filter id={`${id}-s`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={size * 0.035} />
        </filter>
      </defs>
      {/* Тінь: при наведенні опускається й розходиться, ніби контур піднявся */}
      <path
        d={shape.d}
        fill="#001e46"
        filter={`url(#${id}-s)`}
        className="opacity-25 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-30"
        style={{ transform: `translateY(${lift}px)` }}
      />
      <g
        className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: "translateY(var(--lift, 0px))" }}
      >
        <g clipPath={`url(#${id}-c)`}>
          <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#002f5e" />
          <image
            href={src}
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            preserveAspectRatio="xMidYMid slice"
            className="transition-transform duration-700 ease-out [transform-box:fill-box] [transform-origin:center] group-hover:scale-[1.06]"
          />
        </g>
        <path d={shape.d} fill="none" stroke="#fff2e8" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

/**
 * Варіант 2 «Силуети». Сім плиток: фото кожного району — у формі самого району.
 * При наведенні поруч з'являється звичайне прямокутне фото (у силуеті його
 * погано видно) — з того боку, де більше місця. Плитка веде на сторінку району.
 */
export function Silhouettes({ items, onHover }: { items: DistrictItem[]; onHover: (slug: string | null) => void }) {
  // З якого боку показати фото: ближче до центру екрана, щоб не вилазило за край.
  const [side, setSide] = useState<Record<string, "left" | "right">>({});
  return (
    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-12 sm:gap-x-10 sm:gap-y-16">
      {items.map((it, i) => {
        const s = side[it.slug] ?? "right";
        return (
          <Reveal
            as="li"
            key={it.slug}
            delay={(i % 4) * 0.08}
            className="relative w-[calc(50%-12px)] hover:z-20 sm:w-[calc(33.333%-27px)] lg:w-[calc(25%-30px)]"
          >
            <article
              id={anchor(it.slug)}
              className="group relative scroll-mt-28 [--lift:0px] hover:[--lift:-14px]"
              onMouseEnter={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const next = r.left + r.width / 2 < window.innerWidth / 2 ? "right" : "left";
                if (next !== s) setSide((p) => ({ ...p, [it.slug]: next }));
                onHover(it.slug);
              }}
              onMouseLeave={() => onHover(null)}
            >
              <Silhouette it={it} />

              {/* Чітке фото — лише на пристроях із наведенням (на телефоні дотик веде на сторінку) */}
              <div
                className={`pointer-events-none absolute top-[6%] z-10 hidden w-[58%] opacity-0 transition-[opacity,transform] duration-300 ease-out [@media(hover:hover)]:block group-hover:opacity-100 ${
                  s === "right"
                    ? "left-[78%] -rotate-2 translate-x-2 group-hover:translate-x-0"
                    : "right-[78%] rotate-2 -translate-x-2 group-hover:translate-x-0"
                }`}
                aria-hidden="true"
              >
                <div className="rounded-[10px] bg-[#fffaf5] p-1.5 shadow-[0_22px_40px_-18px_rgba(0,10,30,0.6)]">
                  <Img src={it.image} w={480} alt="" className="aspect-[4/3] w-full rounded-[6px] object-cover" />
                </div>
              </div>

              <h2 className="mt-3 text-center text-[19px] font-bold leading-tight tracking-[-0.01em] sm:text-[22px]">
                {/* Уся плитка клікабельна: посилання розтягнуто на картку (after:inset-0) */}
                <Link to={`/raion/${it.slug}`} className="transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-o-wine">
                  {it.short}
                </Link>
              </h2>
              <p className="mt-1 text-center text-[13px] leading-snug text-o-sea/75 sm:text-[14px]">{it.tagline}</p>
              <Stats it={it} short className="mt-1.5 text-center !text-[12.5px]" />
            </article>
          </Reveal>
        );
      })}
    </ul>
  );
}
