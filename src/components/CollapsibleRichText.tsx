import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLang } from "@/lib/langContext";

const GOLD = "#df9b3b";

const unescapeHtml = (html: string) =>
  html.includes("&lt;")
    ? html.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    : html;

/**
 * Довгий rich-text блок (адмінський HTML із TipTap) із згортанням: показує
 * фіксовану висоту + градієнт-затухання знизу, поки не натиснуть «Читати
 * далі». Висота виміряна (не CSS max-height «навмання»), тож розгортання
 * анімується плавно й без ривків. Якщо контент і так короткий — кнопка не
 * рендериться взагалі.
 */
export function CollapsibleRichText({
  html,
  collapsedMaxHeightPx = 180,
  bgColor = "#fff2e8",
  className = "",
}: {
  html: string;
  collapsedMaxHeightPx?: number;
  bgColor?: string;
  className?: string;
}) {
  const { t } = useLang();
  const contentRef = useRef<HTMLDivElement>(null);
  const [fullHeight, setFullHeight] = useState<number | null>(null);
  const [collapsedHeight, setCollapsedHeight] = useState(collapsedMaxHeightPx);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const measure = () => {
    const el = contentRef.current;
    if (!el) return;
    const h = el.scrollHeight;
    setFullHeight(h);
    // Згорнуту висоту прив'язуємо до цілої кількості рядків (line-height), а
    // не до довільного пікселя — інакше останній видимий рядок обрізається
    // прямо посеред тексту (саме такий баг тут був: "...найдекоративнішу вра"
    // обривалось на половині слова перед градієнтом).
    // Реальний рядковий інтервал беремо з першого дочірнього елемента (напр.
    // <p>), а не з контейнера el: CSS-правила на кшталт ".article-content p"
    // перевизначають font-size/line-height для самих тегів усередині,
    // тож line-height контейнера не збігається з фактичним — через це
    // виміряна висота виявлялась замалою й обрізала останній рядок тексту.
    const measuredEl = (el.firstElementChild as HTMLElement | null) ?? el;
    const cs = window.getComputedStyle(measuredEl);
    let lineHeight = parseFloat(cs.lineHeight);
    if (!lineHeight || Number.isNaN(lineHeight)) {
      lineHeight = (parseFloat(cs.fontSize) || 16) * 1.5;
    }
    const lines = Math.max(1, Math.floor(collapsedMaxHeightPx / lineHeight));
    const snapped = lines * lineHeight;
    setCollapsedHeight(snapped);
    setNeedsToggle(h > snapped + 8);
  };

  useLayoutEffect(() => {
    measure();
    const el = contentRef.current;
    if (!el) return;
    // Зображення в описі можуть довантажитись пізніше й змінити висоту —
    // перевимірюємо, поки контент згорнутий.
    const images = el.querySelectorAll("img");
    images.forEach((img) => img.addEventListener("load", measure));
    // Responsive font-size (напр. text-[17px] md:text-[28px]) міняє
    // line-height при зміні ширини вʼюпорта — перевимірюємо й тут.
    window.addEventListener("resize", measure);
    // Фірмовий шрифт (Odesa Region Type) вантажиться асинхронно — перший
    // measure() на mount часто встигає ще ДО його готовності й рахує
    // scrollHeight з fallback-шрифтом (інші метрики, коротше). Коли шрифт
    // підміняється, текст реально стає вищим, а fullHeight/collapsedHeight
    // лишались старими — з overflow:hidden це обрізало навіть розгорнутий
    // текст ("Показати менше" видно, а останній рядок все одно обтятий).
    let cancelled = false;
    void document.fonts?.ready?.then(() => { if (!cancelled) measure(); });
    return () => {
      cancelled = true;
      images.forEach((img) => img.removeEventListener("load", measure));
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  const unescaped = unescapeHtml(html);
  const height = !needsToggle ? "auto" : expanded ? (fullHeight ?? "auto") : collapsedHeight;

  return (
    <div className="relative">
      <div
        style={{ height, overflow: "hidden", transition: "height 0.45s cubic-bezier(0.22,1,0.36,1)" }}
      >
        <div
          ref={contentRef}
          // flow-root: контент з адмінки часто містить порожні <p></p> на
          // початку/в кінці (TipTap лишає їх при копіюванні). Без власного
          // block formatting context верхній margin такого порожнього
          // абзацу "втікає" за межі цього div і зсуває весь текст вниз —
          // а що висота контейнера вище фіксована й обрізана overflow:hidden,
          // рівно стільки ж пікселів губиться знизу з останнього рядка.
          className={`flow-root ${className}`}
          dangerouslySetInnerHTML={{ __html: unescaped }}
        />
      </div>
      {needsToggle && !expanded && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
          style={{ background: `linear-gradient(to bottom, transparent, ${bgColor})` }}
        />
      )}
      {needsToggle && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="tap relative mt-3 flex items-center gap-1.5 text-[14px] font-odesa-medium"
          style={{ color: GOLD }}
        >
          {expanded ? t("readLess") : t("readMore")}
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}

export default CollapsibleRichText;
