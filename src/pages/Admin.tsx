import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MapPin, Building2, Landmark, Plus, Trash2, Settings2, AlertCircle, Upload, Link, LayoutDashboard, Calendar, UtensilsCrossed, BedDouble, ChevronRight, Palmtree, Newspaper, Pencil, X, LogOut, Languages, Route } from "lucide-react";
import { loadRoutes, upsertRoute, deleteRoute, type Route as RouteType, ROUTE_TAG_OPTIONS, loadRouteTagOrder, saveRouteTagOrder } from "@/lib/routesRepository";
import { translateFields, translateHtml } from "@/lib/translate";
import AdminLoginGate from "@/components/AdminLoginGate";
import BackButton from "@/components/BackButton";
import { District, City, Region, TourismObject, TourismObjectType } from "@/types/hierarchy";
import { ContentCardEntity } from "@/types/cms";
import { loadHierarchySnapshot, upsertDistrict, upsertCity, upsertTourismObject, deleteDistrict, deleteCity, deleteTourismObject, upsertContentCard, deleteContentCard, loadPublishedContentCards } from "@/lib/adminRepository";
import AdminConstructor from "./AdminConstructor";
import AdminPageEditor from "./AdminPageEditor";
import RichTextEditor from "@/components/RichTextEditor";
import { slugify } from "@/lib/slug";
import { uid } from "@/lib/id";
import { uploadMedia } from "@/data/storage";
import { TOURISM_TYPES, PLACE_TYPES } from "@/components/admin/constants";
import { Label, Input, Textarea, MultiField, FormSelect, FieldGroup, SaveBtn, MediaField, VenuePicker, MediaGroup, MediaGroupPlace, EntityCard } from "@/components/admin/fields";

// ─── helpers ─────────────────────────────────────────────────────────────────

type AdminSection =
  | "districts" | "cities" | "places" | "constructor"
  | "tourism-types" | "articles" | "routes"
  | "pages-district" | "pages-city" | "pages-place";

type PlacePageType = TourismObjectType;

// ─── form state types ─────────────────────────────────────────────────────────

type DistrictForm = {
  id: string; name: string; subtitle: string; description: string;
  detailedInfo: string; imageUrl: string; videoUrl: string; reelUrl: string; regionId: string;
  nameEn: string; subtitleEn: string; descriptionEn: string;
};

type CityForm = {
  id: string; name: string; subtitle: string; description: string;
  detailedInfo: string; imageUrl: string; videoUrl: string; reelUrl: string; districtId: string;
  weatherCityName: string; settlementType: string;
  nameEn: string; subtitleEn: string; descriptionEn: string;
};

type PlaceForm = {
  id: string; slug: string; name: string; subtitle: string; description: string;
  detailedInfo: string; imageUrl: string; videoUrl: string; reelUrl: string; reelImageUrl: string;
  cityId: string; districtOnlyMode: boolean; type: TourismObjectType;
  mapUrl: string; address: string; phone: string; website: string;
  eventDates: string; hours: string; amenities: string;
  published: boolean; tourismTypes: string[];
  nameEn: string; subtitleEn: string; descriptionEn: string;
  detailedInfoEn: string; addressEn: string; hoursEn: string; amenitiesEn: string;
  venueId: string; repertoire: string;
  heroFontSize: string;
};

const emptyDistrict = (regionId: string): DistrictForm => ({ id: "", name: "", subtitle: "", description: "", detailedInfo: "", imageUrl: "", videoUrl: "", reelUrl: "", regionId, nameEn: "", subtitleEn: "", descriptionEn: "" });
const emptyCity = (districtId: string): CityForm => ({ id: "", name: "", subtitle: "", description: "", detailedInfo: "", imageUrl: "", videoUrl: "", reelUrl: "", districtId, weatherCityName: "", settlementType: "місто", nameEn: "", subtitleEn: "", descriptionEn: "" });
const emptyPlace = (cityId: string): PlaceForm => ({ id: "", slug: "", name: "", subtitle: "", description: "", detailedInfo: "", imageUrl: "", videoUrl: "", reelUrl: "", reelImageUrl: "", cityId, districtOnlyMode: false, type: "attraction", mapUrl: "", address: "", phone: "", website: "", eventDates: "", hours: "", amenities: "", published: true, tourismTypes: [], nameEn: "", subtitleEn: "", descriptionEn: "", detailedInfoEn: "", addressEn: "", hoursEn: "", amenitiesEn: "", venueId: "", repertoire: "", heroFontSize: "" });


