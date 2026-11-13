import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BadgeCheck, ExternalLink, Globe, UserRound } from "lucide-react";
import { useLang } from "@/lib/langContext";
import SiteFooter from "@/components/SiteFooter";
import PageBrow from "@/components/PageBrow";
import { loadGuides, type Guide } from "@/lib/guidesRepository";
import { useSeo } from "@/hooks/useSeo";

const GOLD = "#df9b3b";

const GuideCard = ({ guide, idx, t }: { guide: Guide; idx: number; t: (k: import("@/lib/i18n").TranslationKey) => string }) => {
  // Уся картка — клікабельне посилання на персональну сторінку (якщо є),
  // а не тільки текстова кнопка "Персональна сторінка" всередині.
  const Container = guide.personalUrl ? "a" : "div";
  const linkProps = guide.personalUrl
    ? { href: guide.personalUrl, target: "_blank", rel: "noreferrer" }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, delay: (idx % 8) * 0.04 }}
      className="h-full"
    >
      <Container
        {...linkProps}
        className={`group flex h-full flex-col rounded-[22px] bg-white p-4 transition-all duration-300 ${
          guide.personalUrl ? "cursor-pointer hover:-translate-y-1" : ""
        }`}
        style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.05), 0 12px 32px -10px rgba(0,47,94,0.22)" }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[17px] leading-[1.15] text-[#002f5e] font-odesa-semi">
            {guide.surname} {guide.firstName}
          </p>
          {guide.dstu && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] leading-none text-[#002f5e] font-odesa-semi"
              style={{ backgroundColor: GOLD }}
              title={t("guidesDstuBadge")}
            >
              <BadgeCheck className="h-3 w-3" />
            </span>
          )}
        </div>
        {guide.cert && (
          <p className="mt-1 text-[12px] text-[#002f5e]/70 font-odesa-regular">
            {t("guidesRegistryNumber")}: {guide.cert}
          </p>
        )}
        {guide.languages.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {guide.languages.map((lang) => (
              <span
                key={lang}
                className="flex items-center gap-1 rounded-full bg-[#002f5e]/7 px-2.5 py-1 text-[11px] leading-none text-[#002f5e]/70 font-odesa-medium"
              >
                <Globe className="h-3 w-3" style={{ color: GOLD }} /> {lang}
              </span>
            ))}
          </div>
        )}
        {guide.personalUrl && (
          <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[13px] text-[#9c6200] font-odesa-medium transition-opacity group-hover:opacity-70">
            {t("guidesPersonalPage")} <ExternalLink className="h-3.5 w-3.5" />
          </span>
        )}
      </Container>
    </motion.div>
  );
};

export default function GuidesPage() {
  const { t, lang } = useLang();
  useSeo({ title: t("guidesTitle"), description: t("guidesDesc"), lang });
  const [dstuOnly, setDstuOnly] = useState(false);
  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["guides-published"],
    queryFn: () => loadGuides(true),
  });

  const shown = useMemo(() => (dstuOnly ? guides.filter((g) => g.dstu) : guides), [dstuOnly, guides]);
  const dstuCount = useMemo(() => guides.filter((g) => g.dstu).length, [guides]);

  return (
    <div className="relative min-h-screen bg-[#fff2e8] font-odesa-regular text-[#002f5e]">
      {/* Той самий фоновий патерн, що й на сторінці районів (тема мандрів).
          absolute, не fixed — див. коментар у DistrictsPage про iOS overscroll. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "url(/districtspattern.svg)", backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.1 }}
      />

      <PageBrow />

      {/* ── Заголовок сторінки ──────────────────────────────────────────── */}
      <div className="container-edge relative z-10 pb-6 pt-8 md:pb-8 md:pt-12">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#002f5e] text-[#fff2e8] md:h-12 md:w-12">
            <UserRound className="h-5 w-5" />
          </span>
          <h1 className="text-[34px] leading-[0.95] text-[#002f5e] font-odesa-bold md:text-[46px]">{t("guidesTitle")}</h1>
        </div>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.5] text-[#002f5e]/70 font-odesa-regular md:max-w-[640px] md:text-[16px]">
          {t("guidesDesc")}
        </p>
      </div>

      {/* ── Фільтр: всі / сертифіковані за ДСТУ ─────────────────────────── */}
      <div className="container-edge relative z-10 pb-6">
        <div className="flex flex-wrap gap-2 p-0.5">
          <button
            type="button"
            onClick={() => setDstuOnly(false)}
            className="shrink-0 rounded-full px-4 py-1.5 text-[13px] font-odesa-semi transition-all duration-200"
            style={{
              backgroundColor: !dstuOnly ? GOLD : "rgba(0,47,94,0.07)",
              color: !dstuOnly ? "#002f5e" : "rgba(0,47,94,0.6)",
              boxShadow: !dstuOnly ? "0 6px 14px -6px rgba(223,155,59,0.7)" : "none",
            }}
          >
            {t("viewAll")} ({guides.length})
          </button>
          <button
            type="button"
            onClick={() => setDstuOnly(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-odesa-semi transition-all duration-200"
            style={{
              backgroundColor: dstuOnly ? GOLD : "rgba(0,47,94,0.07)",
              color: dstuOnly ? "#002f5e" : "rgba(0,47,94,0.6)",
              boxShadow: dstuOnly ? "0 6px 14px -6px rgba(223,155,59,0.7)" : "none",
            }}
          >
            <BadgeCheck className="h-3.5 w-3.5" /> {t("guidesDstuFilter")} ({dstuCount})
          </button>
        </div>
      </div>

      {/* ── Сітка гідів ─────────────────────────────────────────────────── */}
      <main id="main-content" tabIndex={-1} className="container-edge relative z-10 pb-tabbar md:pb-16">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#002f5e]/15 border-t-[#002f5e]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {shown.map((guide, idx) => (
              <GuideCard key={guide.id} guide={guide} idx={idx} t={t} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
