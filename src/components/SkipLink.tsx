import { useLang } from "@/lib/langContext";

export const MAIN_CONTENT_ID = "main-content";

/**
 * Пропустити шапку й перейти одразу до основного вмісту (WCAG 2.4.1).
 *
 * Має бути ПЕРШИМ фокусабельним елементом сторінки. Звичайний <a href="#…">
 * лише прокручує сторінку, але НЕ переносить фокус клавіатури на контейнер,
 * якщо в того немає tabindex — тому ціль (<main>) має tabindex={-1}, а тут
 * ми ще й явно викликаємо focus(), щоб подальший Tab продовжив саме з
 * основного вмісту, а не з наступного посилання в шапці.
 */
export function SkipLink() {
  const { lang } = useLang();

  const jump = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // Спершу за id, далі — будь-який <main> на сторінці: так посилання
    // працює навіть якщо конкретна сторінка забула проставити id.
    const target =
      document.getElementById(MAIN_CONTENT_ID) ?? document.querySelector("main");
    if (!(target instanceof HTMLElement)) return;
    // Контейнер сам по собі не фокусабельний — без tabindex focus() мовчки
    // нічого не робить, і Tab продовжив би з наступного посилання шапки.
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <a href={`#${MAIN_CONTENT_ID}`} onClick={jump} className="skip-link font-odesa-medium">
      {lang === "en" ? "Skip to main content" : "Перейти до основного вмісту"}
    </a>
  );
}

export default SkipLink;
