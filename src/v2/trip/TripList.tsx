import { Link } from "react-router-dom";
import { Reorder, useDragControls } from "framer-motion";
import { GripVertical, MapPin, MapPinOff, X } from "lucide-react";
import { Img } from "@/components/Img";
import { objectDetailPath } from "@/lib/entityLinks";
import { useV2 } from "@/v2/i18n";
import { typeName } from "@/v2/district/parts";
import { DISTRICT_SHAPES, MAP_H, MAP_W, projectLonLat } from "@/v2/lib/districtShapes";
import { BuildButton, legText, useSummary } from "./parts";
import type { TripData, TripItem } from "./useTrip";

/** Що це за місце — перший вид туризму або тип об'єкта. */
function useKind() {
  const { list, lang } = useV2();
  const kinds = list("placeKinds");
  const idx = { attraction: 0, event: 1, restaurant: 2, hotel: 3 } as const;
  return (x: TripItem) => (x.o.tourismTypes?.[0] ? typeName(x.o.tourismTypes[0], lang) : kinds[idx[x.o.type]]);
}

/* ── «Список + мапа» (обраний власником) ─────────────────────────────── */

/**
 * Ліворуч — компактний список із номерами: порядок змінюється
 * перетягуванням (за ручку), × прибирає; між місцями — відстань. Праворуч
 * закріплена мапа районів із пронумерованими точками, підсумок і «Скласти
 * маршрут».
 */
export function TripList({ data }: { data: TripData }) {
  const { t } = useV2();
  const summary = useSummary(data);
  return (
    // minmax(0,1fr) і на телефоні: інакше неявна колонка `auto` розтягується до
    // повної ширини назв (truncate) — список і мапа виходили за правий край.
    <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-8 sm:mt-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
      <Reorder.Group axis="y" values={data.ids} onReorder={data.reorder} className="flex flex-col">
        {data.items.map((x, i) => (
          <ListRow key={x.o.id} x={x} n={i + 1} last={i === data.items.length - 1} onRemove={() => data.remove(x.o.id)} />
        ))}
      </Reorder.Group>
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[26px] bg-[#fffaf5] p-5 shadow-[0_24px_50px_-36px_rgba(0,10,30,0.6)] ring-1 ring-o-sea/[0.06] sm:p-6">
          <TripMiniMap data={data} />
          <ul className="mt-5 grid gap-1.5 border-t border-o-sea/10 pt-4 text-[14px] font-semibold">
            {summary.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <BuildButton data={data} className="mt-5 w-full" />
          {!data.canBuild && <p className="mt-2 text-center text-[12.5px] text-o-sea/50">{t("trNeedTwo")}</p>}
        </div>
      </aside>
    </div>
  );
}

function ListRow({ x, n, last, onRemove }: { x: TripItem; n: number; last: boolean; onRemove: () => void }) {
  const { t } = useV2();
  const kind = useKind();
  const controls = useDragControls();
  return (
    <Reorder.Item value={x.o.id} dragListener={false} dragControls={controls} className="relative">
      <div className="group flex items-center gap-2 rounded-[20px] bg-[#fffaf5] p-2.5 pr-2 sm:gap-4 sm:pr-3 shadow-[0_14px_28px_-24px_rgba(0,10,30,0.55)] ring-1 ring-o-sea/[0.06]">
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          aria-label={t("trDrag")}
          className="flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-o-sea/35 transition-colors hover:text-o-wine active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" aria-hidden="true" />
        </button>
        {/* Номер — на «стежці» між місцями, не на фото */}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fffaf5] text-[14px] font-bold text-o-wine ring-2 ring-o-wine/60">{n}</span>
        <Link to={objectDetailPath(x.o.type, x.o.slug)} className="relative h-[76px] w-[88px] shrink-0 overflow-hidden rounded-[14px] bg-o-sea/10 sm:h-[100px] sm:w-[148px]">
          <Img src={x.o.imageUrl} w={320} alt="" className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-o-wine/80">{kind(x)}</p>
          <Link to={objectDetailPath(x.o.type, x.o.slug)} className="mt-0.5 line-clamp-2 text-[16px] font-bold leading-snug transition-colors hover:text-o-wine sm:text-[17px]">
            {x.name}
          </Link>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-o-sea/50">
            {x.lat != null ? <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" /> : <MapPinOff className="h-3 w-3 shrink-0 text-o-wine/70" aria-hidden="true" />}
            <span className="truncate">{x.lat != null ? x.where : t("trNoMap")}</span>
          </p>
        </div>
        <button type="button" onClick={onRemove} aria-label={t("trRemove")} title={t("trRemove")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-o-sea/40 transition-colors hover:bg-o-wine/10 hover:text-o-wine">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {!last && (
        <div className="relative h-9" aria-hidden="true">
          <span className="absolute -top-2 bottom-[-8px] left-[57px] border-l-2 border-dotted border-o-wine/40 sm:left-[65px]" />
          {x.next != null && (
            <span className="absolute left-[76px] top-1/2 -translate-y-1/2 text-[12px] font-semibold text-o-sea/45 sm:left-[84px]">{legText(x.next, t("kmUnit"))}</span>
          )}
        </div>
      )}
    </Reorder.Item>
  );
}

/** Мапа районів: райони зі збереженими місцями підфарбовані, місця — пронумеровані точки. */
function TripMiniMap({ data }: { data: TripData }) {
  const { lang } = useV2();
  const own = new Set(data.items.map((x) => x.districtSlug));
  const pts = data.items.map((x, i) => (x.lat != null ? { n: i + 1, p: projectLonLat(x.lng!, x.lat!) } : null)).filter(Boolean) as { n: number; p: [number, number] }[];
  return (
    <svg viewBox={`-10 -10 ${MAP_W + 20} ${MAP_H + 20}`} className="mx-auto block h-[300px] w-auto" role="img" aria-label={lang === "en" ? "Saved places on the map" : "Збережені місця на мапі"}>
      {Object.entries(DISTRICT_SHAPES).map(([slug, s]) => (
        <path key={slug} d={s.d} fill={own.has(slug) ? "rgba(159,31,71,0.12)" : "rgba(0,47,94,0.04)"} stroke="rgba(0,47,94,0.35)" strokeWidth="1.6" strokeLinejoin="round" />
      ))}
      {pts.length > 1 && <polyline points={pts.map(({ p }) => p.join(",")).join(" ")} fill="none" stroke="#9f1f47" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.1 12" />}
      {pts.map(({ n, p }) => (
        <g key={n} transform={`translate(${p[0]} ${p[1]})`}>
          <circle r="19" fill="#fff2e8" stroke="#9f1f47" strokeWidth="4" />
          <text textAnchor="middle" dy="8" fontSize="22" fontWeight="700" fill="#9f1f47">
            {n}
          </text>
        </g>
      ))}
    </svg>
  );
}
