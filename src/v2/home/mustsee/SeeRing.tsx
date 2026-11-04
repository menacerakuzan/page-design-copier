import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, type PanInfo } from "framer-motion";
import { MapPin } from "lucide-react";
import { Img } from "@/components/Img";
import { useV2 } from "@/v2/i18n";
import { EASE } from "@/v2/components/ui";
import type { SeeItem } from "./data";
import { Dots } from "./Dots";
import { useWheelSwipe } from "./useWheelSwipe";

/**
 * Варіант 2 «Кільце»: фото стоять по колу, а глядач — усередині нього.
 * Ближнє фото рівно перед нами, бічні загинаються до нас і витягуються
 * до країв — як стіни круглої панорамної галереї.
 */
export function SeeRing({ items }: { items: SeeItem[] }) {
  const { lang } = useV2();
  const n = items.length;
  const step = 360 / n;
  const [vw, setVw] = useState(1440);
  const rot = useMotionValue(0);
  const [deg, setDeg] = useState(0);
  const dragStart = useRef(0);
  const dragged = useRef(false);
  useMotionValueEvent(rot, "change", (v) => setDeg(v));

  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const mobile = vw < 640;
  // Центральне фото — нормального розміру, сусідні вже частково за краєм екрана.
  const W = Math.round(mobile ? vw * 0.62 : Math.min(790, vw * 0.47));
  const H = Math.round(W * 0.64);
  const GAP = Math.round(W * 0.05);
  // Радіус кола, на якому фото стоять впритул (з проміжком).
  const R = (W + GAP) / (2 * Math.tan(Math.PI / n));
  // Глядач трохи позаду центру кола (але всередині) — менше спотворень.
  const P = R * 1.3;

  const idx = ((Math.round(deg / step) % n) + n) % n;
  const cur = items[idx];

  const snapTo = (target: number) => animate(rot, target, { duration: 0.8, ease: EASE });
  const go = (d: number) => snapTo(Math.round(rot.get() / step) * step + d * step);

  const onPanStart = () => { dragStart.current = rot.get(); dragged.current = false; rot.stop(); };
  const onPan = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 4) dragged.current = true;
    rot.set(dragStart.current - info.offset.x * (step / (W * 0.9)));
  };
  const onPanEnd = (_: unknown, info: PanInfo) => {
    const fling = -info.velocity.x * (step / W) * 0.25;
    snapTo(Math.round((rot.get() + fling) / step) * step);
  };

  // Тачпад: кільце крутиться за пальцями, після жесту — до найближчого фото.
  const regionRef = useRef<HTMLDivElement>(null);
  useWheelSwipe(
    regionRef,
    (dx) => { rot.stop(); rot.set(rot.get() + dx * (step / (W * 0.9))); },
    () => snapTo(Math.round(rot.get() / step) * step),
  );

  return (
    <div onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}>
      <motion.div
        ref={regionRef}
        className="relative w-full cursor-grab touch-pan-y select-none overflow-x-clip active:cursor-grabbing"
        style={{ height: H * 1.18 }}
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
        role="region"
        aria-roledescription="carousel"
        aria-label={lang === "en" ? "Must see" : "Варто побачити"}
      >
        {/* Кожне фото має власну 3D-трансформацію (без preserve-3d) —
            так Chrome на телефоні не губить бічні фото. */}
        <div className="absolute left-1/2 top-1/2">
          {items.map((c, i) => {
            // Кут фото відносно напрямку погляду (-180..180).
            const a = ((((-i * step + deg) % 360) + 540) % 360) - 180;
            const on = Math.abs(a) < step / 2;
            const hidden = Math.abs(a) > 80;
            return (
              <div
                key={c.id}
                className="absolute overflow-hidden rounded-[22px] bg-o-sand2 shadow-[0_24px_44px_-26px_rgba(0,30,70,0.6)]"
                style={{
                  width: W,
                  height: H,
                  marginLeft: -W / 2,
                  marginTop: -H / 2,
                  transform: `perspective(${P}px) translateZ(${R}px) rotateY(${a}deg) translateZ(${-R}px)`,
                  visibility: hidden ? "hidden" : "visible",
                }}
                aria-hidden={!on}
              >
                {/* Один і той самий елемент для всіх фото — під час гортання нічого не
                    перестворюється, тож картинки не блимають. Бічне фото — крок до нього. */}
                <Link
                  to={c.href ?? "#"}
                  draggable={false}
                  tabIndex={on ? 0 : -1}
                  onClick={(e) => {
                    if (dragged.current || !on) e.preventDefault();
                    if (!on && !dragged.current) go(-Math.round(a / step));
                  }}
                  className="group block h-full w-full"
                >
                  <Img src={c.image} w={1000} quality={85} priority alt="" draggable={false} className={`h-full w-full object-cover transition-transform duration-[1.2s] ease-out ${on ? "group-hover:scale-[1.04]" : ""}`} />
                </Link>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Підпис фото, що перед нами */}
      <div className="mx-auto mt-2 flex max-w-[1280px] flex-col items-center gap-5 px-5 text-center sm:px-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={cur.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }} aria-live="polite">
            <h3 className="text-[24px] font-bold leading-tight sm:text-[30px]">
              <Link to={cur.href ?? "#"} className="transition-colors hover:text-o-wine">{cur.title}</Link>
            </h3>
            {cur.place && <p className="mx-auto mt-1 max-w-[560px] text-[14px] text-o-sea/55"><MapPin className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-o-wine" aria-hidden="true" />{cur.place}</p>}
          </motion.div>
        </AnimatePresence>
        <Dots count={n} active={idx} onPick={(i) => { let d = i - idx; if (d > n / 2) d -= n; if (d < -n / 2) d += n; go(d); }} />
      </div>
    </div>
  );
}
