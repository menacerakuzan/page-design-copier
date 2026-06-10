import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import heroVideo from "@/assets/episode-01.mp4";
import geminiLogo from "@/assets/gemini-svg-2.svg";
import SiteFooter from "@/components/SiteFooter";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { useLang } from "@/lib/langContext";
import RoutesOverlay from "@/components/RoutesOverlay";

const navLeft = ["Туристичні об'єкти"];
const navRight = ["Гіди", "Контакти"];

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
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1BMayDdZLc/",
    Icon: Facebook,
  },
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
  const { t, tl } = useLang();
  const { data: indexCardsData } = usePageContentCards("index");
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const destinationsScrollerRef = useRef<HTMLDivElement | null>(null);
  const interestingScrollerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  const scrollToFooter = () => footerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const [activeAttraction, setActiveAttraction] = useState(0);
  const [eventsPage, setEventsPage] = useState(0);
  const [routesOpen, setRoutesOpen] = useState(false);

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

  const eventsPerPage = 4;
  const totalEventPages = Math.max(1, Math.ceil(events.length / eventsPerPage));
  const pagedEvents = events.slice(eventsPage * eventsPerPage, (eventsPage + 1) * eventsPerPage);

  useEffect(() => {
    setActiveAttraction((prev) => Math.min(prev, Math.max(safeTopAttractions.length - 1, 0)));
  }, [safeTopAttractions.length]);

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
      <div className="fixed right-8 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-4">
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
        <video
          ref={heroVideoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.28),rgba(0,12,33,0.82))]" />

        <motion.header
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-20 mx-auto w-full max-w-[1180px] px-4 pt-0 md:px-5"
        >
          <div className="rounded-b-[58px] bg-[#fff2e8] px-5 pb-4 pt-4 text-[#00376c] md:px-8">
            <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
              <nav className="flex items-center justify-center gap-4 text-[14px] leading-none md:justify-start font-odesa-medium">
                <span className="text-[15px]">{star}</span>
                <Link to="/districts" className="transition-opacity hover:opacity-75">Туристичні об'єкти</Link>
              </nav>

              <h1 className="px-2 text-center text-[42px] leading-[0.95] font-odesa-medium font-odesa-ss02" style={{ letterSpacing: "0.04em" }}>
                ОДЕЩИНА
              </h1>

              <nav className="flex items-center justify-center gap-4 text-[14px] leading-none md:justify-end font-odesa-medium">
                <span className="text-[15px]">{star}</span>
                {navRight.map((item, index) => (
                  <a key={item} href="#"
                    onClick={item === "Контакти" ? (e) => { e.preventDefault(); scrollToFooter(); } : undefined}
                    className="transition-opacity hover:opacity-75">
                    {item}
                    {index === 0 ? <span className="ml-4 text-[15px]">{star}</span> : null}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </motion.header>

        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] w-full max-w-[1320px] flex-col items-center px-4 pb-0 pt-0 text-center md:px-6 md:pt-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="h-[350px] w-[350px]"
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

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-0 text-[46px] leading-[1.02] md:text-[68px] font-odesa-medium"
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
            className="mt-10"
          >
            <button
              onClick={() => setRoutesOpen(true)}
              className="inline-block rounded-full border border-[#fff2e8] bg-[#fff2e8] px-9 py-2 text-[12px] leading-none text-[#00376c] font-odesa-semi transition-opacity hover:opacity-85">
              {t("routes")}
            </button>
          </motion.div>

          <section className="mt-auto w-full pt-0">
            <div className="mx-auto flex max-w-[1060px] flex-col items-center gap-6 md:relative md:min-h-[120px] md:block">
              <div className="inline-flex items-center gap-4 rounded-full bg-[#fff2e8] px-8 py-4 text-[#00376c] md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="transition-opacity hover:opacity-80"
                  >
                    <Icon className="h-6 w-6" />
                  </a>
                ))}
              </div>

              <div className="grid grid-cols-1 items-end gap-6 md:absolute md:bottom-0 md:right-0 md:grid-cols-2 md:gap-8">
                {featureCards.map((item) => (
                  <Link key={item.number} to={item.href}
                    className="group w-full max-w-[170px] text-left cursor-pointer"
                    style={{ textDecoration: "none" }}>
                    <div className="flex items-end gap-2 transition-colors duration-500"
                      style={{ color: "inherit" }}>
                      <span className="text-[40px] leading-none font-odesa-regular transition-colors duration-500 group-hover:text-[#df9b3b]"
                        style={{ transitionProperty: "color" }}>
                        {item.number}
                      </span>
                      <div className="flex min-h-[44px] flex-col justify-end pb-[5px] text-[22px] leading-[0.95] font-odesa-medium transition-colors duration-500 group-hover:text-[#df9b3b]">
                        <div>{item.first}</div>
                        {item.second ? <div>{item.second}</div> : null}
                      </div>
                    </div>
                    <div className="relative mt-2 h-[6px] w-full overflow-hidden bg-[#fff2e8]/40">
                      <div className="absolute inset-y-0 left-0 w-0 bg-[#df9b3b] transition-all duration-500 ease-in-out group-hover:w-full" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* Accessibility menu — bottom left of hero */}
        <div className="absolute bottom-6 left-6 z-20">
          <AccessibilityMenu onSearchClick={scrollToFooter} />
        </div>
      </section>

      <section ref={setSectionRef(1)} className="relative z-10 px-4 pt-10 pb-20 text-[#002f5e] md:px-10"
        style={{ backgroundColor: "#fff2e8", backgroundImage: "url(/bgmainnapryam.svg)", backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat" }}>
        <div className="pointer-events-none absolute inset-0 z-0 bg-[#fff2e8]/90" />
        <div className="relative z-10 mx-auto max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="flex flex-wrap items-end justify-between gap-6"
          >
            <div>
              <h3 className="text-[44px] leading-none md:text-[64px] font-odesa-medium">{t("mainDirections")}</h3>
              <button className="mt-7 inline-flex items-center gap-2 text-[18px] font-odesa-medium" type="button">
                {t("learnMore")} <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 text-[#002f5e]">
              <button
                type="button"
                onClick={() => scrollDestinations(-1)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#002f5e]/40"
                aria-label="Попередній"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => scrollDestinations(1)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#002f5e]/40"
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
            className="mt-10 -mx-4 md:-mx-10"
          >
            <div
              ref={destinationsScrollerRef}
              className="flex gap-6 overflow-x-auto pt-4 pb-4 px-4 md:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
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
              {destinationCards.map((card) => {
                const cardBody = (
                  <>
                    <img src={card.image} alt={card.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#002f5e]/70 via-transparent to-transparent" />
                    <h4 className="absolute bottom-8 left-7 text-[42px] leading-none text-[#fff2e8] font-odesa-medium">{card.title}</h4>
                  </>
                );

                if (card.href) {
                  return (
                    <Link
                      key={card.title}
                      to={card.href}
                      className="group relative h-[520px] w-[350px] shrink-0 rounded-[26px] transition-transform duration-300 hover:-translate-y-2 md:w-[420px]"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-[26px] bg-[#002f5e]/10">
                        {cardBody}
                      </div>
                    </Link>
                  );
                }

                return (
                  <article key={card.title} className="group relative h-[520px] w-[350px] shrink-0 rounded-[26px] md:w-[420px]">
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

      <section ref={setSectionRef(2)} className="relative z-10 py-5 text-[#fff2e8] h-screen overflow-y-hidden flex flex-col justify-start" style={{ background: "linear-gradient(160deg, transparent 0%, transparent 30%, rgba(0,0,0,0.04) 42%, rgba(0,0,0,0.04) 52%, rgba(0,0,0,0.12) 62%, rgba(0,0,0,0.12) 72%, rgba(0,0,0,0.28) 82%, rgba(0,0,0,0.28) 90%, rgba(0,0,0,0.48) 100%), #001a3d" }}>
          {/* Right-edge fade hint */}
          <div className="pointer-events-none absolute right-0 inset-y-0 w-72 z-10" aria-hidden="true" style={{ background: "linear-gradient(to left, #1c1a15aa 0%, #1c1a1577 30%, #1c1a1533 60%, transparent 100%)" }} />
          <div
            ref={interestingScrollerRef}
            className="overflow-x-auto [overflow-y:clip] pt-3 pb-2 pl-20 md:pl-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
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
              <p className="text-[#fff2e8]/30 text-[15px] font-odesa-regular py-8">
                Картки ще не додано — налаштуйте розділ в адмінці
              </p>
            ) : (() => {
              const GAP = 20;
              // CARD_H = (100vh - vertical padding - gap) / 2
              const CARD_H_CSS = "calc((100vh - 56px - 20px) / 2)";
              const cardW_CSS = (colSpan: number) =>
                colSpan === 3 ? `calc(${CARD_H_CSS} * 3 + 40px)`
                : colSpan === 2 ? `calc(${CARD_H_CSS} * 2 + 20px)`
                : CARD_H_CSS;

              const topCards = interestingCards.filter(c => (c.row ?? 1) !== 2);
              const botCards = interestingCards.filter(c => c.row === 2);

              const renderCard = (item: typeof interestingCards[0]) => {
                const w = cardW_CSS(item.colSpan ?? 1);
                const textSizeClass =
                  item.textSize === "lg" ? "text-[34px] md:text-[44px]"
                  : item.textSize === "sm" ? "text-[18px] md:text-[22px]"
                  : "text-[24px] md:text-[30px]";

                if (item.isText) {
                  const descSizeClass =
                    item.descSize === "lg" ? "text-[16px] md:text-[19px]"
                    : item.descSize === "md" ? "text-[14px] md:text-[16px]"
                    : "text-[13px] md:text-[14px]";
                  return (
                    <div
                      key={item.title + item.row + "text"}
                      className="relative shrink-0 flex flex-col justify-between rounded-[22px] border border-[#fff2e8]/10 bg-[#fff2e8]/5 px-7 pt-6 pb-6 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-2"
                      style={{ width: w, height: CARD_H_CSS }}
                    >
                      {/* top decorative line */}
                      <div className="h-[1px] w-full bg-[#fff2e8]/10" />
                      <div>
                        <h4 className={`leading-[0.93] font-odesa-medium ${textSizeClass}`}>{item.title}</h4>
                        {item.description && (
                          <p className={`mt-4 leading-[1.65] text-[#fff2e8]/55 font-odesa-regular ${descSizeClass}`}>{item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}</p>
                        )}
                      </div>
                      {/* bottom decorative line */}
                      <div className="h-[1px] w-full bg-[#fff2e8]/10" />
                    </div>
                  );
                }

                const inner = (
                  <>
                    <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <h4 className={`absolute bottom-5 left-5 right-5 leading-[0.95] font-odesa-medium ${textSizeClass}`}>
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
      </section>

      <section ref={setSectionRef(3)} className="relative min-h-screen overflow-hidden bg-black text-[#fff2e8]">
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

        {/* Top bar: pill label */}
        <div className="relative z-10 pl-20 pr-4 pt-10 md:pl-24 md:pr-8">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block rounded-full border border-white/15 bg-white/10 px-5 py-2 text-[12px] uppercase tracking-[0.2em] font-odesa-medium backdrop-blur-sm"
          >
            Топ місць
          </motion.span>
        </div>

        {/* Bottom content */}
        <div className="relative z-10 flex min-h-[calc(100vh-76px)] flex-col justify-end pl-20 pr-4 pb-10 md:pl-24 md:pr-8 md:pb-12">
          {/* Dot indicators */}
          <div className="mb-5 flex items-center gap-2">
            {safeTopAttractions.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveAttraction(idx)}
                className={`rounded-full transition-all duration-300 ${
                  idx === activeAttraction
                    ? "h-2 w-7 bg-[#fff2e8]"
                    : "h-2 w-2 bg-[#fff2e8]/35 hover:bg-[#fff2e8]/60"
                }`}
                aria-label={`Атракція ${idx + 1}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={safeTopAttractions[activeAttraction].title}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[640px] rounded-[28px] bg-white/8 p-5 backdrop-blur-xl md:p-7" style={{ border: "1px solid rgba(255,242,232,0.2)" }}
            >
              <h3 className="text-[36px] leading-[0.96] md:text-[52px] font-odesa-medium">
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
                    className="inline-flex items-center gap-2 rounded-full border border-[#fff2e8]/20 px-6 py-2.5 text-[14px] text-[#fff2e8]/40 font-odesa-medium cursor-default"
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
        </div>
      </section>

      <div className="relative z-10"
        style={{ backgroundColor: "#fff2e8", backgroundImage: "url(/bgpodii.svg)", backgroundSize: "cover", backgroundPosition: "center center", backgroundRepeat: "no-repeat" }}>
        <div className="pointer-events-none absolute inset-0 z-0 bg-[#fff2e8]/90" />
      <section ref={setSectionRef(4)} className="relative z-10 flex min-h-screen items-center px-4 py-12 text-[#002f5e] md:px-10">
        <div className="mx-auto w-full max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="flex flex-wrap items-end justify-between gap-5"
          >
            <div>
              <h3 className="text-[44px] leading-none md:text-[64px] font-odesa-medium">{t("events")}</h3>
              <button className="mt-5 inline-flex items-center gap-2 text-[18px] text-[#9f1f47] font-odesa-medium" type="button">
                {t("viewAll")} <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrevEventsPage}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#002f5e]/30"
                aria-label="Попередня сторінка подій"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNextEventsPage}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#002f5e]/30"
                aria-label="Наступна сторінка подій"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={eventsPage}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4"
            >
              {pagedEvents.map((event) => {
                const eventCard = (
                  <>
                    <div className="relative h-[260px] overflow-hidden rounded-[26px] md:h-[360px]">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute left-4 top-4 rounded-[18px] bg-[#002f5e] px-4 py-3 text-[#fff2e8]">
                        {event.badgeTop ? <div className="text-[16px] leading-none font-odesa-regular">{event.badgeTop}</div> : null}
                        <div className="mt-1 text-[36px] leading-none font-odesa-medium">{event.badgeDay}</div>
                        <div className="text-[32px] leading-none font-odesa-medium">{event.badgeMonth}</div>
                      </div>
                    </div>
                    <h4 className="mt-4 text-[28px] leading-[1.03] font-odesa-medium">{event.title}</h4>
                    <p className="mt-2 text-[20px] leading-none text-[#002f5e]/80 font-odesa-regular">{event.locationDate}</p>
                  </>
                );

                if (event.href) {
                  return (
                    <Link
                      key={event.title}
                      to={event.href}
                      className="group block transition-transform duration-300 hover:-translate-y-1"
                    >
                      {eventCard}
                    </Link>
                  );
                }

                return (
                  <article key={event.title} className="group">
                    {eventCard}
                  </article>
                );
              })}
            </motion.div>
          </AnimatePresence>

          <div className="mt-7 flex items-center justify-center gap-2">
            {Array.from({ length: totalEventPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setEventsPage(idx)}
                className={`h-2.5 rounded-full transition-all ${idx === eventsPage ? "w-8 bg-[#002f5e]" : "w-2.5 bg-[#002f5e]/35"}`}
                aria-label={`Сторінка подій ${idx + 1}`}
              />
            ))}
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

    <RoutesOverlay open={routesOpen} onClose={() => setRoutesOpen(false)} />
    </>
  );
};

export default Index;
