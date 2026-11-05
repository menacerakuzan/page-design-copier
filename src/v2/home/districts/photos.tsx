import { Img } from "@/components/Img";

type PhotoProps = { image?: string; name: string; lang: "uk" | "en" };

/** Фото району: світла рамка-відбиток з легким нахилом. */
export function PrintPhoto({ image, name }: PhotoProps) {
  return (
    // Телефон: маленький відбиток поруч із назвою (підпис не потрібен — назва поруч).
    <div className="print-photo mx-auto w-full !p-[5px] sm:mt-2 sm:max-w-[300px] sm:!px-2 sm:!pb-2.5 sm:!pt-2">
      <Img src={image} w={520} alt="" className="aspect-[4/5] w-full object-cover" />
      <span className="mt-2 hidden px-1 text-left text-[12px] font-semibold uppercase tracking-[0.12em] text-o-sea/70 sm:block">{name}</span>
    </div>
  );
}
