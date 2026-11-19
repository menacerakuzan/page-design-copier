import "@/v2/v2.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Archive, ChevronDown } from "lucide-react";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { Footer } from "@/v2/components/Footer";
import { Reveal } from "@/v2/components/ui";
import { plural } from "@/v2/districts/parts";
import { useAfishaPage, type AfishaPageData } from "./useAfishaPage";
import { DateStrip, EventTicket, ShowTicket, TheatreBackdrop, useDates } from "./parts";

/** Скільки квитків видно спершу (далі — «Показати ще»). */
const STEP = 16;
/** Сітка вертикальних квитків: 2 в ряд на телефоні, 3 — на планшеті, 4 — на ПК. */
const TICKETS = "grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-6";

/**
 * Нова сторінка «Афіша» (/podiyi): розклад вистав на ~2 місяці у вигляді
 * квитків, згрупованих за днями. Фільтр — стрічка днів-«календариків»; події без розкладу (фестивалі) — окремо; архів — ?arkhiv.
 *
 */
export default function AfishaPage() {
  const { t, lang } = useV2();
  const data = useAfishaPage();
  useSeo({ title: `${t("afPageTitle1")} ${t("afPageTitle2")}`, description: t("afPageLead"), lang });

  return (
    <div className="v2 min-h-screen">
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="relative isolate outline-none">
        <TheatreBackdrop />
        {/* relative — щоб вміст лежав над фоном */}
        <div className="relative mx-auto max-w-[1280px] px-5 pb-16 pt-4 sm:px-10 sm:pb-24 sm:pt-6">
          <Head data={data} />
          {data.loading ? (
            <div className="flex justify-center py-32">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-o-sea/20 border-t-o-sea" />
            </div>
          ) : data.archiveOn ? (
            <ArchiveList data={data} />
          ) : (
            <Schedule data={data} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

/** Заголовок і перемикач «Найближчі / Архів». */
function Head({ data }: { data: AfishaPageData }) {
  const { t } = useV2();
  const tab = (on: boolean) => `inline-flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors ${on ? "bg-o-sea text-o-sand" : "text-o-sea/70 hover:text-o-sea"}`;
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <Reveal className="max-w-[720px]">
        <p className="mb-3 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
          <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
          {t("afPageKicker")}
        </p>
        <h1 className="text-[40px] font-bold leading-[1] tracking-[-0.025em] sm:text-[56px] lg:text-[64px]">
          {t("afPageTitle1")} <span className="ital text-o-wine">{t("afPageTitle2")}</span>
        </h1>
        <p className="mt-4 max-w-[600px] text-[15.5px] leading-relaxed text-o-sea/70 sm:text-[16.5px]">{t("afPageLead")}</p>
      </Reveal>
      <Reveal delay={0.1} y={16} className="self-start lg:self-end">
      <nav aria-label={t("afPageKicker")} className="inline-flex rounded-full bg-o-sea/[0.05] p-1">
        <Link to="/podiyi" className={tab(!data.archiveOn)} aria-current={!data.archiveOn ? "page" : undefined}>
          {t("afUpcoming")}
          <span className="text-[12px] opacity-60">{data.shows.length}</span>
        </Link>
        <Link to="/podiyi?arkhiv" className={tab(data.archiveOn)} aria-current={data.archiveOn ? "page" : undefined}>
          <Archive className="h-4 w-4" aria-hidden="true" />
          {t("afArchive")}
        </Link>
      </nav>
      </Reveal>
    </div>
  );
}

/** Розклад: фільтри, квитки за днями, фестивалі. */
function Schedule({ data }: { data: AfishaPageData }) {
  const { t } = useV2();
  const reduce = useReducedMotion();
  const d = useDates(data.today);
  const [limit, setLimit] = useState(STEP);
  const key = `${data.date}-${data.city}`;

  if (!data.shows.length && !data.other.length) return <p className="py-24 text-center text-[16px] text-o-sea/60">{t("afNone")}</p>;

  // Обрізаємо список за кількістю квитків, але не посеред дня
  let left = limit;
  const groups = data.groups.flatMap((g) => {
    if (left <= 0) return [];
    left -= g.shows.length;
    return [g];
  });
  const rest = data.total - groups.reduce((n, g) => n + g.shows.length, 0);

  return (
    <>
      {data.shows.length > 0 && (
        <Reveal delay={0.15} y={16} className="mt-10 grid gap-4 sm:mt-12">
          <DateStrip data={data} />
          {data.cities.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {[null, ...data.cities].map((c) => (
                <button
                  key={c ?? "all"}
                  type="button"
                  onClick={() => data.set({ city: c })}
                  aria-pressed={data.city === c}
                  className={`h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${data.city === c ? "bg-o-wine text-o-sand" : "bg-o-sea/[0.05] text-o-sea/75 hover:text-o-sea"}`}
                >
                  {c ?? t("allTags")}
                </button>
              ))}
            </div>
          )}
        </Reveal>
      )}

      <motion.div key={key} initial={reduce ? false : { opacity: 0.3 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
        {data.shows.length > 0 && groups.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-[16px] text-o-sea/60">{t("afNothing")}</p>
            <button type="button" onClick={() => data.set({ date: null, city: null })} className="mt-5 rounded-full border border-o-sea/20 px-5 py-2 text-[14px] font-semibold transition-colors hover:border-o-wine hover:text-o-wine">
              {t("afReset")}
            </button>
          </div>
        )}

        {groups.map((g) => (
          <section key={g.iso} aria-labelledby={`d-${g.iso}`} className="mt-12 sm:mt-14">
            {/* День: «Сьогодні» великим, поруч — день тижня, дата й кількість */}
            <h2 id={`d-${g.iso}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[26px] font-bold capitalize leading-none tracking-[-0.015em] sm:text-[32px]">{d.rel(g.iso) || d.weekdayLong(g.iso)}</span>
              <span className="text-[15px] font-semibold text-o-sea/50">
                {d.rel(g.iso) ? `${d.weekdayLong(g.iso)}, ` : ""}
                {d.long(g.iso)} · {g.shows.length} {plural(g.shows.length, t("showForms"))}
              </span>
            </h2>
            <ul className={`mt-5 grid ${TICKETS}`}>
              {g.shows.map((s, i) => (
                <Reveal as="li" key={s.key} delay={(i % 4) * 0.05} y={14}>
                  <ShowTicket s={s} today={data.today} />
                </Reveal>
              ))}
            </ul>
          </section>
        ))}

        {rest > 0 && (
          <div className="mt-12 flex justify-center">
            <button type="button" onClick={() => setLimit((n) => n + STEP)} className="inline-flex items-center gap-1.5 rounded-full border border-o-sea/20 px-6 py-2.5 text-[14px] font-semibold transition-colors hover:border-o-wine hover:text-o-wine">
              {t("showMore")} <span className="opacity-60">+{rest}</span>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Події без розкладу */}
      {data.other.length > 0 && !data.date && (
        <section aria-labelledby="other" className="mt-16 sm:mt-20">
          <h2 id="other" className="text-[26px] font-bold leading-none tracking-[-0.015em] sm:text-[32px]">{t("afOther")}</h2>
          <ul className={`mt-5 grid ${TICKETS}`}>
            {data.other.map((e) => (
              <li key={e.o.id}>
                <EventTicket e={e} today={data.today} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** Архів: події, чиї дати минули (по одній на заклад). */
function ArchiveList({ data }: { data: AfishaPageData }) {
  const { t } = useV2();
  if (!data.archive.length) return <p className="py-24 text-center text-[16px] text-o-sea/60">{t("afArchiveEmpty")}</p>;
  return (
    <ul className={`mt-10 grid sm:mt-12 ${TICKETS}`}>
      {data.archive.map((e) => (
        <li key={e.o.id}>
          <EventTicket e={e} today={data.today} muted />
        </li>
      ))}
    </ul>
  );
}
