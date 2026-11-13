import { useMemo } from "react";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import type { ArticleVideo } from "@/types/article";
import { plain, useV2 } from "@/v2/i18n";

/** Стаття «Корисного» (картки конструктора з pageKey = articles). */
export type Article = {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  /** HTML; перший <h1>, що повторює назву, прибрано. */
  html: string;
  /** Уривок для карток — початок тексту без заголовків. */
  excerpt: string;
  /** Дата з адмінки: «10.06.2026» → ISO для сортування й підпису. */
  iso?: string;
  date: string;
  minutes: number;
  videos: ArticleVideo[];
};

/** «10.06.2026» → «2026-06-10». */
function toIso(d: string) {
  const m = d.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : undefined;
}

/** Статті у порядку з адмінки; дата — гарним підписом, час читання — ~180 слів на хвилину. */
export function useArticles() {
  const { tl, lang } = useV2();
  const { data, isLoading } = usePageContentCards("articles");
  const list = useMemo<Article[]>(() => {
    const fmt = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "uk-UA", { day: "numeric", month: "long", year: "numeric" });
    return (data ?? [])
      .filter((c) => c.pageKey === "articles" && c.published)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => {
        const p = (c.payload ?? {}) as Record<string, unknown>;
        const title = tl(c.title, p.titleEn ? String(p.titleEn) : undefined);
        const raw = (lang === "en" && p.contentEn ? String(p.contentEn) : String(p.content ?? "")).trim();
        // Перший заголовок тексту часто дублює назву — прибираємо його (назву показуємо окремо)
        const html = raw.replace(/^<h1[^>]*>[\s\S]*?<\/h1>/i, "");
        const text = plain(html.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, " "));
        const words = plain(html).split(/\s+/).filter(Boolean).length;
        const iso = toIso(String(p.publishedAt ?? ""));
        const videos = Array.isArray(p.videos) ? (p.videos as ArticleVideo[]) : p.videoUrl ? [{ id: "legacy", url: String(p.videoUrl), afterParagraph: 0 }] : [];
        return {
          id: c.id,
          title,
          subtitle: tl(c.subtitle ?? "", p.subtitleEn ? String(p.subtitleEn) : undefined) || "",
          image: c.imageUrl ?? undefined,
          html,
          excerpt: text.slice(0, 260),
          iso,
          date: iso ? fmt.format(new Date(`${iso}T12:00:00Z`)).replace(/\s*р\.$/, "") : String(p.publishedAt ?? ""),
          minutes: Math.max(1, Math.round(words / 180)),
          videos: videos.filter((v) => v.url),
        };
      });
  }, [data, tl, lang]);
  return { list, loading: isLoading };
}
