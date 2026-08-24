import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import { WaveLines } from "@/components/decor";

const SEQUENCE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

const CREDITS = ["Андрій", "Ілля", "Олександр", "Світлана", "Ганна"];

/**
 * Прихована пасхалка — жодних видимих слідів у звичайному UI. Класичний
 * Konami-код (↑↑↓↓←→←→BA) відкриває невеличку подяку команді, що зробила
 * цей сайт. Не спрацьовує в текстових полях (щоб не заважати вводу).
 */
export function KonamiEasterEgg() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let progress = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      const expected = SEQUENCE[progress];
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === expected) {
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
    const timer = setTimeout(() => setOpen(false), 6000);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001a3d]/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative mx-4 max-w-[380px] overflow-hidden rounded-[28px] border border-[#df9b3b]/30 bg-[#002f5e] px-8 py-9 text-center shadow-[0_30px_70px_-20px_rgba(0,0,0,0.6)]"
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#df9b3b]/15 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[#9f1f47]/25 blur-3xl" aria-hidden="true" />

            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 14 }}
              className="relative z-10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "#df9b3b" }}
            >
              <Heart className="h-6 w-6 text-[#002f5e]" fill="#002f5e" />
            </motion.span>

            <p className="relative z-10 text-[13px] uppercase tracking-[0.2em] text-[#df9b3b] font-odesa-medium">
              Секретний код прийнято
            </p>
            <h2 className="relative z-10 mt-2 text-[24px] leading-tight text-[#fff2e8] font-odesa-bold">
              Зроблено з любов'ю
              <br />до Одещини
            </h2>

            <div className="relative z-10 mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
              {CREDITS.map((name, i) => (
                <motion.span
                  key={name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  className="rounded-full px-3 py-1 text-[14px] text-[#fff2e8]/90 font-odesa-medium"
                  style={{ backgroundColor: "rgba(255,242,232,0.08)" }}
                >
                  {name}
                </motion.span>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="relative z-10 mt-6 flex justify-center"
            >
              <WaveLines className="h-5 w-24 text-[#df9b3b]/70" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default KonamiEasterEgg;
