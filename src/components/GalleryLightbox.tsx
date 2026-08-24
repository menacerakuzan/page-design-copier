import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Img } from "@/components/Img";
import { useDialogA11y } from "@/hooks/useDialogA11y";

export type LightboxImage = { url: string; title?: string };

/**
 * Повноекранний перегляд фото галереї — клік по картці відкриває оригінал
 * на весь екран з плавною анімацією (масштаб + fade), заокругленими краями
 * та стрілками гортання, якщо фото в галереї декілька. Той самий стиль, що
 * й у вже наявного оверлею для reel-фото на сторінці об'єкта.
 */
export const GalleryLightbox = ({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: LightboxImage[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) => {
  const open = index !== null;
  const current = open ? images[index] : null;
  const hasMultiple = images.length > 1;

  // Esc, пастка фокуса, повернення фокуса й блокування скролу — спільні для
  // всіх модалок (useDialogA11y). Тут лишаються тільки стрілки ←/→, бо
  // гортання фото специфічне саме для лайтбокса.
  const dialogRef = useDialogA11y(open, onClose);

  useEffect(() => {
    if (!open || !hasMultiple) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onNavigate(((index as number) + 1) % images.length);
      if (e.key === "ArrowLeft") onNavigate(((index as number) - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, index, images.length, hasMultiple, onNavigate]);

  return (
    <AnimatePresence>
      {open && current && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-[90] cursor-zoom-out bg-black/85 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClose}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={current.title ? `Фото: ${current.title}` : "Перегляд фото"}
            className="fixed inset-0 z-[91] flex items-center justify-center p-4 cursor-zoom-out md:p-10"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.url}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-h-[88vh] max-w-[92vw] cursor-default"
              >
                <Img
                  w={1400}
                  src={current.url}
                  alt={current.title ?? ""}
                  className="max-h-[88vh] max-w-[92vw] rounded-[24px] object-contain shadow-2xl"
                />
                {current.title && (
                  <p className="mt-3 text-center text-[14px] text-white/70 font-odesa-regular">{current.title}</p>
                )}
              </motion.div>
            </AnimatePresence>

            <button
              type="button"
              onClick={onClose}
              aria-label="Закрити"
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <X className="h-5 w-5" />
            </button>

            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onNavigate(((index as number) - 1 + images.length) % images.length); }}
                  aria-label="Попереднє фото"
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30 md:left-6"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onNavigate(((index as number) + 1) % images.length); }}
                  aria-label="Наступне фото"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/30 md:right-6"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-[12px] text-white backdrop-blur-sm">
                  {(index as number) + 1} / {images.length}
                </span>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GalleryLightbox;
