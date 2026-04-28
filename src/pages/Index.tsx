import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Facebook, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import heroVideo from "@/assets/episode-01.mp4";
import geminiLogo from "@/assets/gemini-svg-2.svg";
import SiteFooter from "@/components/SiteFooter";
import { fallbackContentCards } from "@/data/contentCardsFallback";
import { usePageContentCards } from "@/hooks/usePageContentCards";

const navLeft = ["Райони", "Локації"];
const navRight = ["Гіди", "Контакти"];

const featureCards = [
  { number: "01", first: "Види", second: "туризму" },
  { number: "02", first: "Інформація", second: "" },
];

const destinationCards = [
  {
    title: "Білгород-Дністровський",
    href: "/napryamky/bilhorod-dnistrovskyi",
    image:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Одеса",
    image:
      "https://images.unsplash.com/photo-1470214203634-e436a8848e23?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Вилкове",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Затока",
    image:
      "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?auto=format&fit=crop&w=1200&q=80",
  },
];

const summerRecommendations = {
  featured: {
    title: "Винний маршрут Одещини",
    image:
      "https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1800&q=80",
  },
  items: [
    {
      title: "Лимани та заходи сонця",
      image:
        "https://images.pexels.com/photos/33180433/pexels-photo-33180433.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
    },
    {
      title: "Фортеці та історія",
      image:
        "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Морський відпочинок",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    },
  ],
};

const topAttractions = [
  {
    title: "Аккерманська фортеця",
    subtitle: "Top attractions",
    description:
      "Один із наймасштабніших середньовічних комплексів Причорномор'я. Стіни, бастіони та видові майданчики над лиманом створюють потужний історичний маршрут.",
    image:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=2200&q=80",
  },
  {
    title: "Одеський оперний театр",
    subtitle: "Top attractions",
    description:
      "Архітектурний символ Одеси з розкішними інтер'єрами та вечірньою атмосферою старого міста. Ідеальне місце для культурного вечора та фотомаршруту.",
    image:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2200&q=80",
  },
  {
    title: "Вилкове та Дунайська дельта",
    subtitle: "Top attractions",
    description:
      "Канали, човни та унікальна природа біосферного заповідника. Тут відчувається справжній ритм півдня, рибальські традиції та тиша водних лабіринтів.",
    image:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2200&q=80",
  },
  {
    title: "Тузлівські лимани",
    subtitle: "Top attractions",
    description:
      "Ланцюг солоних лиманів, диких пляжів і пташиних колоній. Простір для спокійного екотуризму, спостереження за природою та заходів сонця над Чорним морем.",
    image:
      "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=2200&q=80",
  },
];

