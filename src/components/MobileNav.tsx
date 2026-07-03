import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MapPinned,
  Route as RouteIcon,
  ShoppingCart,
  Info,
  Menu as MenuIcon,
  Instagram,
  Facebook,
  Globe,
  Layers,
  Phone,
  Compass,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { useLang } from "@/lib/langContext";
import { useBasket } from "@/lib/basketContext";

const TikTokIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M14 3c.3 1.6 1.5 2.9 3 3.3V9a7 7 0 0 1-3-1v6.2a5.2 5.2 0 1 1-5.2-5.2h.2v2.8h-.2a2.4 2.4 0 1 0 2.4 2.4V3h2.8z" />
  </svg>
);

const MotionLink = motion(Link);

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
  const { count } = useBasket();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const tabs = [
    { href: "/", label: t("home"), Icon: Home },
    { href: "/districts", label: t("districts"), Icon: MapPinned },
    { href: "/marshruty", label: t("routes"), Icon: RouteIcon },
    { href: "/koshyk", label: t("basket"), Icon: ShoppingCart, badge: count },
  ];

  // У меню — лише те, чого НЕМАЄ у таб-барі (без дублювання основних розділів)
  const secondaryLinks = [
    { href: "/asystent", label: t("assistant"), Icon: Sparkles },
    { href: "/info", label: t("info"), Icon: Info },
    { href: "/types", label: t("types"), Icon: Layers },
    { href: "/poblizu", label: lang === "en" ? "Nearby" : "Поблизу", Icon: Compass },
  ];

  return (
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      {/* ── Нижня таб-навігація: плаваючий док ──────────────────── */}
      <nav
        aria-label="Головна навігація"
        className="fixed inset-x-0 bottom-0 z-30 md:hidden"
      >
        {/*
          Safari 26+ семплить background-color/backdrop-filter САМОГО fixed/sticky
          елемента біля краю екрана — якщо там щось є, ОС бере це замість реального
          фону сторінки. Тому сам <nav> лишаємо зовсім "порожнім" (без фону, блюру,
          відступів), а всю візуальну пігулку виносимо в absolute-дитину нижче:
          за community-реверс-інжинірингом (github.com/andesco/safari-color-tinting)
          абсолютно спозиційованих дітей Safari під час семплінгу ігнорує.
        */}
        <ul
          className="absolute inset-x-4 mx-auto flex max-w-[420px] items-center justify-around rounded-full bg-[#fff2e8] px-2 py-1.5 text-[#00376c] shadow-[0_4px_14px_-6px_rgba(0,47,94,0.35)]"
          style={{ bottom: "max(0.6rem, env(safe-area-inset-bottom))" }}
        >
          {tabs.map(({ href, label, Icon, badge }) => {
            const active = isActive(href);
            return (
              <li key={href} className="flex-1">
                <MotionLink
                  to={href}
                  whileTap={{ scale: 0.9 }}
                  className="tap relative flex flex-col items-center justify-center gap-1"
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={`flex flex-col items-center justify-center gap-1 transition-opacity hover:opacity-80 ${
                      active ? "text-[#df9b3b] opacity-100" : "text-[#00376c] opacity-45"
                    }`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={active ? 2.2 : 1.8} />
                    <span className="text-[9px] leading-none font-odesa-medium">{label}</span>
                  </span>
                  <AnimatePresence>
                    {badge ? (
                      <motion.span
                        key={badge}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 22 }}
                        className="absolute right-[calc(50%-18px)] top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#df9b3b] px-1 text-[10px] leading-none text-[#002f5e] font-odesa-bold shadow-[0_2px_6px_-1px_rgba(0,47,94,0.5)]"
                        aria-label={`${badge} ${t("inBasketCount")}`}
                      >
                        {badge > 99 ? "99+" : badge}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </MotionLink>
              </li>
            );
          })}
          <li className="flex-1">
            <SheetTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                className="tap flex w-full flex-col items-center justify-center gap-1 text-[#00376c] opacity-45 transition-opacity hover:opacity-80"
                aria-label="Меню"
              >
                <MenuIcon className="h-6 w-6" strokeWidth={1.8} />
                <span className="text-[9px] leading-none font-odesa-medium">{lang === "en" ? "Menu" : "Меню"}</span>
              </motion.button>
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
