import { useRef, useState, useCallback } from "react";
import { Pause, Play, Volume2, VolumeX, Maximize2 } from "lucide-react";

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

  const openFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
  }, []);

  return (
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

        {/* bottom-right buttons */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMute}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={openFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label="На весь екран"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
