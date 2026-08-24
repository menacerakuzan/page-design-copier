import { lazy, Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ChevronLeft,
  Clock,
  Navigation,
  MapPin,
  Globe,
  ExternalLink,
  Route as RouteIcon,
} from "lucide-react";
import { Img } from "@/components/Img";
import { loadRoutes, ROUTE_TAG_OPTIONS } from "@/lib/routesRepository";
import { useLang } from "@/lib/langContext";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { objectDetailPath, objectTypeLabel, objectTypeColor } from "@/lib/entityLinks";
import type { TourismObject } from "@/types/hierarchy";
import SiteFooter from "@/components/SiteFooter";
import PageBrow from "@/components/PageBrow";
import { useSeo } from "@/hooks/useSeo";
import { extractCoords, type WaypointObject } from "@/components/RouteMap";

// Той самий інтерактивний MapLibre-компонент, що й в оверлеї маршрутів
// (кнопка "Маршрути" в геро головної) — lazy, щоб MapLibre (~1 МБ) не тягнувся
// в бандл цієї сторінки, поки карта реально не потрібна.
const RouteMap = lazy(() => import("@/components/RouteMap"));

const GOLD = "#df9b3b";

const isYoutube = (url?: string) => !!url && (url.includes("youtube.com") || url.includes("youtu.be"));

