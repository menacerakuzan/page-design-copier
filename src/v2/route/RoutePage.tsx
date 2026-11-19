import "@/v2/v2.css";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import NotFound from "@/pages/NotFound";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { ContoursBackdrop } from "./backdrop";
import { useRoutePage } from "./useRoutePage";
import { RouteSpread } from "./VariantSpread";

/**
 * Нова сторінка маршруту (/marshruty/:id), вигляд «Розворот» (обраний
 * власником). «Стрічка» й «Путівник» — у useful/v2/route/. Стара
 */
export default function RoutePage() {
  const { id } = useParams();
  const { t, lang } = useV2();
  const data = useRoutePage(id);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id]);

  useSeo({
    title: data.name || t("routesKicker"),
    description: data.desc.slice(0, 200) || undefined,
    image: data.route?.imageUrl,
    lang,
    breadcrumbs: data.route
      ? [
          { name: t("home"), path: "/" },
          { name: t("routesKicker"), path: "/marshruty" },
          { name: data.name, path: `/marshruty/${data.route.id}` },
        ]
      : undefined,
  });

  if (data.notFound) return <NotFound />;

  return (
    <div className="v2 min-h-screen">
      <Header overHero />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <ContoursBackdrop />
        {/* relative — щоб вміст лежав над фоном (позиціонований фон інакше малюється поверх) */}
        <div className="relative">
          {data.loading || !data.route ? (
            <div className="flex justify-center py-48">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
            </div>
          ) : (
            <RouteSpread data={data} />
          )}
        </div>
      </main>
      <Footer />

    </div>
  );
}
