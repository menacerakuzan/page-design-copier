import { useEffect, useRef, type RefObject } from "react";

/**
 * Горизонтальний свайп двома пальцями на тачпаді (і Shift+колесо).
 * onDelta отримує зсув по X, onEnd — коли жест (разом з інерцією) затих.
 * Вертикальна прокрутка сторінки не чіпається; горизонтальна не дає
 * браузеру зробити «назад» по свайпу.
 */
export function useWheelSwipe(ref: RefObject<HTMLElement>, onDelta: (dx: number) => void, onEnd: () => void) {
  const cb = useRef({ onDelta, onEnd });
  cb.current = { onDelta, onEnd };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;
    const onWheel = (e: WheelEvent) => {
      const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault();
      cb.current.onDelta(dx);
      clearTimeout(timer);
      timer = window.setTimeout(() => cb.current.onEnd(), 140);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => { clearTimeout(timer); el.removeEventListener("wheel", onWheel); };
  }, [ref]);
}
