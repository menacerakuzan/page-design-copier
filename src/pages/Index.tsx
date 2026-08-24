import { useEffect, useMemo, useRef, useState } from "react";
import { Img } from "@/components/Img";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Instagram, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import heroVideo from "@/assets/episode-01.mp4";
import geminiLogo from "@/assets/gemini-svg-2.svg";
import SiteFooter from "@/components/SiteFooter";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { useLang } from "@/lib/langContext";
import { useSeo } from "@/hooks/useSeo";
import PollWidget from "@/components/PollWidget";
import PageBrow from "@/components/PageBrow";
import { HeroBackgroundVideo } from "@/components/HeroBackgroundVideo";
import { CompassRose } from "@/components/decor";

const featureCards = [
  { number: "01", first: "Види", second: "туризму", href: "/types" },
  { number: "02", first: "Інформація", second: "", href: "/info" },
];

const TikTokIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M14 3c.3 1.6 1.5 2.9 3 3.3V9a7 7 0 0 1-3-1v6.2a5.2 5.2 0 1 1-5.2-5.2h.2v2.8h-.2a2.4 2.4 0 1 0 2.4 2.4V3h2.8z" />
  </svg>
);

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/odesa_travel/", Icon: Instagram },
  { label: "TikTok", href: "https://www.tiktok.com/@odesa.travel", Icon: TikTokIcon },
];

const ArrowGlyph = ({ direction }: { direction: "up" | "down" }) => (
  <svg
    viewBox="340 1084 85 60"
    className={`h-5 w-5 ${direction === "up" ? "rotate-90" : "-rotate-90"}`}
    aria-hidden="true"
  >
    <polygon
      fill="#002f5e"
      points="415.07 1107.28 383.26 1107.28 393.54 1089.66 356.07 1113.89 393.54 1138.12 383.25 1120.49 415.07 1120.49 415.07 1107.28"
    />
  </svg>
);

const star = "✦";

