import { ArrowUpRight, type LucideIcon } from "lucide-react";
import type { TourismObject } from "@/types/hierarchy";
import { Img } from "@/components/Img";
import { objectDetailPath } from "@/lib/entityLinks";
import { plain, useV2 } from "@/v2/i18n";
import { TripButton } from "@/v2/district/parts";
import { ClampTitle } from "./ClampTitle";

/** Короткий підпис місця: підзаголовок (якщо не повторює назву) або початок опису без «Назва — це …». */
export function usePlaceSnippet() {
  const { tl } = useV2();
  return (o: TourismObject, name: string) => {
    const sub = tl(o.subtitle, o.subtitleEn);
    if (sub && sub !== name) return sub;
    const text = plain(tl(o.description, o.descriptionEn));
    const dash = text.indexOf(" — ");
    if (dash > 0 && dash < name.length + 40 && text.toLowerCase().startsWith(name.toLowerCase().slice(0, 12))) {
      const rest = text.slice(dash + 3).replace(/^це\s+/i, "");
      return rest.charAt(0).toUpperCase() + rest.slice(1);
    }
    return text;
  };
}

/**
 * Картка місця «Картка» (обрана власником 2026-11-12) — спільна для всіх
 * сторінок: невеликий прямокутник на світлій підкладці (як картки маршрутів),
 * фото згори на всю ширину — чисте, без затемнення й плашок; під ним назва,
 * винний рядок з іконкою (де це / відстань / дати) і опис на два рядки
 * (місце під два рядки завжди, тож ряди рівні). При наведенні — картка трохи
 * піднімається, фото легко наближається, назва червоніє зі стрілкою.
 */
export function PlaceTile({ o, name, meta, icon: Icon }: {
  o: TourismObject;
  name: string;
  /** Винний рядок під назвою: «Шабо · Білгород-Дністровський», «2,2 км · Вилкове», дати події… */
  meta?: string;
  icon?: LucideIcon;
}) {
  const snippet = usePlaceSnippet();
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[18px] bg-[#fffaf5] shadow-[0_16px_30px_-24px_rgba(0,10,30,0.55)] ring-1 ring-o-sea/[0.06] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(0,10,30,0.6)]">
      <div className="relative overflow-hidden bg-o-sea/10">
        <Img src={o.imageUrl} w={600} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]" />
        <TripButton id={o.id} size="sm" className="absolute right-2.5 top-2.5" />
      </div>
      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <h3 className="flex items-start gap-1.5 text-[14.5px] font-bold leading-snug sm:text-[16px]">
          <ClampTitle to={objectDetailPath(o.type, o.slug)} text={name} />
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 -translate-x-1 text-o-wine opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
        </h3>
        {meta && (
          <p className="mt-1 flex items-center gap-1 truncate text-[12px] font-semibold text-o-wine/85">
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
            <span className="truncate">{meta}</span>
          </p>
        )}
        <p className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[12.5px] leading-[1.3] text-o-sea/60 sm:text-[13px]">{snippet(o, name)}</p>
      </div>
    </article>
  );
}
