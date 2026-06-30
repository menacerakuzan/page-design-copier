import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, Languages, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  loadRoutes, upsertRoute, deleteRoute, type Route as RouteType,
  ROUTE_TAG_OPTIONS, loadRouteTagOrder, saveRouteTagOrder,
} from "@/lib/routesRepository";
import { loadHierarchySnapshot } from "@/lib/adminRepository";
import { translateFields, translateHtml } from "@/lib/translate";
import RichTextEditor from "@/components/RichTextEditor";
import { FieldGroup, Input, Label, Textarea, MediaField } from "@/components/admin/fields";
import { TourismObject } from "@/types/hierarchy";

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

export const RoutesAdmin = ({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) => {
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
