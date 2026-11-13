import "@/v2/v2.css";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Link2, Share2 } from "lucide-react";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import { Img } from "@/components/Img";
import NotFound from "@/pages/NotFound";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { Reveal } from "@/v2/components/ui";
import { BlockHead } from "@/v2/district/parts";
import { useShare } from "@/v2/place/parts";
import { useArticles } from "./useArticles";
import { ArticleBody, ArticleCard, Meta, NotebookEdges } from "./parts";

/**
 * Стаття «Корисного» (/info/:id): зручна колонка для читання — крихти,
 * дата й час читання, назва, підзаголовок, широке фото, текст із відео
 * між абзацами, «Поділитися»; унизу — інші статті.
 */
export default function ArticlePage() {
  const { id } = useParams();
  const { t, lang } = useV2();
  const { list, loading } = useArticles();
  const a = list.find((x) => x.id === id);
  const { share, copied } = useShare(a?.title ?? "");
  useSeo({ title: a?.title || t("navInfo"), description: (a?.subtitle || a?.excerpt || "").slice(0, 200) || undefined, image: a?.image, lang });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id]);

  if (!loading && !a) return <NotFound />;
  const others = list.filter((x) => x.id !== id).slice(0, 3);

  return (
    <div className="v2 min-h-screen">
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <NotebookEdges />
        <div className="relative">
          {!a ? (
            <div className="flex justify-center py-48">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
            </div>
          ) : (
            <article className="pb-16 pt-4 sm:pb-24 sm:pt-6">
              <header className="mx-auto max-w-[920px] px-5 sm:px-10">
                <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1 text-[13px] text-o-sea/55">
                  <Link to="/" className="transition-colors hover:text-o-wine">Одещина</Link>
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                  <Link to="/info" className="transition-colors hover:text-o-wine">{t("navInfo")}</Link>
                </nav>
                <Reveal>
                  <Meta a={a} className="mt-6" />
                  <h1 className="mt-3 text-[34px] font-bold leading-[1.05] tracking-[-0.025em] [text-wrap:balance] sm:text-[46px] lg:text-[52px]">{a.title}</h1>
                  {a.subtitle && <p className="mt-4 text-[18px] leading-relaxed text-o-sea/70 sm:text-[20px]">{a.subtitle}</p>}
                  <button
                    type="button"
                    onClick={share}
                    className="relative mt-6 inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-semibold ring-1 ring-o-sea/20 transition-colors hover:text-o-wine hover:ring-o-wine/40"
                  >
                    {copied ? <Link2 className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
                    {copied ? t("copied") : t("share")}
                  </button>
                </Reveal>
              </header>

              {a.image && (
                <Reveal className="mx-auto mt-8 max-w-[1080px] px-5 sm:mt-10 sm:px-10">
                  <Img src={a.image} w={1600} priority alt="" className="aspect-[16/9] w-full rounded-[26px] object-cover shadow-[0_30px_60px_-40px_rgba(0,10,30,0.7)]" />
                </Reveal>
              )}

              {/* Текст — ширшою колонкою; «блокнот» по краях сторінки (NotebookEdges) за текст не заходить */}
              <div className="mx-auto mt-10 w-full max-w-[920px] px-5 sm:mt-14 sm:px-10">
                <ArticleBody a={a} />
              </div>
            </article>
          )}

          {others.length > 0 && (
            <section aria-labelledby="more" className="mx-auto max-w-[1280px] px-5 pb-16 sm:px-10 sm:pb-24">
              <BlockHead
                kicker={t("navInfo")}
                title={t("moreArticles")}
                id="more"
                aside={
                  <Link to="/info" className="text-[14px] font-semibold text-o-wine underline decoration-o-wine/30 underline-offset-4 hover:decoration-o-wine">
                    {t("allArticles")}
                  </Link>
                }
              />
              <ul className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {others.map((x) => (
                  <li key={x.id}>
                    <ArticleCard a={x} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

