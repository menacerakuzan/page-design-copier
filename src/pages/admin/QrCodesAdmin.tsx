import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, FileArchive, FileText, Loader2, QrCode, Search, X } from "lucide-react";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { objectTypeLabel } from "@/lib/entityLinks";
import { posterItemFromObject, type PosterItem } from "@/lib/qrPoster/item";
import type { TourismObject, TourismObjectType } from "@/types/hierarchy";

type ShowToast = (msg: string, ok?: boolean) => void;

const TYPE_FILTERS: { id: "all" | TourismObjectType; label: string }[] = [
  { id: "all", label: "Усі" },
  { id: "attraction", label: "Місця" },
  { id: "event", label: "Події" },
  { id: "restaurant", label: "Ресторани" },
  { id: "hotel", label: "Готелі" },
];

/** Що саме стоїть праворуч від коду — щоб редактор бачив це ще до вивантаження. */
const infoBadge = (item: PosterItem) => {
  if (item.infoTitle === "ГРАФІК РОБОТИ") return { text: "графік", cls: "bg-emerald-50 text-emerald-800" };
  if (item.infoTitle === "ДАТА ПРОВЕДЕННЯ") return { text: "дати", cls: "bg-sky-50 text-sky-800" };
  if (item.infoTitle === "АДРЕСА") return { text: "адреса", cls: "bg-amber-50 text-amber-800" };
  return { text: "лише QR", cls: "bg-[#002f5e]/8 text-[#002f5e]/70" };
};

// Генератор (qrcode, jsPDF, JSZip) важкий — вантажимо його лише на першу дію.
const loadExport = () => import("@/lib/qrPoster/export");

