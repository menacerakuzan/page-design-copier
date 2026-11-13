import { Fragment } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, PlayCircle } from "lucide-react";
import { Img } from "@/components/Img";
import { useV2 } from "@/v2/i18n";
import type { ArticleVideo } from "@/types/article";
import type { Article } from "./useArticles";

export const articlePath = (a: Article) => `/info/${a.id}`;

/** «10 червня 2026 · 5 хв читання» */
export function Meta({ a, className = "" }: { a: Article; className?: string }) {
  const { t } = useV2();
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] font-semibold text-o-wine/85 ${className}`}>
      {a.date && <span>{a.date}</span>}
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        {a.minutes} {t("inMinutes")}
      </span>
      {a.videos.length > 0 && (
        <span className="inline-flex items-center gap-1">
          <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {t("withVideo")}
        </span>
      )}
    </p>
  );
}

/** Головна стаття — великим розворотом: фото ліворуч, текст праворуч. */
export function FeaturedArticle({ a }: { a: Article }) {
  const { t } = useV2();
  return (
    <Link
      to={articlePath(a)}
      className="group grid overflow-hidden rounded-[28px] bg-[#fffaf5] shadow-[0_24px_50px_-36px_rgba(0,10,30,0.6)] ring-1 ring-o-sea/[0.06] transition-[transform,box-shadow] duration-500 hover:-translate-y-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
    >
      <div className="relative overflow-hidden bg-o-sea/10">
        <Img src={a.image} w={1100} priority alt="" className="aspect-[16/10] h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <Meta a={a} />
        <h2 className="mt-3 text-[26px] font-bold leading-[1.08] tracking-[-0.02em] [text-wrap:balance] transition-colors group-hover:text-o-wine sm:text-[34px]">{a.title}</h2>
        <p className="mt-3 line-clamp-3 text-[15.5px] leading-relaxed text-o-sea/70">{a.subtitle || a.excerpt}</p>
        <span className="mt-6 inline-flex items-center gap-2 self-start rounded-full bg-o-wine py-2 pl-5 pr-2 text-[14px] font-semibold text-o-sand transition-colors group-hover:bg-o-winedeep">
          {t("readArticle")}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-o-sand/15">
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" aria-hidden="true" />
          </span>
        </span>
      </div>
    </Link>
  );
}

/** Картка статті: чисте фото, дата й час читання, назва, уривок. */
export function ArticleCard({ a }: { a: Article }) {
  return (
    <Link
      to={articlePath(a)}
      className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-[#fffaf5] shadow-[0_16px_30px_-24px_rgba(0,10,30,0.55)] ring-1 ring-o-sea/[0.06] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(0,10,30,0.6)]"
    >
      <div className="relative overflow-hidden bg-o-sea/10">
        <Img src={a.image} w={640} alt="" className="aspect-[16/10] w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]" />
        {a.videos.length > 0 && (
          <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-o-sand/95 text-o-wine shadow-[0_6px_16px_-8px_rgba(0,20,50,0.6)]">
            <PlayCircle className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <Meta a={a} />
        <h3 className="mt-1.5 line-clamp-2 text-[17px] font-bold leading-snug transition-colors group-hover:text-o-wine">{a.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-[1.45] text-o-sea/60">{a.subtitle || a.excerpt}</p>
      </div>
    </Link>
  );
}

/* ── Текст статті з відео ──────────────────────────────────────────────── */

/** Звичайне посилання YouTube/Vimeo → адреса для вбудовування. */
function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  if (/\/embed\//i.test(url)) return url;
  return null;
}

function Video({ v, title }: { v: ArticleVideo; title: string }) {
  const src = embedUrl(v.url);
  return (
    <div className="my-10 overflow-hidden rounded-[22px] bg-o-deep shadow-[0_24px_50px_-32px_rgba(0,10,30,0.7)]">
      {src ? <iframe src={src} title={title} allow="autoplay; encrypted-media" allowFullScreen className="aspect-video w-full border-0" /> : <video src={v.url} controls className="aspect-video w-full" />}
    </div>
  );
}

/** Типографіка тексту статті (заголовки, абзаци, списки, посилання). */
const PROSE =
  "text-[17px] leading-[1.8] text-o-sea/85 sm:text-[18px] [&_a]:text-o-wine [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:text-[24px] [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:tracking-[-0.01em] [&_h2]:text-o-sea sm:[&_h2]:text-[28px] [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-[20px] [&_h3]:font-bold [&_h3]:text-o-sea [&_h1]:mb-3 [&_h1]:mt-12 [&_h1]:text-[26px] [&_h1]:font-bold [&_h1]:text-o-sea [&_li]:mt-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p+p]:mt-4 [&_strong]:font-bold [&_strong]:text-o-sea [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li::marker]:text-o-wine";

/** Текст статті, а відео — після вказаних в адмінці абзаців (0 — перед текстом). */
export function ArticleBody({ a }: { a: Article }) {
  const videos = [...a.videos].sort((x, y) => x.afterParagraph - y.afterParagraph);
  if (!videos.length) return <div className={PROSE} dangerouslySetInnerHTML={{ __html: a.html }} />;
  // Ділимо HTML на абзаци/блоки (закриваючий тег — разом із блоком)
  const parts = a.html.split(/(<\/(?:p|ul|ol|h[1-6])>)/i).reduce<string[]>((acc, tok) => {
    if (/^<\/(p|ul|ol|h[1-6])>$/i.test(tok) && acc.length) acc[acc.length - 1] += tok;
    else if (tok.trim()) acc.push(tok);
    return acc;
  }, []);
  let p = 0;
  return (
    <div className={PROSE}>
      {videos.filter((v) => v.afterParagraph === 0).map((v) => <Video key={v.id} v={v} title={a.title} />)}
      {parts.map((part, i) => {
        if (/^\s*<p/i.test(part)) p++;
        const here = /^\s*<p/i.test(part) ? videos.filter((v) => v.afterParagraph === p) : [];
        return (
          <Fragment key={i}>
            <div className="contents" dangerouslySetInnerHTML={{ __html: part }} />
            {here.map((v) => <Video key={v.id} v={v} title={a.title} />)}
          </Fragment>
        );
      })}
    </div>
  );
}

/* ── Фон ───────────────────────────────────────────────────────────────── */

/** Фон «Корисного» — ледь помітні лінійки блокнота з полем (тема «нотаток мандрівника»). */
export function NotebookBackdrop() {
  const fade = "linear-gradient(180deg, #000 0%, #000 calc(100% - 160px), transparent 100%)";
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent calc(50% - 641px), rgba(159,31,71,0.12) calc(50% - 641px), rgba(159,31,71,0.12) calc(50% - 639px), transparent calc(50% - 639px)), repeating-linear-gradient(180deg, transparent 0 35px, rgba(0,47,94,0.06) 35px 36px)",
        WebkitMaskImage: fade,
        maskImage: fade,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Фон сторінки статті — той самий «блокнот», що на «Корисно знати», але
 * лінійки лише по краях (до колонки тексту тануть), а червоне поле — з обох
 * боків, одразу за краями колонки. За текстом нічого немає — читати не заважає.
 */
export function NotebookEdges() {
  // Лінійки видно лише по краях сторінки
  const edges = "linear-gradient(90deg, #000 0, #000 calc(50% - 600px), transparent calc(50% - 500px), transparent calc(50% + 500px), #000 calc(50% + 600px), #000 100%)";
  const fade = "linear-gradient(180deg, #000 0%, #000 calc(100% - 200px), transparent 100%)";
  const red = "rgba(159,31,71,0.14)";
  return (
    <div className="pointer-events-none absolute inset-0" style={{ WebkitMaskImage: fade, maskImage: fade }} aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{ backgroundImage: "repeating-linear-gradient(180deg, transparent 0 35px, rgba(0,47,94,0.06) 35px 36px)", WebkitMaskImage: edges, maskImage: edges }}
      />
      {/* Червоне поле зліва й справа */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(90deg, transparent calc(50% - 641px), ${red} calc(50% - 641px), ${red} calc(50% - 639px), transparent calc(50% - 639px), transparent calc(50% + 639px), ${red} calc(50% + 639px), ${red} calc(50% + 641px), transparent calc(50% + 641px))`,
        }}
      />
    </div>
  );
}
