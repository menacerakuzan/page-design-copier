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

/**
 * Drop-in <img> that requests a resized variant from the storage transform
 * endpoint and falls back to the original on error. Defaults to lazy loading
 * and async decoding.
 */
export function Img({ src, w = 600, quality = 70, priority = false, alt = "", onError, ...rest }: ImgProps) {
  const original = src ?? "";
  const [useOriginal, setUseOriginal] = useState(false);
  const shown = useOriginal ? original : resizedImageUrl(original, w, quality);

  return (
    <img
      {...rest}
      src={shown}
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
        }
        onError?.(e);
      }}
    />
  );
}
