import { useMemo, useState } from "react";
import { SectionHead } from "@/v2/components/ui";
import { usePauseOffscreen } from "@/v2/lib/usePauseOffscreen";
import { useRoutesData } from "./routes/useRoutesData";
import { RoadsBackdrop } from "./routes/RoadsBackdrop";
import { RouteFilters } from "./routes/shared";
import { RoutesLight } from "./routes/RoutesLight";

const LIST = 5;

/**
 * «Готові маршрути» — «Легкий ланцюжок»: фільтри одним рядком, назви маршрутів
 * вкладками, під ними зупинки обраного маршруту фото-кружками на пунктирній
 * стежці; нижче — назва, дані, опис, кнопка й мапа-гармошка. Тло — дві
 * пунктирні дороги біля країв. Інші варіанти блоку — у useful/.
 */
export function RoutesShowcase() {
  const d = useRoutesData();
  const [tag, setTag] = useState<string | null>(null);
  const list = useMemo(() => d.routes.filter((r) => !tag || r.tags?.includes(tag)).slice(0, LIST), [d.routes, tag]);
  const pauseRef = usePauseOffscreen<HTMLElement>();

  if (!d.ready || !d.routes.length) return null;

  return (
    <section ref={pauseRef} aria-labelledby="routes-title" className="relative isolate overflow-hidden py-12 sm:py-20">
      <RoadsBackdrop />
      <div className="relative mx-auto max-w-[1280px] px-5 sm:px-10">
        <SectionHead
          id="routes-title"
          inline
          kicker={d.t("routesKicker")}
          line1={d.t("routesTitle1")}
          line2={d.t("routesTitle2")}
          action={{ to: "/marshruty", label: `${d.t("allRoutes")} (${d.routes.length})`, short: `${d.lang === "en" ? "All" : "Усі"} (${d.routes.length})` }}
        />
        <RouteFilters d={d} value={tag} onChange={setTag} />
        {/* key — щоб при зміні фільтра вибраний маршрут скидався на перший */}
        <RoutesLight key={tag ?? "all"} d={d} list={list} />
      </div>
    </section>
  );
}
