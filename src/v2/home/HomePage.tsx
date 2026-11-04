import "@/v2/v2.css";
import { useLayoutEffect } from "react";
import { useSeo } from "@/hooks/useSeo";
import { useV2 } from "@/v2/i18n";
import { Header, MobileDock } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { Hero } from "./hero/Hero";
import { Intro } from "./Intro";
import { DistrictsMap } from "./DistrictsMap";
import { MustSee } from "./MustSee";
import { Moods } from "./Moods";
import { Afisha } from "./Afisha";
import { RoutesShowcase } from "./RoutesShowcase";
import { Toolkit } from "./Toolkit";

/**
 * Нова головна (прев'ю редизайну, маршрут /v2).
 * Порядок — як історія подорожі: враження → де це → що побачити → який
 * настрій → що сьогодні ввечері → як поїхати → інструменти.
 */
export default function HomePage() {
  const { t, lang } = useV2();
  useSeo({
    title: "Одещина",
    description:
      lang === "en"
        ? "Explore Odesa Region — districts, places, routes and what's on, plus an AI travel guide."
        : "Відкрий Одещину — райони, місця, маршрути й афіша, а також AI-гід для подорожі.",
    lang,
  });

  // Колір системних панелей Safari — у тон сторінки.
  // Тло за межами сторінки (overscroll): угорі — кремове, внизу — винне,
  // як підвал, щоб при «перетягуванні» нижче підвалу не було бежевого.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const paint = () => {
      const bottom = window.scrollY > (root.scrollHeight - window.innerHeight) / 2;
      const c = bottom ? "#9f1f47" : "#fff2e8";
      if (root.style.backgroundColor !== c) {
        root.style.backgroundColor = c;
        body.style.backgroundColor = c;
      }
    };
    paint();
    window.addEventListener("scroll", paint, { passive: true });
    return () => {
      window.removeEventListener("scroll", paint);
      root.style.backgroundColor = "";
      body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div className="v2 pb-dock min-h-screen">
      <a href="#v2-main" className="sr-only z-[70] rounded-full bg-o-sun px-5 py-3 font-semibold text-o-deep focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        {t("skip")}
      </a>
      <Header revealAfterHero />
      <main id="v2-main" tabIndex={-1} className="bg-o-sand outline-none">
        <Hero />
        <Intro />
        <DistrictsMap />
        <MustSee />
        <Moods />
        <Afisha />
        <RoutesShowcase />
        <Toolkit />
      </main>
      <Footer />
      <MobileDock />
    </div>
  );
}
