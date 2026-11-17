import "@/v2/v2.css";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUp, Facebook, Instagram, Mail } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useV2 } from "@/v2/i18n";
import { Shield } from "./ui";

const TikTok = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M14 3c.3 1.6 1.5 2.9 3 3.3V9a7 7 0 0 1-3-1v6.2a5.2 5.2 0 1 1-5.2-5.2h.2v2.8h-.2a2.4 2.4 0 1 0 2.4 2.4V3h2.8z" />
  </svg>
);

const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/odesa_travel/", Icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/@odesa.travel", Icon: TikTok },
  { label: "Facebook", href: "https://www.facebook.com/share/1BMayDdZLc/", Icon: Facebook },
];

/**
 * Хвиля, що ламається: спина, гребінь і «козирок», загнутий уперед, під ним —
 * порожнина. Одна плитка 240×130 (одиниці viewBox), повторюється по горизонталі.
 */
const WAVE_TILE =
  "M0 100 C 50 96, 90 70, 120 40 C 140 20, 185 15, 205 35 C 220 52, 210 72, 192 70 " +
  "C 202 62, 200 46, 186 44 C 168 42, 158 62, 168 82 C 176 98, 210 102, 240 100 " +
  // основа трохи ширша за плитку — сусідні плитки перекриваються, без швів
  "L242 100 L242 130 L-2 130 L-2 100 Z";
const TILE_W = 240;
const TILE_H = 130;

/**
 * Ряд хвиль. Стрічка лише трохи ширша за вікно (vw) і зсувається рівно на одну
 * плитку за цикл — повтор непомітний. (Раніше стрічка була ~9000px, на
 * ретина-екрані ~18000px — більше за текстуру GPU, через що хвилі блимали.)
 * duration — секунд на 15 плиток, як і раніше: швидкість не змінилась.
 */
function WaveLayer({ h, color, duration, bottom, shift = 0, vw }: {
  h: number; color: string; duration: number; bottom: number; shift?: number; vw: number;
}) {
  const uid = useId().replace(/:/g, "");
  const tileW = (h * TILE_W) / TILE_H;
  // Перекриваємо вікно + зсув анімації + зсув ряду, із запасом.
  const TILES = Math.ceil(vw / tileW) + 3;
  return (
    <>
    {/* Заливка під рядом — щоб між рядами не просвічував фон сторінки. */}
    <div className="absolute inset-x-0 bottom-0" style={{ height: bottom + 4, background: color }} />
    <svg
      viewBox={`0 0 ${TILES * TILE_W} ${TILE_H}`}
      width={TILES * tileW}
      height={h}
      className="wave absolute left-0 max-w-none"
      style={{ bottom, marginLeft: -shift * tileW, animationDuration: `${duration / 15}s`, ["--tile" as string]: `${tileW}px` }}
    >
      <defs>
        <path id={`w${uid}`} d={WAVE_TILE} fill={color} />
      </defs>
      {Array.from({ length: TILES }, (_, i) => (
        <g key={i} transform={`translate(${i * TILE_W} 0)`}>
          <use href={`#w${uid}`} />
        </g>
      ))}
    </svg>
    </>
  );
}

/**
 * Два ряди простих хвиль з козирками: дальній золотий і ближній винний.
 * Рухаються лише тоді, коли підвал на екрані (поза екраном — пауза).
 */
function Waves() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  // Ширина вікна (з урахуванням масштабу сторінки) — під неї будуємо стрічку.
  const [vw, setVw] = useState(() => (typeof window === "undefined" ? 1920 : window.innerWidth));
  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setRun(e.isIntersecting), { rootMargin: "80px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} data-run={run ? "1" : undefined} className="relative h-[60px] overflow-hidden sm:h-[72px]" aria-hidden="true">
      <WaveLayer h={50} color="#df9b3b" duration={40} bottom={16} shift={0.5} vw={vw} />
      <WaveLayer h={62} color="#9f1f47" duration={26} bottom={-2} vw={vw} />
    </div>
  );
}

/**
 * Винне тло «за краєм» сторінки, коли її перетягують нижче підвалу (overscroll).
 * Цей фон браузер бере з html/body, тож поки підвал на екрані — фарбуємо їх винним.
 *
 * ЛИШЕ НА ПК (миша / тачпад): на iPhone Safari 26 з кольору body фарбує системні
 * панелі й після зміни вже не повертає (верх ставав винним назавжди), а інших
 * способів задати колір «за краєм» там немає — тож на телефонах body завжди
 * кремовий (див. PanelColor в App.tsx).
 */
const DESKTOP = "(hover: hover) and (pointer: fine)";

