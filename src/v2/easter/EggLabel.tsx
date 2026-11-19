import { motion, useReducedMotion } from "framer-motion";
import { Shield } from "@/v2/components/ui";
import { CREDITS } from "./EasterEgg";

/** Хвиля-розділювач (як хвилі над підвалом, лише лінією). */
function Wave({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 20" className={className} aria-hidden="true">
      <path d="M2 12c10-10 20-10 30 0s20 10 30 0 20-10 30 0 20 10 30 0 20-10 30 0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** Зірочка-іскра в кутах рамки. */
function Spark({ className }: { className: string }) {
  return (
    <svg viewBox="-12 -12 24 24" className={className} aria-hidden="true">
      <path d="M0-10c.6 5.4 4 8.8 10 10-6 1.2-9.4 4.6-10 10-.6-5.4-4-8.8-10-10 6-1.2 9.4-4.6 10-10z" fill="currentColor" />
    </svg>
  );
}

/** Вирізані (увігнуті) кути, як у винної етикетки. */
const R = 22;
const CUT = [`0 0`, `100% 0`, `0 100%`, `100% 100%`]
  .map((at, i) => `radial-gradient(circle ${R}px at ${at}, #0000 98%, #000) ${["top left", "top right", "bottom left", "bottom right"][i]} / 51% 51% no-repeat`)
  .join(", ");

/**
 * «Етикетка»: винна плашка посеред екрана у формі етикетки на пляшці вина
 * (Одещина — винний край): вирізані кути, тонка подвійна сонячна рамка з
 * іскрами в кутах, герб, «Зроблено з любов'ю до Одещини», «Над сайтом
 * працювали» — імена команди.
 */
export function EggLabel() {
  const reduce = useReducedMotion();
  const item = (i: number) => ({
    initial: reduce ? false : ({ opacity: 0, y: 8 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.25 + i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  });
  return (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, rotate: -4, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      // Тінь — фільтром на обгортці: маска вирізаних кутів обрізала б box-shadow
      className="mx-4 w-[min(440px,calc(100vw-32px))] cursor-default drop-shadow-[0_40px_50px_rgba(20,0,8,0.55)]"
    >
      <div className="relative overflow-hidden bg-o-wine px-8 pb-8 pt-10 text-center text-o-sand sm:px-10" style={{ WebkitMask: CUT, mask: CUT }}>
        {/* Сонячний відсвіт згори й глибше вино знизу */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{ background: "radial-gradient(80% 45% at 50% 0%, rgba(223,155,59,0.3), transparent 70%), radial-gradient(90% 45% at 50% 105%, rgba(60,4,24,0.6), transparent 70%)" }}
        />
        {/* Подвійна рамка етикетки */}
        <div className="pointer-events-none absolute inset-[14px] rounded-[4px] border border-o-sun/50" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-[19px] rounded-[2px] border border-o-sun/20" aria-hidden="true" />
        {[
          "left-[7px] top-[7px]",
          "right-[7px] top-[7px]",
          "bottom-[7px] left-[7px]",
          "bottom-[7px] right-[7px]",
        ].map((pos) => (
          <Spark key={pos} className={`absolute h-[15px] w-[15px] text-o-sun ${pos}`} />
        ))}

        <div className="relative">
          <motion.p {...item(0)} className="text-[10.5px] font-semibold uppercase tracking-[0.26em] text-o-sun">
            Секретний код прийнято
          </motion.p>
          <motion.div {...item(1)} className="mt-4 flex justify-center">
            <Shield className="h-14 w-[46px] text-o-sun" />
          </motion.div>
          <motion.h2 {...item(2)} className="mt-4 text-[32px] font-bold leading-[1.02] tracking-[-0.025em] sm:text-[36px]">
            Зроблено з любов'ю
            <span className="ital block text-o-sun">до Одещини</span>
          </motion.h2>
          <motion.div {...item(3)} className="mt-5 flex justify-center">
            <Wave className="w-24 text-o-sun/70" />
          </motion.div>

          <motion.p {...item(4)} className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-o-sand/55">
            Над сайтом працювали
          </motion.p>
          <ul className="mt-2.5 flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
            {CREDITS.map((name, i) => (
              <motion.li key={name} {...item(5 + i)} className="ital text-[22px] leading-tight">
                {name}
              </motion.li>
            ))}
          </ul>

        </div>
      </div>
    </motion.div>
  );
}
