import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

const VIDEO_ID = "2OAj2Z1BkAM"; // «Одеса» — Євген Філатов
const DEFAULT_VOLUME = 35; // 0–100, комфортний рівень для фонової музики
const FADE_MS = 1400;
const STORAGE_UNMUTED = "bg-music-unmuted";
const STORAGE_VOLUME = "bg-music-volume";

// ── YouTube IFrame Player API: мінімальні типи, яких нам треба ──────────────
type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (v: number) => void;
  getVolume: () => number;
  seekTo: (s: number, allowSeekAhead: boolean) => void;
};
declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: any) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

/**
 * Фонова музика сайту: стрімиться напряму з YouTube (офіційний embed API —
 * без завантаження/перезаливки аудіофайлу), циклічно, за замовчуванням без
 * звуку (щоб пройти autoplay-політику браузерів і не лякати користувача).
 * Плеєр монтується один раз у App (як MobileNav/AssistantFab) — тому при
 * переході між сторінками не перестворюється і не починає грати заново.
 */
export function BackgroundMusicPlayer() {
  const { pathname } = useLocation();
  // /koshyk і /marshrut мають власну липку CTA-кнопку внизу зліва-направо —
  // піднімаємо кнопку музики вище неї (той самий приём, що і в AssistantFab).
  const raised = pathname === "/koshyk" || pathname === "/marshrut";
  const bottom = raised
    ? "calc(150px + env(safe-area-inset-bottom))"
    : "calc(84px + env(safe-area-inset-bottom))";
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const fadeRaf = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [unmuted, setUnmuted] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT) return;
      // НЕ відновлюємо "звук був увімкнений" автоматично — iOS Safari (і інші
      // мобільні браузери) блокують програмне unMute()/play() без ПРЯМОГО
      // кліку користувача в цьому конкретному завантаженні сторінки. При
      // оновленні (F5) sessionStorage ще живий, і спроба сама розмутити на
      // onReady мовчки провалювалась — кнопка показувала "звук є", а звуку не
      // було. Тепер завжди стартуємо тихо; звук — лише за прямим кліком.
      // Гучність (не пов'язана з autoplay-політикою) відновлюємо як була.
      const savedVolume = Number(sessionStorage.getItem(STORAGE_VOLUME));
      const initialVolume = savedVolume > 0 && savedVolume <= 100 ? savedVolume : DEFAULT_VOLUME;
      sessionStorage.setItem(STORAGE_UNMUTED, "0");
      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          loop: 1,
          playlist: VIDEO_ID, // потрібно для loop:1 на одному відео
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.setVolume(0);
            e.target.mute();
            e.target.playVideo();
            setReady(true);
            setUnmuted(false);
            setVolume(initialVolume);
          },
          onStateChange: (e: { data: number; target: YTPlayer }) => {
            // фолбек на випадок, якщо loop:1 не спрацює (деякі embed-контексти)
            if (window.YT && e.data === window.YT.PlayerState.ENDED) {
              e.target.seekTo(0, true);
              e.target.playVideo();
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (fadeRaf.current) cancelAnimationFrame(fadeRaf.current);
    };
  }, []);

  const fadeTo = (target: number, onDone?: () => void) => {
    const player = playerRef.current;
    if (!player) return;
    if (fadeRaf.current) cancelAnimationFrame(fadeRaf.current);
    const start = player.getVolume();
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / FADE_MS);
      const eased = 1 - (1 - t) * (1 - t); // ease-out
      player.setVolume(Math.round(start + (target - start) * eased));
      if (t < 1) {
        fadeRaf.current = requestAnimationFrame(step);
      } else {
        onDone?.();
      }
    };
    fadeRaf.current = requestAnimationFrame(step);
  };

  const toggle = () => {
    const player = playerRef.current;
    if (!player) return;
    if (unmuted) {
      fadeTo(0, () => player.mute());
      setUnmuted(false);
      sessionStorage.setItem(STORAGE_UNMUTED, "0");
    } else {
      player.unMute();
      fadeTo(volume || DEFAULT_VOLUME);
      setUnmuted(true);
      sessionStorage.setItem(STORAGE_UNMUTED, "1");
    }
  };

  const onSlide = (v: number) => {
    setVolume(v);
    playerRef.current?.setVolume(v);
    sessionStorage.setItem(STORAGE_VOLUME, String(v));
  };

  const showQuiet = !unmuted || volume === 0;

  return (
    <>
      {/* YouTube-плеєр без візуального інтерфейсу — керуємо власним віджетом нижче */}
      <div ref={hostRef} className="pointer-events-none fixed h-0 w-0 overflow-hidden opacity-0" aria-hidden="true" />

      <AnimatePresence>
        {ready && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="fixed left-4 z-30 flex items-center rounded-full border border-[#002f5e]/12 bg-[#fff2e8] text-[#002f5e] shadow-[0_10px_24px_-8px_rgba(0,47,94,0.4)]"
            style={{ bottom }}
          >
            <motion.button
              type="button"
              onClick={toggle}
              whileTap={{ scale: 0.9 }}
              aria-label={unmuted ? "Вимкнути музику" : "Увімкнути музику"}
              aria-pressed={unmuted}
              className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            >
              {showQuiet ? (
                <VolumeX className="h-5 w-5" strokeWidth={2} />
              ) : (
                <span className="relative flex items-center justify-center">
                  <Volume2 className="h-5 w-5" strokeWidth={2} />
                  <span className="absolute -right-1 -top-1 flex items-end gap-[1.5px]" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="bg-note-bar w-[2px] rounded-full bg-[#df9b3b]"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </span>
              )}
            </motion.button>

            {/* ── Ніжний повзунок гучності: з'являється, поки звук увімкнено ── */}
            <AnimatePresence initial={false}>
              {unmuted && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 96, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => onSlide(Number(e.target.value))}
                    aria-label="Гучність фонової музики"
                    className="volume-slider"
                    style={{ ["--pct" as any]: `${volume}%` }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-1" />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .bg-note-bar { height: 4px; animation: note-bounce 0.8s ease-in-out infinite; }
        @keyframes note-bounce { 0%, 100% { height: 3px; } 50% { height: 8px; } }
        @media (prefers-reduced-motion: reduce) { .bg-note-bar { animation: none; height: 5px; } }

        .volume-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 84px;
          height: 14px;
          margin-right: 12px;
          background: transparent;
          cursor: pointer;
        }
        .volume-slider::-webkit-slider-runnable-track {
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(to right, #df9b3b var(--pct), rgba(0,47,94,0.14) var(--pct));
        }
        .volume-slider::-moz-range-track {
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(to right, #df9b3b var(--pct), rgba(0,47,94,0.14) var(--pct));
        }
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 999px;
          background: #fff2e8;
          border: 2px solid #df9b3b;
          margin-top: -4.5px;
          box-shadow: 0 2px 6px rgba(0,47,94,0.3);
          transition: transform 0.15s ease;
        }
        .volume-slider::-webkit-slider-thumb:hover,
        .volume-slider::-webkit-slider-thumb:active {
          transform: scale(1.25);
        }
        .volume-slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 999px;
          background: #fff2e8;
          border: 2px solid #df9b3b;
          box-shadow: 0 2px 6px rgba(0,47,94,0.3);
          transition: transform 0.15s ease;
        }
        .volume-slider::-moz-range-thumb:hover,
        .volume-slider::-moz-range-thumb:active {
          transform: scale(1.25);
        }
      `}</style>
    </>
  );
}

export default BackgroundMusicPlayer;