function useOverscrollColor(footer: React.RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const mq = window.matchMedia(DESKTOP);
    const paint = () => {
      const top = footer.current?.getBoundingClientRect().top ?? Infinity;
      const c = mq.matches && top < window.innerHeight ? "#9f1f47" : "#fff2e8";
      if (body.style.backgroundColor !== c) {
        root.style.backgroundColor = c;
        body.style.backgroundColor = c;
      }
    };
    paint();
    window.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
    mq.addEventListener("change", paint);
    return () => {
      window.removeEventListener("scroll", paint);
      window.removeEventListener("resize", paint);
      mq.removeEventListener("change", paint);
      root.style.backgroundColor = "#fff2e8";
      body.style.backgroundColor = "#fff2e8";
    };
  }, [footer]);
}

export function Footer() {
  const { t } = useV2();
  const reduce = useReducedMotion();
  const footerRef = useRef<HTMLElement>(null);
  useOverscrollColor(footerRef);
  const cols = [
    {
      title: t("footerTravel"),
      links: [
        { to: "/districts", label: t("navDistricts") },
        { to: "/marshruty", label: t("navRoutes") },
        { to: "/podiyi", label: t("navAfisha") },
        { to: "/types", label: t("navTypes") },
      ],
    },
    {
      title: t("footerServices"),
      links: [
        { to: "/asystent", label: t("navAssistant") },
        { to: "/koshyk", label: t("myTrip") },
        { to: "/poblizu", label: t("navNearby") },
        { to: "/hidy", label: t("navGuides") },
      ],
    },
  ];

  return (
    // .v2 — стилі нового дизайну й на старих сторінках (там кореня .v2 ще немає).
    <div className="v2">
    <footer ref={footerRef} className="bg-o-sand pt-2">
      <Waves />
      <div className="bg-o-wine text-o-sand">
        {/* Знизу на телефоні — місце під плаваючий док: винне тло йде під нього,
            а останні рядки не ховаються за ним. */}
        <div className="mx-auto max-w-[1280px] px-5 pb-[calc(104px+env(safe-area-inset-bottom))] pt-5 sm:px-10 sm:pt-6 lg:pb-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr] lg:gap-10">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <Shield className="h-9 w-7 text-o-sun" />
                <span className="wordmark hidden text-[20px] leading-none lg:inline">Одещина</span>
                {/* Телефон і планшет: замість слова-логотипа (воно є великим контуром нижче) — підпис поруч із гербом */}
                <p className="max-w-[260px] text-[13.5px] leading-snug text-o-sand/75 lg:hidden">{t("footerLead")}</p>
              </div>
              <p className="mt-3 hidden max-w-[300px] text-[13.5px] leading-relaxed text-o-sand/75 lg:block">{t("footerLead")}</p>
              <div className="mt-4 flex gap-2">
                {SOCIALS.map(({ label, href, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-o-sand/30 transition-colors hover:bg-o-sand hover:text-o-wine hover:ring-o-sand">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
            {cols.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-o-sunsoft">{c.title}</h2>
                <ul className="mt-3 space-y-1.5">
                  {c.links.map((l) => (
                    <li key={l.to}><Link to={l.to} className="text-[14px] text-o-sand/85 transition-colors hover:text-o-sun">{l.label}</Link></li>
                  ))}
                </ul>
              </nav>
            ))}
            <div className="col-span-2 lg:col-span-1">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-o-sunsoft">{t("footerContact")}</h2>
              <a href="mailto:tourism@od.gov.ua" className="mt-3 inline-flex items-center gap-2 text-[14px] text-o-sand/85 hover:text-o-sun">
                <Mail className="h-4 w-4" aria-hidden="true" /> tourism@od.gov.ua
              </a>
              <p className="mt-4 hidden max-w-[300px] text-[13px] leading-relaxed text-o-sand/70 lg:block">
                {t("footerDept")}
              </p>
            </div>
          </div>

          {/* Велике слово-логотип — контуром, як у попередньому дизайні; над ним — тонка лінія. */}
          <div className="mt-6 border-t border-o-sand/15 pt-5">
            <p
              aria-hidden="true"
              className="wordmark select-none whitespace-nowrap pb-[0.12em] text-center leading-[0.95] !tracking-[0.01em]"
              style={{ fontSize: "clamp(36px, 8.6vw, 120px)", color: "transparent", WebkitTextStroke: "1.5px rgba(255,242,232,0.42)" }}
            >
              Одещина
            </p>
          </div>

          <div className="mt-3 flex flex-col gap-1.5 border-t border-o-sand/15 pt-4 text-[12px] text-o-sand/60 sm:flex-row sm:justify-between">
            <span>© {new Date().getFullYear()} Одеська область</span>
            {/* ПК: праворуч — «Нагору» (на телефоні є док, а рядок там у стовпчик) */}
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
              className="group hidden items-center gap-1.5 transition-colors hover:text-o-sun lg:inline-flex"
            >
              {t("toTop")}
              <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" aria-hidden="true" />
            </button>
          </div>
          {/* Телефон і планшет: офіційний підпис — дрібно, разом із © */}
          <p className="mt-3 max-w-[420px] text-[11.5px] leading-relaxed text-o-sand/50 lg:hidden">{t("footerDept")}</p>
        </div>
      </div>
    </footer>
    </div>
  );
}
