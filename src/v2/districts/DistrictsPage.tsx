import "@/v2/v2.css";
import { useState } from "react";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { GridBackdrop, PageHead } from "./parts";
import { useDistricts } from "./useDistricts";
import { Silhouettes } from "./Silhouettes";

/**
 * Нова сторінка «Райони» (/districts): заголовок із міні-картою праворуч і сім
 * районів «силуетами» — фото кожного у формі самого району. Фон — сітка.
 * Інші варіанти («Атлас», «Розвороти», фони «Точки»/«Контур») і сторінка з
 * перемикачем — у useful/v2/blocks-with-switchers/districts/.
 */
export default function DistrictsPage() {
  const { t, lang } = useV2();
  const { items, onMap, loading } = useDistricts();
  // Район під курсором — підсвічується на міні-карті в заголовку.
  const [hot, setHot] = useState<string | null>(null);

  useSeo({ title: t("navDistricts"), description: t("distLead"), lang });

  return (
    <div className="v2 min-h-screen">
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <GridBackdrop />
        <div className="relative mx-auto max-w-[1280px] px-5 pb-16 pt-4 sm:px-10 sm:pb-24 sm:pt-6">
          <PageHead items={onMap} hot={hot} onHover={setHot} />

          {/* Силуети мають власний запас угорі під тінь — тому відступ невеликий */}
          <div className="mt-6 sm:mt-2">
            {loading ? (
              <div className="flex justify-center py-24">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
              </div>
            ) : (
              <Silhouettes items={items} onHover={setHot} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
