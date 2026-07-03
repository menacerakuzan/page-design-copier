import { Link } from "react-router-dom";
import { MapPin, Phone, ArrowUpRight } from "lucide-react";
import { Img } from "@/components/Img";
import { useLang } from "@/lib/langContext";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { objectDetailPath, objectTypeLabel, objectTypeColor } from "@/lib/entityLinks";

/**
 * Картка реального об'єкта, вставлена асистентом через [[obj:slug]].
 * Дані резолвляться з БД-snapshot за slug — модель їх не вигадує.
 */
export function ObjectCard({ slug }: { slug: string }) {
  const { lang, tl } = useLang();
  const { data: snapshot } = useHierarchySnapshot();
  const obj = snapshot?.objects.find((o) => o.slug === slug && o.published);

  if (!obj) return null;

  const color = objectTypeColor[obj.type];

  return (
    <Link
      to={objectDetailPath(obj.type, obj.slug)}
      className="tap group my-2 flex items-stretch gap-3 overflow-hidden rounded-[18px] border border-[#002f5e]/10 bg-white p-2.5 shadow-[0_10px_26px_-22px_rgba(0,47,94,0.45)] transition-transform active:scale-[0.99]"
    >
      <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[13px] bg-[#002f5e]/10">
        {obj.imageUrl && (
          <Img w={160} src={obj.imageUrl} alt={obj.name} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="text-[10px] uppercase tracking-wider font-odesa-semi" style={{ color }}>
          {objectTypeLabel(obj.type, lang)}
        </p>
        <p className="line-clamp-2 text-[15px] leading-tight text-[#002f5e] font-odesa-semi">
          {tl(obj.name, obj.nameEn)}
        </p>
        {obj.address && (
          <p className="mt-1 flex items-center gap-1 text-[12px] leading-tight text-[#002f5e]/55 font-odesa-regular">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{tl(obj.address, obj.addressEn)}</span>
          </p>
        )}
        {obj.phone && (
          <p className="mt-0.5 flex items-center gap-1 text-[12px] leading-tight text-[#002f5e]/55 font-odesa-regular">
            <Phone className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{obj.phone}</span>
          </p>
        )}
      </div>

      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full bg-[#002f5e]/5 text-[#002f5e] transition-colors group-hover:bg-[#df9b3b] group-hover:text-[#002f5e]"
        aria-hidden
      >
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
