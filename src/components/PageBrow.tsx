import { Link, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useLang } from "@/lib/langContext";
import { useBasket } from "@/lib/basketContext";

const star = "✦";

/**
 * Єдина шапка-«бровь» для всіх сторінок (включно з головною, prop `home`).
 * Мобільно: на підсторінках — «назад» + логотип (основна навігація в таб-барі
 * MobileNav), на головній — логотип + компактний рядок посилань.
 * На md+ (таб-бара немає) — трьохколонкова навігація, однакова скрізь.
 *
 * Доступність: рендериться як <header> (landmark). Слово «ОДЕЩИНА» — це
 * ЛОГОТИП сайту, а не заголовок сторінки, тому <h1> з нього робиться лише
 * на головній, де назва сайту справді є темою сторінки. На решті сторінок
 * це звичайний текст, а <h1> належить самій сторінці (район, об'єкт тощо) —
 * інакше на кожній сторінці <h1> був би однаковий «ОДЕЩИНА», що порушує
 * і вимогу «один <h1>, який описує тему сторінки», і порядок заголовків.
 */
export function PageBrow({ backTo = "/", backLabel, home = false }: {
  backTo?: string;
  backLabel?: string;
  home?: boolean;
}) {
  const { t } = useLang();
  const { count } = useBasket();
  const { pathname } = useLocation();

  const scrollToFooter = () =>
    document.querySelector("footer")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const navLeft = [
    { href: "/districts", label: t("districts") },
    { href: "/marshruty", label: t("routes") },
    { href: "/types", label: t("types") },
    { href: "/hidy", label: t("guides"), lgOnly: true },
  ];
  const navRight = [
    { href: "/koshyk", label: t("basket"), badge: count },
    { href: "/asystent", label: t("assistant") },
    { href: "/info", label: t("info"), lgOnly: true },
  ];

  const linkCls = (lgOnly?: boolean) =>
    `relative whitespace-nowrap transition-opacity hover:opacity-75 ${lgOnly ? "hidden lg:inline-block" : ""}`;

  // WCAG 4.1.2: посилання на поточну сторінку має бути програмно позначене.
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const currentAttr = (href: string) => (isCurrent(href) ? ("page" as const) : undefined);

  const wordmarkCls = (size: string) =>
    `px-2 text-center ${size} leading-[0.95] font-odesa-medium font-odesa-ss02`;

  return (
    <header className="container-edge pt-safe relative z-10">
      <div
        className={`rounded-b-[36px] bg-[#fff2e8] px-4 pb-2.5 pt-2.5 md:overflow-hidden md:rounded-b-[48px] md:px-5 md:pb-3.5 md:pt-3.5 lg:px-8 ${home ? "" : "mt-4"}`}
        style={{ boxShadow: "0 8px 24px -18px rgba(0,47,94,0.35)" }}
      >
        {/* ── Мобільний вигляд ── */}
        <div className="md:hidden">
          <div className="relative flex items-center justify-center">
            {!home && (
              <Link
                to={backTo}
                aria-label={backLabel ?? t("backHome")}
                className="tap absolute left-0 flex h-9 w-9 items-center justify-center rounded-full text-[#002f5e] transition-opacity hover:opacity-70"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}
            {home ? (
              <h1 className={`${wordmarkCls("text-[30px]")} text-[#00376c]`} style={{ letterSpacing: "0.04em" }}>
                ОДЕЩИНА
              </h1>
            ) : (
              <span className={`${wordmarkCls("text-[30px]")} text-[#00376c]`} style={{ letterSpacing: "0.04em" }}>
                ОДЕЩИНА
              </span>
            )}
          </div>
          {home && (
            <nav
              aria-label={t("mainNav")}
              className="mt-2 flex items-center justify-center gap-3 text-[13px] leading-none text-[#00376c] font-odesa-semi"
            >
              <span className="text-[13px]" aria-hidden="true">{star}</span>
              <Link to="/districts" aria-current={currentAttr("/districts")} className="transition-opacity hover:opacity-75">{t("districts")}</Link>
              <span className="text-[13px]" aria-hidden="true">{star}</span>
              <Link to="/types" aria-current={currentAttr("/types")} className="transition-opacity hover:opacity-75">{t("types")}</Link>
              <span className="text-[13px]" aria-hidden="true">{star}</span>
              <Link to="/hidy" aria-current={currentAttr("/hidy")} className="transition-opacity hover:opacity-75">{t("guides")}</Link>
            </nav>
          )}
        </div>

        {/* ── Десктоп: три колонки, як на головній ── */}
        <div className="hidden text-[#00376c] md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-5">
          <nav className="flex items-center justify-start gap-3 text-[14px] leading-none font-odesa-medium lg:gap-6 lg:text-[16px] lg:font-odesa-semi" aria-label={t("mainNav")}>
            {navLeft.map(({ href, label, lgOnly }) => (
              <Link key={href} to={href} aria-current={currentAttr(href)} className={linkCls(lgOnly)}>{label}</Link>
            ))}
          </nav>

          {home ? (
            <h1 className={wordmarkCls("text-[36px]")} style={{ letterSpacing: "0.04em" }}>
              ОДЕЩИНА
            </h1>
          ) : (
            <Link to="/" className="transition-opacity hover:opacity-80">
              <span className={`${wordmarkCls("text-[36px]")} block`} style={{ letterSpacing: "0.04em" }}>
                ОДЕЩИНА
              </span>
            </Link>
          )}

          <nav className="flex items-center justify-end gap-3 text-[14px] leading-none font-odesa-medium lg:gap-6 lg:text-[16px] lg:font-odesa-semi" aria-label={t("secondaryNav")}>
            {navRight.map(({ href, label, badge, lgOnly }) => (
              <Link key={href} to={href} aria-current={currentAttr(href)} className={linkCls(lgOnly)}>
                {label}
                {badge ? (
                  <span className="absolute -right-3.5 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#df9b3b] px-1 text-[10px] leading-none text-[#002f5e] font-odesa-bold">
                    {badge > 99 ? "99+" : badge}
                    <span className="sr-only-a11y"> {t("inBasketCount")}</span>
                  </span>
                ) : null}
              </Link>
            ))}
            <button type="button" onClick={scrollToFooter} className="whitespace-nowrap transition-opacity hover:opacity-75">
              {t("contacts")}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default PageBrow;
