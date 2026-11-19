import { Suspense, lazy, useEffect, useLayoutEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { loadPublicSnapshot, loadPublishedContentCards } from "@/lib/adminRepository";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/lib/langContext";
import { WinterThemeProvider, useWinterTheme } from "@/lib/winterTheme";
import { BasketProvider } from "@/lib/basketContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipLink } from "@/components/SkipLink";
import { KonamiEasterEgg } from "./components/KonamiEasterEgg";
import MobileNav from "./components/MobileNav";
import { AssistantFab } from "./components/assistant/AssistantFab";
import { BackgroundMusicPlayer } from "./components/BackgroundMusicPlayer";
import { MobileDock } from "./v2/components/Header";
import { MusicProvider, useMusic } from "./v2/lib/music";
import { ByDesign, DesignModeProvider, DesignUrlCleanup, useDesignV2 } from "@/lib/designMode";
// Обидві головні — у головному бандлі, щоб перша сторінка малювалась одразу.
import Index from "./pages/Index";
import V2Home from "./v2/home/HomePage";

/*
 * Два дизайни на тих самих адресах (див. src/lib/designMode.tsx):
 * старий — для всіх, новий (src/v2) — у вкладці, відкритій через /v2 або ?v2.
 * Усе, крім головних, — окремими чанками.
 */
const V2Town = lazy(() => import("./v2/town/TownPage"));
const V2District = lazy(() => import("./v2/district/DistrictPage"));
const V2Place = lazy(() => import("./v2/place/PlacePage"));
const V2Types = lazy(() => import("./v2/types/TypesPage"));
const V2Info = lazy(() => import("./v2/info/InfoPage"));
const V2Article = lazy(() => import("./v2/info/ArticlePage"));
const V2Districts = lazy(() => import("./v2/districts/DistrictsPage"));
const V2Routes = lazy(() => import("./v2/routes/RoutesPage"));
const V2Route = lazy(() => import("./v2/route/RoutePage"));
const V2Guides = lazy(() => import("./v2/guides/GuidesPage"));
const V2Afisha = lazy(() => import("./v2/afisha/AfishaPage"));
const V2Trip = lazy(() => import("./v2/trip/TripPage"));
const V2TripMap = lazy(() => import("./v2/tripmap/TripRoutePage"));

const CityPage = lazy(() => import("./pages/CityPage"));
const DistrictPage = lazy(() => import("./pages/DistrictPage"));
const EntityDetail = lazy(() => import("./pages/EntityDetail"));
const TourismTypesPage = lazy(() => import("./pages/TourismTypesPage"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const DistrictsPage = lazy(() => import("./pages/DistrictsPage"));
const RoutesPage = lazy(() => import("./pages/RoutesPage"));
const RouteDetailPage = lazy(() => import("./pages/RouteDetailPage"));
const GuidesPage = lazy(() => import("./pages/GuidesPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const BasketPage = lazy(() => import("./pages/BasketPage"));
const RouteMapPage = lazy(() => import("./pages/RouteMapPage"));

// Спільні для обох дизайнів (ще не перероблені).
const Admin = lazy(() => import("./pages/Admin"));
const NearbyPage = lazy(() => import("./pages/NearbyPage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

/** Віджет музики старого дизайну — керує тим самим плеєром, що й новий. */
const OldMusic = () => <BackgroundMusicPlayer music={useMusic()} />;

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
  const v2 = useDesignV2();

  useLayoutEffect(() => {
    // Новий дизайн — завжди кремовий (панелі й тінь Safari робить сам).
    // Старий — темна головна, решта кремові. Перший кадр — скрипт в index.html.
    const color = !v2 && pathname === "/" ? "#001a3d" : "#fff2e8";
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
  }, [pathname, v2]);

  return null;
};

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#fff2e8]">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#002f5e]/20 border-t-[#002f5e]" />
  </div>
);

/**
 * Спільне для всіх сторінок поза самими роутами.
 * Новий дизайн: нижній док (телефон і планшет); шапка й підвал — на сторінках.
 * Старий дизайн: нижнє меню, кнопка асистента, віджет музики, пасхалка, зимова тема.
 * Сам музичний плеєр — один, у MusicProvider.
 * Кожен компонент — у своєму ErrorBoundary: падіння одного інакше знімало б
 * усе дерево, бо вони рендеряться поза основним ErrorBoundary нижче.
 * resetKeys=[pathname] — щоб зловлена один раз помилка не ховала компонент назавжди.
 */
// Зимові прикраси — окремим чанком, лише коли тема активна.
const WinterLayer = lazy(() => import("./components/winter/WinterLayer"));

const GlobalChrome = () => {
  const { pathname } = useLocation();
  const { active: winter } = useWinterTheme();
  const v2 = useDesignV2();
  if (v2) {
    const home = pathname === "/";
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
  }
  return (
    <>
      <ErrorBoundary fallback={null} resetKeys={[pathname]}><MobileNav /></ErrorBoundary>
      <ErrorBoundary fallback={null} resetKeys={[pathname]}><AssistantFab /></ErrorBoundary>
      <ErrorBoundary fallback={null} resetKeys={[pathname]}><OldMusic /></ErrorBoundary>
      <ErrorBoundary fallback={null} resetKeys={[pathname]}><KonamiEasterEgg /></ErrorBoundary>
      {winter && (
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
      queryFn: () => loadPublicSnapshot(),
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
          <DesignModeProvider>
          <MusicProvider>
            <DesignUrlCleanup />
            <RouteCleanup />
            <PanelColor />
            {/* Перший фокусабельний елемент документа — саме тут, ДО будь-якої
                навігації, інакше "пропустити шапку" не має сенсу. */}
            <SkipLink />
            <GlobalChrome />
            <ErrorBoundary>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<ByDesign v2={<V2Home />} old={<Index />} />} />
                  <Route path="/types" element={<ByDesign v2={<V2Types />} old={<TourismTypesPage />} />} />
                  <Route path="/districts" element={<ByDesign v2={<V2Districts />} old={<DistrictsPage />} />} />
                  <Route path="/info" element={<ByDesign v2={<V2Info />} old={<InfoPage />} />} />
                  {/* Окремих сторінок статей у старому дизайні не було. */}
                  <Route path="/info/:id" element={<ByDesign v2={<V2Article />} old={<NotFound />} />} />
                  <Route path="/napryamky/:citySlug" element={<ByDesign v2={<V2Town />} old={<CityPage />} />} />
                  <Route path="/raion/:districtSlug" element={<ByDesign v2={<V2District />} old={<DistrictPage />} />} />
                  <Route path="/mistse/:slug" element={<ByDesign v2={<V2Place type="attraction" />} old={<EntityDetail type="attraction" />} />} />
                  <Route path="/podiyi" element={<ByDesign v2={<V2Afisha />} old={<EventsPage />} />} />
                  <Route path="/podiyi/:slug" element={<ByDesign v2={<V2Place type="event" />} old={<EntityDetail type="event" />} />} />
                  <Route path="/restorany/:slug" element={<ByDesign v2={<V2Place type="restaurant" />} old={<EntityDetail type="restaurant" />} />} />
                  <Route path="/hoteli/:slug" element={<ByDesign v2={<V2Place type="hotel" />} old={<EntityDetail type="hotel" />} />} />
                  <Route path="/marshruty" element={<ByDesign v2={<V2Routes />} old={<RoutesPage />} />} />
                  <Route path="/marshruty/:id" element={<ByDesign v2={<V2Route />} old={<RouteDetailPage />} />} />
                  <Route path="/poblizu" element={<NearbyPage />} />
                  <Route path="/hidy" element={<ByDesign v2={<V2Guides />} old={<GuidesPage />} />} />
                  <Route path="/koshyk" element={<ByDesign v2={<V2Trip />} old={<BasketPage />} />} />
                  <Route path="/marshrut" element={<ByDesign v2={<V2TripMap />} old={<RouteMapPage />} />} />
                  <Route path="/asystent" element={<AssistantPage />} />
                  <Route path="/admin" element={<Admin />} />
                  {/* /v2/... — «вхідні двері» в новий дизайн; адресу виправляє DesignUrlCleanup. */}
                  <Route path="/v2/*" element={null} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </MusicProvider>
          </DesignModeProvider>
          </BrowserRouter>
        </TooltipProvider>
        </BasketProvider>
        </WinterThemeProvider>
      </LangProvider>
    </QueryClientProvider>
  );
};

export default App;
