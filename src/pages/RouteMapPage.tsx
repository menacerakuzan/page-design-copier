import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Reorder, useDragControls } from "framer-motion";
import { toast } from "sonner";
import { ShoppingCart, Navigation, GripVertical, Sparkles, MapPinOff, ArrowRight } from "lucide-react";
import RouteMap from "@/components/RouteMap";
import { Img } from "@/components/Img";
import { useLang } from "@/lib/langContext";
import { useBasket } from "@/lib/basketContext";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { getObjectCoords, haversineKm, type LatLng } from "@/lib/geo";
import { objectDetailPath, objectTypeLabel, objectTypeColor } from "@/lib/entityLinks";
import type { TourismObject } from "@/types/hierarchy";

const NAVY = "#002f5e";
const CREAM = "#fff2e8";
const GOLD = "#df9b3b";

// Сумарна довжина маршруту (пряма лінія) для порівняння варіантів.
function pathLength(order: string[], coordById: (id: string) => LatLng | null): number {
  let sum = 0;
  for (let i = 1; i < order.length; i++) {
    const a = coordById(order[i - 1]);
    const b = coordById(order[i]);
    if (a && b) sum += haversineKm(a, b);
  }
  return sum;
}

// Жадібний «найближчий сусід» від конкретного старту.
function nnFrom(startId: string, ids: string[], coordById: (id: string) => LatLng | null): string[] {
  const remaining = ids.filter((id) => id !== startId);
  const result: string[] = [startId];
  while (remaining.length) {
    const last = coordById(result[result.length - 1])!;
    let bestI = 0;
    let bestD = Infinity;
    remaining.forEach((id, i) => {
      const c = coordById(id);
      if (!c) return;
      const d = haversineKm(last, c);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    });
    result.push(remaining.splice(bestI, 1)[0]);
  }
  return result;
}

/** Найкоротший маршрут: пробуємо кожен старт, беремо найкоротший загальний. */
function optimizeOrder(ids: string[], coordById: (id: string) => LatLng | null): string[] {
  const withCoords = ids.filter((id) => coordById(id));
  if (withCoords.length <= 2) return ids;
  let best = withCoords;
  let bestLen = Infinity;
  for (const start of withCoords) {
    const cand = nnFrom(start, withCoords, coordById);
    const len = pathLength(cand, coordById);
    if (len < bestLen) {
      bestLen = len;
      best = cand;
    }
  }
  return best;
}

const StopRow = ({
  obj,
  index,
  lang,
  tl,
}: {
  obj: TourismObject;
  index: number;
  lang: "uk" | "en";
  tl: (uk?: string | null, en?: string | null) => string;
}) => {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={obj.id}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-3 rounded-[18px] border border-[#002f5e]/10 bg-white p-2.5 shadow-[0_10px_26px_-22px_rgba(0,47,94,0.4)]"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#002f5e] text-[12px] text-[#fff2e8] font-odesa-bold">
        {index + 1}
      </span>
      <Link
        to={objectDetailPath(obj.type, obj.slug)}
        className="h-11 w-11 shrink-0 overflow-hidden rounded-[12px] bg-[#002f5e]/10"
      >
        {obj.imageUrl && <Img w={120} src={obj.imageUrl} alt={obj.name} className="h-full w-full object-cover" />}
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider font-odesa-semi" style={{ color: objectTypeColor[obj.type] }}>
          {objectTypeLabel(obj.type, lang)}
        </p>
        <p className="line-clamp-2 text-[15px] leading-tight text-[#002f5e] font-odesa-semi">{tl(obj.name, obj.nameEn)}</p>
      </div>
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        aria-label="Перетягнути"
        className="tap flex shrink-0 cursor-grab touch-none items-center justify-center text-[#002f5e]/30 active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>
    </Reorder.Item>
  );
};

