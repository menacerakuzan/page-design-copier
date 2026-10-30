import { useEffect, useState } from "react";
import HoarfrostPane from "@/components/ui/hoarfrost-pane";
import { Wreath } from "./Wreath";

/**
 * Зимове оформлення першого екрана головної:
 *  - іній наростає з країв кадру поверх відео (HoarfrostPane в режимі overlay;
 *    середина лишається чистою, курсор протирає скло);
 *  - два вінки на стрічках по боках, що «звисають» з-під шапки.
 * Лежить між затемненням відео і шапкою/контентом, кліків не перехоплює.
 */
export default function WinterHeroDecor() {
  // На телефоні інею немає: малий кадр і слабкі GPU — іній там лише заважає.
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 768px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
      {wide && <HoarfrostPane overlay coverage={0.14} brush={60} height="100%" className="absolute inset-0" />}
      <div className="winter-sway absolute left-[4.5%] top-0 hidden w-[clamp(170px,13.5vw,220px)] lg:block" style={{ animationDelay: "-1.6s" }}>
        <Wreath hanging idPrefix="wr-l" className="w-full drop-shadow-[0_18px_22px_rgba(0,10,30,0.55)]" />
      </div>
      <div className="winter-sway absolute right-[6.5%] top-0 hidden w-[clamp(170px,13.5vw,220px)] lg:block">
        <Wreath hanging idPrefix="wr-r" className="w-full drop-shadow-[0_18px_22px_rgba(0,10,30,0.55)]" />
      </div>
    </div>
  );
}
