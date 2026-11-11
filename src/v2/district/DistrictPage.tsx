import "@/v2/v2.css";
import { useParams } from "react-router-dom";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import NotFound from "@/pages/NotFound";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { useDistrictPage } from "./useDistrictPage";
import { GridBackdrop } from "@/v2/districts/parts";
import { Neighbours, RoutesCompact } from "./parts";
import { VariantMix } from "./VariantMix";

/**
 * Нова сторінка району (/raion/:districtSlug) — вигляд «Мікс». Блоки — з
 * конструктора в адмінці. Фон — тиха сітка аркуша карти.
 * Невибрані варіанти («Відбитки», «Журнал») і сторінка з перемикачем — у useful/v2/.
 */
export default function DistrictPage() {
  const { districtSlug } = useParams();
  const { t, lang } = useV2();
  const data = useDistrictPage(districtSlug);

  const it = data.it;
  useSeo({
    title: it?.name ?? t("navDistricts"),
    description: it?.tagline,
    image: it?.image,
    lang,
    breadcrumbs: it
      ? [
          { name: t("home"), path: "/" },
          { name: t("navDistricts"), path: "/districts" },
          { name: it.name, path: `/raion/${it.slug}` },
        ]
      : undefined,
  });

  if (!data.loading && !it) return <NotFound />;

  return (
    <div className="v2 min-h-screen">
      {/* Сторінка починається з фото на весь екран — шапка лягає поверх нього */}
      <Header overHero />
      {/* key — щоб при переході район→район скинулись фільтри й «показати ще» */}
      <main key={districtSlug} id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <GridBackdrop opacity={0.05} />
        <div className="relative">
          {!it ? (
            <div className="flex justify-center py-40">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
            </div>
          ) : (
            <>
              <VariantMix data={data} />
              <RoutesCompact data={data} />
              <Neighbours data={data} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
