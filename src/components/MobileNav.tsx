import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  MapPinned,
  Route as RouteIcon,
  Info,
  Menu as MenuIcon,
  Instagram,
  Facebook,
  Globe,
  Layers,
  Phone,
  Compass,
  ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { useLang } from "@/lib/langContext";

const TikTokIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M14 3c.3 1.6 1.5 2.9 3 3.3V9a7 7 0 0 1-3-1v6.2a5.2 5.2 0 1 1-5.2-5.2h.2v2.8h-.2a2.4 2.4 0 1 0 2.4 2.4V3h2.8z" />
  </svg>
);

const socials = [
  { label: "Instagram", href: "https://www.instagram.com/odesa_travel/", Icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/@odesa.travel", Icon: TikTokIcon },
  { label: "Facebook", href: "https://www.facebook.com/share/1BMayDdZLc/", Icon: Facebook },
];

/**
 * Глобальна мобільна навігація: фіксована нижня таб-панель + висувне меню (Sheet)
 * для другорядних розділів, мови, доступності та контактів.
 * Рендериться один раз у App; ховається на ≥ md (`md:hidden`).
 */
export function MobileNav() {
  const { pathname } = useLocation();
  const { t, lang, setLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const tabs = [
    { href: "/", label: t("home"), Icon: Home },
    { href: "/districts", label: t("districts"), Icon: MapPinned },
    { href: "/marshruty", label: t("routes"), Icon: RouteIcon },
    { href: "/info", label: t("info"), Icon: Info },
  ];

  // У меню — лише те, чого НЕМАЄ у таб-барі (без дублювання основних розділів)
  const secondaryLinks = [
    { href: "/types", label: t("types"), Icon: Layers },
    { href: "/poblizu", label: lang === "en" ? "Nearby" : "Поблизу", Icon: Compass },
  ];

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      {/* ── Нижня таб-навігація ─────────────────────────────────── */}
      <nav
        aria-label="Головна навігація"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[#002f5e]/12 bg-[#fff2e8]/95 pb-safe backdrop-blur-xl md:hidden"
      >
        <ul className="mx-auto flex max-w-[520px] items-stretch justify-around px-1">
          {tabs.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <li key={href} className="flex-1">
                <Link
                  to={href}
                  className={`tap flex flex-col items-center justify-center gap-0.5 px-1 py-2 font-odesa-medium transition-colors ${
                    active ? "text-[#002f5e]" : "text-[#002f5e]/50"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.8} />
                  <span className="text-[10px] leading-none">{label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <SheetTrigger asChild>
              <button
                type="button"
                className="tap flex w-full flex-col items-center justify-center gap-0.5 px-1 py-2 font-odesa-medium text-[#002f5e]/50 transition-colors hover:text-[#002f5e]"
                aria-label="Меню"
              >
                <MenuIcon className="h-[22px] w-[22px]" strokeWidth={1.8} />
                <span className="text-[10px] leading-none">{lang === "en" ? "Menu" : "Меню"}</span>
              </button>
            </SheetTrigger>
          </li>
        </ul>
      </nav>

      {/* ── Висувне меню ────────────────────────────────────────── */}
      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto rounded-t-[28px] border-[#002f5e]/10 bg-[#fff2e8] p-0 text-[#002f5e] md:hidden"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-[#002f5e]/20" aria-hidden="true" />

        <div className="px-5 pb-8 pt-4">
          <h2 className="text-[26px] leading-none font-odesa-medium font-odesa-ss02" style={{ letterSpacing: "0.04em" }}>
            ОДЕЩИНА
          </h2>

          <nav aria-label="Більше" className="mt-5 grid grid-cols-1 gap-1.5">
            {secondaryLinks.map(({ href, label, Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  to={href}
                  onClick={() => setMenuOpen(false)}
                  className={`tap flex items-center gap-3 rounded-2xl px-4 text-[17px] font-odesa-medium transition-colors ${
                    active ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/5 hover:bg-[#002f5e]/10"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="h-4 w-4 opacity-40" />
                </Link>
              );
            })}
            <a
              href="mailto:tourism@od.gov.ua"
              className="tap flex items-center gap-3 rounded-2xl bg-[#002f5e]/5 px-4 text-[17px] font-odesa-medium transition-colors hover:bg-[#002f5e]/10"
            >
              <Phone className="h-5 w-5 shrink-0" />
              <span className="flex-1">{lang === "en" ? "Contacts" : "Контакти"}</span>
              <ChevronRight className="h-4 w-4 opacity-40" />
            </a>
          </nav>

          {/* Мова */}
          <div className="mt-6 flex items-center gap-2">
            <Globe className="h-4 w-4 opacity-50" />
            <span className="mr-1 text-[13px] opacity-60 font-odesa-regular">{t("language")}:</span>
            {(["uk", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-odesa-medium transition-colors ${
                  lang === l ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/8 hover:bg-[#002f5e]/15"
                }`}
              >
                {l === "uk" ? "Укр" : "Eng"}
              </button>
            ))}
          </div>

          {/* Доступність */}
          <div className="mt-5">
            <AccessibilityMenu align="left" />
          </div>

          {/* Соцмережі */}
          <div className="mt-6 flex items-center justify-center gap-3">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="tap flex items-center justify-center rounded-full border border-[#002f5e]/20 text-[#002f5e] transition-colors hover:border-[#df9b3b] hover:bg-[#df9b3b]"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileNav;
