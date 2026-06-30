import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, X, Calendar, ArrowRight } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";
import { useLang } from "@/lib/langContext";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import type { ArticleVideo } from "@/types/article";

const star = "✦";

type Article = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  content: string;
  publishedAt: string;
  videos: ArticleVideo[];
  titleEn: string | null;
  subtitleEn: string | null;
  contentEn: string | null;
};

function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const isEmbed = /youtube\.com|youtu\.be|vimeo\.com|\/embed\//i.test(url);
  if (isEmbed) {
    return (
      <iframe
        src={url}
        title={title ?? "video"}
        allow="autoplay; encrypted-media"
        allowFullScreen
        className="h-full w-full border-0"
      />
    );
  }
  return <video src={url} controls className="h-full w-full object-contain" />;
}

function renderContentWithVideos(content: string, videos: ArticleVideo[]): React.ReactNode {
  const visible = videos.filter(v => v.url);
  if (!visible.length) {
    return <span dangerouslySetInnerHTML={{ __html: content }} />;
  }

  const sorted = [...visible].sort((a, b) => a.afterParagraph - b.afterParagraph);

  // Split HTML into paragraph chunks, keeping closing </p> tag with each chunk
  const parts = content
    .split(/(<\/p>)/i)
    .reduce<string[]>((acc, tok, i, arr) => {
      if (tok.toLowerCase() === "</p>" && acc.length > 0) {
        acc[acc.length - 1] += tok;
      } else if (tok) {
        acc.push(tok);
      }
      return acc;
    }, []);

  const videoBlock = (v: ArticleVideo) => (
    <div key={v.id} className="my-8 overflow-hidden rounded-[20px]" style={{ aspectRatio: "16/9" }}>
      <VideoEmbed url={v.url} />
    </div>
  );

  const nodes: React.ReactNode[] = [];

  // Videos before text (afterParagraph === 0)
  sorted.filter(v => v.afterParagraph === 0).forEach(v => nodes.push(videoBlock(v)));

  parts.forEach((part, idx) => {
    nodes.push(<span key={`p${idx}`} dangerouslySetInnerHTML={{ __html: part }} />);
    sorted.filter(v => v.afterParagraph === idx + 1).forEach(v => nodes.push(videoBlock(v)));
  });

  return <>{nodes}</>;
}

