import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ArrowUpRight, Ticket } from "lucide-react";
import { Img } from "@/components/Img";
import { kyivToday } from "@/lib/eventArchive";
import { objectDetailPath } from "@/lib/entityLinks";
import { useV2 } from "@/v2/i18n";
import { Reveal } from "@/v2/components/ui";
import { upcomingShows } from "@/v2/lib/afisha";
import { plural } from "@/v2/districts/parts";
import type { TownPageData } from "./useTownPage";

/** Подія для квитка: найближча вистава закладу або сама подія з її датами. */
type Item = {
  key: string;
  title: string;
  venue?: string;
  /** Дата найближчої вистави (YYYY-MM-DD) — для «календарика» на фото. */
  iso?: string;
  time?: string;
  /** Дати текстом (для подій без репертуару). */
  dates?: string;
  /** Скільки ще вистав у цьому закладі найближчим часом. */
  more: number;
  image?: string;
  href: string;
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Події пункту. У театрів (подія з репертуаром) — по одному квитку на заклад
 * з найближчою виставою і «ще N вистав» (репертуари різних місяців того самого
 * театру зливаються). Заклади без вистав найближчим часом не показуємо.
 * Події без репертуару — квитком із датами з бази.
 */
function useTownEvents(data: TownPageData) {
  const { tl } = useV2();
  const events = data.placesByType.event;
  return useMemo<Item[]>(() => {
    if (!events?.length) return [];
    const shows = upcomingShows(events.map((p) => p.o), 45).flatMap((d) => d.shows);
    const byVenue = new Map<string, typeof shows>();
    for (const s of shows) {
      const k = norm(s.venue);
      byVenue.set(k, [...(byVenue.get(k) ?? []), s]);
    }
    const items: Item[] = [...byVenue.entries()].map(([k, list]) => ({
      key: k,
      title: list[0].title,
      venue: tl(list[0].venue, list[0].venueEn),
      iso: list[0].iso,
      time: list[0].time,
      more: list.length - 1,
      image: list[0].image,
      href: list[0].href,
    }));
    for (const p of events) {
      if (p.o.repertoire?.trim()) continue;
      items.push({
        key: p.o.id,
        title: p.name,
        venue: tl(p.o.subtitle, p.o.subtitleEn) || undefined,
        dates: p.o.eventDates || undefined,
        more: 0,
        image: p.o.imageUrl,
        href: objectDetailPath("event", p.o.slug),
      });
    }
    // Спершу ті, що з точною датою (за датою й часом), далі — решта.
    return items.sort((a, b) => (a.iso && b.iso ? `${a.iso}${a.time}`.localeCompare(`${b.iso}${b.time}`) : a.iso ? -1 : b.iso ? 1 : 0));
  }, [events, tl]);
}

/** «Сьогодні» / «Завтра» / «пт, 14 листопада» + число й місяць для «календарика». */
function useDates() {
  const { t, lang } = useV2();
  const today = kyivToday();
  const locale = lang === "en" ? "en-GB" : "uk-UA";
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...o, timeZone: "Europe/Kyiv" }).format(new Date(`${iso}T12:00:00Z`));
  const tomorrow = (() => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  return {
    label: (iso: string) => (iso === today ? t("today") : iso === tomorrow ? t("tomorrow") : fmt(iso, { weekday: "short", day: "numeric", month: "long" })),
    day: (iso: string) => fmt(iso, { day: "numeric" }),
    month: (iso: string) => fmt(iso, { month: "short" }).replace(".", ""),
  };
}

/** Рядок «коли»: «Завтра · 19:00» або дати події текстом. */
function When({ it }: { it: Item }) {
  const d = useDates();
  const text = it.iso ? [d.label(it.iso), it.time].filter(Boolean).join(" · ") : it.dates;
  if (!text) return null;
  return <p className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-o-wine">{text}</p>;
}

