import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Ticket } from "lucide-react";
import { Img } from "@/components/Img";
import type { Show } from "@/v2/lib/afisha";
import type { AfishaData } from "./useAfisha";

/** Вибір дня: «Найближчі» + лише ті дні, де є вистави. value: -1 = найближчі, інакше індекс дня. */
export function DayPills({ a, value, onChange }: { a: AfishaData; value: number; onChange: (v: number) => void }) {
  const pill = (on: boolean) =>
    `inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[14px] font-semibold transition-colors ${
      on ? "bg-o-sun text-o-winedeep" : "bg-o-sand/[0.08] text-o-sand hover:bg-o-sand/15"
    }`;
  return (
    <div role="tablist" aria-label={a.t("afishaKicker")} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <button type="button" role="tab" aria-selected={value < 0} onClick={() => onChange(-1)} className={pill(value < 0)}>
        {a.t("afishaNext")}
      </button>
      {a.days.map((d, i) =>
        d.shows.length === 0 ? null : (
          <button key={d.iso} type="button" role="tab" aria-selected={value === i} onClick={() => onChange(i)} className={pill(value === i)}>
            <span className="capitalize">{a.dayName(d.iso)}</span>
            {i > 1 && <span className="tabular-nums opacity-60">{a.fmt(d.iso, { day: "numeric" })}</span>}
          </button>
        ),
      )}
    </div>
  );
}

/** Рядок вистави: час · назва + театр · стрілка. */
export function ShowRow({ a, s, withDate, onHover }: { a: AfishaData; s: Show; withDate: boolean; onHover?: () => void }) {
  return (
    <li onMouseEnter={onHover} onFocus={onHover}>
      <Link to={s.href} className="group grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-o-sand/15 py-3.5 sm:grid-cols-[80px_1fr_auto]">
        <span className="flex flex-col">
          {withDate && <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-o-sand/55">{a.dateLabel(s.iso)}</span>}
          <span className="text-[19px] font-extrabold tabular-nums text-o-sun sm:text-[21px]">{s.time || "—"}</span>
        </span>
        <span className="min-w-0">
          <span className="block text-[16px] font-bold leading-tight transition-colors group-hover:text-o-sun sm:text-[18px]">{s.title}</span>
          <span className="mt-0.5 block text-[13px] leading-snug text-o-sand/60 sm:truncate">{a.tl(s.venue, s.venueEn)}</span>
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-o-sand/25 transition-all duration-300 group-hover:rotate-45 group-hover:bg-o-sun group-hover:text-o-winedeep group-hover:ring-o-sun">
          <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}

/**
 * Телефон і планшет: вистава як маленький горизонтальний квиток —
 * фото ліворуч, перфорація з вирізами, світлий корінець з днем і часом,
 * назвою й театром. Той самий стиль, що й постер-квиток на десктопі.
 */
export function ShowTicket({ a, s, withDate }: { a: AfishaData; s: Show; withDate: boolean }) {
  return (
    // Без тіні: вона затікала б у вирізи, а світлий квиток і так добре видно на темній панелі.
    <li>
      <Link
        to={s.href}
        className="ticket-cut group flex min-h-[96px] rounded-[16px] transition-transform duration-300 active:scale-[0.98]"
        style={{ "--cut-x": "93px" } as CSSProperties}
      >
        <span className="relative w-[92px] shrink-0 overflow-hidden rounded-l-[16px] bg-o-wine">
          {s.image ? (
            <Img src={s.image} w={240} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <Ticket className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-o-sand/40" aria-hidden="true" />
          )}
        </span>
        <span className="flex min-w-0 flex-1 flex-col justify-center rounded-r-[16px] border-l-2 border-dashed border-o-wine/35 bg-o-sand py-3 pl-4 pr-3 text-o-winedeep">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-o-wine">
            {withDate && <>{a.dateLabel(s.iso)} · </>}
            <span className="text-[13px] font-extrabold tracking-normal tabular-nums">{s.time || "—"}</span>
          </span>
          <span className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug">{s.title}</span>
          <span className="mt-0.5 line-clamp-1 text-[12.5px] text-o-winedeep/60">{a.tl(s.venue, s.venueEn)}</span>
        </span>
      </Link>
    </li>
  );
}
