import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useV2 } from "@/v2/i18n";
import { EASE } from "@/v2/components/ui";
import { kmFromOdesa } from "@/v2/lib/geo";

const W = 1500;
const BASE = 214; // лінія берега
const ICON = 100; // іконка малюється в коробці 100×100, низ — на лінії
const VB_Y = 28; // верх видимої області (над сонцем порожньо)
const VB_H = 242;

type Mark = {
  key: string;
  x: number;
  uk: string;
  en: string;
  noteUk: string;
  noteEn: string;
  href: string;
  lat: number;
  lon: number;
  /** Контури (stroke) у коробці 100×100. Префікс «F:» — фігура з заливкою
   *  кольором фону: закриває лінії позаду (напр. портал опери перед куполом).
   *  «T:» — тонкі лінії фактури (кладка, об'єм веж); «D:» — темна заливка. */
  paths: string[];
  circles?: [number, number, number][];
};

/** З заходу на схід: від дельти Дунаю до Одеси. */
const MARKS: Mark[] = [
  {
    key: "vylkove", x: 105, uk: "Вилкове", en: "Vylkove", noteUk: "Українська Венеція в дельті Дунаю", noteEn: "The Ukrainian Venice in the Danube delta",
    href: "/napryamky/vylkove", lat: 45.4028, lon: 29.5867,
    paths: [
      "M-6 78 V58 H20 V78",
      "M-11 60 L7 43 L25 60",
      "M-2 52 L1 56 M7 47 V56 M16 52 L13 56",
      "M3 64 H11 V72 H3 Z",
      "M-10 78 H26",
      "M-6 78 V100 M7 78 V100 M20 78 V100",
      "M98 44 L82 100",
      "F:M28 86 H96 Q91 96 79 96 H43 Q33 96 28 86 Z",
      "M34 90 H90",
      "M76 60 V75 M76 75 L73 86 M76 75 L79 86",
      "M76 64 L84 68 M76 66 L86 72",
      "M104 100 Q103 82 106 62",
      "D:M104.6 62 Q106 55 107.4 62 V70 Q106 73 104.6 70 Z",
      "M106 55 V50",
      "M112 100 Q112 86 114 70",
      "D:M112.6 70 Q114 63 115.4 70 V77 Q114 80 112.6 77 Z",
      "M114 63 V58",
      "M108 100 Q111 88 120 80",
      "M101 100 Q98 90 94 86",
    ],
    circles: [[76, 56, 3.4]],
  },
  {
    key: "izmail", x: 285, uk: "Ізмаїл", en: "Izmail", noteUk: "Мечеть фортеці — тепер музей-діорама штурму", noteEn: "The fortress mosque — now a diorama museum",
    href: "/napryamky/izmayil", lat: 45.3441, lon: 28.8342,
    paths: [
      "M0 100 L10 84 H90 L100 100",
      "M22 84 V62 H64 V84",
      "M20 62 H66",
      "M27 62 Q27 38 43 34 Q59 38 59 62",
      "T:M35 61 Q35 42 43 34 M51 61 Q51 42 43 34",
      "M43 34 V14",
      "D:M40.8 25 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 Z",
      "M37 84 V73 Q43 66 49 73 V84",
      "M26 78 V71 Q28.5 67.5 31 71 V78 M55 78 V71 Q57.5 67.5 60 71 V78",
      "M74 79 L92 72",
      "M75 82 L90 76",
      "T:M6 98 L12 90 M14 98 L19 91 M84 98 L89 91 M92 98 L96 92",
    ],
    circles: [[78, 80, 4.2]],
  },
  {
    key: "bolhrad", x: 460, uk: "Болград", en: "Bolhrad", noteUk: "Болгарська столиця Бессарабії", noteEn: "The Bulgarian capital of Bessarabia",
    href: "/napryamky/bolhrad", lat: 45.6772, lon: 28.6136,
    paths: [
      "M12 100 V62 H88 V100",
      "M10 62 H90",
      "M38 53 V36 H62 V53",
      "M42 48 V42 Q43.5 40 45 42 V48 M48.5 48 V42 Q50 40 51.5 42 V48 M55 48 V42 Q56.5 40 58 42 V48",
      "M36 36 H64",
      "M38 36 Q38 18 50 15 Q62 18 62 36",
      "T:M44 35 Q44 21 50 15 M56 35 Q56 21 50 15",
      "M47 15 V11 H53 V15",
      "M50 11 V2 M46.5 5.5 H53.5",
      "F:M33 62 L50 50 L67 62 Z",
      "M33 65 H67",
      "M37 100 V65 M44 100 V65 M56 100 V65 M63 100 V65",
      "M46 100 V89 Q50 84 54 89 V100",
      "M12 62 V48 H26 V62",
      "M12 48 Q19 37 26 48",
      "M19 40 V33 M16.5 35.5 H21.5",
      "M74 62 V48 H88 V62",
      "M74 48 Q81 37 88 48",
      "M81 40 V33 M78.5 35.5 H83.5",
      "M18 92 V78 Q21 74 24 78 V92 M76 92 V78 Q79 74 82 78 V92",
    ],
  },
  {
    key: "tuzly", x: 640, uk: "Тузлівські лимани", en: "Tuzly estuaries", noteUk: "Лимани, рожеві фламінго й дикі пляжі", noteEn: "Estuaries, flamingos and wild beaches",
    href: "/mistse/natsionalnyy-pryrodnyy-park-tuzlovski-lymany-bl1h1c", lat: 45.8418, lon: 29.6279,
    paths: [
      "M8 100 Q7 80 10 60",
      "D:M8.6 60 Q10 52 11.4 60 V69 Q10 72 8.6 69 Z",
      "M10 52 V47",
      "M15 100 Q16 86 18 74",
      "D:M16.6 74 Q18 67 19.4 74 V81 Q18 84 16.6 81 Z",
      "M18 67 V63",
      "M4 100 Q2 88 -4 82",
      "M12 100 Q17 90 25 86",
      "M26 44 Q32 32 49 33 Q63 34 65 44 Q63 54 49 56 Q35 57 26 44 Z",
      "M26 44 L19 46 L26 49",
      "M33 44 Q43 36 59 42",
      "T:M37 47 Q45 43 55 47 M41 51 Q49 48 57 51",
      "M63 40 Q73 32 69 22 Q64 12 71 6 Q77 2 81 7",
      "M81 7 Q84 9 83 13",
      "M83 13 L85 19 Q82.5 19 80.5 14.5",
      "D:M84 16.5 L85 19 L82.6 18.4 Z",
      "M46 56 V99",
      "M42 99 H50",
      "M51 56 L56 68 L45 72",
    ],
  },
  {
    key: "akkerman", x: 830, uk: "Аккерманська фортеця", en: "Akkerman Fortress", noteUk: "Одна з найбільших фортець України", noteEn: "One of Ukraine's largest fortresses",
    href: "/mistse/akkermanska-fortetsya-8xgh8g", lat: 46.2005, lon: 30.3507,
    paths: [
      "M8 100 V46 H30 V100",
      "M8 46 V40 H12 V46 M15.5 46 V40 H19.5 V46 M23 46 V40 H27 V46 M30 46 V40",
      "M66 100 V34 H88 V100",
      "M63 34 L77 9 L91 34",
      "M63 34 H91",
      "M30 66 H66",
      "M30 66 V60 H35 V66 M39.5 66 V60 H44.5 V66 M49 66 V60 H54 V66 M58.5 66 V60 H63.5 V66",
      "T:M30 72 H66 M39.0 72 V78 M48.0 72 V78 M57.0 72 V78 M30 78 H66 M34.5 78 V84 M43.5 78 V84 M52.5 78 V84 M61.5 78 V84 M30 84 H66 M39.0 84 V90 M48.0 84 V90 M57.0 84 V90 M30 90 H66 M34.5 90 V96 M43.5 90 V96 M52.5 90 V96 M61.5 90 V96 M30 96 H66 M39.0 96 V100 M48.0 96 V100 M57.0 96 V100",
      "T:M8 52 Q19.0 54.6 30 52 M15.7 54.3 V61.3 M23.4 54.3 V61.3 M8 59 Q19.0 61.6 30 59 M19.4 61.3 V68.3 M8 66 Q19.0 68.6 30 66 M15.7 68.3 V75.3 M23.4 68.3 V75.3 M8 73 Q19.0 75.6 30 73 M19.4 75.3 V82.3 M8 80 Q19.0 82.6 30 80 M15.7 82.3 V89.3 M23.4 82.3 V89.3 M8 87 Q19.0 89.6 30 87 M19.4 89.3 V96.3 M8 94 Q19.0 96.6 30 94 M15.7 96.3 V101.3 M23.4 96.3 V101.3",
      "T:M66 40 Q77.0 42.6 88 40 M73.7 42.3 V49.3 M81.4 42.3 V49.3 M66 47 Q77.0 49.6 88 47 M77.4 49.3 V56.3 M66 54 Q77.0 56.6 88 54 M73.7 56.3 V63.3 M81.4 56.3 V63.3 M66 61 Q77.0 63.6 88 61 M77.4 63.3 V70.3 M66 68 Q77.0 70.6 88 68 M73.7 70.3 V77.3 M81.4 70.3 V77.3 M66 75 Q77.0 77.6 88 75 M77.4 77.3 V84.3 M66 82 Q77.0 84.6 88 82 M73.7 84.3 V91.3 M81.4 84.3 V91.3 M66 89 Q77.0 91.6 88 89 M77.4 91.3 V98.3 M66 96 Q77.0 98.6 88 96 M73.7 98.3 V101.3 M81.4 98.3 V101.3",
      "F:M41 100 V86 Q48 76 55 86 V100 Z",
      "M41 86 H55",
      "F:M17.5 55 H20.5 V64 H17.5 Z",
      "F:M75.5 45 H78.5 V56 H75.5 Z",
      "F:M75.5 69 H78.5 V79 H75.5 Z",
    ],
  },
  {
    key: "shabo", x: 1005, uk: "Шабо", en: "Shabo", noteUk: "Вино з 1822 року — колонія швейцарців", noteEn: "Wine since 1822 — a Swiss colony",
    href: "/mistse/tsentr-kultury-vyna-shabo-bqalqv", lat: 46.1431, lon: 30.3736,
    paths: [
      "M14 100 V66 Q14 58 20 54 V38 H27 V54 Q33 58 33 66 V100 Z",
      "M18 32 H29 V38 H18 Z",
      "T:M20.5 32 V27 H26.5 V32",
      "M16 74 H31 V88 H16 Z",
      "T:M19 79 H28 M20 83 H27",
      "T:M17 62 Q16.5 66 16.5 70",
      "M48 60 Q48 78 59 80 Q70 78 70 60 Z",
      "M50 68 H68",
      "M59 80 V97 M51 98 H67",
      "M56 30 Q68 20 80 28",
      "M80 28 Q83 28 84 30",
      "M78 24 q10 -14 20 -4 q-6 12 -20 4",
      "T:M80 23 Q88 18 96 19 M86 20 L88 15 M91 19 L93 15",
      "M56 30 q-4 -6 1 -9 q4 -1 3 3",
    ],
    circles: [[80, 34, 4.2], [88, 34, 4.2], [76, 41, 4.2], [84, 41, 4.2], [92, 41, 4.2], [80, 48, 4.2], [88, 48, 4.2], [84, 55, 4.2]],
  },
  {
    key: "opera", x: 1200, uk: "Одеська опера", en: "Odesa Opera", noteUk: "Символ Одеси з 1887 року", noteEn: "Odesa's landmark since 1887",
    href: "/mistse/odeskyy-natsionalnyy-akademichnyy-teatr-opery-ta-baletu-hpp64d", lat: 46.4855, lon: 30.7412,
    paths: [
      "M4 100 V75 Q4 68 11 68 H89 Q96 68 96 75 V100",
      "M18 68 Q21 37 50 32 Q79 37 82 68",
      "M33 67 Q36 45 50 32 M67 67 Q64 45 50 32",
      "M46 32 V27 H54 V32",
      "M46 27 Q50 22 54 27",
      "M11 84 V79 Q13.5 75.5 16 79 V84 M21 84 V79 Q23.5 75.5 26 79 V84 M74 84 V79 Q76.5 75.5 79 79 V84 M84 84 V79 Q86.5 75.5 89 79 V84",
      "M11 96 V90 H16 V96 M21 96 V90 H26 V96 M74 96 V90 H79 V96 M84 96 V90 H89 V96",
      "F:M38 100 V58 H62 V100 Z",
      "M35 58 H65",
      "M43 100 V87 Q50 77 57 87 V100",
      "M44 74 V69 Q50 63 56 69 V74",
      "F:M42 58 V54 H58 V58 Z",
      "F:M46.5 54 L50 46.5 L53.5 54 Z", "M46 50 L44 47 M54 50 L56 47",
      "M39 58 V53 M61 58 V53",
    ],
    circles: [[50, 44.2, 2]],
  },
  {
    key: "lighthouse", x: 1400, uk: "Одеський маяк", en: "Odesa lighthouse", noteUk: "Морські ворота міста", noteEn: "The city's sea gate",
    href: "/napryamky/odesa", lat: 46.4993, lon: 30.7633,
    paths: [
      "M22 100 V93 H78 V100",
      "T:M30 93 V100 M38 93 V100 M62 93 V100 M70 93 V100 M22 96.5 H38 M62 96.5 H78",
      "M38 93 L42 42 H58 L62 93",
      "M40 76 H60 M41 60 H59",
      "M49 50 V55 H51 V50 Z M49 66 V71 H51 V66 Z",
      "M34 42 H66",
      "M37 42 V36 M63 42 V36 M37 36 H63",
      "T:M43.5 42 V36 M50 42 V36 M56.5 42 V36",
      "M42 36 V25 H58 V36",
      "M50 36 V25",
      "M40 25 L50 15 L60 25",
      "M50 15 V10",
      "M47 93 V85 Q50 81 53 85 V93",
      "M66 29 L92 22 M66 32 L94 35",
      "M34 29 L8 22 M34 32 L6 35",
      "M72 10 q4 -4 8 0 q4 -4 8 0",
    ],
  },
];