export default function InfoPage() {
  const { t, lang, tl } = useLang();
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const { data: cardsData } = usePageContentCards("articles");

  const articles: Article[] = useMemo(() => {
    return (cardsData ?? [])
      .filter(c => c.pageKey === "articles" && c.published)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        imageUrl: c.imageUrl,
        content: String(c.payload?.content ?? ""),
        publishedAt: String(c.payload?.publishedAt ?? ""),
        videos: (() => {
          if (Array.isArray(c.payload?.videos)) return c.payload.videos as ArticleVideo[];
          const url = String(c.payload?.videoUrl ?? "");
          return url ? [{ id: "legacy", url, afterParagraph: 0 }] : [];
        })(),
        titleEn: c.payload?.titleEn ? String(c.payload.titleEn) : null,
        subtitleEn: c.payload?.subtitleEn ? String(c.payload.subtitleEn) : null,
        contentEn: c.payload?.contentEn ? String(c.payload.contentEn) : null,
      }));
  }, [cardsData]);

  return (
    <div className="min-h-screen bg-[#fff2e8] font-odesa-regular text-[#002f5e]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#002f5e] pb-20 pt-0 text-[#fff2e8]">
        <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 md:px-5">
          <div className="rounded-b-[48px] bg-[#fff2e8] px-6 pb-4 pt-4 text-[#002f5e]">
            <div className="flex items-center justify-between gap-4 text-[14px] font-odesa-medium">
              <Link to="/" className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70">
                <ChevronLeft className="h-4 w-4" /> {t("backHome")}
              </Link>
              <div className="flex items-center gap-3 text-[#002f5e]/65">
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>Інформація</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
                <span>Одещина</span>
                <span className="text-[15px] text-[#002f5e]/30">{star}</span>
              </div>
              <Link to="/" className="transition-opacity hover:opacity-70">{t("home")}</Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto mt-16 max-w-[1400px] px-4 md:px-10">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-[12px] uppercase tracking-[0.08em] font-odesa-medium text-[#df9b3b]">
            02 — матеріали
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
            className="mt-3 font-odesa-medium text-[56px] leading-[0.92] md:text-[100px]">
            Інформація
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-5 max-w-[560px] text-[18px] leading-[1.55] text-[#fff2e8]/65 font-odesa-regular">
            Статті, матеріали та корисна інформація про туризм в Одеській області
          </motion.p>
        </div>
      </section>

      {/* Articles grid */}
      <section className="px-4 py-16 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          {articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[#002f5e]/20 py-32">
              <p className="text-[20px] text-[#002f5e]/40 font-odesa-regular">Статей поки немає</p>
              <p className="mt-2 text-[15px] text-[#002f5e]/25 font-odesa-regular">Додайте їх через адмін-панель</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, idx) => (
                <motion.article key={article.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.06 }}
                  onClick={() => setActiveArticle(article)}
                  className="group cursor-pointer overflow-hidden rounded-[24px] border border-[#002f5e]/8 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  {article.imageUrl && (
                    <div className="relative h-[220px] overflow-hidden">
                      <img loading="lazy" decoding="async" src={article.imageUrl} alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-6">
                    {article.publishedAt && (
                      <p className="mb-3 flex items-center gap-1.5 text-[12px] font-odesa-regular text-[#002f5e]/40">
                        <Calendar className="h-3.5 w-3.5" /> {article.publishedAt}
                      </p>
                    )}
                    <h3 className="font-odesa-medium text-[22px] leading-[1.1]">
                      {tl(article.title, article.titleEn)}
                    </h3>
                    {tl(article.subtitle, article.subtitleEn) && (
                      <p className="mt-2 text-[15px] leading-[1.5] text-[#002f5e]/60 font-odesa-regular line-clamp-2">
                        {tl(article.subtitle, article.subtitleEn)}
                      </p>
                    )}
                    <div className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-odesa-medium text-[#df9b3b]">
                      Читати <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Article modal */}
      <AnimatePresence>
        {activeArticle && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#002f5e]/60 backdrop-blur-sm"
              onClick={() => setActiveArticle(null)} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 top-8 z-50 mx-auto w-full max-w-[900px] overflow-y-auto rounded-t-[32px] bg-[#fff2e8]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#002f5e]/10 bg-[#fff2e8] px-6 py-4">
                <p className="text-[13px] uppercase tracking-[0.2em] font-odesa-medium text-[#002f5e]/40">{t("article")}</p>
                <button type="button" onClick={() => setActiveArticle(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#002f5e]/15 text-[#002f5e]/50 transition hover:bg-[#002f5e]/8">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 pb-16 pt-8 md:px-10">
                {activeArticle.imageUrl && (
                  <div className="mb-8 overflow-hidden rounded-[20px]" style={{ aspectRatio: "16/9" }}>
                    <img loading="lazy" decoding="async" src={activeArticle.imageUrl} alt={activeArticle.title} className="h-full w-full object-cover" />
                  </div>
                )}
                {activeArticle.publishedAt && (
                  <p className="mb-3 flex items-center gap-1.5 text-[13px] font-odesa-regular text-[#002f5e]/40">
                    <Calendar className="h-3.5 w-3.5" /> {activeArticle.publishedAt}
                  </p>
                )}
                <h1 className="font-odesa-medium text-[36px] leading-[1.05] md:text-[52px]">
                  {tl(activeArticle.title, activeArticle.titleEn)}
                </h1>
                {tl(activeArticle.subtitle, activeArticle.subtitleEn) && (
                  <p className="mt-4 text-[20px] leading-[1.5] text-[#002f5e]/65 font-odesa-regular">
                    {tl(activeArticle.subtitle, activeArticle.subtitleEn)}
                  </p>
                )}
                {((lang === "en" && activeArticle.contentEn) ? activeArticle.contentEn : activeArticle.content) && (
                  <div className="article-content mt-8 whitespace-pre-line leading-[1.7] text-[18px]">
                    {(lang === "en" && activeArticle.contentEn)
                      ? activeArticle.contentEn
                      : renderContentWithVideos(activeArticle.content, activeArticle.videos)
                    }
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SiteFooter />
    </div>
  );
}
