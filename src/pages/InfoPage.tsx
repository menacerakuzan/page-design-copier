import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, ArrowRight, Newspaper } from "lucide-react";
import { Img } from "@/components/Img";
import SiteFooter from "@/components/SiteFooter";
import PageBrow from "@/components/PageBrow";
import { useLang } from "@/lib/langContext";
import { useSeo } from "@/hooks/useSeo";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import type { ArticleVideo } from "@/types/article";

const GOLD = "#df9b3b";

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

// YouTube (і, за потреби, Vimeo) забороняють вбудовувати звичайні watch/share
// посилання в iframe (X-Frame-Options) — потрібен саме /embed/ URL. Автори
// статей вставляють звичайне посилання зі стрічки браузера ("watch?v=..."
// або "youtu.be/..."), тож конвертуємо його тут, а не вимагаємо від людини
// вручну шукати embed-формат.
function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  if (/\/embed\//i.test(url)) return url;
  return null;
}

function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const embedUrl = toEmbedUrl(url);
  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
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
    .reduce<string[]>((acc, tok) => {
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

const ArticleCard = ({ article, idx, featured, onOpen, tl }: {
  article: Article;
  idx: number;
  featured: boolean;
  onOpen: () => void;
  tl: (uk: string | null, en: string | null) => string;
}) => (
  <motion.article
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 0.5, delay: (idx % 6) * 0.06 }}
    className={featured ? "md:col-span-2" : ""}
  >
    <button
      type="button"
      onClick={onOpen}
      className="group block h-full w-full overflow-hidden rounded-[26px] bg-[#fffaf3] text-left"
      style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.05), 0 12px 32px -10px rgba(0,47,94,0.22)" }}
    >
      <div className={`relative overflow-hidden bg-[#002f5e]/10 ${featured ? "h-[240px] xs:h-[280px] md:h-[340px]" : "h-[195px] xs:h-[226px]"}`}>
        {article.imageUrl ? (
          <Img
            w={featured ? 1100 : 700}
            src={article.imageUrl}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#002f5e]">
            <Newspaper className="h-10 w-10 text-[#fff2e8]/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#002f5e]/85 via-[#002f5e]/15 to-transparent" />
        {article.publishedAt && (
          <div className="absolute left-4 top-4">
            <span className="flex items-center gap-1.5 rounded-full border border-[#fff2e8]/30 bg-[#002f5e]/30 px-3 py-1 text-[12px] leading-none text-[#fff2e8] backdrop-blur-md font-odesa-medium">
              <Calendar className="h-3 w-3" style={{ color: GOLD }} /> {article.publishedAt}
            </span>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className={`leading-[1.02] text-[#fff2e8] font-odesa-medium ${featured ? "text-[26px] xs:text-[30px] md:text-[38px]" : "text-[22px] xs:text-[24px]"}`}>
            {tl(article.title, article.titleEn)}
          </h3>
          <div className="mt-2 h-[3px] w-9 rounded-full bg-[#df9b3b] transition-all duration-500 group-hover:w-[72px]" />
        </div>
      </div>
      {tl(article.subtitle, article.subtitleEn) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4">
          <p className="line-clamp-2 text-[14px] leading-[1.5] text-[#002f5e]/70 font-odesa-regular">
            {tl(article.subtitle, article.subtitleEn)}
          </p>
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#df9b3b] transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      )}
    </button>
  </motion.article>
);

export default function InfoPage() {
  const { t, lang, tl } = useLang();
  useSeo({
    title: t("info"),
    description:
      lang === "en"
        ? "News and articles about tourism in Odesa region."
        : "Новини та статті про туризм на Одещині.",
    lang,
  });
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const closeArticle = useCallback(() => setActiveArticle(null), []);
  const articleDialogRef = useDialogA11y(Boolean(activeArticle), closeArticle);
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
    <div className="relative min-h-screen bg-[#fff2e8] font-odesa-regular text-[#002f5e]">
      {/* Той самий фоновий патерн, що й на сторінках районів/гідів.
          absolute, не fixed — див. коментар у DistrictsPage про iOS overscroll. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "url(/districtspattern.svg)", backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.1 }}
      />

      <PageBrow />

      {/* ── Заголовок сторінки ──────────────────────────────────────────── */}
      <div className="container-edge relative z-10 pb-6 pt-8 md:pb-8 md:pt-12">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#002f5e] text-[#fff2e8] md:h-12 md:w-12">
            <Newspaper className="h-5 w-5" />
          </span>
          <h1 className="text-[34px] leading-[0.95] text-[#002f5e] font-odesa-bold md:text-[46px]">{t("info")}</h1>
        </div>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.5] text-[#002f5e]/70 font-odesa-regular md:max-w-[640px] md:text-[16px]">
          {lang === "en"
            ? "Articles, materials and useful information about tourism in Odesa region"
            : "Статті, матеріали та корисна інформація про туризм в Одеській області"}
        </p>
      </div>

      {/* ── Сітка статей ────────────────────────────────────────────────── */}
      <main id="main-content" tabIndex={-1} className="container-edge relative z-10 pb-tabbar md:pb-16">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[26px] border border-dashed border-[#002f5e]/20 py-24">
            <p className="text-[16px] text-[#002f5e]/70 font-odesa-regular">
              {lang === "en" ? "No articles yet" : "Статей поки немає"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article, idx) => (
              <ArticleCard
                key={article.id}
                article={article}
                idx={idx}
                // Перша стаття — «редакційна», на дві колонки: живіша сітка
                featured={idx === 0 && articles.length > 1}
                onOpen={() => setActiveArticle(article)}
                tl={tl}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Модалка читання статті ──────────────────────────────────────── */}
      <AnimatePresence>
        {activeArticle && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              aria-hidden="true"
              className="fixed inset-0 z-50 bg-[#001a3d]/60 backdrop-blur-sm"
              onClick={() => setActiveArticle(null)} />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              ref={articleDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="article-dialog-title"
              className="fixed inset-x-0 bottom-0 top-8 z-50 mx-auto w-full max-w-[900px] overflow-y-auto rounded-t-[32px] bg-[#fff2e8]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#002f5e]/10 bg-[#fff2e8]/95 px-6 py-4 backdrop-blur-md">
                <p className="flex items-center gap-2 text-[13px] uppercase tracking-[0.2em] font-odesa-medium text-[#002f5e]/70">
                  <Newspaper className="h-4 w-4" style={{ color: GOLD }} aria-hidden="true" /> {t("article")}
                </p>
                <button type="button" onClick={() => setActiveArticle(null)}
                  aria-label={t("close")}
                  className="tap flex h-9 w-9 items-center justify-center rounded-full border border-[#002f5e]/25 text-[#002f5e]/70 transition hover:bg-[#002f5e]/8">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="px-6 pb-16 pt-8 md:px-10">
                {activeArticle.imageUrl && (
                  <div className="mb-8 overflow-hidden rounded-[24px]" style={{ aspectRatio: "16/9" }}>
                    <Img w={1400} src={activeArticle.imageUrl} alt={activeArticle.title} className="h-full w-full object-cover" />
                  </div>
                )}
                {activeArticle.publishedAt && (
                  <p className="mb-3 flex items-center gap-1.5 text-[13px] font-odesa-regular text-[#002f5e]/70">
                    <Calendar className="h-3.5 w-3.5" style={{ color: GOLD }} /> {activeArticle.publishedAt}
                  </p>
                )}
                {/* Рівень 2, а не 1: головний заголовок сторінки — це
                    «Інформація» вище, а тут заголовок діалогового вікна. */}
                <h2 id="article-dialog-title" className="font-odesa-medium text-[36px] leading-[1.05] md:text-[52px]">
                  {tl(activeArticle.title, activeArticle.titleEn)}
                </h2>
                {tl(activeArticle.subtitle, activeArticle.subtitleEn) && (
                  <p className="mt-4 text-[20px] leading-[1.5] text-[#002f5e]/70 font-odesa-regular">
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
