import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Clock, Navigation, MapPin, ArrowRight, Route as RouteIcon } from "lucide-react";
import { Img } from "@/components/Img";
import { loadRoutes, type Route, ROUTE_TAG_OPTIONS, loadRouteTagOrder } from "@/lib/routesRepository";
import { useLang } from "@/lib/langContext";
import SiteFooter from "@/components/SiteFooter";

const GOLD = "#df9b3b";

const BadgePill = ({ children }: { children: React.ReactNode }) => (
  <span
    className="flex items-center gap-1.5 rounded-full border border-[#fff2e8]/30 bg-[#002f5e]/30 px-3 py-1 text-[12px] leading-none text-[#fff2e8] backdrop-blur-md font-odesa-medium"
  >
    {children}
  </span>
);

const RouteCard = ({ route, idx }: { route: Route; idx: number }) => {
  const { t, tl } = useLang();
  const name = tl(route.name, route.nameEn);
  const desc = tl(route.description, route.descriptionEn);
  const stopsCount = (route.objectIds?.length ?? 0) > 0
    ? route.objectIds!.length
    : (route.waypointObjectIds ?? []).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: idx * 0.06 }}
    >
      <Link
        to={`/marshruty/${route.id}`}
        className="group block overflow-hidden rounded-[26px] bg-[#fffaf3]"
        style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.05), 0 12px 32px -10px rgba(0,47,94,0.22)" }}
      >
        <div className="relative h-[170px] overflow-hidden bg-[#002f5e]/10 xs:h-[198px]">
          {route.imageUrl ? (
            <Img
              w={700}
              src={route.imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <RouteIcon className="h-8 w-8 text-[#002f5e]/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#002f5e]/85 via-[#002f5e]/15 to-transparent" />
          {(route.duration || route.distance || stopsCount > 0) && (
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {route.duration && (
                <BadgePill>
                  <Clock className="h-3 w-3" style={{ color: GOLD }} />
                  {route.duration}
                </BadgePill>
              )}
              {route.distance && (
                <BadgePill>
                  <Navigation className="h-3 w-3" style={{ color: GOLD }} />
                  {route.distance}
                </BadgePill>
              )}
              {stopsCount > 0 && (
                <BadgePill>
                  <MapPin className="h-3 w-3" style={{ color: GOLD }} />
                  {t("routeStops")}: {stopsCount}
                </BadgePill>
              )}
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-[22px] leading-[0.95] text-[#fff2e8] font-odesa-medium xs:text-[24px]">{name}</h3>
            <div className="mt-2 h-[3px] w-9 rounded-full bg-[#df9b3b] transition-all duration-500 group-hover:w-[72px]" />
          </div>
        </div>

        <div className="p-3.5">
          {route.tags && route.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {route.tags.map((tagId) => {
                const meta = ROUTE_TAG_OPTIONS.find((t) => t.id === tagId);
                if (!meta) return null;
                return (
                  <span
                    key={tagId}
                    className="flex items-center gap-1 rounded-full bg-[#df9b3b] px-2.5 py-1 text-[11px] text-[#002f5e] font-odesa-semi"
                  >
                    {meta.emoji} {meta.label}
                  </span>
                );
              })}
            </div>
          )}
          {desc && (
            <p className="mt-2 line-clamp-2 text-[14px] leading-[1.55] text-[#002f5e]/65 font-odesa-regular">
              {desc}
            </p>
          )}
          <span className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-[#df9b3b] font-odesa-medium">
            Детальніше <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

const RoutesPage = () => {
  const { t } = useLang();
  const { data: routes = [], isLoading } = useQuery({
    queryKey: ["routes-published"],
    queryFn: () => loadRoutes(true),
  });
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tagOrder, setTagOrder] = useState<string[]>([]);

  useEffect(() => {
    loadRouteTagOrder().then((order) => {
      if (order.length > 0) setTagOrder(order);
    });
  }, []);

  const availableTags = useMemo(() => {
    const used = new Set(routes.flatMap((r) => r.tags ?? []));
    const all = ROUTE_TAG_OPTIONS.filter((t) => used.has(t.id));
    if (!tagOrder.length) return all;
    return [...all].sort((a, b) => {
      const ai = tagOrder.indexOf(a.id);
      const bi = tagOrder.indexOf(b.id);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [routes, tagOrder]);

  const filtered = useMemo(() => {
    if (!activeTag) return routes;
    return routes.filter((r) => r.tags?.includes(activeTag));
  }, [routes, activeTag]);

  return (
    <div className="relative min-h-screen bg-[#fff2e8]">
      {/* Легкий фоновий патерн (звивиста дорога + мітки — тема маршрутів).
          ВАЖЛИВО: absolute (у потоці сторінки), а не fixed — інакше при overscroll
          на iOS патерн «відклеюється» від бежевого фону і крізь нього видно синій
          html/body. Так само зроблено на робочих сторінках. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "url(/routespattern.svg)", backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.1 }}
      />

      {/* ── Шапка-«бровь» (як на головній), мінімальна: тільки назад ───────── */}
      <div className="container-edge pt-safe relative z-10">
        <div
          className="mt-4 rounded-b-[36px] bg-[#fff2e8] px-4 pb-2.5 pt-2.5"
          style={{ boxShadow: "0 8px 24px -18px rgba(0,47,94,0.35)" }}
        >
          <div className="relative flex items-center justify-center">
            <Link
              to="/"
              aria-label={t("backHome")}
              className="tap absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-[#002f5e] transition-opacity hover:opacity-70"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1
              className="px-2 text-center text-[30px] leading-[0.95] text-[#00376c] font-odesa-medium font-odesa-ss02"
              style={{ letterSpacing: "0.04em" }}
            >
              ОДЕЩИНА
            </h1>
          </div>
        </div>
      </div>

      {/* ── Заголовок сторінки ──────────────────────────────────────────── */}
      <div className="container-edge relative z-10 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#002f5e] text-[#fff2e8]">
            <RouteIcon className="h-5 w-5" />
          </span>
          <h2 className="text-[34px] leading-[0.95] text-[#002f5e] font-odesa-bold">{t("routes")}</h2>
        </div>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.5] text-[#002f5e]/60 font-odesa-regular">
          {t("routesPageDesc")}
        </p>
      </div>

      {/* ── Фільтр за тегами: горизонтальна прокрутка, без стрілок ─────────── */}
      {availableTags.length > 0 && (
        <div className="container-edge relative z-10 pb-6">
          <div className="flex gap-2 overflow-x-auto p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="shrink-0 rounded-full px-4 py-1.5 text-[13px] font-odesa-semi transition-all duration-200"
              style={{
                backgroundColor: activeTag === null ? GOLD : "rgba(0,47,94,0.07)",
                color: activeTag === null ? "#002f5e" : "rgba(0,47,94,0.6)",
                boxShadow: activeTag === null ? "0 6px 14px -6px rgba(223,155,59,0.7)" : "none",
              }}
            >
              {t("viewAll")} ({routes.length})
            </button>
            {availableTags.map((tag) => {
              const isActive = activeTag === tag.id;
              const count = routes.filter((r) => r.tags?.includes(tag.id)).length;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setActiveTag(isActive ? null : tag.id)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-odesa-semi transition-all duration-200"
                  style={{
                    backgroundColor: isActive ? GOLD : "rgba(0,47,94,0.07)",
                    color: isActive ? "#002f5e" : "rgba(0,47,94,0.6)",
                    boxShadow: isActive ? "0 6px 14px -6px rgba(223,155,59,0.7)" : "none",
                  }}
                >
                  {tag.emoji} {tag.label}
                  <span className="ml-0.5 text-[11px] opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Список маршрутів ────────────────────────────────────────────── */}
      <main className="container-edge relative z-10 pb-tabbar md:pb-10">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#002f5e]/15 border-t-[#002f5e]" />
          </div>
        ) : routes.length === 0 ? (
          <div className="py-24 text-center text-[16px] text-[#002f5e]/45 font-odesa-regular">
            {t("noRoutesYet")}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[16px] text-[#002f5e]/45 font-odesa-regular">{t("noRoutesInCategory")}</p>
            <button
              type="button"
              onClick={() => setActiveTag(null)}
              className="mt-4 rounded-full border border-[#002f5e]/20 px-5 py-2 text-[13px] text-[#002f5e]/65 font-odesa-medium transition hover:border-[#002f5e]/40"
            >
              {t("viewAll")}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {filtered.map((route, idx) => (
              <RouteCard key={route.id} route={route} idx={idx} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
};

export default RoutesPage;