/** Лінія берега: легкі хвилі, а під кожною пам'яткою — рівно. */
function coastPath() {
  let d = `M -20 ${BASE}`;
  for (let x = 0; x <= W + 20; x += 8) {
    const near = MARKS.some((m) => Math.abs(m.x - x) < 54);
    const y = near ? BASE : BASE + 4.5 * Math.sin(x / 19) + 2 * Math.sin(x / 7);
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return d;
}

/**
 * Варіант 1 «Берег Одещини»: одна лінія малюється зліва направо, на ній —
 * силуети від дельти Дунаю до Одеси. Наведення — підпис і відстань, клік —
 * сторінка місця.
 */
export function Coastline() {
  const { lang } = useV2();
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);
  const d = useMemo(coastPath, []);
  const act = MARKS.find((m) => m.key === active);

  const draw = (delay: number, duration = 0.9) => ({
    initial: reduce ? false : { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true, margin: "-80px" },
    transition: { pathLength: { duration, delay, ease: EASE }, opacity: { duration: 0.2, delay } },
  });

  // Прокрутка вбік потрібна лише на телефоні — і вона обрізала б підказку
  // зверху, тому там є запас місця над панорамою (pt/-mt); з sm — без обрізання.
  return (
    <div className="no-scrollbar -mx-5 -mt-28 overflow-x-auto px-5 pt-28 sm:-mx-6 sm:mt-0 sm:overflow-visible sm:px-0 sm:pt-0 lg:-mx-10">
      <div className="relative mx-auto min-w-[980px] max-w-[1280px]">
        <svg viewBox={`0 ${VB_Y} ${W} ${VB_H}`} className="block w-full overflow-visible" role="group" aria-label={lang === "en" ? "Coast of Odesa Region" : "Берег Одещини"}>
          {/* Сонце над морем */}
          <motion.circle cx={735} cy={70} r={26} fill="none" stroke="#df9b3b" strokeWidth={2} {...draw(0.6, 1.2)} />
          <motion.path d="M735 30 V20 M735 120 V110 M695 70 H685 M785 70 H775 M707 42 L700 35 M770 105 L763 98 M763 42 L770 35 M700 105 L707 98" stroke="#df9b3b" strokeWidth={2} strokeLinecap="round" fill="none" {...draw(1.4, 0.8)} />

          <motion.path d={d} fill="none" stroke="#002f5e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...draw(0, 2.4)} />
          {/* Друга, тонша хвиля — море під берегом */}
          <motion.path d={`M -20 ${BASE + 22} ` + Array.from({ length: Math.ceil((W + 40) / 40) }, () => "q 20 -7 40 0").join(" ")} fill="none" stroke="#002f5e" strokeOpacity={0.25} strokeWidth={1.5} {...draw(0.4, 2.4)} />

          {MARKS.map((m) => {
            const on = active === m.key;
            const delay = 0.3 + (m.x / W) * 2;
            const label = lang === "en" ? m.en : m.uk;
            return (
              <g
                key={m.key}
                role="link"
                tabIndex={0}
                aria-label={label}
                onMouseEnter={() => setActive(m.key)}
                onMouseLeave={() => setActive((a) => (a === m.key ? null : a))}
                onFocus={() => setActive(m.key)}
                onBlur={() => setActive(null)}
                onClick={() => navigate(m.href)}
                onKeyDown={(e) => { if (e.key === "Enter") navigate(m.href); }}
                className="cursor-pointer outline-none"
              >
                {/* Зона наведення більша за малюнок */}
                <rect x={m.x - 62} y={BASE - ICON - 20} width={124} height={ICON + 64} fill="transparent" />
                <g
                  transform={`translate(${m.x - ICON / 2} ${BASE - ICON})`}
                  style={{ transform: `translate(${m.x - ICON / 2}px, ${BASE - ICON - (on ? 8 : 0)}px)`, transition: "transform .45s cubic-bezier(0.22,1,0.36,1)" }}
                >
                  {m.paths.map((p, i) => (
                    <motion.path
                      key={i}
                      d={/^[FTD]:/.test(p) ? p.slice(2) : p}
                      fill={p.startsWith("F:") ? "#fff2e8" : p.startsWith("D:") ? (on ? "#9f1f47" : "#002f5e") : "none"}
                      stroke={on ? "#9f1f47" : "#002f5e"}
                      strokeWidth={p.startsWith("T:") ? 1 : 2}
                      strokeOpacity={p.startsWith("T:") ? 0.45 : 1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ transition: "stroke .3s" }}
                      {...draw(delay + i * 0.06)}
                    />
                  ))}
                  {m.circles?.map(([cx, cy, r], i) => (
                    <motion.circle key={i} cx={cx} cy={cy} r={r} fill={on ? "#9f1f47" : "none"} stroke={on ? "#9f1f47" : "#002f5e"} strokeWidth={2} style={{ transition: "fill .3s, stroke .3s" }} {...draw(delay + 0.3 + i * 0.05, 0.5)} />
                  ))}
                </g>
                <motion.text
                  x={m.x}
                  y={BASE + 48}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={on ? 700 : 500}
                  fill={on ? "#9f1f47" : "#002f5e"}
                  fillOpacity={on ? 1 : 0.6}
                  initial={reduce ? false : { opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: delay + 0.5 }}
                >
                  {label}
                </motion.text>
                {/* Точка-«пін» на лінії */}
                <circle cx={m.x} cy={BASE} r={on ? 5 : 3.5} fill={on ? "#df9b3b" : "#002f5e"} style={{ transition: "r .3s, fill .3s" }} />
              </g>
            );
          })}
        </svg>

        {/* Підказка над активною пам'яткою */}
        <AnimatePresence>
          {act && (
            <motion.div
              key={act.key}
              initial={{ opacity: 0, y: 8, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 4, x: "-50%" }}
              transition={{ duration: 0.25, ease: EASE }}
              className="pointer-events-none absolute z-10 w-[230px] rounded-[16px] bg-o-sea px-4 py-3 text-o-sand shadow-[0_20px_40px_-18px_rgba(0,30,70,0.6)]"
              style={{ left: `${(Math.min(Math.max(act.x, 130), W - 130) / W) * 100}%`, bottom: `${((VB_Y + VB_H - (BASE - ICON - 24)) / VB_H) * 100}%` }}
            >
              <p className="text-[15px] font-bold leading-tight">{lang === "en" ? act.en : act.uk}</p>
              <p className="mt-1 text-[13px] leading-snug text-o-sand/75">{lang === "en" ? act.noteEn : act.noteUk}</p>
              <p className="mt-2 flex items-center justify-between text-[12px] font-semibold text-o-sun">
                {act.key === "opera" || act.key === "lighthouse"
                  ? (lang === "en" ? "In Odesa" : "В Одесі")
                  : `≈ ${Math.round(kmFromOdesa(act.lat, act.lon))} ${lang === "en" ? "km from Odesa" : "км від Одеси"}`}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
