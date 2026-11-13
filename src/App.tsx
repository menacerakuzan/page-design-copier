import { Suspense, lazy, useEffect, useLayoutEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { loadHierarchySnapshot, loadPublishedContentCards } from "@/lib/adminRepository";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/lib/langContext";
import { WinterThemeProvider, useWinterTheme } from "@/lib/winterTheme";
import { BasketProvider } from "@/lib/basketContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipLink } from "@/components/SkipLink";
import { KonamiEasterEgg } from "./components/KonamiEasterEgg";
import { MobileDock } from "./v2/components/Header";
import { MusicProvider } from "./v2/lib/music";
// Головна (новий дизайн, src/v2) — у головному бандлі, щоб перша сторінка малювалась одразу.
import V2Home from "./v2/home/HomePage";

// Home stays eager so the landing page paints from the main bundle.
// Everything else is code-split — notably Admin (TipTap) and NearbyPage
// (MapLibre), which are heavy and rarely needed on first load.
// Нова сторінка населеного пункту (src/v2); стара src/pages/CityPage лишається до кінця редизайну.
const CityPage = lazy(() => import("./v2/town/TownPage"));
// Нова сторінка району (src/v2); стара src/pages/DistrictPage лишається до кінця редизайну.
const DistrictPage = lazy(() => import("./v2/district/DistrictPage"));
// Нова сторінка туристичного об'єкта (src/v2); стара src/pages/EntityDetail лишається до кінця редизайну.
const EntityDetail = lazy(() => import("./v2/place/PlacePage"));
// Нова сторінка «Види туризму» (src/v2); стара src/pages/TourismTypesPage лишається до кінця редизайну.
const TourismTypesPage = lazy(() => import("./v2/types/TypesPage"));
const InfoPage = lazy(() => import("./v2/info/InfoPage"));
const ArticlePage = lazy(() => import("./v2/info/ArticlePage"));
// Нова сторінка районів (src/v2); стара src/pages/DistrictsPage лишається до кінця редизайну.
const DistrictsPage = lazy(() => import("./v2/districts/DistrictsPage"));
const Admin = lazy(() => import("./pages/Admin"));
const RoutesPage = lazy(() => import("./v2/routes/RoutesPage"));
const RouteDetailPage = lazy(() => import("./v2/route/RoutePage"));
const NearbyPage = lazy(() => import("./pages/NearbyPage"));
const GuidesPage = lazy(() => import("./v2/guides/GuidesPage"));
const EventsPage = lazy(() => import("./v2/afisha/AfishaPage"));
const BasketPage = lazy(() => import("./pages/BasketPage"));
const RouteMapPage = lazy(() => import("./pages/RouteMapPage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
/** Головна сама керує кольором тла (темне хіро) і не показує старих прикрас. */
const isNewHome = (pathname: string) => pathname === "/" || pathname.startsWith("/v2");

/** Старе прев'ю /v2 → головна (з тими самими параметрами). */
const V2Redirect = () => {
  const { search } = useLocation();
  return <Navigate to={`/${search}`} replace />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      // Не робити фоновий рефетч одразу після навігації — кешовані дані не
      // «осідають» вдруге, тож анімація входу карток не програється повторно.
      refetchOnMount: false,
      retry: 1,
    },
  },
});

/**
 * "Синій екран" після закриття асистента (лікується лише перезавантаженням):
 * Radix Sheet (шторка меню в MobileNav / історія в AssistantPage) при
 * розмонтуванні посеред exit-анімації (саме так і відбувається при навігації
 * назад) інколи не встигає прибрати за собою блокування скролу на body
 * (react-remove-scroll: inline overflow/padding, data-scroll-locked) і
 * aria-hidden/inert на сусідах порталу (пакет aria-hidden ставить їх на весь
 * #root, поки діалог відкритий) — сторінка лишається невидимою/замороженою
 * для тапів. Прибираємо ці сліди примусово при кожній зміні маршруту.
 */
const RouteCleanup = () => {
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("pointer-events");
    document.body.style.removeProperty("padding-right");
    document.body.style.removeProperty("margin-right");
    document.body.removeAttribute("data-scroll-locked");
    document.querySelectorAll("[data-aria-hidden]").forEach((el) => {
      el.removeAttribute("aria-hidden");
      el.removeAttribute("data-aria-hidden");
    });
    document.querySelectorAll("[inert]").forEach((el) => el.removeAttribute("inert"));

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    // iOS Safari: якщо перехід стався із закритою клавіатурою (textarea в
    // асистенті), visual viewport інколи лишається зі зсувом і другий скид
    // після завершення анімації ховання клавіатури повертає сторінку на місце.
    const cameFromAssistant = prevPathname.current.startsWith("/asystent");
    prevPathname.current = pathname;
    if (cameFromAssistant) {
      const id = window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }), 400);
      return () => window.clearTimeout(id);
    }
  }, [pathname]);

  return null;
};

