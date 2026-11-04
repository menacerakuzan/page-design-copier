import { Img } from "@/components/Img";

type PhotoProps = { image?: string; name: string; lang: "uk" | "en" };

/** Фото району: світла рамка-відбиток з легким нахилом. */
export function PrintPhoto({ image, name }: PhotoProps) {
  return (
    <div className="print-photo mx-auto w-full max-w-[230px] sm:mt-2 sm:max-w-[300px]">
      <Img src={image} w={520} alt="" className="aspect-[4/5] w-full object-cover" />
      <span className="mt-2 block px-1 text-left text-[12px] font-semibold uppercase tracking-[0.12em] text-o-sea/70">{name}</span>
    </div>
  );
}
