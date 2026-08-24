import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Gauge, Headphones, Pause, Play } from "lucide-react";

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
const fmtSpeed = (v: number) => (Number.isInteger(v) ? `${v}` : v.toFixed(2).replace(/0$/, ""));

/**
 * Плеєр аудіогіда для сторінки об'єкта: велика кнопка play/pause, "танцюючий"
 * еквалайзер під час відтворення (CSS-анімація, вимикається при
 * prefers-reduced-motion), клікабельний прогрес-бар.
 */
export const AudioGuidePlayer = ({ src, accent }: { src: string; accent: string }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const speedMenuRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onEnd = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    el.addEventListener("waiting", onWaiting);
    el.addEventListener("playing", onPlaying);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("waiting", onWaiting);
      el.removeEventListener("playing", onPlaying);
    };
  }, []);

  // playbackRate скидається браузером при зміні src, тож застосовуємо
  // поточну швидкість щоразу, коли вона міняється або аудіо перезавантажується.
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = speed;
  }, [speed, src]);

  useEffect(() => {
    if (!speedMenuOpen) return;
    const onClickAway = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setSpeedMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [speedMenuOpen]);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else void el.play();
    setPlaying(!playing);
  };

  const seek = (clientX: number) => {
    const el = audioRef.current;
    const bar = barRef.current;
    if (!el || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    el.currentTime = pct * duration;
    setCurrent(pct * duration);
  };

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-4 rounded-[22px] border p-4 sm:p-5"
      style={{ borderColor: `${accent}35`, backgroundColor: `${accent}0e` }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <motion.button
        type="button"
        onClick={toggle}
        whileTap={{ scale: 0.9 }}
        aria-label={playing ? "Пауза" : "Слухати аудіогід"}
        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-lg"
        style={{ backgroundColor: accent, boxShadow: `0 8px 24px -8px ${accent}90` }}
      >
        {loading && playing ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : playing ? (
          <Pause className="h-5 w-5" fill="currentColor" />
        ) : (
          <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
        )}
        {/* пульсуюче кільце під час відтворення */}
        {playing && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: `2px solid ${accent}` }}
            animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </motion.button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Headphones className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
            <span className="text-[12px] uppercase tracking-[0.14em] font-odesa-medium" style={{ color: accent }}>
              Аудіогід
            </span>

            {/* еквалайзер — "танцює" тільки поки грає; вимкнено при reduced-motion */}
            <span className="ml-1 flex items-end gap-[2.5px]" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={playing ? "eq-bar eq-bar-anim" : "eq-bar"}
                  style={{
                    backgroundColor: accent,
                    animationDelay: `${i * 0.12}s`,
                    height: playing ? undefined : "4px",
                  }}
                />
              ))}
            </span>
          </div>

          <div ref={speedMenuRef} className="relative shrink-0">
            <motion.button
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => setSpeedMenuOpen((v) => !v)}
              aria-label="Швидкість відтворення"
              aria-expanded={speedMenuOpen}
              className="flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-odesa-medium tabular-nums"
              style={{
                borderColor: `${accent}35`,
                backgroundColor: speedMenuOpen ? `${accent}22` : `${accent}14`,
                color: accent,
              }}
            >
              <Gauge className="h-3 w-3" />
              {fmtSpeed(speed)}×
            </motion.button>

            <AnimatePresence>
              {speedMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-[calc(100%+6px)] z-10 min-w-[92px] overflow-hidden rounded-2xl border bg-white py-1 shadow-xl"
                  style={{ borderColor: `${accent}25` }}
                >
                  {SPEEDS.map((v) => {
                    const active = v === speed;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setSpeed(v);
                          setSpeedMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-[13px] font-odesa-regular tabular-nums transition-colors"
                        style={{
                          color: active ? accent : "#002f5e",
                          backgroundColor: active ? `${accent}14` : "transparent",
                        }}
                      >
                        {fmtSpeed(v)}×
                        {active && <Check className="h-3.5 w-3.5" style={{ color: accent }} />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div
          ref={barRef}
          onClick={(e) => seek(e.clientX)}
          className="group relative mt-2.5 h-2 w-full cursor-pointer rounded-full"
          style={{ backgroundColor: `${accent}22` }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: accent, width: `${progress}%` }}
            transition={{ ease: "linear", duration: 0.15 }}
          />
          <motion.div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white shadow transition-opacity opacity-0 group-hover:opacity-100"
            style={{ left: `calc(${progress}% - 7px)`, border: `2px solid ${accent}` }}
          />
        </div>

        <div className="mt-1.5 flex justify-between text-[11px] font-odesa-regular tabular-nums" style={{ color: `${accent}bb` }}>
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <style>{`
        .eq-bar { display: inline-block; width: 2.5px; height: 4px; border-radius: 2px; }
        .eq-bar-anim { animation: eq-bounce 0.9s ease-in-out infinite; }
        @keyframes eq-bounce {
          0%, 100% { height: 4px; }
          50% { height: 13px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .eq-bar-anim { animation: none; height: 8px; }
        }
      `}</style>
    </motion.div>
  );
};

export default AudioGuidePlayer;
