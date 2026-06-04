import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </LangProvider>
  </QueryClientProvider>
);

export default App;
