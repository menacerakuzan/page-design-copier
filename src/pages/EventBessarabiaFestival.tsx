import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import BackButton from "@/components/BackButton";
import SiteFooter from "@/components/SiteFooter";

const eventTabs = [
  { id: "overview", label: "Опис" },
  { id: "event-info", label: "Інформація" },
  { id: "dates", label: "Дати" },
  { id: "map", label: "Карта" },
  { id: "contacts", label: "Контакти" },
];

const EventBessarabiaFestival = () => {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  const goTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#002f5e] text-[#fff2e8]">
      <section className="px-4 pb-10 pt-10 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-[1400px]"
        >
          <BackButton to="/" invert />

          <h1 className="mt-6 text-[52px] leading-none md:text-[84px] font-odesa-medium">
            Фестиваль вина та смаку Бессарабії
          </h1>
          <p className="mt-4 text-[22px] text-[#fff2e8]/85 font-odesa-regular">
            Події <span className="mx-2 text-[#9f1f47]">•</span> Болград
          </p>
        </motion.div>
      </section>

      <section className="sticky top-0 z-40 bg-[#5f2238]/90 px-4 py-3 backdrop-blur md:px-10">
        <div className="mx-auto max-w-[1400px] overflow-x-auto">
          <div className="flex min-w-max items-center gap-8 text-[16px] md:text-[22px] font-odesa-medium">
            {eventTabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => goTo(tab.id)} className="whitespace-nowrap opacity-85 hover:opacity-100 transition-opacity">
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 md:px-10">
        <div className="mx-auto grid max-w-[1400px] gap-8 xl:grid-cols-[1fr_420px]">
          <div className="space-y-10">
            <article className="overflow-hidden rounded-[26px] border border-[#fff2e8]/20">
              <img
                src="https://images.unsplash.com/photo-1532635042-a6f6ad4745f9?auto=format&fit=crop&w=2200&q=80"
                alt="Фестиваль вина та смаку Бессарабії"
                className="h-[280px] w-full object-cover md:h-[560px]"
              />
            </article>

            <div ref={setSectionRef("overview")} id="overview" className="scroll-mt-24 max-w-[980px] space-y-8">
              <p className="text-[36px] leading-[1.12] md:text-[52px] font-odesa-medium">
                Головна винна подія півдня України з дегустаціями, фермерськими ярмарками,
                локальною кухнею та музичною програмою просто неба.
              </p>

              <div className="space-y-6 text-[26px] leading-[1.28] text-[#fff2e8]/92 font-odesa-regular">
                <p>
                  Протягом десяти днів Болград об’єднає виноробні Бессарабії, гастрономічні
                  локації та культурні ініціативи регіону. Гості фестивалю зможуть відвідати
                  тематичні дегустації, зустрічі з виноробами, фудкорти та ремісничі зони.
                </p>
                <p>
                  Подія створюється як шаблонна сторінка для майбутніх подій: тут уже є структура
                  з основним описом, блоком дат, картою, контактами та стандартним футером.
                </p>
              </div>
            </div>

            <article ref={setSectionRef("event-info")} id="event-info" className="scroll-mt-24 rounded-[26px] bg-[#0e3f74] p-6 md:p-8">
              <h2 className="text-[34px] md:text-[44px] font-odesa-medium">Інформація про подію</h2>
              <div className="mt-5 divide-y divide-[#fff2e8]/20 border-y border-[#fff2e8]/20">
                <div className="grid gap-3 py-5 md:grid-cols-[220px_1fr]">
                  <p className="text-[24px] text-[#fff2e8]/86 font-odesa-medium">Організатор</p>
                  <p className="text-[24px] font-odesa-regular">Bessarabia Wine Association</p>
                </div>
                <div className="grid gap-3 py-5 md:grid-cols-[220px_1fr]">
                  <p className="text-[24px] text-[#fff2e8]/86 font-odesa-medium">Локація</p>
                  <p className="text-[24px] font-odesa-regular">Болград, Центральна площа та винні подвірʼя</p>
                </div>
                <div className="grid gap-3 py-5 md:grid-cols-[220px_1fr]">
                  <p className="text-[24px] text-[#fff2e8]/86 font-odesa-medium">Сайт події</p>
                  <a href="#" className="text-[24px] text-[#df9b3b] underline underline-offset-4 font-odesa-regular">
                    Форма для бронювання скоро зʼявиться
                  </a>
                </div>
                <div className="grid gap-3 py-5 md:grid-cols-[220px_1fr]">
                  <p className="text-[24px] text-[#fff2e8]/86 font-odesa-medium">Години роботи</p>
                  <p className="text-[24px] font-odesa-regular">
                    Щодня: 09:00 - 18:00, фудкорт та вечірня сцена: до 22:00
                  </p>
                </div>
              </div>
            </article>

            <article ref={setSectionRef("dates")} id="dates" className="scroll-mt-24 rounded-[26px] border border-[#fff2e8]/20 p-6 md:p-8">
              <h2 className="text-[34px] md:text-[44px] font-odesa-medium">Дати</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[18px] bg-[#274f7a] p-5">
                  <p className="text-[22px] text-[#fff2e8]/80 font-odesa-regular">Квітень 2026</p>
                  <p className="mt-2 text-[30px] leading-tight font-odesa-medium">24, 25, 26, 27, 28, 29, 30</p>
                </div>
                <div className="rounded-[18px] bg-[#274f7a] p-5">
                  <p className="text-[22px] text-[#fff2e8]/80 font-odesa-regular">Травень 2026</p>
                  <p className="mt-2 text-[30px] leading-tight font-odesa-medium">1, 2, 3</p>
                </div>
              </div>
            </article>

            <article ref={setSectionRef("map")} id="map" className="scroll-mt-24 overflow-hidden rounded-[26px] border border-[#fff2e8]/20">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=2200&q=80"
                  alt="Карта локацій фестивалю"
                  className="h-[460px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-[#002f5e]/55" />
                <div className="absolute left-6 top-6 right-6 flex items-center justify-between">
                  <h3 className="text-[30px] md:text-[38px] font-odesa-medium">Локації поблизу фестивалю</h3>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-[#9f1f47] px-6 py-3 text-[20px] text-[#fff2e8] font-odesa-medium transition-colors hover:bg-[#ba2c5a]"
                  >
                    Детальна карта <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </article>

            <article ref={setSectionRef("contacts")} id="contacts" className="scroll-mt-24 rounded-[26px] border border-[#fff2e8]/20 p-6 md:p-8">
              <h2 className="text-[34px] md:text-[44px] font-odesa-medium">Контакти</h2>
              <div className="mt-6 max-w-[820px] space-y-4 text-[26px] leading-[1.24] text-[#fff2e8]/92 font-odesa-regular">
                <p className="font-odesa-medium">BERNEXPO AG</p>
                <p>Mingerstrasse 6, 3000 Bern, Швейцарія</p>
                <p className="flex items-center gap-2">
                  <Phone className="h-6 w-6 text-[#df9b3b]" />
                  <a className="text-[#df9b3b] underline underline-offset-4" href="tel:+410313401141">
                    +41 (0)31 340 11 41
                  </a>
                </p>
              </div>
            </article>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[24px] bg-[#30557e] p-7">
              <p className="text-[28px] text-[#fff2e8]/80 font-odesa-regular">Дата</p>
              <p className="mt-2 text-[60px] leading-[0.95] font-odesa-medium">24.04 - 03.05</p>
              <p className="mt-2 text-[34px] leading-none font-odesa-medium">2026</p>
            </div>

            <div className="rounded-[24px] bg-[#30557e] p-7">
              <p className="text-[28px] text-[#fff2e8]/80 font-odesa-regular">Щодня</p>
              <p className="mt-2 text-[44px] leading-none font-odesa-medium">9:00 - 18:00</p>
            </div>

            <div className="rounded-[24px] bg-[#30557e] p-7">
              <p className="text-[40px] leading-none font-odesa-medium">BERNEXPO AG</p>
              <p className="mt-3 text-[30px] leading-[1.2] text-[#fff2e8]/90 font-odesa-regular">Mingerstrasse 6</p>
              <p className="text-[30px] leading-[1.2] text-[#fff2e8]/90 font-odesa-regular">3000 Bern</p>
              <p className="mt-4 flex items-center gap-3 text-[28px] leading-[1.2] font-odesa-regular">
                <MapPin className="h-6 w-6 text-[#df9b3b]" />
                Болград
              </p>
              <p className="mt-2 flex items-center gap-3 text-[28px] leading-[1.2] font-odesa-regular">
                <Phone className="h-6 w-6 text-[#df9b3b]" />
                +41 (0)31 340 11 41
              </p>
            </div>

            
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default EventBessarabiaFestival;
