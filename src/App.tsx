import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import BilhorodDnistrovskyi from "./pages/BilhorodDnistrovskyi.tsx";
import EventBessarabiaFestival from "./pages/EventBessarabiaFestival.tsx";
import RestaurantRybnyiDvir from "./pages/RestaurantRybnyiDvir.tsx";
import HotelFortetsiaView from "./pages/HotelFortetsiaView.tsx";
import NotFound from "./pages/NotFound.tsx";

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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/napryamky/bilhorod-dnistrovskyi" element={<BilhorodDnistrovskyi />} />
          <Route path="/podiyi/festyval-vyna-ta-smaku-bessarabii" element={<EventBessarabiaFestival />} />
          <Route path="/restorany/rybnyy-dvir" element={<RestaurantRybnyiDvir />} />
          <Route path="/hoteli/fortetsia-view-hotel" element={<HotelFortetsiaView />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
