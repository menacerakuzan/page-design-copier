import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { Facebook, Instagram, Mail, Search } from "lucide-react";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useLang } from "@/lib/langContext";
import { useWinterTheme } from "@/lib/winterTheme";

/*
 * Підвал за схемою «Крафтової Одещини» (craft.od.gov.ua): хвиля над плашкою,
 * пошук, рядок «про платформу», водяний знак «ОДЕЩИНА» і нижня смуга. Анимація своя: не біжучі гребені, а повільне «дихання»
 * морської хвилі (морфінг контуру) з бліками піни, що пливуть уздовж неї.
 *
 * Зимова тема міняє кольори місцями: синя плашка стає бежевою, акценти —
 * бордовими (див. src/lib/winterTheme.tsx).
 */

const TikTokIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M14 3c.3 1.6 1.5 2.9 3 3.3V9a7 7 0 0 1-3-1v6.2a5.2 5.2 0 1 1-5.2-5.2h.2v2.8h-.2a2.4 2.4 0 1 0 2.4 2.4V3h2.8z" />
  </svg>
);

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/odesa_travel/", Icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/@odesa.travel", Icon: TikTokIcon },
];

type Palette = { plate: string; ink: string; accent: string; line: string; field: string; fieldInk: string };
const NORMAL: Palette = { plate: "#002f5e", ink: "#fff2e8", accent: "#df9b3b", line: "#df9b3b", field: "#9f1f47", fieldInk: "#fff2e8" };
const WINTER: Palette = { plate: "#fff2e8", ink: "#002f5e", accent: "#9f1f47", line: "#9f1f47", field: "#002f5e", fieldInk: "#fff2e8" };