/**
 * Safari 26+ бере колір верхньої/нижньої системних панелей із background-color
 * кореня (html/body). Тримаємо його в тон сторінки: головна — темна (брендовий
 * хіро), решта сторінок — кремові, щоб панелі зливались із контентом, а не
 * давали синю смугу знизу. useLayoutEffect — щоб застосувати до кадру (Safari
 * фіксує колір панелей рано і не завжди пересемплить при SPA-навігації).
 */
const PanelColor = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    if (isNewHome(pathname)) return; // нова головна виставляє колір сама
    const color = "#fff2e8";
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
  }, [pathname]);

  return null;
};

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#fff2e8]">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#002f5e]/20 border-t-[#002f5e]" />
  </div>
);

/**
 * Спільне для всіх сторінок: нижній док нового дизайну (телефон і планшет).
 * Шапка й підвал — на самих сторінках, музика — у MusicProvider.
 * Кожен компонент — у своєму ErrorBoundary: падіння одного інакше знімало б
 * усе дерево, бо вони рендеряться поза основним ErrorBoundary нижче.
 * resetKeys=[pathname] — щоб зловлена один раз помилка не ховала компонент назавжди.
 */
// Зимові прикраси — окремим чанком, лише коли тема активна.
const WinterLayer = lazy(() => import("./components/winter/WinterLayer"));

const GlobalChrome = () => {
  const { pathname } = useLocation();
  const { active: winter } = useWinterTheme();
  const home = isNewHome(pathname);
  return (
    <>
      {!pathname.startsWith("/admin") && (
        <ErrorBoundary fallback={null} resetKeys={[pathname]}><MobileDock /></ErrorBoundary>
      )}
      {!home && <ErrorBoundary fallback={null} resetKeys={[pathname]}><KonamiEasterEgg /></ErrorBoundary>}
      {!home && winter && (
        <ErrorBoundary fallback={null}><Suspense fallback={null}><WinterLayer /></Suspense></ErrorBoundary>
      )}
    </>
  );
};

const App = () => {
  // Warm the caches used by the landing/detail pages once, on mount.
  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: ["hierarchy-snapshot"],
      queryFn: () => loadHierarchySnapshot(),
    });
    for (const pageKey of ["index", "tourism-types"]) {
      void queryClient.prefetchQuery({
        queryKey: ["content-cards", pageKey],
        queryFn: () => loadPublishedContentCards(pageKey),
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <WinterThemeProvider>
        <BasketProvider>
        <TooltipProvider>
          <BrowserRouter>
          <MusicProvider>
            <RouteCleanup />
            <PanelColor />
            {/* Перший фокусабельний елемент документа — саме тут, ДО будь-якої
                навігації, інакше "пропустити шапку" не має сенсу. */}
            <SkipLink />
            <Toaster />
            <GlobalChrome />
            <ErrorBoundary>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<V2Home />} />
                  <Route path="/types" element={<TourismTypesPage />} />
                  <Route path="/districts" element={<DistrictsPage />} />
                  <Route path="/info" element={<InfoPage />} />
                  <Route path="/info/:id" element={<ArticlePage />} />
                  <Route path="/napryamky/:citySlug" element={<CityPage />} />
                  <Route path="/raion/:districtSlug" element={<DistrictPage />} />
                  <Route path="/mistse/:slug" element={<EntityDetail type="attraction" />} />
                  <Route path="/podiyi" element={<EventsPage />} />
                  <Route path="/podiyi/:slug" element={<EntityDetail type="event" />} />
                  <Route path="/restorany/:slug" element={<EntityDetail type="restaurant" />} />
                  <Route path="/hoteli/:slug" element={<EntityDetail type="hotel" />} />
                  <Route path="/marshruty" element={<RoutesPage />} />
                  <Route path="/marshruty/:id" element={<RouteDetailPage />} />
                  <Route path="/poblizu" element={<NearbyPage />} />
                  <Route path="/hidy" element={<GuidesPage />} />
                  <Route path="/koshyk" element={<BasketPage />} />
                  <Route path="/marshrut" element={<RouteMapPage />} />
                  <Route path="/asystent" element={<AssistantPage />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/v2" element={<V2Redirect />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </MusicProvider>
          </BrowserRouter>
        </TooltipProvider>
        </BasketProvider>
        </WinterThemeProvider>
      </LangProvider>
    </QueryClientProvider>
  );
};

export default App;
