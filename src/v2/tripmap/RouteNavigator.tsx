import { useState } from "react";
import { useV2 } from "@/v2/i18n";
import { RouteLiveMap } from "@/v2/route/RouteLiveMap";
import { Missing, RouteActions, RouteHead, StopStrip, Totals } from "./parts";
import type { TripRouteData } from "./useTripRoute";

/* ── «Навігатор» (обраний власником) ──────────────────────────────────── */

/**
 * Карта — головна: велика, на всю ширину; під нею — легка стрічка порядку
 * зупинок (маленькі картки з номером і км/часом між ними, перетягуються
 * вбік). Згори — підсумок і дії.
 */
export function RouteNavigator({ data }: { data: TripRouteData }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <>
      <RouteHead data={data} />
      <div className="mt-8 flex flex-col gap-5 border-y border-o-sea/10 py-5 lg:flex-row lg:items-center lg:justify-between">
        <Totals data={data} />
        <RouteActions data={data} />
      </div>
      <RouteLiveMap stops={data.stops} line={data.line} geometry={data.geometry} active={active} onPick={setActive} className="mt-8 h-[50vh] min-h-[320px] lg:h-[min(560px,calc(100vh-240px))]" />
      <div className="mt-6">
        <StopStrip data={data} active={active} setActive={setActive} />
      </div>
      <Missing data={data} className="mt-4" />
    </>
  );
}
