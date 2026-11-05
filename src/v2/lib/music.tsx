import { createContext, useContext, type ReactNode } from "react";
import { MUSIC_CSS, useBackgroundMusic } from "@/components/BackgroundMusicPlayer";

type Music = ReturnType<typeof useBackgroundMusic>;

const MusicCtx = createContext<Music | null>(null);

/**
 * Один YouTube-плеєр на весь сайт. Монтується в App один раз, тому при
 * переході між сторінками пісня не починається заново і не вимикається.
 * Кнопки (у хіро головної та в шапці) лише керують цим плеєром.
 */
export function MusicProvider({ children }: { children: ReactNode }) {
  const music = useBackgroundMusic();
  return (
    <MusicCtx.Provider value={music}>
      <div ref={music.hostRef} className="pointer-events-none fixed h-0 w-0 overflow-hidden opacity-0" aria-hidden="true" />
      <style>{MUSIC_CSS}</style>
      {children}
    </MusicCtx.Provider>
  );
}

/** Без провайдера (тести, окремий рендер сторінки) — тиха заглушка: кнопка просто неактивна. */
const SILENT: Music = {
  hostRef: { current: null },
  ready: false,
  unmuted: false,
  volume: 0,
  toggle: () => {},
  onSlide: () => {},
  showQuiet: true,
};

export function useMusic(): Music {
  return useContext(MusicCtx) ?? SILENT;
}
