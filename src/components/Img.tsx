import { useState } from "react";
import { resizedImageUrl, reportResizeFailure } from "@/lib/img";

type ImgProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
  /** Target download width for the resize transform (cards ~400, heroes ~1600). */
  w?: number;
  quality?: number;
  /** LCP / above-the-fold image: eager load + high fetch priority. */
  priority?: boolean;
};

/** Брендована заглушка, коли фото немає або воно не завантажилось. */
export const PHOTO_FALLBACK = "/photo-fallback.svg";

/**
 * Drop-in <img> that requests a resized variant from the storage transform
 * endpoint and falls back to the original on error. Defaults to lazy loading
 * and async decoding.
 *
 * Якщо не вантажиться й оригінал (зовнішній сайт видалив фото, закрив
 * хотлінк чи впав — так «зникали» фото частини об'єктів), показуємо
 * PHOTO_FALLBACK замість іконки битого зображення.
 */
export function Img({ src, w = 600, quality = 70, priority = false, alt = "", onError, ...rest }: ImgProps) {
  const original = src || PHOTO_FALLBACK;
  const [useOriginal, setUseOriginal] = useState(false);
  const [broken, setBroken] = useState(false);
  const shown = broken ? PHOTO_FALLBACK : useOriginal ? original : resizedImageUrl(original, w, quality);
  // Retina/HiDPI: also offer a 2× variant so the browser picks a crisp image on
  // dense screens instead of upscaling the 1× one (which looks soft/pixelated).
  // Only when a resize actually applied (shown differs from the original URL).
  const src2x = useOriginal || broken ? "" : resizedImageUrl(original, w * 2, quality);
  const srcSet = !useOriginal && !broken && shown !== original && src2x !== shown
    ? `${shown} 1x, ${src2x} 2x`
    : undefined;

  return (
    <img
      {...rest}
      src={shown}
      srcSet={srcSet}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={(e) => {
        // Resize attempt failed → fall back to the original for this image, and
        // count it towards globally disabling resize if the endpoint is unsupported.
        if (!useOriginal && shown !== original) {
          reportResizeFailure();
          setUseOriginal(true);
        } else if (!broken && original !== PHOTO_FALLBACK) {
          setBroken(true);
        }
        onError?.(e);
      }}
    />
  );
}
