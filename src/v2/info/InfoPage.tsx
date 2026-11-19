import "@/v2/v2.css";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { Reveal } from "@/v2/components/ui";
import { useArticles } from "./useArticles";
import { ArticleCard, FeaturedArticle, NotebookBackdrop } from "./parts";

/**
 * Нова сторінка «Корисне» (/info): статті й новини для мандрівників.
 * Перша — великим розворотом, решта — картками (чисте фото, дата й час
 * читання, назва, уривок, позначка «з відео»). Кожна стаття відкривається
 * окремою сторінкою /info/:id (раніше — у вікні поверх сторінки).
 *
 */
export default function InfoPage() {
  const { t, lang } = useV2();
  const { list, loading } = useArticles();
  useSeo({ title: t("navInfo"), description: t("infoLead"), lang });
  const [first, ...rest] = list;

  return (
    <div className="v2 min-h-screen">
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <NotebookBackdrop />
        {/* relative — щоб вміст лежав над фоном */}
        <div className="relative mx-auto max-w-[1280px] px-5 pb-16 pt-4 sm:px-10 sm:pb-24 sm:pt-6">
          <Reveal className="max-w-[720px]">
            <p className="mb-3 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
              <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
              {t("navInfo")}
            </p>
            <h1 className="text-[40px] font-bold leading-[1] tracking-[-0.025em] sm:text-[56px] lg:text-[64px]">
              {t("infoTitle1")} <span className="ital text-o-wine">{t("infoTitle2")}</span>
            </h1>
            <p className="mt-4 max-w-[600px] text-[15.5px] leading-relaxed text-o-sea/70 sm:text-[16.5px]">{t("infoLead")}</p>
          </Reveal>

          {loading ? (
            <div className="flex justify-center py-32">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
            </div>
          ) : !first ? (
            <p className="py-24 text-center text-[16px] text-o-sea/60">{t("noArticles")}</p>
          ) : (
            <>
              <Reveal className="mt-10 sm:mt-12">
                <FeaturedArticle a={first} />
              </Reveal>
              {rest.length > 0 && (
                <ul className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {rest.map((a, i) => (
                    <Reveal as="li" key={a.id} delay={(i % 3) * 0.06} y={16}>
                      <ArticleCard a={a} />
                    </Reveal>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
