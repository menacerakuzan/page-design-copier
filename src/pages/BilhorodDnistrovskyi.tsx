import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, CloudSun } from "lucide-react";

const localTabs = [
  "Найголовніше",
  "Фото та відео",
  "Події",
  "Рекомендуємо",
  "Готелі",
  "Актуальні пропозиції",
  "Ресторани",
  "Інформація",
];

const BilhorodDnistrovskyi = () => {
  return (
    <div>
      <section className="relative min-h-screen overflow-hidden text-[#fff2e8]">
        <img
          src="https://tripmydream.cc/travelhub/travel/block_gallery/10/6474/default_106474.jpg?"
          alt="Білгород-Дністровський"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,47,94,0.18),rgba(0,16,34,0.56))]" />

        <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 py-8 md:px-14 md:py-10">
          <div className="flex items-start justify-between">
            <Link
              to="/"
              className="rounded-full border border-[#fff2e8]/55 bg-black/20 px-5 py-2 text-[14px] leading-none tracking-[0.04em] transition-colors hover:bg-black/35 font-odesa-medium"
            >
              ← Назад до Одещини
            </Link>
          </div>

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

      <section className="bg-[#9f1f47] px-4 pb-16 pt-6 text-[#fff2e8] md:px-10 md:pb-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="overflow-x-auto rounded-[16px] bg-[#5f2238]/90 px-4 py-3 md:px-5 md:py-4">
            <div className="flex min-w-max items-center gap-8 text-[14px] md:text-[20px] font-odesa-medium">
              {localTabs.map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={`whitespace-nowrap transition-opacity ${index === 0 ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-7 lg:grid-cols-[1.3fr_0.8fr] lg:gap-10">
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65 }}
              className="text-[24px] leading-[1.15] md:text-[38px] font-odesa-medium"
            >
              У Білгороді-Дністровському ви зможете доторкнутися до багатовікової історії Аккерманської фортеці,
              прогулятися старими вулицями міста та відчути атмосферу Дністровського лиману. Тут на вас чекає унікальне
              поєднання морського простору, архітектурної спадщини та південного колориту.
            </motion.p>

            <motion.aside
              initial={{ opacity: 0, x: 18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.06 }}
              className="h-fit rounded-[20px] bg-[#6c2d44]/92 p-5 md:p-6"
            >
              <h3 className="text-[22px] leading-none font-odesa-medium">Погода сьогодні</h3>
              <div className="mt-4 flex items-center gap-3">
                <CloudSun className="h-12 w-12" />
                <div>
                  <div className="text-[44px] leading-none font-odesa-medium">22°</div>
                  <div className="text-[18px] leading-none text-[#fff2e8]/88 font-odesa-regular">частково хмарно</div>
                </div>
              </div>
              <button type="button" className="mt-5 inline-flex items-center gap-2 text-[18px] text-[#ffd3df] font-odesa-medium">
                Прогноз погоди <ArrowUpRight className="h-4 w-4" />
              </button>
            </motion.aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BilhorodDnistrovskyi;
