import "@/v2/v2.css";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { TrailsBackdrop } from "@/v2/routes/backdrops";
import { useTrip } from "./useTrip";
import { EmptyTrip, TripHead } from "./parts";
import { TripList } from "./TripList";

/**
 * Нова сторінка «Мій маршрут» (/koshyk; раніше «Кошик»), вигляд «Список +
 * мапа» (обраний власником): збережені ♡ місця списком із номерами (порядок —
 * перетягуванням), поруч — мапа районів із точками, підсумок і «Скласти
 * маршрут» (карта — /marshrut). «Картки» й «Квиток» — у useful/v2/trip/.
 *
 */
export default function TripPage() {
  const { t, lang } = useV2();
  const data = useTrip();
  useSeo({ title: t("trKicker"), description: t("trLead"), lang });

  return (
    <div className="v2 min-h-screen">
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <TrailsBackdrop />
        <div className="relative mx-auto max-w-[1280px] px-5 pb-16 pt-4 sm:px-10 sm:pb-24 sm:pt-6">
          <TripHead data={data} />
          {data.loading ? (
            <div className="flex justify-center py-32">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
            </div>
          ) : !data.items.length ? (
            <EmptyTrip data={data} />
          ) : (
            <TripList data={data} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
