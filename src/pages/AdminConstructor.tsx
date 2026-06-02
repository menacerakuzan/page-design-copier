import { useState } from "react";
import {
  Eye, EyeOff, Trash2, Plus, ChevronUp, ChevronDown,
  MapPin, Calendar, Landmark, LayoutDashboard,
  X, AlignLeft, AlignCenter, Maximize2,
  Type, Image as ImageIcon, Check,
} from "lucide-react";
import { ContentCardEntity } from "@/types/cms";
import { District, City, TourismObject } from "@/types/hierarchy";
import { upsertContentCard, deleteContentCard } from "@/lib/adminRepository";

// ─── types ────────────────────────────────────────────────────────────────────

type ConstructorTab = "directions" | "interesting" | "attractions" | "events";

interface Props {
  contentCards: ContentCardEntity[];
  places: TourismObject[];
  districts: District[];
  cities: City[];
  onCardsChange: (updated: ContentCardEntity[]) => void;
  showToast: (msg: string, ok?: boolean) => void;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

const PAGE_KEY = "index";

const SECTION_KEYS: Record<ConstructorTab, string[]> = {
  directions: ["directions"],
  interesting: ["interesting-featured", "interesting"],
  attractions: ["attractions"],
  events: ["events"],
};

const getTabCards = (cards: ContentCardEntity[], tab: ConstructorTab) => {
  const keys = SECTION_KEYS[tab];
  return cards
    .filter(c => c.pageKey === PAGE_KEY && keys.includes(c.sectionKey))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
};

const PLACE_TYPE_LABELS: Record<string, string> = {
  attraction: "Тур об'єкт",
  event: "Подія",
  restaurant: "Ресторан",
  hotel: "Готель",
};
const PLACE_TYPE_COLORS: Record<string, string> = {
  attraction: "#002f5e",
  event: "#9f1f47",
  restaurant: "#eea846",
  hotel: "#17a358",
};

// ─── sub-components ───────────────────────────────────────────────────────────

const SectionTab = ({
  active, label, icon, count, onClick,
}: {
  active: boolean; label: string; icon: React.ReactNode; count: number; onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] font-medium transition ${
      active
        ? "bg-[#002f5e] text-[#fff2e8]"
        : "text-[#002f5e]/60 hover:bg-[#002f5e]/8 hover:text-[#002f5e]"
    }`}
  >
    {icon}
    {label}
    <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${active ? "bg-white/20" : "bg-[#002f5e]/10"}`}>
      {count}
    </span>
  </button>
);

const CardThumb = ({ imageUrl, size = "sm" }: { imageUrl?: string | null; size?: "sm" | "md" }) => {
  const dim = size === "sm" ? "h-12 w-12" : "h-16 w-20";
  return imageUrl ? (
    <img
      src={imageUrl}
      alt=""
      className={`${dim} shrink-0 rounded-xl object-cover`}
      onError={e => (e.currentTarget.style.display = "none")}
    />
  ) : (
    <div className={`${dim} shrink-0 rounded-xl bg-[#002f5e]/8 flex items-center justify-center`}>
      <ImageIcon className="h-5 w-5 text-[#002f5e]/30" />
    </div>
  );
};

const MiniBtn = ({
  onClick, active = false, title, children,
}: {
  onClick: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`flex h-7 w-7 items-center justify-center rounded-lg text-[12px] transition ${
      active
        ? "bg-[#002f5e] text-white"
        : "bg-[#002f5e]/8 text-[#002f5e]/60 hover:bg-[#002f5e]/15 hover:text-[#002f5e]"
    }`}
  >
    {children}
  </button>
);

// ─── Picker Sheet ──────────────────────────────────────────────────────────────

