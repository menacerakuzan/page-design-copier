import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Search } from "lucide-react";
import { WaveLines } from "@/components/decor";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useLang } from "@/lib/langContext";

const TikTokIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M14 3c.3 1.6 1.5 2.9 3 3.3V9a7 7 0 0 1-3-1v6.2a5.2 5.2 0 1 1-5.2-5.2h.2v2.8h-.2a2.4 2.4 0 1 0 2.4 2.4V3h2.8z" />
  </svg>
);

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/odesa_travel/", Icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/@odesa.travel", Icon: TikTokIcon },
];

const SiteFooter = () => {
  const { t } = useLang();
  const { data: globalCardsData } = usePageContentCards("global");
  const { data: hierarchy } = useHierarchySnapshot();
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const globalCards = useMemo(
    () => (globalCardsData ?? []).filter((card) => card.pageKey === "global"),
    [globalCardsData],
  );

  const socialLinksData = useMemo(() => {
    const socialCards = globalCards.filter((c) => c.sectionKey === "footer-social");
    if (!socialCards.length) return socialLinks;

    const iconsMap: Record<string, React.ComponentType<{ className?: string }>> = {
      instagram: Instagram,
      tiktok: TikTokIcon,
      facebook: Facebook,
    };
    return socialCards.map((card) => {
      const key = String(card.payload?.icon ?? "").toLowerCase();
      return {
        label: card.title,
        href: card.href || "#",
        Icon: iconsMap[key] || Instagram,
      };
    });
  }, [globalCards]);

  const searchItems = useMemo(
    () => [
      ...(hierarchy?.districts ?? []).map((x) => ({ label: x.name, meta: "Район", href: `/raion/${x.slug}` })),
      ...(hierarchy?.cities ?? []).map((x) => ({ label: x.name, meta: "Місто", href: `/napryamky/${x.slug}` })),
      ...(hierarchy?.objects ?? []).filter((x) => x.published).map((x) => ({
        label: x.name,
        meta: typeMeta(x.type),
        href:
          x.type === "event"
            ? `/podiyi/${x.slug}`
            : x.type === "hotel"
              ? `/hoteli/${x.slug}`
              : x.type === "restaurant"
                ? `/restorany/${x.slug}`
                : `/mistse/${x.slug}`,
      })),
    ],
    [hierarchy],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return searchItems
      .filter((item) => item.label.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [query, searchItems]);

  return (
    <footer className="relative z-10 overflow-hidden rounded-t-[44px] bg-[#002f5e] px-4 pb-[calc(64px+1.5rem)] pt-10 text-[#fff2e8] md:px-10 md:pb-6">
      {/* м'які кольорові плями-сяйва */}
      <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#df9b3b]/12 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-28 bottom-16 h-96 w-96 rounded-full bg-[#9f1f47]/20 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1200px]">
        {/* пошук */}
        <div className="mx-auto max-w-[860px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-[#fff2e8]/70" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search")}
              className="h-16 w-full rounded-full border border-[#fff2e8]/15 bg-[#9f1f47] pl-16 pr-6 text-[24px] text-[#fff2e8] shadow-[0_18px_40px_-18px_rgba(159,31,71,0.7)] placeholder:text-[#fff2e8]/70 outline-none transition-all focus:border-[#df9b3b]/60 focus:bg-[#8f1a40] font-odesa-medium"
            />
          </div>
          {filtered.length > 0 ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#002f5e]/20 bg-[#fff2e8] shadow-[0_18px_44px_rgba(0,10,30,0.45)]">
              {filtered.map((item) => (
                <Link key={`${item.meta}-${item.label}`} to={item.href} onClick={() => setQuery("")} className="flex items-center justify-between border-b border-[#002f5e]/10 px-4 py-3 transition-colors last:border-b-0 hover:bg-[#002f5e]/5">
                  <span className="text-[18px] text-[#002f5e] font-odesa-medium">{item.label}</span>
                  <span className="rounded-full bg-[#002f5e]/10 px-3 py-1 text-[12px] text-[#002f5e]/80">{item.meta}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {/* бренд + соцмережі */}
        <div className="mt-10 flex flex-col items-center text-center">
          <WaveLines className="h-6 w-28 text-[#df9b3b]" />
          <div className="mt-6 flex items-center gap-2">
            {socialLinksData.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#fff2e8]/25 text-[#fff2e8] transition-all duration-300 hover:-translate-y-1 hover:border-[#df9b3b] hover:bg-[#df9b3b] hover:text-[#002f5e]"
                aria-label={label}
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        {/* контакт для додавання об'єктів — все в один рядок, тому текст короткий */}
        <div className="mt-8 flex items-center justify-between gap-2 rounded-[18px] border border-[#fff2e8]/12 bg-[#fff2e8]/5 px-4 py-3 backdrop-blur-sm">
          <p className="shrink truncate text-[12px] leading-tight text-[#fff2e8]/60 font-odesa-regular">
            Додати об'єкт на сайт:
          </p>
          <a
            href="mailto:tourism@od.gov.ua"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#df9b3b] px-3.5 py-2 text-[12px] font-odesa-medium text-[#002f5e] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_rgba(223,155,59,0.8)]"
          >
            <Mail className="h-3.5 w-3.5" /> tourism@od.gov.ua
          </a>
        </div>

        {/* watermark */}
        <div
          aria-hidden="true"
          className="pointer-events-none mt-8 select-none overflow-hidden whitespace-nowrap text-center leading-none font-odesa-heavy font-odesa-ss02"
          style={{
            fontSize: "clamp(40px, 13vw, 190px)",
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(255,242,232,0.10)",
          }}
        >
          ОДЕЩИНА
        </div>

        {/* нижня панель */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#fff2e8]/12 pt-6">
          <p className="text-[13px] text-[#fff2e8]/40 font-odesa-regular">
            © {new Date().getFullYear()} Одещина — серце південного колориту
          </p>
          {/* Кнопка налаштувань відображення тимчасово прихована — повернемо в іншому місці */}
          <div className="hidden">
            <AccessibilityMenu
              align="right"
              onSearchClick={() => {
                searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                setTimeout(() => searchInputRef.current?.focus(), 400);
              }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

function typeMeta(type: "event" | "hotel" | "restaurant" | "attraction") {
  if (type === "event") return "Подія";
  if (type === "hotel") return "Готель";
  if (type === "restaurant") return "Ресторан";
  return "Об'єкт";
}

export default SiteFooter;
