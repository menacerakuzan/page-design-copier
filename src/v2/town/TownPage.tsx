import "@/v2/v2.css";
import { useParams } from "react-router-dom";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import NotFound from "@/pages/NotFound";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { GridBackdrop } from "@/v2/districts/parts";
import { useTownPage } from "./useTownPage";
import { VariantSpread } from "./VariantSpread";

/**
 * Сторінка населеного пункту: дані + вигляд «Розворот». Фон — та сама сітка,
 * що й у районів (поки не придумаємо заміну; кандидати — у useful/v2/components/).
 */
export function TownBody({ slug, children }: { slug: string | undefined; children?: React.ReactNode }) {
  const { t, lang } = useV2();
  const data = useTownPage(slug);
  const c = data.c;

  useSeo({
    title: data.name || t("navDistricts"),
    description: data.subtitle || undefined,
    image: c?.imageUrl,
    lang,
    videoUrl: c?.reelUrl,
    breadcrumbs: c
      ? [
          { name: t("home"), path: "/" },
          { name: t("navDistricts"), path: "/districts" },
          ...(data.district ? [{ name: data.district.name, path: `/raion/${data.district.slug}` }] : []),
          { name: data.name, path: `/napryamky/${c.slug}` },
        ]
      : undefined,
  });

  if (!data.loading && !c) return <NotFound />;

  return (
    <div className="v2 min-h-screen">
      <Header overHero />
      {/* key — щоб при переході пункт→пункт скинулись фільтри й «показати ще» */}
      <main key={slug} id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <GridBackdrop opacity={0.05} />
        <div className="relative">
          {!c || data.loading ? (
            <div className="flex justify-center py-40">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
            </div>
          ) : (
            <VariantSpread data={data} />
          )}
        </div>
      </main>
      <Footer />
      {children}
    </div>
  );
}

/**
 * Нова сторінка населеного пункту (/napryamky/:citySlug), вигляд «Розворот».
 * Стара src/pages/CityPage лишається до кінця редизайну. Невибрані варіанти
 * («Буклет», «Прогулянка») — у useful/v2/town/.
 */
export default function TownPage() {
  const { citySlug } = useParams();
  return <TownBody slug={citySlug} />;
}
