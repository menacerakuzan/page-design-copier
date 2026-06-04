import { useMemo, useRef, useState } from "react";
import { Facebook, Instagram, Search } from "lucide-react";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { fallbackContentCards } from "@/data/contentCardsFallback";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";

const footerColumns = [
  {
    title: "Мандрівнику",
    links: [
      { label: "Що подивитись", href: "#" },
      { label: "Куди поїхати", href: "#" },
      { label: "Маршрути", href: "#" },
      { label: "Події", href: "#" },
      { label: "Інформація", href: "#" },
    ],
  },
  {
    title: "Медіа",
    links: [
      { label: "Новини", href: "#" },
      { label: "Фото та відео", href: "#" },
      { label: "Контакти", href: "#" },
      { label: "Логотипи", href: "#" },
    ],
  },
];

const TikTokIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M14 3c.3 1.6 1.5 2.9 3 3.3V9a7 7 0 0 1-3-1v6.2a5.2 5.2 0 1 1-5.2-5.2h.2v2.8h-.2a2.4 2.4 0 1 0 2.4 2.4V3h2.8z" />
  </svg>
);

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/odesa_travel/", Icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/@odesa.travel", Icon: TikTokIcon },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1BMayDdZLc/",
    Icon: Facebook,
  },
];

const SiteFooter = () => {
  const { data: globalCardsData } = usePageContentCards("global");
  const { data: hierarchy } = useHierarchySnapshot();
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<"uk" | "en">("uk");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const globalCards = useMemo(() => {
    const live = (globalCardsData ?? []).filter((card) => card.pageKey === "global");
    if (live.length) return live;
    return fallbackContentCards.filter((card) => card.pageKey === "global" && card.published);
  }, [globalCardsData]);

  const footerColumnsData = useMemo(() => {
    const visitorCards = globalCards.filter((c) => c.sectionKey === "footer-visitor");
    const mediaCards = globalCards.filter((c) => c.sectionKey === "footer-media");

    if (!visitorCards.length && !mediaCards.length) return footerColumns;
    return [
      { title: "Мандрівнику", links: visitorCards.map((c) => ({ label: c.title, href: c.href || "#" })) },
      { title: "Медіа", links: mediaCards.map((c) => ({ label: c.title, href: c.href || "#" })) },
    ];
  }, [globalCards]);

  const socialLinksData = useMemo(() => {
    const socialCards = globalCards.filter((c) => c.sectionKey === "footer-social");
    if (!socialCards.length) return socialLinks;

    const iconsMap: Record<string, any> = {
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
      ...(hierarchy?.regions ?? []).map((x) => ({ label: x.name, meta: "Область", href: "#" })),
      ...(hierarchy?.districts ?? []).map((x) => ({ label: x.name, meta: "Район", href: "#" })),
      ...(hierarchy?.cities ?? []).map((x) => ({ label: x.name, meta: "Місто", href: `/napryamky/${x.slug}` })),
      ...(hierarchy?.objects ?? []).map((x) => ({
        label: x.name,
        meta: typeMeta(x.type),
        href:
          x.type === "event"
            ? `/podiyi/${x.slug}`
            : x.type === "hotel"
              ? `/hoteli/${x.slug}`
              : x.type === "restaurant"
                ? `/restorany/${x.slug}`
                : "#",
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
    <footer className="relative z-10 bg-[#fff2e8] px-4 py-16 text-[#002f5e] md:px-10">
      <div className="mx-auto mb-8 max-w-[1200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-[#fff2e8]/70" />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук"
            className="h-16 w-full rounded-full border border-[#002f5e]/10 bg-[#9f1f47] pl-16 pr-6 text-[24px] text-[#fff2e8] placeholder:text-[#fff2e8]/70 outline-none transition-colors focus:border-[#002f5e]/40 focus:bg-[#8f1a40] font-odesa-medium"
          />
        </div>
        {filtered.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#002f5e]/20 bg-[#fff2e8] shadow-[0_10px_30px_rgba(0,47,94,0.10)]">
            {filtered.map((item) => (
              <a key={`${item.meta}-${item.label}`} href={item.href} className="flex items-center justify-between border-b border-[#002f5e]/10 px-4 py-3 transition-colors last:border-b-0 hover:bg-[#002f5e]/5">
                <span className="text-[18px] text-[#002f5e] font-odesa-medium">{item.label}</span>
                <span className="rounded-full bg-[#002f5e]/10 px-3 py-1 text-[12px] text-[#002f5e]/80">{item.meta}</span>
              </a>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mx-auto max-w-[1200px] border-t border-[#002f5e]/20 pt-10">
        <div className="flex flex-col items-center text-center">
          <h4 className="text-[30px] leading-none text-[#002f5e]/70 font-odesa-medium">Зв'язок</h4>
          <div className="mt-4 flex items-center gap-2">
            {socialLinksData.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#002f5e]/30 text-[#002f5e] transition-colors hover:bg-[#002f5e] hover:text-[#fff2e8]"
                aria-label={label}
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          <p className="mt-6 max-w-[420px] text-[15px] leading-[1.6] text-[#002f5e]/60 font-odesa-regular">
            Для звернень щодо додавання об'єкту на сайт — напишіть нам на пошту:
          </p>
          <a href="mailto:tourism@od.gov.ua"
            className="mt-2 inline-block text-[18px] font-odesa-medium text-[#9f1f47] transition-opacity hover:opacity-70">
            tourism@od.gov.ua
          </a>
        </div>
      </div>

      {/* Accessibility menu — bottom right */}
      <div className="mx-auto mt-8 max-w-[1200px] flex justify-end">
        <AccessibilityMenu
          lang={lang}
          onLangChange={setLang}
          align="right"
          onSearchClick={() => {
            searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            setTimeout(() => searchInputRef.current?.focus(), 400);
          }}
        />
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
