import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ROUTE_TAG_OPTIONS } from "@/lib/routesRepository";
import { EASE, SectionHead } from "@/v2/components/ui";
import { useRoutesData } from "./routes/useRoutesData";
import { FoldedMap, RouteList, TagChips } from "./routes/parts";
import { StopsChain } from "./routes/StopsChain";
import { RoadsBackdrop } from "./routes/RoadsBackdrop";

const LIST = 5;

/**
 * «Готові маршрути»: фільтри-таблетки з іконками; праворуч — 5 маршрутів,
 * ліворуч — зупинки обраного маршруту «драбинкою» з пунктирною стежкою.
 * Тло — повільні пунктирні «дороги». Інші варіанти блоку — у useful/.
 */
export function RoutesShowcase() {
  const d = useRoutesData();
  const [tag, setTag] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  const tags = useMemo(() => {
    const present = new Set(d.routes.flatMap((r) => r.tags ?? []));
    return ROUTE_TAG_OPTIONS.filter((o) => present.has(o.id)).map((o) => o.id as string);
  }, [d.routes]);
  const list = useMemo(() => d.routes.filter((r) => !tag || r.tags?.includes(tag)).slice(0, LIST), [d.routes, tag]);
  const current = list.find((r) => r.id === sel) ?? list[0];

  if (!d.ready || !d.routes.length) return null;

  return (
    <section aria-labelledby="routes-title" className="relative isolate overflow-hidden py-16 sm:py-20">
      <RoadsBackdrop />
      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-10">
        <FoldedMap />
        <SectionHead id="routes-title" inline kicker={d.t("routesKicker")} line1={d.t("routesTitle1")} line2={d.t("routesTitle2")} />

        <div className="mt-7 lg:pr-[260px]">
          <TagChips
            d={d}
            tags={tags}
            value={tag}
            onChange={(v) => {
              setTag(v);
              setSel(null);
            }}
          />
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
          {/* Зупинки обраного маршруту */}
          <div className="min-w-0">
            <AnimatePresence mode="wait">
              {current && (
                <motion.div key={current.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE }}>
                  <StopsChain d={d} r={current} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Список маршрутів */}
          <div className="flex flex-col">
            <RouteList d={d} list={list} current={current} onPick={setSel} />
            <Link to="/marshruty" className="ml-2 mt-5 inline-flex items-center gap-2 self-start text-[15px] font-semibold text-o-wine underline decoration-o-sun decoration-2 underline-offset-[6px] hover:text-o-sea">
              {d.t("allRoutes")} ({d.routes.length})
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
