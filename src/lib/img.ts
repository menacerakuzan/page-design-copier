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

// Off by default: the storage server doesn't expose the transform endpoint yet.
// Flip on (VITE_IMAGE_RESIZE=1) once a resizing backend/CDN is in place.
let supported = import.meta.env.VITE_IMAGE_RESIZE === "1";
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
  const m = url.match(/^(https?:\/\/[^/]+)\/storage\/v1\/object\/public\/(.+)$/);
  if (!m) return url; // external host — can't transform
  return `${m[1]}/storage/v1/render/image/public/${m[2]}?width=${width}&quality=${quality}`;
}