export const QrCodesAdmin = ({ showToast }: { showToast: ShowToast }) => {
  const { data: snapshot, isLoading } = useHierarchySnapshot();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | TourismObjectType>("all");
  const [districtId, setDistrictId] = useState("");
  const [onlyPublished, setOnlyPublished] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<{ label: string; done: number; total: number } | null>(null);
  const [preview, setPreview] = useState<{ id: string; url: string | null } | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const cities = snapshot?.cities ?? [];
  const districts = snapshot?.districts ?? [];

  const rows = useMemo(() => {
    const objects: TourismObject[] = snapshot?.objects ?? [];
    return objects.map(obj => ({ obj, item: posterItemFromObject(obj, snapshot?.cities, snapshot?.districts) }));
  }, [snapshot]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(({ obj, item }) =>
      (type === "all" || obj.type === type) &&
      (!onlyPublished || obj.published) &&
      (!districtId || obj.districtId === districtId ||
        cities.find(c => c.id === obj.cityId)?.districtId === districtId) &&
      (!q || item.name.toLowerCase().includes(q) || item.place.toLowerCase().includes(q)));
  }, [rows, query, type, districtId, onlyPublished, cities]);

  const visibleSelected = visible.filter(r => selected.has(r.obj.id)).length;
  const allVisibleSelected = visible.length > 0 && visibleSelected === visible.length;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = visibleSelected > 0 && !allVisibleSelected;
  }, [visibleSelected, allVisibleSelected]);

  // Прев'ю тримає object URL — звільняємо його, коли картинка змінюється.
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url); }, [preview?.url]);

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleAllVisible = () => setSelected(prev => {
    const next = new Set(prev);
    if (allVisibleSelected) visible.forEach(r => next.delete(r.obj.id));
    else visible.forEach(r => next.add(r.obj.id));
    return next;
  });

  // Порядок у файлі — як у списку, а не як клікали.
  const selectedItems = () => rows.filter(r => selected.has(r.obj.id)).map(r => r.item);

  const runBulk = async (kind: "pdf" | "zip") => {
    const items = selectedItems();
    if (!items.length) return showToast("Оберіть хоча б одне місце", false);
    const label = kind === "pdf" ? "PDF" : "ZIP";
    setBusy({ label, done: 0, total: items.length });
    try {
      const mod = await loadExport();
      const onProgress = (done: number, total: number) => setBusy({ label, done, total });
      const stamp = new Date().toISOString().slice(0, 10);
      if (kind === "pdf") await mod.downloadPostersPdf(items, onProgress, `qr-postery-${stamp}.pdf`);
      else await mod.downloadPostersZip(items, onProgress, `qr-postery-${stamp}.zip`);
      showToast(`Готово: ${items.length} ${items.length === 1 ? "постер" : "постерів"} у ${label}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Не вдалося згенерувати постери", false);
    } finally {
      setBusy(null);
    }
  };

  const downloadOne = async (item: PosterItem) => {
    setBusy({ label: "PNG", done: 0, total: 1 });
    try {
      await (await loadExport()).downloadPosterPng(item);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Не вдалося згенерувати постер", false);
    } finally {
      setBusy(null);
    }
  };

  const openPreview = async (id: string, item: PosterItem) => {
    setPreview({ id, url: null });
    try {
      const url = await (await loadExport()).posterPreviewUrl(item, 0.5);
      setPreview(p => (p?.id === id ? { id, url } : (URL.revokeObjectURL(url), p)));
    } catch {
      setPreview(null);
      showToast("Не вдалося побудувати прев'ю", false);
    }
  };

  const previewRow = preview ? rows.find(r => r.obj.id === preview.id) : undefined;

  return (
    <>
      <section className="flex-1 min-w-0 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-odesa-medium text-[22px] text-[#002f5e]">QR-коди</h2>
            <p className="mt-1 max-w-[640px] text-[13px] text-[#002f5e]/70">
              Друковані постери A4 у фірмовому стилі: назва, населений пункт, графік роботи з картки місця
              і QR-код, що веде на його сторінку. Позначте місця й вивантажте одним файлом.
            </p>
          </div>
        </div>

        {/* фільтри */}
        <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[#002f5e]/10 bg-white p-3">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Пошук за назвою або населеним пунктом</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#002f5e]/50" aria-hidden="true" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Пошук за назвою або містом"
              className="w-full rounded-xl border border-[#002f5e]/15 bg-[#fff2e8]/40 py-2 pl-9 pr-3 text-[14px] text-[#002f5e] outline-none focus:border-[#002f5e]/40" />
          </label>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Тип об'єкта">
            {TYPE_FILTERS.map(f => (
              <button key={f.id} type="button" onClick={() => setType(f.id)} aria-pressed={type === f.id}
                className={`rounded-xl px-3 py-2 text-[13px] font-medium transition ${
                  type === f.id ? "bg-[#002f5e] text-[#fff2e8]" : "text-[#002f5e]/70 hover:bg-[#002f5e]/8"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[13px] text-[#002f5e]">
            <span className="sr-only">Район</span>
            <select value={districtId} onChange={e => setDistrictId(e.target.value)}
              className="rounded-xl border border-[#002f5e]/15 bg-white px-3 py-2 text-[13px] text-[#002f5e]">
              <option value="">Усі райони</option>
              {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 px-1 text-[13px] text-[#002f5e]">
            <input type="checkbox" checked={onlyPublished} onChange={e => setOnlyPublished(e.target.checked)}
              className="h-4 w-4 accent-[#002f5e]" />
            Лише опубліковані
          </label>
        </div>

        {/* панель дій */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-[20px] border border-[#002f5e]/10 bg-[#fff2e8] p-3 shadow-sm">
          <p className="mr-auto text-[13px] text-[#002f5e]" aria-live="polite">
            Обрано: <b>{selected.size}</b>
            {selected.size > 0 && (
              <button type="button" onClick={() => setSelected(new Set())}
                className="ml-3 text-[12px] text-[#002f5e]/70 underline underline-offset-2 hover:text-[#002f5e]">
                зняти всі
              </button>
            )}
          </p>
          {busy && (
            <div className="flex min-w-[180px] items-center gap-2 text-[12px] text-[#002f5e]" role="status">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{busy.label}: {busy.done}/{busy.total}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#002f5e]/10">
                <span className="block h-full bg-[#002f5e] transition-all" style={{ width: `${(busy.done / busy.total) * 100}%` }} />
              </span>
            </div>
          )}
          <button type="button" disabled={!selected.size || !!busy} onClick={() => runBulk("pdf")}
            className="flex items-center gap-2 rounded-xl bg-[#002f5e] px-4 py-2 text-[13px] font-medium text-[#fff2e8] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40">
            <FileText className="h-4 w-4" aria-hidden="true" /> Завантажити PDF для друку
          </button>
          <button type="button" disabled={!selected.size || !!busy} onClick={() => runBulk("zip")}
            className="flex items-center gap-2 rounded-xl border border-[#002f5e]/20 bg-white px-4 py-2 text-[13px] font-medium text-[#002f5e] transition hover:bg-[#002f5e]/5 disabled:cursor-not-allowed disabled:opacity-40">
            <FileArchive className="h-4 w-4" aria-hidden="true" /> ZIP з PNG
          </button>
        </div>

        {/* список */}
        <div className="overflow-hidden rounded-[20px] border border-[#002f5e]/10 bg-white">
          <div className="flex items-center gap-3 border-b border-[#002f5e]/10 bg-[#002f5e]/[0.03] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wider text-[#002f5e]/70">
            <input ref={selectAllRef} type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible}
              disabled={!visible.length} aria-label="Обрати всі видимі місця" className="h-4 w-4 accent-[#002f5e]" />
            <span className="flex-1">Місце · {visible.length}</span>
            <span className="hidden w-[92px] sm:block">Праворуч</span>
            <span className="w-[76px] text-right">Дії</span>
          </div>
          {isLoading && <p className="p-6 text-[14px] text-[#002f5e]/70">Завантаження…</p>}
          {!isLoading && !visible.length && <p className="p-6 text-[14px] text-[#002f5e]/70">Нічого не знайдено.</p>}
          <ul className="max-h-[calc(100vh-360px)] divide-y divide-[#002f5e]/8 overflow-y-auto">
            {visible.map(({ obj, item }) => {
              const badge = infoBadge(item);
              const checked = selected.has(obj.id);
              return (
                <li key={obj.id} className={`flex items-center gap-3 px-4 py-2.5 ${preview?.id === obj.id ? "bg-[#fff2e8]/70" : checked ? "bg-[#002f5e]/[0.03]" : ""}`}>
                  <input id={`qr-${obj.id}`} type="checkbox" checked={checked} onChange={() => toggle(obj.id)}
                    className="h-4 w-4 shrink-0 accent-[#002f5e]" />
                  <label htmlFor={`qr-${obj.id}`} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block truncate text-[14px] font-medium text-[#002f5e]">
                      {item.name}
                      {!obj.published && <span className="ml-2 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">чернетка</span>}
                    </span>
                    <span className="block truncate text-[12px] text-[#002f5e]/70">
                      {objectTypeLabel(obj.type)}{item.place ? ` · ${item.place}` : ""}
                    </span>
                  </label>
                  <span className={`hidden w-[92px] shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-semibold sm:block ${badge.cls}`}>
                    {badge.text}
                  </span>
                  <div className="flex w-[76px] shrink-0 justify-end gap-1">
                    <button type="button" onClick={() => openPreview(obj.id, item)} title="Переглянути постер"
                      aria-label={`Переглянути постер: ${item.name}`}
                      className="rounded-lg p-2 text-[#002f5e]/70 transition hover:bg-[#002f5e]/8 hover:text-[#002f5e]">
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => downloadOne(item)} disabled={!!busy} title="Завантажити PNG"
                      aria-label={`Завантажити PNG: ${item.name}`}
                      className="rounded-lg p-2 text-[#002f5e]/70 transition hover:bg-[#002f5e]/8 hover:text-[#002f5e] disabled:opacity-40">
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* прев'ю */}
      <aside className="sticky top-0 hidden w-[340px] shrink-0 self-start lg:block" aria-label="Прев'ю постера">
        <div className="rounded-[20px] border border-[#002f5e]/10 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-odesa-medium text-[15px] text-[#002f5e]">Прев'ю</p>
            {preview && (
              <button type="button" onClick={() => setPreview(null)} aria-label="Закрити прев'ю"
                className="text-[#002f5e]/70 hover:text-[#002f5e]"><X className="h-4 w-4" /></button>
            )}
          </div>
          {!preview && (
            <div className="flex aspect-[1240/1754] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#002f5e]/20 text-center text-[13px] text-[#002f5e]/60">
              <QrCode className="h-10 w-10" aria-hidden="true" />
              <span className="px-6">Натисніть <Eye className="inline h-3.5 w-3.5" aria-hidden="true" /> біля місця, щоб побачити постер</span>
            </div>
          )}
          {preview && (
            <>
              <div className="relative aspect-[1240/1754] overflow-hidden rounded-xl border border-[#002f5e]/10 bg-[#fff2e8]">
                {preview.url
                  ? <img src={preview.url} alt={`Постер: ${previewRow?.item.name ?? ""}`} className="h-full w-full object-contain" />
                  : <Loader2 className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-[#002f5e]/60" aria-label="Будуємо прев'ю" />}
              </div>
              {previewRow && (
                <>
                  <p className="mt-3 break-all text-[11px] text-[#002f5e]/60">{previewRow.item.url}</p>
                  <button type="button" onClick={() => downloadOne(previewRow.item)} disabled={!!busy}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#002f5e] px-4 py-2.5 text-[13px] font-medium text-[#fff2e8] transition hover:opacity-85 disabled:opacity-40">
                    <Download className="h-4 w-4" aria-hidden="true" /> Завантажити PNG (A4, 300 dpi)
                  </button>
                  {previewRow.item.infoTitle === "" && (
                    <p className="mt-2 text-[12px] text-amber-800">
                      У картці немає графіка, дат чи адреси — на постері буде лише код. Заповніть «Години роботи» в розділі «Місця».
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
};
