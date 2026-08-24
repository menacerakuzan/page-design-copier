import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Volume2, VolumeX, Maximize2, X } from "lucide-react";
import { SpinningEmblem } from "@/components/SpinningEmblem";
import { useDialogA11y } from "@/hooks/useDialogA11y";

interface Props {
  src: string;
  title?: string;
  textSizeCls?: string;
  style?: React.CSSProperties;
  className?: string;
}

const Spinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[#002f5e]/20">
    <Loader2 className="h-8 w-8 animate-spin text-white/80" />
  </div>
);

export function GalleryVideoCard({ src, title, textSizeCls = "text-[20px]", style, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [loading, setLoading] = useState(true);
  // Відео більше НЕ вмикається само (ні при появі в кадрі, ні при наведенні) —
  // тому стартовий стан одразу "на паузі", а не false.
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Не тягнемо всі відео галереї одразу — вантажимо (і починаємо грати) лише
  // ту картку, що реально під'їхала у видиму область горизонтальної стрічки.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px", threshold: 0.01 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const openExpanded = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(true);
  }, []);

  // Поки відкритий фулскрін — прев'ю на паузі (той самий файл двома окремими
  // <video> інакше конкурують за пропускну здатність, і фулскрін довго
  // виглядав "порожнім"). Саме прев'ю більше НЕ вмикається автоматично —
  // тільки явним кліком користувача.
  useEffect(() => {
    if (expanded) videoRef.current?.pause();
  }, [expanded]);

  return (
    <>
      <div
        ref={containerRef}
        className={`group relative shrink-0 overflow-hidden rounded-[22px] cursor-pointer bg-[#002f5e]/10 ${className}`}
        style={{ minHeight: 280, ...style }}
        onClick={togglePlay}
      >
        {inView && (
          <video
            ref={videoRef}
            src={src}
            preload="auto"
            muted={muted}
            loop
            playsInline
            onPlaying={() => { setLoading(false); setPaused(false); }}
            onPause={() => setPaused(true)}
            onWaiting={() => setLoading(true)}
            onCanPlay={() => setLoading(false)}
            className="h-full w-full object-cover"
          />
        )}

        {(!inView || loading) && <Spinner />}

        {/* gradient + title */}
        {title && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
            <p className={`absolute bottom-5 left-5 right-5 font-odesa-medium leading-tight text-[#fff2e8] ${textSizeCls} pointer-events-none`}>{title}</p>
          </>
        )}

        {/* Емблема замість кнопки play/pause: показується щоразу, коли відео
            на паузі (не залежно від наведення) — щит нерухомий, кільце з
            написом крутиться. Клік вимикає паузу (запускає відео) — оверлей
            одразу ховається, бо paused стає false. */}
        {!loading && (
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${paused ? "opacity-100 backdrop-blur-sm" : "opacity-0"}`}
            style={{ pointerEvents: paused ? "auto" : "none" }}
          >
            <SpinningEmblem size={220} />
          </div>
        )}

        {/* bottom-right buttons — завжди видимі (зручно на тач-екранах) */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"}
          >
            {muted ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
          </button>
          <button
            type="button"
            onClick={openExpanded}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label="На весь екран"
          >
            <Maximize2 className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      <ReelLightbox src={src} title={title} open={expanded} onClose={() => setExpanded(false)} />
    </>
  );
}

function ReelLightbox({ src, title, open, onClose }: { src: string; title?: string; open: boolean; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // Стартуємо без звуку — так само, як картка-прев'ю: браузери надійно
  // дозволяють autoplay лише muted-відео. Раніше тут стартувало unmuted, і
  // на суворих autoplay-політиках (Chrome) відео мовчки лишалось на паузі —
  // "не працює", бо кнопка Play не показувалась (стан paused не встигав
  // синхронізуватись зі справжнім <video>).
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  // Esc, пастка фокуса, повернення фокуса й блокування скролу — у спільному хуку.
  const dialogRef = useDialogA11y(open, onClose);

  useEffect(() => {
    if (open) setLoading(true);
  }, [open]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,10,30,0.8)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ? `Відео: ${title}` : "Перегляд відео"}
            className="relative flex max-h-[90vh] max-w-[92vw] items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Без фіксованого aspect-ratio: галерейні відео здебільшого
                горизонтальні (на відміну від портретних reel), тому контейнер
                мав форму 9:16 і "стискав" ландшафтне відео в невидиму смужку —
                саме це й читалось як "фулскрін не працює, тільки кнопки". */}
            <video
              ref={videoRef}
              src={src}
              preload="auto"
              autoPlay
              muted={muted}
              loop
              playsInline
              onClick={togglePlay}
              onPlaying={() => { setLoading(false); setPaused(false); }}
              onPause={() => setPaused(true)}
              onWaiting={() => setLoading(true)}
              onCanPlay={() => setLoading(false)}
              className="max-h-[90vh] max-w-[92vw] rounded-[22px] object-contain"
              style={{ boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8)" }}
            />

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[22px] bg-black/30">
                <Loader2 className="h-10 w-10 animate-spin text-white/80" />
              </div>
            )}

            {title && (
              <>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[22px] bg-gradient-to-t from-black/60 via-transparent to-transparent" style={{ height: "35%" }} />
                <p className="pointer-events-none absolute bottom-5 left-5 right-5 text-[22px] font-odesa-medium leading-tight text-[#fff2e8]">{title}</p>
              </>
            )}

            {/* Замість кнопки play — та сама емблема замість іконки паузи */}
            {!loading && paused && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[22px] backdrop-blur-sm">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="group flex h-56 w-56 items-center justify-center"
                  aria-label="Відтворити"
                >
                  <SpinningEmblem size={224} />
                </button>
              </div>
            )}

            {/* controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>

          {/* close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label="Закрити"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
