import { useMemo } from "react";
import { ROUTE_TAG_OPTIONS, type Route } from "@/lib/routesRepository";
import type { RoutesData } from "./useRoutesData";
import { TagChips } from "./parts";

/** «6 годин · 20 км · 3 зупинки» — лише те, що є. */
export function metaLine(d: RoutesData, r: Route) {
  const n = d.stopsOf(r).length;
  return [r.duration, r.distance, n ? `${n} ${d.stopsWord(n)}` : ""].filter(Boolean).join(" · ");
}

/** Типи маршрутів, що трапляються, — від найчастішого. */
export function useRouteTags(d: RoutesData) {
  return useMemo(() => {
    const count = new Map<string, number>();
    for (const r of d.routes) for (const t of r.tags ?? []) count.set(t, (count.get(t) ?? 0) + 1);
    return ROUTE_TAG_OPTIONS.map((o) => o.id as string)
      .filter((id) => count.has(id))
      .sort((a, b) => (count.get(b) ?? 0) - (count.get(a) ?? 0));
  }, [d.routes]);
}

/** Фільтри одним рядком: «Усі» + 4 найчастіші типи (решта — на сторінці «Маршрути»). */
export function RouteFilters({ d, value, onChange }: { d: RoutesData; value: string | null; onChange: (v: string | null) => void }) {
  const tags = useRouteTags(d);
  return (
    <div className="mt-6">
      <TagChips d={d} tags={tags.slice(0, 4)} value={value} onChange={onChange} />
    </div>
  );
}
