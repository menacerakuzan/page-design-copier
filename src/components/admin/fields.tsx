import { useRef, useState } from "react";
import { CheckCircle2, Landmark, Link, Trash2, Upload } from "lucide-react";
import { uploadMedia } from "@/data/storage";
import { TourismObject } from "@/types/hierarchy";
import { PLACE_TYPES } from "@/components/admin/constants";

// Shared presentational primitives for the admin screens.

export const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-1 block text-[13px] font-medium text-[#002f5e]/70 uppercase tracking-wide">{children}</span>
);

export const Input = ({ value, onChange, placeholder = "", className = "", onFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; onFocus?: () => void }) => (
  <input
    value={value}
    onChange={e => onChange(e.target.value)}
    onFocus={onFocus}
    placeholder={placeholder}
    className={`w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition ${className}`}
  />
);

export const Textarea = ({ value, onChange, placeholder = "", rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) => (
  <textarea
    value={value}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    className="w-full resize-none rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition"
  />
);

export const MultiField = ({ label, value, onChange, placeholder }: {
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
              className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition"
            />
            {items.length > 1 && (
              <button type="button" onClick={() => remove(idx)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#9f1f47]/20 text-[#9f1f47]/50 transition hover:border-[#9f1f47]/50 hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]">
                <span className="text-[18px] leading-none">−</span>
              </button>
            )}
            {idx === items.length - 1 && (
              <button type="button" onClick={add}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#002f5e]/20 text-[#002f5e]/70 transition hover:border-[#002f5e]/40 hover:bg-[#002f5e]/8 hover:text-[#002f5e]">
                <span className="text-[18px] leading-none">+</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FormSelect = ({ value, onChange, children, disabled = false }: { value: string; onChange: (v: string) => void; children: React.ReactNode; disabled?: boolean }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    disabled={disabled}
    className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-4 py-2.5 text-[14px] text-[#002f5e] focus:border-[#002f5e]/40 focus:outline-none focus:ring-2 focus:ring-[#002f5e]/10 transition disabled:opacity-50"
  >
    {children}
  </select>
);

export const FieldGroup = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <Label>{label}</Label>
    {children}
  </div>
);

export const SaveBtn = ({ saving, label = "Зберегти" }: { saving: boolean; label?: string }) => (
  <button
    type="submit"
    disabled={saving}
    className="flex items-center gap-2 rounded-xl bg-[#002f5e] px-6 py-2.5 text-[14px] font-medium text-[#fff2e8] transition hover:bg-[#002f5e]/85 disabled:opacity-60"
  >
    {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckCircle2 className="h-4 w-4" />}
    {saving ? "Зберігається..." : label}
  </button>
);

type MediaMode = "url" | "upload";

export const MediaField = ({ label, value, onChange, accept, isVideo }: {
  label: string; value: string; onChange: (v: string) => void;
  accept: string; isVideo: boolean;
}) => {
  const [mode, setMode] = useState<MediaMode>("url");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadMedia(file, setProgress);
      onChange(url);
    } catch (err: any) {
      alert(err?.message ?? "Помилка завантаження файлу");
    } finally {
      setUploading(false);
      setProgress(0);
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
              mode === "url" ? "bg-[#002f5e] text-white" : "text-[#002f5e]/70 hover:text-[#002f5e]"
            }`}>
            <Link className="h-3 w-3" /> URL
          </button>
          <button type="button" onClick={() => { setMode("upload"); setTimeout(() => fileRef.current?.click(), 50); }}
            className={`flex items-center gap-1 rounded-md px-2 py-1 transition ${
              mode === "upload" ? "bg-[#002f5e] text-white" : "text-[#002f5e]/70 hover:text-[#002f5e]"
            }`}>
            <Upload className="h-3 w-3" /> Файл
          </button>
        </div>
      </div>
      {mode === "url" ? (
        <Input value={value} onChange={onChange} placeholder="https://..." />
      ) : (
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#002f5e]/20 bg-white py-3 text-[13px] text-[#002f5e]/70 transition hover:border-[#002f5e]/35 hover:text-[#002f5e]/70"
        >
          {uploading ? (
            <>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#002f5e]/40 border-t-[#002f5e]" />
                {progress > 0 ? `${progress}%` : "Завантаження..."}
              </div>
              {progress > 0 && (
                <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[#002f5e]/10">
                  <div className="h-full rounded-full bg-[#002f5e] transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
            </>
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
              <img loading="lazy" decoding="async" src={value} alt="gif" className="h-full w-full object-cover" />
            ) : (
              <video src={value} className="h-full w-full object-cover" muted loop autoPlay playsInline />
            )}
            <button type="button" onClick={() => onChange("")}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-[#9f1f47]"
              title="Видалити">✕</button>
          </div>
        ) : (
          <div className="relative mt-2">
            <img loading="lazy" decoding="async" src={value} alt="" className="h-32 w-full rounded-lg object-cover opacity-90" onError={e => (e.currentTarget.style.display = "none")} />
            <button type="button" onClick={() => onChange("")}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-[#9f1f47]"
              title="Видалити">✕</button>
          </div>
        )
      )}
    </div>
  );
};

export const AudioField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  const [mode, setMode] = useState<MediaMode>("url");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const url = await uploadMedia(file, setProgress);
      onChange(url);
    } catch (err: any) {
      alert(err?.message ?? "Помилка завантаження файлу");
    } finally {
      setUploading(false);
      setProgress(0);
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
              mode === "url" ? "bg-[#002f5e] text-white" : "text-[#002f5e]/70 hover:text-[#002f5e]"
            }`}>
            <Link className="h-3 w-3" /> URL
          </button>
          <button type="button" onClick={() => { setMode("upload"); setTimeout(() => fileRef.current?.click(), 50); }}
            className={`flex items-center gap-1 rounded-md px-2 py-1 transition ${
              mode === "upload" ? "bg-[#002f5e] text-white" : "text-[#002f5e]/70 hover:text-[#002f5e]"
            }`}>
            <Upload className="h-3 w-3" /> Файл
          </button>
        </div>
      </div>
      {mode === "url" ? (
        <Input value={value} onChange={onChange} placeholder="https://..." />
      ) : (
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#002f5e]/20 bg-white py-3 text-[13px] text-[#002f5e]/70 transition hover:border-[#002f5e]/35 hover:text-[#002f5e]/70"
        >
          {uploading ? (
            <>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#002f5e]/40 border-t-[#002f5e]" />
                {progress > 0 ? `${progress}%` : "Завантаження..."}
              </div>
              {progress > 0 && (
                <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[#002f5e]/10">
                  <div className="h-full rounded-full bg-[#002f5e] transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
            </>
          ) : (
            <><Upload className="h-4 w-4" /> Обрати аудіофайл</>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
      {value && (
        <div className="relative mt-2 flex items-center gap-2 rounded-lg border border-[#002f5e]/10 bg-white p-2">
          <audio src={value} controls className="h-9 flex-1" />
          <button type="button" onClick={() => onChange("")}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-[#9f1f47]"
            title="Видалити">✕</button>
        </div>
      )}
    </div>
  );
};

export const VenuePicker = ({ value, onChange, places }: { value: string; onChange: (v: string) => void; places: TourismObject[] }) => {
  const [query, setQuery] = useState("");
  const filtered = places.filter(p => p.type !== "event" && (!query || p.name.toLowerCase().includes(query.toLowerCase())));
  const selected = places.find(p => p.id === value);
  return (
    <div className="flex flex-col gap-2">
      {selected && (
        <div className="flex items-center justify-between rounded-xl bg-[#002f5e]/6 px-3 py-2">
          <span className="text-[13px] font-medium text-[#002f5e]">{selected.name}</span>
          <button type="button" onClick={() => onChange("")} className="text-[#002f5e]/70 hover:text-[#9f1f47] transition text-[11px]">✕ зняти</button>
        </div>
      )}
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Пошук закладу..."
        className="w-full rounded-xl border border-[#002f5e]/15 bg-white px-3 py-2 text-[13px] text-[#002f5e] placeholder:text-[#002f5e]/70 focus:border-[#002f5e]/40 focus:outline-none"
      />
      {query && (
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-xl border border-[#002f5e]/12 bg-white">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-[13px] text-[#002f5e]/70">Нічого не знайдено</p>
          ) : filtered.map(p => (
            <button key={p.id} type="button"
              onClick={() => { onChange(p.id); setQuery(""); }}
              className={`flex items-center gap-2 px-3 py-2 text-left text-[13px] transition hover:bg-[#002f5e]/5 ${p.id === value ? "bg-[#002f5e]/8 font-medium" : "text-[#002f5e]"}`}>
              <span className="truncate">{p.name}</span>
              <span className="shrink-0 text-[11px] text-[#002f5e]/70">{PLACE_TYPES.find(t => t.value === p.type)?.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const MediaGroup = ({ imageUrl, videoUrl, reelUrl, onImage, onVideo, onReel }: {
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

export const MediaGroupPlace = ({ imageUrl, videoUrl, reelUrl, reelImageUrl, onImage, onVideo, onReel, onReelImage }: {
  imageUrl: string; videoUrl: string; reelUrl: string; reelImageUrl: string;
  onImage: (v: string) => void; onVideo: (v: string) => void; onReel: (v: string) => void; onReelImage: (v: string) => void;
}) => (
  <div className="flex flex-col gap-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <MediaField label="Картинка (горизонтальна)" value={imageUrl} onChange={onImage} accept="image/*" isVideo={false} />
      <MediaField label="Відео / GIF (горизонтальне)" value={videoUrl} onChange={onVideo} accept="video/*,image/gif" isVideo={true} />
    </div>
    <MediaField label="Вертикальне відео / Reels (9:16)" value={reelUrl} onChange={onReel} accept="video/*" isVideo={true} />
    <MediaField label="Фото для Reels (якщо замість відео)" value={reelImageUrl} onChange={onReelImage} accept="image/*" isVideo={false} />
  </div>
);

export const EntityCard = ({ title, subtitle, imageUrl, onDelete, onEdit, badge, isEditing, icon }: { title: string; subtitle?: string; imageUrl?: string; onDelete: () => void; onEdit: () => void; badge?: { label: string; color: string }; isEditing?: boolean; icon?: React.ReactNode }) => (
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
      <img loading="lazy" decoding="async" src={imageUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded-xl object-cover" onError={e => (e.currentTarget.style.display = "none")} />
    ) : (
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#002f5e]/8">
        {icon ?? <Landmark className="h-5 w-5 text-[#002f5e]/70" />}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="truncate text-[14px] font-semibold text-[#002f5e]">{title}</p>
        {badge && (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: badge.color }}>{badge.label}</span>
        )}
      </div>
      {subtitle && <p className="truncate text-[12px] text-[#002f5e]/70">{subtitle}</p>}
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
