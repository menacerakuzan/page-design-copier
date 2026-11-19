import "@/v2/v2.css";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { PinsBackdrop } from "./backdrop";
import { useTripRoute } from "./useTripRoute";
import { NotEnough, RouteHead } from "./parts";
import { RouteNavigator } from "./RouteNavigator";

/**
 * Нова сторінка «Маршрут по місцях» (/marshrut): маршрут по дорогах між
 * місцями з «Мого маршруту» (або з посилання ?m=…, яким поділилися).
 * Вигляд «Навігатор» (обраний власником): велика карта, під нею легка
 * стрічка порядку зупинок. «Повна карта» й «По днях» — у useful/v2/tripmap/.
 *
 */
export default function TripRoutePage() {
  const { t, lang } = useV2();
  const data = useTripRoute();
  useSeo({ title: `${t("rmTitle1")} ${t("rmTitle2")}`, description: t("rmLead"), lang });

  return (
    <div className="v2 min-h-screen">
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <PinsBackdrop />
        <div className="relative mx-auto max-w-[1280px] px-5 pb-16 pt-4 sm:px-10 sm:pb-24 sm:pt-6">
          {data.loading ? (
            <div className="flex justify-center py-32">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
            </div>
          ) : data.stops.length < 2 ? (
            <>
              <RouteHead data={data} />
              <NotEnough />
            </>
          ) : (
            <RouteNavigator data={data} />
          )}
        </div>
      </main>
      <Footer />

    </div>
  );
}
