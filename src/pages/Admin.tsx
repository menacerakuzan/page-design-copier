import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MapPin, Building2, Landmark, Plus, Trash2, Settings2, AlertCircle, Upload, Link, LayoutDashboard, Calendar, UtensilsCrossed, BedDouble, ChevronRight, Palmtree, Newspaper, Pencil, X, LogOut } from "lucide-react";
import AdminLoginGate from "@/components/AdminLoginGate";
import BackButton from "@/components/BackButton";
import { regions as seedRegions, districts as seedDistricts, cities as seedCities, tourismObjects as seedObjects } from "@/data/hierarchyMockData";
import { District, City, Region, TourismObject, TourismObjectType } from "@/types/hierarchy";
import { ContentCardEntity } from "@/types/cms";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import { loadHierarchySnapshot, upsertDistrict, upsertCity, upsertTourismObject, deleteDistrict, deleteCity, deleteTourismObject, upsertContentCard, deleteContentCard, loadPublishedContentCards } from "@/lib/adminRepository";
import AdminConstructor from "./AdminConstructor";
import AdminPageEditor from "./AdminPageEditor";
import RichTextEditor from "@/components/RichTextEditor";

// ─── helpers ─────────────────────────────────────────────────────────────────

const CYRILLIC_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh",
  з: "z", и: "y", і: "i", ї: "yi", й: "y", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "yu", я: "ya",
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[а-яіїєґь]/g, (c) => CYRILLIC_MAP[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uid = () => Math.random().toString(36).slice(2, 10);

type AdminSection =
  | "districts" | "cities" | "places" | "constructor"
  | "tourism-types" | "articles"
  | "pages-district" | "pages-city" | "pages-place";

type PlacePageType = TourismObjectType;

const TOURISM_TYPES = [
  "Гастрономічний туризм",
  "Історико-культурний туризм",
  "Медико-оздоровчий туризм",
  "Морський туризм",
  "Релігійний туризм",
  "Розважальний туризм",
  "Сільський та зелений туризм",
  "Спортивний туризм",
];

const PLACE_TYPES: { value: TourismObjectType; label: string; color: string }[] = [
  { value: "attraction", label: "Туристичний об'єкт", color: "#002f5e" },
  { value: "event",      label: "Подія",              color: "#9f1f47" },
  { value: "restaurant", label: "Ресторан",            color: "#eea846" },
  { value: "hotel",      label: "Готель",              color: "#17a358" },
];

// ─── form state types ─────────────────────────────────────────────────────────

type DistrictForm = {
  id: string; name: string; subtitle: string; description: string;
  detailedInfo: string; imageUrl: string; videoUrl: string; reelUrl: string; regionId: string;
};

type CityForm = {
  id: string; name: string; subtitle: string; description: string;
  detailedInfo: string; imageUrl: string; videoUrl: string; reelUrl: string; districtId: string;
  weatherCityName: string; settlementType: string;
};

type PlaceForm = {
  id: string; slug: string; name: string; subtitle: string; description: string;
  detailedInfo: string; imageUrl: string; videoUrl: string; reelUrl: string;
  cityId: string; districtOnlyMode: boolean; type: TourismObjectType;
  mapUrl: string; address: string; phone: string; website: string;
  eventDates: string; hours: string; amenities: string;
  published: boolean; tourismTypes: string[];
};

const emptyDistrict = (regionId: string): DistrictForm => ({ id: "", name: "", subtitle: "", description: "", detailedInfo: "", imageUrl: "", videoUrl: "", reelUrl: "", regionId });
const emptyCity = (districtId: string): CityForm => ({ id: "", name: "", subtitle: "", description: "", detailedInfo: "", imageUrl: "", videoUrl: "", reelUrl: "", districtId, weatherCityName: "", settlementType: "місто" });
const emptyPlace = (cityId: string): PlaceForm => ({ id: "", slug: "", name: "", subtitle: "", description: "", detailedInfo: "", imageUrl: "", videoUrl: "", reelUrl: "", cityId, districtOnlyMode: false, type: "attraction", mapUrl: "", address: "", phone: "", website: "", eventDates: "", hours: "", amenities: "", published: true, tourismTypes: [] });

// ─── sub-components ───────────────────────────────────────────────────────────

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">{children}</span>
);

const Input = ({ value, onChange, placeholder = "", className = "" }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] placeholder:text-[#002f5e]/30 focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition ${className}`}
  />
);

