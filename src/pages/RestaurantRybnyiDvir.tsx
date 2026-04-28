import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock3, MapPin, Phone } from "lucide-react";
import BackButton from "@/components/BackButton";
import SiteFooter from "@/components/SiteFooter";
import { CONTENT_THEMES } from "@/config/contentThemes";

const pillClass = "inline-flex items-center gap-3 rounded-full bg-[#3a638b] px-8 py-4 text-[28px] leading-none font-odesa-regular";
const restaurantTabs = [
  { id: "description", label: "Опис" },
  { id: "information", label: "Інформація" },
  { id: "facilities", label: "Зручності" },
  { id: "contacts", label: "Контакти" },
];

const RestaurantRybnyiDvir = () => {
  const theme = CONTENT_THEMES.restaurant;
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  const goTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.pageBg, color: theme.text }}>
      <section className="px-4 pb-12 pt-10 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-[1400px]"
        >
          <BackButton to="/napryamky/bilhorod-dnistrovskyi" invert={false} />

          <h1 className="mt-6 text-[58px] leading-none md:text-[96px] font-odesa-medium">Рибний двір</h1>
          <p className="mt-4 text-[24px] text-[#fff2e8]/90 font-odesa-regular">
            Ресторан <span className="mx-2" style={{ color: theme.accentSoft }}>•</span> Білгород-Дністровський
          </p>
        </motion.div>
      </section>

      <section className="sticky top-0 z-40 px-4 py-3 backdrop-blur md:px-10" style={{ backgroundColor: theme.stickyBg }}>
        <div className="mx-auto max-w-[1400px] overflow-x-auto">
          <div className="flex min-w-max items-center gap-8 text-[16px] md:text-[22px] font-odesa-medium">
            {restaurantTabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => goTo(tab.id)} className="whitespace-nowrap opacity-85 hover:opacity-100 transition-opacity">
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-6 md:px-10">
        <div className="mx-auto grid max-w-[1400px] gap-8 xl:grid-cols-[1fr_430px]">
          <div className="space-y-10">
            <article className="relative overflow-hidden rounded-[28px] border border-[#fff2e8]/20">
              <img
                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=2200&q=80"
                alt="Ресторан Рибний двір"
                className="h-[300px] w-full object-cover md:h-[620px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#001f3f]/35 via-transparent to-transparent" />
              <button
                type="button"
                className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-full px-7 py-3 text-[22px] font-odesa-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.accent, color: "#002f5e" }}
              >
                Галерея <ArrowRight className="h-5 w-5" />
              </button>
            </article>

            <p ref={setSectionRef("description")} id="description" className="scroll-mt-24 max-w-[1080px] text-[34px] leading-[1.18] md:text-[58px] font-odesa-medium">
              Ресторан із локальною бессарабською кухнею, рибними спеціалітетами та великим
              літнім майданчиком біля лиману.
            </p>

            <section ref={setSectionRef("information")} id="information" className="scroll-mt-24 rounded-[26px] border border-[#fff2e8]/20 p-6 md:p-8">
              <h2 className="text-[42px] md:text-[56px] leading-none font-odesa-medium">Інформація</h2>
              <h3 className="mt-8 text-[30px] md:text-[42px] leading-none font-odesa-medium">Опис</h3>
              <div className="mt-5 space-y-5 text-[24px] md:text-[34px] leading-[1.24] text-[#fff2e8]/92 font-odesa-regular">
                <p>
                  «Рибний двір» - одна з найпопулярніших гастролокацій Білгорода-Дністровського.
                  Заклад поєднує традиційні страви півдня, сучасну подачу та атмосферу морського
                  міста.
                </p>
                <p>
                  У меню: чорноморська риба, мідії, локальні сири, вина Бессарабії та сезонні
                  страви від шефа.
                </p>
              </div>
            </section>

            <section ref={setSectionRef("facilities")} id="facilities" className="scroll-mt-24 rounded-[26px] border border-[#fff2e8]/20 p-6 md:p-8">
              <h2 className="text-[42px] md:text-[56px] leading-none font-odesa-medium">Зручності ресторану</h2>
              <div className="mt-8 flex flex-wrap gap-4">
                <span className={pillClass}>
                  <Check className="h-6 w-6" style={{ color: theme.accentSoft }} />
                  Літня тераса
                </span>
                <span className={pillClass}>
                  <Check className="h-6 w-6" style={{ color: theme.accentSoft }} />
                  Дитяче меню
                </span>
                <span className={pillClass}>
                  <Check className="h-6 w-6" style={{ color: theme.accentSoft }} />
                  Take away
                </span>
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[24px] p-7" style={{ backgroundColor: theme.panelBg }}>
              <p className="text-[40px] leading-none font-odesa-medium">Рибний двір</p>
              <p className="mt-4 text-[28px] leading-[1.25] text-[#fff2e8]/92 font-odesa-regular">
                вул. Ізмаїльська, 15
                <br />
                Білгород-Дністровський
                <br />
                Україна
              </p>
            </div>

            <div className="rounded-[24px] p-7" style={{ backgroundColor: theme.panelBg }}>
              <h3 className="text-[34px] leading-none font-odesa-medium">Години роботи</h3>
              <div className="mt-5 space-y-3 text-[26px] leading-[1.2] font-odesa-regular">
                <p className="flex items-center gap-3">
                  <Clock3 className="h-6 w-6" style={{ color: theme.accentSoft }} />
                  Пн - Чт: 09:00 - 22:00
                </p>
                <p>Пт - Сб: 09:00 - 23:30</p>
                <p>Нд: 10:00 - 21:00</p>
              </div>
              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[22px] font-odesa-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: theme.accent, color: "#002f5e" }}
              >
                Забронювати <ArrowRight className="h-5 w-5" />
              </button>
            </div>

            <div ref={setSectionRef("contacts")} id="contacts" className="scroll-mt-24 rounded-[24px] p-7" style={{ backgroundColor: theme.panelBg }}>
              <p className="flex items-center gap-3 text-[28px] font-odesa-regular">
                <MapPin className="h-6 w-6" style={{ color: theme.accentSoft }} />
                Білгород-Дністровський
              </p>
              <p className="mt-3 flex items-center gap-3 text-[28px] font-odesa-regular">
                <Phone className="h-6 w-6" style={{ color: theme.accentSoft }} />
                +38 (04849) 2 20 20
              </p>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default RestaurantRybnyiDvir;
