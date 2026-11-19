import { useEffect, useRef, useState } from "react";

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
  destroy?: () => void;
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
 * Логіка фонової музики сайту — для власних кнопок (див. v2/lib/music).
 * Стрімиться напряму з YouTube (офіційний embed API — без завантаження чи
 * перезаливки аудіофайлу), циклічно, за замовчуванням без звуку (щоб пройти
 * autoplay-політику браузерів і не лякати користувача).
 */
export function useBackgroundMusic() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const fadeRaf = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [unmuted, setUnmuted] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useEffect(() => {
    let cancelled = false;
    // YouTube-API ЗАМІНЮЄ переданий елемент на <iframe>. Якщо віддати йому
    // div, яким керує React, то при знятті компонента (перехід на головну,
    // де старий плеєр не показується) React не знаходить свій вузол і
    // падає з removeChild — і зникає ВЕСЬ застосунок. Тому плеєр отримує
    // окремий вкладений елемент, створений вручну, а не вузол React.
    // Вузол-контейнер беремо одразу: під час прибирання React уже обнулить ref.
    const host = hostRef.current;
    loadYouTubeApi().then(() => {
      if (cancelled || !host || !window.YT) return;
      const mount = document.createElement("div");
      host.appendChild(mount);
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
      playerRef.current = new window.YT.Player(mount, {
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
            // Аудит 17.1.3: YouTube-API підміняє наш <div> на <iframe>, і хоч
            // контейнер має aria-hidden та нульовий розмір, aria-hidden НЕ
            // виводить елемент з порядку Tab — фокус клавіатури провалювався
            // всередину плеєра, а в рядку стану браузера світились посилання
            // на ютуб. tabindex="-1" на самому <iframe> прибирає і його, і
            // весь його вміст із послідовної навігації в усіх браузерах.
            const frame = hostRef.current instanceof HTMLIFrameElement
              ? hostRef.current
              : hostRef.current?.querySelector("iframe");
            if (frame) {
              frame.setAttribute("tabindex", "-1");
              frame.setAttribute("aria-hidden", "true");
              frame.setAttribute("title", "Background music player");
            }
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
      try {
        playerRef.current?.destroy?.();
      } catch {
        /* плеєр міг ще не ініціалізуватись */
      }
      playerRef.current = null;
      // Прибираємо все, що YouTube додав усередину (iframe замість mount).
      host?.replaceChildren();
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

  return { hostRef, ready, unmuted, volume, toggle, onSlide, showQuiet };
}

/** Стилі анімованих «нот» і повзунка гучності. */
export const MUSIC_CSS = `
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
      `;
