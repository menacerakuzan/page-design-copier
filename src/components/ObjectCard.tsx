import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Img } from "@/components/Img";
import { objectDetailPath, objectTypeLabel, objectTypeColor } from "@/lib/entityLinks";
import type { TourismObject } from "@/types/hierarchy";

/** Картка тур. об'єкта: фото + бейдж типу, біле тіло з кольоровою смугою зліва. */
export const ObjectCard = ({ obj, idx, lang }: { obj: TourismObject; idx: number; lang: "uk" | "en" }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: idx * 0.04 }}>
    <Link to={objectDetailPath(obj.type, obj.slug)}
      className="group block h-full overflow-hidden rounded-[26px] bg-white transition-transform duration-300 hover:-translate-y-1.5"
      style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.05), 0 12px 32px -10px rgba(0,47,94,0.22)" }}>
      <div className="relative h-[170px] overflow-hidden xs:h-[198px]">
        <Img w={500} src={obj.imageUrl ?? "https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=80"}
          alt={obj.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-odesa-medium uppercase tracking-wide text-white backdrop-blur-sm"
          style={{ backgroundColor: `${objectTypeColor[obj.type]}cc` }}>
          {objectTypeLabel(obj.type, lang)}
        </span>
      </div>
      <div className="relative p-3.5">
        <div className="absolute left-0 top-4 h-[22px] w-[3px] rounded-r-full transition-all duration-300 group-hover:h-[32px]"
          style={{ backgroundColor: objectTypeColor[obj.type] }} />
        <p className="font-odesa-medium text-[17px] leading-[1.1] text-[#002f5e]">{obj.name}</p>
        {obj.subtitle && (
          <p className="mt-1 text-[13px] text-[#002f5e]/55 font-odesa-regular line-clamp-1">{obj.subtitle}</p>
        )}
        {obj.address && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#002f5e]/50 font-odesa-regular">
            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: objectTypeColor[obj.type] }} /> {obj.address.split("\n")[0]}
          </p>
        )}
        <div className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-odesa-medium" style={{ color: objectTypeColor[obj.type] }}>
          Детальніше <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  </motion.div>
);

export default ObjectCard;
