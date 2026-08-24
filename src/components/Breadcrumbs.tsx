import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  crumbs: Crumb[];
  light?: boolean; // true = light text for dark backgrounds
}

export function Breadcrumbs({ crumbs, light = false }: Props) {
  const base = light ? "text-[#fff2e8]/60" : "text-[#002f5e]/70";
  const active = light ? "text-[#fff2e8]/90" : "text-[#002f5e]/80";
  const hover = light ? "hover:text-[#fff2e8]" : "hover:text-[#002f5e]";
  const sep = light ? "text-[#fff2e8]/60" : "text-[#002f5e]/70";

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 flex-wrap text-[13px] font-odesa-medium">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className={`h-3 w-3 shrink-0 ${sep}`} />}
            {isLast || !crumb.href ? (
              <span className={isLast ? active : base}>{crumb.label}</span>
            ) : (
              <Link to={crumb.href} className={`${base} ${hover} transition-colors`}>
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
