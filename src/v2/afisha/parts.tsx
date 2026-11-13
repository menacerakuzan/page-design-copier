import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Ticket as TicketIcon } from "lucide-react";
import { Img } from "@/components/Img";
import { useV2 } from "@/v2/i18n";
import { plural } from "@/v2/districts/parts";
import type { AfishaPageData, OtherEvent, TicketShow } from "./useAfishaPage";

/* ── Дати ──────────────────────────────────────────────────────────────── */

/** Підписи дат за київським часом: «Сьогодні», «пт», «14», «лист.». */
export function useDates(today: string) {
  const { t, lang } = useV2();
  const locale = lang === "en" ? "en-GB" : "uk-UA";
  // «пʼятниця»: у шрифті сайту немає знака ʼ (U+02BC) — замінюємо на звичайний апостроф
  const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...o, timeZone: "Europe/Kyiv" }).format(new Date(`${iso}T12:00:00Z`)).replace(/ʼ/g, "’");
  const tomorrow = (() => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const rel = (iso: string) => (iso === today ? t("today") : iso === tomorrow ? t("tomorrow") : "");
  return {
    rel,
    weekday: (iso: string) => fmt(iso, { weekday: "short" }).replace(".", ""),
    weekdayLong: (iso: string) => fmt(iso, { weekday: "long" }),
    day: (iso: string) => fmt(iso, { day: "numeric" }),
    month: (iso: string) => fmt(iso, { month: "short" }).replace(".", ""),
    long: (iso: string) => fmt(iso, { day: "numeric", month: "long" }),
  };
}

