import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useLang } from "@/lib/langContext";

/**
 * Кругла плаваюча кнопка асистента — справа над нижнім таб-баром. Рендериться
 * один раз у App; ховається на самій сторінці чату. Тільки мобільна версія.
 */
export function AssistantFab() {
  const { pathname } = useLocation();
  const { t } = useLang();
  const hidden = pathname.startsWith("/asystent");

  // /koshyk і /marshrut мають власну липку CTA-кнопку одразу над нижнім меню —
  // піднімаємо FAB вище неї, щоб не перекривались.
  const raised = pathname.startsWith("/koshyk") || pathname.startsWith("/marshrut");
  const bottom = raised
    ? "calc(150px + env(safe-area-inset-bottom))"
    : "calc(84px + env(safe-area-inset-bottom))";

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 24 }}
          className="fixed right-4 z-30 md:hidden"
          style={{ bottom }}
        >
          <motion.div whileTap={{ scale: 0.9 }}>
            <Link
              to="/asystent"
              aria-label={t("assistantName")}
              className="tap flex h-14 w-14 items-center justify-center rounded-full border border-[#002f5e]/12 bg-[#fff2e8] text-[#002f5e] shadow-[0_12px_28px_-8px_rgba(0,47,94,0.45)]"
            >
              <Sparkles className="h-6 w-6" strokeWidth={2.1} />
            </Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AssistantFab;
