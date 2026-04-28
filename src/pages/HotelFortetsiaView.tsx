import { useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, MapPin, Phone, Star } from "lucide-react";
import BackButton from "@/components/BackButton";
import SiteFooter from "@/components/SiteFooter";

const hotelTabs = [
  { id: "description", label: "Опис" },
  { id: "information", label: "Інформація" },
  { id: "amenities", label: "Зручності та послуги" },
  { id: "payment", label: "Способи оплати" },
  { id: "rating", label: "Рейтинг" },
  { id: "contacts", label: "Контакти" },
];

const pillClass = "inline-flex items-center gap-3 rounded-full bg-[#3a638b] px-7 py-4 text-[24px] leading-none font-odesa-regular";

const HotelFortetsiaView = () => {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  const goTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#002f5e] text-[#fff2e8]">
      <section className="px-4 pb-8 pt-10 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-[1400px]"
        >
          <BackButton to="/napryamky/bilhorod-dnistrovskyi" invert />
          <h1 className="mt-6 text-[56px] leading-none md:text-[90px] font-odesa-medium">
            Fortetsia View Hotel
          </h1>
          <p className="mt-4 text-[24px] text-[#fff2e8]/90 font-odesa-regular">
            Де зупинитись <span className="mx-2 text-[#df9b3b]">•</span> Білгород-Дністровський
          </p>
        </motion.div>
      </section>

      <section className="sticky top-0 z-40 bg-[#5f2238]/90 px-4 py-3 backdrop-blur md:px-10">
        <div className="mx-auto max-w-[1400px] overflow-x-auto">
          <div className="flex min-w-max items-center gap-8 text-[16px] md:text-[22px] font-odesa-medium">
            {hotelTabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => goTo(tab.id)} className="whitespace-nowrap opacity-85 hover:opacity-100 transition-opacity">
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:px-10">
        <div className="mx-auto grid max-w-[1400px] gap-8 xl:grid-cols-[1fr_430px]">
          <div className="space-y-10">
            <article className="relative overflow-hidden rounded-[28px] border border-[#fff2e8]/20">
              <img
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2200&q=80"
                alt="Fortetsia View Hotel"
                className="h-[320px] w-full object-cover md:h-[640px]"
              />
              <button
                type="button"
                className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-[#9f1f47] px-7 py-3 text-[22px] font-odesa-medium transition-colors hover:bg-[#ba2c5a]"
              >
                Галерея <ArrowRight className="h-5 w-5" />
              </button>
            </article>

            <section ref={setSectionRef("description")} id="description" className="scroll-mt-24 rounded-[26px] border border-[#fff2e8]/20 p-6 md:p-8">
              <h2 className="text-[44px] md:text-[58px] leading-none font-odesa-medium">Опис</h2>
              <div className="mt-6 space-y-6 text-[24px] md:text-[34px] leading-[1.24] text-[#fff2e8]/92 font-odesa-regular">
                <p>
                  Fortetsia View Hotel - сучасний 4-зірковий готель поруч із історичним центром,
                  з панорамними видами на лиман та фортецю.
                </p>
                <p>
                  Для гостей доступні комфортні номери, простір для роботи, ресторан із локальним
                  меню та тераса для вечірнього відпочинку.
                </p>
              </div>
            </section>

            <section ref={setSectionRef("information")} id="information" className="scroll-mt-24 rounded-[26px] border border-[#fff2e8]/20 p-6 md:p-8">
              <h2 className="text-[44px] md:text-[58px] leading-none font-odesa-medium">Інформація</h2>
              <p className="mt-6 text-[24px] md:text-[34px] leading-[1.24] text-[#fff2e8]/92 font-odesa-regular">
                Готель підходить для сімейних подорожей, культурних вікендів та ділових поїздок.
                Є трансфер, паркінг та цілодобова стійка реєстрації.
              </p>
            </section>

            <section ref={setSectionRef("amenities")} id="amenities" className="scroll-mt-24 rounded-[26px] border border-[#fff2e8]/20 p-6 md:p-8">
              <h2 className="text-[44px] md:text-[58px] leading-none font-odesa-medium">Зручності та послуги</h2>
              <div className="mt-8 flex flex-wrap gap-4">
                {["Безкоштовний Wi-Fi", "Паркінг", "Спа-зона", "Ресторан", "Тераса", "Family friendly"].map((item) => (
                  <span key={item} className={pillClass}>
                    <Check className="h-6 w-6 text-[#df9b3b]" />
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section ref={setSectionRef("payment")} id="payment" className="scroll-mt-24 rounded-[26px] border border-[#fff2e8]/20 p-6 md:p-8">
              <h2 className="text-[44px] md:text-[58px] leading-none font-odesa-medium">Способи оплати</h2>
              <div className="mt-8 flex flex-wrap gap-4">
                {["Visa", "Mastercard", "Apple Pay", "Google Pay", "Готівка"].map((item) => (
                  <span key={item} className={pillClass}>
                    <Check className="h-6 w-6 text-[#df9b3b]" />
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section ref={setSectionRef("rating")} id="rating" className="scroll-mt-24 rounded-[26px] border border-[#fff2e8]/20 p-6 md:p-8">
              <h2 className="text-[44px] md:text-[58px] leading-none font-odesa-medium">Рейтинг</h2>
              <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#3a638b] px-7 py-4 text-[28px] md:text-[40px] font-odesa-medium">
                <Star className="h-8 w-8 fill-[#df9b3b] text-[#df9b3b]" />
                4.8 / 5.0
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-[24px] bg-[#30557e] p-7">
              <h3 className="text-[34px] leading-none font-odesa-medium">Перевірити наявність</h3>
              <div className="mt-5 grid grid-cols-2 gap-3 text-[20px]">
                <div className="rounded-xl border border-[#fff2e8]/40 px-4 py-3">Прибуття</div>
                <div className="rounded-xl border border-[#fff2e8]/40 px-4 py-3">Виїзд</div>
                <div className="rounded-xl border border-[#fff2e8]/40 px-4 py-3">Номер</div>
                <div className="rounded-xl border border-[#fff2e8]/40 px-4 py-3">Гостей</div>
              </div>
              <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#9f1f47] px-8 py-3 text-[24px] font-odesa-medium transition-colors hover:bg-[#ba2c5a]">
                Знайти номер
              </button>
            </div>

            <section ref={setSectionRef("contacts")} id="contacts" className="scroll-mt-24 rounded-[24px] bg-[#30557e] p-7">
              <h3 className="text-[34px] leading-none font-odesa-medium">Контакти</h3>
              <p className="mt-4 text-[28px] leading-[1.2] text-[#fff2e8]/92 font-odesa-regular">
                Fortetsia View Hotel
                <br />
                вул. Ізмаїльська, 27
                <br />
                Білгород-Дністровський
              </p>
              <p className="mt-4 flex items-center gap-3 text-[24px] font-odesa-regular">
                <Phone className="h-6 w-6 text-[#df9b3b]" />
                +38 (04849) 3 11 11
              </p>
              <p className="mt-2 flex items-center gap-3 text-[24px] font-odesa-regular">
                <MapPin className="h-6 w-6 text-[#df9b3b]" />
                Маршрут на карті
              </p>
            </section>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default HotelFortetsiaView;