const Textarea = ({ value, onChange, placeholder = "", rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full resize-none rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] placeholder:text-[#002f5e]/30 focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition"
  />
);

const MultiField = ({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) => {
  const items = value ? value.split("\n") : [""];
  const update = (idx: number, val: string) => {
    const next = [...items]; next[idx] = val; onChange(next.join("\n"));
  };
  const add = () => onChange([...items, ""].join("\n"));
  const remove = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    onChange(next.length ? next.join("\n") : "");
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              value={item}
              onChange={e => update(idx, e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] placeholder:text-[#002f5e]/30 focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition"
            />
            {items.length > 1 && (
              <button type="button" onClick={() => remove(idx)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#9f1f47]/20 text-[#9f1f47]/50 transition hover:border-[#9f1f47]/50 hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]">
                <span className="text-[18px] leading-none">−</span>
              </button>
            )}
            {idx === items.length - 1 && (
              <button type="button" onClick={add}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#002f5e]/20 text-[#002f5e]/50 transition hover:border-[#002f5e]/40 hover:bg-[#002f5e]/8 hover:text-[#002f5e]">
                <span className="text-[18px] leading-none">+</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const FormSelect = ({ value, onChange, children, disabled = false }: { value: string; onChange: (v: string) => void; children: React.ReactNode; disabled?: boolean }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition disabled:opacity-50"
  >
    {children}
  </select>
);

const FieldGroup = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <Label>{label}</Label>
    {children}
  </div>
);

const SaveBtn = ({ saving, label = "Зберегти" }: { saving: boolean; label?: string }) => (
  <button
    type="submit"
    disabled={saving}
    className="flex items-center gap-2 rounded-xl bg-[#002f5e] px-6 py-2.5 text-[14px] font-medium text-[#fff2e8] transition hover:bg-[#002f5e]/85 disabled:opacity-60"
  >
    {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckCircle2 className="h-4 w-4" />}
    {saving ? "Зберігається..." : label}
  </button>
);

// ─── MediaGroup ───────────────────────────────────────────────────────────────
type MediaMode = "url" | "upload";

const MediaField = ({ label, value, onChange, accept, isVideo }: {
  label: string; value: string; onChange: (v: string) => void;
  accept: string; isVideo: boolean;
}) => {
  const [mode, setMode] = useState<MediaMode>("url");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!supabase) {
      // local mode: use object URL for preview only
      onChange(URL.createObjectURL(file));
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err: any) {
      alert(err?.message ?? "Помилка завантаження файлу");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex rounded-lg border border-[#002f5e]/12 bg-white/60 p-0.5 text-[11px]">
          <button type="button" onClick={() => setMode("url")}
            className={`flex items-center gap-1 rounded-md px-2 py-1 transition ${
              mode === "url" ? "bg-[#002f5e] text-white" : "text-[#002f5e]/50 hover:text-[#002f5e]"
            }`}>
            <Link className="h-3 w-3" /> URL
          </button>
          <button type="button" onClick={() => { setMode("upload"); setTimeout(() => fileRef.current?.click(), 50); }}
            className={`flex items-center gap-1 rounded-md px-2 py-1 transition ${
              mode === "upload" ? "bg-[#002f5e] text-white" : "text-[#002f5e]/50 hover:text-[#002f5e]"
            }`}>
            <Upload className="h-3 w-3" /> Файл
          </button>
        </div>
      </div>
      {mode === "url" ? (
        <Input value={value} onChange={onChange} placeholder="https://..." />
      ) : (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#002f5e]/20 bg-white py-3 text-[13px] text-[#002f5e]/50 transition hover:border-[#002f5e]/35 hover:text-[#002f5e]/70"
        >
          {uploading ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#002f5e]/40 border-t-[#002f5e]" /> Завантаження...</>
          ) : (
            <><Upload className="h-4 w-4" /> Обрати файл</>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
      {value && (
        isVideo ? (
          <div className="relative mt-2 h-32 w-full overflow-hidden rounded-lg bg-[#002f5e]/5">
            {value.match(/\.(gif)$/i) ? (
              <img src={value} alt="gif" className="h-full w-full object-cover" />
            ) : (
              <video src={value} className="h-full w-full object-cover" muted loop autoPlay playsInline />
            )}
            <button type="button" onClick={() => onChange("")}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-[#9f1f47]"
              title="Видалити">✕</button>
          </div>
        ) : (
          <div className="relative mt-2">
            <img src={value} alt="" className="h-32 w-full rounded-lg object-cover opacity-90" onError={e => (e.currentTarget.style.display = "none")} />
            <button type="button" onClick={() => onChange("")}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-[#9f1f47]"
              title="Видалити">✕</button>
          </div>
        )
      )}
    </div>
  );
};

const MediaGroup = ({ imageUrl, videoUrl, reelUrl, onImage, onVideo, onReel }: {
  imageUrl: string; videoUrl: string; reelUrl: string;
  onImage: (v: string) => void; onVideo: (v: string) => void; onReel: (v: string) => void;
}) => (
  <div className="flex flex-col gap-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <MediaField label="Картинка (горизонтальна)" value={imageUrl} onChange={onImage} accept="image/*" isVideo={false} />
      <MediaField label="Відео / GIF (горизонтальне)" value={videoUrl} onChange={onVideo} accept="video/*,image/gif" isVideo={true} />
    </div>
    <MediaField label="Вертикальне відео / Reels (9:16)" value={reelUrl} onChange={onReel} accept="video/*" isVideo={true} />
  </div>
);

// ─── EntityCard ───────────────────────────────────────────────────────────────
const EntityCard = ({ title, subtitle, imageUrl, onDelete, onEdit, badge, isEditing, icon }: { title: string; subtitle?: string; imageUrl?: string; onDelete: () => void; onEdit: () => void; badge?: { label: string; color: string }; isEditing?: boolean; icon?: React.ReactNode }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onEdit}
    onKeyDown={e => e.key === "Enter" && onEdit()}
    className={`group flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${
      isEditing
        ? "border-[#002f5e]/40 bg-[#002f5e]/6 ring-2 ring-[#002f5e]/15"
        : "border-[#002f5e]/10 bg-white/70 hover:border-[#002f5e]/25 hover:bg-white"
    }`}
  >
    {imageUrl ? (
      <img src={imageUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" onError={e => (e.currentTarget.style.display = "none")} />
    ) : (
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#002f5e]/8">
        {icon ?? <Landmark className="h-5 w-5 text-[#002f5e]/40" />}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="truncate text-[14px] font-semibold text-[#002f5e]">{title}</p>
        {badge && (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: badge.color }}>{badge.label}</span>
        )}
      </div>
      {subtitle && <p className="truncate text-[12px] text-[#002f5e]/55">{subtitle}</p>}
    </div>
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onDelete(); }}
      className="ml-1 shrink-0 rounded-lg p-1.5 text-[#9f1f47]/30 opacity-0 transition group-hover:opacity-100 hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
);

// ─── Main Admin Component ─────────────────────────────────────────────────────

const Admin = () => {
  const [section, setSection] = useState<AdminSection>("districts");
  const [placePageType, setPlacePageType] = useState<PlacePageType>("attraction");
  const [regions, setRegions] = useState<Region[]>(hasSupabaseConfig ? [] : seedRegions);
  const [districts, setDistricts] = useState<District[]>(hasSupabaseConfig ? [] : seedDistricts);
  const [cities, setCities] = useState<City[]>(hasSupabaseConfig ? [] : seedCities);
  const [places, setPlaces] = useState<TourismObject[]>(hasSupabaseConfig ? [] : seedObjects);
  const [contentCards, setContentCards] = useState<ContentCardEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // District form
  const defaultRegionId = regions[0]?.id ?? "";
  const [districtForm, setDistrictForm] = useState<DistrictForm>(emptyDistrict(defaultRegionId));
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);

  // City form
  const [cityForm, setCityForm] = useState<CityForm>(emptyCity(districts[0]?.id ?? ""));
  const [editingCityId, setEditingCityId] = useState<string | null>(null);

  // Place form
  const [placeForm, setPlaceForm] = useState<PlaceForm>(emptyPlace(cities[0]?.id ?? ""));
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const snap = await loadHierarchySnapshot();
      setRegions(snap.regions);
      setDistricts(snap.districts);
      setCities(snap.cities);
      setPlaces(snap.objects);
      setContentCards(snap.contentCards ?? []);
      // оновлюємо дефолтні id у формах після завантаження реальних даних
      setCityForm(prev => prev.districtId && snap.districts.find(d => d.id === prev.districtId) ? prev : emptyCity(snap.districts[0]?.id ?? ""));
      setPlaceForm(prev => prev.cityId && snap.cities.find(c => c.id === prev.cityId) ? prev : emptyPlace(snap.cities[0]?.id ?? ""));
    } catch (e: any) {
      showToast(e?.message ?? "Помилка завантаження", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  // ─── District handlers ──────────────────────────────────────────────────────

  const handleDistrictSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!districtForm.name.trim()) return showToast("Введіть назву району", false);
    setSaving(true);
    try {
      const id = editingDistrictId ?? `district-${uid()}`;
      const existingDistrict = districts.find(d => d.id === id);
      const baseSlug = slugify(districtForm.name);
      const slugExists = !existingDistrict && districts.some(d => d.slug === baseSlug);
      const district: District = {
        id,
        regionId: districtForm.regionId || defaultRegionId,
        name: districtForm.name.trim(),
        slug: existingDistrict?.slug ?? (slugExists ? `${baseSlug}-${uid().slice(0, 4)}` : baseSlug),
        subtitle: districtForm.subtitle || undefined,
        description: districtForm.description || undefined,
        detailedInfo: districtForm.detailedInfo || undefined,
        imageUrl: districtForm.imageUrl || undefined,
        videoUrl: districtForm.videoUrl || undefined,
        reelUrl: districtForm.reelUrl || undefined,
      };
      await upsertDistrict(district);
      setDistricts(prev => editingDistrictId ? prev.map(d => d.id === id ? district : d) : [district, ...prev]);
      setDistrictForm(emptyDistrict(districtForm.regionId));
      setEditingDistrictId(null);
      showToast(editingDistrictId ? "Район оновлено" : "Район створено");
    } catch (e: any) {
      showToast(e?.message ?? "Помилка збереження", false);
    } finally {
      setSaving(false);
    }
  };

  const editDistrict = (d: District) => {
    setEditingDistrictId(d.id);
    setDistrictForm({ id: d.id, name: d.name, subtitle: d.subtitle ?? "", description: d.description ?? "", detailedInfo: d.detailedInfo ?? "", imageUrl: d.imageUrl ?? "", videoUrl: d.videoUrl ?? "", reelUrl: d.reelUrl ?? "", regionId: d.regionId });
  };

  const handleDeleteDistrict = async (id: string) => {
    if (!confirm("Видалити район? Це також видалить пов'язані міста.")) return;
    try {
      await deleteDistrict(id);
      setDistricts(prev => prev.filter(d => d.id !== id));
      showToast("Район видалено");
    } catch (e: any) { showToast(e?.message ?? "Помилка", false); }
  };

  // ─── City handlers ──────────────────────────────────────────────────────────

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityForm.name.trim()) return showToast("Введіть назву міста", false);
    if (!cityForm.districtId) return showToast("Оберіть район", false);
    setSaving(true);
    try {
      const id = editingCityId ?? `city-${uid()}`;
      const existingCity = cities.find(c => c.id === id);
      const baseCitySlug = slugify(cityForm.name);
      const citySlugExists = !existingCity && cities.some(c => c.slug === baseCitySlug);
      const city: City = {
        id,
        districtId: cityForm.districtId,
        name: cityForm.name.trim(),
        slug: existingCity?.slug ?? (citySlugExists ? `${baseCitySlug}-${uid().slice(0, 4)}` : baseCitySlug),
        settlementType: (cityForm.settlementType as any) || undefined,
        subtitle: cityForm.subtitle || undefined,
        description: cityForm.description || undefined,
        detailedInfo: cityForm.detailedInfo || undefined,
        imageUrl: cityForm.imageUrl || undefined,
        videoUrl: cityForm.videoUrl || undefined,
        reelUrl: cityForm.reelUrl || undefined,
        weatherCityName: cityForm.weatherCityName || undefined,
      };
      await upsertCity(city);
      setCities(prev => editingCityId ? prev.map(c => c.id === id ? city : c) : [city, ...prev]);
      setCityForm(emptyCity(cityForm.districtId));
      setEditingCityId(null);
      showToast(editingCityId ? "Місто оновлено" : "Місто створено");
    } catch (e: any) {
      showToast(e?.message ?? "Помилка збереження", false);
    } finally {
      setSaving(false);
    }
  };

  const editCity = (c: City) => {
    setEditingCityId(c.id);
    setCityForm({ id: c.id, name: c.name, subtitle: c.subtitle ?? "", description: c.description ?? "", detailedInfo: c.detailedInfo ?? "", imageUrl: c.imageUrl ?? "", videoUrl: c.videoUrl ?? "", reelUrl: c.reelUrl ?? "", districtId: c.districtId, weatherCityName: c.weatherCityName ?? "", settlementType: c.settlementType ?? "місто" });
  };

  const handleDeleteCity = async (id: string) => {
    if (!confirm("Видалити місто? Це також видалить пов'язані місця.")) return;
    try {
      await deleteCity(id);
      setCities(prev => prev.filter(c => c.id !== id));
      showToast("Місто видалено");
    } catch (e: any) { showToast(e?.message ?? "Помилка", false); }
  };

  // ─── Place handlers ─────────────────────────────────────────────────────────

  const handlePlaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeForm.name.trim()) return showToast("Введіть назву місця", false);
    if (!placeForm.districtOnlyMode && !placeForm.cityId) return showToast("Оберіть населений пункт", false);
    if (placeForm.districtOnlyMode && !placeForm.cityId) return showToast("Оберіть район", false);
    setSaving(true);
    try {
      const id = editingPlaceId ?? `place-${uid()}`;
      const city = placeForm.districtOnlyMode ? null : cities.find(c => c.id === placeForm.cityId) ?? null;
      const districtId = placeForm.districtOnlyMode
        ? placeForm.cityId
        : (districts.find(d => d.id === city?.districtId)?.id ?? "");
      const place: TourismObject = {
        id, type: placeForm.type,
        cityId: placeForm.districtOnlyMode ? null : placeForm.cityId,
        districtId,
        name: placeForm.name.trim(),
        slug: editingPlaceId ? placeForm.slug : `${slugify(placeForm.name)}-${uid().slice(0, 6)}`,

        published: placeForm.published,
        subtitle: placeForm.subtitle || undefined,
        description: placeForm.description || undefined,
        detailedInfo: placeForm.detailedInfo || undefined,
        imageUrl: placeForm.imageUrl || undefined,
        videoUrl: placeForm.videoUrl || undefined,
        reelUrl: placeForm.reelUrl || undefined,
        mapUrl: placeForm.mapUrl || undefined,
        address: placeForm.address || undefined,
        phone: placeForm.phone || undefined,
        website: placeForm.website || undefined,
        eventDates: placeForm.eventDates || undefined,
        hours: placeForm.hours || undefined,
        amenities: placeForm.amenities || undefined,
        tourismTypes: placeForm.tourismTypes.length ? placeForm.tourismTypes : undefined,
      };
      await upsertTourismObject(place);
      setPlaces(prev => editingPlaceId ? prev.map(p => p.id === id ? place : p) : [place, ...prev]);
      setPlaceForm(emptyPlace(placeForm.cityId));
      setEditingPlaceId(null);
      showToast(editingPlaceId ? "Місце оновлено" : "Місце створено");
    } catch (e: any) {
      showToast(e?.message ?? "Помилка збереження", false);
    } finally {
      setSaving(false);
    }
  };

  const editPlace = (p: TourismObject) => {
    setEditingPlaceId(p.id);
    const isDistrictOnly = !p.cityId;
    setPlaceForm({ id: p.id, slug: p.slug, name: p.name, subtitle: p.subtitle ?? "", description: p.description ?? "", detailedInfo: p.detailedInfo ?? "", imageUrl: p.imageUrl ?? "", videoUrl: p.videoUrl ?? "", reelUrl: p.reelUrl ?? "", cityId: isDistrictOnly ? p.districtId : (p.cityId ?? ""), districtOnlyMode: isDistrictOnly, type: p.type, mapUrl: p.mapUrl ?? "", address: p.address ?? "", phone: p.phone ?? "", website: p.website ?? "", eventDates: p.eventDates ?? "", hours: p.hours ?? "", amenities: p.amenities ?? "", published: p.published, tourismTypes: p.tourismTypes ?? [] });
  };

  const handleDeletePlace = async (id: string) => {
    if (!confirm("Видалити місце?")) return;
    try {
      await deleteTourismObject(id);
      setPlaces(prev => prev.filter(p => p.id !== id));
      showToast("Місце видалено");
    } catch (e: any) { showToast(e?.message ?? "Помилка", false); }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const navItems: { id: AdminSection; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "districts", label: "Райони",      icon: <MapPin className="h-5 w-5" />,          count: districts.length },
    { id: "cities",    label: "Нас. пункти", icon: <Building2 className="h-5 w-5" />,       count: cities.length },
    { id: "places",    label: "Місця",       icon: <Landmark className="h-5 w-5" />,        count: places.length },
  ];
  const constructorItem = { id: "constructor" as AdminSection, label: "Конструктор", icon: <LayoutDashboard className="h-5 w-5" />, count: contentCards.filter(c => c.pageKey === "index").length };

  const pageNavItems: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    { id: "pages-district", label: "Район",  icon: <MapPin className="h-4 w-4" /> },
    { id: "pages-city",     label: "Місто",  icon: <Building2 className="h-4 w-4" /> },
    { id: "pages-place",    label: "Місце",  icon: <Landmark className="h-4 w-4" /> },
  ];

  const PLACE_PAGE_TYPES: { value: PlacePageType; label: string; icon: React.ReactNode; color: string }[] = [
    { value: "attraction", label: "Тур. об'єкт", icon: <Landmark className="h-4 w-4" />,         color: "#002f5e" },
    { value: "event",      label: "Подія",        icon: <Calendar className="h-4 w-4" />,         color: "#9f1f47" },
    { value: "restaurant", label: "Ресторан",     icon: <UtensilsCrossed className="h-4 w-4" />,  color: "#eea846" },
    { value: "hotel",      label: "Готель",       icon: <BedDouble className="h-4 w-4" />,        color: "#17a358" },
  ];

  return (
    <AdminLoginGate>
    <div className="min-h-screen bg-[#fff2e8] text-[#002f5e]">
      {/* Toast */}
      {toast && (
        <div className={`fixed right-5 top-5 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-medium text-white shadow-xl transition-all ${toast.ok ? "bg-[#002f5e]" : "bg-[#9f1f47]"}`}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-[1400px] flex-col">
        {/* Header */}
        <header className="border-b border-[#002f5e]/10 bg-[#fff2e8] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton to="/" invert={false} />
              <div className="h-6 w-px bg-[#002f5e]/15" />
              <div>
                <h1 className="font-odesa-medium text-[28px] leading-none">Адміністрування</h1>
                <p className="mt-0.5 text-[12px] text-[#002f5e]/50">Одеська область · туристичний контент</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ${hasSupabaseConfig ? "bg-[#002f5e]/10 text-[#002f5e]" : "bg-amber-100 text-amber-700"}`}>
                <Settings2 className="h-3.5 w-3.5" />
                {hasSupabaseConfig ? "Supabase" : "Local mode"}
              </span>
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={loading}
                className="rounded-xl border border-[#002f5e]/15 bg-white px-4 py-1.5 text-[13px] font-medium text-[#002f5e] transition hover:bg-[#002f5e]/5 disabled:opacity-50"
              >
                {loading ? "Оновлення..." : "Оновити"}
              </button>
              <button
                  type="button"
                  onClick={() => { sessionStorage.removeItem("tourism_admin_session"); window.location.reload(); }}
                  className="flex items-center gap-1.5 rounded-xl border border-[#002f5e]/15 bg-white px-3 py-1.5 text-[13px] font-medium text-[#002f5e]/50 transition hover:bg-[#9f1f47]/8 hover:text-[#9f1f47] hover:border-[#9f1f47]/20"
                  title="Вийти"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-56 shrink-0 px-3 pt-6 pb-6">
            <div className="rounded-2xl border border-[#002f5e]/10 bg-white/40 px-2 py-3">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-[#002f5e]/40">Об'єкти</p>
              <nav className="flex flex-col gap-1">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${
                      section === item.id
                        ? "bg-[#002f5e] text-[#fff2e8]"
                        : "text-[#002f5e]/70 hover:bg-[#002f5e]/8 hover:text-[#002f5e]"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${section === item.id ? "bg-white/20 text-white" : "bg-[#002f5e]/8 text-[#002f5e]/60"}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="my-3 h-px bg-[#002f5e]/10" />
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-[#002f5e]/40">Сайт</p>
              <nav className="flex flex-col gap-1">
                {[constructorItem].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${
                      section === item.id
                        ? "bg-[#002f5e] text-[#fff2e8]"
                        : "text-[#002f5e]/70 hover:bg-[#002f5e]/8 hover:text-[#002f5e]"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${section === item.id ? "bg-white/20 text-white" : "bg-[#002f5e]/8 text-[#002f5e]/60"}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="my-3 h-px bg-[#002f5e]/10" />
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-[#002f5e]/40">Сторінки</p>
              <nav className="flex flex-col gap-1">
                {pageNavItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${
                      section === item.id
                        ? "bg-[#002f5e] text-[#fff2e8]"
                        : "text-[#002f5e]/70 hover:bg-[#002f5e]/8 hover:text-[#002f5e]"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                    <ChevronRight className={`ml-auto h-3.5 w-3.5 ${section === item.id ? "text-[#fff2e8]/50" : "text-[#002f5e]/25"}`} />
                  </button>
                ))}
              </nav>

              <div className="my-3 h-px bg-[#002f5e]/10" />
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-[#002f5e]/40">Контент</p>
              <nav className="flex flex-col gap-1">
                {[
                  { id: "tourism-types" as AdminSection, label: "Види туризму", icon: <Palmtree className="h-4 w-4" /> },
                  { id: "articles" as AdminSection, label: "Статті", icon: <Newspaper className="h-4 w-4" /> },
                ].map(item => (
                  <button key={item.id} type="button" onClick={() => setSection(item.id)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-medium transition ${
                      section === item.id ? "bg-[#002f5e] text-[#fff2e8]" : "text-[#002f5e]/70 hover:bg-[#002f5e]/8 hover:text-[#002f5e]"
                    }`}>
                    {item.icon}
                    {item.label}
                    <ChevronRight className={`ml-auto h-3.5 w-3.5 ${section === item.id ? "text-[#fff2e8]/50" : "text-[#002f5e]/25"}`} />
                  </button>
                ))}
              </nav>

              {!hasSupabaseConfig && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-[11px] text-amber-700 leading-relaxed">
                  <strong>Local mode:</strong> зміни не зберігаються в базу даних. Додайте <code>VITE_SUPABASE_URL</code> та <code>VITE_SUPABASE_ANON_KEY</code>.
                </div>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className="flex flex-1 gap-6 overflow-auto p-6">

            {/* ── DISTRICTS ── */}
            {section === "districts" && (
              <>
                {/* Form */}
                <section className="flex-1 min-w-0">
                  <div className="sticky top-0 rounded-2xl border border-[#002f5e]/12 bg-white/80 p-6 shadow-sm backdrop-blur">
                    <div className="mb-5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#002f5e]/8">
                          <MapPin className="h-4 w-4 text-[#002f5e]" />
                        </div>
                        <h2 className="text-[18px] font-semibold">{editingDistrictId ? "Редагувати район" : "Новий район"}</h2>
                      </div>
                      {editingDistrictId && (
                        <button type="button" onClick={() => { setEditingDistrictId(null); setDistrictForm(emptyDistrict(defaultRegionId)); }} className="rounded-xl border border-[#002f5e]/15 px-3 py-1.5 text-[13px] text-[#002f5e]/50 hover:border-[#002f5e]/30 hover:text-[#002f5e] transition">
                          ✕ Скасувати
                        </button>
                      )}
                    </div>
                    <form onSubmit={e => void handleDistrictSubmit(e)} className="flex flex-col gap-4">
                      <FieldGroup label="Регіон">
                        <FormSelect value={districtForm.regionId} onChange={v => setDistrictForm(p => ({ ...p, regionId: v }))}>
                          {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </FormSelect>
                      </FieldGroup>
                      <FieldGroup label="Назва *">
                        <Input value={districtForm.name} onChange={v => setDistrictForm(p => ({ ...p, name: v }))} placeholder="Наприклад: Білгород-Дністровський район" />
                      </FieldGroup>
                      <FieldGroup label="Підзаголовок">
                        <Input value={districtForm.subtitle} onChange={v => setDistrictForm(p => ({ ...p, subtitle: v }))} placeholder="Короткий підзаголовок" />
                      </FieldGroup>
                      <div><span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Опис</span>
                        <RichTextEditor value={districtForm.description} onChange={v => setDistrictForm(p => ({ ...p, description: v }))} />
                      </div>
                      <div><span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Детальна інформація</span>
                        <RichTextEditor value={districtForm.detailedInfo} onChange={v => setDistrictForm(p => ({ ...p, detailedInfo: v }))} />
                      </div>
                      <MediaGroup
                        imageUrl={districtForm.imageUrl} videoUrl={districtForm.videoUrl} reelUrl={districtForm.reelUrl}
                        onImage={v => setDistrictForm(p => ({ ...p, imageUrl: v }))} onVideo={v => setDistrictForm(p => ({ ...p, videoUrl: v }))} onReel={v => setDistrictForm(p => ({ ...p, reelUrl: v }))}
                      />
                      <div className="flex items-center justify-between pt-2">
                        <SaveBtn saving={saving} label={editingDistrictId ? "Оновити район" : "Створити район"} />
                      </div>
                    </form>
                  </div>
                </section>

                {/* List */}
                <section className="w-[300px] shrink-0">
                  <h3 className="mb-4 text-[16px] font-semibold text-[#002f5e]/70">
                    Всі райони <span className="text-[#002f5e]/40">({districts.length})</span>
                  </h3>
                  {districts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-16 text-center">
                      <Plus className="h-8 w-8 text-[#002f5e]/25" />
                      <p className="text-[14px] text-[#002f5e]/45">Ще немає районів. Створіть перший!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {districts.map(d => (
                        <EntityCard
                          key={d.id}
                          title={d.name}
                          subtitle={d.subtitle ?? regions.find(r => r.id === d.regionId)?.name}
                          imageUrl={d.imageUrl}
                          icon={<MapPin className="h-5 w-5 text-[#002f5e]/40" />}
                          isEditing={editingDistrictId === d.id}
                          onEdit={() => editDistrict(d)}
                          onDelete={() => void handleDeleteDistrict(d.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* ── CITIES ── */}
            {section === "cities" && (
              <>
                <section className="flex-1 min-w-0">
                  <div className="sticky top-0 rounded-2xl border border-[#002f5e]/12 bg-white/80 p-6 shadow-sm backdrop-blur">
                    <div className="mb-5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#002f5e]/8">
                          <Building2 className="h-4 w-4 text-[#002f5e]" />
                        </div>
                        <h2 className="text-[18px] font-semibold">{editingCityId ? "Редагувати населений пункт" : "Новий населений пункт"}</h2>
                      </div>
                      {editingCityId && (
                        <button type="button" onClick={() => { setEditingCityId(null); setCityForm(emptyCity(cityForm.districtId)); }} className="rounded-xl border border-[#002f5e]/15 px-3 py-1.5 text-[13px] text-[#002f5e]/50 hover:border-[#002f5e]/30 hover:text-[#002f5e] transition">
                          ✕ Скасувати
                        </button>
                      )}
                    </div>
                    <form onSubmit={e => void handleCitySubmit(e)} className="flex flex-col gap-4">
                      <FieldGroup label="Тип населеного пункту *">
                        <FormSelect value={cityForm.settlementType} onChange={v => setCityForm(p => ({ ...p, settlementType: v }))}>
                          <option value="місто">Місто</option>
                          <option value="село">Село</option>
                          <option value="селище">Селище</option>
                          <option value="селище міського типу">Селище міського типу</option>
                        </FormSelect>
                      </FieldGroup>
                      <FieldGroup label="Район *">
                        <FormSelect value={cityForm.districtId} onChange={v => setCityForm(p => ({ ...p, districtId: v }))} disabled={districts.length === 0}>
                          {districts.length === 0 && <option value="">— Спочатку створіть район —</option>}
                          {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </FormSelect>
                      </FieldGroup>
                      <FieldGroup label="Назва *">
                        <Input value={cityForm.name} onChange={v => setCityForm(p => ({ ...p, name: v }))} placeholder="Наприклад: Білгород-Дністровський" />
                      </FieldGroup>
                      <FieldGroup label="Підзаголовок">
                        <Input value={cityForm.subtitle} onChange={v => setCityForm(p => ({ ...p, subtitle: v }))} placeholder="Короткий підзаголовок" />
                      </FieldGroup>
                      <div><span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Опис</span>
                        <RichTextEditor value={cityForm.description} onChange={v => setCityForm(p => ({ ...p, description: v }))} />
                      </div>
                      <div><span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Детальна інформація</span>
                        <RichTextEditor value={cityForm.detailedInfo} onChange={v => setCityForm(p => ({ ...p, detailedInfo: v }))} />
                      </div>
                      <MediaGroup
                        imageUrl={cityForm.imageUrl} videoUrl={cityForm.videoUrl} reelUrl={cityForm.reelUrl}
                        onImage={v => setCityForm(p => ({ ...p, imageUrl: v }))} onVideo={v => setCityForm(p => ({ ...p, videoUrl: v }))} onReel={v => setCityForm(p => ({ ...p, reelUrl: v }))}
                      />
                      <FieldGroup label={<>WeatherName <span className="normal-case text-[11px] text-[#002f5e]/40 font-normal">(необов&apos;язково — англ. назва для OpenWeather, напр. &ldquo;Odessa&rdquo;)</span></>}>
                        <Input value={cityForm.weatherCityName} onChange={v => setCityForm(p => ({ ...p, weatherCityName: v }))} placeholder="напр. Odessa, Bolhrad..." />
                      </FieldGroup>
                      <div className="flex items-center justify-between pt-2">
                        <SaveBtn saving={saving} label={editingCityId ? "Оновити" : "Створити"} />
                      </div>
                    </form>
                  </div>
                </section>

                <section className="w-[300px] shrink-0">
                  <h3 className="mb-4 text-[16px] font-semibold text-[#002f5e]/70">
                    Всі населені пункти <span className="text-[#002f5e]/40">({cities.length})</span>
                  </h3>
                  {cities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-16 text-center">
                      <Plus className="h-8 w-8 text-[#002f5e]/25" />
                      <p className="text-[14px] text-[#002f5e]/45">Ще немає населених пунктів. Спочатку створіть район!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {cities.map(c => {
                        const dist = districts.find(d => d.id === c.districtId);
                        return (
                          <EntityCard
                            key={c.id}
                            title={c.name}
                            subtitle={dist?.name ?? c.districtId}
                            imageUrl={c.imageUrl}
                            icon={<Building2 className="h-5 w-5 text-[#002f5e]/40" />}
                            isEditing={editingCityId === c.id}
                            onEdit={() => editCity(c)}
                            onDelete={() => void handleDeleteCity(c.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* ── PLACES ── */}
            {section === "places" && (
              <>
                <section className="flex-1 min-w-0">
                  <div className="sticky top-0 rounded-2xl border border-[#002f5e]/12 bg-white/80 p-6 shadow-sm backdrop-blur">
                    <div className="mb-5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#002f5e]/8">
                          <Landmark className="h-4 w-4 text-[#002f5e]" />
                        </div>
                        <h2 className="text-[18px] font-semibold">{editingPlaceId ? "Редагувати місце" : "Нове місце"}</h2>
                      </div>
                      {editingPlaceId && (
                        <button type="button" onClick={() => { setEditingPlaceId(null); setPlaceForm(emptyPlace(placeForm.cityId)); }} className="rounded-xl border border-[#002f5e]/15 px-3 py-1.5 text-[13px] text-[#002f5e]/50 hover:border-[#002f5e]/30 hover:text-[#002f5e] transition">
                          ✕ Скасувати
                        </button>
                      )}
                    </div>
                    <form onSubmit={e => void handlePlaceSubmit(e)} className="flex flex-col gap-4">
                      {/* Type selector */}
                      <div>
                        <Label>Тип місця *</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {PLACE_TYPES.map(pt => (
                            <button
                              key={pt.value}
                              type="button"
                              onClick={() => setPlaceForm(p => ({ ...p, type: pt.value }))}
                              className={`rounded-xl border px-3 py-2.5 text-[13px] font-medium transition ${
                                placeForm.type === pt.value
                                  ? "border-transparent text-white"
                                  : "border-[#002f5e]/12 bg-white text-[#002f5e]/60 hover:border-[#002f5e]/25"
                              }`}
                              style={placeForm.type === pt.value ? { backgroundColor: pt.color } : {}}
                            >
                              {pt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Прив'язка */}
                      <div className="rounded-xl border border-[#002f5e]/12 bg-[#002f5e]/3 p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <span className="text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Прив'язка</span>
                          <div className="flex rounded-lg border border-[#002f5e]/12 bg-white/60 p-0.5 text-[12px]">
                            <button type="button"
                              onClick={() => setPlaceForm(p => ({ ...p, districtOnlyMode: false }))}
                              className={`rounded-md px-3 py-1 transition ${!placeForm.districtOnlyMode ? "bg-[#002f5e] text-white" : "text-[#002f5e]/50 hover:text-[#002f5e]"}`}>
                              До населеного пункту
                            </button>
                            <button type="button"
                              onClick={() => setPlaceForm(p => ({ ...p, districtOnlyMode: true, cityId: districts[0]?.id ?? "" }))}
                              className={`rounded-md px-3 py-1 transition ${placeForm.districtOnlyMode ? "bg-[#002f5e] text-white" : "text-[#002f5e]/50 hover:text-[#002f5e]"}`}>
                              Тільки до району
                            </button>
                          </div>
                        </div>
                        {placeForm.districtOnlyMode ? (
                          <FormSelect value={placeForm.cityId} onChange={v => setPlaceForm(p => ({ ...p, cityId: v }))} disabled={districts.length === 0}>
                            {districts.length === 0 && <option value="">— Немає районів —</option>}
                            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </FormSelect>
                        ) : (
                          <FormSelect value={placeForm.cityId} onChange={v => setPlaceForm(p => ({ ...p, cityId: v }))} disabled={cities.length === 0}>
                            {cities.length === 0 && <option value="">— Спочатку створіть населений пункт —</option>}
                            {cities.map(c => <option key={c.id} value={c.id}>{c.settlementType ? `${c.settlementType} ` : ""}{c.name}</option>)}
                          </FormSelect>
                        )}
                      </div>

                      <FieldGroup label="Назва *">
                        <Input value={placeForm.name} onChange={v => setPlaceForm(p => ({ ...p, name: v }))} placeholder={
                          placeForm.type === "attraction" ? "Наприклад: Акерманська фортеця" :
                          placeForm.type === "event" ? "Наприклад: Фестиваль Бессарабії" :
                          placeForm.type === "restaurant" ? "Наприклад: Ресторан Рибний двір" :
                          "Наприклад: Готель Золота підкова"
                        } />
                      </FieldGroup>
                      <FieldGroup label="Підзаголовок">
                        <Input value={placeForm.subtitle} onChange={v => setPlaceForm(p => ({ ...p, subtitle: v }))} placeholder="Короткий підзаголовок" />
                      </FieldGroup>
                      <div><span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Опис</span>
                        <RichTextEditor value={placeForm.description} onChange={v => setPlaceForm(p => ({ ...p, description: v }))} />
                      </div>
                      <div><span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Детальна інформація</span>
                        <RichTextEditor value={placeForm.detailedInfo} onChange={v => setPlaceForm(p => ({ ...p, detailedInfo: v }))} />
                      </div>

                      {/* Type-specific fields */}
                      {(placeForm.type === "attraction" || placeForm.type === "event" || placeForm.type === "hotel" || placeForm.type === "restaurant") && (
                        <FieldGroup label="Місцезнаходження (посилання на карту)">
                          <Input value={placeForm.mapUrl} onChange={v => setPlaceForm(p => ({ ...p, mapUrl: v }))} placeholder="https://maps.google.com/..." />
                        </FieldGroup>
                      )}

                      {placeForm.type === "event" && (
                        <FieldGroup label="Дати проведення">
                          <Input value={placeForm.eventDates} onChange={v => setPlaceForm(p => ({ ...p, eventDates: v }))} placeholder="Наприклад: 24.04 – 03.05.2026" />
                        </FieldGroup>
                      )}

                      {(placeForm.type === "restaurant" || placeForm.type === "hotel" || placeForm.type === "attraction") && (
                        <>
                          <MultiField label="Адреса" value={placeForm.address} onChange={v => setPlaceForm(p => ({ ...p, address: v }))} placeholder="вул. Пушкінська, 15" />
                          <MultiField label="Телефон" value={placeForm.phone} onChange={v => setPlaceForm(p => ({ ...p, phone: v }))} placeholder="+380..." />
                          <MultiField label="Сайт" value={placeForm.website} onChange={v => setPlaceForm(p => ({ ...p, website: v }))} placeholder="https://..." />
                          <FieldGroup label={placeForm.type === "hotel" ? "Зручності та послуги" : "Години роботи"}>
                            <Input
                              value={placeForm.type === "hotel" ? placeForm.amenities : placeForm.hours}
                              onChange={v => setPlaceForm(p => placeForm.type === "hotel" ? ({ ...p, amenities: v }) : ({ ...p, hours: v }))}
                              placeholder={placeForm.type === "hotel" ? "Wi-Fi, паркінг, басейн..." : "Пн-Нд 10:00–22:00"}
                            />
                          </FieldGroup>
                        </>
                      )}

                      <MediaGroup
                        imageUrl={placeForm.imageUrl} videoUrl={placeForm.videoUrl} reelUrl={placeForm.reelUrl}
                        onImage={v => setPlaceForm(p => ({ ...p, imageUrl: v }))} onVideo={v => setPlaceForm(p => ({ ...p, videoUrl: v }))} onReel={v => setPlaceForm(p => ({ ...p, reelUrl: v }))}
                      />

                      {/* Тип туризму */}
                      <div>
                        <Label>Тип туризму</Label>
                        <div className="flex flex-col gap-1 rounded-xl border border-[#002f5e]/12 bg-[#002f5e]/3 p-3">
                          {TOURISM_TYPES.map(tt => (
                            <label key={tt} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-[#002f5e]/5">
                              <input
                                type="checkbox"
                                checked={placeForm.tourismTypes.includes(tt)}
                                onChange={e => setPlaceForm(p => ({
                                  ...p,
                                  tourismTypes: e.target.checked
                                    ? [...p.tourismTypes, tt]
                                    : p.tourismTypes.filter(x => x !== tt),
                                }))}
                                className="h-4 w-4 shrink-0 rounded accent-[#002f5e]"
                              />
                              <span className="text-[13px] text-[#002f5e]">{tt}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl bg-[#002f5e]/5 px-4 py-3">
                        <input
                          type="checkbox"
                          id="published"
                          checked={placeForm.published}
                          onChange={e => setPlaceForm(p => ({ ...p, published: e.target.checked }))}
                          className="h-4 w-4 rounded accent-[#002f5e]"
                        />
                        <label htmlFor="published" className="text-[13px] font-medium text-[#002f5e]">Опубліковано (видно на сайті)</label>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <SaveBtn saving={saving} label={editingPlaceId ? "Оновити місце" : "Створити місце"} />
                      </div>
                    </form>
                  </div>
                </section>

                <section className="w-[300px] shrink-0">
                  <h3 className="mb-4 text-[16px] font-semibold text-[#002f5e]/70">
                    Всі місця <span className="text-[#002f5e]/40">({places.length})</span>
                  </h3>
                  {places.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-16 text-center">
                      <Plus className="h-8 w-8 text-[#002f5e]/25" />
                      <p className="text-[14px] text-[#002f5e]/45">Ще немає місць. Спочатку створіть місто!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {places.map(p => {
                        const typeInfo = PLACE_TYPES.find(t => t.value === p.type);
                        const city = cities.find(c => c.id === p.cityId);
                        return (
                          <EntityCard
                            key={p.id}
                            title={p.name}
                            subtitle={city?.name}
                            imageUrl={p.imageUrl}
                            icon={<Landmark className="h-5 w-5 text-[#002f5e]/40" />}
                            badge={typeInfo ? { label: typeInfo.label, color: typeInfo.color } : undefined}
                            isEditing={editingPlaceId === p.id}
                            onEdit={() => editPlace(p)}
                            onDelete={() => void handleDeletePlace(p.id)}
                          />
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}

            {/* ── CONSTRUCTOR ── */}
            {section === "constructor" && (
              <AdminConstructor
                contentCards={contentCards}
                places={places}
                districts={districts}
                cities={cities}
                onCardsChange={setContentCards}
                showToast={showToast}
              />
            )}

            {/* ── PAGES: DISTRICT ── */}
            {section === "pages-district" && (
              <div className="flex flex-1 min-w-0 flex-col">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#002f5e]/8">
                    <MapPin className="h-4 w-4 text-[#002f5e]" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#002f5e]">Сторінки районів</h2>
                    <p className="text-[12px] text-[#002f5e]/45">Налаштуйте блоки та розділи для сторінок районів</p>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <AdminPageEditor
                    entityType="district"
                    districts={districts}
                    cities={cities}
                    places={places}
                    showToast={showToast}
                  />
                </div>
              </div>
            )}

            {/* ── PAGES: CITY ── */}
            {section === "pages-city" && (
              <div className="flex flex-1 min-w-0 flex-col">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#002f5e]/8">
                    <Building2 className="h-4 w-4 text-[#002f5e]" />
                  </div>
                  <div>
                    <h2 className="text-[18px] font-semibold text-[#002f5e]">Сторінки міст</h2>
                    <p className="text-[12px] text-[#002f5e]/45">Налаштуйте блоки та розділи для сторінок міст</p>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <AdminPageEditor
                    entityType="city"
                    districts={districts}
                    cities={cities}
                    places={places}
                    showToast={showToast}
                  />
                </div>
              </div>
            )}

            {/* ── PAGES: PLACE ── */}
            {section === "pages-place" && (
              <div className="flex flex-1 min-w-0 flex-col">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#002f5e]/8">
                      <Landmark className="h-4 w-4 text-[#002f5e]" />
                    </div>
                    <div>
                      <h2 className="text-[18px] font-semibold text-[#002f5e]">Сторінки місць</h2>
                      <p className="text-[12px] text-[#002f5e]/45">Налаштуйте блоки для кожного типу місця</p>
                    </div>
                  </div>
                  {/* Sub-type tabs */}
                  <div className="flex items-center gap-1 rounded-xl border border-[#002f5e]/12 bg-white/50 p-1">
                    {PLACE_PAGE_TYPES.map(pt => (
                      <button
                        key={pt.value}
                        type="button"
                        onClick={() => setPlacePageType(pt.value)}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                          placePageType === pt.value
                            ? "text-white"
                            : "text-[#002f5e]/60 hover:bg-[#002f5e]/8 hover:text-[#002f5e]"
                        }`}
                        style={placePageType === pt.value ? { backgroundColor: pt.color } : {}}
                      >
                        {pt.icon}
                        {pt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <AdminPageEditor
                    key={placePageType}
                    entityType={placePageType}
                    districts={districts}
                    cities={cities}
                    places={places.filter(p => p.type === placePageType)}
                    showToast={showToast}
                  />
                </div>
              </div>
            )}

            {/* ── TOURISM TYPES ── */}
            {section === "tourism-types" && (
              <TourismTypesAdmin showToast={showToast} />
            )}

            {/* ── ARTICLES ── */}
            {section === "articles" && (
              <ArticlesAdmin showToast={showToast} />
            )}

          </main>
        </div>
      </div>
    </div>
    </AdminLoginGate>
  );
};

// ─── Tourism Types Admin ──────────────────────────────────────────────────────
const TOURISM_TYPES_LIST = [
  "Гастрономічний туризм", "Історико-культурний туризм", "Медико-оздоровчий туризм",
  "Морський туризм", "Релігійний туризм", "Розважальний туризм",
  "Сільський та зелений туризм", "Спортивний туризм",
];

const TourismTypesAdmin = ({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) => {
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
      let url = "";
      if (supabase) {
        const ext = file.name.split(".").pop();
        const path = `tourism-types/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
        if (error) throw error;
        url = supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
      } else {
        url = URL.createObjectURL(file);
      }
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
          <p className="text-[12px] text-[#002f5e]/45">Додайте фото для кожного виду туризму</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TOURISM_TYPES_LIST.map(typeName => (
          <div key={typeName} className="overflow-hidden rounded-2xl border border-[#002f5e]/10 bg-white">
            <div className="relative h-[140px] bg-[#002f5e]/5 cursor-pointer"
              onClick={() => fileRefs.current[typeName]?.click()}>
              {typeImages[typeName] ? (
                <img src={typeImages[typeName]} alt={typeName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-[#002f5e]/30">
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
                className="mt-1 text-[12px] text-[#002f5e]/40 transition hover:text-[#002f5e]">
                {typeImages[typeName] ? "Змінити фото" : "Завантажити фото"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Articles Admin ───────────────────────────────────────────────────────────
type ArticleForm = {
  id: string; title: string; subtitle: string; imageUrl: string;
  videoUrl: string; content: string; publishedAt: string; published: boolean;
};

const emptyArticle = (): ArticleForm => ({
  id: "", title: "", subtitle: "", imageUrl: "", videoUrl: "",
  content: "", publishedAt: new Date().toLocaleDateString("uk-UA"), published: true,
});

const ArticlesAdmin = ({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) => {
  const [articles, setArticles] = useState<ContentCardEntity[]>([]);
  const [form, setForm] = useState<ArticleForm>(emptyArticle());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const cards = await loadPublishedContentCards("articles");
    setArticles(cards);
  };
  useEffect(() => { void load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return showToast("Введіть заголовок", false);
    setSaving(true);
    try {
      const id = editingId ?? `article-${Math.random().toString(36).slice(2, 10)}`;
      const card: ContentCardEntity = {
        id, pageKey: "articles", sectionKey: "article", cardType: "text",
        title: form.title.trim(), subtitle: form.subtitle || null,
        imageUrl: form.imageUrl || null, href: null,
        cityId: null, districtId: null, regionId: null,
        sortOrder: editingId ? (articles.find(a => a.id === id)?.sortOrder ?? articles.length) : articles.length,
        published: form.published,
        payload: { content: form.content, publishedAt: form.publishedAt, videoUrl: form.videoUrl },
      };
      await upsertContentCard(card);
      setArticles(prev => editingId ? prev.map(a => a.id === id ? card : a) : [card, ...prev]);
      setForm(emptyArticle()); setEditingId(null);
      showToast(editingId ? "Статтю оновлено" : "Статтю створено");
    } catch (err: any) { showToast(err?.message ?? "Помилка", false); }
    finally { setSaving(false); }
  };

  const startEdit = (card: ContentCardEntity) => {
    setEditingId(card.id);
    setForm({
      id: card.id, title: card.title, subtitle: card.subtitle ?? "",
      imageUrl: card.imageUrl ?? "", videoUrl: String(card.payload?.videoUrl ?? ""),
      content: String(card.payload?.content ?? ""),
      publishedAt: String(card.payload?.publishedAt ?? ""),
      published: card.published,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити статтю?")) return;
    try {
      await deleteContentCard(id);
      setArticles(prev => prev.filter(a => a.id !== id));
      showToast("Статтю видалено");
    } catch (err: any) { showToast(err?.message ?? "Помилка", false); }
  };

  return (
    <div className="flex flex-1 min-w-0 gap-6">
      {/* Form */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl border border-[#002f5e]/12 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#002f5e]/8">
                <Newspaper className="h-4 w-4 text-[#002f5e]" />
              </div>
              <h2 className="text-[18px] font-semibold">{editingId ? "Редагувати статтю" : "Нова стаття"}</h2>
            </div>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyArticle()); }}
                className="rounded-xl border border-[#002f5e]/15 px-3 py-1.5 text-[13px] text-[#002f5e]/50 hover:text-[#002f5e] transition">
                ✕ Скасувати
              </button>
            )}
          </div>
          <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-4">
            <div>
              <span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Заголовок *</span>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Заголовок статті"
                className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition" />
            </div>
            <div>
              <span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Підзаголовок</span>
              <input value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                placeholder="Короткий опис статті"
                className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Головне фото (URL)</span>
                <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition" />
                {form.imageUrl && <img src={form.imageUrl} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" onError={e => (e.currentTarget.style.display = "none")} />}
              </div>
              <div>
                <span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Відео (embed URL)</span>
                <input value={form.videoUrl} onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition" />
              </div>
            </div>
            <div>
              <span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Дата публікації</span>
              <input value={form.publishedAt} onChange={e => setForm(p => ({ ...p, publishedAt: e.target.value }))}
                placeholder="01.01.2026"
                className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition" />
            </div>
            <div>
              <span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Текст статті</span>
              <RichTextEditor value={form.content} onChange={v => setForm(p => ({ ...p, content: v }))} />
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-[#002f5e]/5 px-4 py-3">
              <input type="checkbox" id="art-published" checked={form.published}
                onChange={e => setForm(p => ({ ...p, published: e.target.checked }))}
                className="h-4 w-4 rounded accent-[#002f5e]" />
              <label htmlFor="art-published" className="text-[13px] font-medium text-[#002f5e]">Опубліковано</label>
            </div>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#002f5e] px-6 py-2.5 text-[14px] font-medium text-[#fff2e8] transition hover:bg-[#002f5e]/85 disabled:opacity-60">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? "Зберігається..." : (editingId ? "Оновити статтю" : "Опублікувати")}
            </button>
          </form>
        </div>
      </div>

      {/* List */}
      <div className="w-[300px] shrink-0">
        <h3 className="mb-4 text-[16px] font-semibold text-[#002f5e]/70">
          Всі статті <span className="text-[#002f5e]/40">({articles.length})</span>
        </h3>
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-16 text-center">
            <Newspaper className="h-8 w-8 text-[#002f5e]/25" />
            <p className="text-[14px] text-[#002f5e]/45">Статей поки немає</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {articles.map(a => (
              <div key={a.id} className="group flex items-start gap-3 rounded-2xl border border-[#002f5e]/10 bg-white/70 p-3">
                {a.imageUrl && <img src={a.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#002f5e]">{a.title}</p>
                  <p className="text-[11px] text-[#002f5e]/40">{String(a.payload?.publishedAt ?? "")}</p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <button type="button" onClick={() => startEdit(a)}
                    className="rounded-lg p-1.5 text-[#002f5e]/40 hover:bg-[#002f5e]/8 hover:text-[#002f5e]">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => void handleDelete(a.id)}
                    className="rounded-lg p-1.5 text-[#9f1f47]/30 hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
