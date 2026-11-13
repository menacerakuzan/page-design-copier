import "@/v2/v2.css";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { RoadsBackdrop } from "@/v2/home/routes/RoadsBackdrop";
import { TrailsBackdrop } from "./backdrops";
import { useRoutesPage } from "./useRoutesPage";
import { RoutesCatalog } from "./VariantCatalog";

/**
 * Нова сторінка «Маршрути» (/marshruty), вигляд «Каталог» (обраний власником):
 * у шапці — карта районів для вибору, під нею типи й перемикач сітки, далі
 * картки з попереднім переглядом маршруту на карті. Фон — дві пунктирні
 * «дороги», як у блоці маршрутів на головній, а між ними — «Стежки». Інші варіанти («Атлас»,
 * «Розвороти») — у useful/v2/routes/. Стара src/pages/RoutesPage лишається
 * до кінця редизайну.
 */
export default function RoutesPage() {
  const { t, lang } = useV2();
  const data = useRoutesPage();
  useSeo({ title: t("routesKicker"), description: t("routesLead"), lang });

  return (
    <div className="v2 min-h-screen">
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <TrailsBackdrop />
        <RoadsBackdrop />
        {data.loading ? (
          <div className="flex justify-center py-40">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
          </div>
        ) : (
          <RoutesCatalog data={data} />
        )}
      </main>
      <Footer />
    </div>
  );
}

