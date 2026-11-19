import "@/v2/v2.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { EggLabel } from "./EggLabel";

const SEQUENCE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

/** Команда, що зробила сайт. */
export const CREDITS = ["Андрій", "Ілля", "Олександр", "Світлана", "Ганна"];

/**
 * Прихована пасхалка — без видимих слідів у звичайному UI. Konami-код
 * (↑↑↓↓←→←→BA) відкриває винну плашку-«етикетку» з подякою команді (власник
 * 2026-11-20: «як титри, але не на весь екран і без титрів — просто винна
 * плашка з написами»). Не спрацьовує в текстових полях. Закривається кліком
 * поза плашкою або Esc. ?egg у адресі одразу відкриває її (щоб показати без коду).
 * «Квиток», «Листівка», «Титри» (на весь екран і у вікні) — у useful/v2/easter/.
 */
export function EasterEgg() {
  const [params] = useSearchParams();
  const [open, setOpen] = useState(false);

  const preview = params.has("egg");
  useEffect(() => {
    if (preview) setOpen(true);
  }, [preview]);

  useEffect(() => {
    let progress = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === SEQUENCE[progress]) {
        progress += 1;
        if (progress === SEQUENCE.length) {
          setOpen(true);
          progress = 0;
        }
      } else {
        progress = key === SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Зроблено з любов'ю до Одещини"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onClick={() => setOpen(false)}
          className="v2 fixed inset-0 z-[100] flex cursor-pointer items-center justify-center !bg-[#2a0614]/70 backdrop-blur-[3px]"
        >
          <EggLabel />
          <p className="pointer-events-none absolute inset-x-0 bottom-[calc(20px+env(safe-area-inset-bottom))] text-center text-[12px] text-o-sand/55">
            <span className="[@media(hover:none)]:hidden">Esc або клік поза плашкою — закрити</span>
            <span className="[@media(hover:hover)]:hidden">Торкніться поза плашкою, щоб закрити</span>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default EasterEgg;
