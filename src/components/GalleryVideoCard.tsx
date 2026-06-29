import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, Volume2, VolumeX, Maximize2, X } from "lucide-react";

interface Props {
  src: string;
  title?: string;
  textSizeCls?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function GalleryVideoCard({ src, title, textSizeCls = "text-[20px]", style, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { void v.play(); setPaused(false); }
    else { v.pause(); setPaused(true); }
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

  return (
    <>
      <div
        className={`relative shrink-0 overflow-hidden rounded-[22px] cursor-pointer ${className}`}
        style={{ minHeight: 280, ...style }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onTouchStart={() => setShowControls(s => !s)}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted={muted}
          loop
          playsInline
          className="h-full w-full object-cover"
        />

        {/* gradient + title */}
        {title && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
            <p className={`absolute bottom-5 left-5 right-5 font-odesa-medium leading-tight text-[#fff2e8] ${textSizeCls} pointer-events-none`}>{title}</p>
          </>
        )}

        {/* controls overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${showControls ? "opacity-100" : "opacity-0"}`}
          style={{ pointerEvents: showControls ? "auto" : "none" }}
        >
          {/* center play/pause */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
            {paused ? <Play className="h-6 w-6 fill-white" /> : <Pause className="h-6 w-6" />}
          </div>
        </div>

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
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);

  // Esc для закриття + блокування скролу body, поки відкрито
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { void v.play(); setPaused(false); }
    else { v.pause(); setPaused(true); }
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
            className="relative flex max-h-[90vh] w-auto items-center justify-center"
            style={{ aspectRatio: "9 / 16" }}
            onClick={e => e.stopPropagation()}
          >
            <video
              ref={videoRef}
              src={src}
              autoPlay
              muted={muted}
              loop
              playsInline
              onClick={togglePlay}
              className="h-full max-h-[90vh] w-auto rounded-[22px] object-contain"
              style={{ boxShadow: "0 30px 80px -20px rgba(0,0,0,0.8)" }}
            />

            {title && (
              <>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[22px] bg-gradient-to-t from-black/60 via-transparent to-transparent" style={{ height: "35%" }} />
                <p className="pointer-events-none absolute bottom-5 left-5 right-5 text-[22px] font-odesa-medium leading-tight text-[#fff2e8]">{title}</p>
              </>
            )}

            {/* center play/pause hint */}
            {paused && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
                aria-label="Відтворити"
              >
                <Play className="h-7 w-7 fill-white" />
              </button>
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