const RouteMapPage = () => {
  const { t, tl, lang } = useLang();
  const { ids } = useBasket();
  const { data: snapshot, isLoading } = useHierarchySnapshot();

  const byId = useMemo(() => new Map((snapshot?.objects ?? []).map((o) => [o.id, o])), [snapshot]);
  const coordById = useMemo(
    () => (id: string) => {
      const o = byId.get(id);
      return o ? getObjectCoords(o) : null;
    },
    [byId],
  );

  // Об'єкти кошика з координатами (у порядку додавання) та без них.
  const basketWithCoords = useMemo(
    () => ids.filter((id) => byId.get(id) && coordById(id)),
    [ids, byId, coordById],
  );
  const missing = useMemo(
    () => ids.map((id) => byId.get(id)).filter((o): o is TourismObject => Boolean(o) && !getObjectCoords(o!)),
    [ids, byId],
  );

  // Локальний порядок зупинок (ручне перетягування + оптимізація).
  const [order, setOrder] = useState<string[]>(basketWithCoords);

  // Синхронізуємо, коли змінюється склад кошика (додали/прибрали об'єкт).
  useEffect(() => {
    setOrder((prev) => {
      const kept = prev.filter((id) => basketWithCoords.includes(id));
      const added = basketWithCoords.filter((id) => !kept.includes(id));
      return [...kept, ...added];
    });
  }, [basketWithCoords]);

  const orderedObjs = useMemo(
    () => order.map((id) => byId.get(id)).filter((o): o is TourismObject => Boolean(o)),
    [order, byId],
  );

  const coords = useMemo(
    () =>
      orderedObjs
        .map((o) => getObjectCoords(o))
        .filter((c): c is LatLng => Boolean(c))
        .map((c) => [c.lng, c.lat] as [number, number]),
    [orderedObjs],
  );

  const waypoints = useMemo(() => orderedObjs.map((o, i) => ({ coordIndex: i, object: o })), [orderedObjs]);

  // Приблизна довжина маршруту (пряма лінія) для підпису.
  const approxKm = useMemo(() => {
    let sum = 0;
    for (let i = 1; i < orderedObjs.length; i++) {
      const a = getObjectCoords(orderedObjs[i - 1]);
      const b = getObjectCoords(orderedObjs[i]);
      if (a && b) sum += haversineKm(a, b);
    }
    return sum;
  }, [orderedObjs]);

  const googleMapsUrl = useMemo(() => {
    const pts = orderedObjs
      .map((o) => getObjectCoords(o))
      .filter((c): c is LatLng => Boolean(c))
      .map((c) => `${c.lat},${c.lng}`);
    if (pts.length < 2) return "";
    const origin = pts[0];
    const destination = pts[pts.length - 1];
    const mid = pts.slice(1, -1);
    const params = new URLSearchParams({ api: "1", origin, destination, travelmode: "driving" });
    if (mid.length) params.set("waypoints", mid.join("|"));
    return `https://www.google.com/maps/dir/?${params.toString()}`;
  }, [orderedObjs]);

  const handleOptimize = () => {
    const optimized = optimizeOrder(order, coordById);
    const changed = optimized.length !== order.length || optimized.some((id, i) => id !== order[i]);
    setOrder(optimized);
    toast(changed ? "Маршрут оптимізовано" : "Маршрут вже оптимальний");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff2e8]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#002f5e]/20 border-t-[#002f5e]" />
      </div>
    );
  }

  const enoughStops = coords.length >= 2;

  return (
    <div className="relative min-h-screen bg-[#fff2e8]">
      {/* Легкий фоновий патерн. absolute (у потоці сторінки), а не fixed —
          інакше при overscroll на iOS патерн «відклеюється» і крізь нього видно
          синій html/body. Так само на робочих сторінках. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "url(/beigepattern.svg)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.1 }}
      />
      <header className="container-edge pt-safe relative z-10">
        <div className="flex items-center justify-between pb-5 pt-6">
          <Link
            to="/koshyk"
            className="flex w-fit items-center gap-2 rounded-full bg-[#002f5e] px-5 py-2 text-[14px] leading-none text-[#fff2e8] font-odesa-medium transition-colors hover:bg-[#0f3f74]"
          >
            <ShoppingCart className="h-4 w-4" /> {t("basket")}
          </Link>
        </div>
        <h1 className="text-[30px] leading-none text-[#002f5e] font-odesa-bold">{t("yourRoute")}</h1>
        <p className="mt-2 max-w-[520px] text-[15px] leading-[1.5] text-[#002f5e]/60 font-odesa-regular">
          {t("yourRouteDesc")}
        </p>
      </header>

      <main className="container-edge pt-6 relative z-10" style={{ paddingBottom: "calc(184px + env(safe-area-inset-bottom))" }}>
        {!enoughStops ? (
          <div className="flex flex-col items-center justify-center rounded-[26px] border border-[#002f5e]/10 bg-white px-6 py-16 text-center shadow-[0_18px_40px_-30px_rgba(0,47,94,0.4)]">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#002f5e]/5 text-[#002f5e]/40">
              <MapPinOff className="h-7 w-7" />
            </span>
            <p className="mt-5 text-[18px] text-[#002f5e] font-odesa-semi">{t("needTwoStops")}</p>
            <Link
              to="/koshyk"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#002f5e] px-6 py-3 text-[14px] text-[#fff2e8] font-odesa-medium transition-transform hover:-translate-y-0.5"
            >
              {t("basket")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Карта */}
            <RouteMap coords={coords} waypoints={waypoints} />

            {/* Дії */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOptimize}
                className="inline-flex items-center gap-2 rounded-full border border-[#002f5e]/15 bg-white px-5 py-2.5 text-[14px] text-[#002f5e] font-odesa-medium transition-colors hover:border-[#df9b3b] hover:bg-[#df9b3b]/10"
              >
                <Sparkles className="h-4 w-4" style={{ color: GOLD }} /> {t("optimizeRoute")}
              </button>
              {approxKm > 0 && (
                <span className="text-[13px] text-[#002f5e]/50 font-odesa-regular">≈ {approxKm.toFixed(0)} км</span>
              )}
            </div>

            {/* Зупинки (перетягуванням) */}
            <div className="mt-6">
              <p className="mb-3 text-[13px] uppercase tracking-wider text-[#002f5e]/45 font-odesa-semi">
                {t("routeStops")} · {coords.length}
              </p>
              <Reorder.Group axis="y" values={order} onReorder={setOrder} className="flex flex-col gap-2">
                {orderedObjs.map((obj, i) => (
                  <StopRow key={obj.id} obj={obj} index={i} lang={lang} tl={tl} />
                ))}
              </Reorder.Group>
            </div>
          </>
        )}

        {/* Об'єкти без координат */}
        {missing.length > 0 && (
          <div className="mt-8 rounded-[20px] border border-[#9f1f47]/15 bg-[#9f1f47]/5 p-5">
            <p className="flex items-center gap-2 text-[14px] text-[#9f1f47] font-odesa-semi">
              <MapPinOff className="h-4 w-4" /> {t("noCoords")}
            </p>
            <p className="mt-1 text-[13px] leading-[1.4] text-[#002f5e]/55 font-odesa-regular">{t("noCoordsDesc")}</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {missing.map((o) => (
                <li key={o.id}>
                  <Link
                    to={objectDetailPath(o.type, o.slug)}
                    className="text-[14px] text-[#002f5e]/75 underline underline-offset-2 font-odesa-medium hover:text-[#002f5e]"
                  >
                    {tl(o.name, o.nameEn)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {/* Липка кнопка Google Maps (прозора обгортка + absolute-дитина заради Safari) */}
      {enoughStops && googleMapsUrl && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
          <div
            className="pointer-events-auto absolute inset-x-4 mx-auto max-w-[560px]"
            style={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }}
          >
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="group/cta flex w-full items-center justify-between gap-3 rounded-full py-2 pl-7 pr-2 text-[16px] font-odesa-bold shadow-[0_18px_40px_-14px_rgba(0,47,94,0.6)] transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: NAVY, color: CREAM }}
            >
              {t("openInGoogleMaps")}
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform group-hover/cta:translate-x-1"
                style={{ backgroundColor: GOLD, color: NAVY }}
              >
                <Navigation className="h-5 w-5" />
              </span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMapPage;
