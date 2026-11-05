import { useCallback, useRef } from "react";

/**
 * Ставить на паузу CSS-анімації блоку, поки він поза екраном (клас
 * `anim-off`, див. v2.css), — фонові візерунки не крутяться даремно.
 * Повертає callback-ref: працює й тоді, коли блок з'являється пізніше
 * (після завантаження даних). Клас ставиться напряму, без перерендеру.
 */
export function usePauseOffscreen<T extends HTMLElement>() {
  const io = useRef<IntersectionObserver | null>(null);
  return useCallback((el: T | null) => {
    io.current?.disconnect();
    io.current = null;
    if (!el) return;
    el.classList.add("anim-off");
    io.current = new IntersectionObserver(([e]) => el.classList.toggle("anim-off", !e.isIntersecting), { rootMargin: "120px 0px" });
    io.current.observe(el);
  }, []);
}