const events = [
  {
    title: "Фестиваль вина та смаку Бессарабії",
    locationDate: "Болград, 24.04 - 03.05.2026",
    href: "/podiyi/festyval-vyna-ta-smaku-bessarabii",
    badgeTop: "до",
    badgeDay: "3",
    badgeMonth: "травень",
    image:
      "https://images.unsplash.com/photo-1532635042-a6f6ad4745f9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Весняний ярмарок на узбережжі",
    locationDate: "Одеса, 24.04 - 03.05.2026",
    badgeTop: "до",
    badgeDay: "3",
    badgeMonth: "травень",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Ніч музеїв та галерей",
    locationDate: "Одеса",
    badgeTop: "до",
    badgeDay: "31",
    badgeMonth: "травень",
    image:
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Етнофест південного колориту",
    locationDate: "Вилкове, 01.05 - 03.05.2026",
    badgeTop: "з",
    badgeDay: "1",
    badgeMonth: "травень",
    image:
      "https://images.pexels.com/photos/34580394/pexels-photo-34580394.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
  },
  {
    title: "Дні фортеці Аккерман",
    locationDate: "Білгород-Дністровський, 01.05 - 03.05.2026",
    badgeTop: "з",
    badgeDay: "1",
    badgeMonth: "травень",
    image:
      "https://images.pexels.com/photos/37216166/pexels-photo-37216166.jpeg?_gl=1*ytjoem*_ga*MTA4Nzc5MjE1LjE3NzcyODIzMzE.*_ga_8JE65Q40S6*czE3NzcyODIzMzAkbzEkZzEkdDE3NzcyODMzNzMkajUyJGwwJGgw",
  },
  {
    title: "Комікс та анімація біля моря",
    locationDate: "Одеса",
    badgeTop: "до",
    badgeDay: "10",
    badgeMonth: "травень",
    image:
      "https://images.pexels.com/photos/11130920/pexels-photo-11130920.jpeg?_gl=1*1orw1y7*_ga*MTA4Nzc5MjE1LjE3NzcyODIzMzE.*_ga_8JE65Q40S6*czE3NzcyODIzMzAkbzEkZzEkdDE3NzcyODMzODIkajQzJGwwJGgw",
  },
  {
    title: "Відкриті винні підвали",
    locationDate: "Шабо, 01.05 - 03.05.2026",
    badgeTop: "з",
    badgeDay: "1",
    badgeMonth: "травень",
    image:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Концерт просто неба біля лиману",
    locationDate: "Тузлівські лимани, 02.05.2026",
    badgeTop: "",
    badgeDay: "2",
    badgeMonth: "травень",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
  },
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
    href: "https://www.facebook.com/profile.php?id=61573965222850&mibextid=wwXIfr&rdid=bBZVa5vEkPiFA5UM&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1Eupy1CSJE%2F%3Fmibextid%3DwwXIfr%26utm_source%3Dig%26utm_medium%3Dsocial%26utm_content%3Dlink_in_bio#",
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
  const { data: indexCardsData } = usePageContentCards("index");
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const destinationsScrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeAttraction, setActiveAttraction] = useState(0);
  const [eventsPage, setEventsPage] = useState(0);

  const indexCards = useMemo(() => {
    const liveCards = (indexCardsData ?? []).filter((card) => card.pageKey === "index");
    const fallbackIndex = fallbackContentCards.filter((card) => card.pageKey === "index" && card.published);
    return { liveCards, fallbackIndex };
  }, [indexCardsData]);

  const getSectionCards = (sectionKey: string) => {
    const live = indexCards.liveCards.filter((card) => card.sectionKey === sectionKey);
    if (live.length) return live;
    return indexCards.fallbackIndex.filter((card) => card.sectionKey === sectionKey);
  };

  const destinationCards = getSectionCards("directions").map((card) => ({
    title: card.title,
    href: card.href ?? undefined,
    image: card.imageUrl ?? "",
  }));

  const summerFeaturedCard = getSectionCards("interesting-featured")[0];
  const summerRecommendations = {
    featured: {
      title: summerFeaturedCard?.title ?? "Винний маршрут Одещини",
      image:
        summerFeaturedCard?.imageUrl ??
        "https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1800&q=80",
    },
    items: getSectionCards("interesting").map((card) => ({
      title: card.title,
      image: card.imageUrl ?? "",
    })),
  };

  const topAttractions = getSectionCards("attractions").map((card) => ({
    title: card.title,
    subtitle: card.subtitle ?? "",
    description: String(card.payload?.description ?? ""),
    image: card.imageUrl ?? "",
  }));
  const safeTopAttractions = topAttractions.length
    ? topAttractions
    : [
        {
          title: "Одещина",
          subtitle: "",
          description: "Додайте картки у розділ attractions для головної сторінки.",
          image:
            "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2200&q=80",
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

    const probe = window.scrollY + window.innerHeight * 0.4;
    let currentIndex = 0;

    sections.forEach((section, idx) => {
      if (section.offsetTop <= probe) currentIndex = idx;
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
    <div className="bg-[#fff2e8]">
      <div className="fixed left-8 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-4">
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
                {navLeft.map((item, index) => (
                  <a key={item} href="#" className="transition-opacity hover:opacity-75">
                    {item}
                    {index === 0 ? <span className="ml-4 text-[15px]">{star}</span> : null}
                  </a>
                ))}
              </nav>

              <h1 className="px-2 text-center text-[42px] leading-[0.95] tracking-[0.04em] font-odesa-regular font-odesa-ss02">
                ОДЕЩИНА
              </h1>

              <nav className="flex items-center justify-center gap-4 text-[14px] leading-none md:justify-end font-odesa-medium">
                <span className="text-[15px]">{star}</span>
                {navRight.map((item, index) => (
                  <a key={item} href="#" className="transition-opacity hover:opacity-75">
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
            Досліджуй Одещину
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-3 text-[16px] leading-none md:text-[22px] font-odesa-regular"
          >
            Серце Південного Колориту
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.4 }}
            className="mt-10 rounded-full border border-[#fff2e8] bg-[#fff2e8] px-9 py-2 text-[12px] leading-none text-[#00376c] font-odesa-semi"
            type="button"
          >
            Маршрути
          </motion.button>

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

              <div className="grid grid-cols-1 items-start gap-6 md:absolute md:bottom-0 md:right-0 md:grid-cols-2 md:gap-8">
                {featureCards.map((item) => (
                  <article key={item.number} className="w-full max-w-[170px] text-left">
                    <div className="flex items-start gap-2">
                      <span className="text-[40px] leading-none font-odesa-regular">{item.number}</span>
                      <div className="pt-1 text-[22px] leading-[0.95] font-odesa-medium">
                        <div>{item.first}</div>
                        {item.second ? <div>{item.second}</div> : null}
                      </div>
                    </div>
                    <div className="mt-2 h-[6px] w-full bg-[#fff2e8]" />
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>
      </section>

      <section ref={setSectionRef(1)} className="relative z-10 bg-[#fff2e8] px-4 py-20 text-[#002f5e] md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="flex flex-wrap items-end justify-between gap-6"
          >
            <div>
              <h3 className="text-[44px] leading-none md:text-[64px] font-odesa-medium">Основні напрямки</h3>
              <button className="mt-7 inline-flex items-center gap-2 text-[18px] font-odesa-medium" type="button">
                Дізнайтеся більше <ArrowRight className="h-5 w-5" />
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
            className="mt-10 -mx-4 px-4"
          >
            <div
              ref={destinationsScrollerRef}
              className="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {destinationCards.map((card) => {
                const cardBody = (
                  <>
                    <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#002f5e]/70 via-transparent to-transparent" />
                    <h4 className="absolute bottom-8 left-7 text-[42px] leading-none text-[#fff2e8] font-odesa-medium">{card.title}</h4>
                  </>
                );

                if (card.href) {
                  return (
                    <Link
                      key={card.title}
                      to={card.href}
                      className="relative h-[520px] w-[350px] shrink-0 overflow-hidden rounded-[26px] bg-[#002f5e]/10 transition-transform duration-300 hover:-translate-y-1 md:w-[420px]"
                    >
                      {cardBody}
                    </Link>
                  );
                }

                return (
                  <article key={card.title} className="relative h-[520px] w-[350px] shrink-0 overflow-hidden rounded-[26px] bg-[#002f5e]/10 md:w-[420px]">
                    {cardBody}
                  </article>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <section ref={setSectionRef(2)} className="relative z-10 flex min-h-screen items-center bg-[#002f5e] px-4 py-10 text-[#fff2e8] md:px-10">
        <div className="mx-auto w-full max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]"
          >
            <h3 className="text-[52px] leading-[0.92] md:text-[72px] font-odesa-medium">
              Цікаве
            </h3>

            <article className="relative h-[320px] overflow-hidden rounded-[28px] md:h-[430px]">
              <img
                src={summerRecommendations.featured.image}
                alt={summerRecommendations.featured.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
              <h4 className="absolute bottom-7 left-7 max-w-[760px] text-[38px] leading-[0.95] md:text-[52px] font-odesa-medium">
                {summerRecommendations.featured.title}
              </h4>
            </article>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3"
          >
            {summerRecommendations.items.map((item) => (
              <article key={item.title} className="relative h-[250px] overflow-hidden rounded-[24px] md:h-[300px]">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <h5 className="absolute bottom-5 left-5 right-5 text-[30px] leading-[0.95] font-odesa-medium">{item.title}</h5>
              </article>
            ))}
          </motion.div>
        </div>
      </section>

      <section ref={setSectionRef(3)} className="relative min-h-screen overflow-hidden bg-[#9f1f47] text-[#fff2e8]">
        <div className="absolute inset-0 p-3 md:p-5">
          <div className="relative h-full w-full overflow-hidden rounded-[30px] md:rounded-[40px]">
            <AnimatePresence mode="wait">
              <motion.img
                key={safeTopAttractions[activeAttraction].image}
                src={safeTopAttractions[activeAttraction].image}
                alt={safeTopAttractions[activeAttraction].title}
                initial={{ opacity: 0.35, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.2, scale: 1.02 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-b from-[#002f5e]/20 via-[#002f5e]/20 to-[#14000c]/60" />
          </div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1680px] items-end justify-between gap-8 px-4 pb-6 md:px-8 md:pb-8">
          <div className="w-full max-w-[820px]">
            <AnimatePresence mode="wait">
              <motion.article
                key={topAttractions[activeAttraction].title}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-[30px] bg-[#2a0015]/92 p-6 md:p-10"
              >
                <h3 className="mt-3 text-[54px] leading-[0.96] md:text-[84px] font-odesa-medium">
                  {safeTopAttractions[activeAttraction].title}
                </h3>
                <p className="mt-6 max-w-[680px] text-[26px] leading-[1.22] md:text-[36px] font-odesa-regular">
                  {safeTopAttractions[activeAttraction].description}
                </p>
                <button className="mt-8 inline-flex items-center gap-2 text-[36px] text-[#9f1f47] font-odesa-medium" type="button">
                  Детальніше <ArrowRight className="h-8 w-8" />
                </button>
              </motion.article>
            </AnimatePresence>
          </div>

          <div className="mb-0 flex shrink-0 items-center overflow-hidden rounded-[28px] bg-[#2a0015]/92">
            <button
              type="button"
              onClick={goPrevAttraction}
              className="flex h-[120px] w-[120px] items-center justify-center border-r border-white/15 transition-colors hover:bg-[#3a0020]"
              aria-label="Попередній об'єкт"
            >
              <ChevronLeft className="h-12 w-12" />
            </button>
            <button
              type="button"
              onClick={goNextAttraction}
              className="flex h-[120px] w-[120px] items-center justify-center transition-colors hover:bg-[#5a3245]"
              aria-label="Наступний об'єкт"
            >
              <ChevronRight className="h-12 w-12" />
            </button>
          </div>
        </div>
      </section>

      <section ref={setSectionRef(4)} className="relative z-10 flex min-h-screen items-center bg-[#fff2e8] px-4 py-12 text-[#002f5e] md:px-10">
        <div className="mx-auto w-full max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="flex flex-wrap items-end justify-between gap-5"
          >
            <div>
              <h3 className="text-[44px] leading-none md:text-[64px] font-odesa-medium">Події</h3>
              <button className="mt-5 inline-flex items-center gap-2 text-[18px] text-[#9f1f47] font-odesa-medium" type="button">
                Показати всі <ArrowRight className="h-5 w-5" />
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
        <SiteFooter />
      </div>
    </div>
  );
};

export default Index;
