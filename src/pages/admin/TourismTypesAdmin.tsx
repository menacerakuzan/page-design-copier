import { useEffect, useRef, useState } from "react";
import { Palmtree, Upload } from "lucide-react";
import { loadPublishedContentCards, upsertContentCard } from "@/lib/adminRepository";
import { uploadMedia } from "@/data/storage";
import { ContentCardEntity } from "@/types/cms";

const TOURISM_TYPES_LIST = [
  "Гастрономічний туризм", "Історико-культурний туризм", "Медико-оздоровчий туризм",
  "Морський туризм", "Релігійний туризм", "Розважальний туризм",
  "Сільський та зелений туризм", "Спортивний туризм",
];

export const TourismTypesAdmin = ({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) => {
  const [typeImages, setTypeImages] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    loadPublishedContentCards("tourism-types").then(cards => {
      const map: Record<string, string> = {};
      cards.forEach(c => { if (c.imageUrl) map[c.title] = c.imageUrl; });
      setTypeImages(map);
    });
  }, []);

  const handleFile = async (typeName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setSaving(typeName);
    try {
      const url = await uploadMedia(file);
      setTypeImages(prev => ({ ...prev, [typeName]: url }));
      const card: ContentCardEntity = {
        id: `tourism-type-${typeName.toLowerCase().replace(/\s+/g, "-")}`,
        pageKey: "tourism-types", sectionKey: "type", cardType: "destination",
        title: typeName, subtitle: null, imageUrl: url, href: null,
        cityId: null, districtId: null, regionId: null, sortOrder: 0, published: true, payload: {},
      };
      await upsertContentCard(card);
      showToast("Фото збережено");
    } catch (err: any) {
      showToast(err?.message ?? "Помилка", false);
    } finally {
      setSaving(null);
      e.target.value = "";
    }
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#002f5e]/8">
          <Palmtree className="h-4 w-4 text-[#002f5e]" />
        </div>
        <div>
          <h2 className="text-[18px] font-semibold text-[#002f5e]">Види туризму</h2>
          <p className="text-[12px] text-[#002f5e]/70">Додайте фото для кожного виду туризму</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOURISM_TYPES_LIST.map(typeName => (
          <div key={typeName} className="overflow-hidden rounded-2xl border border-[#002f5e]/10 bg-white">
            <div className="relative h-[140px] bg-[#002f5e]/5 cursor-pointer"
              onClick={() => fileRefs.current[typeName]?.click()}>
              {typeImages[typeName] ? (
                <img loading="lazy" decoding="async" src={typeImages[typeName]} alt={typeName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-[#002f5e]/70">
                  <Upload className="h-6 w-6" />
                  <span className="text-[12px]">Додати фото</span>
                </div>
              )}
              {saving === typeName && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#002f5e] border-t-transparent" />
                </div>
              )}
              <input ref={el => { fileRefs.current[typeName] = el; }} type="file" accept="image/*"
                className="hidden" onChange={e => void handleFile(typeName, e)} />
            </div>
            <div className="px-3 py-2.5">
              <p className="text-[13px] font-medium text-[#002f5e]">{typeName}</p>
              <button type="button" onClick={() => fileRefs.current[typeName]?.click()}
                className="mt-1 text-[12px] text-[#002f5e]/70 transition hover:text-[#002f5e]">
                {typeImages[typeName] ? "Змінити фото" : "Завантажити фото"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
