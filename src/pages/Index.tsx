import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Facebook, Instagram, Twitter } from "lucide-react";
import seaHero from "@/assets/sea-hero.jpg";
import geminiLogo from "@/assets/gemini-svg-2.svg";

const navLeft = ["Про Регіон", "Історія"];
const navRight = ["Блог", "Контакти"];

const featureCards = [
  { number: "01", first: "Історична", second: "спадщина" },
  { number: "02", first: "Культура", second: "та традиції" },
];

const destinationCards = [
  {
    title: "Білгород-Дністровський",
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
  const nextSectionRef = useRef<HTMLElement | null>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToNext = () => {
    nextSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-[#fff2e8]">
      <section className="relative min-h-screen overflow-hidden text-[#fff2e8]">
        <img src={seaHero} alt="Одещина" className="absolute inset-0 h-full w-full object-cover" />
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

        <div className="absolute left-8 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-4">
          <button
            type="button"
            aria-label="Вгору"
            onClick={scrollToTop}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff2e8]"
          >
            <ArrowGlyph direction="up" />
          </button>
          <button
            type="button"
            aria-label="Вниз"
            onClick={scrollToNext}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff2e8]"
          >
            <ArrowGlyph direction="down" />
          </button>
        </div>

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
            className="mt-10 border border-[#fff2e8] bg-[#fff2e8] px-8 py-2 text-[12px] leading-none text-[#00376c] font-odesa-semi"
            type="button"
          >
            Онлайн-гід
          </motion.button>

          <section className="mt-auto w-full pt-4">
            <div className="mx-auto flex max-w-[1060px] flex-col items-center gap-8 md:relative md:min-h-[140px] md:block">
              <div className="inline-flex items-center gap-4 bg-[#fff2e8] px-8 py-4 text-[#00376c] md:absolute md:bottom-0 md:left-1/2 md:-translate-x-1/2">
                <Twitter className="h-6 w-6" strokeWidth={2.5} />
                <Instagram className="h-6 w-6" strokeWidth={2.5} />
                <Facebook className="h-6 w-6" strokeWidth={2.5} />
              </div>

              <div className="grid grid-cols-1 items-start gap-6 md:absolute md:bottom-0 md:right-0 md:grid-cols-2 md:gap-8">
                {featureCards.map((item) => (
                  <article key={item.number} className="w-full max-w-[170px] text-left">
                    <div className="flex items-start gap-2">
                      <span className="text-[40px] leading-none font-odesa-regular">{item.number}</span>
                      <div className="pt-1 text-[22px] leading-[0.95] font-odesa-medium">
                        <div>{item.first}</div>
                        <div>{item.second}</div>
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

      <section ref={nextSectionRef} className="relative z-10 bg-[#fff2e8] px-4 py-20 text-[#002f5e] md:px-10">
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
                className="flex h-12 w-12 items-center justify-center rounded-full border border-[#002f5e]/40"
                aria-label="Попередній"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
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
            className="mt-10 -mx-4 overflow-x-auto px-4"
          >
            <div className="flex min-w-max gap-6 pb-2">
              {destinationCards.map((card) => (
                <article
                  key={card.title}
                  className="relative h-[520px] w-[350px] shrink-0 overflow-hidden rounded-[26px] bg-[#002f5e]/10 md:w-[420px]"
                >
                  <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002f5e]/70 via-transparent to-transparent" />
                  <h4 className="absolute bottom-8 left-7 text-[42px] leading-none text-[#fff2e8] font-odesa-medium">{card.title}</h4>
                </article>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
