/**
 * On-the-fly image resizing via the storage server's Supabase-compatible
 * transform endpoint:
 *   .../storage/v1/object/public/<bucket>/<file>
 *   -> .../storage/v1/render/image/public/<bucket>/<file>?width=W&quality=Q
 *
 * The endpoint returns a resized, re-encoded (webp) image — far smaller than the
 * full-size original served for thumbnails. External URLs (wikimedia, etc.) are
 * passed through unchanged.
 *
 * If the server turns out not to support transforms, the first <Img> failure
 * flips `supported` off so subsequent images skip the resize attempt and use the
 * originals directly. See {@link components/Img}.
 */

// On by default: the storage-server exposes the /render/image transform endpoint.
// Kill-switch: set VITE_IMAGE_RESIZE=0 to serve originals (e.g. if a deploy has
// no resizing backend). The onError fallback in <Img> also covers that case.
let supported = import.meta.env.VITE_IMAGE_RESIZE !== "0";
let failures = 0;
// Disable resizing globally only after several distinct images fail to transform
// (a truly unsupported endpoint), so one missing file doesn't switch it off.
const FAILURE_THRESHOLD = 3;

export const isResizeSupported = () => supported;
export const reportResizeFailure = () => {
  if (++failures >= FAILURE_THRESHOLD) supported = false;
};

export function resizedImageUrl(url: string | null | undefined, width: number, quality = 70): string {
  if (!url || !supported) return url ?? "";
  // Matches our storage URLs whether absolute (https://host/storage/v1/object/…)
  // or relative (/storage/v1/object/…); the origin group is optional. Anything
  // else (unsplash, wikimedia, …) is an external host we can't transform.
  const m = url.match(/^(https?:\/\/[^/]+)?\/storage\/v1\/object\/public\/(.+)$/);
  if (!m) return url;
  return `${m[1] ?? ""}/storage/v1/render/image/public/${m[2]}?width=${width}&quality=${quality}`;
}
