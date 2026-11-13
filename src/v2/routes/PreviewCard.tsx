import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Map as MapIcon, X } from "lucide-react";
import { Img } from "@/components/Img";
import { useV2 } from "@/v2/i18n";
import { ClampTitle } from "@/v2/components/ClampTitle";
import { RouteFacts } from "@/v2/components/routeCards";
import { RoutePreviewMap, hasPreview } from "./RoutePreviewMap";
import type { RouteItem, RoutesPageData } from "./useRoutesPage";

const EASE = [0.22, 1, 0.36, 1] as const;
/** Затримка наведення — щоб карта не блимала, коли курсор просто пробігає по сітці. */
const INTENT_MS = 220;

/**
 * Картка маршруту з попереднім переглядом: як «Картка», але при наведенні
 * фото м'яко розчиняється (трохи відпливаючи й розмиваючись), а на його місці
 * проявляється справжня карта з маршрутом — пунктир малюється від старту,
 * зупинки-номери з'являються по черзі. Курсор пішов — фото повертається.
 * На телефоні (без наведення) — маленька кнопка-іконка в куті фото.
 * Під фото — дані, назва й зупинки.
 */
export function PreviewRouteCard({ x, data }: { x: RouteItem; data: RoutesPageData }) {
  const { t } = useV2();
  const reduce = useReducedMotion();
  const { d } = data;
  const stops = d.stopsOf(x.r);
  const can = hasPreview(x);

  // armed — карта вже змонтована (тайли вантажаться), show — видно її
  const [armed, setArmed] = useState(false);
  const [show, setShow] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const enter = (e: React.PointerEvent) => {
    if (!can || e.pointerType !== "mouse") return;
    setArmed(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShow(true), INTENT_MS);
  };
  const leave = () => {
    window.clearTimeout(timer.current);
    setShow(false);
  };

  return (
    <article
      onPointerEnter={enter}
      onPointerLeave={leave}
      className="group relative flex h-full flex-col overflow-hidden rounded-[18px] bg-[#fffaf5] shadow-[0_16px_30px_-24px_rgba(0,10,30,0.55)] ring-1 ring-o-sea/[0.06] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(0,10,30,0.6)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-o-sea/10">
        {/* Фото: при показі карти — трохи більшає, розмивається й тане */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={show ? { opacity: 0, scale: 1.08, filter: "blur(6px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: reduce ? 0 : show ? 0.55 : 0.45, ease: EASE }}
        >
          <Img src={x.r.imageUrl || stops[0]?.image} w={560} alt="" className="h-full w-full object-cover" />
        </motion.div>
        {/* Карта: проявляється, «осідаючи» з легкого наближення */}
        {armed && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
            transition={{ duration: reduce ? 0 : show ? 0.6 : 0.35, ease: EASE }}
          >
            <RoutePreviewMap x={x} show={show} names={data.districtNames} />
          </motion.div>
        )}
        {/* Телефон: наведення немає — кнопка-іконка */}
        {can && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setArmed(true);
              setShow((v) => !v);
            }}
            aria-pressed={show}
            aria-label={show ? t("rtShowPhoto") : t("rtShowMap")}
            className={`absolute bottom-2 left-2 z-[2] flex h-8 w-8 items-center justify-center rounded-full shadow-[0_6px_16px_-8px_rgba(0,20,50,0.6)] transition-colors [@media(hover:hover)]:hidden ${
              show ? "bg-o-wine text-o-sand" : "bg-o-sand/95 text-o-sea"
            }`}
          >
            {show ? <X className="h-4 w-4" aria-hidden="true" /> : <MapIcon className="h-4 w-4" aria-hidden="true" />}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <RouteFacts r={x.r} d={d} n={stops.length} />
        <h3 className="mt-1.5 flex items-start gap-1.5 text-[14.5px] font-bold leading-snug sm:text-[15.5px]">
          <ClampTitle to={`/marshruty/${x.r.id}`} text={d.tl(x.r.name, x.r.nameEn)} />
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 -translate-x-1 text-o-wine opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
        </h3>
        {stops.length > 0 && (
          <ol className="mt-1.5 line-clamp-2 text-[12px] leading-[1.35] text-o-sea/55">
            {stops.map((s, i) => (
              <li key={s.id} className="inline">
                {i > 0 && <span className="mx-1 text-o-wine/60">→</span>}
                {s.name}
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}
