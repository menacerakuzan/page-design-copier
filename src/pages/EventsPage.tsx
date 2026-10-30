import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Archive, CalendarDays } from "lucide-react";
import { useLang } from "@/lib/langContext";
import PageBrow from "@/components/PageBrow";
import SiteFooter from "@/components/SiteFooter";
import { ObjectCard } from "@/components/ObjectCard";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useSeo } from "@/hooks/useSeo";
import { isEventArchived, kyivToday } from "@/lib/eventArchive";

/**
 * Усі опубліковані події регіону — призначення кнопки "Показати все" в
 * секції "Події" на головній (раніше не мала onClick і нікуди не вела).
 * `/podiyi?arkhiv` — архів: події, чия дата вже минула (src/lib/eventArchive.ts).
 */
export default function EventsPage() {
  const { t, lang } = useLang();
  const { data: snapshot, isLoading } = useHierarchySnapshot();
  const [params] = useSearchParams();
  const showArchive = params.has("arkhiv");

  useSeo({
    title: t("events"),
    description: lang === "en"
      ? "All upcoming events in Odesa region — festivals, concerts, exhibitions."
      : "Усі події Одеської області — фестивалі, концерти, виставки.",
    lang,
  });

  const { upcoming, archived } = useMemo(() => {
    const today = kyivToday();
    const all = (snapshot?.objects ?? []).filter((o) => o.type === "event" && o.published);
    return {
      upcoming: all.filter((o) => !isEventArchived(o, today)),
      // Свіжіші архівні — першими.
      archived: all.filter((o) => isEventArchived(o, today)).reverse(),
    };
  }, [snapshot]);
  const events = showArchive ? archived : upcoming;
  const tabs = [
    { key: "upcoming", to: "/podiyi", label: lang === "en" ? "Upcoming" : "Актуальні", count: upcoming.length, active: !showArchive },
    { key: "archive", to: "/podiyi?arkhiv", label: lang === "en" ? "Archive" : "Архів", count: archived.length, active: showArchive },
  ];

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
          <h1 className="text-[34px] leading-[0.95] text-[#002f5e] font-odesa-bold md:text-[46px]">
            {showArchive ? (lang === "en" ? "Events archive" : "Архів подій") : t("events")}
          </h1>
        </div>
        <p className="mt-3 max-w-[520px] text-[15px] leading-[1.5] text-[#002f5e]/70 font-odesa-regular md:max-w-[640px] md:text-[16px]">
          {lang === "en"
            ? "Festivals, concerts and exhibitions across Odesa region"
            : "Фестивалі, концерти та виставки по всій Одещині"}
        </p>
        <nav aria-label={lang === "en" ? "Events filter" : "Фільтр подій"} className="mt-5 inline-flex rounded-full border border-[#002f5e]/15 bg-white/70 p-1">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              to={tab.to}
              aria-current={tab.active ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-odesa-medium transition-colors ${
                tab.active ? "bg-[#002f5e] text-[#fff2e8]" : "text-[#002f5e] hover:bg-[#002f5e]/5"
              }`}
            >
              {tab.key === "archive" && <Archive className="h-4 w-4" aria-hidden />}
              {tab.label}
              <span className={`rounded-full px-2 text-[12px] ${tab.active ? "bg-[#fff2e8]/20" : "bg-[#002f5e]/10"}`}>{tab.count}</span>
            </Link>
          ))}
        </nav>
      </div>

      <main id="main-content" tabIndex={-1} className="container-edge relative z-10 pb-tabbar md:pb-16">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#002f5e]/15 border-t-[#002f5e]" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[26px] border border-dashed border-[#002f5e]/20 py-24">
            <p className="text-[16px] text-[#002f5e]/70 font-odesa-regular">
              {showArchive
                ? (lang === "en" ? "The archive is empty" : "Архів поки порожній")
                : (lang === "en" ? "No upcoming events yet" : "Актуальних подій поки немає")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {events.map((obj, idx) => (
              <div key={obj.id} className={showArchive ? "opacity-80 grayscale-[35%] transition hover:opacity-100 hover:grayscale-0" : undefined}>
                <ObjectCard obj={obj} idx={idx} lang={lang} />
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
