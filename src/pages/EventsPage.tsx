import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { useLang } from "@/lib/langContext";
import PageBrow from "@/components/PageBrow";
import SiteFooter from "@/components/SiteFooter";
import { ObjectCard } from "@/components/ObjectCard";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useSeo } from "@/hooks/useSeo";

/**
 * Усі опубліковані події регіону — призначення кнопки "Показати все" в
 * секції "Події" на головній (раніше не мала onClick і нікуди не вела).
 */
export default function EventsPage() {
  const { t, lang } = useLang();
  const { data: snapshot, isLoading } = useHierarchySnapshot();

  useSeo({
    title: t("events"),
    description: lang === "en"
      ? "All upcoming events in Odesa region — festivals, concerts, exhibitions."
      : "Усі події Одеської області — фестивалі, концерти, виставки.",
    lang,
  });

  const events = useMemo(
    () => (snapshot?.objects ?? []).filter((o) => o.type === "event" && o.published),
    [snapshot],
  );

  return (
    <div className="relative min-h-screen bg-[#fff2e8] font-odesa-regular text-[#002f5e]">
      {/* Той самий фоновий патерн, що й на сторінках районів/гідів. absolute,
          не fixed — див. коментар у DistrictsPage про iOS overscroll. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ backgroundImage: "url(/districtspattern.svg)", backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.1 }}
      />

      <PageBrow />

      <div className="container-edge relative z-10 pb-6 pt-8 md:pb-8 md:pt-12">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#9f1f47] text-[#fff2e8] md:h-12 md:w-12">
            <CalendarDays className="h-5 w-5" />
          </span>
          <h1 className="text-[34px] leading-[0.95] text-[#002f5e] font-odesa-bold md:text-[46px]">{t("events")}</h1>
        </div>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.5] text-[#002f5e]/70 font-odesa-regular md:max-w-[640px] md:text-[16px]">
          {lang === "en"
            ? "Festivals, concerts and exhibitions across Odesa region"
            : "Фестивалі, концерти та виставки по всій Одещині"}
        </p>
      </div>

      <main id="main-content" tabIndex={-1} className="container-edge relative z-10 pb-tabbar md:pb-16">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#002f5e]/15 border-t-[#002f5e]" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[26px] border border-dashed border-[#002f5e]/20 py-24">
            <p className="text-[16px] text-[#002f5e]/70 font-odesa-regular">
              {lang === "en" ? "No events yet" : "Подій поки немає"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((obj, idx) => (
              <ObjectCard key={obj.id} obj={obj} idx={idx} lang={lang} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
