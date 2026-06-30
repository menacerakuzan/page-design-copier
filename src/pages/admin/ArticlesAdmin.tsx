import { useEffect, useState } from "react";
import { CheckCircle2, Languages, Newspaper, Pencil, Plus, X } from "lucide-react";
import { loadPublishedContentCards, upsertContentCard, deleteContentCard } from "@/lib/adminRepository";
import { translateFields } from "@/lib/translate";
import RichTextEditor from "@/components/RichTextEditor";
import { MediaField } from "@/components/admin/fields";
import { ContentCardEntity } from "@/types/cms";

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

export const ArticlesAdmin = ({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) => {
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
