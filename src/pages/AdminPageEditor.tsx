import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignLeft, BarChart2, BedDouble, BookOpen, Building2, Calendar,
  CalendarDays, Check, ChevronDown, ChevronUp, Clock, Eye, EyeOff,
  FileText, Globe, GripVertical, Image as ImageIcon, Landmark, Map, MapPin, Minus,
  Palette, Phone, PlayCircle, Plus, Quote, RotateCcw, Save, Settings2,
  Star, Ticket, Trash2, UtensilsCrossed, Upload, Video, X,
} from "lucide-react";
import { District, City, TourismObject, TourismObjectType } from "@/types/hierarchy";
import {
  PageConfig, PageSection, PageSectionKind, PageEntityType,
  SECTION_KIND_META, makeDefaultConfig,
} from "@/types/pages";
import { getOrCreatePageConfig, upsertPageConfig } from "@/lib/pageConfigRepository";
import { updateDistrictSortOrders, updateCitySortOrders } from "@/lib/adminRepository";
import type { ContentCardEntity } from "@/types/cms";
import { upsertContentCard, deleteContentCard } from "@/lib/adminRepository";
import { uid } from "@/lib/id";
import { uploadMedia } from "@/data/storage";

// ─── icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  AlignLeft:       <AlignLeft      className="h-4 w-4" />,
  Image:           <ImageIcon      className="h-4 w-4" />,
  Map:             <Map            className="h-4 w-4" />,
  FileText:        <FileText       className="h-4 w-4" />,
  Building2:       <Building2      className="h-4 w-4" />,
  Landmark:        <Landmark       className="h-4 w-4" />,
  Calendar:        <Calendar       className="h-4 w-4" />,
  UtensilsCrossed: <UtensilsCrossed className="h-4 w-4" />,
  BedDouble:       <BedDouble      className="h-4 w-4" />,
  Phone:           <Phone          className="h-4 w-4" />,
  Clock:           <Clock          className="h-4 w-4" />,
  CalendarDays:    <CalendarDays   className="h-4 w-4" />,
  Star:            <Star           className="h-4 w-4" />,
  BookOpen:        <BookOpen       className="h-4 w-4" />,
  Ticket:          <Ticket         className="h-4 w-4" />,
  PlayCircle:      <PlayCircle     className="h-4 w-4" />,
  Quote:           <Quote          className="h-4 w-4" />,
  BarChart2:       <BarChart2      className="h-4 w-4" />,
  Minus:           <Minus          className="h-4 w-4" />,
};

// ─── colour presets matching DistrictPage / CityPage ─────────────────────────

const COLOR_PRESETS = [
  { label: "Слонова кістка", value: "#fff2e8" },
  { label: "Темно-синій",    value: "#001a3d" },
  { label: "Бордовий",       value: "#3d0820" },
  { label: "Темно-зелений",  value: "#062820" },
  { label: "Коричневий",     value: "#2a1200" },
  { label: "Персиковий",     value: "#ffdfc6" },
  { label: "Золотий",        value: "#df9b3b" },
  { label: "Білий",          value: "#ffffff" },
  { label: "Сірий",          value: "#f4f4f0" },
];

// ─── Gallery card editor ──────────────────────────────────────────────────────

type GalleryItem = ContentCardEntity & { _uploading?: boolean };

const COL_SPAN_OPTIONS = [
  { value: 1, label: "1/3" },
  { value: 2, label: "1/2" },
  { value: 3, label: "Повна" },
];
const TEXT_SIZE_OPTIONS = [
  { value: "sm", label: "A" },
  { value: "md", label: "A+" },
  { value: "lg", label: "A++" },
];