// ── Хвиля ──────────────────────────────────────────────────────────────────
// Контур — гладка крива (Catmull-Rom → кубічні Безьє) через 13 точок; чотири
// фази з однаковою структурою команд, тож SVG <animate> плавно морфить між ними.
const W = 1440;
const STEPS = 12;
function waveD(phase: number, base: number, amp: number, close: boolean) {
  const pts = Array.from({ length: STEPS + 1 }, (_, i) => {
    const x = (i / STEPS) * W;
    const y = base + amp * Math.sin((x / W) * Math.PI * 3 + phase) + amp * 0.35 * Math.sin((x / W) * Math.PI * 7 + phase * 1.6);
    return [x, y] as const;
  });
  let d = close ? `M0 120L0 ${pts[0][1].toFixed(1)}` : `M0 ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < STEPS; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(STEPS, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return close ? `${d}L${W} 120Z` : d;
}
const phases = [0, Math.PI / 2, Math.PI, Math.PI * 1.5, Math.PI * 2];
const morph = (base: number, amp: number, close: boolean, shift = 0) =>
  phases.map((p) => waveD(p + shift, base, amp, close)).join(";");

function Swell({ palette, still }: { palette: Palette; still: boolean }) {
  const layers = [
    // Лінії лежать над попередньою секцією (вона може бути бежевою, синьою чи червоною),
    // тож одна — золото, що читається на будь-якому тлі, друга — колір плашки.
    { base: 56, amp: 9, shift: 1.9, stroke: palette.plate, opacity: 0.22, dash: "none", dur: "13s" },
    { base: 74, amp: 10, shift: 0.9, stroke: "#df9b3b", opacity: 0.95, dash: "26 10 2 10", dur: "11s" },
  ];
  return (
    <svg className="block h-[92px] w-full md:h-[120px]" viewBox={`0 0 ${W} 120`} preserveAspectRatio="none" aria-hidden="true">
      {layers.map((l, i) => (
        <path
          key={i}
          d={waveD(l.shift, l.base, l.amp, false)}
          fill="none"
          stroke={l.stroke}
          strokeOpacity={l.opacity}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray={l.dash}
          className={still ? undefined : "footer-foam"}
          style={{ animationDuration: l.dur }}
          vectorEffect="non-scaling-stroke"
        >
          {!still && <animate attributeName="d" dur={i ? "9s" : "12s"} repeatCount="indefinite" values={morph(l.base, l.amp, false, l.shift)} />}
        </path>
      ))}
      <path d={waveD(0, 96, 8, true)} fill={palette.plate}>
        {!still && <animate attributeName="d" dur="9s" repeatCount="indefinite" values={morph(96, 8, true)} />}
      </path>
    </svg>
  );
}

const SiteFooter = () => {
  const { t, lang } = useLang();
  const { active: winter } = useWinterTheme();
  const reduce = useReducedMotion();
  const pal = winter ? WINTER : NORMAL;
  const { data: globalCardsData } = usePageContentCards("global");
  const { data: hierarchy } = useHierarchySnapshot();
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const en = lang === "en";

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
    return socialCards.map((card) => ({
      label: card.title,
      href: card.href || "#",
      Icon: iconsMap[String(card.payload?.icon ?? "").toLowerCase()] || Instagram,
    }));
  }, [globalCards]);

  const searchItems = useMemo(
    () => [
      ...(hierarchy?.districts ?? []).map((x) => ({ label: x.name, meta: en ? "District" : "Район", href: `/raion/${x.slug}` })),
      ...(hierarchy?.cities ?? []).map((x) => ({ label: x.name, meta: en ? "Settlement" : "Місто", href: `/napryamky/${x.slug}` })),
      ...(hierarchy?.objects ?? []).filter((x) => x.published).map((x) => ({
        label: x.name,
        meta: typeMeta(x.type, lang),
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
    [hierarchy, lang, en],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return searchItems.filter((item) => item.label.toLowerCase().includes(normalized)).slice(0, 8);
  }, [query, searchItems]);


  return (
    <footer className="relative z-10 -mt-[92px] print:hidden md:-mt-[120px]" style={{ color: pal.ink }}>
      <Swell palette={pal} still={!!reduce} />
      <div className="-mt-px overflow-x-hidden px-4 pb-[calc(64px+1.5rem)] pt-3 md:px-10 md:pb-6" style={{ backgroundColor: pal.plate }}>
        <div className="mx-auto max-w-[1200px]">
          {/* пошук + соцмережі */}
          <div className="flex flex-col gap-4 pb-6 pt-4 md:flex-row md:items-start">
            <div className="relative flex-1">
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: `${pal.fieldInk}b3` }} />
                <input
                  ref={searchInputRef}
                  id="site-search"
                  type="search"
                  /* Аудит 5.0.1: placeholder не є текстовою міткою — потрібна aria-label. */
                  aria-label={t("search")}
                  /* Аудит 16.0.1: озвучуємо кількість знайденого при вводі. */
                  aria-describedby="site-search-status"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search")}
                  /* Аудит 8.0.1: явний контрастний обвід фокуса замість outline-none. */
                  className="h-14 w-full rounded-full border pl-14 pr-6 text-[20px] transition-all font-odesa-medium focus:border-[#df9b3b] placeholder:opacity-75"
                  style={{ backgroundColor: pal.field, color: pal.fieldInk, borderColor: `${pal.fieldInk}55` }}
                />
              </div>
              {/* Аудит 16.0.1: порожній результат має видиме повідомлення; role="status" — для скринрідера. */}
              <div id="site-search-status" role="status" aria-live="polite">
                {query.trim() !== "" && filtered.length === 0 && (
                  <div className="mt-3 rounded-2xl border border-[#002f5e]/15 bg-white px-4 py-4 text-center">
                    <p className="text-[16px] text-[#002f5e] font-odesa-medium">{t("searchNoResults")}</p>
                  </div>
                )}
                {filtered.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-[#002f5e]/15 bg-white shadow-[0_18px_44px_rgba(0,10,30,0.35)]">
                    <p className="sr-only-a11y">{t("searchFound")}: {filtered.length}</p>
                    {filtered.map((item) => (
                      <Link key={`${item.meta}-${item.label}`} to={item.href} onClick={() => setQuery("")} className="flex items-center justify-between border-b border-[#002f5e]/10 px-4 py-3 transition-colors last:border-b-0 hover:bg-[#002f5e]/5">
                        <span className="text-[18px] text-[#002f5e] font-odesa-medium">{item.label}</span>
                        <span className="rounded-full bg-[#002f5e]/10 px-3 py-1 text-[12px] text-[#002f5e]/80">{item.meta}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {socialLinksData.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-14 w-14 items-center justify-center rounded-full border transition-transform duration-300 hover:-translate-y-1"
                  style={{ borderColor: `${pal.ink}40` }}
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* про платформу */}
          <div className="flex flex-col gap-4 border-t py-6 text-[15px] leading-relaxed font-odesa-regular md:flex-row md:items-center md:justify-between md:gap-10" style={{ borderColor: `${pal.ink}33` }}>
            <p className="max-w-[720px]" style={{ color: `${pal.ink}d9` }}>{t("footerPlatform")}</p>
            {/* Аудит 17.1.5 (WCAG 1.4.12): рядок переноситься, текст не обрізається. */}
            <div className="flex flex-wrap items-center gap-3">
              <span style={{ color: `${pal.ink}bf` }}>{t("addObjectToSite")}</span>
              <a
                href="mailto:tourism@od.gov.ua"
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-odesa-medium transition-transform duration-300 hover:-translate-y-0.5"
                style={{ backgroundColor: pal.accent, color: winter ? "#fff2e8" : "#002f5e" }}
              >
                <Mail className="h-4 w-4" /> tourism@od.gov.ua
              </a>
            </div>
          </div>

          {/* Водяний знак «ОДЕЩИНА» з попереднього підвалу. Без overflow-hidden на самому
              блоці: -webkit-text-stroke малює обвід поза межами гліфа, і край останньої
              «А» зрізало б. Обрізає за потреби плашка (overflow-x-hidden).
              Аудит 1.0.2: обвід 0.42 дає ~3.3:1 — мінімум 3:1 для великого тексту. */}
          <div
            aria-hidden="true"
            className="pointer-events-none select-none whitespace-nowrap px-2 pb-6 pt-2 text-center leading-none font-odesa-heavy font-odesa-ss02"
            style={{
              fontSize: "clamp(40px, 13vw, 190px)",
              color: "transparent",
              WebkitTextStroke: `1.5px ${winter ? "rgba(0,47,94,0.42)" : "rgba(255,242,232,0.42)"}`,
            }}
          >
            ОДЕЩИНА
          </div>

          {/* нижня смуга */}
          <div className="flex flex-col gap-3 border-t pt-5 text-[13px] leading-snug font-odesa-regular md:flex-row md:items-end md:justify-between" style={{ borderColor: `${pal.ink}33`, color: `${pal.ink}a6` }}>
            <div className="max-w-[760px]">
              <p>{t("footerDisclaimer")}</p>
              <p className="mt-1">
                {en ? "Music on the site" : "Музика на сайті"}: «Одеса» · Євген Філатов, {en ? "album" : "альбом"} «Як Звучить Світ. Україна» — Producer, Composer, Lyricist: Yevhen Filatov
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-6">
              <span>© {new Date().getFullYear()} {en ? "Odesa region" : "Одещина"}</span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
                className="font-odesa-medium hover:underline hover:underline-offset-4"
                style={{ color: pal.ink }}
              >
                {en ? "Back to top ↑" : "Нагору ↑"}
              </button>
            </div>
          </div>

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

function typeMeta(type: "event" | "hotel" | "restaurant" | "attraction", lang: "uk" | "en") {
  const uk = { event: "Подія", hotel: "Готель", restaurant: "Ресторан", attraction: "Об'єкт" };
  const en = { event: "Event", hotel: "Hotel", restaurant: "Restaurant", attraction: "Place" };
  return (lang === "en" ? en : uk)[type];
}

export default SiteFooter;
