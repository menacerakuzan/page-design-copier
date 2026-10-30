import { useEffect, useRef } from "react";

/**
 * Легкий сніг поверх сторінки: один canvas, ~1 сніжинка на 28 000 px²
 * (не більше 70), рух — падіння з бічним «гойданням». Сніжинки мають
 * блакитний ореол, тож видно і на темно-синьому, і на бежевому тлі.
 * Не малює при «зменшити рух» і ставиться на паузу у фоновій вкладці.
 */

type Flake = { x: number; y: number; r: number; vy: number; phase: number; sway: number; crystal: boolean };

export default function Snowfall() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];
    let raf = 0;
    let last = 0;

    const spawn = (anywhere: boolean): Flake => {
      const r = Math.random() < 0.06 ? 3 + Math.random() * 1.6 : 0.9 + Math.random() * 1.5;
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -10,
        r,
        vy: 18 + r * 9 + Math.random() * 10,
        phase: Math.random() * Math.PI * 2,
        sway: 10 + Math.random() * 24,
        crystal: r > 3,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.min(70, Math.round((w * h) / 28000));
      flakes = Array.from({ length: target }, () => spawn(true));
    };

    const crystal = (x: number, y: number, r: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r * 1.6);
        ctx.moveTo(0, -r * 0.9);
        ctx.lineTo(r * 0.45, -r * 1.25);
        ctx.moveTo(0, -r * 0.9);
        ctx.lineTo(-r * 0.45, -r * 1.25);
        ctx.rotate(Math.PI / 3);
      }
      ctx.stroke();
      ctx.restore();
    };

    const frame = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.vy * dt;
        f.phase += dt * 0.9;
        const x = f.x + Math.sin(f.phase) * f.sway;
        if (f.y > h + 12) Object.assign(f, spawn(false));
        if (f.crystal) {
          ctx.strokeStyle = "rgba(120,170,225,0.55)";
          ctx.lineWidth = 2.4;
          crystal(x, f.y, f.r, f.phase * 0.3);
          ctx.strokeStyle = "rgba(255,255,255,0.95)";
          ctx.lineWidth = 1.1;
          crystal(x, f.y, f.r, f.phase * 0.3);
        } else {
          ctx.fillStyle = "rgba(120,170,225,0.35)";
          ctx.beginPath();
          ctx.arc(x, f.y, f.r + 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.beginPath();
          ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (document.visibilityState === "visible") {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[44] h-full w-full print:hidden" />;
}