const GalleryEditor = ({
  sectionId,
  entityType,
  entityId,
  allCards,
  onCardsChange,
}: {
  sectionId: string;
  entityType: PageEntityType;
  entityId: string;
  allCards: ContentCardEntity[];
  onCardsChange: (cards: ContentCardEntity[]) => void;
}) => {
  const sectionKey = `gallery-${sectionId}`;
  const pageKey = `${entityType}-${entityId}`;
  const items = allCards
    .filter((c) => c.pageKey === pageKey && c.sectionKey === sectionKey)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = (file: File): Promise<string> => uploadMedia(file);

  const handleFileAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      let currentCards = [...allCards];
      let currentOrder = items.length;
      for (const file of files) {
        const url = await uploadFile(file);
        const isVideo = file.type.startsWith("video/");
        currentOrder += 1;
        const card: ContentCardEntity = {
          id: uid(),
          pageKey,
          sectionKey,
          cardType: isVideo ? "info" : "destination",
          title: "",
          subtitle: null,
          imageUrl: isVideo ? null : url,
          href: null,
          cityId: null, districtId: null, regionId: null,
          sortOrder: currentOrder,
          published: true,
          payload: isVideo ? { videoUrl: url, colSpan: 2, textSize: "md" } : { colSpan: 1, textSize: "md" },
        };
        await upsertContentCard(card);
        currentCards = [...currentCards, card];
        onCardsChange(currentCards);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const updateItem = async (id: string, patch: Partial<ContentCardEntity>) => {
    const card = items.find((c) => c.id === id);
    if (!card) return;
    const updated = { ...card, ...patch };
    await upsertContentCard(updated);
    onCardsChange(allCards.map((c) => (c.id === id ? updated : c)));
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Видалити елемент галереї?")) return;
    await deleteContentCard(id);
    onCardsChange(allCards.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  // Чернетки авто-наповнення: published=false (не видно на сайті, видно тут).
  const draftCount = items.filter((c) => !c.published).length;

  const publishAllDrafts = async () => {
    const drafts = items.filter((c) => !c.published);
    if (!drafts.length) return;
    if (!confirm(`Опублікувати ${drafts.length} фото? Вони з'являться на сайті.`)) return;
    let next = allCards;
    for (const d of drafts) {
      const updated = { ...d, published: true };
      await upsertContentCard(updated);
      next = next.map((c) => (c.id === d.id ? updated : c));
    }
    onCardsChange(next);
  };

  const inputCls = "w-full rounded-xl border border-[#002f5e]/15 bg-white px-3 py-2 text-[13px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/35 focus:outline-none";

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">
          Елементи галереї ({items.length})
          {draftCount > 0 && (
            <span className="ml-2 rounded-full bg-[#df9b3b]/20 px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-[#9a6611]">
              {draftCount} на підтвердженні
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          {draftCount > 0 && (
            <button
              type="button"
              onClick={() => void publishAllDrafts()}
              className="flex items-center gap-1.5 rounded-xl bg-[#2f9f5f] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#2f9f5f]/85"
            >
              <Check className="h-3.5 w-3.5" />
              Опублікувати всі ({draftCount})
            </button>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-xl bg-[#002f5e] px-3 py-1.5 text-[12px] font-medium text-[#fff2e8] transition hover:bg-[#002f5e]/85 disabled:opacity-50"
          >
            {uploading
              ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <Upload className="h-3.5 w-3.5" />}
            Додати
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileAdd} />
        </div>
      </div>

      {items.length === 0 && (
        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#002f5e]/20 py-10 text-[#002f5e]/70 transition hover:border-[#002f5e]/40"
          onClick={() => fileRef.current?.click()}
        >
          <ImageIcon className="h-8 w-8 opacity-40" />
          <p className="text-[13px]">Натисніть або перетягніть фото / відео</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const isVideo = !!item.payload?.videoUrl;
          const colSpan = (item.payload?.colSpan as number) ?? 1;
          const textSize = (item.payload?.textSize as string) ?? "md";
          const isEditing = editingId === item.id;

          return (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-[#002f5e]/10 bg-white">
              {/* preview row */}
              <div
                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-[#002f5e]/3"
                onClick={() => setEditingId(isEditing ? null : item.id)}
              >
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-[#002f5e]/8">
                  {isVideo ? (
                    <div className="flex h-full items-center justify-center text-[#002f5e]/70">
                      <Video className="h-5 w-5" />
                    </div>
                  ) : item.imageUrl ? (
                    <img loading="lazy" decoding="async" src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#002f5e]/70">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-[#002f5e]">
                    {!item.published && (
                      <span className="shrink-0 rounded bg-[#df9b3b]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#9a6611]">чернетка</span>
                    )}
                    <span className="truncate">{item.title || "(без назви)"}</span>
                  </p>
                  <p className="text-[11px] text-[#002f5e]/70">
                    {isVideo ? "Відео" : "Фото"} · {COL_SPAN_OPTIONS.find((o) => o.value === colSpan)?.label}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {!item.published && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); void updateItem(item.id, { published: true }); }}
                      title="Підтвердити й опублікувати"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#2f9f5f] transition hover:bg-[#2f9f5f]/12"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void deleteItem(item.id); }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9f1f47]/30 transition hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronDown className={`h-4 w-4 text-[#002f5e]/70 transition-transform ${isEditing ? "rotate-180" : ""}`} />
                </div>
              </div>

              {/* inline editor */}
              {isEditing && (
                <div className="flex flex-col gap-3 border-t border-[#002f5e]/8 px-3 py-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Підпис</label>
                    <input
                      value={item.title}
                      onChange={(e) => void updateItem(item.id, { title: e.target.value })}
                      className={inputCls}
                      placeholder="Підпис картки"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Ширина картки</label>
                    <div className="flex gap-1.5">
                      {COL_SPAN_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => void updateItem(item.id, { payload: { ...item.payload, colSpan: opt.value } })}
                          className={`flex-1 rounded-xl py-2 text-[12px] font-medium transition ${colSpan === opt.value ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/8 text-[#002f5e]/70 hover:bg-[#002f5e]/15"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Розмір тексту</label>
                    <div className="flex gap-1.5">
                      {TEXT_SIZE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => void updateItem(item.id, { payload: { ...item.payload, textSize: opt.value } })}
                          className={`flex-1 rounded-xl py-2 text-[12px] font-medium transition ${textSize === opt.value ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/8 text-[#002f5e]/70 hover:bg-[#002f5e]/15"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {!isVideo && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#002f5e]/15 py-2 text-[12px] text-[#002f5e]/70 transition hover:border-[#002f5e]/30 hover:text-[#002f5e]"
                    >
                      <Upload className="h-3.5 w-3.5" /> Замінити файл
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  entityType: PageEntityType;
  districts: District[];
  cities: City[];
  places: TourismObject[];
  showToast: (msg: string, ok?: boolean) => void;
}

// ─── per-place-type display meta ──────────────────────────────────────────────

const PLACE_SUB_LABELS: Record<TourismObjectType, string> = {
  attraction: "Тур. об'єкт",
  event:      "Подія",
  restaurant: "Ресторан",
  hotel:      "Готель",
};
const PLACE_SUB_COLORS: Record<TourismObjectType, string> = {
  attraction: "#002f5e",
  event:      "#9f1f47",
  restaurant: "#eea846",
  hotel:      "#17a358",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const SectionIcon = ({ kind }: { kind: PageSectionKind }) =>
  ICON_MAP[SECTION_KIND_META[kind]?.icon ?? "FileText"] ?? <FileText className="h-4 w-4" />;

// ─── Color Picker ─────────────────────────────────────────────────────────────

const ColorPicker = ({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");

  // Sync custom input whenever the picker opens
  useEffect(() => {
    if (open) setCustom(value ?? "");
  }, [open, value]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-[#002f5e]/15 bg-white px-3 py-2 text-[13px] text-[#002f5e] transition hover:border-[#002f5e]/30"
      >
        <span
          className="h-5 w-5 rounded-full border border-[#002f5e]/20"
          style={{
            backgroundColor: value ?? "transparent",
            backgroundImage: value
              ? undefined
              : "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0/8px 8px",
          }}
        />
        <Palette className="h-3.5 w-3.5 text-[#002f5e]/70" />
        <span className="text-[#002f5e]/70">{value ?? "Без кольору"}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-30 mt-1 w-60 rounded-2xl border border-[#002f5e]/12 bg-white p-3 shadow-xl">
            <div className="mb-2 grid grid-cols-3 gap-1.5">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  title={p.label}
                  onClick={() => { onChange(p.value); setOpen(false); }}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2 transition hover:bg-[#002f5e]/5 ${value === p.value ? "ring-2 ring-[#002f5e]/30" : ""}`}
                >
                  <span
                    className="h-7 w-7 rounded-full border border-[#002f5e]/15"
                    style={{ backgroundColor: p.value }}
                  />
                  <span className="text-center text-[10px] leading-tight text-[#002f5e]/70">
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 border-t border-[#002f5e]/8 pt-2">
              <input
                type="text"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="#hex"
                className="flex-1 rounded-lg border border-[#002f5e]/15 px-2 py-1.5 text-[12px] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { if (custom) { onChange(custom); setOpen(false); } }}
                className="rounded-lg bg-[#002f5e] px-3 py-1.5 text-[12px] text-white"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Section row ──────────────────────────────────────────────────────────────

const SectionRow = ({
  section, onToggleVisible, onDelete, onMoveUp, onMoveDown,
  onEdit, isEditing, isFirst, isLast,
}: {
  section: PageSection;
  onToggleVisible: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  isEditing: boolean;
  isFirst: boolean;
  isLast: boolean;
}) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onEdit}
    onKeyDown={(e) => e.key === "Enter" && onEdit()}
    className={`group flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
      isEditing
        ? "border-[#002f5e]/40 bg-[#002f5e]/6 ring-2 ring-[#002f5e]/15"
        : !section.visible
          ? "border-[#002f5e]/8 bg-[#002f5e]/3 opacity-55"
          : "border-[#002f5e]/10 bg-white/70 hover:border-[#002f5e]/25 hover:bg-white"
    }`}
  >
    {/* colour swatch */}
    <span
      className="h-9 w-3 shrink-0 rounded-full border border-[#002f5e]/10"
      style={{
        backgroundColor: section.bgColor ?? "transparent",
        backgroundImage: section.bgColor
          ? undefined
          : "repeating-conic-gradient(#ccc 0% 25%, transparent 0% 50%) 0/6px 6px",
      }}
    />
    {/* icon */}
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#002f5e]/8 text-[#002f5e]/70">
      <SectionIcon kind={section.kind} />
    </span>
    {/* title */}
    <div className="min-w-0 flex-1">
      <p className="truncate text-[14px] font-semibold text-[#002f5e]">{section.title}</p>
      <p className="truncate text-[11px] text-[#002f5e]/70">{SECTION_KIND_META[section.kind]?.label}</p>
    </div>
    {!section.visible && (
      <span className="shrink-0 rounded-full bg-[#002f5e]/10 px-2 py-0.5 text-[10px] font-medium text-[#002f5e]/70">
        Приховано
      </span>
    )}
    {/* actions */}
    <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
      <button type="button" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} disabled={isFirst}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#002f5e]/8 text-[#002f5e]/70 transition hover:bg-[#002f5e]/15 disabled:opacity-25">
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} disabled={isLast}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#002f5e]/8 text-[#002f5e]/70 transition hover:bg-[#002f5e]/15 disabled:opacity-25">
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#002f5e]/8 text-[#002f5e]/70 transition hover:bg-[#002f5e]/15">
        {section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9f1f47]/30 transition hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);

// ─── Object order editor (Constructor-style) ─────────────────────────────────

const ObjectOrderEditor = ({
  entities,
  selectedIds,
  onChangeIds,
}: {
  entities: { id: string; name: string; imageUrl?: string; badge?: string; badgeColor?: string }[];
  selectedIds: string[];
  onChangeIds: (ids: string[]) => void;
}) => {
  const [search, setSearch] = useState("");

  if (entities.length === 0) return null;

  const hasCustomOrder = selectedIds.length > 0;
  const visibleIds = selectedIds.filter(id => entities.some(e => e.id === id));
  const hiddenIds = entities.map(e => e.id).filter(id => !visibleIds.includes(id));
  const displayList = hasCustomOrder ? [...visibleIds, ...hiddenIds] : entities.map(e => e.id);

  const filtered = search.trim()
    ? displayList.filter(id => entities.find(e => e.id === id)?.name.toLowerCase().includes(search.toLowerCase()))
    : displayList;

  const moveUp = (visIdx: number) => {
    if (visIdx <= 0) return;
    const next = [...visibleIds];
    [next[visIdx], next[visIdx - 1]] = [next[visIdx - 1], next[visIdx]];
    onChangeIds(next);
  };

  const moveDown = (visIdx: number) => {
    if (visIdx >= visibleIds.length - 1) return;
    const next = [...visibleIds];
    [next[visIdx], next[visIdx + 1]] = [next[visIdx + 1], next[visIdx]];
    onChangeIds(next);
  };

  const toggleVisible = (id: string) => {
    if (visibleIds.includes(id)) {
      onChangeIds(visibleIds.filter(x => x !== id));
    } else {
      onChangeIds([...visibleIds, id]);
    }
  };

  const enableAll = () => onChangeIds(entities.map(e => e.id));
  const resetAll = () => onChangeIds([]);

  return (
    <div className="mt-1">
      <div className="mb-3 flex items-center justify-between">
        <label className="text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">
          Порядок та видимість
        </label>
        <div className="flex gap-3">
          {!hasCustomOrder ? (
            <button type="button" onClick={enableAll}
              className="rounded-lg border border-[#002f5e]/15 px-3 py-1 text-[12px] text-[#002f5e]/70 transition hover:border-[#002f5e]/30 hover:text-[#002f5e]">
              Задати порядок
            </button>
          ) : (
            <button type="button" onClick={resetAll}
              className="rounded-lg border border-[#9f1f47]/20 px-3 py-1 text-[12px] text-[#9f1f47]/60 transition hover:border-[#9f1f47]/40 hover:text-[#9f1f47]">
              Скинути
            </button>
          )}
        </div>
      </div>

      {!hasCustomOrder ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-[#002f5e]/15 py-8 text-center">
          <div>
            <GripVertical className="mx-auto mb-2 h-6 w-6 text-[#002f5e]/70" />
            <p className="text-[13px] text-[#002f5e]/70">Об'єкти відображаються у порядку за замовчуванням</p>
            <p className="mt-1 text-[11px] text-[#002f5e]/70">Натисніть «Задати порядок» щоб керувати послідовністю</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-[#002f5e]/10 bg-[#002f5e]/3 px-3 py-2 text-[12px] text-[#002f5e]/70">
            <span>Видимо: <strong className="text-[#002f5e]">{visibleIds.length}</strong> з {entities.length}</span>
          </div>

          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Пошук..."
            className="mb-2 w-full rounded-xl border border-[#002f5e]/12 bg-white px-3 py-2 text-[13px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/30 focus:outline-none"
          />

          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-0.5">
            {filtered.map((id) => {
              const ent = entities.find(e => e.id === id);
              if (!ent) return null;
              const isVis = visibleIds.includes(id);
              const visIdx = visibleIds.indexOf(id);
              return (
                <div key={id} className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                  isVis ? "border-[#002f5e]/12 bg-white/80" : "border-[#002f5e]/8 bg-white/30 opacity-55"
                }`}>
                  {/* Thumb */}
                  <div className="h-11 w-14 shrink-0 overflow-hidden rounded-xl bg-[#002f5e]/8">
                    {ent.imageUrl
                      ? <img loading="lazy" decoding="async" src={ent.imageUrl} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center text-[#002f5e]/70"><ImageIcon className="h-5 w-5" /></div>
                    }
                  </div>
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[13px] font-semibold ${isVis ? "text-[#002f5e]" : "text-[#002f5e]/70"}`}>{ent.name}</p>
                    {ent.badge && (
                      <span className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: ent.badgeColor ?? "#002f5e" }}>
                        {ent.badge}
                      </span>
                    )}
                    {isVis && <p className="text-[11px] text-[#002f5e]/70">Позиція: {visIdx + 1}</p>}
                  </div>
                  {/* Controls */}
                  <div className="flex shrink-0 items-center gap-1">
                    {isVis && (
                      <>
                        <input
                          type="number"
                          min={1}
                          max={visibleIds.length}
                          value={visIdx + 1}
                          onChange={e => {
                            const pos = Math.max(1, Math.min(visibleIds.length, parseInt(e.target.value) || 1)) - 1;
                            if (pos === visIdx) return;
                            const next = [...visibleIds];
                            next.splice(visIdx, 1);
                            next.splice(pos, 0, id);
                            onChangeIds(next);
                          }}
                          className="w-10 rounded-lg border border-[#002f5e]/15 bg-white px-1 py-1 text-center text-[12px] font-semibold text-[#002f5e] focus:border-[#002f5e]/35 focus:outline-none"
                        />
                        <button type="button" onClick={() => moveUp(visIdx)} disabled={visIdx === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#002f5e]/10 text-[#002f5e]/70 transition hover:border-[#002f5e]/25 hover:text-[#002f5e] disabled:opacity-20">
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => moveDown(visIdx)} disabled={visIdx === visibleIds.length - 1}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#002f5e]/10 text-[#002f5e]/70 transition hover:border-[#002f5e]/25 hover:text-[#002f5e] disabled:opacity-20">
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <button type="button" onClick={() => toggleVisible(id)}
                      title={isVis ? "Приховати" : "Показати"}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                        isVis
                          ? "border-[#002f5e]/15 text-[#002f5e]/70 hover:border-[#002f5e]/30 hover:text-[#002f5e]"
                          : "border-[#002f5e]/10 text-[#002f5e]/70 hover:border-[#002f5e]/20 hover:text-[#002f5e]/70"
                      }`}>
                      {isVis ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Section editor panel ──────────────────────────────────────────────────────

const SectionEditor = ({
  section, entityType, entityId, places, districts, cities, onChange, onClose, allCards, onCardsChange,
}: {
  section: PageSection;
  entityType: PageEntityType;
  entityId: string;
  places: TourismObject[];
  districts: District[];
  cities: City[];
  onChange: (updated: PageSection) => void;
  onClose: () => void;
  allCards: ContentCardEntity[];
  onCardsChange: (cards: ContentCardEntity[]) => void;
}) => {
  const upd = (patch: Partial<PageSection>) => onChange({ ...section, ...patch });

  // Filter places by district/city context
  const scopedPlaces = (() => {
    if (entityId === "default") return places;
    if (entityType === "district") return places.filter(p => p.districtId === entityId);
    if (entityType === "city")     return places.filter(p => p.cityId === entityId);
    return places;
  })();

  const relevantEntities: { id: string; name: string; imageUrl?: string; badge?: string; badgeColor?: string }[] = (() => {
    const byType = (type: string, badge: string, color: string) =>
      scopedPlaces.filter(p => p.type === type).map(p => ({ id: p.id, name: p.name, imageUrl: p.imageUrl, badge, badgeColor: color }));
    if (section.kind === "cities_list")       return (entityId === "default" ? cities : cities.filter(c => c.districtId === entityId)).map(c => ({ id: c.id, name: c.name }));
    if (section.kind === "places_attraction") return byType("attraction", "Об'єкт",  "#002f5e");
    if (section.kind === "places_event")      return byType("event",      "Подія",   "#9f1f47");
    if (section.kind === "places_restaurant") return byType("restaurant", "Ресторан","#eea846");
    if (section.kind === "places_hotel")      return byType("hotel",      "Готель",  "#17a358");
    if (section.kind === "related_events")         return byType("event",      "Подія",   "#9f1f47");
    if (section.kind === "related_attractions")    return byType("attraction", "Об'єкт",  "#002f5e");
    if (section.kind === "related_restaurants")    return byType("restaurant", "Ресторан","#eea846");
    if (section.kind === "related_hotels")         return byType("hotel",      "Готель",  "#17a358");
    return [];
  })();

  const isListSection = ["cities_list","places_attraction","places_event","places_restaurant",
    "places_hotel","related_events","related_attractions","related_restaurants","related_hotels"].includes(section.kind);

  const selectedIds = section.filter?.entityIds ?? [];
  const toggleEntityId = (id: string) => {
    const cur = section.filter?.entityIds ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    upd({ filter: { ...section.filter, entityIds: next } });
  };

  const inputCls = "w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/35 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10";

  return (
    <div className="rounded-2xl border border-[#002f5e]/12 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#002f5e]/8 text-[#002f5e]">
            <SectionIcon kind={section.kind} />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-[#002f5e]">Редагування блоку</p>
            <p className="text-[11px] text-[#002f5e]/70">{SECTION_KIND_META[section.kind]?.label}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#002f5e]/8">
          <X className="h-4 w-4 text-[#002f5e]/70" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Заголовок блоку</label>
          <input value={section.title} onChange={(e) => upd({ title: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Підзаголовок</label>
          <input value={section.subtitle ?? ""} onChange={(e) => upd({ subtitle: e.target.value })} placeholder="Необов'язково" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Колір фону</label>
          <ColorPicker value={section.bgColor} onChange={(v) => upd({ bgColor: v })} />
        </div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#002f5e]/5 px-4 py-3">
          <input type="checkbox" checked={section.visible} onChange={(e) => upd({ visible: e.target.checked })} className="h-4 w-4 rounded accent-[#002f5e]" />
          <span className="text-[13px] font-medium text-[#002f5e]">
            {section.visible ? "Блок показується на сторінці" : "Блок прихований"}
          </span>
        </label>

        {isListSection && <ObjectOrderEditor
          entities={relevantEntities}
          selectedIds={selectedIds}
          onChangeIds={(ids) => upd({ filter: { ...section.filter, entityIds: ids } })}
        />}

        {isListSection && (
          <div>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Макс. кількість елементів</label>
            <input type="number" min={1} max={100}
              value={section.filter?.limit ?? ""}
              onChange={(e) => upd({ filter: { ...section.filter, limit: e.target.value ? Number(e.target.value) : undefined } })}
              placeholder="Без обмежень" className={inputCls} />
          </div>
        )}

        {section.kind === "map" && (
          <div>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Embed URL карти</label>
            <input value={section.payload?.embedUrl ?? ""} onChange={(e) => upd({ payload: { ...section.payload, embedUrl: e.target.value } })} placeholder="https://maps.google.com/maps?q=...&output=embed" className={inputCls} />
          </div>
        )}
        {section.kind === "custom_text" && (
          <div>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Текст блоку</label>
            <textarea rows={5} value={section.payload?.text ?? ""} onChange={(e) => upd({ payload: { ...section.payload, text: e.target.value } })} placeholder="Введіть текст..." className="w-full resize-none rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/35 focus:outline-none" />
          </div>
        )}
        {section.kind === "quote" && (
          <>
            <div>
              <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Текст цитати</label>
              <textarea rows={3} value={section.payload?.quote ?? ""} onChange={(e) => upd({ payload: { ...section.payload, quote: e.target.value } })} placeholder="«Текст цитати...»" className="w-full resize-none rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/35 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Автор (необов'язково)</label>
              <input value={section.payload?.author ?? ""} onChange={(e) => upd({ payload: { ...section.payload, author: e.target.value } })} placeholder="Ім'я автора або джерело" className={inputCls} />
            </div>
          </>
        )}
        {section.kind === "stat_strip" && (
          <div>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Факти (рядок: "Значення | Підпис")</label>
            <textarea rows={4} value={section.payload?.stats ?? ""} onChange={(e) => upd({ payload: { ...section.payload, stats: e.target.value } })} placeholder={"3 200 км² | Площа\n1.2 млн | Населення"} className="w-full resize-none rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 font-mono text-[13px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/35 focus:outline-none" />
          </div>
        )}
        {section.kind === "menu_link" && (
          <div>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Посилання на меню</label>
            <input value={section.payload?.menuUrl ?? ""} onChange={(e) => upd({ payload: { ...section.payload, menuUrl: e.target.value } })} placeholder="https://..." className={inputCls} />
          </div>
        )}
        {section.kind === "ticket_info" && (
          <div>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Інформація про квитки</label>
            <textarea rows={3} value={section.payload?.ticketInfo ?? ""} onChange={(e) => upd({ payload: { ...section.payload, ticketInfo: e.target.value } })} placeholder="Квитки можна придбати на ..." className="w-full resize-none rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/35 focus:outline-none" />
          </div>
        )}
        {section.kind === "video" && (
          <div>
            <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-[#002f5e]/70">URL або завантажити відео</label>
            <input value={section.payload?.videoUrl ?? ""} onChange={(e) => upd({ payload: { ...section.payload, videoUrl: e.target.value } })} placeholder="https://..." className={inputCls} />
          </div>
        )}
      </div>
      {section.kind === "gallery" && (
        <GalleryEditor
          sectionId={section.id}
          entityType={entityType}
          entityId={entityId}
          allCards={allCards}
          onCardsChange={onCardsChange}
        />
      )}
    </div>
  );
};

// ─── Add section panel ────────────────────────────────────────────────────────

const AddSectionPanel = ({
  entityType, existingKinds, onAdd, onClose,
}: {
  entityType: PageEntityType;
  existingKinds: PageSectionKind[];
  onAdd: (kind: PageSectionKind) => void;
  onClose: () => void;
}) => {
  const available = (Object.entries(SECTION_KIND_META) as [PageSectionKind, typeof SECTION_KIND_META[PageSectionKind]][])
    .filter(([, meta]) => meta.applicableTo.includes(entityType));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-[#002f5e]/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-[360px] flex-col bg-[#fff2e8] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#002f5e]/10 px-5 py-4">
          <h3 className="text-[16px] font-semibold text-[#002f5e]">Додати блок</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#002f5e]/8">
            <X className="h-4 w-4 text-[#002f5e]/70" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-2">
            {available.map(([kind, meta]) => {
              const alreadyAdded = existingKinds.includes(kind) && !["custom_text","gallery","divider"].includes(kind);
              return (
                <button key={kind} type="button" onClick={() => { onAdd(kind); onClose(); }} disabled={alreadyAdded}
                  className="flex items-start gap-3 rounded-2xl border border-[#002f5e]/10 bg-white/70 p-3 text-left transition hover:border-[#002f5e]/25 hover:bg-white disabled:opacity-40">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#002f5e]/8 text-[#002f5e]/70">
                    {ICON_MAP[meta.icon] ?? <FileText className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#002f5e]">{meta.label}</p>
                    <p className="text-[11px] text-[#002f5e]/70">{meta.description}</p>
                    {alreadyAdded && <span className="mt-1 inline-block text-[10px] text-[#9f1f47]/70">Вже додано</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Entity list panel (RIGHT side) — EntityCard style ───────────────────────

interface EntityItem {
  id: string;
  name: string;
  sub?: string;
  imageUrl?: string;
  badge?: string;
  badgeColor?: string;
}

const EntityListPanel = ({
  entityType, districts, cities, places, selectedId, onSelect,
}: {
  entityType: PageEntityType;
  districts: District[];
  cities: City[];
  places: TourismObject[];
  selectedId: string;
  onSelect: (id: string) => void;
}) => {
  const [query, setQuery] = useState("");

  const items: EntityItem[] = (() => {
    const q = query.toLowerCase();
    if (entityType === "district") {
      return districts.filter((d) => d.name.toLowerCase().includes(q))
        .map((d) => ({ id: d.id, name: d.name, sub: d.subtitle ?? undefined, imageUrl: d.imageUrl ?? undefined }));
    }
    if (entityType === "city") {
      return cities.filter((c) => c.name.toLowerCase().includes(q))
        .map((c) => {
          const dist = districts.find((d) => d.id === c.districtId);
          return { id: c.id, name: c.name, sub: dist?.name, imageUrl: c.imageUrl ?? undefined };
        });
    }
    const type = entityType as TourismObjectType;
    return places.filter((p) => p.type === type && p.name.toLowerCase().includes(q))
      .map((p) => {
        const city = cities.find((c) => c.id === p.cityId);
        return { id: p.id, name: p.name, sub: city?.name, imageUrl: p.imageUrl ?? undefined, badge: PLACE_SUB_LABELS[type], badgeColor: PLACE_SUB_COLORS[type] };
      });
  })();

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden">
      {/* Default template card */}
      <button type="button" onClick={() => onSelect("default")}
        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
          selectedId === "default"
            ? "border-[#002f5e] bg-[#002f5e] text-[#fff2e8]"
            : "border-[#002f5e]/15 bg-white/80 text-[#002f5e] hover:border-[#002f5e]/30 hover:bg-white"
        }`}>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selectedId === "default" ? "bg-white/15" : "bg-[#002f5e]/8"}`}>
          <Globe className={`h-5 w-5 ${selectedId === "default" ? "text-[#fff2e8]" : "text-[#002f5e]/70"}`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">Шаблон за замовчуванням</p>
          <p className={`text-[11px] ${selectedId === "default" ? "text-[#fff2e8]/60" : "text-[#002f5e]/70"}`}>Застосовується до всіх</p>
        </div>
        {selectedId === "default" && <Check className="h-4 w-4 shrink-0 text-[#fff2e8]/80" />}
      </button>

      {/* Search */}
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Пошук..."
        className="w-full rounded-xl border border-[#002f5e]/12 bg-white px-3 py-2 text-[13px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/30 focus:outline-none" />

      <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-[#002f5e]/70">
        {entityType === "district" ? "Райони" : entityType === "city" ? "Міста" : "Об'єкти"}
      </p>

      {/* Entity cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pb-2">
        {items.length === 0 ? (
          <p className="py-8 text-center text-[12px] text-[#002f5e]/70">Нічого не знайдено</p>
        ) : (
          items.map((item) => (
            <button key={item.id} type="button" onClick={() => onSelect(item.id)}
              className={`group flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                selectedId === item.id
                  ? "border-[#002f5e]/40 bg-[#002f5e]/8 ring-2 ring-[#002f5e]/15"
                  : "border-[#002f5e]/10 bg-white/70 hover:border-[#002f5e]/25 hover:bg-white"
              }`}>
              {item.imageUrl ? (
                <img loading="lazy" decoding="async" src={item.imageUrl} alt={item.name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#002f5e]/8">
                  <MapPin className="h-5 w-5 text-[#002f5e]/70" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[13px] font-semibold text-[#002f5e]">{item.name}</p>
                  {item.badge && (
                    <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white" style={{ backgroundColor: item.badgeColor ?? "#002f5e" }}>{item.badge}</span>
                  )}
                </div>
                {item.sub && <p className="truncate text-[11px] text-[#002f5e]/70">{item.sub}</p>}
              </div>
              {selectedId === item.id && <Check className="h-4 w-4 shrink-0 text-[#002f5e]" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

// ─── District card order panel ────────────────────────────────────────────────

const DistrictOrderPanel = ({ districts, showToast, selectedId, onSelect }: {
  districts: District[];
  showToast: (msg: string, ok?: boolean) => void;
  selectedId: string;
  onSelect: (id: string) => void;
}) => {
  const [ordered, setOrdered] = useState<District[]>(() =>
    [...districts].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setOrdered([...districts].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)));
    setDirty(false);
  }, [districts]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...ordered];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrdered(next);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateDistrictSortOrders(ordered.map((d, i) => ({ id: d.id, sortOrder: i })));
      showToast("Порядок збережено ✓");
      setDirty(false);
    } catch {
      showToast("Помилка збереження", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-3 rounded-2xl border border-[#002f5e]/10 bg-white/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#002f5e]/70">Порядок карток</p>
        {dirty && (
          <button type="button" onClick={save} disabled={saving}
            className="flex items-center gap-1 rounded-lg bg-[#002f5e] px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-[#002f5e]/85 disabled:opacity-60">
            {saving
              ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <Save className="h-3 w-3" />}
            {saving ? "..." : "Зберегти"}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 max-h-[320px] overflow-y-auto">
        {ordered.map((d, idx) => {
          const isActive = selectedId === d.id;
          return (
          <div key={d.id}
            className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 transition cursor-pointer ${
              isActive
                ? "border-[#002f5e]/30 bg-[#002f5e] text-[#fff2e8]"
                : "border-[#002f5e]/8 bg-[#fff2e8]/60 hover:bg-[#002f5e]/5"
            }`}
            onClick={() => onSelect(d.id)}>
            <GripVertical className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-white/75" : "text-[#002f5e]/70"}`} />
            <span className={`w-5 shrink-0 text-center text-[11px] font-semibold ${isActive ? "text-white/75" : "text-[#002f5e]/70"}`}>{idx + 1}</span>
            {d.imageUrl && (
              <img loading="lazy" decoding="async" src={d.imageUrl} alt={d.name} className="h-7 w-10 shrink-0 rounded-md object-cover" />
            )}
            <span className={`flex-1 truncate text-[12px] font-medium ${isActive ? "text-white" : "text-[#002f5e]"}`}>{d.name}</span>
            <div className="flex flex-col" onClick={e => e.stopPropagation()}>
              <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                className={`rounded p-0.5 transition disabled:opacity-20 ${isActive ? "text-white/75 hover:text-white" : "text-[#002f5e]/70 hover:text-[#002f5e]"}`}>
                <ChevronUp className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => move(idx, 1)} disabled={idx === ordered.length - 1}
                className={`rounded p-0.5 transition disabled:opacity-20 ${isActive ? "text-white/75 hover:text-white" : "text-[#002f5e]/70 hover:text-[#002f5e]"}`}>
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
};

// ─── CityOrderPanel ──────────────────────────────────────────────────────────

const CityOrderPanel = ({ cities, districts, showToast, selectedId, onSelect }: {
  cities: City[];
  districts: District[];
  showToast: (msg: string, ok?: boolean) => void;
  selectedId: string;
  onSelect: (id: string) => void;
}) => {
  const [ordered, setOrdered] = useState<City[]>(() =>
    [...cities].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setOrdered([...cities].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name)));
    setDirty(false);
  }, [cities]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...ordered];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setOrdered(next);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateCitySortOrders(ordered.map((c, i) => ({ id: c.id, sortOrder: i })));
      showToast("Порядок міст збережено ✓");
      setDirty(false);
    } catch {
      showToast("Помилка збереження", false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-3 rounded-2xl border border-[#002f5e]/10 bg-white/70 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#002f5e]/70">Порядок міст</p>
        {dirty && (
          <button type="button" onClick={save} disabled={saving}
            className="flex items-center gap-1 rounded-lg bg-[#002f5e] px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-[#002f5e]/85 disabled:opacity-60">
            {saving
              ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <Save className="h-3 w-3" />}
            {saving ? "..." : "Зберегти"}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 max-h-[360px] overflow-y-auto">
        {ordered.map((city, idx) => {
          const isActive = selectedId === city.id;
          const districtName = districts.find(d => d.id === city.districtId)?.name;
          return (
            <div key={city.id}
              className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 transition cursor-pointer ${
                isActive
                  ? "border-[#002f5e]/30 bg-[#002f5e] text-[#fff2e8]"
                  : "border-[#002f5e]/8 bg-[#fff2e8]/60 hover:bg-[#002f5e]/5"
              }`}
              onClick={() => onSelect(city.id)}>
              <GripVertical className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-white/75" : "text-[#002f5e]/70"}`} />
              <span className={`w-5 shrink-0 text-center text-[11px] font-semibold ${isActive ? "text-white/75" : "text-[#002f5e]/70"}`}>{idx + 1}</span>
              {city.imageUrl && (
                <img loading="lazy" decoding="async" src={city.imageUrl} alt={city.name} className="h-7 w-10 shrink-0 rounded-md object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <span className={`block truncate text-[12px] font-medium ${isActive ? "text-white" : "text-[#002f5e]"}`}>{city.name}</span>
                {districtName && (
                  <span className={`block truncate text-[10px] ${isActive ? "text-white/75" : "text-[#002f5e]/70"}`}>{districtName}</span>
                )}
              </div>
              <div className="flex flex-col" onClick={e => e.stopPropagation()}>
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                  className={`rounded p-0.5 transition disabled:opacity-20 ${isActive ? "text-white/75 hover:text-white" : "text-[#002f5e]/70 hover:text-[#002f5e]"}`}>
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === ordered.length - 1}
                  className={`rounded p-0.5 transition disabled:opacity-20 ${isActive ? "text-white/75 hover:text-white" : "text-[#002f5e]/70 hover:text-[#002f5e]"}`}>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main AdminPageEditor ─────────────────────────────────────────────────────

const AdminPageEditor = ({ entityType, districts, cities, places, showToast, allCards, onCardsChange }: Props & { allCards: ContentCardEntity[]; onCardsChange: (cards: ContentCardEntity[]) => void }) => {
  const storageKey = `admin-page-editor-entity-${entityType}`;
  const [selectedEntityId, setSelectedEntityId] = useState<string>(
    () => sessionStorage.getItem(storageKey) ?? "default"
  );

  const selectEntity = (id: string) => {
    sessionStorage.setItem(storageKey, id);
    setSelectedEntityId(id);
  };
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [addPanelOpen, setAddPanelOpen] = useState(false);

  // Stable ref so loadConfig doesn't re-create when parent re-renders
  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; });

  const loadConfig = useCallback(async (entityId: string, resetEditing = true) => {
    setLoading(true);
    if (resetEditing) setEditingSectionId(null);
    try {
      const cfg = await getOrCreatePageConfig(entityType, entityId);
      setConfig(cfg);
    } catch (e: unknown) {
      showToastRef.current((e as Error)?.message ?? "Помилка завантаження", false);
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => { void loadConfig(selectedEntityId, true); }, [loadConfig, selectedEntityId]);

  const save = async (cfg: PageConfig) => {
    setSaving(true);
    try {
      await upsertPageConfig(cfg);
      showToast("Збережено ✓");
    } catch (e: unknown) {
      showToast((e as Error)?.message ?? "Помилка збереження", false);
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (updated: PageSection) => {
    if (!config) return;
    setConfig({ ...config, sections: config.sections.map((s) => (s.id === updated.id ? updated : s)) });
  };

  const toggleVisible = (id: string) => {
    if (!config) return;
    setConfig({ ...config, sections: config.sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)) });
  };

  const deleteSection = (id: string) => {
    if (!config) return;
    if (!confirm("Видалити блок?")) return;
    setConfig({ ...config, sections: config.sections.filter((s) => s.id !== id) });
    if (editingSectionId === id) setEditingSectionId(null);
  };

  const moveSection = (id: string, dir: 1 | -1) => {
    if (!config) return;
    const sorted = [...config.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((s) => s.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sorted.length) return;
    const aOrder = sorted[idx].sortOrder;
    const bOrder = sorted[newIdx].sortOrder;
    setConfig({
      ...config,
      sections: config.sections.map((s) => {
        if (s.id === sorted[idx].id)    return { ...s, sortOrder: bOrder };
        if (s.id === sorted[newIdx].id) return { ...s, sortOrder: aOrder };
        return s;
      }),
    });
  };

  const addSection = (kind: PageSectionKind) => {
    if (!config) return;
    const meta = SECTION_KIND_META[kind];
    const maxOrder = Math.max(0, ...config.sections.map((s) => s.sortOrder));
    const newSection: PageSection = { id: uid(), kind, title: meta.label, visible: true, sortOrder: maxOrder + 1 };
    setConfig({ ...config, sections: [...config.sections, newSection] });
    setEditingSectionId(newSection.id);
  };

  const resetToDefault = () => {
    if (!confirm("Скинути до шаблону? Всі зміни буде втрачено.")) return;
    setConfig(makeDefaultConfig(entityType, selectedEntityId));
    setEditingSectionId(null);
  };

  const sortedSections = config ? [...config.sections].sort((a, b) => a.sortOrder - b.sortOrder) : [];
  const editingSection = sortedSections.find((s) => s.id === editingSectionId) ?? null;

  const entityLabel = selectedEntityId === "default"
    ? "Шаблон за замовчуванням"
    : (() => {
        if (entityType === "district") return districts.find((d) => d.id === selectedEntityId)?.name;
        if (entityType === "city")     return cities.find((c) => c.id === selectedEntityId)?.name;
        return places.find((p) => p.id === selectedEntityId)?.name;
      })() ?? selectedEntityId;

  return (
    <div className="flex h-full gap-5 overflow-hidden">
      {/* ── LEFT+CENTER: section list & editor ───────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[16px] font-semibold text-[#002f5e]">Блоки сторінки</p>
            <p className="mt-0.5 truncate text-[12px] text-[#002f5e]/70">{entityLabel}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" title="Скинути до шаблону" onClick={resetToDefault}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#002f5e]/12 text-[#002f5e]/70 transition hover:bg-[#002f5e]/8 hover:text-[#002f5e]">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setAddPanelOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#002f5e] px-3.5 py-2 text-[13px] font-medium text-[#fff2e8] transition hover:bg-[#002f5e]/85">
              <Plus className="h-3.5 w-3.5" /> Блок
            </button>
            {config && (
              <button type="button" onClick={() => void save(config)} disabled={saving}
                className="flex items-center gap-1.5 rounded-xl bg-[#17a358] px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-[#17a358]/85 disabled:opacity-60">
                {saving
                  ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <Check className="h-3.5 w-3.5" />}
                {saving ? "Зберігається..." : "Зберегти"}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* section list */}
          <div className="flex w-[290px] shrink-0 flex-col overflow-hidden">
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#002f5e]/20 border-t-[#002f5e]" />
              </div>
            ) : sortedSections.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-16 text-center">
                <Plus className="h-8 w-8 text-[#002f5e]/70" />
                <p className="text-[13px] text-[#002f5e]/70">Блоків ще немає. Додайте перший!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto pb-2">
                {sortedSections.map((sec, idx) => (
                  <SectionRow key={sec.id} section={sec}
                    isFirst={idx === 0} isLast={idx === sortedSections.length - 1}
                    isEditing={editingSectionId === sec.id}
                    onEdit={() => setEditingSectionId((prev) => (prev === sec.id ? null : sec.id))}
                    onToggleVisible={() => toggleVisible(sec.id)}
                    onDelete={() => deleteSection(sec.id)}
                    onMoveUp={() => moveSection(sec.id, -1)}
                    onMoveDown={() => moveSection(sec.id, 1)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* section editor */}
          <div className="flex-1 overflow-y-auto">
            {editingSection && config ? (
              <SectionEditor key={editingSection.id} section={editingSection}
                entityType={entityType} entityId={selectedEntityId} places={places} districts={districts} cities={cities}
                onChange={(sec) => updateSection(sec)}
                onClose={() => setEditingSectionId(null)}
                allCards={allCards} onCardsChange={onCardsChange}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/12 text-center text-[#002f5e]/70">
                <Settings2 className="h-10 w-10 opacity-25" />
                <div>
                  <p className="text-[14px] font-medium">Оберіть блок для редагування</p>
                  <p className="mt-1 text-[12px]">або додайте новий блок</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: order + entity list ─────────────────────────── */}
      <div className="w-[270px] shrink-0 overflow-y-auto overflow-x-hidden rounded-2xl border border-[#002f5e]/10 bg-[#fff2e8]/60 p-3">
        {entityType === "district" && (
          <DistrictOrderPanel districts={districts} showToast={showToast}
            selectedId={selectedEntityId} onSelect={selectEntity} />
        )}
        {entityType === "city" && (
          <CityOrderPanel cities={cities} districts={districts} showToast={showToast}
            selectedId={selectedEntityId} onSelect={selectEntity} />
        )}
        <p className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#002f5e]/70">
          Налаштувань для
        </p>
        <EntityListPanel entityType={entityType} districts={districts} cities={cities}
          places={places} selectedId={selectedEntityId} onSelect={selectEntity} />
      </div>

      {addPanelOpen && config && (
        <AddSectionPanel entityType={entityType} existingKinds={config.sections.map((s) => s.kind)}
          onAdd={addSection} onClose={() => setAddPanelOpen(false)} />
      )}
    </div>
  );
};

export default AdminPageEditor;
