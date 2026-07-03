import { useNavigate } from "react-router-dom";
import { Route as RouteIcon, ArrowRight } from "lucide-react";
import { useLang } from "@/lib/langContext";
import { useBasket } from "@/lib/basketContext";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { objectTypeColor, objectTypeLabel } from "@/lib/entityLinks";

/**
 * Пропозиція маршруту, вставлена асистентом через [[route: slugs | title]].
 * Кнопка додає обʼєкти в кошик і веде на існуючу генерацію маршруту (/marshrut).
 */
export function RouteProposal({ slugs, title }: { slugs: string[]; title: string }) {
  const { lang, tl, t } = useLang();
  const { add } = useBasket();
  const navigate = useNavigate();
  const { data: snapshot } = useHierarchySnapshot();

  const objects = slugs
    .map((slug) => snapshot?.objects.find((o) => o.slug === slug && o.published))
    .filter((o): o is NonNullable<typeof o> => Boolean(o));

  if (objects.length < 2) return null;

  const heading =
    title || (lang === "en" ? "Suggested route" : "Пропонований маршрут");

  const build = () => {
    objects.forEach((o) => add(o.id));
    navigate("/marshrut");
  };

  return (
    <div className="my-3 overflow-hidden rounded-[20px] border border-[#df9b3b]/40 bg-[#df9b3b]/8 p-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#df9b3b] text-[#002f5e]">
          <RouteIcon className="h-4 w-4" />
        </span>
        <p className="text-[15px] text-[#002f5e] font-odesa-bold">{heading}</p>
      </div>

      <ol className="mt-3 flex flex-col gap-1.5">
        {objects.map((o, i) => (
          <li key={o.id} className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#002f5e] text-[11px] text-[#fff2e8] font-odesa-bold">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="line-clamp-1 text-[14px] leading-tight text-[#002f5e] font-odesa-semi">
                {tl(o.name, o.nameEn)}
              </p>
              <p
                className="text-[10px] uppercase tracking-wider font-odesa-semi"
                style={{ color: objectTypeColor[o.type] }}
              >
                {objectTypeLabel(o.type, lang)}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={build}
        className="tap mt-3 flex w-full items-center justify-between gap-2 rounded-full bg-[#002f5e] py-2.5 pl-5 pr-2.5 text-[15px] text-[#fff2e8] font-odesa-bold transition-transform active:scale-[0.99]"
      >
        {t("buildRoute")}
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#df9b3b] text-[#002f5e]">
          <ArrowRight className="h-4 w-4" />
        </span>
      </button>
    </div>
  );
}