const Index = () => {
  const { t, tl, lang } = useLang();
  useSeo({
    title: "Одещина",
    description:
      lang === "en"
        ? "Explore Odesa region — a tourist guide to attractions, events, restaurants and hotels in Odeshchyna, Ukraine."
        : "Досліджуй Одещину — туристичний гід по Одеській області: пам'ятки, події, ресторани та готелі.",
    lang,
  });
  const { data: indexCardsData } = usePageContentCards("index");
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const destinationsScrollerRef = useRef<HTMLDivElement | null>(null);
  const interestingScrollerRef = useRef<HTMLDivElement | null>(null);
  const interestingDragRef = useRef(0);
  const footerRef = useRef<HTMLElement | null>(null);

  const scrollToFooter = () => footerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const [activeAttraction, setActiveAttraction] = useState(0);

  // Реальна висота скролера «Цікаве» (замір, а не вгадування px із заголовків/
  // відступів — ті ламаються від найменшої зміни шрифту чи перекладу).
  const [interestingRowsHeight, setInterestingRowsHeight] = useState(0);
  useEffect(() => {
    const el = interestingScrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setInterestingRowsHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [eventsPage, setEventsPage] = useState(0);
  const [interestingIndex, setInterestingIndex] = useState(0);
  const [interestingDragProgress, setInterestingDragProgress] = useState(0);
  const [isInterestingPanning, setIsInterestingPanning] = useState(false);

  const liveCards = useMemo(
    () => (indexCardsData ?? []).filter((c) => c.pageKey === "index"),
    [indexCardsData],
  );

  const getSectionCards = (sectionKey: string) =>
    liveCards.filter((c) => c.sectionKey === sectionKey);

  const destinationCards = getSectionCards("directions").map((card) => ({
    title: card.title,
    href: card.href ?? undefined,
    image: card.imageUrl ?? "",
  }));

  const interestingCards = (() => {
    const allCards = [
      ...getSectionCards("interesting-featured"),
      ...getSectionCards("interesting"),
    ].sort((a, b) => a.sortOrder - b.sortOrder);
    return allCards.map((card) => ({
      title: card.title,
      imageUrl: card.imageUrl ?? "",
      colSpan: (card.payload?.colSpan as number) ?? 1,
      row: (card.payload?.row as number) ?? 1,
      textSize: (card.payload?.textSize as string) ?? "md",
      descSize: (card.payload?.descSize as string) ?? "sm",
      href: card.href ?? undefined,
      isText: card.cardType === "text",
      description: String(card.payload?.description ?? ""),
    }));
  })();

  const topAttractions = getSectionCards("attractions").map((card) => ({
    title: card.title,
    subtitle: card.subtitle ?? "",
    description: String(card.payload?.description ?? ""),
    image: card.imageUrl ?? "",
    href: card.href ?? undefined,
  }));
  const safeTopAttractions = topAttractions.length
    ? topAttractions
    : [
        {
          title: "Одещина",
          subtitle: "",
          description: "Додайте картки у розділ attractions для головної сторінки",
          image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2200&q=80",
          href: undefined as string | undefined,
        },
      ];

  const events = getSectionCards("events").map((card) => ({
    title: card.title,
    locationDate: card.subtitle ?? "",
    href: card.href ?? undefined,
    badgeTop: String(card.payload?.badgeTop ?? ""),
    badgeDay: String(card.payload?.badgeDay ?? ""),
    badgeMonth: String(card.payload?.badgeMonth ?? ""),
    image: card.imageUrl ?? "",
  }));

  const setSectionRef = (index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  };

  const scrollByStep = (direction: 1 | -1) => {
    const sections = sectionRefs.current.filter(Boolean) as HTMLElement[];
    if (!sections.length) return;

    const viewportMid = window.innerHeight * 0.5;
    let currentIndex = 0;

    sections.forEach((section, idx) => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= viewportMid) currentIndex = idx;
    });

    const targetIndex = Math.min(Math.max(currentIndex + direction, 0), sections.length - 1);
    sections[targetIndex]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goPrevAttraction = () => {
    setActiveAttraction((prev) => (prev - 1 + safeTopAttractions.length) % safeTopAttractions.length);
  };

  const goNextAttraction = () => {
    setActiveAttraction((prev) => (prev + 1) % safeTopAttractions.length);
  };

  const goPrevInteresting = () => {
    setInterestingIndex((prev) => (prev - 1 + interestingCards.length) % interestingCards.length);
  };

  const goNextInteresting = () => {
    setInterestingIndex((prev) => (prev + 1) % interestingCards.length);
  };

  // Автозміна слайдів «Топ місць»; будь-яка ручна навігація скидає таймер,
  // бо ефект перезапускається при зміні activeAttraction
  useEffect(() => {
    if (safeTopAttractions.length < 2) return;
    const id = setInterval(() => {
      setActiveAttraction((prev) => (prev + 1) % safeTopAttractions.length);
    }, 6500);
    return () => clearInterval(id);
  }, [activeAttraction, safeTopAttractions.length]);

  const eventsPerPage = 3;
  const totalEventPages = Math.max(1, Math.ceil(events.length / eventsPerPage));
  const pagedEvents = events.slice(eventsPage * eventsPerPage, (eventsPage + 1) * eventsPerPage);

  useEffect(() => {
    setActiveAttraction((prev) => Math.min(prev, Math.max(safeTopAttractions.length - 1, 0)));
  }, [safeTopAttractions.length]);

  useEffect(() => {
    setInterestingIndex((prev) => Math.min(prev, Math.max(interestingCards.length - 1, 0)));
  }, [interestingCards.length]);

  useEffect(() => {
    setEventsPage((prev) => Math.min(prev, Math.max(totalEventPages - 1, 0)));
  }, [totalEventPages]);

  const goPrevEventsPage = () => {
    setEventsPage((prev) => (prev - 1 + totalEventPages) % totalEventPages);
  };

  const goNextEventsPage = () => {
    setEventsPage((prev) => (prev + 1) % totalEventPages);
  };

  const scrollDestinations = (direction: 1 | -1) => {
    const scroller = destinationsScrollerRef.current;
    if (!scroller) return;

    const step = Math.max(scroller.clientWidth * 0.75, 280);
    scroller.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <>
    <div className="bg-[#fff2e8]">
      <div className="fixed right-8 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-4 md:flex">
        <button
          type="button"
          aria-label="Вгору"
          onClick={() => scrollByStep(-1)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff2e8]"
        >
          <ArrowGlyph direction="up" />
        </button>
        <button
          type="button"
          aria-label="Вниз"
          onClick={() => scrollByStep(1)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff2e8]"
        >
          <ArrowGlyph direction="down" />
        </button>
      </div>

      <section ref={setSectionRef(0)} className="relative min-h-screen overflow-hidden text-[#fff2e8]">
        <HeroBackgroundVideo src={heroVideo} />
        <div className="absolute inset-0 hidden md:block bg-[linear-gradient(180deg,rgba(0,12,33,0.28),rgba(0,12,33,0.82))]" />
        <div className="absolute inset-0 md:hidden bg-[linear-gradient(180deg,rgba(0,12,33,0.5),rgba(0,12,33,0.82))]" />

        <motion.header
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-20"
        >
          <PageBrow home />
        </motion.header>

        <main id="main-content" tabIndex={-1} className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-[1320px] flex-col items-center px-4 pb-tabbar pt-0 text-center md:px-6 md:pb-0 md:pt-0">
          <div className="relative flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
              className="relative h-[228px] w-[228px] xs:h-[270px] xs:w-[270px] md:h-[320px] md:w-[320px]"
              style={{
                backgroundColor: "#fff2e8",
                WebkitMaskImage: `url(${geminiLogo})`,
                maskImage: `url(${geminiLogo})`,
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-0 text-[34px] leading-[1.02] md:text-[68px] font-odesa-medium"
          >
            {t("explore")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-3 text-[16px] leading-none md:text-[22px] font-odesa-regular"
          >
            {t("tagline")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.4 }}
            className="mt-6 md:mt-10"
          >
            <Link
              to="/marshruty"
              className="inline-block rounded-full border border-[#fff2e8] bg-[#fff2e8] px-9 py-2 text-[12px] leading-none text-[#00376c] font-odesa-semi transition-opacity hover:opacity-85">
              {t("routes")}
            </Link>
          </motion.div>

          {/* Соцмережі й "01/02" картки: раніше вставали в один рядок абсолютним
              позиціонуванням вже з md (768px) — на планшетах (768–1023px) їм
              бракувало ширини, і вони наїжджали одне на одне. Ця "поруч,
              абсолютно" верстка тепер тільки з lg (1024px+, реальний
              десктоп); на планшетах лишається проста колонка, як на мобілі. */}
          <section className="mt-auto w-full pb-7 pt-0 lg:pb-0">
            <div className="mx-auto flex max-w-[1060px] flex-col items-center gap-3 lg:relative lg:min-h-[120px] lg:block">
              <div className="inline-flex items-center gap-3 rounded-full bg-[#fff2e8] px-5 py-2.5 text-[#00376c] lg:absolute lg:bottom-0 lg:left-1/2 lg:-translate-x-1/2 lg:px-6 lg:py-3">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="transition-opacity hover:opacity-80"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>

              <div className="grid w-full grid-cols-2 items-stretch gap-3 lg:absolute lg:bottom-0 lg:right-0 lg:w-auto lg:items-end lg:gap-8">
                {featureCards.map((item) => (
                  <Link key={item.number} to={item.href}
                    className="group cursor-pointer text-left transition-colors lg:max-w-[170px]"
                    style={{ textDecoration: "none" }}>
                    <div className="flex items-end gap-2 transition-colors duration-500"
                      style={{ color: "inherit" }}>
                      <span className="text-[30px] leading-none font-odesa-regular transition-colors duration-500 group-hover:text-[#df9b3b] group-active:text-[#df9b3b] lg:text-[40px]"
                        style={{ transitionProperty: "color" }}>
                        {item.number}
                      </span>
                      <div className="flex min-h-[40px] flex-row items-end gap-1.5 pb-[3px] text-[17px] leading-[0.95] font-odesa-medium transition-colors duration-500 group-hover:text-[#df9b3b] group-active:text-[#df9b3b] lg:min-h-[44px] lg:flex-col lg:items-start lg:justify-end lg:gap-0 lg:pb-[5px] lg:text-[22px]">
                        <div className="whitespace-nowrap">{item.first}</div>
                        {item.second ? <div className="whitespace-nowrap">{item.second}</div> : null}
                      </div>
                    </div>
                    <div className="relative mt-2 h-[5px] w-full overflow-hidden rounded-full bg-[#fff2e8]/30 lg:h-[6px] lg:rounded-none lg:bg-[#fff2e8]/40">
                      <div className="absolute inset-y-0 left-0 w-0 bg-[#df9b3b] transition-all duration-500 ease-in-out group-hover:w-full group-active:w-full" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* Accessibility menu — bottom left of hero, desktop only */}
        <div className="absolute bottom-6 left-6 z-20 hidden md:block">
          <AccessibilityMenu onSearchClick={scrollToFooter} />
        </div>
      </section>

      <section ref={setSectionRef(1)} className="relative z-10 px-4 pt-8 pb-6 md:pb-8 text-[#002f5e] md:px-10"
        style={{ backgroundColor: "#fff2e8", backgroundImage: "url(/bgmainnapryam.svg)", backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat" }}>
        <div className="pointer-events-none absolute inset-0 z-0 bg-[#fff2e8]/90" />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          {/* декор: роза вітрів за заголовком */}
          <div className="pointer-events-none absolute -top-2 right-6 hidden text-[#002f5e]/10 lg:block" aria-hidden="true">
            <CompassRose className="h-44 w-44 animate-spin-slower" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="relative flex flex-wrap items-end justify-between gap-6"
          >
            <div>
              <h3 className="text-[36px] leading-none md:text-[64px] font-odesa-medium">{t("mainDirections")}</h3>
              <Link
                to="/districts"
                className="group/more mt-6 inline-flex items-center gap-3 text-[18px] font-odesa-medium text-[#002f5e]"
              >
                <span className="relative">
                  {t("learnMore")}
                  <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-[#df9b3b] transition-transform duration-300 group-hover/more:scale-x-100" />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#df9b3b] text-[#fff2e8] transition-transform duration-300 group-hover/more:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>

            <div className="hidden items-center gap-3 text-[#002f5e] md:flex">
              <button
                type="button"
                onClick={() => scrollDestinations(-1)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#002f5e]/40 transition-all duration-300 hover:border-[#002f5e] hover:bg-[#002f5e] hover:text-[#fff2e8]"
                aria-label="Попередній"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => scrollDestinations(1)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#002f5e]/40 transition-all duration-300 hover:border-[#002f5e] hover:bg-[#002f5e] hover:text-[#fff2e8]"
                aria-label="Наступний"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="mt-8 -mx-4 md:-mx-10"
          >
            <div
              ref={destinationsScrollerRef}
              className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-px-4 pt-4 pb-16 md:pb-20 px-4 md:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
              onMouseDown={(e) => {
                const el = e.currentTarget;
                let x = e.pageX;
                let velocity = 0;
                let lastX = e.pageX;
                let lastTime = Date.now();
                let rafId: number;

                const onMove = (ev: MouseEvent) => {
                  const dx = ev.pageX - x;
                  el.scrollLeft -= dx;
                  const now = Date.now();
                  const dt = now - lastTime || 1;
                  velocity = (ev.pageX - lastX) / dt;
                  lastX = ev.pageX;
                  lastTime = now;
                  x = ev.pageX;
                };

                const onUp = () => {
                  window.removeEventListener("mousemove", onMove);
                  window.removeEventListener("mouseup", onUp);

                  // Inertia
                  let v = velocity * 15;
                  const animate = () => {
                    if (Math.abs(v) < 0.5) return;
                    el.scrollLeft -= v;
                    v *= 0.92;
                    rafId = requestAnimationFrame(animate);
                  };
                  rafId = requestAnimationFrame(animate);

                  // Cleanup on next interaction
                  el.addEventListener("mousedown", () => cancelAnimationFrame(rafId), { once: true });
                };

                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            >
              {destinationCards.map((card, idx) => {
                const cardBody = (
                  <>
                    <Img w={500} src={card.image} alt={card.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#002f5e]/85 via-[#002f5e]/15 to-transparent" />
                    <span className="absolute left-6 top-6 rounded-full border border-[#fff2e8]/30 bg-[#002f5e]/30 px-4 py-2 text-[15px] leading-none text-[#fff2e8] backdrop-blur-md font-odesa-medium">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="absolute bottom-8 right-7 flex h-12 w-12 translate-y-3 items-center justify-center rounded-full bg-[#df9b3b] text-[#002f5e] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowUpRight className="h-5 w-5" />
                    </span>
                    <div className="absolute bottom-6 left-6 right-20">
                      <h4 className="text-[26px] leading-[0.95] text-[#fff2e8] font-odesa-medium xs:text-[29px] md:text-[34px]">{card.title}</h4>
                      <div className="mt-3 h-[3px] w-10 rounded-full bg-[#df9b3b] transition-all duration-500 group-hover:w-24" />
                    </div>
                  </>
                );

                if (card.href) {
                  return (
                    <Link
                      key={card.title}
                      to={card.href}
                      className="group relative h-[370px] w-[72vw] shrink-0 snap-start rounded-[26px] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_60px_-24px_rgba(0,47,94,0.45)] xs:h-[420px] xs:w-[280px] md:h-[440px] md:w-[360px]"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-[#002f5e]/10">
                        {cardBody}
                      </div>
                    </Link>
                  );
                }

                return (
                  <article key={card.title} className="group relative h-[370px] w-[72vw] shrink-0 snap-start rounded-[26px] xs:h-[420px] xs:w-[280px] md:h-[440px] md:w-[360px]">
                    <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-[#002f5e]/10">
                      {cardBody}
                    </div>
                  </article>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section ref={setSectionRef(2)} className="relative z-10 py-10 text-[#002f5e] flex flex-col justify-start md:h-screen md:overflow-y-hidden" style={{ backgroundColor: "#fff2e8" }}>
          {/* Текстура: класична хвиля з гострим (не заокругленим) гребенем */}
          {/* 👇 ПРОЗОРІСТЬ ХВИЛЬ — міняй ось це число (0.1 = 10%) */}
          <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.1]" aria-hidden="true"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='65'%3E%3Cpath d='M0,55 C20,55 30,10 45,10 C52,6 54,18 46,22 C42,30 55,45 90,55' stroke='%23df9b3b' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
              backgroundSize: "90px 65px",
              backgroundRepeat: "repeat",
            }} />

          <div className="relative z-10 mx-auto mb-6 h-[3px] w-24 shrink-0 self-center rounded-full bg-[#df9b3b]/70 md:w-40" aria-hidden="true" />

          <h3 className="relative z-10 flex items-center justify-center gap-4 px-4 pb-3 text-center text-[28px] leading-none text-[#002f5e] font-odesa-bold md:gap-6 md:pb-4 md:text-[56px]">
            <span className="text-[16px] text-[#df9b3b] md:text-[28px]">{star}</span>
            {t("interesting")}
            <span className="text-[16px] text-[#df9b3b] md:text-[28px]">{star}</span>
          </h3>

          <div
            ref={interestingScrollerRef}
            className="relative z-10 hidden md:block md:flex-1 md:min-h-0 overflow-x-auto [overflow-y:clip] pt-3 pb-2 pl-3 md:pl-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none touch-pan-x"
            onMouseDown={(e) => {
              const el = e.currentTarget;
              let x = e.pageX;
              let velocity = 0;
              let lastX = e.pageX;
              let lastTime = Date.now();
              let rafId: number;
              const onMove = (ev: MouseEvent) => {
                const dx = ev.pageX - x;
                el.scrollLeft -= dx;
                const now = Date.now();
                const dt = now - lastTime || 1;
                velocity = (ev.pageX - lastX) / dt;
                lastX = ev.pageX;
                lastTime = now;
                x = ev.pageX;
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
                let v = velocity * 15;
                const animate = () => {
                  if (Math.abs(v) < 0.5) return;
                  el.scrollLeft -= v;
                  v *= 0.92;
                  rafId = requestAnimationFrame(animate);
                };
                rafId = requestAnimationFrame(animate);
                el.addEventListener("mousedown", () => cancelAnimationFrame(rafId), { once: true });
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          >
            {interestingCards.length === 0 ? (
              <p className="text-[#002f5e]/70 text-[15px] font-odesa-regular py-8">
                Картки ще не додано — налаштуйте розділ в адмінці
              </p>
            ) : (() => {
              const GAP = 20;
              // Висота картки — з РЕАЛЬНОГО заміру контейнера (ResizeObserver вище,
              // contentRect вже виключає padding), а не вгаданих px відступів шапки
              // секції: ті ламались від будь-якої зміни шрифту/перекладу/зуму. Поки
              // заміру ще немає (перший рендер) — прийнятний фолбек через vh, щоб не
              // блимало порожнім.
              const rowH = interestingRowsHeight > 0
                ? (interestingRowsHeight - GAP) / 2
                : (window.innerHeight - 260) / 2;
              const CARD_H_CSS = `${rowH}px`;
              const cardW_CSS = (colSpan: number) =>
                colSpan === 3 ? `${rowH * 3 + 40}px`
                : colSpan === 2 ? `${rowH * 2 + 20}px`
                : CARD_H_CSS;

              const topCards = interestingCards.filter(c => (c.row ?? 1) !== 2);
              const botCards = interestingCards.filter(c => c.row === 2);

              const renderCard = (item: typeof interestingCards[0]) => {
                const w = cardW_CSS(item.colSpan ?? 1);
                const textSizeClass =
                  item.textSize === "lg" ? "text-[38px] md:text-[50px]"
                  : item.textSize === "sm" ? "text-[22px] md:text-[26px]"
                  : "text-[28px] md:text-[36px]";

                if (item.isText) {
                  const descSizeClass =
                    item.descSize === "lg" ? "text-[20px] md:text-[24px]"
                    : item.descSize === "md" ? "text-[17px] md:text-[20px]"
                    : "text-[16px] md:text-[18px]";
                  return (
                    <div
                      key={item.title + item.row + "text"}
                      className="group/text relative shrink-0 flex flex-col justify-between overflow-hidden rounded-[22px] border border-[#002f5e]/10 bg-white px-7 pt-6 pb-6 shadow-[0_18px_40px_-26px_rgba(0,47,94,0.35)] transition-all duration-300 hover:-translate-y-2 hover:border-[#df9b3b]/45 hover:bg-white"
                      style={{ width: w, height: CARD_H_CSS }}
                    >
                      {/* тепле сяйво у куті */}
                      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#df9b3b]/16 blur-2xl transition-opacity duration-500 group-hover/text:bg-[#df9b3b]/26" aria-hidden="true" />
                      <div className="h-[2.5px] w-full bg-gradient-to-r from-[#df9b3b]/50 to-transparent" />
                      <div>
                        <h4 className={`leading-[0.93] font-odesa-bold ${textSizeClass}`}>{item.title}</h4>
                        {item.description && (
                          <p className={`mt-4 leading-[1.65] text-[#002f5e]/70 font-odesa-regular ${descSizeClass}`}>{item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}</p>
                        )}
                      </div>
                      <div className="h-[2.5px] w-full bg-gradient-to-l from-[#df9b3b]/50 to-transparent" />
                    </div>
                  );
                }

                const inner = (
                  <>
                    <Img w={500} src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <h4 className={`absolute bottom-5 left-5 right-5 leading-[0.95] font-odesa-medium text-[#fff2e8] ${textSizeClass}`}>
                      {item.title}
                    </h4>
                  </>
                );
                return item.href ? (
                  <Link
                    key={item.title + item.imageUrl + item.row}
                    to={item.href}
                    className="group relative shrink-0 rounded-[22px] transition-transform duration-300 hover:-translate-y-2"
                    style={{ width: w, height: CARD_H_CSS }}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-[22px]">
                      {inner}
                    </div>
                  </Link>
                ) : (
                  <article
                    key={item.title + item.imageUrl + item.row}
                    className="group relative shrink-0 rounded-[22px] transition-transform duration-300 hover:-translate-y-2"
                    style={{ width: w, height: CARD_H_CSS }}
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-[22px]">
                      {inner}
                    </div>
                  </article>
                );
              };

              return (
                <div className="flex flex-col" style={{ gap: GAP, width: "max-content" }}>
                  {topCards.length > 0 && (
                    <div className="flex" style={{ gap: GAP }}>{topCards.map(renderCard)}</div>
                  )}
                  {botCards.length > 0 && (
                    <div className="flex" style={{ gap: GAP }}>{botCards.map(renderCard)}</div>
                  )}
                  {/* right breathing room so last card isn't flush with viewport edge */}
                  <div style={{ width: 1 }} aria-hidden="true" className="shrink-0" />
                </div>
              );
            })()}
          </div>

          {/* ── Мобільна fan-карусель ─────────────────────────────────── */}
          <div className="relative z-10 md:hidden">
            {interestingCards.length === 0 ? (
              <p className="px-4 py-8 text-[15px] text-[#002f5e]/70 font-odesa-regular">
                Картки ще не додано — налаштуйте розділ в адмінці
              </p>
            ) : (
              <>
                <motion.div
                  className="relative flex h-[420px] items-start justify-center overflow-hidden pt-6"
                  style={{ perspective: 900, touchAction: "pan-y" }}
                  onPanStart={() => setIsInterestingPanning(true)}
                  onPan={(_, info) => {
                    interestingDragRef.current += info.delta.x / 100;
                    setInterestingDragProgress(interestingDragRef.current);
                  }}
                  onPanEnd={(_, info) => {
                    // Різкий свайп (висока швидкість відпускання) прокручує на кілька
                    // карток одразу — не лише дистанція пальця, а й "розгін" від флiку.
                    const flingSteps = info.velocity.x / 1000;
                    const steps = Math.round(interestingDragRef.current + flingSteps);
                    const n = interestingCards.length;
                    if (steps !== 0 && n) {
                      setInterestingIndex((prev) => {
                        let next = (prev - steps) % n;
                        if (next < 0) next += n;
                        return next;
                      });
                    }
                    interestingDragRef.current = 0;
                    setInterestingDragProgress(0);
                    setIsInterestingPanning(false);
                  }}
                >
                  {interestingCards.map((item, i) => {
                    const n = interestingCards.length;
                    // Неперервне циклічне загортання: рахуємо щоразу наново від
                    // поточного (i - interestingIndex + прогрес драга), тому під час
                    // одного довгого свайпу картки нескінченно повторюються по колу,
                    // а не «закінчуються», поки не відпустиш палець.
                    let liveOffset = i - interestingIndex + interestingDragProgress;
                    liveOffset -= n * Math.round(liveOffset / n);
                    if (Math.abs(liveOffset) > 2.6) return null;

                    const abs = Math.abs(liveOffset);
                    const isActive = i === interestingIndex;
                    const description = item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

                    const frame = (
                      <div
                        className="relative h-full w-full overflow-hidden rounded-[24px] transition-shadow duration-300"
                        style={{
                          boxShadow: isActive
                            ? "0 26px 52px -16px rgba(0,0,0,0.55), 10px 0 30px -14px rgba(0,0,0,0.4), -10px 0 30px -14px rgba(0,0,0,0.4)"
                            : "none",
                        }}
                      >
                        {item.isText ? (
                          <div className="relative flex h-full w-full flex-col justify-between border border-[#002f5e]/10 bg-white px-5 py-5">
                            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#df9b3b]/22 blur-2xl" aria-hidden="true" />
                            <div className="h-[2.5px] w-full bg-gradient-to-r from-[#df9b3b]/50 to-transparent" />
                            <div>
                              <h4 className="text-[22px] leading-[1.05] font-odesa-bold">{item.title}</h4>
                              {description && (
                                <p className="mt-2 line-clamp-4 text-[16px] leading-[1.5] text-[#002f5e]/70 font-odesa-regular">
                                  {description}
                                </p>
                              )}
                            </div>
                            <div className="h-[2.5px] w-full bg-gradient-to-l from-[#df9b3b]/50 to-transparent" />
                          </div>
                        ) : (
                          <>
                            <Img w={400} src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-4">
                              <h4 className="line-clamp-2 text-[16px] leading-[1.15] font-odesa-medium text-[#fff2e8] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] [overflow-wrap:break-word]">
                                {item.title}
                              </h4>
                              <div className="mt-2 h-[3px] w-8 rounded-full bg-[#df9b3b]" />
                            </div>
                          </>
                        )}
                      </div>
                    );

                    return (
                      <motion.div
                        key={`fan-${item.title}-${i}`}
                        className="absolute aspect-[3/4] w-[60vw] max-w-[235px] shrink-0"
                        style={{ originY: 0.85 }}
                        animate={{
                          x: `${liveOffset * 54}%`,
                          rotate: liveOffset * 9,
                          scale: 1 - abs * 0.12,
                          zIndex: 10 - Math.round(abs),
                        }}
                        transition={isInterestingPanning ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 28 }}
                        onClick={() => {
                          if (!isActive) setInterestingIndex(i);
                        }}
                      >
                        {isActive && item.href ? (
                          <Link to={item.href} className="block h-full w-full">
                            {frame}
                          </Link>
                        ) : (
                          frame
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>

                <div className="-mt-3 flex items-center justify-center gap-4 font-odesa-medium">
                  <button
                    type="button"
                    onClick={goPrevInteresting}
                    className="flex items-center justify-center p-1 text-[#002f5e] transition-opacity hover:opacity-55"
                    aria-label="Попереднє"
                  >
                    <ChevronLeft className="h-7 w-7" strokeWidth={3} />
                  </button>
                  <span className="text-[13px] text-[#002f5e]/70">
                    {String(interestingIndex + 1).padStart(2, "0")} / {String(interestingCards.length).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={goNextInteresting}
                    className="flex items-center justify-center p-1 text-[#002f5e] transition-opacity hover:opacity-55"
                    aria-label="Наступне"
                  >
                    <ChevronRight className="h-7 w-7" strokeWidth={3} />
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative z-10 mx-auto mt-8 h-[3px] w-24 shrink-0 self-center rounded-full bg-[#df9b3b]/70 md:mt-10 md:w-40" aria-hidden="true" />
      </section>

      <section ref={setSectionRef(3)} className="relative overflow-hidden text-[#fff2e8] md:min-h-screen" style={{ backgroundColor: "#001a3d" }}>
        {/* Текстура: та сама хвиля, що і в «Цікаве» — тон у тон з кремовим, ледь помітна на темному тлі (тільки на мобільній картці, на десктопі все одно ховається під фото-слайдером) */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.06]" aria-hidden="true"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='65'%3E%3Cpath d='M0,55 C20,55 30,10 45,10 C52,6 54,18 46,22 C42,30 55,45 90,55' stroke='%23fff2e8' stroke-width='3' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundSize: "90px 65px",
            backgroundRepeat: "repeat",
          }} />

        {/* ─── Десктоп: повноекранний слайдер ─── */}
        <div className="relative z-10 hidden md:block">
        {/* Crossfade images — opacity only, no filter, compositor-only = smooth 60fps */}
        <AnimatePresence mode="sync">
          <motion.img
            key={safeTopAttractions[activeAttraction].image}
            src={safeTopAttractions[activeAttraction].image}
            alt={safeTopAttractions[activeAttraction].title}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-[#002f5e]/20 via-transparent to-[#14000c]/70" />

        {/* Top bar: counter */}
        <div className="relative z-10 flex items-start justify-end pl-4 pr-4 pt-8 md:pl-24 md:pr-8 md:pt-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-baseline gap-2 font-odesa-medium"
            aria-hidden="true"
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={activeAttraction}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.35 }}
                className="text-[44px] leading-none text-[#df9b3b] md:text-[56px]"
              >
                {String(activeAttraction + 1).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
            <span className="text-[18px] text-[#fff2e8]/60 md:text-[22px]">/ {String(safeTopAttractions.length).padStart(2, "0")}</span>
          </motion.div>
        </div>

        {/* Bottom content */}
        <div className="relative z-10 flex min-h-[calc(100vh-76px)] flex-col justify-end pl-4 pr-4 pb-24 md:pl-24 md:pr-8 md:pb-12">
          {/* Прогрес-сегменти: активний заповнюється за час автозміни */}
          <div className="mb-5 flex items-center gap-2">
            {safeTopAttractions.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveAttraction(idx)}
                className={`relative h-[5px] overflow-hidden rounded-full transition-all duration-300 ${
                  idx === activeAttraction ? "w-14 bg-[#fff2e8]/25" : "w-7 bg-[#fff2e8]/25 hover:bg-[#fff2e8]/45"
                }`}
                aria-label={`Атракція ${idx + 1}`}
              >
                {idx === activeAttraction && (
                  <span
                    key={`fill-${activeAttraction}`}
                    className="absolute inset-y-0 left-0 rounded-full bg-[#df9b3b] animate-progress-grow"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={safeTopAttractions[activeAttraction].title}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[640px] rounded-[22px] bg-white/8 p-4 backdrop-blur-xl md:rounded-[28px] md:p-7" style={{ border: "1px solid rgba(255,242,232,0.2)" }}
            >
              <h3 className="text-[28px] leading-[0.96] md:text-[52px] font-odesa-medium">
                {safeTopAttractions[activeAttraction].title}
              </h3>
              {safeTopAttractions[activeAttraction].description && (
                <p className="mt-3 text-[13px] leading-[1.6] text-[#fff2e8]/75 md:text-[15px] font-odesa-regular">
                  {safeTopAttractions[activeAttraction].description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
                </p>
              )}
              <div className="mt-5 flex items-center gap-3">
                {safeTopAttractions[activeAttraction].href ? (
                  <Link
                    to={safeTopAttractions[activeAttraction].href!}
                    className="inline-flex items-center gap-2 rounded-full border border-[#fff2e8]/20 px-6 py-2.5 text-[14px] text-[#fff2e8] transition-all hover:bg-[#fff2e8]/10 font-odesa-medium"
                  >
                    Детальніше <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-[#fff2e8]/20 px-6 py-2.5 text-[14px] text-[#fff2e8]/60 font-odesa-medium cursor-default"
                    type="button" disabled
                  >
                    Детальніше <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={goPrevAttraction}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/6 transition-all hover:bg-white/25"
                  aria-label="Попередній"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goNextAttraction}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/6 transition-all hover:bg-white/25"
                  aria-label="Наступний"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Мініатюри місць — швидкий перехід */}
          {safeTopAttractions.length > 1 && (
            <div className="hidden flex-col items-end gap-3 lg:flex">
              {safeTopAttractions.slice(0, 5).map((att, idx) => (
                <button
                  key={att.title + idx}
                  type="button"
                  onClick={() => setActiveAttraction(idx)}
                  className={`group/thumb relative h-[64px] w-[100px] overflow-hidden rounded-[14px] transition-all duration-300 ${
                    idx === activeAttraction
                      ? "ring-2 ring-[#df9b3b] ring-offset-2 ring-offset-transparent scale-105"
                      : "opacity-55 hover:opacity-100"
                  }`}
                  aria-label={att.title}
                >
                  <Img w={500} src={att.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover/thumb:scale-110" />
                  <span className="absolute bottom-1 left-2 text-[11px] font-odesa-medium text-[#fff2e8] drop-shadow">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>
          )}
          </div>
        </div>
        </div>

        {/* ─── Мобільний: контейнерна картка (фото не ріжеться) ─── */}
        <div className="relative z-10 px-4 pb-10 pt-6 md:hidden">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-white/5 shadow-[0_26px_50px_-22px_rgba(0,0,0,0.65)]">
            <AnimatePresence mode="sync">
              <motion.img
                key={`m-${safeTopAttractions[activeAttraction].image}`}
                src={safeTopAttractions[activeAttraction].image}
                alt={safeTopAttractions[activeAttraction].title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          </div>

          <div className="mt-4 flex items-center gap-2">
            {safeTopAttractions.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveAttraction(idx)}
                className={`relative h-[5px] overflow-hidden rounded-full transition-all duration-300 ${
                  idx === activeAttraction ? "w-12 bg-[#fff2e8]/25" : "w-6 bg-[#fff2e8]/25"
                }`}
                aria-label={`Атракція ${idx + 1}`}
              >
                {idx === activeAttraction && (
                  <span key={`mfill-${activeAttraction}`} className="absolute inset-y-0 left-0 rounded-full bg-[#df9b3b] animate-progress-grow" />
                )}
              </button>
            ))}
          </div>

          {/* min-h тримає висоту сталою на 2 рядки — інакше заголовки різної довжини
              «стрибають» і зсувають опис/кнопки нижче при зміні атракції */}
          <h3 className="mt-5 line-clamp-2 min-h-[62px] text-[32px] leading-[0.95] font-odesa-bold [overflow-wrap:break-word]">
            {safeTopAttractions[activeAttraction].title}
          </h3>
          <div className="mt-3 h-[3px] w-14 rounded-full bg-[#df9b3b]" />
          {/* так само — фіксована висота під опис (з рендером навіть якщо опису нема),
              щоб кнопки нижче стояли на місці */}
          <p className="mt-4 line-clamp-4 min-h-[90px] text-[14px] leading-[1.6] text-[#fff2e8]/70 font-odesa-regular">
            {safeTopAttractions[activeAttraction].description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
          </p>

          <div className="mt-5 flex items-center gap-4">
            {safeTopAttractions[activeAttraction].href ? (
              <Link
                to={safeTopAttractions[activeAttraction].href!}
                className="group/cta inline-flex flex-1 items-center justify-between gap-3 rounded-full bg-[#fff2e8] py-1.5 pl-6 pr-1.5 text-[15px] font-odesa-bold text-[#002f5e] shadow-[0_14px_28px_-14px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Детальніше
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#002f5e] text-[#fff2e8] transition-transform duration-300 group-hover/cta:translate-x-1">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ) : (
              <span className="inline-flex flex-1 items-center justify-between gap-3 rounded-full border border-[#fff2e8]/20 py-1.5 pl-6 pr-1.5 text-[15px] font-odesa-bold text-[#fff2e8]/60">
                Детальніше
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#fff2e8]/20 text-[#fff2e8]/60">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={goPrevAttraction}
              className="flex items-center justify-center p-1 text-[#fff2e8] transition-opacity hover:opacity-55"
              aria-label="Попередній"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={3} />
            </button>
            <button
              type="button"
              onClick={goNextAttraction}
              className="flex items-center justify-center p-1 text-[#fff2e8] transition-opacity hover:opacity-55"
              aria-label="Наступний"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={3} />
            </button>
          </div>
        </div>
      </section>

      <div className="relative z-10">
      <section ref={setSectionRef(4)} className="relative flex min-h-screen items-center px-4 py-12 text-[#002f5e] md:px-10"
        style={{ backgroundColor: "#fff2e8", backgroundImage: "url(/bgpodii.svg)", backgroundSize: "cover", backgroundPosition: "center top", backgroundRepeat: "no-repeat" }}>
        <div className="pointer-events-none absolute inset-0 z-0 bg-[#fff2e8]/90" />
        <div className="relative z-10 mx-auto w-full max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="flex flex-wrap items-end justify-between gap-5"
          >
            <div>
              <h3 className="text-[36px] leading-none md:text-[64px] font-odesa-bold">{t("events")}</h3>
            </div>
            <Link to="/podiyi" className="group/all inline-flex items-center gap-3 text-[18px] text-[#9f1f47] font-odesa-medium">
              <span className="relative">
                {t("viewAll")}
                <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-[#9f1f47] transition-transform duration-300 group-hover/all:scale-x-100" />
              </span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover/all:translate-x-1" />
            </Link>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={eventsPage}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="mt-10 grid grid-cols-1 gap-x-4 gap-y-7 xs:grid-cols-2 sm:gap-x-6 sm:gap-y-9 md:gap-x-8 md:gap-y-10 lg:grid-cols-3"
            >
              {pagedEvents.map((event) => {
                // «Квиток»: фото + дата-стаб, перфорація, нижня частина з назвою.
                // Заголовок/локація мають фіксовану висоту (line-clamp + min-h) — інакше
                // картки з різною довжиною тексту виходять різного розміру.
                const eventCard = (
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[22px] bg-white/75 shadow-[0_16px_34px_-20px_rgba(0,47,94,0.35)] backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_26px_48px_-20px_rgba(159,31,71,0.4)]">
                    <div className="relative h-[185px] overflow-hidden md:h-[225px]">
                      <Img w={400}
                        src={event.image}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#002f5e]/25 to-transparent" />
                      <div className="absolute left-3 top-3 overflow-hidden rounded-[14px] bg-[#9f1f47] text-center text-[#fff2e8] shadow-lg">
                        {event.badgeTop ? (
                          <div className="bg-[#85173c] px-3.5 py-1.5 text-[11px] leading-none font-odesa-regular">{event.badgeTop}</div>
                        ) : null}
                        <div className="px-3.5 pb-2 pt-1.5">
                          <div className="text-[27px] leading-none font-odesa-medium">{event.badgeDay}</div>
                          <div className="mt-1 text-[13px] uppercase leading-none tracking-wide font-odesa-medium text-[#fff2e8]/85">{event.badgeMonth}</div>
                        </div>
                      </div>
                    </div>

                    {/* перфорація квитка */}
                    <div className="relative px-4" aria-hidden="true">
                      <div className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full bg-[#fff2e8]" />
                      <div className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full bg-[#fff2e8]" />
                      <div className="border-t-2 border-dashed border-[#002f5e]/15" />
                    </div>

                    <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
                      <h4 className="line-clamp-2 min-h-[46px] text-[20px] leading-[1.05] font-odesa-medium transition-colors duration-300 group-hover:text-[#9f1f47]">{event.title}</h4>
                      <p className="mt-1.5 flex min-h-[20px] items-center gap-1.5 text-[14px] leading-tight text-[#002f5e]/70 font-odesa-regular">
                        {event.locationDate ? (
                          <>
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#df9b3b]" /> {event.locationDate}
                          </>
                        ) : null}
                      </p>
                      <div className="mt-auto flex items-center gap-2 pt-3 text-[13px] font-odesa-medium text-[#9f1f47]">
                        {t("details")}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                );

                if (event.href) {
                  return (
                    <Link
                      key={event.title}
                      to={event.href}
                      className="group mx-auto block h-full w-full max-w-[300px] xs:max-w-[380px]"
                    >
                      {eventCard}
                    </Link>
                  );
                }

                return (
                  <article key={event.title} className="group mx-auto h-full w-full max-w-[300px] xs:max-w-[380px]">
                    {eventCard}
                  </article>
                );
              })}
            </motion.div>
          </AnimatePresence>

          <div className="mt-7 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={goPrevEventsPage}
              className="flex items-center justify-center p-1 text-[#002f5e] transition-opacity hover:opacity-55"
              aria-label="Попередня сторінка подій"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={3} />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalEventPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEventsPage(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${idx === eventsPage ? "w-8 bg-[#9f1f47]" : "w-2.5 bg-[#002f5e]/30 hover:bg-[#9f1f47]/50"}`}
                  aria-label={`Сторінка подій ${idx + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={goNextEventsPage}
              className="flex items-center justify-center p-1 text-[#002f5e] transition-opacity hover:opacity-55"
              aria-label="Наступна сторінка подій"
            >
              <ChevronRight className="h-6 w-6" strokeWidth={3} />
            </button>
          </div>
        </div>
      </section>

        <div ref={setSectionRef(5)}>
          <div ref={el => { footerRef.current = el as HTMLElement | null; }}>
            <SiteFooter />
          </div>
        </div>
      </div>
    </div>

    <PollWidget />
    </>
  );
};

export default Index;
