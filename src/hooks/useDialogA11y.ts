import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "video[controls]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Доступність модальних/діалогових вікон (WCAG 2.1.2, 2.4.3, 2.4.11):
 *  - Esc закриває вікно;
 *  - фокус переходить всередину вікна при відкритті;
 *  - Tab/Shift+Tab циклічно ходять ЛИШЕ по вмісту вікна (пастка фокуса —
 *    саме та, яка тут доречна: користувач не «випадає» на фон, але завжди
 *    може вийти через Esc або кнопку закриття);
 *  - після закриття фокус повертається на елемент, який вікно відкрив;
 *  - скрол сторінки під вікном заблокований.
 *
 * Повертає ref, який треба поставити на кореневий вузол вікна.
 */
export function useDialogA11y(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const node = ref.current;
    // Фокус на сам контейнер, а не на першу кнопку: інакше скринридер
    // починає читати з випадкової кнопки («Закрити»), а не з назви вікна.
    if (node) {
      if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "-1");
      node.focus({ preventScroll: true });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === ref.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      // Фокус назад на елемент-ініціатор — інакше він падає на <body>
      // і подальший Tab починає обхід сторінки спочатку.
      restoreTo.current?.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  return ref;
}