const youtubeEmbed = (url: string) => {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}?mute=1&loop=1&playlist=${m[1]}&controls=1&rel=0` : null;
};

const StopRow = ({ obj, index, lang, tl }: {
  obj: TourismObject;
  index: number;
  lang: "uk" | "en";
  tl: (uk?: string | null, en?: string | null) => string;
}) => (
  <Link
    to={objectDetailPath(obj.type, obj.slug)}
    className="flex items-center gap-3 rounded-[18px] border border-[#002f5e]/10 bg-white p-2.5 shadow-[0_10px_26px_-22px_rgba(0,47,94,0.4)] transition-transform hover:-translate-y-0.5"
  >
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#002f5e] text-[12px] text-[#fff2e8] font-odesa-bold">
      {index + 1}
    </span>
    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[12px] bg-[#002f5e]/10">
      {obj.imageUrl && <Img w={120} src={obj.imageUrl} alt={obj.name} className="h-full w-full object-cover" />}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-[10px] uppercase tracking-wider font-odesa-semi" style={{ color: objectTypeColor[obj.type] }}>
        {objectTypeLabel(obj.type, lang)}
      </span>
      <span className="line-clamp-2 block text-[15px] leading-tight text-[#002f5e] font-odesa-semi">
        {tl(obj.name, obj.nameEn)}
      </span>
    </span>
  </Link>
);

const PageShell = ({ backTo, children }: { backTo: string; children: React.ReactNode }) => {
  const { t } = useLang();
  return (
    <div className="relative min-h-screen bg-[#fff2e8]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "url(/routespattern.svg)", backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.1 }}
      />
      <PageBrow backTo={backTo} backLabel={t("backToRoutes")} />
      {children}
      <SiteFooter />
    </div>
  );
};

const RouteDetailPage = () => {
  const { id } = useParams();
  const { t, tl, lang } = useLang();
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["routes-published"],
    queryFn: () => loadRoutes(true),
  });
  const { data: snapshot } = useHierarchySnapshot();

  const route = routes.find((r) => r.id === id);

  useSeo({
    title: route ? tl(route.name, route.nameEn) : t("routes"),
    description: route ? tl(route.description, route.descriptionEn) : undefined,
    image: route?.imageUrl,
    lang,
  });

  if (isLoading) {
    return (
      <PageShell backTo="/marshruty">
        <div className="relative z-10 flex justify-center py-24">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#002f5e]/15 border-t-[#002f5e]" />
        </div>
      </PageShell>
    );
  }

  if (!route) {
    return (
      <PageShell backTo="/marshruty">
        <div className="container-edge relative z-10 py-24 text-center">
          <p className="text-[18px] text-[#002f5e]/70 font-odesa-semi">{t("routeNotFound")}</p>
          <Link
            to="/marshruty"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#002f5e] px-6 py-3 text-[14px] text-[#fff2e8] font-odesa-medium transition-transform hover:-translate-y-0.5"
          >
            <ChevronLeft className="h-4 w-4" /> {t("backToRoutes")}
          </Link>
        </div>
      </PageShell>
    );
  }

  const name = tl(route.name, route.nameEn);
  const desc = tl(route.description, route.descriptionEn);
  const content = tl(route.content, route.contentEn);

  const linkedObjects = (route.objectIds ?? [])
    .map((oid) => snapshot?.objects.find((o) => o.id === oid && o.published))
    .filter(Boolean) as TourismObject[];

  // useMemo — без нього новий масив на кожен рендер зносив би й перебудовував
  // MapLibre-карту щоразу (та сама причина, що й у RoutesOverlay).
  const waypointsForMap: WaypointObject[] = useMemo(
    () => (route.waypointObjectIds ?? [])
      .map((oid, i) => {
        if (!oid) return null;
        const obj = snapshot?.objects.find((o) => o.id === oid && o.published);
        return obj ? { coordIndex: i, object: obj } : null;
      })
      .filter(Boolean) as WaypointObject[],
    [route.waypointObjectIds, snapshot],
  );

  const stops = linkedObjects.length > 0 ? linkedObjects : waypointsForMap.map((w) => w.object);

  const showMap = extractCoords(route.mapUrl ?? "").length > 0;

  const linksList = (route.links ?? "")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      const [label, ...rest] = l.split("|");
      return { label: label.trim(), url: (rest.join("|") || label).trim() };
    });

  return (
    <PageShell backTo="/marshruty">
      {/* ── Hero-фото ───────────────────────────────────────────────────── */}
      <div className="relative z-10 mt-4 h-[260px] w-full overflow-hidden xs:h-[320px] md:h-[440px]">
        {route.imageUrl ? (
          <Img w={1600} src={route.imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#002f5e]">
            <RouteIcon className="h-10 w-10 text-[#fff2e8]/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#fff2e8] via-transparent to-transparent" />
      </div>

      {/* ── Контент-картка: на десктопі — центрована колонка ─────────────── */}
      <main id="main-content" tabIndex={-1} className="container-edge relative z-10 -mt-10 pb-tabbar md:-mt-16 md:pb-16">
        <div className="mx-auto max-w-[900px] rounded-[26px] bg-white p-5 shadow-[0_18px_40px_-30px_rgba(0,47,94,0.4)] xs:p-7 md:p-10">
          {(route.duration || route.distance || (route.tags && route.tags.length > 0)) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {route.duration && (
                <span className="flex items-center gap-1.5 rounded-full border border-[#002f5e]/15 px-3.5 py-1.5 text-[13px] text-[#002f5e]/70 font-odesa-medium">
                  <Clock className="h-3.5 w-3.5" style={{ color: GOLD }} /> {route.duration}
                </span>
              )}
              {route.distance && (
                <span className="flex items-center gap-1.5 rounded-full border border-[#002f5e]/15 px-3.5 py-1.5 text-[13px] text-[#002f5e]/70 font-odesa-medium">
                  <Navigation className="h-3.5 w-3.5" style={{ color: GOLD }} /> {route.distance}
                </span>
              )}
              {route.tags?.map((tagId) => {
                const meta = ROUTE_TAG_OPTIONS.find((tg) => tg.id === tagId);
                if (!meta) return null;
                return (
                  <span key={tagId} className="flex items-center gap-1 rounded-full bg-[#df9b3b] px-3 py-1.5 text-[13px] text-[#002f5e] font-odesa-semi">
                    {meta.emoji} {meta.label}
                  </span>
                );
              })}
            </div>
          )}

          <h1 className="text-[30px] leading-[0.98] text-[#002f5e] font-odesa-bold xs:text-[36px] md:text-[44px]">{name}</h1>

          {desc && (
            <p className="mt-4 text-[16px] leading-[1.65] text-[#002f5e]/70 font-odesa-regular md:text-[17px]">{desc}</p>
          )}

          {stops.length > 0 && (
            <section className="mt-8">
              <p className="mb-3 text-[13px] uppercase tracking-wider text-[#002f5e]/70 font-odesa-semi">
                {t("routeStops")} · {stops.length}
              </p>
              <div className="flex flex-col gap-2.5 md:grid md:grid-cols-2">
                {stops.map((obj, i) => (
                  <StopRow key={obj.id} obj={obj} index={i} lang={lang} tl={tl} />
                ))}
              </div>
            </section>
          )}

          {showMap && (
            <section className="mt-8">
              <p className="mb-3 text-[13px] uppercase tracking-wider text-[#002f5e]/70 font-odesa-semi">
                {t("routeOnMap")}
              </p>
              <Suspense fallback={<div className="h-[320px] w-full rounded-[20px] bg-[#002f5e]/5 md:h-[460px]" />}>
                <RouteMap mapUrl={route.mapUrl} waypoints={waypointsForMap} />
              </Suspense>
            </section>
          )}

          {(route.mapUrl || route.mapUrl2) && (
            <div className="mt-8 flex flex-col gap-2.5 md:flex-row">
              {route.mapUrl && (
                <a
                  href={route.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-odesa-medium transition-transform hover:scale-[1.01] md:flex-1"
                  style={{ backgroundColor: GOLD, color: "#002f5e" }}
                >
                  <MapPin className="h-4 w-4" /> {t("openRoute")}
                </a>
              )}
              {route.mapUrl2 && (
                <a
                  href={route.mapUrl2}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full border border-[#002f5e]/20 py-3.5 text-[14px] text-[#002f5e] font-odesa-medium transition-colors hover:bg-[#002f5e]/5 md:flex-1"
                >
                  <MapPin className="h-4 w-4" style={{ color: GOLD }} /> {t("altRoute")}
                </a>
              )}
            </div>
          )}

          {route.videoUrl && (
            <div className="mt-8 overflow-hidden rounded-[18px] border border-[#002f5e]/10">
              {isYoutube(route.videoUrl) ? (
                <iframe
                  src={youtubeEmbed(route.videoUrl) ?? undefined}
                  title={`Відео маршруту: ${tl(route.name, route.nameEn)}`}
                  className="h-[260px] w-full border-0 md:h-[460px]"
                  allow="fullscreen"
                  allowFullScreen
                />
              ) : (
                <video src={route.videoUrl} controls muted className="max-h-[260px] w-full md:max-h-[480px]" />
              )}
            </div>
          )}

          {content && (
            <div
              className="route-rich-content-light mt-8"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          )}

          {linksList.length > 0 && (
            <section className="mt-8">
              <p className="mb-3 text-[13px] uppercase tracking-wider text-[#002f5e]/70 font-odesa-semi">
                {t("usefulLinks")}
              </p>
              <div className="space-y-2">
                {linksList.map((l, i) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-[12px] border border-[#002f5e]/10 bg-[#002f5e]/[0.03] px-4 py-3 text-[14px] text-[#002f5e]/80 font-odesa-regular transition-colors hover:bg-[#002f5e]/[0.06]"
                  >
                    <Globe className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
                    <span className="flex-1 truncate">{l.label}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#002f5e]/70" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </PageShell>
  );
};

export default RouteDetailPage;