/** «ще 6 вистав» — маленька пігулка. */
function More({ n }: { n: number }) {
  const { t } = useV2();
  if (!n) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-o-wine/10 px-2.5 py-0.5 text-[12px] font-semibold text-o-wine">
      {t("moreShows")} {n} {plural(n, t("showForms"))}
    </span>
  );
}

/** «Календарик» на фото: число й місяць. */
function DateTab({ iso }: { iso?: string }) {
  const d = useDates();
  if (!iso) return null;
  return (
    <span className="absolute left-3 top-3 flex min-w-[52px] flex-col items-center rounded-[12px] bg-o-sand px-2 pb-1.5 pt-1 text-o-winedeep shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]">
      <span className="text-[22px] font-extrabold leading-none tabular-nums">{d.day(iso)}</span>
      <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-o-wine">{d.month(iso)}</span>
    </span>
  );
}

function Photo({ it, className }: { it: Item; className: string }) {
  return (
    <div className={`relative overflow-hidden bg-o-wine ${className}`}>
      {it.image ? (
        <Img src={it.image} w={720} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]" />
      ) : (
        <Ticket className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-o-sand/40" aria-hidden="true" />
      )}
      <DateTab iso={it.iso} />
    </div>
  );
}

/** Квиток-постер: фото згори, корінець із перфорацією знизу. */
function PosterTicket({ it, photo = "aspect-[4/5]" }: { it: Item; photo?: string }) {
  return (
    <Link to={it.href} className="group block h-full transition-transform duration-500 ease-out hover:-translate-y-1.5">
      <Photo it={it} className={`rounded-t-[18px] ${photo}`} />
      <div className="ticket-stub relative flex min-h-[132px] flex-col rounded-b-[18px] bg-o-sand px-5 pb-4 pt-4 text-o-winedeep">
        <When it={it} />
        <p className="mt-1 line-clamp-2 text-[16px] font-bold leading-snug transition-colors group-hover:text-o-wine">{it.title}</p>
        {it.venue && <p className="mt-0.5 line-clamp-1 text-[12.5px] text-o-winedeep/60">{it.venue}</p>}
        <div className="mt-auto pt-3">
          <More n={it.more} />
        </div>
      </div>
    </Link>
  );
}

