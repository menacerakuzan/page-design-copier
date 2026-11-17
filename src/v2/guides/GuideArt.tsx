import { motion, useReducedMotion } from "framer-motion";

/**
 * Ілюстрація в шапці «Гідів»: прапорець гіда на древку (злегка майорить),
 * під ним пунктир маршруту з мітками, а поруч — бульбашки «Привіт!»,
 * «Hello!», «Hallo!» — гіди водять екскурсії різними мовами. Бульбашки
 * з'являються по черзі й легко погойдуються.
 */
export function GuideArt({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const bubbles = [
    { x: 150, y: 28, w: 78, text: "Привіт!", bg: "#fffaf5", fg: "#002f5e", ring: true },
    { x: 196, y: 78, w: 70, text: "Hello!", bg: "#9f1f47", fg: "#fff2e8" },
    { x: 140, y: 122, w: 70, text: "Hallo!", bg: "#df9b3b", fg: "#4a0f22" },
  ];
  return (
    // Видимість відстежуємо на самому <svg>, а не на його <path>/<g>: Safari на
    // iPhone/iPad ненадійно бачить видимість внутрішніх елементів SVG.
    <motion.svg viewBox="0 0 300 210" className={className} aria-hidden="true" initial={reduce ? false : "hidden"} whileInView="shown" viewport={{ once: true }}>
      {/* Пунктир маршруту з мітками */}
      <motion.path
        d="M14 188C60 168 92 196 132 182S214 160 286 174"
        fill="none"
        stroke="#9f1f47"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="2 7"
        variants={{ hidden: { pathLength: 0 }, shown: { pathLength: 1, transition: { duration: 1.6, ease: "easeInOut" } } }}
      />
      <circle cx="14" cy="188" r="5" fill="#fff2e8" stroke="#9f1f47" strokeWidth="2.2" />
      <g transform="translate(286 174)">
        <path d="M0 -20c-5.5 0-9 4-9 8.5 0 6.5 9 15.5 9 15.5s9-9 9-15.5C9 -16 5.5 -20 0 -20z" fill="#9f1f47" />
        <circle cy="-11.5" r="3.2" fill="#fff2e8" />
      </g>

      {/* Древко і прапорець гіда */}
      <line x1="84" y1="186" x2="84" y2="34" stroke="#002f5e" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="84" cy="30" r="5" fill="#df9b3b" />
      <motion.path
        fill="#9f1f47"
        initial={false}
        animate={reduce ? undefined : { d: ["M86 38 C110 34 128 46 148 42 L134 62 L148 82 C128 86 110 74 86 78 Z", "M86 38 C108 42 128 38 150 46 L136 64 L146 84 C126 80 108 82 86 78 Z", "M86 38 C110 34 128 46 148 42 L134 62 L148 82 C128 86 110 74 86 78 Z"] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        d="M86 38 C110 34 128 46 148 42 L134 62 L148 82 C128 86 110 74 86 78 Z"
      />
      {/* Зірочка на прапорці — «туристичний» знак */}
      <path d="M108 52l2 4.6 5 .4-3.8 3.3 1.2 4.9-4.4-2.7-4.4 2.7 1.2-4.9-3.8-3.3 5-.4z" fill="#fff2e8" />

      {/* Бульбашки різними мовами */}
      {bubbles.map((b, i) => (
        <motion.g
          key={b.text}
          variants={{
            hidden: { opacity: 0, y: 10, scale: 0.85 },
            shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, delay: 0.5 + i * 0.35, ease: [0.22, 1, 0.36, 1] } },
          }}
          style={{ transformOrigin: `${b.x}px ${b.y + 14}px`, transformBox: "view-box" }}
        >
          <g className="float-soft" style={{ animationDelay: `${i * 0.8}s` }}>
            <rect x={b.x} y={b.y} width={b.w} height="30" rx="15" fill={b.bg} stroke={b.ring ? "rgba(0,47,94,0.15)" : "none"} strokeWidth="1.5" />
            <path d={`M${b.x + 14} ${b.y + 29} l-6 9 l13 -9z`} fill={b.bg} />
            <text x={b.x + b.w / 2} y={b.y + 19.5} textAnchor="middle" fontSize="13" fontWeight="700" fill={b.fg}>
              {b.text}
            </text>
          </g>
        </motion.g>
      ))}
    </motion.svg>
  );
}
