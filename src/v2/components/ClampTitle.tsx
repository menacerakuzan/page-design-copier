import { Link } from "react-router-dom";

/**
 * Назва картки, обрізана до двох рядків (посилання розтягнуте на всю картку).
 * Якщо назва не вмістилась (обрізана «…»), браузер при наведенні через якийсь
 * час покаже системну підказку з повною назвою (атрибут title). Коли назва
 * видна цілком — title не ставимо, щоб підказка не дублювала текст.
 */
export function ClampTitle({ to, text, className = "", hoverClass = "group-hover:text-o-wine" }: {
  to: string;
  text: string;
  className?: string;
  hoverClass?: string;
}) {
  // Перевіряємо обрізання саме при наведенні: ширина картки могла змінитись.
  const check = (e: React.MouseEvent<HTMLAnchorElement> | React.FocusEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const cut = el.scrollHeight > el.clientHeight + 1;
    if (cut) el.setAttribute("title", text);
    else el.removeAttribute("title");
  };
  return (
    <Link
      to={to}
      onMouseEnter={check}
      onFocus={check}
      className={`line-clamp-2 transition-colors after:absolute after:inset-0 after:content-[''] ${hoverClass} ${className}`}
    >
      {text}
    </Link>
  );
}
