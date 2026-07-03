import { Suspense, lazy, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { loadHierarchySnapshot, loadPublishedContentCards } from "@/lib/adminRepository";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/lib/langContext";
import { BasketProvider } from "@/lib/basketContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import MobileNav from "./components/MobileNav";
import { AssistantFab } from "./components/assistant/AssistantFab";
import Index from "./pages/Index";

// Home (Index) stays eager so the landing page paints from the main bundle.
// Everything else is code-split — notably Admin (TipTap) and NearbyPage
// (MapLibre), which are heavy and rarely needed on first load.
const CityPage = lazy(() => import("./pages/CityPage"));
const DistrictPage = lazy(() => import("./pages/DistrictPage"));
const EntityDetail = lazy(() => import("./pages/EntityDetail"));
const TourismTypesPage = lazy(() => import("./pages/TourismTypesPage"));
const InfoPage = lazy(() => import("./pages/InfoPage"));
const DistrictsPage = lazy(() => import("./pages/DistrictsPage"));
const Admin = lazy(() => import("./pages/Admin"));
const RoutesPage = lazy(() => import("./pages/RoutesPage"));
const NearbyPage = lazy(() => import("./pages/NearbyPage"));
const BasketPage = lazy(() => import("./pages/BasketPage"));
const RouteMapPage = lazy(() => import("./pages/RouteMapPage"));
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

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#fff2e8]">
    <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#002f5e]/20 border-t-[#002f5e]" />
  </div>
);

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
        <BasketProvider>
        <TooltipProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Toaster />
            <MobileNav />
            <AssistantFab />
            <ErrorBoundary>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/types" element={<TourismTypesPage />} />
                  <Route path="/districts" element={<DistrictsPage />} />
                  <Route path="/info" element={<InfoPage />} />
                  <Route path="/napryamky/:citySlug" element={<CityPage />} />
                  <Route path="/raion/:districtSlug" element={<DistrictPage />} />
                  <Route path="/mistse/:slug" element={<EntityDetail type="attraction" />} />
                  <Route path="/podiyi/:slug" element={<EntityDetail type="event" />} />
                  <Route path="/restorany/:slug" element={<EntityDetail type="restaurant" />} />
                  <Route path="/hoteli/:slug" element={<EntityDetail type="hotel" />} />
                  <Route path="/marshruty" element={<RoutesPage />} />
                  <Route path="/poblizu" element={<NearbyPage />} />
                  <Route path="/koshyk" element={<BasketPage />} />
                  <Route path="/marshrut" element={<RouteMapPage />} />
                  <Route path="/asystent" element={<AssistantPage />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
        </BasketProvider>
      </LangProvider>
    </QueryClientProvider>
  );
};

export default App;
