import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MoveHorizontal } from "lucide-react";
import { useLang } from "@/lib/langContext";

const HINT_SEEN_KEY = "drag-scroll-hint-seen";

/**
 * Горизонтальний скролер із перетягуванням мишею: тачпад/тач гортали й так,
 * а на десктопі з мишею стрічку раніше можна було гортати хіба коліщатком.
 * Додає drag-to-scroll з інерцією, придушення випадкового кліку по картці
 * після перетягування та (опційно) плаваючу підказку «Тягніть» — вона
 * показується лише пристроям із курсором (pointer: fine), і зникає назавжди
 * після першого перетягування будь-якої стрічки (localStorage).
 */
export function DragScrollRow({
  className = "",
  wrapperClassName = "",
  hint = false,
  scrollRef,
  children,
}: {
  className?: string;
  wrapperClassName?: string;
  hint?: boolean;
  /** Для стрічок зі стрілками: віддає DOM-вузол наверх (як scrollRefs). */
  scrollRef?: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const movedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    if (!hint) return;
    try {
      if (localStorage.getItem(HINT_SEEN_KEY)) return;
    } catch { /* сховище недоступне */ }
    // Підказка має сенс лише там, де є курсор
    if (window.matchMedia?.("(pointer: fine)").matches) setHintVisible(true);
  }, [hint]);

  const dismissHint = useCallback(() => {
    setHintVisible(false);
    try { localStorage.setItem(HINT_SEEN_KEY, "1"); } catch { /* ignore */ }
  }, []);

  const setRefs = useCallback((el: HTMLDivElement | null) => {
    elRef.current = el;
    scrollRef?.(el);
  }, [scrollRef]);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = elRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    movedRef.current = false;

    let x = e.pageX;
    let lastX = e.pageX;
    let lastTime = Date.now();
    let velocity = 0;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.pageX - x;
      if (Math.abs(ev.pageX - lastX) > 3) movedRef.current = true;
      el.scrollLeft -= dx;
      const now = Date.now();
      velocity = (ev.pageX - lastX) / (now - lastTime || 1);
      lastX = ev.pageX;
      lastTime = now;
      x = ev.pageX;
      ev.preventDefault();
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      if (movedRef.current) dismissHint();
      // Інерція після відпускання
      let v = velocity * 15;
      const animate = () => {
        if (Math.abs(v) < 0.5) return;
        el.scrollLeft -= v;
        v *= 0.92;
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Після перетягування «клік», що завершує drag, не має відкривати картку/лінк
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  };

  const { lang } = useLang();

  return (
    <div className={`relative ${wrapperClassName}`}>
      <div
        ref={setRefs}
        onMouseDown={onMouseDown}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        className={`${className} cursor-grab select-none active:cursor-grabbing`}
      >
        {children}
      </div>
      {hintVisible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
          aria-hidden
        >
          <div className="flex items-center gap-2 rounded-full border border-[#fff2e8]/20 bg-[#001a3d]/75 px-4 py-2 text-[12px] leading-none text-[#fff2e8] shadow-[0_12px_30px_-10px_rgba(0,10,30,0.6)] backdrop-blur-md font-odesa-medium">
            <motion.span
              animate={{ x: [0, 5, 0, -5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="flex"
            >
              <MoveHorizontal className="h-4 w-4 text-[#df9b3b]" />
            </motion.span>
            {lang === "en" ? "Drag to explore" : "Тягніть, щоб гортати"}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default DragScrollRow;