/** Одна подія — широкий горизонтальний квиток (на телефоні — постер). */
function WideTicket({ it }: { it: Item }) {
  return (
    <Link to={it.href} className="group mx-auto grid max-w-[920px] transition-transform duration-500 ease-out hover:-translate-y-1 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <Photo it={it} className="aspect-[4/3] rounded-t-[20px] sm:aspect-auto sm:min-h-[300px] sm:rounded-l-[20px] sm:rounded-tr-none" />
      <div className="ticket-stub to-side relative flex flex-col justify-center rounded-b-[20px] bg-o-sand px-6 py-6 text-o-winedeep sm:rounded-r-[20px] sm:rounded-bl-none sm:px-9">
        <When it={it} />
        <p className="mt-2 text-[24px] font-bold leading-[1.1] tracking-[-0.01em] transition-colors group-hover:text-o-wine sm:text-[30px]">{it.title}</p>
        {it.venue && <p className="mt-2 text-[14.5px] text-o-winedeep/65">{it.venue}</p>}
        <div className="mt-6 flex items-center justify-between gap-3">
          <More n={it.more} />
          <span className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-o-wine text-o-sand transition-transform duration-300 group-hover:rotate-45">
            <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Багато подій — стрічка квитків, гортається вбік (на ПК — ще й стрілками). */
function Strip({ items }: { items: Item[] }) {
  const { t } = useV2();
  const ref = useRef<HTMLUListElement>(null);
  const go = (d: -1 | 1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: d * el.clientWidth * 0.8, behavior: "smooth" });
  };
  const arrow = "flex h-11 w-11 items-center justify-center rounded-full bg-o-sand/10 text-o-sand ring-1 ring-o-sand/25 transition-colors hover:bg-o-sun hover:text-o-winedeep hover:ring-o-sun";
  return (
    <>
      <div className="absolute right-0 top-0 hidden gap-2 sm:flex">
        <button type="button" onClick={() => go(-1)} className={arrow} aria-label={t("prevItems")}>
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => go(1)} className={arrow} aria-label={t("nextItems")}>
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <ul ref={ref} className="no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 sm:-mx-10 sm:scroll-px-10 sm:gap-5 sm:px-10 lg:-mx-14 lg:scroll-px-14 lg:px-14">
        {items.map((it) => (
          <li key={it.key} className="w-[72vw] max-w-[290px] shrink-0 snap-start sm:w-[270px]">
            <PosterTicket it={it} />
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * «Події» пункту — винна панель, як афіша на головній. Вигляд залежить від
 * кількості: 1 — широкий квиток; 2–3 — квитки-постери в ряд по центру;
 * 4 і більше — стрічка постерів, що гортається.
 */
export function TownEvents({ data }: { data: TownPageData }) {
  const { t } = useV2();
  const items = useTownEvents(data);
  const n = items.length;
  if (!n) return null;
  return (
    <section id="events" aria-labelledby="events-t" className="scroll-mt-24 px-3 py-8 sm:px-6 sm:py-12">
      <div className="grain relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-o-winedeep px-5 py-10 text-o-sand sm:rounded-[36px] sm:px-10 sm:py-12 lg:px-14">
        {/* М'яке світло «рампи» згори (градієнт, не blur — blur мерехтів). */}
        <div className="pointer-events-none absolute -top-48 left-1/2 h-[540px] w-[1120px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(223,155,59,0.26),rgba(223,155,59,0.08)_55%,transparent)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1280px]">
          <div className="relative">
            <Reveal>
              <p className="mb-2.5 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-sun">
                <span className="h-px w-8 bg-o-sun" aria-hidden="true" />
                {t("eventsKicker")} · {data.name}
                <Link to="/podiyi" className="-my-2 ml-auto inline-flex items-center gap-1 py-2 text-[13.5px] normal-case tracking-normal text-o-sand underline decoration-o-sun underline-offset-4 sm:hidden">
                  {t("fullAfisha")}
                  <ArrowUpRight className="h-4 w-4 text-o-sun" aria-hidden="true" />
                </Link>
              </p>
              <h2 id="events-t" className="flex items-center text-[28px] font-bold leading-[1.02] tracking-[-0.02em] sm:text-[36px] lg:text-[42px]">
                {t("eventsTitle")}
                <span className="ml-3 inline-flex items-center rounded-full bg-o-sun px-2.5 py-0.5 text-[14px] font-bold leading-[1.4] tracking-normal text-o-winedeep sm:text-[15px]">{n}</span>
                <Link
                  to="/podiyi"
                  className={`ml-auto hidden items-center gap-1 text-[14px] font-semibold tracking-normal text-o-sand underline decoration-o-sun underline-offset-4 sm:inline-flex ${n >= 4 ? "sm:mr-[116px]" : ""}`}
                >
                  {t("fullAfisha")}
                  <ArrowUpRight className="h-4 w-4 text-o-sun" aria-hidden="true" />
                </Link>
              </h2>
            </Reveal>
            {n >= 4 && <Strip items={items} />}
          </div>

          {n === 1 && (
            <Reveal className="mt-9" y={20}>
              <WideTicket it={items[0]} />
            </Reveal>
          )}
          {n > 1 && n < 4 && (
            <>
              {/* Телефон: стрічка; ширше — постери в ряд по центру */}
              <ul className="no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:justify-center sm:gap-6 sm:overflow-visible sm:px-0">
                {items.map((it, i) => (
                  <Reveal as="li" key={it.key} delay={i * 0.08} y={20} className="w-[72vw] max-w-[300px] shrink-0 snap-start sm:w-[calc((100%-48px)/3)] sm:max-w-[340px]">
                    <PosterTicket it={it} />
                  </Reveal>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/** Скільки подій покаже блок (для переходу «N подій ↓» на першому екрані). */
export function useTownEventsCount(data: TownPageData) {
  return useTownEvents(data).length;
}
