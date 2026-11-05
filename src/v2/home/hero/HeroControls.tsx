import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Volume2, VolumeX } from "lucide-react";
import { MUSIC_CSS, useBackgroundMusic } from "@/components/BackgroundMusicPlayer";
import { useLang } from "@/lib/langContext";
import { useV2 } from "@/v2/i18n";
import { EASE } from "@/v2/components/ui";
import { SearchBox } from "@/v2/components/SearchBox";

/** Однакова кругла кнопка для музики й пошуку — щоб стовпчик був симетричний. */
const ROUND =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-o-sand text-o-sea shadow-[0_10px_24px_-8px_rgba(0,10,30,0.5)] transition-colors hover:bg-o-sun";

/**
 * Фонова музика (та сама пісня, що на старому сайті). Кнопка — рівне коло;
 * повзунок гучності виїжджає праворуч окремою «пігулкою», не деформуючи її.
 */
export function MusicButton({ slider = true }: {
  /** false — без повзунка гучності (на телефоні гучність — кнопками самого телефона). */
  slider?: boolean;
}) {
  const { t } = useLang();
  const { hostRef, ready, unmuted, volume, toggle, onSlide, showQuiet } = useBackgroundMusic();
  return (
    <div className="relative flex items-center">
      <div ref={hostRef} className="pointer-events-none fixed h-0 w-0 overflow-hidden opacity-0" aria-hidden="true" />
      <style>{MUSIC_CSS}</style>
      <motion.button
        type="button"
        onClick={toggle}
        disabled={!ready}
        whileTap={{ scale: 0.92 }}
        aria-label={unmuted ? t("musicOff") : t("musicOn")}
        aria-pressed={unmuted}
        className={`${ROUND} disabled:opacity-60`}
      >
        {showQuiet ? (
          <VolumeX className="h-5 w-5" aria-hidden="true" />
        ) : (
          <span className="relative flex items-center justify-center">
            <Volume2 className="h-5 w-5" aria-hidden="true" />
            <span className="absolute -right-1 -top-1 flex items-end gap-[1.5px]" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span key={i} className="bg-note-bar w-[2px] rounded-full bg-o-sun" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          </span>
        )}
      </motion.button>
      <AnimatePresence initial={false}>
        {slider && unmuted && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="absolute left-[calc(100%+8px)] flex h-11 items-center rounded-full bg-o-sand pl-3.5 shadow-[0_10px_24px_-8px_rgba(0,10,30,0.5)]"
          >
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => onSlide(Number(e.target.value))}
              aria-label={t("musicVolume")}
              className="volume-slider"
              style={{ "--pct": `${volume}%` } as CSSProperties}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Пошук-кнопка: коло з лупою, що по кліку розгортається вправо в поле
 * з підказками (вони відкриваються вгору, бо поле внизу екрана).
 * Згортається по Escape або кліку поза ним.
 */
export function ExpandSearch() {
  const { t } = useV2();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    window.setTimeout(() => btnRef.current?.focus(), 0);
  };

  return (
    <div ref={ref} className="relative h-11">
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.div
            key="field"
            initial={{ width: 44, opacity: 0.6 }}
            animate={{ width: "min(420px, calc(100vw - 48px))", opacity: 1 }}
            exit={{ width: 44, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-visible rounded-full"
          >
            <SearchBox variant="compact" autoFocus onClose={close} />
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            ref={btnRef}
            type="button"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            aria-label={t("search")}
            aria-expanded={false}
            className={ROUND}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
