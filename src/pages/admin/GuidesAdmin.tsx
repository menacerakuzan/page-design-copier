import { useEffect, useState } from "react";
import { BadgeCheck, Pencil, Plus, Trash2, UserRound, X } from "lucide-react";
import { loadGuides, upsertGuide, deleteGuide, type Guide } from "@/lib/guidesRepository";
import { FieldGroup, Input, MediaField } from "@/components/admin/fields";
import { slugify } from "@/lib/slug";

type GuideForm = {
  id: string; surname: string; firstName: string; cert: string;
  languages: string; personalUrl: string; photoUrl: string;
  dstu: boolean; published: boolean; sortOrder: number;
};

const emptyGuideForm = (): GuideForm => ({
  id: "", surname: "", firstName: "", cert: "",
  languages: "", personalUrl: "", photoUrl: "",
  dstu: false, published: true, sortOrder: 0,
});

export const GuidesAdmin = ({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [form, setForm] = useState<GuideForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadGuides().then(setGuides); }, []);

  const openEdit = (guide: Guide) => setForm({
    id: guide.id, surname: guide.surname, firstName: guide.firstName,
    cert: guide.cert ?? "", languages: guide.languages.join(", "),
    personalUrl: guide.personalUrl ?? "", photoUrl: guide.photoUrl ?? "",
    dstu: guide.dstu, published: guide.published, sortOrder: guide.sortOrder,
  });

  const handleSave = async () => {
    if (!form || !form.surname.trim()) return;
    setSaving(true);
    try {
      const id = form.id || `${slugify(form.surname)}-${slugify(form.firstName) || Math.random().toString(36).slice(2, 6)}`;
      const guide: Guide = {
        id, surname: form.surname.trim(), firstName: form.firstName.trim(),
        cert: form.cert.trim() || undefined,
        languages: form.languages.split(",").map(l => l.trim()).filter(Boolean),
        personalUrl: form.personalUrl.trim() || undefined,
        photoUrl: form.photoUrl.trim() || undefined,
        dstu: form.dstu, published: form.published, sortOrder: form.sortOrder,
      };
      await upsertGuide(guide);
      setGuides(prev => {
        const idx = prev.findIndex(g => g.id === id);
        return idx >= 0 ? prev.map(g => g.id === id ? guide : g) : [...prev, guide];
      });
      setForm(null);
      showToast("Гіда збережено");
    } catch { showToast("Помилка збереження", false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити гіда з реєстру?")) return;
    try {
      await deleteGuide(id);
      setGuides(prev => prev.filter(g => g.id !== id));
      showToast("Видалено");
    } catch { showToast("Помилка", false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-odesa-medium text-[22px] text-[#002f5e]">Гіди Одеси</h2>
        <button onClick={() => setForm(emptyGuideForm())}
          className="flex items-center gap-2 rounded-xl bg-[#002f5e] px-4 py-2 text-[13px] font-medium text-[#fff2e8] transition hover:opacity-85">
          <Plus className="h-4 w-4" /> Додати гіда
        </button>
      </div>

      {form && (
        <div className="rounded-[20px] border border-[#002f5e]/10 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-odesa-medium text-[16px] text-[#002f5e]">{form.id ? "Редагування" : "Новий гід"}</p>
            <button onClick={() => setForm(null)} className="text-[#002f5e]/70 hover:text-[#002f5e]"><X className="h-5 w-5" /></button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Прізвище">
              <Input value={form.surname} onChange={v => setForm(f => f && ({ ...f, surname: v }))} placeholder="Штокало" />
            </FieldGroup>
            <FieldGroup label="Ім'я">
              <Input value={form.firstName} onChange={v => setForm(f => f && ({ ...f, firstName: v }))} placeholder="Тетяна" />
            </FieldGroup>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="№ у реєстрі АГО">
              <Input value={form.cert} onChange={v => setForm(f => f && ({ ...f, cert: v }))} placeholder="010104-016" />
            </FieldGroup>
            <FieldGroup label="Мови (через кому)">
              <Input value={form.languages} onChange={v => setForm(f => f && ({ ...f, languages: v }))} placeholder="українська, english" />
            </FieldGroup>
          </div>

          <FieldGroup label="Персональна сторінка (URL)">
            <Input value={form.personalUrl} onChange={v => setForm(f => f && ({ ...f, personalUrl: v }))} placeholder="https://guides.odesatourism.site/reestr/..." />
          </FieldGroup>

          <MediaField label="Фото" value={form.photoUrl} onChange={v => setForm(f => f && ({ ...f, photoUrl: v }))} accept="image/*" isVideo={false} />

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#002f5e]/70">
              <input type="checkbox" checked={form.dstu}
                onChange={e => setForm(f => f && ({ ...f, dstu: e.target.checked }))}
                className="h-4 w-4 rounded" />
              Сертифіковано за ДСТУ 15565:2016
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#002f5e]/70">
              <input type="checkbox" checked={form.published}
                onChange={e => setForm(f => f && ({ ...f, published: e.target.checked }))}
                className="h-4 w-4 rounded" />
              Опубліковано
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#002f5e]/70">Порядок</span>
              <input type="number" value={form.sortOrder}
                onChange={e => setForm(f => f && ({ ...f, sortOrder: Number(e.target.value) }))}
                className="w-20 rounded-xl border border-[#002f5e]/15 px-3 py-2 text-[13px] text-[#002f5e]" />
            </div>
          </div>

          <button onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl bg-[#002f5e] py-3 text-[14px] font-medium text-[#fff2e8] transition hover:opacity-85 disabled:opacity-50">
            {saving ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map(guide => (
          <div key={guide.id} className="flex items-center gap-3 rounded-[16px] border border-[#002f5e]/8 bg-white p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#002f5e]/8">
              {guide.photoUrl ? (
                <img loading="lazy" decoding="async" src={guide.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-5 w-5 text-[#002f5e]/70" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[14px] font-semibold text-[#002f5e]">{guide.surname} {guide.firstName}</p>
                {guide.dstu && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#df9b3b]" />}
              </div>
              <p className="truncate text-[12px] text-[#002f5e]/70">{guide.languages.join(", ") || "—"}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${guide.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {guide.published ? "Опубл." : "Чернетка"}
              </span>
              <button onClick={() => openEdit(guide)}
                className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-[#002f5e]/70 hover:bg-[#002f5e]/8 hover:text-[#002f5e]">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(guide.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9f1f47]/40 hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {guides.length === 0 && !form && (
          <p className="col-span-full py-12 text-center text-[14px] text-[#002f5e]/70">Гідів ще немає</p>
        )}
      </div>
    </div>
  );
};