const PickerSheet = ({
  items, onSelect, onClose, title, emptyMsg,
}: {
  items: { id: string; name: string; imageUrl?: string | null; badge?: string; badgeColor?: string }[];
  onSelect: (id: string) => void;
  onClose: () => void;
  title: string;
  emptyMsg: string;
}) => {
  const [query, setQuery] = useState("");
  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-center sm:justify-end">
      <div className="absolute inset-0 bg-[#002f5e]/20 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 flex h-full max-h-[90vh] w-full max-w-[420px] flex-col rounded-l-2xl bg-[#fff2e8] shadow-2xl sm:h-[80vh] sm:rounded-2xl sm:m-4">
        <div className="flex items-center justify-between border-b border-[#002f5e]/10 px-5 py-4">
          <h3 className="text-[16px] font-semibold text-[#002f5e]">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-[#002f5e]/8">
            <X className="h-4 w-4 text-[#002f5e]/50" />
          </button>
        </div>
        <div className="px-5 py-3">
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Пошук..."
            className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] placeholder:text-[#002f5e]/35 focus:border-[#002f5e]/35 focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {filtered.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-[#002f5e]/40">{emptyMsg}</p>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item.id); onClose(); }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#002f5e]/6"
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" onError={e => (e.currentTarget.style.display = "none")} />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#002f5e]/8">
                      <ImageIcon className="h-4 w-4 text-[#002f5e]/30" />
                    </div>
                  )}
                  <span className="flex-1 text-[14px] font-medium text-[#002f5e]">{item.name}</span>
                  {item.badge && (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: item.badgeColor ?? "#002f5e" }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Directions section ───────────────────────────────────────────────────────

const DirectionsSection = ({
  cards, districts, onUpdate, onDelete, onAdd, onMove,
}: {
  cards: ContentCardEntity[];
  districts: District[];
  onUpdate: (card: ContentCardEntity) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (district: District) => Promise<void>;
  onMove: (id: string, dir: 1 | -1) => Promise<void>;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const usedDistrictIds = new Set(cards.map(c => c.districtId).filter(Boolean));
  const availableDistricts = districts.filter(d => !usedDistrictIds.has(d.id));

  return (
    <>
      <div className="flex flex-col gap-2">
        {cards.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-14 text-center">
            <MapPin className="h-8 w-8 text-[#002f5e]/25" />
            <p className="text-[13px] text-[#002f5e]/45">Додайте райони, які будуть відображатися на головній сторінці</p>
          </div>
        )}
        {cards.map((card, idx) => (
          <div
            key={card.id}
            className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
              card.published ? "border-[#002f5e]/12 bg-white/70" : "border-[#002f5e]/8 bg-white/30 opacity-60"
            }`}
          >
            <CardThumb imageUrl={card.imageUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[#002f5e]">{card.title}</p>
              <p className="text-[12px] text-[#002f5e]/50">Сортування: {card.sortOrder}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <MiniBtn onClick={() => onMove(card.id, -1)} title="Вгору">
                <ChevronUp className="h-3.5 w-3.5" />
              </MiniBtn>
              <MiniBtn onClick={() => onMove(card.id, 1)} title="Вниз">
                <ChevronDown className="h-3.5 w-3.5" />
              </MiniBtn>
              <MiniBtn onClick={() => onUpdate({ ...card, published: !card.published })} active={card.published} title={card.published ? "Приховати" : "Показати"}>
                {card.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </MiniBtn>
              <button
                type="button"
                onClick={() => onDelete(card.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9f1f47]/30 transition hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={availableDistricts.length === 0}
          className="mt-1 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#002f5e]/25 py-3 text-[13px] font-medium text-[#002f5e]/55 transition hover:border-[#002f5e]/45 hover:text-[#002f5e] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Додати напрямок
        </button>
      </div>
      {pickerOpen && (
        <PickerSheet
          title="Оберіть район"
          emptyMsg="Всі райони вже додано"
          items={availableDistricts.map(d => ({ id: d.id, name: d.name, imageUrl: d.imageUrl }))}
          onSelect={id => { const d = districts.find(x => x.id === id); if (d) void onAdd(d); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
};

// ─── Interesting section ──────────────────────────────────────────────────────

const SIZE_OPTIONS = [
  { value: 1, label: "1/3", icon: <AlignLeft className="h-3 w-3" /> },
  { value: 2, label: "2/3", icon: <AlignCenter className="h-3 w-3" /> },
  { value: 3, label: "Повна", icon: <Maximize2 className="h-3 w-3" /> },
];

const TEXT_OPTIONS = [
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
];

const InterestingSection = ({
  cards, places, cities, onUpdate, onDelete, onAdd, onAddText, onMove,
}: {
  cards: ContentCardEntity[];
  places: TourismObject[];
  cities: City[];
  onUpdate: (card: ContentCardEntity) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (place: TourismObject) => Promise<void>;
  onAddText: (title: string, description: string) => Promise<void>;
  onMove: (id: string, dir: 1 | -1) => Promise<void>;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [textFormOpen, setTextFormOpen] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textDesc, setTextDesc] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const usedPlaceIds = new Set(cards.map(c => c.payload?.placeId).filter(Boolean));
  const availablePlaces = places.filter(p => !usedPlaceIds.has(p.id) && p.published);

  const submitTextCard = async () => {
    if (!textTitle.trim()) return;
    await onAddText(textTitle.trim(), textDesc.trim());
    setTextTitle("");
    setTextDesc("");
    setTextFormOpen(false);
  };

  const updatePayload = (card: ContentCardEntity, patch: Record<string, any>) =>
    onUpdate({ ...card, payload: { ...card.payload, ...patch } });

  return (
    <>
      <div className="flex flex-col gap-2">
        {cards.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-14 text-center">
            <ImageIcon className="h-8 w-8 text-[#002f5e]/25" />
            <p className="text-[13px] text-[#002f5e]/45">Додайте об'єкти для розділу «Цікаве»</p>
          </div>
        )}
        {cards.map((card, idx) => {
          const colSpan: number = card.payload?.colSpan ?? 1;
          const row: number = card.payload?.row ?? 1;
          const textSize: string = card.payload?.textSize ?? "md";
          const descSize: string = card.payload?.descSize ?? "sm";
          const expanded = expandedId === card.id;
          const typeColor = PLACE_TYPE_COLORS[card.cardType] ?? "#002f5e";

          return (
            <div
              key={card.id}
              className={`rounded-2xl border transition ${
                card.published ? "border-[#002f5e]/12 bg-white/70" : "border-[#002f5e]/8 bg-white/30 opacity-60"
              }`}
            >
              {/* Main row */}
              <div className="flex items-center gap-3 p-3">
                <CardThumb imageUrl={card.imageUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: typeColor }}
                    >
                      {PLACE_TYPE_LABELS[card.cardType] ?? card.cardType}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[14px] font-semibold text-[#002f5e]">{card.title}</p>
                  <p className="text-[11px] text-[#002f5e]/45">{colSpan === 3 ? "Повна ширина" : colSpan === 2 ? "2/3 ширини" : "1/3 ширини"} · {row === 2 ? "Нижній рядок" : "Верхній рядок"}{card.cardType === "text" ? ` · Заг. ${textSize.toUpperCase()} / Опис ${descSize.toUpperCase()}` : ` · Текст ${textSize.toUpperCase()}`}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <MiniBtn onClick={() => setExpandedId(expanded ? null : card.id)} active={expanded} title="Налаштування">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </MiniBtn>
                  <MiniBtn onClick={() => onMove(card.id, -1)} title="Вгору">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </MiniBtn>
                  <MiniBtn onClick={() => onMove(card.id, 1)} title="Вниз">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </MiniBtn>
                  <MiniBtn onClick={() => onUpdate({ ...card, published: !card.published })} active={card.published} title={card.published ? "Приховати" : "Показати"}>
                    {card.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </MiniBtn>
                  <button
                    type="button"
                    onClick={() => onDelete(card.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9f1f47]/30 transition hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded settings */}
              {expanded && (
                <div className="border-t border-[#002f5e]/8 px-4 pb-4 pt-3">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Width */}
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#002f5e]/40">Ширина</p>
                      <div className="flex gap-1">
                        {SIZE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updatePayload(card, { colSpan: opt.value })}
                            className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition ${
                              colSpan === opt.value ? "bg-[#002f5e] text-white" : "bg-[#002f5e]/8 text-[#002f5e]/60 hover:bg-[#002f5e]/15"
                            }`}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Row */}
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#002f5e]/40">Рядок</p>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updatePayload(card, { row: 1 })}
                          className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition ${
                            row !== 2 ? "bg-[#002f5e] text-white" : "bg-[#002f5e]/8 text-[#002f5e]/60 hover:bg-[#002f5e]/15"
                          }`}
                        >
                          <ChevronUp className="h-3 w-3" /> Верхній
                        </button>
                        <button
                          type="button"
                          onClick={() => updatePayload(card, { row: 2 })}
                          className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-medium transition ${
                            row === 2 ? "bg-[#002f5e] text-white" : "bg-[#002f5e]/8 text-[#002f5e]/60 hover:bg-[#002f5e]/15"
                          }`}
                        >
                          <ChevronDown className="h-3 w-3" /> Нижній
                        </button>
                      </div>
                    </div>
                    {/* Text size */}
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#002f5e]/40">Текст</p>
                      <div className="flex gap-1">
                        {TEXT_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updatePayload(card, { textSize: opt.value })}
                            className={`flex flex-1 items-center justify-center rounded-lg py-1.5 text-[11px] font-bold transition ${
                              textSize === opt.value ? "bg-[#002f5e] text-white" : "bg-[#002f5e]/8 text-[#002f5e]/60 hover:bg-[#002f5e]/15"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Description + descSize — only for text cards */}
                  {card.cardType === "text" && (
                    <>
                      <div className="mt-3 grid grid-cols-3 gap-4">
                        {/* empty spacer for col 1+2 */}
                        <div className="col-span-2" />
                        {/* Desc text size */}
                        <div>
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#002f5e]/40">Текст опису</p>
                          <div className="flex gap-1">
                            {TEXT_OPTIONS.map(opt => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => updatePayload(card, { descSize: opt.value })}
                                className={`flex flex-1 items-center justify-center rounded-lg py-1.5 text-[11px] font-bold transition ${
                                  descSize === opt.value ? "bg-[#002f5e] text-white" : "bg-[#002f5e]/8 text-[#002f5e]/60 hover:bg-[#002f5e]/15"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#002f5e]/40">Опис</p>
                        <textarea
                          className="w-full resize-none rounded-xl border border-[#002f5e]/15 bg-white px-3 py-2 text-[13px] text-[#002f5e] outline-none placeholder:text-[#002f5e]/35 focus:border-[#002f5e]/40"
                          rows={3}
                          placeholder="Текст під заголовком"
                          defaultValue={String(card.payload?.description ?? "")}
                          onBlur={e => updatePayload(card, { description: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mt-1 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#002f5e]/25 py-3 text-[13px] font-medium text-[#002f5e]/55 transition hover:border-[#002f5e]/45 hover:text-[#002f5e]"
        >
          <Plus className="h-4 w-4" /> Додати об'єкт
        </button>
        <button
          type="button"
          onClick={() => setTextFormOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#002f5e]/25 py-3 text-[13px] font-medium text-[#002f5e]/55 transition hover:border-[#002f5e]/45 hover:text-[#002f5e]"
        >
          <AlignLeft className="h-4 w-4" /> Додати текстову картку
        </button>
      </div>

      {/* Text card modal */}
      {textFormOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) { setTextFormOpen(false); setTextTitle(""); setTextDesc(""); } }}
        >
          <div className="w-full max-w-sm mx-4 rounded-3xl border border-[#002f5e]/12 bg-white shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#002f5e]/8">
                  <AlignLeft className="h-4 w-4 text-[#002f5e]" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#002f5e]">Текстова картка</h3>
              </div>
              <button
                type="button"
                onClick={() => { setTextFormOpen(false); setTextTitle(""); setTextDesc(""); }}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-[#002f5e]/30 transition hover:bg-[#002f5e]/8 hover:text-[#002f5e]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <input
                className="w-full rounded-xl border border-[#002f5e]/15 bg-[#002f5e]/4 px-3 py-2.5 text-[14px] text-[#002f5e] outline-none placeholder:text-[#002f5e]/35 focus:border-[#002f5e]/40 focus:bg-white transition"
                placeholder="Заголовок картки"
                value={textTitle}
                onChange={e => setTextTitle(e.target.value)}
                autoFocus
              />
              <textarea
                className="w-full resize-none rounded-xl border border-[#002f5e]/15 bg-[#002f5e]/4 px-3 py-2.5 text-[14px] text-[#002f5e] outline-none placeholder:text-[#002f5e]/35 focus:border-[#002f5e]/40 focus:bg-white transition"
                placeholder="Опис (необов'язково)"
                rows={3}
                value={textDesc}
                onChange={e => setTextDesc(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={submitTextCard}
                disabled={!textTitle.trim()}
                className="flex-1 rounded-xl bg-[#002f5e] py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#002f5e]/85 disabled:opacity-40"
              >
                Додати картку
              </button>
              <button
                type="button"
                onClick={() => { setTextFormOpen(false); setTextTitle(""); setTextDesc(""); }}
                className="rounded-xl border border-[#002f5e]/15 px-4 py-2.5 text-[13px] text-[#002f5e]/55 transition hover:bg-[#002f5e]/5"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerOpen && (
        <PickerSheet
          title="Оберіть об'єкт для «Цікаве»"
          emptyMsg="Немає доступних опублікованих об'єктів"
          items={availablePlaces.map(p => ({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl,
            badge: PLACE_TYPE_LABELS[p.type],
            badgeColor: PLACE_TYPE_COLORS[p.type],
          }))}
          onSelect={id => { const p = places.find(x => x.id === id); if (p) void onAdd(p); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
};

// ─── Generic place-based section (Attractions / Events) ───────────────────────

const PlaceCardsSection = ({
  cards, places, filterType, sectionKey, icon, addLabel, emptyMsg,
  onUpdate, onDelete, onAdd, onMove, extraFields,
}: {
  cards: ContentCardEntity[];
  places: TourismObject[];
  filterType: string | null;
  sectionKey: string;
  icon: React.ReactNode;
  addLabel: string;
  emptyMsg: string;
  onUpdate: (card: ContentCardEntity) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdd: (place: TourismObject) => Promise<void>;
  onMove: (id: string, dir: 1 | -1) => Promise<void>;
  extraFields?: (card: ContentCardEntity) => React.ReactNode;
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const usedIds = new Set(cards.map(c => c.payload?.placeId).filter(Boolean));
  const available = places.filter(p => (!filterType || p.type === filterType) && !usedIds.has(p.id) && p.published);

  return (
    <>
      <div className="flex flex-col gap-2">
        {cards.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#002f5e]/20 py-14 text-center">
            {icon}
            <p className="text-[13px] text-[#002f5e]/45">{emptyMsg}</p>
          </div>
        )}
        {cards.map((card, idx) => (
          <div key={card.id} className={`rounded-2xl border transition ${card.published ? "border-[#002f5e]/12 bg-white/70" : "border-[#002f5e]/8 bg-white/30 opacity-60"}`}>
            <div className="flex items-center gap-3 p-3">
              <CardThumb imageUrl={card.imageUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[#002f5e]">{card.title}</p>
                {card.subtitle && <p className="truncate text-[12px] text-[#002f5e]/55">{card.subtitle}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {extraFields && (
                  <MiniBtn onClick={() => setEditingId(editingId === card.id ? null : card.id)} active={editingId === card.id} title="Редагувати">
                    <Type className="h-3.5 w-3.5" />
                  </MiniBtn>
                )}
                <MiniBtn onClick={() => onMove(card.id, -1)} title="Вгору">
                  <ChevronUp className="h-3.5 w-3.5" />
                </MiniBtn>
                <MiniBtn onClick={() => onMove(card.id, 1)} title="Вниз">
                  <ChevronDown className="h-3.5 w-3.5" />
                </MiniBtn>
                <MiniBtn onClick={() => onUpdate({ ...card, published: !card.published })} active={card.published} title={card.published ? "Приховати" : "Показати"}>
                  {card.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </MiniBtn>
                <button
                  type="button"
                  onClick={() => onDelete(card.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9f1f47]/30 transition hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {extraFields && editingId === card.id && (
              <div className="border-t border-[#002f5e]/8 px-4 pb-4 pt-3">
                {extraFields(card)}
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          disabled={available.length === 0}
          className="mt-1 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[#002f5e]/25 py-3 text-[13px] font-medium text-[#002f5e]/55 transition hover:border-[#002f5e]/45 hover:text-[#002f5e] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> {addLabel}
        </button>
      </div>

      {pickerOpen && (
        <PickerSheet
          title={addLabel}
          emptyMsg="Немає доступних опублікованих об'єктів"
          items={available.map(p => ({
            id: p.id,
            name: p.name,
            imageUrl: p.imageUrl,
            badge: PLACE_TYPE_LABELS[p.type],
            badgeColor: PLACE_TYPE_COLORS[p.type],
          }))}
          onSelect={id => { const p = places.find(x => x.id === id); if (p) void onAdd(p); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
};

// ─── Event badge inline editor ────────────────────────────────────────────────

const EventBadgeEditor = ({
  card, onUpdate,
}: {
  card: ContentCardEntity;
  onUpdate: (card: ContentCardEntity) => Promise<void>;
}) => {
  const [badgeTop, setBadgeTop] = useState<string>(String(card.payload?.badgeTop ?? ""));
  const [badgeDay, setBadgeDay] = useState<string>(String(card.payload?.badgeDay ?? ""));
  const [badgeMonth, setBadgeMonth] = useState<string>(String(card.payload?.badgeMonth ?? ""));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate({ ...card, payload: { ...card.payload, badgeTop, badgeDay, badgeMonth } });
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#002f5e]/40">Бейдж дати на картці</p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="mb-1 text-[11px] text-[#002f5e]/50">Префікс (до/з)</p>
          <input
            value={badgeTop}
            onChange={e => setBadgeTop(e.target.value)}
            placeholder="до"
            className="w-full rounded-lg border border-[#002f5e]/15 bg-white px-3 py-1.5 text-[13px] focus:outline-none"
          />
        </div>
        <div>
          <p className="mb-1 text-[11px] text-[#002f5e]/50">День</p>
          <input
            value={badgeDay}
            onChange={e => setBadgeDay(e.target.value)}
            placeholder="24"
            className="w-full rounded-lg border border-[#002f5e]/15 bg-white px-3 py-1.5 text-[13px] focus:outline-none"
          />
        </div>
        <div>
          <p className="mb-1 text-[11px] text-[#002f5e]/50">Місяць</p>
          <input
            value={badgeMonth}
            onChange={e => setBadgeMonth(e.target.value)}
            placeholder="травень"
            className="w-full rounded-lg border border-[#002f5e]/15 bg-white px-3 py-1.5 text-[13px] focus:outline-none"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-1.5 self-start rounded-lg bg-[#002f5e] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#002f5e]/85 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" /> {saving ? "Збереження..." : "Зберегти"}
      </button>
    </div>
  );
};

// ─── Main AdminConstructor ─────────────────────────────────────────────────────

const AdminConstructor = ({ contentCards, places, districts, cities, onCardsChange, showToast }: Props) => {
  const [activeTab, setActiveTab] = useState<ConstructorTab>("directions");

  const indexCards = contentCards.filter(c => c.pageKey === PAGE_KEY);
  const tabCards = getTabCards(indexCards, activeTab);

  const applyCardChange = async (updated: ContentCardEntity) => {
    // Optimistic update — apply to local state immediately
    const next = contentCards.map(c => c.id === updated.id ? updated : c);
    onCardsChange(next.some(c => c.id === updated.id) ? next : [...contentCards, updated]);
    try {
      await upsertContentCard(updated);
      showToast("Збережено");
    } catch (e: any) {
      showToast((e?.message ?? "Помилка збереження") + " (локально збережено)", false);
    }
  };

  const applyDelete = async (id: string) => {
    if (!confirm("Видалити картку?")) return;
    try {
      await deleteContentCard(id);
      onCardsChange(contentCards.filter(c => c.id !== id));
      showToast("Видалено");
    } catch (e: any) {
      showToast(e?.message ?? "Помилка", false);
    }
  };

  const moveCard = async (id: string, dir: 1 | -1) => {
    const sorted = [...tabCards];
    const idx = sorted.findIndex(c => c.id === id);
    if (idx < 0) return;
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const a = { ...sorted[idx], sortOrder: sorted[targetIdx].sortOrder };
    const b = { ...sorted[targetIdx], sortOrder: sorted[idx].sortOrder };

    try {
      await Promise.all([upsertContentCard(a), upsertContentCard(b)]);
      const updMap = new Map([[a.id, a], [b.id, b]]);
      onCardsChange(contentCards.map(c => updMap.get(c.id) ?? c));
    } catch (e: any) {
      showToast(e?.message ?? "Помилка сортування", false);
    }
  };

  const addFromDistrict = async (district: District) => {
    const maxOrder = tabCards.reduce((m, c) => Math.max(m, c.sortOrder), -1);
    const card: ContentCardEntity = {
      id: `card-${uid()}`,
      pageKey: PAGE_KEY,
      sectionKey: "directions",
      cardType: "destination",
      title: district.name,
      subtitle: null,
      imageUrl: district.imageUrl ?? null,
      href: `/raion/${district.slug}`,
      cityId: null,
      districtId: district.id,
      regionId: null,
      sortOrder: maxOrder + 1,
      published: true,
      payload: {},
    };
    await applyCardChange(card);
  };

  const PLACE_ROUTE: Record<string, string> = {
    attraction: "/mistse",
    event: "/podiyi",
    hotel: "/hoteli",
    restaurant: "/restorany",
  };

  const addFromPlace = async (place: TourismObject, sectionKey: string) => {
    const maxOrder = tabCards.reduce((m, c) => Math.max(m, c.sortOrder), -1);
    const city = cities.find(c => c.id === place.cityId);
    const isEvent = place.type === "event";
    const card: ContentCardEntity = {
      id: `card-${uid()}`,
      pageKey: PAGE_KEY,
      sectionKey,
      cardType: place.type,
      title: place.name,
      subtitle: place.address ?? (city ? city.name : null),
      imageUrl: place.imageUrl ?? null,
      href: `${PLACE_ROUTE[place.type]}/${place.slug}`,
      cityId: place.cityId,
      districtId: place.districtId,
      regionId: null,
      sortOrder: maxOrder + 1,
      published: true,
      payload: {
        placeId: place.id,
        description: place.description ?? "",
        ...(sectionKey === "interesting" ? { colSpan: 1, row: 1, textSize: "md" } : {}),
        ...(isEvent ? {
          badgeTop: "до",
          badgeDay: place.eventDates ? place.eventDates.split(/[–\-.]/)[0]?.trim() ?? "" : "",
          badgeMonth: "",
        } : {}),
      },
    };
    await applyCardChange(card);
  };

  const addTextCard = async (title: string, description: string) => {
    const maxOrder = tabCards.reduce((m, c) => Math.max(m, c.sortOrder), -1);
    const card: ContentCardEntity = {
      id: `card-${uid()}`,
      pageKey: PAGE_KEY,
      sectionKey: "interesting",
      cardType: "text",
      title,
      subtitle: null,
      imageUrl: null,
      href: null,
      cityId: null,
      districtId: null,
      regionId: null,
      sortOrder: maxOrder + 1,
      published: true,
      payload: { colSpan: 1, row: 1, textSize: "md", descSize: "sm", description },
    };
    await applyCardChange(card);
  };

  const TABS: { id: ConstructorTab; label: string; icon: React.ReactNode }[] = [
    { id: "directions", label: "Напрямки", icon: <MapPin className="h-4 w-4" /> },
    { id: "interesting", label: "Цікаве", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "attractions", label: "Атракції", icon: <Landmark className="h-4 w-4" /> },
    { id: "events", label: "Події", icon: <Calendar className="h-4 w-4" /> },
  ];

  const TAB_DESCRIPTIONS: Record<ConstructorTab, string> = {
    directions: "Райони, які відображаються на головній сторінці як картки з прокруткою",
    interesting: "Блок «Цікаве» — головна картка та колекція об'єктів з налаштуванням ширини, висоти та розміру тексту",
    attractions: "Великий повноекранний слайдер туристичних атракцій — назва, опис, зображення",
    events: "Картки подій з датою — вибирайте та впорядковуйте події на головній",
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col gap-0">
      {/* Section header */}
      <div className="rounded-2xl border border-[#002f5e]/12 bg-white/80 p-5 shadow-sm backdrop-blur">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#002f5e]/8">
            <LayoutDashboard className="h-4 w-4 text-[#002f5e]" />
          </div>
          <h2 className="text-[18px] font-semibold text-[#002f5e]">Конструктор головної сторінки</h2>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => (
            <SectionTab
              key={tab.id}
              active={activeTab === tab.id}
              label={tab.label}
              icon={tab.icon}
              count={getTabCards(indexCards, tab.id).length}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        <p className="mt-3 text-[13px] text-[#002f5e]/50">{TAB_DESCRIPTIONS[activeTab]}</p>
      </div>

      {/* Section content */}
      <div className="mt-4">
        {activeTab === "directions" && (
          <DirectionsSection
            cards={tabCards}
            districts={districts}
            onUpdate={applyCardChange}
            onDelete={applyDelete}
            onAdd={addFromDistrict}
            onMove={moveCard}
          />
        )}

        {activeTab === "interesting" && (
          <InterestingSection
            cards={tabCards}
            places={places}
            cities={cities}
            onUpdate={applyCardChange}
            onDelete={applyDelete}
            onAdd={p => addFromPlace(p, "interesting")}
            onAddText={addTextCard}
            onMove={moveCard}
          />
        )}

        {activeTab === "attractions" && (
          <PlaceCardsSection
            cards={tabCards}
            places={places}
            filterType="attraction"
            sectionKey="attractions"
            icon={<Landmark className="h-8 w-8 text-[#002f5e]/25" />}
            addLabel="Додати атракцію"
            emptyMsg="Додайте туристичні об'єкти для великого слайдера"
            onUpdate={applyCardChange}
            onDelete={applyDelete}
            onAdd={p => addFromPlace(p, "attractions")}
            onMove={moveCard}
            extraFields={null as any}
          />
        )}

        {activeTab === "events" && (
          <PlaceCardsSection
            cards={tabCards}
            places={places}
            filterType="event"
            sectionKey="events"
            icon={<Calendar className="h-8 w-8 text-[#002f5e]/25" />}
            addLabel="Додати подію"
            emptyMsg="Додайте події — вони з'являться як картки з датами"
            onUpdate={applyCardChange}
            onDelete={applyDelete}
            onAdd={p => addFromPlace(p, "events")}
            onMove={moveCard}
            extraFields={(card) => <EventBadgeEditor card={card} onUpdate={applyCardChange} />}
          />
        )}
      </div>
    </div>
  );
};

export default AdminConstructor;
