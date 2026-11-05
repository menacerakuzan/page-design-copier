import { useV2 } from "@/v2/i18n";
import { SectionHead } from "@/v2/components/ui";
import { useSeeItems } from "./mustsee/data";
import { SeeRing } from "./mustsee/SeeRing";
import { RippleBackdrop } from "./mustsee/RippleBackdrop";
import { usePauseOffscreen } from "@/v2/lib/usePauseOffscreen";

/**
 * «Варто побачити»: карусель «Кільце» (фото по колу, вигляд зсередини) на тлі
 * «Рябі»; клік — сторінка місця. Інші варіанти каруселі й фону — у useful/.
 */
export function MustSee() {
  const { t } = useV2();
  const items = useSeeItems();
  const pauseRef = usePauseOffscreen<HTMLElement>();

  if (!items.length) return null;

  return (
    <section ref={pauseRef} aria-labelledby="must-title" className="overflow-hidden pb-10 pt-14 sm:pb-14 sm:pt-20">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-10">
        <SectionHead id="must-title" inline kicker={t("mustKicker")} line1={t("mustTitle1")} line2={t("mustTitle2")} />
      </div>
      <div className="relative isolate mt-8 sm:mt-10">
        <RippleBackdrop />
        <SeeRing items={items} />
      </div>
    </section>
  );
}
