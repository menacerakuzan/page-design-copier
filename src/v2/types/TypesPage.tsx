import "@/v2/v2.css";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { DoodlesBackdrop } from "@/v2/home/moods/DoodlesBackdrop";
import { useTypesPage } from "./useTypesPage";
import { TypesTiles } from "./VariantTiles";

/**
 * Сторінка «Види туризму» (/types), вигляд «Плитки» (обраний власником):
 * плитки як на головній, обраний вид — з обведенням свого кольору; нижче —
 * місця («Картка») з фільтром за районами й маршрути. Фон — «Дудли» з блоку
 * видів туризму на головній. Невибрані варіанти — у useful/v2/types/.
 */
export default function TypesPage() {
  const { t, lang } = useV2();
  const data = useTypesPage();
  useSeo({ title: `${t("tpTitle1")} ${t("tpTitle2")}`, description: t("tpLead"), lang });

  return (
    <div className="v2 min-h-screen">
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <DoodlesBackdrop />
        {data.loading ? (
          <div className="flex justify-center py-40">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
          </div>
        ) : (
          <TypesTiles data={data} />
        )}
      </main>
      <Footer />
    </div>
  );
}
