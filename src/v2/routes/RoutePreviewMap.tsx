import { useId, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useV2 } from "@/v2/i18n";
import { DISTRICT_SHAPES, labelPos, projectLonLat } from "@/v2/lib/districtShapes";
import type { RouteItem } from "./useRoutesPage";

/*
 * Міні-карта маршруту для картки — та сама проста карта районів, що й
 * фільтр у шапці (контури з districtShapes, уже є в коді сайту): райони
 * маршруту трохи підфарбовані й підписані, поверх — пунктир шляху і
 * пронумеровані зупинки. Жодних тайлів і зовнішніх запитів — усе рахується
 * тут же з координат.
 *
 * Наближення обмежене: кадр не вужчий за ~третину області, щоб і маршрут
 * в одному місті показувався в контексті свого району.
 * (Варіант на детальній базовій карті з морем, лиманами й містами —
 * useful/v2/routes/basemap/.)
 */

const W = 320; // кадр 16:10, як фото картки
const H = 200;
const MIN_W = 280; // найвужчий кадр в одиницях карти (уся область — 600)
const PAD = 60;

const ODESA = projectLonLat(30.7233, 46.4825);

/** Плавна крива через точки. */
function curve(pts: [number, number][]) {
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

export const hasPreview = (x: RouteItem) => x.line.length > 0 || x.marks.length > 0;

export function RoutePreviewMap({ x, show, names }: { x: RouteItem; show: boolean; names: Map<string, { short: string }> }) {
  const { lang } = useV2();
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");

  const fr = useMemo(() => {
    // Лінія — через зупинки (у порядку з адмінки); точки посилання — лише
    // коли зупинок із координатами менше двох.
    const stops = x.marks.map((m) => [m.x, m.y] as [number, number]);
    const pts = stops.length ? stops : x.line;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    let w = Math.max(Math.max(...xs) - Math.min(...xs) + PAD * 2, MIN_W);
    let h = Math.max(...ys) - Math.min(...ys) + PAD * 2;
    if (w / h < W / H) w = (h * W) / H;
    else h = (w * H) / W;
    const box = { x: cx - w / 2, y: cy - h / 2, w, h };
    const u = w / W; // «піксель» картки в одиницях карти

    // Зупинки майже в одній точці (сироварня й Шабо — 200 м) розводимо,
    // щоб номери не накривали один одного.
    const marks = stops.map((p) => [...p] as [number, number]);
    const GAP = 20 * u;
    for (let pass = 0; pass < 6; pass++) {
      for (let i = 0; i < marks.length; i++) {
        for (let j = i + 1; j < marks.length; j++) {
          const dx = marks[j][0] - marks[i][0];
          const dy = marks[j][1] - marks[i][1];
          const dist = Math.hypot(dx, dy);
          if (dist >= GAP) continue;
          const [ux, uy] = dist > 0.01 ? [dx / dist, dy / dist] : [0.8, -0.6];
          const push = (GAP - dist) / 2;
          marks[i] = [marks[i][0] - ux * push, marks[i][1] - uy * push];
          marks[j] = [marks[j][0] + ux * push, marks[j][1] + uy * push];
        }
      }
    }
    const line = marks.length > 1 ? marks : x.line;
    const inBox = ([px, py]: [number, number], m = 0) => px > box.x + m && px < box.x + box.w - m && py > box.y + m && py < box.y + box.h - m;
    return { box, u, marks, line, inBox };
  }, [x]);

  const { box, u, marks, inBox } = fr;
  const line = fr.line.length > 1 ? curve(fr.line) : "";
  const end = fr.line[fr.line.length - 1];
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full bg-[#f4ebe1]" aria-hidden="true">
      <defs>
        {/* Область маски — явно по кадру: типові -10%/120% рахуються від нуля, а кадр зсунутий */}
        <mask id={`${uid}-draw`} maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
          <motion.path
            d={line}
            fill="none"
            stroke="#fff"
            strokeWidth={16 * u}
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: show || reduce ? 1 : 0 }}
            transition={{ duration: show ? 1.1 : 0.2, delay: show ? 0.25 : 0, ease: "easeInOut" }}
          />
        </mask>
      </defs>

      {/* Райони — як на карті-фільтрі в шапці; райони маршруту підфарбовані */}
      {Object.entries(DISTRICT_SHAPES).map(([slug, s]) => {
        const own = x.districts.includes(slug);
        return (
          <path
            key={slug}
            d={s.d}
            fill={own ? "rgba(159,31,71,0.1)" : "rgba(0,47,94,0.05)"}
            stroke="rgba(0,47,94,0.38)"
            strokeWidth={1.1 * u}
            strokeLinejoin="round"
          />
        );
      })}

      {/* Назви районів у кадрі */}
      {(() => {
        // Підписи районів не налазять один на одного (Болградський і Білгород-Дністровський поруч)
        const placed: [number, number, number, number][] = [];
        return Object.keys(DISTRICT_SHAPES).map((slug) => {
        const [lx, ly] = labelPos(slug);
        const n = (names.get(slug)?.short ?? "").toUpperCase();
        const half = (n.length * 5.2 * u) / 2 + 6 * u;
        if (!inBox([lx, ly], 12 * u) || box.w < half * 2) return null;
        // Довгу назву («Білгород-Дністровський») зсуваємо всередину кадру
        const tx = Math.min(Math.max(lx, box.x + half), box.x + box.w - half);
        const b: [number, number, number, number] = [tx - half, ly - 8 * u, tx + half, ly + 2 * u];
        if (placed.some((q) => !(b[2] < q[0] || b[0] > q[2] || b[3] < q[1] || b[1] > q[3]))) return null;
        placed.push(b);
        return (
          <text key={slug} x={tx} y={ly} textAnchor="middle" fontSize={7.5 * u} fontWeight="700" letterSpacing={0.9 * u} fill="#002f5e" fillOpacity="0.38">
            {n}
          </text>
        );
        });
      })()}

      {/* Одеса — для орієнтиру */}
      {inBox(ODESA, 6 * u) && !marks.some(([mx, my]) => Math.hypot(mx - ODESA[0], my - ODESA[1]) < 26 * u) && (
        <g>
          <circle cx={ODESA[0]} cy={ODESA[1]} r={2.4 * u} fill="#002f5e" fillOpacity="0.6" />
          <text x={ODESA[0] + 4.5 * u} y={ODESA[1] + 2.8 * u} fontSize={8 * u} fontWeight="700" fill="#002f5e" fillOpacity="0.6">
            {lang === "en" ? "Odesa" : "Одеса"}
          </text>
        </g>
      )}

      {/* Шлях */}
      {line && (
        <g mask={`url(#${uid}-draw)`}>
          <path d={line} fill="none" stroke="#fff2e8" strokeOpacity="0.95" strokeWidth={6 * u} strokeLinecap="round" strokeLinejoin="round" />
          <path d={line} fill="none" stroke="#9f1f47" strokeWidth={2.6 * u} strokeLinecap="round" strokeDasharray={`${0.1 * u} ${6 * u}`} />
        </g>
      )}

      {/* Зупинки з’являються по черзі, слідом за лінією */}
      {marks.map(([mx, my], i) => (
        <motion.g
          key={i}
          initial={false}
          animate={show || reduce ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.45, delay: show ? 0.3 + i * 0.12 : 0, ease }}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        >
          <circle cx={mx} cy={my} r={9.5 * u} fill="#fff2e8" stroke="#9f1f47" strokeWidth={2 * u} />
          <text x={mx} y={my + 3.6 * u} textAnchor="middle" fontSize={10.5 * u} fontWeight="700" fill="#9f1f47">
            {i + 1}
          </text>
        </motion.g>
      ))}

      {/* Лінія без зупинок з координатами — мітка на фініші */}
      {marks.length === 0 && end && (
        <g transform={`translate(${end[0]} ${end[1]}) scale(${u})`}>
          <path d="M0 -22c-6 0-10 4.5-10 10 0 7.5 10 17 10 17s10-9.5 10-17c0-5.5-4-10-10-10z" fill="#9f1f47" />
          <circle cy="-12" r="3.6" fill="#fff2e8" />
        </g>
      )}
    </svg>
  );
}
