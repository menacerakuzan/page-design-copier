import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MapPin, Building2, Landmark, Plus, Trash2, Settings2, AlertCircle, Upload, Link, LayoutDashboard, FileStack, Calendar, UtensilsCrossed, BedDouble, ChevronRight } from "lucide-react";
import BackButton from "@/components/BackButton";
import { regions as seedRegions, districts as seedDistricts, cities as seedCities, tourismObjects as seedObjects } from "@/data/hierarchyMockData";
import { District, City, Region, TourismObject, TourismObjectType } from "@/types/hierarchy";
import { ContentCardEntity } from "@/types/cms";
import { hasSupabaseConfig, supabase } from "@/lib/supabaseClient";
import { loadHierarchySnapshot, upsertDistrict, upsertCity, upsertTourismObject, deleteDistrict, deleteCity, deleteTourismObject } from "@/lib/adminRepository";
import AdminConstructor from "./AdminConstructor";
import AdminPageEditor from "./AdminPageEditor";

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
  detailedInfo: string; imageUrl: string; videoUrl: string; regionId: string;
};

type CityForm = {
  id: string; name: string; subtitle: string; description: string;
  detailedInfo: string; imageUrl: string; videoUrl: string; districtId: string;
  weatherCityName: string;
};

type PlaceForm = {
  id: string; slug: string; name: string; subtitle: string; description: string;
  detailedInfo: string; imageUrl: string; videoUrl: string;
  cityId: string; type: TourismObjectType;
  mapUrl: string; address: string; phone: string; website: string;
  eventDates: string; hours: string; amenities: string;
  published: boolean; tourismTypes: string[];
};

const emptyDistrict = (regionId: string): DistrictForm => ({ id: "", name: "", subtitle: "", description: "", detailedInfo: "", imageUrl: "", videoUrl: "", regionId });
const emptyCity = (districtId: string): CityForm => ({ id: "", name: "", subtitle: "", description: "", detailedInfo: "", imageUrl: "", videoUrl: "", districtId, weatherCityName: "" });
const emptyPlace = (cityId: string): PlaceForm => ({ id: "", slug: "", name: "", subtitle: "", description: "", detailedInfo: "", imageUrl: "", videoUrl: "", cityId, type: "attraction", mapUrl: "", address: "", phone: "", website: "", eventDates: "", hours: "", amenities: "", published: true, tourismTypes: [] });

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

