import { useV2 } from "@/v2/i18n";

/** Кружечки-пагінація під підписом: активний — винна «пігулка». */
export function Dots({ count, active, onPick }: { count: number; active: number; onPick: (i: number) => void }) {
  const { lang } = useV2();
  return (
    <div className="flex flex-wrap items-center justify-center gap-1" role="group" aria-label={lang === "en" ? "Slides" : "Слайди"}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onPick(i)}
          aria-label={`${i + 1} / ${count}`}
          aria-current={i === active}
          className="group flex h-6 items-center justify-center px-[3px]"
        >
          <span
            className={`block h-2 rounded-full transition-all duration-500 ${i === active ? "w-6 bg-o-wine" : "w-2 bg-o-sea/20 group-hover:bg-o-sea/40"}`}
          />
        </button>
      ))}
    </div>
  );
}
