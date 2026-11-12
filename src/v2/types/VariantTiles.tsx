import { motion, useReducedMotion } from "framer-motion";
import { useV2 } from "@/v2/i18n";
import { EASE, Reveal } from "@/v2/components/ui";
import { BlockHead } from "@/v2/district/parts";
import {
  TypePlaces,
  TypeRoutes,
  TypeTile,
  TypesHead,
  useActiveType,
} from "./parts";
import type { TypesPageData } from "./useTypesPage";

/**
 * Варіант 2 «Плитки»: ті самі плитки й розкладка, що в блоці «Види туризму»
 * на головній (2 ряди по 4, легка «хвиля»; на телефоні — 4 ряди по 2, 4:3),
 * лише трохи менші. Клік обирає вид (обведення), нижче — місця з фільтром за
 * районами й маршрути, як у «Вітрині», але без кольорової смуги.
 */
export function TypesTiles({ data }: { data: TypesPageData }) {
  const { t } = useV2();
  const reduce = useReducedMotion();
  const { active, setActive } = useActiveType(data);
  if (!active) return null;

  // Вибір виду сторінку не гортає (власник: «щоб не уїжджало вниз»).
  const pick = (key: string) => setActive(key);

  return (
    <>
      <div className="mx-auto max-w-[1280px] px-5 pb-6 pt-4 sm:px-10 sm:pt-6">
        <TypesHead />
        <ul className="mx-auto mt-8 grid max-w-[360px] grid-cols-2 gap-x-5 gap-y-5 sm:mt-10 sm:max-w-[600px] sm:gap-x-8 sm:gap-y-6 lg:max-w-[840px] lg:grid-cols-4 lg:gap-x-9 lg:gap-y-7 lg:pb-4">
          {data.types.map((tp, i) => (
            <Reveal as="li" key={tp.key} delay={(i % 4) * 0.06}>
              {/* Легка «хвиля»: парні колонки трохи нижче — як на головній */}
              <div
                className={
                  i % 2 === 1
                    ? "translate-y-2 sm:translate-y-3 lg:translate-y-3"
                    : ""
                }
              >
                <TypeTile
                  tp={tp}
                  shape="aspect-[4/3] sm:aspect-square"
                  active={tp.key === active.key}
                  onClick={() => pick(tp.key)}
                />
              </div>
            </Reveal>
          ))}
        </ul>
      </div>

      {/* Без AnimatePresence «wait»: старий список не зникає перед новим, тож висота
          сторінки не провалюється і екран не «їде». Новий лише м'яко проявляється. */}
      <motion.div
        key={active.key}
        initial={reduce ? false : { opacity: 0.35 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <section
          id="type-places"
          aria-label={active.label}
          className="mx-auto max-w-[1280px] scroll-mt-24 px-5 py-10 sm:px-10 sm:py-14"
        >
          <BlockHead
            kicker={active.label}
            title={t("seeTitle")}
            count={active.places.length}
            className="mb-6"
          />
          <TypePlaces tp={active} anchor="type-places" />
        </section>
        <TypeRoutes tp={active} data={data} />
      </motion.div>
      <div className="h-10 sm:h-16" />
    </>
  );
}
