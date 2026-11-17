import { motion, useReducedMotion } from "framer-motion";
import { Map as MapIcon, X } from "lucide-react";
import { Img } from "@/components/Img";
import { useV2 } from "@/v2/i18n";
import { RoutePreviewMap, hasPreview } from "./RoutePreviewMap";
import type { RouteItem } from "./routeItem";
import type { usePreviewHover } from "./usePreviewHover";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Фото картки, на місці якого при наведенні проявляється міні-карта маршруту:
 * фото м'яко розчиняється (трохи відпливаючи й розмиваючись), карта «осідає»
 * з легкого наближення, пунктир малюється від старту, зупинки з'являються по
 * черзі. На телефоні (без наведення) — маленька кнопка-іконка в куті фото.
 * Має стояти всередині відносно позиціонованого блока з розмірами (кадр 16:10).
 */
export function PreviewMedia({
  x,
  names,
  image,
  hover,
  imgClass = "h-full w-full object-cover",
}: {
  x: RouteItem | null;
  names: Map<string, { short: string }>;
  image: string | undefined;
  hover: ReturnType<typeof usePreviewHover>;
  imgClass?: string;
}) {
  const { t } = useV2();
  const reduce = useReducedMotion();
  const { armed, show, toggle } = hover;
  const can = !!x && hasPreview(x);
  return (
    <>
      {/* Фото: при показі карти — трохи більшає, розмивається й тане */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={show ? { opacity: 0, scale: 1.08, filter: "blur(6px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: reduce ? 0 : show ? 0.55 : 0.45, ease: EASE }}
      >
        <Img src={image} w={560} alt="" className={imgClass} />
      </motion.div>
      {/* Карта: проявляється, «осідаючи» з легкого наближення */}
      {armed && x && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.06 }}
          animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.06 }}
          transition={{ duration: reduce ? 0 : show ? 0.6 : 0.35, ease: EASE }}
        >
          <RoutePreviewMap x={x} show={show} names={names} />
        </motion.div>
      )}
      {/* Телефон: наведення немає — кнопка-іконка */}
      {can && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle();
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
    </>
  );
}
