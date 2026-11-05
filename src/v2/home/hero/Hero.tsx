import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroVideo from "@/assets/episode-01.mp4";
import heroPoster from "@/assets/episode-01-poster.jpg";
import geminiLogo from "@/assets/gemini-svg-2.svg";
import { useV2 } from "@/v2/i18n";
import { Brow, PlayToggle, SOCIALS, useVideoToggle } from "./shared";
import { ExpandSearch, MusicButton } from "./HeroControls";

/** Кольорокорекція відео: трохи більше кольору й контрасту, легке тепло. */
const GRADE = "saturate(1.22) contrast(1.06) brightness(1.04) sepia(0.08)";

/** Чи екран ширший за телефон (md, 768px) — щоб кнопку музики малювати в одному місці. */
function useIsDesktop() {
  const q = "(min-width: 768px)";
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setOn(m.matches);
    f();
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return on;
}

/** Instagram і TikTok — у пісочній «пігулці». */
function Socials() {
  return (
    <>
      {SOCIALS.slice(0, 2).map(({ label, href, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="transition-opacity hover:opacity-80">
          <Icon className="h-5 w-5" />
        </a>
      ))}
    </>
  );
}

/**
 * Перший екран зі старої головної. ПК — як було; телефон: герб посередині між
 * шапкою й заголовком, заголовок і кнопка «Маршрути» над посиланнями внизу,
 * під ними один рядок: музика · соцмережі · пауза відео.
 */
export function Hero() {
  const { t, lang } = useV2();
  const video = useVideoToggle();
  const desktop = useIsDesktop();
  const cards = [
    { label: lang === "en" ? "Tourism types" : "Види туризму", href: "/types" },
    { label: lang === "en" ? "Information" : "Інформація", href: "/info" },
  ];

  return (
    <section id="v2-hero" aria-labelledby="hero-title" className="relative flex min-h-svh flex-col overflow-hidden text-o-sand">
      <video
        ref={video.ref}
        src={heroVideo}
        poster={heroPoster}
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-700"
        style={{ filter: GRADE }}
      />
      {/* Затемнення легше, ніж на старому сайті (21–60% замість 28–82%),
          щоб відео лишалося живим; читабельність тексту — м'якою тінню. */}
      <div className="absolute inset-0 hidden bg-[linear-gradient(180deg,rgba(0,12,33,0.21),rgba(0,12,33,0.6))] md:block" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,12,33,0.37),rgba(0,12,33,0.6))] md:hidden" />

      <Brow />

      <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 flex-col items-center px-4 pb-[calc(100px+env(safe-area-inset-bottom))] text-center md:px-6 md:pb-8">
        {/* Телефон: заголовок і кнопка стоять там же, де й були (фіксований відступ над посиланнями внизу),
            а герб — посередині вільного місця між шапкою й заголовком. */}
        <div className="flex flex-1 flex-col items-center pb-[min(104px,12svh)] md:flex-none md:pb-0">
          <div className="flex flex-1 items-center justify-center py-2 md:flex-none md:py-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
              role="img"
              aria-label={t("emblemLabel")}
              className="relative h-[min(256px,29svh,calc(100svh_-_500px))] w-[min(256px,29svh,calc(100svh_-_500px))] bg-o-sand md:h-[320px] md:w-[320px]"
              style={{
                WebkitMaskImage: `url(${geminiLogo})`, maskImage: `url(${geminiLogo})`,
                WebkitMaskPosition: "center", maskPosition: "center",
                WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
                WebkitMaskSize: "contain", maskSize: "contain",
              }}
            />
          </div>
          <motion.h1 id="hero-title" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className={`text-[34px] font-medium leading-[1.02] md:text-[68px] [text-shadow:0_2px_30px_rgba(20,8,14,0.45)]`}>
            {t("explore")} {t("exploreWhat")}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className={`mt-3 text-[16px] leading-none md:text-[22px] [text-shadow:0_1px_16px_rgba(20,8,14,0.55)]`}>
            {t("tagline")}
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.4 }} className="mt-6 md:mt-10">
            <Link to="/marshruty" className="inline-block rounded-full border border-o-sand bg-o-sand px-10 py-3.5 text-[15px] font-semibold leading-none text-[#00376c] transition-opacity hover:opacity-85 md:px-9 md:py-2 md:text-[12px]">
              {t("navRoutes")}
            </Link>
          </motion.div>
        </div>

        <div className="mt-auto w-full md:pb-0">
          <div className="relative mx-auto flex max-w-[1060px] flex-col items-center gap-3 xl:block xl:min-h-[120px]">
            {desktop && (
              <div className="inline-flex items-center gap-3 rounded-full bg-o-sand px-5 py-2.5 text-[#00376c] xl:absolute xl:bottom-0 xl:left-1/2 xl:-translate-x-1/2 xl:px-6 xl:py-3">
                <Socials />
              </div>
            )}
            {/* Підписи з лінією; на телефоні — поруч у два стовпчики */}
            <div className="grid w-full max-w-[360px] grid-cols-2 items-stretch gap-5 md:max-w-none md:gap-3 xl:absolute xl:bottom-0 xl:right-0 xl:w-auto xl:items-end xl:gap-8">
              {cards.map((c) => (
                <Link key={c.href} to={c.href} className="group py-1 text-left md:py-0">
                  <div className={`whitespace-nowrap pb-[3px] text-[17px] font-medium leading-[0.95] transition-colors duration-500 lg:pb-[5px] lg:text-[22px] group-hover:text-o-sun`}>
                    {c.label}
                  </div>
                  <div className={`relative mt-2 h-[5px] w-full overflow-hidden rounded-full lg:h-[6px] lg:rounded-none bg-o-sand/30 lg:bg-o-sand/40`}>
                    <div className={`absolute inset-y-0 left-0 w-0 transition-all duration-500 ease-in-out group-hover:w-full bg-o-sun`} />
                  </div>
                </Link>
              ))}
            </div>
            {/* Телефон: один рядок над доком — музика · соцмережі · пауза відео */}
            {!desktop && (
              <div className="mt-5 flex w-full max-w-[360px] items-center justify-between">
                <MusicButton slider={false} />
                <div className="inline-flex h-11 items-center gap-4 rounded-full bg-o-sand px-5 text-[#00376c]">
                  <Socials />
                </div>
                <PlayToggle playing={video.playing} onToggle={video.toggle} className="!h-11 !w-11 !bg-o-sand !text-o-sea !ring-0 shadow-[0_10px_24px_-8px_rgba(0,10,30,0.5)] backdrop-blur-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ліворуч знизу: музика над пошуком; праворуч — пауза відео. Нижні краї
          всіх елементів — на одній лінії (32px від низу екрана). */}
      {desktop && (
        <>
          <div className="absolute bottom-8 left-6 z-20 flex flex-col items-start gap-3">
            <MusicButton />
            <ExpandSearch />
          </div>
          <PlayToggle playing={video.playing} onToggle={video.toggle} className="absolute bottom-8 right-6 z-20 !h-11 !w-11" />
        </>
      )}
    </section>
  );
}
