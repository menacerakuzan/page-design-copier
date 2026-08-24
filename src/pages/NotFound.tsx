import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Compass } from "lucide-react";

// Реальне фото Одеського оперного театру з нашого ж сховища — той самий
// об'єкт, що показаний на сайті (не стокове фото, не сторонній хостинг).
const BG_IMAGE = "https://tourism.od.gov.ua/storage/v1/object/public/media/1780563539795-5vje553e9qv.jpg";

const NotFound = () => {
  // 404 — службова сторінка, їй нема чого робити в індексі пошуковика.
  useEffect(() => {
    let el = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "robots");
      document.head.appendChild(el);
    }
    el.setAttribute("content", "noindex, follow");
    return () => el?.remove();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#001a3d] px-6 text-center text-[#fff2e8]">
      {/* Фон: фото оперного театру, притемнене й розмите з країв, щоб цифри читались */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 30%, rgba(0,26,61,0.55) 0%, rgba(0,26,61,0.88) 65%, rgba(0,26,61,0.97) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center justify-center gap-1 sm:gap-3">
          {["4", "0", "4"].map((d, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: -140, rotate: i % 2 === 0 ? -18 : 18 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.15 + i * 0.12, type: "spring", stiffness: 260, damping: 14 }}
              className="inline-block"
            >
              {/* Окремий шар для неперервного руху — своя transform-ланка,
                  щоб не конфліктувати з transform від framer-motion вище.
                  Дві "4" гойдаються по черзі як руки в жесті "6-7" (по 350мс
                  зсув фази одна відносно одної), "0" просто тихо плаває. */}
              <span
                className={`inline-block text-[110px] leading-none sm:text-[160px] md:text-[220px] font-odesa-bold ${
                  d === "4" ? "animate-six-seven" : "animate-float-y"
                }`}
                style={{
                  animationDelay: d === "4" ? (i === 0 ? "1s" : "1.35s") : "1s",
                  textShadow: "0 18px 60px rgba(0,0,0,0.45)",
                }}
              >
                {d}
              </span>
            </motion.span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-4 flex items-center gap-2 text-[18px] sm:text-[22px] font-odesa-medium text-[#fff2e8]/90"
        >
          <Compass className="h-5 w-5 shrink-0 text-[#df9b3b]" strokeWidth={2.2} />
          Такої сторінки на Одещині ще не наносили на карту
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="mt-2 max-w-md text-[14px] sm:text-[16px] text-[#fff2e8]/55 font-odesa-regular"
        >
          Перевірте адресу або поверніться на головну — звідти легко знайти райони, маршрути й цікаві місця області.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/"
            className="group flex items-center gap-2 rounded-full bg-[#9f1f47] px-8 py-3 text-[16px] leading-none text-[#fff2e8] transition-colors hover:bg-[#ba2c5a] font-odesa-medium"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            На головну
          </Link>
          <Link
            to="/districts"
            className="rounded-full border border-[#fff2e8]/25 px-8 py-3 text-[16px] leading-none text-[#fff2e8]/85 transition-colors hover:border-[#fff2e8]/50 hover:text-[#fff2e8] font-odesa-medium"
          >
            До районів
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
