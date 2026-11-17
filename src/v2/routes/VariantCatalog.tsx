import { motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/v2/components/ui";
import { GridToggle, gridColsClass, useGridCols } from "@/v2/components/GridToggle";
import { MoreButton, useMore } from "@/v2/district/parts";
import { RouteTagChips, RoutesEmpty, RoutesHead } from "./parts";
import { DistrictPicker } from "./DistrictPicker";
import { RouteCard } from "@/v2/components/routeCards";
import type { RoutesPageData } from "./useRoutesPage";

/**
 * Вигляд «Каталог» (обраний власником): у шапці праворуч — карта районів для вибору (можна
 * кілька); під шапкою — типи й перемикач «4 / 3 в ряд»; далі маршрути
 * картками з попереднім переглядом: при наведенні фото змінюється на карту
 * маршруту з пронумерованими зупинками.
 */
export function RoutesCatalog({ data }: { data: RoutesPageData }) {
  const reduce = useReducedMotion();
  const [cols, setCols] = useGridCols();
  const more = useMore(data.shown, cols === 3 ? 9 : 8);
  const n = data.shown.length;

  return (
    <div className="mx-auto max-w-[1280px] px-5 pb-16 pt-4 sm:px-10 sm:pb-24 sm:pt-6">
      <RoutesHead data={data} aside={data.items.length > 0 && <Reveal delay={0.1}><DistrictPicker data={data} /></Reveal>} />
      {/* Типи й перемикач сітки — в одному рядку */}
      <div id="all-routes" className="mt-8 scroll-mt-28">
        {/* Плавна поява — як і заголовок, трохи слідом за ним */}
        <Reveal delay={0.1} y={16} className="flex items-start gap-6">
          <RouteTagChips data={data} className="min-w-0 flex-1" />
          <GridToggle cols={cols} onChange={setCols} className="mt-1" />
        </Reveal>
      </div>

      {n === 0 ? (
        <RoutesEmpty data={data} />
      ) : (
        <motion.div key={`${data.tag}-${data.districts.join()}`} initial={reduce ? false : { opacity: 0.35 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
          <ul className={`mt-8 grid ${gridColsClass(cols)}`}>
            {more.shown.map((x, i) => (
              <Reveal as="li" key={x.r.id} delay={(i % cols) * 0.05} y={18}>
                <RouteCard r={x.r} d={data.d} item={x} />
              </Reveal>
            ))}
          </ul>
          <MoreButton more={more} anchor="all-routes" />
        </motion.div>
      )}
    </div>
  );
}
