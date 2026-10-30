import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import emblemShield from "@/assets/emblem-shield.svg";
import emblemRing from "@/assets/emblem-ring.svg";
import { useLang } from "@/lib/langContext";
import { Wreath } from "./Wreath";

/**
 * Новорічна заставка при першому відкритті головної за сесію.
 * Сценарій той самий, що в «Крафтовій Одещині» (craft: IntroSplash): емблема
 * збирається, після чого заставка піднімається завісою із заокругленим краєм.
 * Зимове: гірлянда «протягується» через екран і лампочки спалахують по черзі,
 * емблема збирається всередині різдвяного вінка, по краях — іній, падає сніг.
 * Пропускається кліком, будь-якою клавішею і при «зменшити рух».
 */

const SESSION_KEY = "odesa-winter-intro";
const BULBS = ["#3d8bff", "#e8304f", "#ffc23d", "#dff3ff"];
const EASE = [0.76, 0, 0.24, 1] as const;

const mask = (src: string) => ({
  WebkitMaskImage: `url(${src})`,
  maskImage: `url(${src})`,
  WebkitMaskSize: "contain",
  maskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
});

export default function WinterIntro() {
  const reduce = useReducedMotion();
  const { lang } = useLang();
  const [show, setShow] = useState(() => {
    try {
      return window.location.pathname === "/" && !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!show) return;
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* з'явиться ще раз — не біда */ }
    if (reduce) {
      setShow(false);
      return;
    }
    const id = setTimeout(() => setShow(false), 3400);
    const skip = () => setShow(false);
    window.addEventListener("keydown", skip);
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", skip);
    };
  }, [show, reduce]);

  // Провід гірлянди: три фестони через увесь екран (у відсотках viewBox 0..100).
  const bulbs = useMemo(() => {
    const out: { x: number; y: number; c: string }[] = [];
    for (let k = 0; k < 3; k++) {
      for (let j = 1; j <= 5; j++) {
        const t = j / 6;
        const x0 = k * 33.33;
        const x = x0 + t * 33.33;
        const y = 2 + 4 * 9 * t * (1 - t);
        out.push({ x, y: y + 2.2, c: BULBS[out.length % BULBS.length] });
      }
    }
    return out;
  }, []);
  const flakes = useMemo(
    () => Array.from({ length: 46 }, (_, i) => ({
      left: (i * 37) % 100,
      size: 2 + ((i * 13) % 5),
      delay: ((i * 0.53) % 3).toFixed(2),
      dur: (4 + ((i * 7) % 5)).toFixed(1),
    })),
    [],
  );

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden text-[#fff2e8]"
          style={{ background: "radial-gradient(120% 90% at 50% 40%, #0a4a8a 0%, #00376c 38%, #001a3d 100%)" }}
          initial={{ clipPath: "inset(0 0 0% 0 round 0 0 0px 0px)" }}
          exit={{ clipPath: "inset(0 0 100% 0 round 0 0 56px 56px)" }}
          transition={{ duration: 0.95, ease: EASE }}
          onClick={() => setShow(false)}
          aria-hidden
        >
          {/* сніг */}
          {flakes.map((f, i) => (
            <span
              key={i}
              className="winter-fall absolute -top-3 rounded-full bg-white/90 shadow-[0_0_6px_rgba(160,205,255,0.9)]"
              style={{ left: `${f.left}%`, width: f.size, height: f.size, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }}
            />
          ))}

          {/* іній по краях екрана */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(75% 70% at 50% 50%, transparent 55%, rgba(205,228,250,0.22) 80%, rgba(235,245,255,0.5) 100%)" }}
          />

          {/* гірлянда */}
          <svg className="absolute inset-x-0 top-0 h-[18vh] w-full" viewBox="0 0 100 14" preserveAspectRatio="none">
            <motion.path
              d="M0 2 Q16.67 20 33.33 2 Q50 20 66.67 2 Q83.33 20 100 2"
              fill="none"
              stroke="#0b2440"
              strokeWidth=".35"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.9, ease: "easeInOut" }}
            />
          </svg>
          <div className="absolute inset-x-0 top-0 h-[18vh]">
            {bulbs.map((b, i) => (
              <motion.span
                key={i}
                className="absolute block h-3 w-2 -translate-x-1/2 rounded-full md:h-4 md:w-2.5"
                style={{ left: `${b.x}%`, top: `${(b.y / 14) * 100}%`, background: b.c, boxShadow: `0 0 14px 4px ${b.c}` }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.75, 1], scale: 1 }}
                transition={{ delay: 0.7 + i * 0.05, duration: 0.6 }}
              />
            ))}
          </div>

          {/* емблема у вінку */}
          <motion.div
            className="relative h-[min(78vw,440px)] w-[min(78vw,440px)]"
            exit={{ scale: 0.85, y: -60, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 0.82, rotate: -24, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <Wreath idPrefix="wr-intro" className="h-full w-full drop-shadow-[0_24px_30px_rgba(0,10,30,0.55)]" />
            </motion.div>
            <div className="absolute inset-[23%]">
              <motion.div
                className="absolute inset-0 bg-[#fff2e8]"
                style={mask(emblemShield)}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.45, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div
                className="absolute inset-0 bg-[#df9b3b]"
                style={mask(emblemRing)}
                initial={{ rotate: -140, opacity: 0, scale: 1.15 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>

          <motion.p
            className="mt-2 text-[clamp(28px,5vw,52px)] leading-none tracking-[0.04em] font-odesa-heavy"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {lang === "en" ? "ODESA REGION" : "ОДЕЩИНА"}
          </motion.p>
          <motion.p
            className="mt-3 text-[13px] uppercase tracking-[0.32em] text-[#df9b3b]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7, duration: 1 }}
          >
            {lang === "en" ? "Winter holidays" : "Зимові свята"}
          </motion.p>

          <button
            type="button"
            className="absolute bottom-5 right-5 z-10 rounded-full bg-[#001a3d]/70 px-4 py-2 text-[13px] text-[#fff2e8] backdrop-blur hover:bg-[#001a3d]"
            onClick={() => setShow(false)}
          >
            {lang === "en" ? "Skip" : "Пропустити"}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
