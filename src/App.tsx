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
import { MobileDock } from "./v2/components/Header";
import { MusicProvider } from "./v2/lib/music";
import { LegacyV2Redirect } from "@/lib/legacyV2Redirect";
// Головна — у головному бандлі, щоб перша сторінка малювалась одразу.
import HomePage from "./v2/home/HomePage";

/* Сторінки (дизайн src/v2) — окремими чанками, крім головної. */
const TownPage = lazy(() => import("./v2/town/TownPage"));
const DistrictPage = lazy(() => import("./v2/district/DistrictPage"));
const PlacePage = lazy(() => import("./v2/place/PlacePage"));
const TypesPage = lazy(() => import("./v2/types/TypesPage"));
const InfoPage = lazy(() => import("./v2/info/InfoPage"));
const ArticlePage = lazy(() => import("./v2/info/ArticlePage"));
const DistrictsPage = lazy(() => import("./v2/districts/DistrictsPage"));
const RoutesPage = lazy(() => import("./v2/routes/RoutesPage"));
const RoutePage = lazy(() => import("./v2/route/RoutePage"));
const GuidesPage = lazy(() => import("./v2/guides/GuidesPage"));
const AfishaPage = lazy(() => import("./v2/afisha/AfishaPage"));
const TripPage = lazy(() => import("./v2/trip/TripPage"));
const TripRoutePage = lazy(() => import("./v2/tripmap/TripRoutePage"));

// Ще без власного нового дизайну (з новою шапкою/підвалом або як є).
const Admin = lazy(() => import("./pages/Admin"));
const NearbyPage = lazy(() => import("./pages/NearbyPage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
 * Radix Sheet (історія в AssistantPage; раніше й меню старого дизайну) при
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
 * Safari 26+ бере колір системних панелей із background-color кореня (html/body).
 * Сайт завжди кремовий; перший кадр задає index.html. Тут — скидання при кожній
 * навігації (на випадок, якщо сторінка змінила колір, напр. підвал на ПК).
 * useLayoutEffect — щоб застосувати до кадру.
 */
const PanelColor = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    document.documentElement.style.backgroundColor = "#fff2e8";
    document.body.style.backgroundColor = "#fff2e8";
  }, [pathname]);
  return null;
};

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#fff2e8]">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#002f5e]/20 border-t-[#002f5e]" />
  </div>
);

/**
 * Спільне для всіх сторінок поза самими роутами: нижній док (телефон і планшет),
 * пасхалка, зимова тема. Шапка й підвал — на самих сторінках; музичний плеєр — у MusicProvider.
 * Кожен компонент — у своєму ErrorBoundary: падіння одного інакше знімало б
 * усе дерево, бо вони рендеряться поза основним ErrorBoundary нижче.
 * resetKeys=[pathname] — щоб зловлена один раз помилка не ховала компонент назавжди.
 */
// Зимові прикраси — окремим чанком, лише коли тема активна.
const WinterLayer = lazy(() => import("./components/winter/WinterLayer"));

const GlobalChrome = () => {
  const { pathname } = useLocation();
  const { active: winter } = useWinterTheme();
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
          <MusicProvider>
            <LegacyV2Redirect />
            <RouteCleanup />
            <PanelColor />
            {/* Перший фокусабельний елемент документа — саме тут, ДО будь-якої
                навігації, інакше "пропустити шапку" не має сенсу. */}
            <SkipLink />
            <GlobalChrome />
            <ErrorBoundary>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/types" element={<TypesPage />} />
                  <Route path="/districts" element={<DistrictsPage />} />
                  <Route path="/info" element={<InfoPage />} />
                  <Route path="/info/:id" element={<ArticlePage />} />
                  <Route path="/napryamky/:citySlug" element={<TownPage />} />
                  <Route path="/raion/:districtSlug" element={<DistrictPage />} />
                  <Route path="/mistse/:slug" element={<PlacePage type="attraction" />} />
                  <Route path="/podiyi" element={<AfishaPage />} />
                  <Route path="/podiyi/:slug" element={<PlacePage type="event" />} />
                  <Route path="/restorany/:slug" element={<PlacePage type="restaurant" />} />
                  <Route path="/hoteli/:slug" element={<PlacePage type="hotel" />} />
                  <Route path="/marshruty" element={<RoutesPage />} />
                  <Route path="/marshruty/:id" element={<RoutePage />} />
                  <Route path="/poblizu" element={<NearbyPage />} />
                  <Route path="/hidy" element={<GuidesPage />} />
                  <Route path="/koshyk" element={<TripPage />} />
                  <Route path="/marshrut" element={<TripRoutePage />} />
                  <Route path="/asystent" element={<AssistantPage />} />
                  <Route path="/admin" element={<Admin />} />
                  {/* Старі посилання /v2/... — LegacyV2Redirect веде на звичайну адресу. */}
                  <Route path="/v2/*" element={null} />
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
