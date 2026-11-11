import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Img } from "@/components/Img";
import { useV2 } from "@/v2/i18n";
import { EASE, Reveal } from "@/v2/components/ui";
import { BlockHead, usePlacesWord } from "./parts";
import type { DistrictPageData, Town } from "./useDistrictPage";

/** Скільки пунктів у ряду; якщо їх більше — ряд гортається стрілками по боках. */
const ROW = 5;

/* ── Спільне: пігулка з назвою і фото-панель ───────────────────────────── */

/**
 * Пігулка з назвою. У розкритої (open) вона подовжується (ширина 0fr → 1fr) і
 * відкриває кількість місць і стрілку; стрілка притиснута праворуч і їде разом
 * із краєм пігулки.
 */
function TownPill({ tw, on, open }: { tw: Town; on: boolean; open: boolean }) {
  const placesWord = usePlacesWord();
  return (
    <span className="absolute bottom-2.5 left-2.5 flex max-w-[calc(100%-20px)] items-center rounded-full bg-o-sand/95 py-1.5 pl-3.5 pr-1.5 shadow-[0_8px_20px_-12px_rgba(0,20,50,0.6)]">
      <span className={`truncate text-[14.5px] font-bold leading-tight transition-colors duration-300 sm:text-[15.5px] ${on ? "sm:text-o-wine" : ""}`}>{tw.name}</span>
      <span className={`ml-2 grid min-w-0 transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "grid-cols-[1fr]" : "sm:grid-cols-[0fr]"}`}>
        <span className="flex min-w-0 items-center justify-end gap-2 overflow-hidden">
          {tw.places > 0 && <span className="shrink-0 whitespace-nowrap text-[12px] text-o-sea/55">{placesWord(tw.places)}</span>}
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-o-wine text-o-sand" aria-hidden="true">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </span>
      </span>
    </span>
  );
}

/** Фото-панель населеного пункту (посилання на його сторінку). */
function TownPhoto({ tw, on, open, onActivate }: { tw: Town; on: boolean; open: boolean; onActivate?: () => void }) {
  return (
    <Link to={`/napryamky/${tw.c.slug}`} className="block h-full" onMouseEnter={onActivate} onFocus={onActivate}>
      <Img src={tw.c.imageUrl} w={900} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover/p:scale-[1.04]" />
      <TownPill tw={tw} on={on} open={open} />
    </Link>
  );
}

const PANEL = "group/p relative h-[300px] w-[64vw] shrink-0 overflow-hidden rounded-[18px] bg-o-sea/10";

/**
 * Розкладка фото в один ряд: одне розкрите (спершу перше), наведення розкриває
 * інше.
 * На телефоні — стрічка карток, що гортається вбік.
 */
function PanelRow({ towns, reveal = true }: { towns: Town[]; reveal?: boolean }) {
  const [active, setActive] = useState(0);
  const Item = reveal ? Reveal : PlainLi;
  return (
    <ul className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 sm:mx-0 sm:h-[400px] sm:overflow-visible sm:px-0">
      {towns.map((tw, i) => {
        const on = i === active;
        return (
          <Item
            as="li"
            key={tw.c.id}
            delay={i * 0.05}
            className={`${PANEL} transition-[flex-grow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:h-full sm:w-auto ${on ? "sm:flex-[2.4_1_0%]" : "sm:flex-[1_1_0%]"}`}
          >
            <TownPhoto tw={tw} on={on} open={on} onActivate={() => setActive(i)} />
          </Item>
        );
      })}
    </ul>
  );
}

/** Звичайний <li> з тим самим інтерфейсом, що й Reveal (без появи при прокрутці). */
function PlainLi({ className, children }: { as?: "li"; delay?: number; className?: string; children: React.ReactNode }) {
  return <li className={className}>{children}</li>;
}

/* ── Більше п'яти: той самий ряд + стрілки по боках ──────────────────── */

