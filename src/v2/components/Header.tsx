import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Home, Map, Menu, Route as RouteIcon, Search, Sparkles, X } from "lucide-react";
import { useBasket } from "@/lib/basketContext";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { useV2 } from "@/v2/i18n";
import { EASE, Logo, Shield } from "./ui";
import { SearchBox } from "./SearchBox";

export const NAV = [
  { to: "/districts", key: "navDistricts" },
  { to: "/marshruty", key: "navRoutes" },
  { to: "/podiyi", key: "navAfisha" },
  { to: "/types", key: "navTypes" },
  { to: "/hidy", key: "navGuides" },
  { to: "/info", key: "navInfo" },
] as const;

export function LangSwitch({ dark }: { dark: boolean }) {
  const { lang, setLang, t } = useV2();
  return (
    <div role="group" aria-label={t("lang")} className={`flex rounded-full p-1 text-[13px] font-semibold ${dark ? "bg-o-sand/15" : "bg-o-sea/[0.07]"}`}>
      {(["uk", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${lang === l ? (dark ? "bg-o-sand text-o-sea" : "bg-o-sea text-o-sand") : "opacity-70 hover:opacity-100"}`}
        >
          {l === "uk" ? "UA" : "EN"}
        </button>
      ))}
    </div>
  );
}

/**
 * Шапка: над відео — прозора зі світлим текстом, після прокрутки стає
 * пісочною «пігулкою» з розмиттям фону. На мобільному — лого + пошук + меню
 * (основна навігація — у плаваючому доку знизу).
 */
export function Header({ revealAfterHero = false }: {
  /** Над першим екраном є власна шапка-«бровь» — ця з'являється лише після нього. */
  revealAfterHero?: boolean;
}) {
  const { t } = useV2();
  const { count } = useBasket();
  const [scrolled, setScrolled] = useState(false);
  const [past, setPast] = useState(!revealAfterHero);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Схована шапка не повинна ловити фокус клавіатури.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    if (past) el.removeAttribute("inert"); else el.setAttribute("inert", "");
  }, [past]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setPast(!revealAfterHero || window.scrollY > window.innerHeight * 0.8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealAfterHero]);

  const dark = !scrolled;
  // Стабільні колбеки: useDialogA11y перезапускає ефект при зміні onClose.
  const closeMenu = useCallback(() => setMenu(false), []);
  const closeSearch = useCallback(() => setSearch(false), []);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed inset-x-0 top-0 z-50 px-3 pt-3 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-5 sm:pt-4 ${past ? "" : "pointer-events-none -translate-y-[140%] opacity-0"}`}
      >
        <div
          className={`mx-auto flex max-w-[1280px] items-center justify-between gap-4 rounded-full py-2 pl-5 pr-2 transition-all duration-500 ${
            scrolled
              ? "bg-o-sand/85 text-o-sea shadow-[0_12px_40px_-18px_rgba(0,30,70,0.45)] ring-1 ring-o-sea/[0.06] backdrop-blur-xl"
              : "bg-transparent text-o-sand"
          }`}
        >
          <Logo />

          <nav aria-label="Основна навігація" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.to}>
                  <NavLink
                    to={n.to}
                    className={`relative rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors ${dark ? "hover:bg-o-sand/15" : "hover:bg-o-sea/[0.07]"}`}
                  >
                    {t(n.key)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearch(true)}
              aria-label={t("search")}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${dark ? "hover:bg-o-sand/15" : "hover:bg-o-sea/[0.07]"}`}
            >
              <Search className="h-[19px] w-[19px]" aria-hidden="true" />
            </button>
            <div className="hidden sm:block"><LangSwitch dark={dark} /></div>
            <Link
              to="/koshyk"
              className={`relative hidden items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors lg:inline-flex ${
                dark ? "bg-o-sand text-o-sea hover:bg-o-sun" : "bg-o-sea text-o-sand hover:bg-o-wine"
              }`}
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              {t("myTrip")}
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-o-wine px-1 text-[11px] text-o-sand">{count}</span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setMenu(true)}
              aria-label={t("menu")}
              aria-expanded={menu}
              className={`flex h-10 w-10 items-center justify-center rounded-full lg:hidden ${dark ? "bg-o-sand/15" : "bg-o-sea/[0.07]"}`}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>{menu && <MobileMenu onClose={closeMenu} />}</AnimatePresence>
      <AnimatePresence>{search && <SearchOverlay onClose={closeSearch} />}</AnimatePresence>
    </>
  );
}

export function MobileMenu({ onClose }: { onClose: () => void }) {
  const { t } = useV2();
  const ref = useDialogA11y(true, onClose);
  const extra = [
    { to: "/poblizu", key: "navNearby" },
    { to: "/asystent", key: "navAssistant" },
    { to: "/koshyk", key: "myTrip" },
  ] as const;
  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={t("menu")}
      initial={{ clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
      animate={{ clipPath: "circle(150% at calc(100% - 40px) 40px)" }}
      exit={{ clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-o-sea px-6 pb-10 pt-5 text-o-sand"
    >
      <div className="flex items-center justify-between">
        <Logo />
        <button type="button" onClick={onClose} aria-label={t("close")} className="flex h-11 w-11 items-center justify-center rounded-full bg-o-sand/15">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <nav aria-label={t("menu")} className="mt-10">
        <ul className="space-y-1">
          {[...NAV, ...extra].map((n, i) => (
            <motion.li key={n.to} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.04, ease: EASE, duration: 0.5 }}>
              <Link to={n.to} onClick={onClose} className="group flex items-baseline gap-4 border-b border-o-sand/10 py-3 text-[30px] font-bold leading-tight">
                <span className="w-6 text-[12px] font-medium text-o-sun">{String(i + 1).padStart(2, "0")}</span>
                <span className="transition-colors group-hover:text-o-sun">{t(n.key)}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto flex items-center justify-between pt-10">
        <LangSwitch dark />
        <Shield className="h-12 w-10 text-o-sun/60" />
      </div>
    </motion.div>
  );
}

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const { t } = useV2();
  const ref = useDialogA11y(true, onClose);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-o-deep/60 px-4 pt-24 backdrop-blur-md"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={t("search")}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="mx-auto max-w-[720px]"
      >
        <div className="mb-4 flex items-center justify-between text-o-sand">
          <p className="text-[14px] opacity-80">{t("searchHint")}</p>
          <button type="button" onClick={onClose} aria-label={t("close")} className="flex h-10 w-10 items-center justify-center rounded-full bg-o-sand/15">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <SearchBox variant="overlay" autoFocus onNavigate={onClose} />
      </motion.div>
    </motion.div>
  );
}

/** Плаваючий док на мобільному: 5 найчастіших дій під великим пальцем. */
export function MobileDock() {
  const { t } = useV2();
  const { count } = useBasket();
  const items = [
    { to: "/", key: "home", Icon: Home, end: true },
    { to: "/districts", key: "navDistricts", Icon: Map },
    { to: "/asystent", key: "navAssistant", Icon: Sparkles, primary: true },
    { to: "/marshruty", key: "navRoutes", Icon: RouteIcon },
    { to: "/koshyk", key: "myTrip", Icon: Heart, badge: count },
  ] as const;
  return (
    <nav aria-label={t("menu")} className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(10px+env(safe-area-inset-bottom))] lg:hidden">
      <ul className="mx-auto flex max-w-[440px] items-center justify-between rounded-[26px] bg-o-sea/95 px-2 py-2 text-o-sand shadow-[0_18px_50px_-15px_rgba(0,20,50,0.7)] backdrop-blur-xl">
        {items.map(({ to, key, Icon, ...rest }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={"end" in rest}
              className={({ isActive }) =>
                `relative mx-auto flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[10.5px] font-medium transition-colors ${
                  "primary" in rest ? "" : isActive ? "text-o-sun" : "text-o-sand/75"
                }`
              }
            >
              {"primary" in rest ? (
                <span className="-mt-1 flex h-11 w-11 items-center justify-center rounded-full bg-o-sun text-o-deep shadow-lg">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              ) : (
                <Icon className="h-[21px] w-[21px]" aria-hidden="true" />
              )}
              <span className={"primary" in rest ? "sr-only" : ""}>{t(key)}</span>
              {"badge" in rest && rest.badge > 0 && (
                <span className="absolute right-[18%] top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-o-wine px-1 text-[10px] text-o-sand">{rest.badge}</span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
