import { ArrowUpRight, Clock, MapPin, Route as RouteIcon } from "lucide-react";
import type { Route } from "@/lib/routesRepository";
import type { RoutesData } from "@/v2/home/routes/useRoutesData";
import { ClampTitle } from "./ClampTitle";
import { PreviewMedia } from "@/v2/routes/PreviewMedia";
import { hasPreview } from "@/v2/routes/RoutePreviewMap";
import { useDistrictNames, useRouteItem, type RouteItem } from "@/v2/routes/routeItem";
import { usePreviewHover } from "@/v2/routes/usePreviewHover";

/*
 * Картка маршруту «Картка» (обрана власником 2026-11-12) — одна на весь сайт:
 * сторінка «Маршрути» і блоки «Маршрути через …» на сторінках району, пункту,
 * місця, видів туризму й маршруту. При наведенні — міні-карта маршруту
 * (src/v2/routes/PreviewMedia.tsx). Прибрати її з якоїсь сторінки — додати
 * картці проп-перемикач.
 * Інші варіанти («Журнал», «Зупинки», «Шлях») і стара горизонтальна картка —
 * у useful/v2/components/routeCards-variants.tsx.
 */

function Title({ r, d, light = false, className = "" }: { r: Route; d: RoutesData; light?: boolean; className?: string }) {
  return (
    <h3 className={`flex items-start gap-1.5 font-bold leading-snug ${className}`}>
      <ClampTitle to={`/marshruty/${r.id}`} text={d.tl(r.name, r.nameEn)} hoverClass={light ? "" : "group-hover:text-o-wine"} />
      <ArrowUpRight
        className={`mt-0.5 h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100 ${light ? "text-o-sunsoft" : "text-o-wine"}`}
        aria-hidden="true"
      />
    </h3>
  );
}

/** «6 годин · 20 км · 3 зупинки» під фото — тихий винний рядок з маленькими іконками. */
export function RouteFacts({ r, d, n }: { r: Route; d: RoutesData; n: number }) {
  const items = [
    r.duration ? { Icon: Clock, text: r.duration } : null,
    r.distance ? { Icon: RouteIcon, text: r.distance } : null,
    n ? { Icon: MapPin, text: `${n} ${d.stopsWord(n)}` } : null,
  ].filter(Boolean) as { Icon: typeof Clock; text: string }[];
  if (!items.length) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] font-semibold text-o-wine/85">
      {items.map(({ Icon, text }) => (
        <span key={text} className="inline-flex items-center gap-1">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {text}
        </span>
      ))}
    </p>
  );
}

/**
 * 4 «Картка»: невеликий прямокутник на світлій підкладці — фото згори
 * (чисте — без затемнення й плашок), під ним на підкладці «час · км ·
 * зупинки» з іконками, назва і зупинки через стрілки. При наведенні замість
 * фото — міні-карта маршруту; на телефоні — кнопка-іконка в куті фото.
 */
export function RouteCard({ r, d, item }: { r: Route; d: RoutesData; item?: RouteItem }) {
  const stops = d.stopsOf(r);
  // Міні-карта при наведенні: сторінка «Маршрути» передає вже пораховану
  // (item), решта сторінок — рахує тут.
  const own = useRouteItem(item ? null : r);
  const x = item ?? own;
  const names = useDistrictNames();
  const can = !!x && hasPreview(x);
  const hover = usePreviewHover(can);
  return (
    <article {...hover.handlers} className="group relative flex h-full flex-col overflow-hidden rounded-[18px] bg-[#fffaf5] shadow-[0_16px_30px_-24px_rgba(0,10,30,0.55)] ring-1 ring-o-sea/[0.06] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(0,10,30,0.6)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-o-sea/10">
        {/* Фото чисте — без затемнення й плашок (власник). Наведення — міні-карта;
            без неї (немає координат) — як і раніше, фото трохи наближається. */}
        <PreviewMedia
          x={x}
          names={names}
          image={r.imageUrl || stops[0]?.image}
          hover={hover}
          imgClass={`h-full w-full object-cover ${can ? "" : "transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"}`}
        />
      </div>
      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <RouteFacts r={r} d={d} n={stops.length} />
        <Title r={r} d={d} className="mt-1.5 text-[14.5px] sm:text-[15.5px]" />
        {stops.length > 0 && (
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.35] text-o-sea/55">
            {stops.map((s, i) => (
              <span key={s.id}>
                {i > 0 && <span className="mx-1 text-o-wine/60">→</span>}
                {s.name}
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
