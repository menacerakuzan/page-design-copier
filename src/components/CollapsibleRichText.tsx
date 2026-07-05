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
  const [needsToggle, setNeedsToggle] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const measure = () => {
    const el = contentRef.current;
    if (!el) return;
    const h = el.scrollHeight;
    setFullHeight(h);
    setNeedsToggle(h > collapsedMaxHeightPx + 8);
  };

  useLayoutEffect(() => {
    measure();
    const el = contentRef.current;
    if (!el) return;
    // Зображення в описі можуть довантажитись пізніше й змінити висоту —
    // перевимірюємо, поки контент згорнутий.
    const images = el.querySelectorAll("img");
    images.forEach((img) => img.addEventListener("load", measure));
    return () => images.forEach((img) => img.removeEventListener("load", measure));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  const unescaped = unescapeHtml(html);
  const height = !needsToggle ? "auto" : expanded ? (fullHeight ?? "auto") : collapsedMaxHeightPx;

  return (
    <div className="relative">
      <div
        style={{ height, overflow: "hidden", transition: "height 0.45s cubic-bezier(0.22,1,0.36,1)" }}
      >
        <div ref={contentRef} className={className} dangerouslySetInnerHTML={{ __html: unescaped }} />
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
