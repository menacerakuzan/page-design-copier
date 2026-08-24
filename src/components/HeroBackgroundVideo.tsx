import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { useLang } from "@/lib/langContext";

/**
 * Фонове відео хіро-секції (головна, район, місто, об'єкт).
 *
 * WCAG 2.2.2 (Pause, Stop, Hide): будь-яка анімація/відео, що стартує само й
 * триває понад 5 секунд, мусить мати спосіб її зупинити. Раніше ці відео
 * просто йшли по колу без жодного контролу — рухомий фон під текстом заважає
 * читати людям з розладами уваги й вестибулярними розладами.
 *
 * Також поважаємо prefers-reduced-motion: якщо в системі вимкнено анімації,
 * відео взагалі не запускається само — показуємо нерухомий перший кадр.
 */
export function HeroBackgroundVideo({
  src,
  className = "absolute inset-0 h-full w-full object-cover",
  poster,
}: {
  src: string;
  className?: string;
  poster?: string;
}) {
  const { lang } = useLang();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  // play() повертає Promise не всюди: у старих Safari та в jsdom (тести) він
  // повертає undefined, і прямий .catch() на ньому падає з TypeError, зносячи
  // всю сторінку. Тому завжди перевіряємо, що це справді Promise.
  const safePlay = (v: HTMLVideoElement, onFail: () => void) => {
    try {
      const p = v.play() as unknown;
      if (p && typeof (p as Promise<void>).catch === "function") {
        void (p as Promise<void>).catch(onFail);
      }
    } catch {
      onFail();
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) {
      v.pause();
      setPaused(true);
    } else {
      // Автоплей може відхилити браузер — тоді просто лишаємось на паузі,
      // а кнопка дає користувачу запустити відео вручну.
      safePlay(v, () => setPaused(true));
    }
  }, [src]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) safePlay(v, () => undefined);
    else v.pause();
  }, []);

  const label = paused
    ? (lang === "en" ? "Play background video" : "Відтворити фонове відео")
    : (lang === "en" ? "Pause background video" : "Зупинити фонове відео");

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onPlaying={() => setPaused(false)}
        onPause={() => setPaused(true)}
        className={className}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className="tap absolute bottom-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-[#fff2e8]/50 bg-[#001a3d]/70 text-[#fff2e8] backdrop-blur-sm transition hover:bg-[#001a3d]/90"
      >
        {paused
          ? <Play className="h-4 w-4" aria-hidden="true" />
          : <Pause className="h-4 w-4" aria-hidden="true" />}
      </button>
    </>
  );
}

export default HeroBackgroundVideo;
