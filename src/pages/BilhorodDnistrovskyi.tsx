import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, CloudSun, Facebook, Hotel, Info, Instagram, Linkedin, MapPin, Send, Ticket, Twitter, Utensils, Youtube } from "lucide-react";

const localTabs = [
  { id: "main", label: "Найголовніше" },
  { id: "media", label: "Фото та відео" },
  { id: "events", label: "Події" },
  { id: "recommended", label: "Рекомендуємо" },
  { id: "hotels", label: "Готелі" },
  { id: "offers", label: "Актуальні пропозиції" },
  { id: "restaurants", label: "Ресторани" },
  { id: "info", label: "Інформація" },
];

const brightMoments = [
  {
    title: "Аккерманська фортеця",
    subtitle: "Головна пам'ятка міста",
    image: "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Старі квартали",
    subtitle: "Атмосфера історичного центру",
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Панорама лиману",
    subtitle: "Кращі види на Дністровський лиман",
    image: "https://images.unsplash.com/photo-1505764706515-aa95265c5abc?auto=format&fit=crop&w=1800&q=80",
  },
  {
    title: "Оглядові вежі",
    subtitle: "Точки для фото і прогулянок",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1400&q=80",
  },
];

const events = [
  {
    title: "Фестиваль середньовічної культури",
    date: "Білгород-Дністровський, 06.05 - 10.05.2026",
    image: "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Дні античної спадщини",
    date: "Білгород-Дністровський, 07.05.2026",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Музичний вечір біля фортеці",
    date: "Білгород-Дністровський, 08.05 - 09.05.2026",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
  },
];

const recommended = [
  {
    title: "Цитадель фортеці",
    subtitle: "Головна історична пам'ятка",
    image: "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Краєзнавчий музей",
    subtitle: "Історія регіону в деталях",
    image: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Набережна лиману",
    subtitle: "Найкращі заходи сонця",
    image: "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Винні маршрути Бессарабії",
    subtitle: "Дегустації та локальні господарства",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
  },
];
const hotels = [
  {
    title: "Fortetsia View Hotel",
    subtitle: "Білгород-Дністровський",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Liman Family Resort",
    subtitle: "Затока",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Akkerman Boutique",
    subtitle: "Білгород-Дністровський",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
  },
];
const offers = [
  {
    title: "Вікенд у фортеці",
    text: "-20% на екскурсії фортецею",
    image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Сімейний пакет",
    text: "Сімейний квиток у музей + гід",
    image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Sunset Pass",
    text: "Вечірній катер і фототур лиманом",
    image: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80",
  },
];
const restaurants = [
  {
    title: "Рибний двір",
    subtitle: "Білгород-Дністровський",
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Casa Bessarabia",
    subtitle: "Одеська область",
    image: "https://images.unsplash.com/photo-1562059390-a761a084768e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Лиман Хаус",
    subtitle: "Білгород-Дністровський",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
  },
];

const infoCards = [
  {
    icon: MapPin,
    title: "Контакти",
    lines: ["Турцентр Аккерман", "вул. Ізмаїльська, 10", "+38 (04849) 2 20 20"],
    image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Hotel,
    title: "Проживання",
    lines: ["Готелі", "Апартаменти", "Садиби"],
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Ticket,
    title: "Квитки",
    lines: ["Фортеця", "Музей", "Фестивалі"],
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Info,
    title: "Довідка",
    lines: ["Маршрути", "Транспорт", "Паркінги"],
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
  },
];

const footerColumns = [
  {
    title: "Мандрівнику",
    links: ["Що подивитись", "Куди поїхати", "Планування", "Події", "Про регіон"],
  },
  {
    title: "Партнерам",
    links: ["Чому Одещина", "Маркетингові матеріали", "Статистика та дані", "Контакти"],
  },
  {
    title: "Медіа",
    links: ["Новини", "Фото та відео", "Прес-кит", "Логотипи"],
  },
  {
    title: "Бізнес-події",
    links: ["MICE в регіоні", "Локації", "Натхнення", "Партнери"],
  },
];