/** true на планшеті й ПК (≥640px) — там ряд гортається стрілками; на телефоні — стрічка. */
export function useWide() {
  const q = "(min-width: 640px)";
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

/** Кругла кремова стрілка на краю ряду — наполовину заходить на фото. */
export function SideArrow({ dir, onClick, label }: { dir: -1 | 1; onClick: () => void; label: string }) {
  const Icon = dir < 0 ? ArrowLeft : ArrowRight;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={`group/a absolute top-1/2 z-10 -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-o-sand text-o-wine shadow-[0_14px_30px_-12px_rgba(0,20,50,0.55)] ring-1 ring-o-sea/10 transition-colors duration-300 hover:bg-o-wine hover:text-o-sand ${dir < 0 ? "-left-7" : "-right-7"}`}
    >
      <Icon className={`h-5 w-5 transition-transform duration-300 ${dir < 0 ? "group-hover/a:-translate-x-0.5" : "group-hover/a:translate-x-0.5"}`} aria-hidden="true" />
    </motion.button>
  );
}

/**
 * Ряд із п'яти розкритних фото, як і для невеликих районів, а стрілки по боках
 * гортають до наступних (ряд в'їжджає збоку). Остання «сторінка» завжди повна:
 * якщо пунктів не кратно п'яти, вона бере кілька з попередньої.
 * На телефоні — звичайна стрічка з усіма пунктами.
 */
function TownPages({ towns }: { towns: Town[] }) {
  const reduce = useReducedMotion();
  const wide = useWide();
  const pages = Math.ceil(towns.length / ROW);
  const [[page, dir], setPage] = useState<[number, number]>([0, 0]);
  if (!wide) return <PanelRow towns={towns} />;
  const start = Math.min(page * ROW, towns.length - ROW);
  const go = (d: -1 | 1) => setPage(([p]) => [Math.min(pages - 1, Math.max(0, p + d)), d]);
  const slide = {
    enter: (d: number) => (reduce ? { opacity: 0 } : { x: `${d * 100}%`, opacity: 0.4 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => (reduce ? { opacity: 0 } : { x: `${-d * 100}%`, opacity: 0.4 }),
  };
  return (
    <div>
      <div className="relative">
        <div className="relative h-[400px] overflow-hidden rounded-[18px]">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={page}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: EASE }}
              className="h-full w-full"
            >
              <PanelRow towns={towns.slice(start, start + ROW)} reveal={false} />
            </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {page > 0 && <SideArrow key="prev" dir={-1} onClick={() => go(-1)} label="Попередні" />}
          {page < pages - 1 && <SideArrow key="next" dir={1} onClick={() => go(1)} label="Наступні" />}
        </AnimatePresence>
      </div>
      {/* Сторінки: крапки + «6–10 з 15» */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <div className="flex gap-1.5">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(([p]) => [i, i > p ? 1 : -1])}
              aria-label={`${i + 1}`}
              aria-current={i === page || undefined}
              className={`h-2 rounded-full transition-all duration-300 ${i === page ? "w-6 bg-o-wine" : "w-2 bg-o-sea/20 hover:bg-o-sea/40"}`}
            />
          ))}
        </div>
        <span className="text-[12.5px] tabular-nums text-o-sea/50">
          {start + 1}–{start + ROW} / {towns.length}
        </span>
      </div>
    </div>
  );
}

/* ── Блок цілком ───────────────────────────────────────────────────────── */

/**
 * Населені пункти — ряд фото, одне розкрите (наведення розкриває інше).
 * Якщо пунктів більше п'яти, ряд показує по п'ять, а стрілки по боках гортають далі.
 */
export function MixTowns({ data, title }: { data: DistrictPageData; title: string }) {
  const { t } = useV2();
  const towns = data.towns;
  if (!towns.length) return null;
  return (
    <section id="towns" aria-labelledby="towns-t" className="mx-auto max-w-[1280px] scroll-mt-24 px-5 py-10 sm:px-10 sm:py-14">
      <BlockHead id="towns-t" kicker={t("townsKicker")} title={title} count={towns.length} />
      <div className="mt-7">{towns.length > ROW ? <TownPages towns={towns} /> : <PanelRow towns={towns} />}</div>
    </section>
  );
}
