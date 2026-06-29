import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { loadHierarchySnapshot, loadPublishedContentCards } from "@/lib/adminRepository";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LangProvider } from "@/lib/langContext";
import Index from "./pages/Index";
import CityPage from "./pages/CityPage";
import DistrictPage from "./pages/DistrictPage";
import EntityDetail from "./pages/EntityDetail";
import TourismTypesPage from "./pages/TourismTypesPage";
import InfoPage from "./pages/InfoPage";
import DistrictsPage from "./pages/DistrictsPage";
import Admin from "./pages/Admin";
import RoutesPage from "./pages/RoutesPage";
import NearbyPage from "./pages/NearbyPage";
import NotFound from "./pages/NotFound";
import MobileNav from "./components/MobileNav";

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

// Prefetch hierarchy immediately so detail pages render without waiting
void queryClient.prefetchQuery({
  queryKey: ["hierarchy-snapshot"],
  queryFn: () => loadHierarchySnapshot(),
});

// Prefetch content cards used by landing pages so their grids mount once
// with data already present (uses default staleTime above).
for (const pageKey of ["index", "tourism-types"]) {
  void queryClient.prefetchQuery({
    queryKey: ["content-cards", pageKey],
    queryFn: () => loadPublishedContentCards(pageKey),
  });
}

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LangProvider>
    <TooltipProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Toaster />
        <MobileNav />
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
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </LangProvider>
  </QueryClientProvider>
);

export default App;
