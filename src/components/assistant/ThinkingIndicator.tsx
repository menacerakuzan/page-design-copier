import { motion } from "framer-motion";

/**
 * Красива анімація «обдумування» асистента: пульсуючі крапки + опційний
 * статус-лейбл зі стріму (напр. «Шукаю варіанти… 🔎»).
 */
export function ThinkingIndicator({ label }: { label?: string | null }) {
  return (
    <div className="flex items-center gap-2.5 rounded-[18px] rounded-tl-md bg-white px-4 py-3 shadow-[0_10px_26px_-22px_rgba(0,47,94,0.45)]">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-2 w-2 rounded-full bg-[#df9b3b]"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.16, ease: "easeInOut" }}
          />
        ))}
      </div>
      <motion.span
        key={label || "think"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[13px] text-[#002f5e]/70 font-odesa-medium"
      >
        {label || "Обдумую… 🤔"}
      </motion.span>
    </div>
  );
}