const Admin = () => {
  const [section, setSection] = useState<AdminSection>("districts");
  const [placePageType, setPlacePageType] = useState<PlacePageType>("attraction");
  const [regions, setRegions] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<TourismObject[]>([]);
  const [districtQuery, setDistrictQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [contentCards, setContentCards] = useState<ContentCardEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // District form
  const defaultRegionId = regions[0]?.id ?? "";
  const [districtForm, setDistrictForm] = useState<DistrictForm>(emptyDistrict(defaultRegionId));
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [districtTranslating, setDistrictTranslating] = useState(false);

  const handleDistrictTranslate = async () => {
    const fields: Record<string, string> = {};
    if (districtForm.name.trim()) fields.nameEn = districtForm.name;
    if (districtForm.subtitle.trim()) fields.subtitleEn = districtForm.subtitle;
    if (districtForm.description.trim()) fields.descriptionEn = districtForm.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!Object.keys(fields).length) return;
    setDistrictTranslating(true);
    try {
      const translated = await translateFields(fields);
      setDistrictForm(p => ({ ...p, ...translated }));
    } catch { /* silent */ } finally { setDistrictTranslating(false); }
  };

  // City form
  const [cityForm, setCityForm] = useState<CityForm>(emptyCity(districts[0]?.id ?? ""));
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [cityTranslating, setCityTranslating] = useState(false);

  const handleCityTranslate = async () => {
    const fields: Record<string, string> = {};
    if (cityForm.name.trim()) fields.nameEn = cityForm.name;
    if (cityForm.subtitle.trim()) fields.subtitleEn = cityForm.subtitle;
    if (cityForm.description.trim()) fields.descriptionEn = cityForm.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!Object.keys(fields).length) return;
    setCityTranslating(true);
    try {
      const translated = await translateFields(fields);
      setCityForm(p => ({ ...p, ...translated }));
    } catch { /* silent */ } finally { setCityTranslating(false); }
  };

  // Place form
  const [placeForm, setPlaceForm] = useState<PlaceForm>(emptyPlace(cities[0]?.id ?? ""));
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [placeTranslating, setPlaceTranslating] = useState(false);

  const handlePlaceTranslate = async () => {
    const fields: Record<string, string> = {};
    if (placeForm.name.trim()) fields.nameEn = placeForm.name;
    if (placeForm.subtitle.trim()) fields.subtitleEn = placeForm.subtitle;
    if (placeForm.description.trim()) fields.descriptionEn = placeForm.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (placeForm.detailedInfo.trim()) fields.detailedInfoEn = placeForm.detailedInfo.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (placeForm.address.trim()) fields.addressEn = placeForm.address;
    if (placeForm.hours.trim()) fields.hoursEn = placeForm.hours;
    if (placeForm.amenities.trim()) fields.amenitiesEn = placeForm.amenities;
    if (!Object.keys(fields).length) { showToast("Заповніть українські поля для перекладу", false); return; }
    setPlaceTranslating(true);
    try {
      const translated = await translateFields(fields);
      setPlaceForm(p => ({ ...p, ...translated }));
      showToast("Перекладено успішно");
    } catch { showToast("Помилка перекладу", false); }
    finally { setPlaceTranslating(false); }
  };

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
        nameEn: districtForm.nameEn || undefined,
        subtitleEn: districtForm.subtitleEn || undefined,
        descriptionEn: districtForm.descriptionEn || undefined,
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
    setDistrictForm({ id: d.id, name: d.name, subtitle: d.subtitle ?? "", description: d.description ?? "", detailedInfo: d.detailedInfo ?? "", imageUrl: d.imageUrl ?? "", videoUrl: d.videoUrl ?? "", reelUrl: d.reelUrl ?? "", regionId: d.regionId, nameEn: d.nameEn ?? "", subtitleEn: d.subtitleEn ?? "", descriptionEn: d.descriptionEn ?? "" });
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
        nameEn: cityForm.nameEn || undefined,
        subtitleEn: cityForm.subtitleEn || undefined,
        descriptionEn: cityForm.descriptionEn || undefined,
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
    setCityForm({ id: c.id, name: c.name, subtitle: c.subtitle ?? "", description: c.description ?? "", detailedInfo: c.detailedInfo ?? "", imageUrl: c.imageUrl ?? "", videoUrl: c.videoUrl ?? "", reelUrl: c.reelUrl ?? "", districtId: c.districtId, weatherCityName: c.weatherCityName ?? "", settlementType: c.settlementType ?? "місто", nameEn: c.nameEn ?? "", subtitleEn: c.subtitleEn ?? "", descriptionEn: c.descriptionEn ?? "" });
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
        : (city?.districtId ?? "");
      if (!districtId) return showToast("Не вдалося визначити район для обраного населеного пункту", false);
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
        nameEn: placeForm.nameEn || undefined,
        subtitleEn: placeForm.subtitleEn || undefined,
        descriptionEn: placeForm.descriptionEn || undefined,
        detailedInfoEn: placeForm.detailedInfoEn || undefined,
        addressEn: placeForm.addressEn || undefined,
        hoursEn: placeForm.hoursEn || undefined,
        amenitiesEn: placeForm.amenitiesEn || undefined,
        reelImageUrl: placeForm.reelImageUrl || undefined,
        venueId: placeForm.venueId || undefined,
        repertoire: placeForm.repertoire || undefined,
        heroFontSize: placeForm.heroFontSize || undefined,
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
    setPlaceForm({ id: p.id, slug: p.slug, name: p.name, subtitle: p.subtitle ?? "", description: p.description ?? "", detailedInfo: p.detailedInfo ?? "", imageUrl: p.imageUrl ?? "", videoUrl: p.videoUrl ?? "", reelUrl: p.reelUrl ?? "", reelImageUrl: p.reelImageUrl ?? "", cityId: isDistrictOnly ? p.districtId : (p.cityId ?? ""), districtOnlyMode: isDistrictOnly, type: p.type, mapUrl: p.mapUrl ?? "", address: p.address ?? "", phone: p.phone ?? "", website: p.website ?? "", eventDates: p.eventDates ?? "", hours: p.hours ?? "", amenities: p.amenities ?? "", published: p.published, tourismTypes: p.tourismTypes ?? [], nameEn: p.nameEn ?? "", subtitleEn: p.subtitleEn ?? "", descriptionEn: p.descriptionEn ?? "", detailedInfoEn: p.detailedInfoEn ?? "", addressEn: p.addressEn ?? "", hoursEn: p.hoursEn ?? "", amenitiesEn: p.amenitiesEn ?? "", venueId: p.venueId ?? "", repertoire: p.repertoire ?? "", heroFontSize: p.heroFontSize ?? "" });
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
              <span className="flex items-center gap-1.5 rounded-full bg-[#002f5e]/10 px-3 py-1.5 text-[12px] font-medium text-[#002f5e]">
                <Settings2 className="h-3.5 w-3.5" />
                База даних
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
                  { id: "routes" as AdminSection, label: "Маршрути", icon: <Route className="h-4 w-4" /> },
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
            </div>
          </aside>

          {/* Main content */}
          <main className="flex flex-1 gap-6 overflow-y-auto p-6 [&>*]:min-w-0">

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
                      <div className="rounded-xl border border-[#002f5e]/15 bg-[#002f5e]/3 p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-[#002f5e]/50 uppercase tracking-wide">🇬🇧 English version</span>
                          <button type="button" onClick={() => void handleDistrictTranslate()} disabled={districtTranslating}
                            className="flex items-center gap-2 rounded-xl border border-[#002f5e]/20 bg-white px-3 py-1.5 text-[12px] font-medium text-[#002f5e] transition hover:bg-[#002f5e]/8 disabled:opacity-50">
                            {districtTranslating ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#002f5e]/40 border-t-[#002f5e]" /> Перекладаємо...</> : <><Languages className="h-3.5 w-3.5" /> Перекласти автоматично</>}
                          </button>
                        </div>
                        <FieldGroup label="Name (EN)"><Input value={districtForm.nameEn} onChange={v => setDistrictForm(p => ({ ...p, nameEn: v }))} placeholder="e.g. Bilhorod-Dnistrovskyi district" /></FieldGroup>
                        <FieldGroup label="Subtitle (EN)"><Input value={districtForm.subtitleEn} onChange={v => setDistrictForm(p => ({ ...p, subtitleEn: v }))} placeholder="Short subtitle in English" /></FieldGroup>
                        <FieldGroup label="Description (EN)"><Input value={districtForm.descriptionEn} onChange={v => setDistrictForm(p => ({ ...p, descriptionEn: v }))} placeholder="Description in English" /></FieldGroup>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <SaveBtn saving={saving} label={editingDistrictId ? "Оновити район" : "Створити район"} />
                      </div>
                    </form>
                  </div>
                </section>

                {/* List */}
                <section className="w-[300px] shrink-0 flex flex-col gap-3 sticky top-0 self-start">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold text-[#002f5e]/70">
                      Райони <span className="text-[#002f5e]/40">({districts.length})</span>
                    </h3>
                  </div>
                  <input
                    value={districtQuery}
                    onChange={e => setDistrictQuery(e.target.value)}
                    placeholder="Пошук районів..."
                    className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-3 py-2 text-[13px] text-[#002f5e] placeholder:text-[#002f5e]/30 focus:border-[#002f5e]/30 focus:outline-none"
                  />
                  {districts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-16 text-center">
                      <Plus className="h-8 w-8 text-[#002f5e]/25" />
                      <p className="text-[14px] text-[#002f5e]/45">Ще немає районів. Створіть перший!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                      {districts.filter(d => !districtQuery || d.name.toLowerCase().includes(districtQuery.toLowerCase())).map(d => (
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
                      <div className="rounded-xl border border-[#002f5e]/15 bg-[#002f5e]/3 p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-[#002f5e]/50 uppercase tracking-wide">🇬🇧 English version</span>
                          <button type="button" onClick={() => void handleCityTranslate()} disabled={cityTranslating}
                            className="flex items-center gap-2 rounded-xl border border-[#002f5e]/20 bg-white px-3 py-1.5 text-[12px] font-medium text-[#002f5e] transition hover:bg-[#002f5e]/8 disabled:opacity-50">
                            {cityTranslating ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#002f5e]/40 border-t-[#002f5e]" /> Перекладаємо...</> : <><Languages className="h-3.5 w-3.5" /> Перекласти автоматично</>}
                          </button>
                        </div>
                        <FieldGroup label="Name (EN)"><Input value={cityForm.nameEn} onChange={v => setCityForm(p => ({ ...p, nameEn: v }))} placeholder="e.g. Odesa" /></FieldGroup>
                        <FieldGroup label="Subtitle (EN)"><Input value={cityForm.subtitleEn} onChange={v => setCityForm(p => ({ ...p, subtitleEn: v }))} placeholder="Short subtitle in English" /></FieldGroup>
                        <FieldGroup label="Description (EN)"><Input value={cityForm.descriptionEn} onChange={v => setCityForm(p => ({ ...p, descriptionEn: v }))} placeholder="Description in English" /></FieldGroup>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <SaveBtn saving={saving} label={editingCityId ? "Оновити" : "Створити"} />
                      </div>
                    </form>
                  </div>
                </section>

                <section className="w-[300px] shrink-0 flex flex-col gap-3 sticky top-0 self-start">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold text-[#002f5e]/70">
                      Нас. пункти <span className="text-[#002f5e]/40">({cities.length})</span>
                    </h3>
                  </div>
                  <input
                    value={cityQuery}
                    onChange={e => setCityQuery(e.target.value)}
                    placeholder="Пошук міст і сіл..."
                    className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-3 py-2 text-[13px] text-[#002f5e] placeholder:text-[#002f5e]/30 focus:border-[#002f5e]/30 focus:outline-none"
                  />
                  {cities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-16 text-center">
                      <Plus className="h-8 w-8 text-[#002f5e]/25" />
                      <p className="text-[14px] text-[#002f5e]/45">Ще немає населених пунктів. Спочатку створіть район!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                      {cities.filter(c => !cityQuery || c.name.toLowerCase().includes(cityQuery.toLowerCase())).map(c => {
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

                      <div>
                        <Label>Назва *</Label>
                        <Input value={placeForm.name} onChange={v => setPlaceForm(p => ({ ...p, name: v }))} placeholder={
                          placeForm.type === "attraction" ? "Наприклад: Акерманська фортеця" :
                          placeForm.type === "event" ? "Наприклад: Фестиваль Бессарабії" :
                          placeForm.type === "restaurant" ? "Наприклад: Ресторан Рибний двір" :
                          "Наприклад: Готель Золота підкова"
                        } />
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[11px] text-[#002f5e]/40 font-medium">Розмір назви на сторінці:</span>
                          {([["", "Авто"], ["sm", "Малий"], ["md", "Середній"], ["lg", "Великий"]] as const).map(([val, label]) => (
                            <button key={val} type="button"
                              onClick={() => setPlaceForm(p => ({ ...p, heroFontSize: val }))}
                              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${placeForm.heroFontSize === val ? "bg-[#002f5e] text-white" : "border border-[#002f5e]/15 text-[#002f5e]/50 hover:border-[#002f5e]/30 hover:text-[#002f5e]"}`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <FieldGroup label="Підзаголовок">
                        <Input value={placeForm.subtitle} onChange={v => setPlaceForm(p => ({ ...p, subtitle: v }))} placeholder="Короткий підзаголовок" />
                      </FieldGroup>
                      <div><span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Опис</span>
                        <RichTextEditor value={placeForm.description} onChange={v => setPlaceForm(p => ({ ...p, description: v }))} />
                      </div>
                      <div><span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Детальна інформація</span>
                        <RichTextEditor value={placeForm.detailedInfo} onChange={v => setPlaceForm(p => ({ ...p, detailedInfo: v }))} />
                      </div>

                      {/* English version */}
                      <div className="rounded-xl border border-[#002f5e]/15 bg-[#002f5e]/3 p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-[#002f5e]/50 uppercase tracking-wide">🇬🇧 English version</span>
                          <button
                            type="button"
                            onClick={() => void handlePlaceTranslate()}
                            disabled={placeTranslating}
                            className="flex items-center gap-2 rounded-xl border border-[#002f5e]/20 bg-white px-3 py-1.5 text-[12px] font-medium text-[#002f5e] transition hover:bg-[#002f5e]/8 disabled:opacity-50"
                          >
                            {placeTranslating
                              ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#002f5e]/40 border-t-[#002f5e]" /> Перекладаємо...</>
                              : <><Languages className="h-3.5 w-3.5" /> Перекласти автоматично</>
                            }
                          </button>
                        </div>
                        <FieldGroup label="Name (EN)">
                          <Input value={placeForm.nameEn} onChange={v => setPlaceForm(p => ({ ...p, nameEn: v }))} placeholder="e.g. Akkerman Fortress" />
                        </FieldGroup>
                        <FieldGroup label="Subtitle (EN)">
                          <Input value={placeForm.subtitleEn} onChange={v => setPlaceForm(p => ({ ...p, subtitleEn: v }))} placeholder="Short subtitle" />
                        </FieldGroup>
                        <div><span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Description (EN)</span>
                          <RichTextEditor value={placeForm.descriptionEn} onChange={v => setPlaceForm(p => ({ ...p, descriptionEn: v }))} />
                        </div>
                        <div><span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Detailed info (EN)</span>
                          <RichTextEditor value={placeForm.detailedInfoEn} onChange={v => setPlaceForm(p => ({ ...p, detailedInfoEn: v }))} />
                        </div>
                        {(placeForm.type === "restaurant" || placeForm.type === "hotel" || placeForm.type === "attraction") && (
                          <>
                            <FieldGroup label="Address (EN)">
                              <Input value={placeForm.addressEn} onChange={v => setPlaceForm(p => ({ ...p, addressEn: v }))} placeholder="e.g. 15 Pushkinska St" />
                            </FieldGroup>
                            <FieldGroup label={placeForm.type === "hotel" ? "Amenities (EN)" : "Working hours (EN)"}>
                              <Input
                                value={placeForm.type === "hotel" ? placeForm.amenitiesEn : placeForm.hoursEn}
                                onChange={v => setPlaceForm(p => placeForm.type === "hotel" ? ({ ...p, amenitiesEn: v }) : ({ ...p, hoursEn: v }))}
                                placeholder={placeForm.type === "hotel" ? "Wi-Fi, parking, pool..." : "Mon-Sun 10:00–22:00"}
                              />
                            </FieldGroup>
                          </>
                        )}
                      </div>

                      {/* Type-specific fields */}
                      {(placeForm.type === "attraction" || placeForm.type === "event" || placeForm.type === "hotel" || placeForm.type === "restaurant") && (
                        <MultiField label="Посилання на карту" value={placeForm.mapUrl} onChange={v => setPlaceForm(p => ({ ...p, mapUrl: v }))} placeholder="https://maps.google.com/..." />
                      )}

                      {placeForm.type === "event" && (
                        <>
                          <FieldGroup label="Дати проведення">
                            <Input value={placeForm.eventDates} onChange={v => setPlaceForm(p => ({ ...p, eventDates: v }))} placeholder="Наприклад: 24.04 – 03.05.2026" />
                          </FieldGroup>
                          <FieldGroup label="Прив'язати до закладу (необов'язково)">
                            <VenuePicker
                              value={placeForm.venueId}
                              onChange={v => setPlaceForm(p => ({ ...p, venueId: v }))}
                              places={places}
                            />
                          </FieldGroup>
                          <div>
                            <Label>Репертуар (місячний розклад)</Label>
                            <p className="mb-1 text-[11px] text-[#002f5e]/40">Формат: дата — назва — час, кожна вистава з нового рядка</p>
                            <textarea
                              value={placeForm.repertoire}
                              onChange={e => setPlaceForm(p => ({ ...p, repertoire: e.target.value }))}
                              placeholder={"01.07 — Наталка Полтавка — 18:00\n05.07 — Лісова пісня — 19:30"}
                              rows={6}
                              className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[13px] text-[#002f5e] placeholder:text-[#002f5e]/30 focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition font-mono"
                            />
                          </div>
                        </>
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

                      <MediaGroupPlace
                        imageUrl={placeForm.imageUrl} videoUrl={placeForm.videoUrl} reelUrl={placeForm.reelUrl} reelImageUrl={placeForm.reelImageUrl}
                        onImage={v => setPlaceForm(p => ({ ...p, imageUrl: v }))} onVideo={v => setPlaceForm(p => ({ ...p, videoUrl: v }))} onReel={v => setPlaceForm(p => ({ ...p, reelUrl: v }))} onReelImage={v => setPlaceForm(p => ({ ...p, reelImageUrl: v }))}
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

                <section className="w-[300px] shrink-0 flex flex-col gap-3 sticky top-0 self-start">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[16px] font-semibold text-[#002f5e]/70">
                      Всі місця <span className="text-[#002f5e]/40">({places.length})</span>
                    </h3>
                  </div>
                  <input
                    value={placeQuery}
                    onChange={e => setPlaceQuery(e.target.value)}
                    placeholder="Пошук місць..."
                    className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-3 py-2 text-[13px] text-[#002f5e] placeholder:text-[#002f5e]/30 focus:border-[#002f5e]/30 focus:outline-none"
                  />
                  {places.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-16 text-center">
                      <Plus className="h-8 w-8 text-[#002f5e]/25" />
                      <p className="text-[14px] text-[#002f5e]/45">Ще немає місць. Спочатку створіть місто!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                      {places.filter(p => !placeQuery || p.name.toLowerCase().includes(placeQuery.toLowerCase())).map(p => {
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
                    allCards={contentCards}
                    onCardsChange={setContentCards}
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
                    allCards={contentCards}
                    onCardsChange={setContentCards}
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
                    allCards={contentCards}
                    onCardsChange={setContentCards}
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

            {section === "routes" && (
              <RoutesAdmin showToast={showToast} />
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
type ArticleVideo = {
  id: string;
  url: string;
  afterParagraph: number; // 0 = before text, N = after Nth paragraph
};

type ArticleForm = {
  id: string; title: string; subtitle: string; imageUrl: string;
  videos: ArticleVideo[]; content: string; publishedAt: string; published: boolean;
  titleEn: string; subtitleEn: string; contentEn: string;
};

const emptyArticle = (): ArticleForm => ({
  id: "", title: "", subtitle: "", imageUrl: "", videos: [],
  content: "", publishedAt: new Date().toLocaleDateString("uk-UA"), published: true,
  titleEn: "", subtitleEn: "", contentEn: "",
});

const VideoListEditor = ({
  videos,
  onChange,
}: {
  videos: ArticleVideo[];
  onChange: (v: ArticleVideo[]) => void;
}) => {
  const add = () => onChange([...videos, { id: `v${Date.now()}`, url: "", afterParagraph: 0 }]);
  const remove = (id: string) => onChange(videos.filter(v => v.id !== id));
  const update = (id: string, patch: Partial<ArticleVideo>) =>
    onChange(videos.map(v => (v.id === id ? { ...v, ...patch } : v)));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">
          Відео{videos.length > 0 && (
            <span className="ml-1.5 rounded-full bg-[#002f5e]/10 px-2 py-0.5 text-[11px] font-semibold">{videos.length}</span>
          )}
        </span>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 rounded-xl border border-[#002f5e]/20 px-3 py-1.5 text-[12px] font-medium text-[#002f5e] hover:bg-[#002f5e]/8 transition"
        >
          <Plus className="h-3.5 w-3.5" /> Додати відео
        </button>
      </div>

      {videos.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#002f5e]/15 py-6 text-center">
          <p className="text-[13px] text-[#002f5e]/35">Відео не додані</p>
          <p className="mt-0.5 text-[11px] text-[#002f5e]/25">Натисніть «Додати відео», щоб вставити відео в статтю</p>
        </div>
      )}

      {videos.map((video, idx) => (
        <div key={video.id} className="rounded-xl border border-[#002f5e]/12 bg-[#002f5e]/3 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-[#002f5e]/70">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#002f5e]/10 text-[11px] font-bold text-[#002f5e]">
                {idx + 1}
              </span>
              Відео {idx + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(video.id)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9f1f47]/50 hover:bg-[#9f1f47]/10 hover:text-[#9f1f47] transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <MediaField
            label="Джерело відео"
            value={video.url}
            onChange={url => update(video.id, { url })}
            accept="video/*"
            isVideo={true}
          />

          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-[#002f5e]/10 bg-white/60 px-3 py-2.5">
            <span className="text-[12px] font-medium text-[#002f5e]/55">Позиція в статті:</span>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name={`pos-${video.id}`}
                checked={video.afterParagraph === 0}
                onChange={() => update(video.id, { afterParagraph: 0 })}
                className="accent-[#002f5e]"
              />
              <span className="text-[12px] text-[#002f5e]/70">Перед текстом</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="radio"
                name={`pos-${video.id}`}
                checked={video.afterParagraph > 0}
                onChange={() => update(video.id, { afterParagraph: video.afterParagraph > 0 ? video.afterParagraph : 1 })}
                className="accent-[#002f5e]"
              />
              <span className="text-[12px] text-[#002f5e]/70">Після параграфа №</span>
            </label>
            {video.afterParagraph > 0 && (
              <input
                type="number"
                min={1}
                value={video.afterParagraph}
                onChange={e => update(video.id, { afterParagraph: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-16 rounded-lg border border-[#002f5e]/15 bg-white px-2 py-1 text-center text-[13px] font-medium text-[#002f5e] focus:border-[#002f5e]/35 focus:outline-none"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ArticlesAdmin = ({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) => {
  const [articles, setArticles] = useState<ContentCardEntity[]>([]);
  const [form, setForm] = useState<ArticleForm>(emptyArticle());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!form.title.trim() && !form.subtitle.trim() && !form.content.trim()) {
      showToast("Заповніть українські поля для перекладу", false);
      return;
    }
    setTranslating(true);
    try {
      const fieldsToTranslate: Record<string, string> = {};
      if (form.title.trim()) fieldsToTranslate.titleEn = form.title;
      if (form.subtitle.trim()) fieldsToTranslate.subtitleEn = form.subtitle;
      if (form.content.trim()) {
        // strip html tags for translation, then wrap back
        const plain = form.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (plain) fieldsToTranslate.contentEn = plain;
      }
      const translated = await translateFields(fieldsToTranslate);
      setForm(p => ({
        ...p,
        titleEn: translated.titleEn ?? p.titleEn,
        subtitleEn: translated.subtitleEn ?? p.subtitleEn,
        contentEn: translated.contentEn ?? p.contentEn,
      }));
      showToast("Перекладено успішно");
    } catch {
      showToast("Помилка перекладу", false);
    } finally {
      setTranslating(false);
    }
  };

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
        payload: {
          content: form.content, publishedAt: form.publishedAt,
          videos: form.videos,
          videoUrl: form.videos[0]?.url ?? "", // backward compat
          titleEn: form.titleEn || null, subtitleEn: form.subtitleEn || null, contentEn: form.contentEn || null,
        },
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
    const legacyVideoUrl = String(card.payload?.videoUrl ?? "");
    const loadedVideos: ArticleVideo[] = Array.isArray(card.payload?.videos)
      ? (card.payload.videos as ArticleVideo[])
      : legacyVideoUrl
        ? [{ id: `v${Date.now()}`, url: legacyVideoUrl, afterParagraph: 0 }]
        : [];
    setForm({
      id: card.id, title: card.title, subtitle: card.subtitle ?? "",
      imageUrl: card.imageUrl ?? "", videos: loadedVideos,
      content: String(card.payload?.content ?? ""),
      publishedAt: String(card.payload?.publishedAt ?? ""),
      published: card.published,
      titleEn: String(card.payload?.titleEn ?? ""),
      subtitleEn: String(card.payload?.subtitleEn ?? ""),
      contentEn: String(card.payload?.contentEn ?? ""),
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
            <div>
              <span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">Головне фото (URL)</span>
              <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition" />
              {form.imageUrl && <img src={form.imageUrl} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" onError={e => (e.currentTarget.style.display = "none")} />}
            </div>
            <div className="rounded-xl border border-[#002f5e]/10 bg-[#002f5e]/2 p-4">
              <VideoListEditor
                videos={form.videos}
                onChange={v => setForm(p => ({ ...p, videos: v }))}
              />
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

            {/* ── English version ─────────────────────────────────── */}
            <div className="rounded-xl border border-[#002f5e]/12 bg-[#002f5e]/3 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[#002f5e]/60 uppercase tracking-wide">
                  🇬🇧 English version
                </span>
                <button
                  type="button"
                  onClick={() => void handleTranslate()}
                  disabled={translating}
                  className="flex items-center gap-2 rounded-xl border border-[#002f5e]/20 bg-white px-3 py-1.5 text-[12px] font-medium text-[#002f5e] transition hover:bg-[#002f5e]/8 disabled:opacity-50"
                >
                  {translating
                    ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#002f5e]/40 border-t-[#002f5e]" /> Перекладаємо...</>
                    : <><Languages className="h-3.5 w-3.5" /> Перекласти автоматично</>
                  }
                </button>
              </div>
              <div>
                <span className="mb-1 block text-[12px] font-medium text-[#002f5e]/50 uppercase tracking-wide">Title (EN)</span>
                <input value={form.titleEn} onChange={e => setForm(p => ({ ...p, titleEn: e.target.value }))}
                  placeholder="Article title in English"
                  className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition" />
              </div>
              <div>
                <span className="mb-1 block text-[12px] font-medium text-[#002f5e]/50 uppercase tracking-wide">Subtitle (EN)</span>
                <input value={form.subtitleEn} onChange={e => setForm(p => ({ ...p, subtitleEn: e.target.value }))}
                  placeholder="Short description in English"
                  className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition" />
              </div>
              <div>
                <span className="mb-1 block text-[12px] font-medium text-[#002f5e]/50 uppercase tracking-wide">Content (EN)</span>
                <textarea value={form.contentEn} onChange={e => setForm(p => ({ ...p, contentEn: e.target.value }))}
                  placeholder="Article text in English..."
                  rows={5}
                  className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition resize-none" />
              </div>
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

// ─── Routes Admin ─────────────────────────────────────────────────────────────

type RouteForm = {
  id: string; name: string; nameEn: string; description: string; descriptionEn: string;
  content: string; contentEn: string;
  imageUrl: string; videoUrl: string; mapUrl: string; mapUrl2: string;
  links: string; objectIds: string[];
  waypointObjectIds: (string | null)[];
  duration: string; distance: string;
  tags: string[];
  published: boolean; sortOrder: number;
};

const emptyRouteForm = (): RouteForm => ({
  id: "", name: "", nameEn: "", description: "", descriptionEn: "",
  content: "", contentEn: "",
  imageUrl: "", videoUrl: "", mapUrl: "", mapUrl2: "",
  links: "", objectIds: [], waypointObjectIds: [],
  duration: "", distance: "", tags: [],
  published: true, sortOrder: 0,
});

const RoutesAdmin = ({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) => {
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [allObjects, setAllObjects] = useState<TourismObject[]>([]);
  const [form, setForm] = useState<RouteForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [objSearch, setObjSearch] = useState("");

  // ── Порядок фільтрів ──────────────────────────────────────
  const [tagOrder, setTagOrder] = useState<string[]>(() => ROUTE_TAG_OPTIONS.map(t => t.id));
  const [tagOrderDirty, setTagOrderDirty] = useState(false);
  const [tagOrderSaving, setTagOrderSaving] = useState(false);

  const moveTag = (idx: number, dir: -1 | 1) => {
    const next = [...tagOrder];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setTagOrder(next);
    setTagOrderDirty(true);
  };

  const saveTagOrder = async () => {
    setTagOrderSaving(true);
    try {
      await saveRouteTagOrder(tagOrder);
      showToast("Порядок фільтрів збережено ✓");
      setTagOrderDirty(false);
    } catch { showToast("Помилка збереження", false); }
    finally { setTagOrderSaving(false); }
  };

  const handleTranslate = async () => {
    if (!form) return;
    setTranslating(true);
    try {
      const fields: Record<string, string> = {};
      if (form.name) fields.nameEn = form.name;
      if (form.description) fields.descriptionEn = form.description;
      const [textResult, contentEn] = await Promise.all([
        translateFields(fields),
        form.content ? translateHtml(form.content) : Promise.resolve(""),
      ]);
      setForm(f => f && ({ ...f, ...textResult, ...(contentEn ? { contentEn } : {}) }));
    } catch { showToast("Помилка перекладу", false); }
    finally { setTranslating(false); }
  };

  useEffect(() => {
    loadRoutes().then(setRoutes);
    loadHierarchySnapshot().then(snap => {
      if (snap) setAllObjects(snap.objects);
    });
    loadRouteTagOrder().then(order => {
      if (order.length > 0) {
        // Merge: saved order first, then any new tags not yet in the saved order
        const newTags = ROUTE_TAG_OPTIONS.map(t => t.id).filter(id => !order.includes(id));
        setTagOrder([...order.filter(id => ROUTE_TAG_OPTIONS.some(t => t.id === id)), ...newTags]);
      }
    });
  }, []);

  const handleSave = async () => {
    if (!form || !form.name.trim()) return;
    setSaving(true);
    try {
      const id = form.id || Math.random().toString(36).slice(2, 10);
      const route: RouteType = {
        id, name: form.name, nameEn: form.nameEn || undefined,
        description: form.description || undefined, descriptionEn: form.descriptionEn || undefined,
        content: form.content || undefined, contentEn: form.contentEn || undefined,
        imageUrl: form.imageUrl || undefined, videoUrl: form.videoUrl || undefined,
        mapUrl: form.mapUrl || undefined, mapUrl2: form.mapUrl2 || undefined,
        links: form.links || undefined, objectIds: form.objectIds,
        waypointObjectIds: form.waypointObjectIds,
        duration: form.duration || undefined, distance: form.distance || undefined,
        tags: form.tags,
        published: form.published, sortOrder: form.sortOrder,
      };
      await upsertRoute(route);
      setRoutes(prev => {
        const idx = prev.findIndex(r => r.id === id);
        return idx >= 0 ? prev.map(r => r.id === id ? route : r) : [...prev, route];
      });
      setForm(null);
      showToast("Маршрут збережено");
    } catch { showToast("Помилка збереження", false); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити маршрут?")) return;
    try {
      await deleteRoute(id);
      setRoutes(prev => prev.filter(r => r.id !== id));
      showToast("Видалено");
    } catch { showToast("Помилка", false); }
  };

  const openEdit = (route: RouteType) => setForm({
    id: route.id, name: route.name, nameEn: route.nameEn ?? "",
    description: route.description ?? "", descriptionEn: route.descriptionEn ?? "",
    content: route.content ?? "", contentEn: route.contentEn ?? "",
    imageUrl: route.imageUrl ?? "", videoUrl: route.videoUrl ?? "",
    mapUrl: route.mapUrl ?? "", mapUrl2: route.mapUrl2 ?? "",
    links: route.links ?? "", objectIds: route.objectIds ?? [],
    waypointObjectIds: route.waypointObjectIds ?? [],
    duration: route.duration ?? "", distance: route.distance ?? "",
    tags: route.tags ?? [],
    published: route.published, sortOrder: route.sortOrder,
  });

  const toggleObject = (id: string) => {
    setForm(f => {
      if (!f) return f;
      const ids = f.objectIds.includes(id) ? f.objectIds.filter(x => x !== id) : [...f.objectIds, id];
      return { ...f, objectIds: ids };
    });
  };

  const filteredObjects = allObjects.filter(o =>
    o.name.toLowerCase().includes(objSearch.toLowerCase()) ||
    o.subtitle?.toLowerCase().includes(objSearch.toLowerCase())
  ).slice(0, 40);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-odesa-medium text-[22px] text-[#002f5e]">Маршрути</h2>
        <button onClick={() => setForm(emptyRouteForm())}
          className="flex items-center gap-2 rounded-xl bg-[#002f5e] px-4 py-2 text-[13px] font-medium text-[#fff2e8] transition hover:opacity-85">
          <Plus className="h-4 w-4" /> Додати маршрут
        </button>
      </div>

      {form && (
        <div className="rounded-[20px] border border-[#002f5e]/10 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-odesa-medium text-[16px] text-[#002f5e]">{form.id ? "Редагування" : "Новий маршрут"}</p>
            <div className="flex items-center gap-2">
              <button onClick={handleTranslate} disabled={translating}
                className="flex items-center gap-1.5 rounded-lg border border-[#002f5e]/15 px-3 py-1.5 text-[12px] text-[#002f5e]/60 transition hover:border-[#002f5e]/30 hover:text-[#002f5e] disabled:opacity-40">
                <Languages className="h-3.5 w-3.5" />
                {translating ? "Переклад..." : "Перекласти EN"}
              </button>
              <button onClick={() => setForm(null)} className="text-[#002f5e]/40 hover:text-[#002f5e]"><X className="h-5 w-5" /></button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Назва (UA)">
              <Input value={form.name} onChange={v => setForm(f => f && ({ ...f, name: v }))} placeholder="Дорога вина..." />
            </FieldGroup>
            <FieldGroup label="Назва (EN)">
              <Input value={form.nameEn} onChange={v => setForm(f => f && ({ ...f, nameEn: v }))} placeholder="Wine road..." />
            </FieldGroup>
          </div>

          <FieldGroup label="Короткий опис (UA)">
            <Textarea rows={3} value={form.description} onChange={v => setForm(f => f && ({ ...f, description: v }))} placeholder="Короткий опис для картки маршруту..." />
          </FieldGroup>
          <FieldGroup label="Короткий опис (EN)">
            <Textarea rows={3} value={form.descriptionEn} onChange={v => setForm(f => f && ({ ...f, descriptionEn: v }))} placeholder="Short description..." />
          </FieldGroup>

          <FieldGroup label="Повний текст (UA)">
            <RichTextEditor value={form.content} onChange={v => setForm(f => f && ({ ...f, content: v }))} />
          </FieldGroup>
          <FieldGroup label="Повний текст (EN)">
            <RichTextEditor value={form.contentEn} onChange={v => setForm(f => f && ({ ...f, contentEn: v }))} />
          </FieldGroup>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Тривалість">
              <Input value={form.duration} onChange={v => setForm(f => f && ({ ...f, duration: v }))} placeholder="2 дні" />
            </FieldGroup>
            <FieldGroup label="Відстань">
              <Input value={form.distance} onChange={v => setForm(f => f && ({ ...f, distance: v }))} placeholder="396 км" />
            </FieldGroup>
          </div>

          {/* ── Теги / фільтри ─────────────────────────────── */}
          <div className="rounded-xl border border-[#002f5e]/10 bg-[#002f5e]/2 p-4">
            <span className="mb-3 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/55">
              Категорії маршруту
            </span>
            <div className="flex flex-wrap gap-2">
              {ROUTE_TAG_OPTIONS.map(tag => {
                const active = form.tags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setForm(f => f && ({
                      ...f,
                      tags: active ? f.tags.filter(t => t !== tag.id) : [...f.tags, tag.id],
                    }))}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
                      active
                        ? "border-[#002f5e] bg-[#002f5e] text-[#fff2e8]"
                        : "border-[#002f5e]/20 bg-white text-[#002f5e]/60 hover:border-[#002f5e]/40 hover:text-[#002f5e]"
                    }`}
                  >
                    <span>{tag.emoji}</span> {tag.label}
                  </button>
                );
              })}
            </div>
            {form.tags.length > 0 && (
              <p className="mt-2 text-[11px] text-[#002f5e]/40">
                Обрано: {form.tags.map(t => ROUTE_TAG_OPTIONS.find(o => o.id === t)?.label).filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          <MediaField label="Зображення" value={form.imageUrl} onChange={v => setForm(f => f && ({ ...f, imageUrl: v }))} accept="image/*" isVideo={false} />
          <MediaField label="Відео" value={form.videoUrl} onChange={v => setForm(f => f && ({ ...f, videoUrl: v }))} accept="video/*" isVideo={true} />

          <FieldGroup label="Посилання на маршрут (Google Maps)">
            <Input value={form.mapUrl} onChange={v => setForm(f => f && ({ ...f, mapUrl: v }))} placeholder="https://maps.app.goo.gl/..." />
          </FieldGroup>
          <FieldGroup label="Альтернативне посилання на карту">
            <Input value={form.mapUrl2} onChange={v => setForm(f => f && ({ ...f, mapUrl2: v }))} placeholder="https://www.google.com/maps/dir/..." />
          </FieldGroup>

          <FieldGroup label={<>Корисні посилання <span className="normal-case font-normal text-[11px] text-[#002f5e]/40">— кожне з нового рядка: Назва|URL або просто URL</span></>}>
            <Textarea rows={4} value={form.links}
              onChange={v => setForm(f => f && ({ ...f, links: v }))}
              placeholder={"Музей виноробства|https://example.com\nhttps://maps.google.com/..."} />
          </FieldGroup>

          {/* Unified object picker — waypoints + free attach */}
          {(() => {
            const coords = (() => {
              const pairs: [number,number][] = [];
              const regex = /!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/g;
              let m; while ((m = regex.exec(form.mapUrl)) !== null) pairs.push([parseFloat(m[1]), parseFloat(m[2])]);
              return pairs;
            })();
            const hasWaypoints = coords.length > 0;

            // Всі прикріплені objectIds = union waypointObjectIds (non-null) + objectIds
            const waypointIds = form.waypointObjectIds.filter(Boolean) as string[];
            const freeIds = form.objectIds.filter(id => !waypointIds.includes(id));

            const setWaypoint = (i: number, id: string | null) => setForm(f => {
              if (!f) return f;
              const wp = [...f.waypointObjectIds];
              const prev = wp[i];
              wp[i] = id;
              // також синхронізуємо objectIds
              let oids = [...f.objectIds];
              if (prev && !wp.includes(prev)) oids = oids.filter(x => x !== prev);
              if (id && !oids.includes(id)) oids.push(id);
              return { ...f, waypointObjectIds: wp, objectIds: oids };
            });

            const [wpSearch, setWpSearch] = [objSearch, setObjSearch];
            const searchResults = allObjects.filter(o =>
              o.name.toLowerCase().includes(wpSearch.toLowerCase()) ||
              o.subtitle?.toLowerCase().includes(wpSearch.toLowerCase())
            ).slice(0, 40);

            return (
              <div className="space-y-3">
                <Label>Об'єкти маршруту</Label>

                {/* Waypoint rows якщо є координати */}
                {hasWaypoints && (
                  <div className="space-y-2 rounded-xl border border-[#002f5e]/10 bg-[#002f5e]/3 p-3">
                    <p className="text-[11px] text-[#002f5e]/40 uppercase tracking-wide">По точках маршруту ({coords.length})</p>
                    {coords.map((_, i) => {
                      const selId = form.waypointObjectIds[i] ?? "";
                      const selObj = allObjects.find(o => o.id === selId);
                      const [search, setSearch] = [
                        (form as any)[`_wpSearch${i}`] ?? "",
                        (v: string) => setForm(f => f && ({ ...f, [`_wpSearch${i}`]: v } as any)),
                      ];
                      const results = allObjects.filter(o =>
                        o.name.toLowerCase().includes(search.toLowerCase())
                      ).slice(0, 20);
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: i === 0 ? "#9f1f47" : i === coords.length-1 ? "#002f5e" : "#df9b3b" }}>
                            {i === 0 ? "A" : i === coords.length-1 ? "B" : i}
                          </span>
                          <div className="flex-1 min-w-0">
                            {selObj ? (
                              <div className="flex items-center gap-2 rounded-xl border border-[#002f5e]/15 bg-white px-3 py-2">
                                {selObj.imageUrl && <img src={selObj.imageUrl} className="h-7 w-10 shrink-0 rounded-lg object-cover" />}
                                <span className="flex-1 truncate text-[13px] text-[#002f5e]">{selObj.name}</span>
                                <button onClick={() => setWaypoint(i, null)} className="text-[#002f5e]/30 hover:text-[#9f1f47]"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            ) : (
                              <div className="relative">
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                  placeholder="Пошук об'єкта..."
                                  className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-3 py-2 text-[13px] text-[#002f5e] placeholder:text-[#002f5e]/30 focus:outline-none" />
                                {search && (
                                  <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-[160px] overflow-y-auto rounded-xl border border-[#002f5e]/10 bg-white shadow-lg">
                                    {results.length === 0
                                      ? <p className="px-3 py-2 text-[12px] text-[#002f5e]/40">Нічого не знайдено</p>
                                      : results.map(o => (
                                        <button key={o.id} onClick={() => { setWaypoint(i, o.id); setSearch(""); }}
                                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#002f5e]/5">
                                          {o.imageUrl && <img src={o.imageUrl} className="h-7 w-10 shrink-0 rounded-lg object-cover" />}
                                          <div className="min-w-0">
                                            <p className="truncate text-[12px] font-medium text-[#002f5e]">{o.name}</p>
                                            <p className="text-[10px] text-[#002f5e]/40">{o.type}</p>
                                          </div>
                                        </button>
                                      ))
                                    }
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Вільні об'єкти (не прив'язані до точок) */}
                <div>
                  {freeIds.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {freeIds.map(id => {
                        const obj = allObjects.find(o => o.id === id);
                        return obj ? (
                          <span key={id} className="flex items-center gap-1 rounded-full bg-[#002f5e]/8 px-2.5 py-0.5 text-[12px] text-[#002f5e]">
                            {obj.name}
                            <button onClick={() => toggleObject(id)} className="ml-0.5 text-[#002f5e]/40 hover:text-[#9f1f47]"><X className="h-3 w-3" /></button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  <Input value={wpSearch} onChange={setWpSearch} placeholder="+ Додати об'єкт (без прив'язки до точки)..." />
                  {wpSearch && (
                    <div className="mt-1 max-h-[180px] overflow-y-auto rounded-xl border border-[#002f5e]/10 bg-white shadow-lg">
                      {searchResults.length === 0
                        ? <p className="px-4 py-3 text-[13px] text-[#002f5e]/40">Нічого не знайдено</p>
                        : searchResults.map(obj => (
                          <button key={obj.id} onClick={() => { toggleObject(obj.id); setObjSearch(""); }}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[#002f5e]/5 ${form.objectIds.includes(obj.id) ? "bg-[#002f5e]/8" : ""}`}>
                            {obj.imageUrl && <img src={obj.imageUrl} className="h-8 w-11 shrink-0 rounded-lg object-cover" />}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-[#002f5e]">{obj.name}</p>
                              <p className="truncate text-[11px] text-[#002f5e]/40">{obj.type}</p>
                            </div>
                            {form.objectIds.includes(obj.id) && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />}
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#002f5e]/70">
              <input type="checkbox" checked={form.published}
                onChange={e => setForm(f => f && ({ ...f, published: e.target.checked }))}
                className="h-4 w-4 rounded" />
              Опубліковано
            </label>
            <div className="flex items-center gap-2">
              <Label>Порядок</Label>
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

      <div className="space-y-3">
        {routes.map(route => (
          <div key={route.id} className="flex items-center gap-4 rounded-[16px] border border-[#002f5e]/8 bg-white p-4">
            {route.imageUrl && (
              <img src={route.imageUrl} alt={route.name} className="h-14 w-20 rounded-[10px] object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-odesa-medium text-[15px] text-[#002f5e] truncate">{route.name}</p>
              <p className="text-[12px] text-[#002f5e]/50 truncate">{[route.duration, route.distance].filter(Boolean).join(" · ")}</p>
              {(route.objectIds?.length ?? 0) > 0 && (
                <p className="text-[11px] text-[#002f5e]/30">{route.objectIds!.length} об'єктів</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${route.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {route.published ? "Опубл." : "Чернетка"}
              </span>
              <button onClick={() => openEdit(route)}
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-[#002f5e]/40 hover:bg-[#002f5e]/8 hover:text-[#002f5e]">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(route.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9f1f47]/40 hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {routes.length === 0 && !form && (
          <p className="py-12 text-center text-[14px] text-[#002f5e]/40">Маршрутів ще немає</p>
        )}
      </div>

      {/* ── Порядок фільтрів ──────────────────────────────────── */}
      <div className="rounded-[20px] border border-[#002f5e]/10 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-odesa-medium text-[16px] text-[#002f5e]">Порядок фільтрів</p>
            <p className="mt-0.5 text-[12px] text-[#002f5e]/45">Визначає послідовність відображення кнопок-фільтрів у розділі «Маршрути»</p>
          </div>
          {tagOrderDirty && (
            <button onClick={() => void saveTagOrder()} disabled={tagOrderSaving}
              className="flex items-center gap-2 rounded-xl bg-[#17a358] px-4 py-2 text-[13px] font-medium text-white transition hover:opacity-85 disabled:opacity-60">
              {tagOrderSaving
                ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : <CheckCircle2 className="h-4 w-4" />}
              {tagOrderSaving ? "Зберігається..." : "Зберегти порядок"}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {tagOrder.map((tagId, idx) => {
            const meta = ROUTE_TAG_OPTIONS.find(t => t.id === tagId);
            if (!meta) return null;
            const usedCount = routes.filter(r => r.tags?.includes(tagId)).length;
            return (
              <div key={tagId}
                className="flex items-center gap-3 rounded-xl border border-[#002f5e]/8 bg-[#002f5e]/2 px-4 py-2.5">
                <span className="w-6 text-center text-[13px] font-semibold text-[#002f5e]/30">{idx + 1}</span>
                <span className="text-[18px]">{meta.emoji}</span>
                <span className="flex-1 text-[14px] font-medium text-[#002f5e]">{meta.label}</span>
                {usedCount > 0 && (
                  <span className="rounded-full bg-[#002f5e]/8 px-2.5 py-0.5 text-[11px] font-medium text-[#002f5e]/50">
                    {usedCount} маршрут{usedCount === 1 ? "" : usedCount < 5 ? "и" : "ів"}
                  </span>
                )}
                <div className="flex flex-col">
                  <button type="button" onClick={() => moveTag(idx, -1)} disabled={idx === 0}
                    className="rounded p-0.5 text-[#002f5e]/30 transition hover:text-[#002f5e] disabled:opacity-20">
                    <ChevronRight className="h-3.5 w-3.5 -rotate-90" />
                  </button>
                  <button type="button" onClick={() => moveTag(idx, 1)} disabled={idx === tagOrder.length - 1}
                    className="rounded p-0.5 text-[#002f5e]/30 transition hover:text-[#002f5e] disabled:opacity-20">
                    <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Admin;
