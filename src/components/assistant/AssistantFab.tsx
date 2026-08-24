import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLang } from "@/lib/langContext";

/**
 * Кругла плаваюча кнопка асистента — справа над нижнім таб-баром. Рендериться
 * один раз у App; ховається на самій сторінці чату. Тільки мобільна версія.
 *
 * ВАЖЛИВО: елемент НІКОЛИ не розмонтовується (немає `{!hidden && ...}` /
 * AnimatePresence) — лише анімується opacity/scale до 0 і ставиться
 * pointer-events-none. Раніше (умовний рендер) кнопка після повернення з
 * /asystent інколи лишалась невидимою назавжди аж до перезавантаження
 * сторінки, хоча була в DOM: це відомий клас багів WebKit/Safari, коли
 * position:fixed-елемент з transform-анімацією після повного unmount→remount
 * не перекомпоновується. Постійний вузол у DOM (тільки opacity/scale тают)
 * цю категорію багів обходить — компонуючий шар не знищується й не
 * створюється заново.
 */
export function AssistantFab() {
  const { pathname } = useLocation();
  const { t } = useLang();
  const hidden = pathname.startsWith("/asystent");

  // /koshyk і /marshrut мають власну липку CTA-кнопку одразу над нижнім меню —
  // піднімаємо FAB вище неї, щоб не перекривались. Точна рівність (не
  // startsWith) — інакше /marshrut ловить і /marshruty (список маршрутів),
  // де такої CTA-кнопки немає.
  const raised = pathname === "/koshyk" || pathname === "/marshrut";
  const bottom = raised
    ? "calc(150px + env(safe-area-inset-bottom))"
    : "calc(84px + env(safe-area-inset-bottom))";

  return (
    <motion.div
      animate={{ scale: hidden ? 0 : 1, opacity: hidden ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 24 }}
      className="fixed right-4 z-30 md:hidden"
      style={{ bottom, pointerEvents: hidden ? "none" : "auto" }}
      aria-hidden={hidden}
      inert={hidden || undefined}
    >
      <motion.div whileTap={{ scale: 0.9 }}>
        <Link
          to="/asystent"
          aria-label={t("assistantName")}
          tabIndex={hidden ? -1 : undefined}
          className="tap flex h-14 w-14 items-center justify-center rounded-full border border-[#002f5e]/12 bg-[#fff2e8] text-[#002f5e] shadow-[0_12px_28px_-8px_rgba(0,47,94,0.45)]"
        >
          <Sparkles className="h-6 w-6" strokeWidth={2.1} />
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default AssistantFab;
