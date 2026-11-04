import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Img } from "@/components/Img";
import { EASE, SectionHead } from "@/v2/components/ui";
import type { AfishaData } from "./useAfisha";
import { DayPills, ShowRow } from "./parts";

const ROWS = 5;

/**
 * Варіант 1 «Панель»: на кремовій сторінці — заокруглений винний блок
 * з відступами від країв. Усередині: дні, 5 найближчих вистав і постер
 * тієї, на яку наведено.
 */
export function AfPanel({ a }: { a: AfishaData }) {
  const [day, setDay] = useState(-1);
  const [hover, setHover] = useState(0);
  const shows = day < 0 ? a.upcoming : a.days[day]?.shows ?? [];
  const preview = shows[Math.min(hover, shows.length - 1)];

  return (
    <section aria-labelledby="afisha-title" className="bg-o-sand px-3 py-8 sm:px-6 sm:py-12">
      <div className="grain relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-o-winedeep px-5 py-10 text-o-sand sm:rounded-[36px] sm:px-10 sm:py-12 lg:px-14">
        {/* М'яке світло «рампи» згори. */}
        <div className="pointer-events-none absolute -top-48 left-1/2 h-[540px] w-[1120px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(223,155,59,0.28),rgba(223,155,59,0.1)_55%,transparent)]" aria-hidden="true" />
        <div className="relative">
          <SectionHead id="afisha-title" tone="dark" inline kicker={a.t("afishaKicker")} line1={a.t("afishaTitle1")} line2={a.t("afishaTitle2")} action={{ to: "/podiyi", label: a.t("fullAfisha") }} />

          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_260px] lg:gap-12">
            <div className="min-w-0">
              <DayPills a={a} value={day} onChange={(v) => { setDay(v); setHover(0); }} />
              <AnimatePresence mode="wait">
                <motion.ul
                  key={day}
                  role="tabpanel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="mt-5 border-t border-o-sand/15"
                >
                  {shows.slice(0, ROWS).map((s, i) => (
                    <ShowRow key={s.key} a={a} s={s} withDate={day < 0} onHover={() => setHover(i)} />
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>

            {/* Постер вистави — квиток із корінцем */}
            <Link
              to={preview?.href ?? "/podiyi"}
              aria-label={preview ? `${preview.title} — ${a.tl(preview.venue, preview.venueEn)}` : a.t("fullAfisha")}
              className="group hidden self-start transition-transform duration-500 ease-out hover:-translate-y-1.5 lg:block"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-t-[18px] bg-o-wine">
                <AnimatePresence mode="popLayout">
                  {preview && (
                    <motion.div key={preview.image} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE }} className="absolute inset-0">
                      <Img src={preview.image} w={520} alt="" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="ticket-stub relative rounded-b-[18px] bg-o-sand px-5 py-4 text-o-winedeep">
                {preview && (
                  <>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-o-wine">{a.dateLabel(preview.iso)} · {preview.time}</p>
                    <p className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug transition-colors group-hover:text-o-wine">{preview.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[12.5px] text-o-winedeep/60">{a.tl(preview.venue, preview.venueEn)}</p>
                  </>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