const BilhorodDnistrovskyi = () => {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  const handleTabClick = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <section className="relative min-h-screen overflow-hidden text-[#fff2e8]">
        <img
          src="https://tripmydream.cc/travelhub/travel/block_gallery/10/6474/default_106474.jpg?auto=format&fit=crop&w=1800&q=80"
          alt="Білгород-Дністровський"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,47,94,0.18),rgba(0,16,34,0.56))]" />

        <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 py-8 md:px-14 md:py-10">
          <Link
            to="/"
            className="w-fit rounded-full bg-[#002f5e] px-5 py-2 text-[14px] leading-none tracking-[0.04em] text-[#fff2e8] transition-opacity hover:opacity-90 font-odesa-medium"
          >
            ← Назад
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="pb-14 text-center"
          >
            <h1 className="text-[68px] leading-[0.95] md:text-[128px] font-odesa-medium">Білгород-Дністровський</h1>
          </motion.div>

          <div className="text-[18px] leading-none md:text-[28px] font-odesa-regular">
            <span className="font-odesa-medium">Куди поїхати</span>
            <span className="mx-2 opacity-80">/</span>
            <span className="opacity-90">Регіон Одещини</span>
            <span className="mx-2 opacity-80">/</span>
            <span className="opacity-90">Білгород-Дністровський</span>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-40 bg-[#5f2238]/90 px-4 py-3 backdrop-blur md:px-10">
        <div className="mx-auto max-w-[1400px] overflow-x-auto">
          <div className="flex min-w-max items-center gap-8 text-[14px] md:text-[20px] text-[#fff2e8] font-odesa-medium">
            {localTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className="whitespace-nowrap opacity-85 transition-opacity hover:opacity-100"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section ref={setSectionRef("main")} id="main" className="scroll-mt-24 bg-[#9f1f47] px-4 py-14 text-[#fff2e8] md:scroll-mt-28 md:px-10">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.8fr]">
          <div>
            <h2 className="text-[42px] md:text-[58px] leading-none font-odesa-medium">Найголовніше</h2>
            <p className="mt-5 text-[20px] md:text-[30px] leading-[1.22]">
              У Білгороді-Дністровському ви зможете доторкнутися до історії Аккерманської фортеці, прогулятися старими вулицями
              міста та відчути атмосферу Дністровського лиману.
            </p>
          </div>
          <aside className="h-fit rounded-[24px] bg-[#5f2238]/90 p-5 md:p-6">
            <h3 className="text-[22px] leading-none font-odesa-medium">Погода сьогодні</h3>
            <div className="mt-4 flex items-center gap-3">
              <CloudSun className="h-12 w-12" />
              <div>
                <div className="text-[44px] leading-none font-odesa-medium">22°</div>
                <div className="text-[18px] leading-none text-[#fff2e8]/88">частково хмарно</div>
              </div>
            </div>
            <button type="button" className="mt-5 inline-flex items-center gap-2 text-[18px] text-[#ffd3df] font-odesa-medium">
              Прогноз погоди <ArrowUpRight className="h-4 w-4" />
            </button>
          </aside>
        </div>
      </section>

      <section ref={setSectionRef("media")} id="media" className="scroll-mt-24 bg-[#002f5e] px-4 py-14 text-[#fff2e8] md:scroll-mt-28 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="text-[42px] md:text-[58px] leading-none font-odesa-medium">Фото та відео</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {brightMoments.map((item) => (
              <article key={item.title} className="relative h-[260px] overflow-hidden rounded-[26px] md:h-[360px]">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <h3 className="absolute bottom-16 left-6 right-6 text-[28px] md:text-[42px] leading-[0.95] font-odesa-medium">{item.title}</h3>
                <p className="absolute bottom-6 left-6 right-6 text-[16px] md:text-[24px] text-[#fff2e8]/90">{item.subtitle}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ref={setSectionRef("events")} id="events" className="scroll-mt-24 bg-[#df9b3b] px-4 py-14 text-[#2a0015] md:scroll-mt-28 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-end justify-between gap-5">
            <h2 className="text-[42px] md:text-[58px] leading-none font-odesa-medium">Події</h2>
            <button className="inline-flex items-center gap-2 text-[18px] md:text-[24px] text-[#5f2238]">Показати всі <ArrowRight className="h-5 w-5" /></button>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {events.map((event) => (
              <article key={event.title}>
                <div className="h-[230px] overflow-hidden rounded-[24px]">
                  <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
                </div>
                <h3 className="mt-4 text-[30px] md:text-[40px] leading-[1.02] font-odesa-medium">{event.title}</h3>
                <p className="mt-2 text-[18px] md:text-[24px] text-[#2a0015]/80">{event.date}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ref={setSectionRef("recommended")} id="recommended" className="scroll-mt-24 bg-[#9f1f47] px-4 py-14 text-[#fff2e8] md:scroll-mt-28 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="text-[42px] md:text-[58px] leading-none font-odesa-medium">Рекомендуємо</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {recommended.map((item) => (
              <article key={item.title} className="overflow-hidden rounded-[20px] bg-[#5f2238]/90">
                <div className="h-[190px]">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-5 md:p-6">
                  <h3 className="text-[26px] md:text-[34px] leading-[1.05] font-odesa-medium">{item.title}</h3>
                  <p className="mt-2 text-[16px] md:text-[21px] text-[#fff2e8]/85">{item.subtitle}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ref={setSectionRef("hotels")} id="hotels" className="scroll-mt-24 bg-[#002f5e] px-4 py-14 text-[#fff2e8] md:scroll-mt-28 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="text-[42px] md:text-[58px] leading-none font-odesa-medium">Готелі</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {hotels.map((hotel) => (
              <article key={hotel.title} className="overflow-hidden rounded-[20px] bg-[#0e467f]">
                <div className="h-[210px]">
                  <img src={hotel.image} alt={hotel.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-5 md:p-6">
                  <h3 className="text-[28px] md:text-[36px] leading-[1.05] font-odesa-medium">{hotel.title}</h3>
                  <p className="mt-2 text-[16px] md:text-[21px] text-[#fff2e8]/85">{hotel.subtitle}</p>
                  <p className="mt-3 inline-flex items-center rounded-md bg-[#002f5e] px-3 py-1 text-[15px] md:text-[18px]">
                    {hotel.rating} Відмінно
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ref={setSectionRef("offers")} id="offers" className="scroll-mt-24 bg-[#df9b3b] px-4 py-14 text-[#2a0015] md:scroll-mt-28 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="text-[42px] md:text-[58px] leading-none font-odesa-medium">Актуальні пропозиції</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {offers.map((offer) => (
              <article key={offer.title} className="overflow-hidden rounded-[20px] bg-[#f0bf74]">
                <div className="h-[190px]">
                  <img src={offer.image} alt={offer.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-5 md:p-6">
                  <h3 className="text-[24px] md:text-[32px] leading-[1.1] font-odesa-medium">{offer.title}</h3>
                  <p className="mt-2 text-[18px] md:text-[24px]">{offer.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ref={setSectionRef("restaurants")} id="restaurants" className="scroll-mt-24 bg-[#9f1f47] px-4 py-14 text-[#fff2e8] md:scroll-mt-28 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="text-[42px] md:text-[58px] leading-none font-odesa-medium">Ресторани</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {restaurants.map((r) => (
              <article key={r.title} className="overflow-hidden rounded-[20px] bg-[#5f2238]/90">
                <div className="h-[200px]">
                  <img src={r.image} alt={r.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-5 md:p-6">
                  <h3 className="inline-flex items-center gap-2 text-[26px] md:text-[34px] leading-none font-odesa-medium">
                    <Utensils className="h-6 w-6" /> {r.title}
                  </h3>
                  <p className="mt-2 text-[16px] md:text-[21px] text-[#fff2e8]/85">{r.subtitle}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ref={setSectionRef("info")} id="info" className="scroll-mt-24 bg-[#002f5e] px-4 py-14 text-[#fff2e8] md:scroll-mt-28 md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="text-[42px] md:text-[58px] leading-none font-odesa-medium">Інформація</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {infoCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="overflow-hidden rounded-[22px] bg-[#0e467f]">
                  <div className="h-[170px]">
                    <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-5 md:p-6">
                    <Icon className="h-8 w-8" />
                    <h3 className="mt-4 text-[30px] md:text-[38px] leading-[1.02] font-odesa-medium">{card.title}</h3>
                    <ul className="mt-4 space-y-2 text-[18px] md:text-[24px] text-[#fff2e8]/88">
                      {card.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="relative z-10 bg-[#fff2e8] px-4 py-20 text-[#002f5e] md:px-10">
        <div className="mx-auto grid max-w-[1400px] gap-10 border-t border-[#002f5e]/20 pt-14 md:grid-cols-[1.1fr_1.1fr_1fr_1.1fr_0.9fr]">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[34px] leading-none font-odesa-medium">{col.title}</h4>
              <nav className="mt-6 space-y-4">
                {col.links.map((link) => (
                  <a key={link} href="#" className="block text-[22px] leading-none text-[#002f5e]/82 transition-colors hover:text-[#002f5e] font-odesa-regular">
                    {link}
                  </a>
                ))}
              </nav>
            </div>
          ))}

          <div>
            <h4 className="text-[34px] leading-none text-[#002f5e]/70 font-odesa-medium">Зв'язок</h4>
            <div className="mt-7 grid grid-cols-3 gap-4">
              {[Youtube, Instagram, Facebook, Linkedin, Twitter, Send].map((Icon, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-[#002f5e]/30 text-[#002f5e] transition-colors hover:bg-[#002f5e] hover:text-[#fff2e8]"
                  aria-label="Соціальна мережа"
                >
                  <Icon className="h-6 w-6" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BilhorodDnistrovskyi;
