import { useEffect, useMemo, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, CloudSun, Utensils } from "lucide-react";
import BackButton from "@/components/BackButton";
import SiteFooter from "@/components/SiteFooter";
import { fallbackContentCards } from "@/data/contentCardsFallback";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import NotFound from "@/pages/NotFound";

const localTabs = [
  { id: "media", label: "Що відвідати" },
  { id: "hotels", label: "Готелі" },
  { id: "restaurants", label: "Ресторани" },
  { id: "info", label: "Інформація" },
];

const CityPage = () => {
  const { citySlug = "" } = useParams();
  const { data: snapshot } = useHierarchySnapshot();
  const city = snapshot?.cities.find((item) => item.slug === citySlug);
  const pageKey = `city-${citySlug}`;
  const { data: cityCardsData } = usePageContentCards(pageKey);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [citySlug]);

  const cards = useMemo(() => {
    const live = (cityCardsData ?? []).filter((card) => card.pageKey === pageKey);
    if (live.length) return live;
    return fallbackContentCards.filter((card) => card.pageKey === pageKey && card.published);
  }, [cityCardsData, pageKey]);

  if (!city) return <NotFound />;

  const district = snapshot?.districts.find((item) => item.id === city.districtId);
  const mainText = String(cards.find((item) => item.sectionKey === "main")?.payload?.text ?? "");
  const media = cards.filter((item) => item.sectionKey === "media").sort((a, b) => a.sortOrder - b.sortOrder);
  const hotels = cards.filter((item) => item.sectionKey === "hotels").sort((a, b) => a.sortOrder - b.sortOrder);
  const restaurants = cards.filter((item) => item.sectionKey === "restaurants").sort((a, b) => a.sortOrder - b.sortOrder);
  const info = cards.filter((item) => item.sectionKey === "info").sort((a, b) => a.sortOrder - b.sortOrder);

  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };
  const handleTabClick = (id: string) => sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div>
      <section className="relative min-h-screen overflow-hidden text-[#fff2e8]">
        <img
          src="https://tripmydream.cc/travelhub/travel/block_gallery/10/6474/default_106474.jpg?auto=format&fit=crop&w=1800&q=80"
          alt={city.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,47,94,0.18),rgba(0,16,34,0.56))]" />
        <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 py-8 md:px-14 md:py-10">
          <BackButton to="/" invert={false} />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-14 text-center">
            <h1 className="font-odesa-medium text-[68px] leading-[0.95] md:text-[120px]">{city.name}</h1>
          </motion.div>
          <div className="font-odesa-regular text-[18px] leading-none md:text-[28px]">
            <span className="font-odesa-medium">Куди поїхати</span>
            <span className="mx-2 opacity-80">/</span>
            <span className="opacity-90">Район</span>
            <span className="mx-2 opacity-80">/</span>
            <span className="opacity-90">{district?.name ?? city.name}</span>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-40 bg-[#5f2238]/90 px-4 py-3 backdrop-blur md:px-10">
        <div className="mx-auto max-w-[1400px] overflow-x-auto">
          <div className="flex min-w-max items-center gap-8 font-odesa-medium text-[14px] text-[#fff2e8] md:text-[20px]">
            {localTabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => handleTabClick(tab.id)} className="whitespace-nowrap opacity-85 hover:opacity-100">
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-24 bg-[#9f1f47] px-4 py-14 text-[#fff2e8] md:px-10">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.8fr]">
          <p className="mt-5 text-[20px] leading-[1.22] md:text-[30px]">
            {mainText || `${city.name} — новий районний напрямок, створений з адмінки.`}
          </p>
          <aside className="h-fit rounded-[24px] bg-[#5f2238]/90 p-5 md:p-6">
            <h3 className="font-odesa-medium text-[22px] leading-none">Погода сьогодні</h3>
            <div className="mt-4 flex items-center gap-3">
              <CloudSun className="h-12 w-12" />
              <div>
                <div className="font-odesa-medium text-[44px] leading-none">22°</div>
                <div className="text-[18px] leading-none text-[#fff2e8]/88">частково хмарно</div>
              </div>
            </div>
            <button type="button" className="mt-5 inline-flex items-center gap-2 font-odesa-medium text-[18px] text-[#ffd3df]">
              Прогноз погоди <ArrowUpRight className="h-4 w-4" />
            </button>
          </aside>
        </div>
      </section>

      <section ref={setSectionRef("media")} className="scroll-mt-24 bg-[#002f5e] px-4 py-14 text-[#fff2e8] md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-end justify-between gap-5">
            <h2 className="font-odesa-medium text-[42px] leading-none md:text-[58px]">Що відвідати</h2>
            <button className="inline-flex items-center gap-2 text-[18px] text-[#fff2e8] md:text-[24px]">Показати всі <ArrowRight className="h-5 w-5" /></button>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {media.map((item) => (
              <article key={item.id} className="relative h-[260px] overflow-hidden rounded-[26px] md:h-[360px]">
                <img src={item.imageUrl ?? ""} alt={item.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <h3 className="absolute bottom-16 left-6 right-6 font-odesa-medium text-[28px] leading-[0.95] md:text-[42px]">{item.title}</h3>
                <p className="absolute bottom-6 left-6 right-6 text-[16px] text-[#fff2e8]/90 md:text-[24px]">{item.subtitle}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section ref={setSectionRef("hotels")} className="scroll-mt-24 bg-[#002f5e] px-4 py-14 text-[#fff2e8] md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="font-odesa-medium text-[42px] leading-none md:text-[58px]">Готелі</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {hotels.map((hotel) => (
              <Link key={hotel.id} to={hotel.href ?? "#"} className="group block transition-transform duration-300 hover:-translate-y-1">
                <article className="overflow-hidden rounded-[20px] bg-[#0e467f]">
                  <div className="h-[210px]">
                    <img src={hotel.imageUrl ?? ""} alt={hotel.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5 md:p-6">
                    <h3 className="font-odesa-medium text-[28px] leading-[1.05] md:text-[36px]">{hotel.title}</h3>
                    <p className="mt-2 text-[16px] text-[#fff2e8]/85 md:text-[21px]">{hotel.subtitle}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section ref={setSectionRef("restaurants")} className="scroll-mt-24 bg-[#9f1f47] px-4 py-14 text-[#fff2e8] md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="font-odesa-medium text-[42px] leading-none md:text-[58px]">Ресторани</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((r) => (
              <Link key={r.id} to={r.href ?? "#"} className="group block transition-transform duration-300 hover:-translate-y-1">
                <article className="overflow-hidden rounded-[20px] bg-[#5f2238]/90">
                  <div className="h-[230px]">
                    <img src={r.imageUrl ?? ""} alt={r.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5 md:p-6">
                    <h3 className="inline-flex items-center gap-2 font-odesa-medium text-[26px] leading-none md:text-[34px]">
                      <Utensils className="h-6 w-6" /> {r.title}
                    </h3>
                    <p className="mt-2 text-[16px] text-[#fff2e8]/85 md:text-[21px]">{r.subtitle}</p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section ref={setSectionRef("info")} className="scroll-mt-24 bg-[#002f5e] px-4 py-14 text-[#fff2e8] md:px-10">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="font-odesa-medium text-[42px] leading-none md:text-[58px]">Інформація</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {info.map((item) => (
              <article key={item.id} className="rounded-[22px] bg-[#0e467f] p-6">
                <h3 className="font-odesa-medium text-[30px] leading-[1.05] md:text-[36px]">{item.title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default CityPage;

