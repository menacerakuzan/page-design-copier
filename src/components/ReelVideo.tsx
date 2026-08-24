import { useCallback, useRef, useState } from "react";
import { Maximize2, Volume2, VolumeX } from "lucide-react";
import { SpinningEmblem } from "@/components/SpinningEmblem";

/**
 * Вертикальне рілс-відео (район/місто/об'єкт): не вмикається само — тільки
 * явним кліком. Поки відео на паузі — завжди видно емблему Одещини (щит
 * нерухомий, кільце з написом крутиться), незалежно від наведення курсора;
 * клік ховає її й запускає відео. Коли відео знову ставлять на паузу —
 * емблема одразу з'являється знову. Той самий принцип, що й у галереї
 * (GalleryVideoCard), винесений сюди, бо райони/міста/об'єкти повторювали
 * ідентичну розмітку відео+кнопки тричі.
 */
export function ReelVideo({
  src,
  muted,
  onToggleMute,
  onExpand,
  emblemSize = 200,
  className = "",
}: {
  src: string;
  muted: boolean;
  onToggleMute: () => void;
  /** Якщо задано — показує додаткову кнопку "На весь екран". */
  onExpand?: () => void;
  emblemSize?: number;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }, []);

  const handleToggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleMute();
  }, [onToggleMute]);

  const handleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand?.();
  }, [onExpand]);

  return (
    <div
      className={`group relative h-full w-full cursor-pointer ${className}`}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        loop
        playsInline
        preload="auto"
        onPlaying={() => setPaused(false)}
        onPause={() => setPaused(true)}
        className="h-full w-full object-cover"
      />

      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${paused ? "opacity-100 backdrop-blur-sm" : "opacity-0"}`}
      >
        <SpinningEmblem size={emblemSize} />
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleMute}
          className="flex items-center justify-center rounded-full border border-white/30 bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70"
          aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        {onExpand && (
          <button
            type="button"
            onClick={handleExpand}
            className="flex items-center justify-center rounded-full border border-white/30 bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70"
            aria-label="На весь екран"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ReelVideo;
