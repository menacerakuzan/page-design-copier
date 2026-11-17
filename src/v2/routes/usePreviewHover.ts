import { useEffect, useRef, useState } from "react";

/** Затримка наведення — щоб карта не блимала, коли курсор просто пробігає по сітці. */
const INTENT_MS = 220;

/**
 * Наведення на картку маршруту: armed — карта вже змонтована (рахується й
 * малюється), show — її видно. Лише миша (не дотик); затримка — щоб карта не
 * блимала, коли курсор просто пробігає по сітці. На телефоні — toggle з кнопки.
 */
export function usePreviewHover(can: boolean) {
  const [armed, setArmed] = useState(false);
  const [show, setShow] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onPointerEnter = (e: React.PointerEvent) => {
    if (!can || e.pointerType !== "mouse") return;
    setArmed(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShow(true), INTENT_MS);
  };
  const onPointerLeave = () => {
    window.clearTimeout(timer.current);
    setShow(false);
  };
  const toggle = () => {
    setArmed(true);
    setShow((v) => !v);
  };
  return { armed, show, toggle, handlers: { onPointerEnter, onPointerLeave } };
}