/** Коротка назва сцени: без «Одеський … академічний … національний … обласний». */
export function shortVenue(name: string) {
  // \b і \w не розуміють кирилицю — тож межі слів задаємо самі (прапорець u)
  const s = name
    .replace(/(^|\s)(одеськ\p{L}*|академічн\p{L}*|національн\p{L}*|обласн\p{L}*|odesa|academic|national|regional)(?=\s|$)/giu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : name;
}

/* ── Фільтри ───────────────────────────────────────────────────────────── */

/**
 * Стрічка днів — маленькі «календарики» (день тижня, число, місяць) лише
 * для днів, де є вистави; попереду «Усі дати» і «Вихідні». Обраний — винний.
 * Гортається вбік; краї, за якими є ще дні, м'яко тануть.
 */
export function DateStrip({ data }: { data: AfishaPageData }) {
  const { t, lang } = useV2();
  const d = useDates(data.today);
  const box = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const check = () => setEdge({ start: el.scrollLeft < 6, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 6 });
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [data.dateCounts]);
  const days = [...data.dateCounts.keys()].sort();
  const mask = `linear-gradient(90deg, ${edge.start ? "#000" : "transparent"} 0, #000 40px, #000 calc(100% - 56px), ${edge.end ? "#000" : "transparent"} 100%)`;
  const pill = (on: boolean) =>
    `flex h-[72px] shrink-0 flex-col items-center justify-center rounded-[18px] px-4 text-[14px] font-semibold transition-colors ${
      on ? "bg-o-wine text-o-sand shadow-[0_12px_22px_-12px_rgba(159,31,71,0.9)]" : "bg-[#fffaf5] text-o-sea ring-1 ring-o-sea/[0.08] hover:text-o-wine hover:ring-o-wine/30"
    }`;
  return (
    <div
      ref={box}
      role="group"
      aria-label={lang === "en" ? "Date" : "Дата"}
      className="no-scrollbar -mx-5 -mb-5 flex gap-2 overflow-x-auto px-5 pb-7 pt-2 sm:-mx-3 sm:px-3"
      style={{ WebkitMaskImage: mask, maskImage: mask }}
    >
      <button type="button" onClick={() => data.set({ date: null })} aria-pressed={!data.date} className={pill(!data.date)}>
        <CalendarDays className="mb-1 h-5 w-5 opacity-80" aria-hidden="true" />
        {t("afAllDates")}
      </button>
      {data.hasWeekend && (
        <button type="button" onClick={() => data.set({ date: "weekend" })} aria-pressed={data.date === "weekend"} className={pill(data.date === "weekend")}>
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] opacity-70">{lang === "en" ? "Sat–Sun" : "сб–нд"}</span>
          {t("afWeekend")}
        </button>
      )}
      <span className="mx-1 w-px shrink-0 self-stretch bg-o-sea/10" aria-hidden="true" />
      {days.map((iso) => {
        const on = data.date === iso;
        const we = [0, 6].includes(new Date(`${iso}T12:00:00Z`).getUTCDay());
        return (
          <button
            key={iso}
            type="button"
            onClick={() => data.set({ date: on ? null : iso })}
            aria-pressed={on}
            aria-label={`${d.weekdayLong(iso)}, ${d.long(iso)}: ${data.dateCounts.get(iso)} ${plural(data.dateCounts.get(iso) ?? 0, t("showForms"))}`}
            className={`${pill(on)} relative w-[60px] px-0 ${iso === data.today && !on ? "ring-2 ring-o-wine/40" : ""}`}
          >
            <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${on ? "text-o-sunsoft" : we ? "text-o-wine" : "text-o-sea/50"}`}>{d.weekday(iso)}</span>
            <span className="text-[22px] font-extrabold leading-none tabular-nums">{d.day(iso)}</span>
            <span className={`text-[10.5px] font-semibold ${on ? "text-o-sand/70" : "text-o-sea/45"}`}>{d.month(iso)}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Квитки ────────────────────────────────────────────────────────────── */

/** Фото квитка з «календариком» (день тижня й число) у куті. */
function TicketPhoto({ image, iso, today }: { image?: string; iso?: string; today: string }) {
  const d = useDates(today);
  return (
    <div className="tk-t relative aspect-[4/3] overflow-hidden rounded-t-[18px] bg-o-wine">
      {image ? (
        <Img src={image} w={520} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]" />
      ) : (
        <TicketIcon className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-o-sand/40" aria-hidden="true" />
      )}
      {iso && (
        <span className="absolute left-3 top-3 flex min-w-[48px] flex-col items-center rounded-[12px] bg-o-sand px-2 pb-1.5 pt-1 text-o-winedeep shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)]">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-o-wine">{d.weekday(iso)}</span>
          <span className="text-[20px] font-extrabold leading-none tabular-nums">{d.day(iso)}</span>
        </span>
      )}
    </div>
  );
}

/**
 * Вертикальний квиток вистави: фото згори, лінія відриву з вирізами по
 * краях (маски .tk-t / .tk-b), нижче корінець — час великим, назва, сцена,
 * місто. Тінь — drop-shadow по формі квитка (разом із вирізами).
 * При наведенні правий верхній куток корінця м'яко загинається, як папір,
 * що починає відриватися.
 */
export function ShowTicket({ s, today }: { s: TicketShow; today: string }) {
  const start = s.time ? s.time.split("–")[0] : "";
  return (
    <Link to={s.href} className="group flex h-full flex-col transition-transform duration-500 ease-out hover:-translate-y-1 [filter:drop-shadow(0_10px_12px_rgba(0,10,30,0.11))]">
      <TicketPhoto image={s.image} iso={s.iso} today={today} />
      {/* Корінець із уголком, що при наведенні загинається (див. .tk-curl у v2.css) */}
      <div className="tk-curl relative flex flex-1 flex-col">
        <div className="tk-b flex flex-1 flex-col rounded-b-[18px] border-t-2 border-dashed border-o-wine/30 bg-[#fffaf5] px-4 pb-4 pt-3.5">
          <p className="text-[22px] font-extrabold leading-none tabular-nums text-o-wine">{start || "—"}</p>
          <h3 className="mt-2 line-clamp-2 text-[15.5px] font-bold leading-snug transition-colors group-hover:text-o-wine sm:text-[16.5px]">{s.title}</h3>
          <p className="mt-auto truncate pt-2 text-[12.5px] font-medium text-o-sea/55" title={s.venue}>
            {shortVenue(s.venue)}
            {s.city ? ` · ${s.city}` : ""}
          </p>
        </div>
        <span className="tk-flap" aria-hidden="true" />
      </div>
    </Link>
  );
}

/** Вертикальний квиток події без розкладу (фестиваль тощо): у корінці — дати текстом. */
export function EventTicket({ e, today, muted = false }: { e: OtherEvent; today: string; muted?: boolean }) {
  return (
    <Link
      to={e.href}
      className={`group flex h-full flex-col transition-transform duration-500 ease-out hover:-translate-y-1 [filter:drop-shadow(0_10px_12px_rgba(0,10,30,0.11))] ${muted ? "opacity-75 grayscale-[40%] hover:opacity-100 hover:grayscale-0" : ""}`}
    >
      <TicketPhoto image={e.o.imageUrl} today={today} />
      {/* Корінець із уголком, що при наведенні загинається (див. .tk-curl у v2.css) */}
      <div className="tk-curl relative flex flex-1 flex-col">
        <div className="tk-b flex flex-1 flex-col rounded-b-[18px] border-t-2 border-dashed border-o-wine/30 bg-[#fffaf5] px-4 pb-4 pt-3.5">
          {e.dates && (
            <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-o-wine">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="line-clamp-1">{e.dates}</span>
            </p>
          )}
          <h3 className="mt-1.5 line-clamp-2 text-[15.5px] font-bold leading-snug transition-colors group-hover:text-o-wine sm:text-[16.5px]">{e.name}</h3>
          {e.city && (
            <p className="mt-auto flex items-center gap-1 pt-2 text-[12.5px] font-medium text-o-sea/55">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {e.city}
            </p>
          )}
        </div>
        <span className="tk-flap" aria-hidden="true" />
      </div>
    </Link>
  );
}

/* ── Фон ───────────────────────────────────────────────────────────────── */

/** Фон «Афіші»: театральні значки (маски, квиток, нота, зірочка, лаштунки) — ледь помітно. */
export function TheatreBackdrop() {
  const st = `fill="none" stroke="#9f1f47" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"`;
  const icons = [
    // маска
    [70, 70, -10, `<path d="M-12 -10q12-5 24 0v9q0 12-12 15-12-3-12-15z" ${st}/><path d="M-6 -3h3M3 -3h3M-5 6q5 4 10 0" ${st}/>`],
    // квиток
    [250, 60, 8, `<path d="M-16 -9h32v6a3 3 0 0 0 0 6v6h-32v-6a3 3 0 0 0 0-6z" ${st}/><path d="M6 -9v18" stroke-dasharray="2 2" ${st}/>`],
    // нота
    [400, 120, -6, `<path d="M-2 10V-10l10-3v18" ${st}/><circle cx="-5" cy="10" r="3.5" ${st}/><circle cx="5" cy="5" r="3.5" ${st}/>`],
    // зірочка
    [160, 190, 0, `<path d="M0 -10l2.5 7.5H10l-6 4.5 2.5 7.5L0 5l-6.5 4.5L-4 2l-6-4.5h7.5z" ${st}/>`],
    // лаштунки
    [330, 260, 0, `<path d="M-16 -12h32M-14 -12q2 14-4 24M14 -12q-2 14 4 24M-14 -12q6 8 14 8t14-8" ${st}/>`],
    // маска сумна
    [70, 330, 12, `<path d="M-12 -10q12-5 24 0v9q0 12-12 15-12-3-12-15z" ${st}/><path d="M-6 -2h3M3 -2h3M-5 8q5-4 10 0" ${st}/>`],
    // скрипковий ключ (спрощено) — хвилька
    [230, 380, 0, `<path d="M-12 0q4-8 8 0t8 0 8 0" ${st}/>`],
  ] as const;
  const S = 460;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${icons
    .map(([x, y, r, body]) => `<g transform="translate(${x} ${y}) rotate(${r})">${body}</g>`)
    .join("")}</svg>`;
  const fade = "linear-gradient(180deg, #000 0%, #000 calc(100% - 160px), transparent 100%)";
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ opacity: 0.12, backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, backgroundSize: `${S}px ${S}px`, WebkitMaskImage: fade, maskImage: fade }}
      aria-hidden="true"
    />
  );
}