const MediaGroup = ({ imageUrl, videoUrl, onImage, onVideo }: { imageUrl: string; videoUrl: string; onImage: (v: string) => void; onVideo: (v: string) => void }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <MediaField label="Картинка" value={imageUrl} onChange={onImage} accept="image/*" isVideo={false} />
    <MediaField label="Відео / GIF" value={videoUrl} onChange={onVideo} accept="video/*,image/gif" isVideo={true} />
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
    setDistrictForm({ id: d.id, name: d.name, subtitle: d.subtitle ?? "", description: d.description ?? "", detailedInfo: d.detailedInfo ?? "", imageUrl: d.imageUrl ?? "", videoUrl: d.videoUrl ?? "", regionId: d.regionId });
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
        subtitle: cityForm.subtitle || undefined,
        description: cityForm.description || undefined,
        detailedInfo: cityForm.detailedInfo || undefined,
        imageUrl: cityForm.imageUrl || undefined,
        videoUrl: cityForm.videoUrl || undefined,
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
    setCityForm({ id: c.id, name: c.name, subtitle: c.subtitle ?? "", description: c.description ?? "", detailedInfo: c.detailedInfo ?? "", imageUrl: c.imageUrl ?? "", videoUrl: c.videoUrl ?? "", districtId: c.districtId, weatherCityName: c.weatherCityName ?? "" });
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
    if (!placeForm.cityId) return showToast("Оберіть місто", false);
    setSaving(true);
    try {
      const id = editingPlaceId ?? `place-${uid()}`;
      const city = cities.find(c => c.id === placeForm.cityId)!;
      const district = districts.find(d => d.id === city?.districtId)!;
      const place: TourismObject = {
        id, type: placeForm.type,
        cityId: placeForm.cityId,
        districtId: district?.id ?? "",
        name: placeForm.name.trim(),
        slug: editingPlaceId ? placeForm.slug : `${slugify(placeForm.name)}-${uid().slice(0, 6)}`,

        published: placeForm.published,
        subtitle: placeForm.subtitle || undefined,
        description: placeForm.description || undefined,
        detailedInfo: placeForm.detailedInfo || undefined,
        imageUrl: placeForm.imageUrl || undefined,
        videoUrl: placeForm.videoUrl || undefined,
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
    setPlaceForm({ id: p.id, slug: p.slug, name: p.name, subtitle: p.subtitle ?? "", description: p.description ?? "", detailedInfo: p.detailedInfo ?? "", imageUrl: p.imageUrl ?? "", videoUrl: p.videoUrl ?? "", cityId: p.cityId, type: p.type, mapUrl: p.mapUrl ?? "", address: p.address ?? "", phone: p.phone ?? "", website: p.website ?? "", eventDates: p.eventDates ?? "", hours: p.hours ?? "", amenities: p.amenities ?? "", published: p.published, tourismTypes: p.tourismTypes ?? [] });
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
    { id: "cities",    label: "Міста",       icon: <Building2 className="h-5 w-5" />,       count: cities.length },
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
                      <FieldGroup label="Опис">
                        <Textarea value={districtForm.description} onChange={v => setDistrictForm(p => ({ ...p, description: v }))} placeholder="Загальний опис району..." />
                      </FieldGroup>
                      <FieldGroup label="Детальна інформація">
                        <Textarea value={districtForm.detailedInfo} onChange={v => setDistrictForm(p => ({ ...p, detailedInfo: v }))} rows={4} placeholder="Розширена інформація, історія, факти..." />
                      </FieldGroup>
                      <MediaGroup
                        imageUrl={districtForm.imageUrl} videoUrl={districtForm.videoUrl}
                        onImage={v => setDistrictForm(p => ({ ...p, imageUrl: v }))} onVideo={v => setDistrictForm(p => ({ ...p, videoUrl: v }))}
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
                        <h2 className="text-[18px] font-semibold">{editingCityId ? "Редагувати місто" : "Нове місто"}</h2>
                      </div>
                      {editingCityId && (
                        <button type="button" onClick={() => { setEditingCityId(null); setCityForm(emptyCity(cityForm.districtId)); }} className="rounded-xl border border-[#002f5e]/15 px-3 py-1.5 text-[13px] text-[#002f5e]/50 hover:border-[#002f5e]/30 hover:text-[#002f5e] transition">
                          ✕ Скасувати
                        </button>
                      )}
                    </div>
                    <form onSubmit={e => void handleCitySubmit(e)} className="flex flex-col gap-4">
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
                      <FieldGroup label="Опис">
                        <Textarea value={cityForm.description} onChange={v => setCityForm(p => ({ ...p, description: v }))} placeholder="Загальний опис міста..." />
                      </FieldGroup>
                      <FieldGroup label="Детальна інформація">
                        <Textarea value={cityForm.detailedInfo} onChange={v => setCityForm(p => ({ ...p, detailedInfo: v }))} rows={4} placeholder="Розширена інформація, пам'ятки, факти..." />
                      </FieldGroup>
                      <MediaGroup
                        imageUrl={cityForm.imageUrl} videoUrl={cityForm.videoUrl}
                        onImage={v => setCityForm(p => ({ ...p, imageUrl: v }))} onVideo={v => setCityForm(p => ({ ...p, videoUrl: v }))}
                      />
                      <FieldGroup label={<>WeatherName <span className="normal-case text-[11px] text-[#002f5e]/40 font-normal">(необов&apos;язково — англ. назва для OpenWeather, напр. &ldquo;Odessa&rdquo;)</span></>}>
                        <Input value={cityForm.weatherCityName} onChange={v => setCityForm(p => ({ ...p, weatherCityName: v }))} placeholder="напр. Odessa, Bolhrad..." />
                      </FieldGroup>
                      <div className="flex items-center justify-between pt-2">
                        <SaveBtn saving={saving} label={editingCityId ? "Оновити місто" : "Створити місто"} />
                      </div>
                    </form>
                  </div>
                </section>

                <section className="w-[300px] shrink-0">
                  <h3 className="mb-4 text-[16px] font-semibold text-[#002f5e]/70">
                    Всі міста <span className="text-[#002f5e]/40">({cities.length})</span>
                  </h3>
                  {cities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-16 text-center">
                      <Plus className="h-8 w-8 text-[#002f5e]/25" />
                      <p className="text-[14px] text-[#002f5e]/45">Ще немає міст. Спочатку створіть район, потім місто!</p>
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

                      <FieldGroup label="Місто *">
                        <FormSelect value={placeForm.cityId} onChange={v => setPlaceForm(p => ({ ...p, cityId: v }))} disabled={cities.length === 0}>
                          {cities.length === 0 && <option value="">— Спочатку створіть місто —</option>}
                          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </FormSelect>
                      </FieldGroup>

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
                      <FieldGroup label="Опис">
                        <Textarea value={placeForm.description} onChange={v => setPlaceForm(p => ({ ...p, description: v }))} placeholder="Загальний опис..." />
                      </FieldGroup>
                      <FieldGroup label="Детальна інформація">
                        <Textarea value={placeForm.detailedInfo} onChange={v => setPlaceForm(p => ({ ...p, detailedInfo: v }))} rows={4} placeholder="Розширена інформація..." />
                      </FieldGroup>

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

                      {(placeForm.type === "restaurant" || placeForm.type === "hotel") && (
                        <>
                          <FieldGroup label="Адреса">
                            <Input value={placeForm.address} onChange={v => setPlaceForm(p => ({ ...p, address: v }))} placeholder="вул. Пушкінська, 15" />
                          </FieldGroup>
                          <div className="grid grid-cols-2 gap-3">
                            <FieldGroup label="Телефон">
                              <Input value={placeForm.phone} onChange={v => setPlaceForm(p => ({ ...p, phone: v }))} placeholder="+380..." />
                            </FieldGroup>
                            <FieldGroup label="Сайт">
                              <Input value={placeForm.website} onChange={v => setPlaceForm(p => ({ ...p, website: v }))} placeholder="https://..." />
                            </FieldGroup>
                          </div>
                          <FieldGroup label={placeForm.type === "restaurant" ? "Години роботи" : "Зручності та послуги"}>
                            <Input
                              value={placeForm.type === "restaurant" ? placeForm.hours : placeForm.amenities}
                              onChange={v => setPlaceForm(p => placeForm.type === "restaurant" ? ({ ...p, hours: v }) : ({ ...p, amenities: v }))}
                              placeholder={placeForm.type === "restaurant" ? "Пн-Нд 10:00–22:00" : "Wi-Fi, паркінг, басейн..."}
                            />
                          </FieldGroup>
                        </>
                      )}

                      <MediaGroup
                        imageUrl={placeForm.imageUrl} videoUrl={placeForm.videoUrl}
                        onImage={v => setPlaceForm(p => ({ ...p, imageUrl: v }))} onVideo={v => setPlaceForm(p => ({ ...p, videoUrl: v }))}
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

          </main>
        </div>
      </div>
    </div>
  );
};

export default Admin;
