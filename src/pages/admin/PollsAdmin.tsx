import { useEffect, useState } from "react";
import { BarChart3, ChevronDown, ChevronUp, ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  loadPolls, upsertPoll, deletePoll, loadPollResponses,
  type Poll, type PollQuestion, type PollAnswers,
} from "@/lib/pollsRepository";
import { FieldGroup, Input, MediaField } from "@/components/admin/fields";
import { uid } from "@/lib/id";

const emptyQuestion = (): PollQuestion => ({ id: uid(), text: "", options: [{ id: uid(), text: "" }, { id: uid(), text: "" }] });

const emptyPoll = (): Poll => ({ id: "", title: "", active: false, questions: [emptyQuestion()] });

/** Результати: { [questionId]: { [optionId]: count } } + всього відповідей. */
function tally(responses: PollAnswers[]) {
  const counts: Record<string, Record<string, number>> = {};
  for (const answers of responses) {
    for (const [qId, val] of Object.entries(answers)) {
      counts[qId] ??= {};
      for (const optId of Array.isArray(val) ? val : [val]) {
        counts[qId][optId] = (counts[qId][optId] ?? 0) + 1;
      }
    }
  }
  return counts;
}

const ResultsPanel = ({ poll }: { poll: Poll }) => {
  const [responses, setResponses] = useState<PollAnswers[] | null>(null);

  useEffect(() => { loadPollResponses(poll.id).then(setResponses); }, [poll.id]);

  if (!responses) return <p className="py-4 text-center text-[13px] text-[#002f5e]/70">Завантаження…</p>;
  if (responses.length === 0) return <p className="py-4 text-center text-[13px] text-[#002f5e]/70">Відповідей ще немає</p>;

  const counts = tally(responses);
  return (
    <div className="space-y-5 pt-2">
      <p className="text-[13px] font-medium text-[#002f5e]/70">Всього відповідей: {responses.length}</p>
      {poll.questions.map((q, qi) => {
        const qCounts = counts[q.id] ?? {};
        const total = Object.values(qCounts).reduce((s, n) => s + n, 0) || 1;
        return (
          <div key={q.id}>
            <p className="mb-2 text-[14px] font-semibold text-[#002f5e]">{qi + 1}. {q.text}</p>
            <div className="space-y-1.5">
              {q.options.map(opt => {
                const n = qCounts[opt.id] ?? 0;
                const pct = Math.round((n / total) * 100);
                return (
                  <div key={opt.id} className="flex items-center gap-3">
                    <div className="relative h-7 flex-1 overflow-hidden rounded-lg bg-[#002f5e]/6">
                      <div className="absolute inset-y-0 left-0 rounded-lg bg-[#df9b3b]/70" style={{ width: `${pct}%` }} />
                      <span className="absolute inset-y-0 left-3 flex items-center text-[12px] font-medium text-[#002f5e]">{opt.text}</span>
                    </div>
                    <span className="w-16 shrink-0 text-right text-[12px] font-semibold text-[#002f5e]/70">{n} · {pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const PollsAdmin = ({ showToast }: { showToast: (msg: string, ok?: boolean) => void }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [form, setForm] = useState<Poll | null>(null);
  const [saving, setSaving] = useState(false);
  const [resultsFor, setResultsFor] = useState<string | null>(null);

  useEffect(() => { loadPolls().then(setPolls); }, []);

  const patchQuestion = (qId: string, fn: (q: PollQuestion) => PollQuestion) =>
    setForm(f => f && ({ ...f, questions: f.questions.map(q => q.id === qId ? fn(q) : q) }));

  const moveQuestion = (idx: number, dir: -1 | 1) =>
    setForm(f => {
      if (!f) return f;
      const next = [...f.questions];
      const to = idx + dir;
      if (to < 0 || to >= next.length) return f;
      [next[idx], next[to]] = [next[to], next[idx]];
      return { ...f, questions: next };
    });

  const handleSave = async () => {
    if (!form || !form.title.trim()) { showToast("Вкажіть назву опитування", false); return; }
    const cleaned: Poll = {
      ...form,
      id: form.id || uid(),
      title: form.title.trim(),
      questions: form.questions
        .map(q => ({ ...q, text: q.text.trim(), options: q.options.map(o => ({ ...o, text: o.text.trim() })).filter(o => o.text) }))
        .filter(q => q.text && q.options.length >= 2),
    };
    if (cleaned.questions.length === 0) { showToast("Потрібне хоча б одне питання з двома варіантами", false); return; }
    setSaving(true);
    try {
      await upsertPoll(cleaned);
      setPolls(prev => {
        const idx = prev.findIndex(p => p.id === cleaned.id);
        return idx >= 0 ? prev.map(p => p.id === cleaned.id ? cleaned : p) : [cleaned, ...prev];
      });
      setForm(null);
      showToast("Опитування збережено");
    } catch { showToast("Помилка збереження", false); }
    finally { setSaving(false); }
  };

  const toggleActive = async (poll: Poll) => {
    const next = { ...poll, active: !poll.active };
    try {
      await upsertPoll(next);
      setPolls(prev => prev.map(p => p.id === poll.id ? next : p));
      showToast(next.active ? "Опитування активовано" : "Опитування вимкнено");
    } catch { showToast("Помилка", false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити опитування разом із відповідями?")) return;
    try {
      await deletePoll(id);
      setPolls(prev => prev.filter(p => p.id !== id));
      showToast("Видалено");
    } catch { showToast("Помилка", false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-odesa-medium text-[22px] text-[#002f5e]">Опитування</h2>
        <button onClick={() => setForm(emptyPoll())}
          className="flex items-center gap-2 rounded-xl bg-[#002f5e] px-4 py-2 text-[13px] font-medium text-[#fff2e8] transition hover:opacity-85">
          <Plus className="h-4 w-4" /> Нове опитування
        </button>
      </div>

      <p className="rounded-xl bg-[#df9b3b]/12 px-4 py-3 text-[13px] leading-relaxed text-[#002f5e]/70">
        Активне опитування показується відвідувачам на головній сторінці (плаваюча плашка праворуч).
        Якщо активних кілька — показується найновіше.
      </p>

      {form && (
        <div className="space-y-5 rounded-[20px] border border-[#002f5e]/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-odesa-medium text-[16px] text-[#002f5e]">{form.id ? "Редагування" : "Нове опитування"}</p>
            <button onClick={() => setForm(null)} className="text-[#002f5e]/70 hover:text-[#002f5e]"><X className="h-5 w-5" /></button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FieldGroup label="Назва (укр)">
              <Input value={form.title} onChange={v => setForm(f => f && ({ ...f, title: v }))} placeholder="Що вам найцікавіше на Одещині?" />
            </FieldGroup>
            <FieldGroup label="Назва (eng, опційно)">
              <Input value={form.titleEn ?? ""} onChange={v => setForm(f => f && ({ ...f, titleEn: v }))} placeholder="What interests you most?" />
            </FieldGroup>
          </div>

          <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] text-[#002f5e]/70">
            <input type="checkbox" checked={form.active}
              onChange={e => setForm(f => f && ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 rounded" />
            Активне (показувати на головній)
          </label>

          {/* ── Питання ── */}
          <div className="space-y-4">
            {form.questions.map((q, qi) => (
              <div key={q.id} className="space-y-3 rounded-[16px] border border-[#002f5e]/10 bg-[#fff9f2] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold uppercase tracking-wide text-[#002f5e]/70">Питання {qi + 1}</p>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveQuestion(qi, -1)} disabled={qi === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#002f5e]/70 hover:bg-[#002f5e]/8 disabled:opacity-25">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveQuestion(qi, 1)} disabled={qi === form.questions.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#002f5e]/70 hover:bg-[#002f5e]/8 disabled:opacity-25">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button type="button"
                      onClick={() => setForm(f => f && ({ ...f, questions: f.questions.filter(x => x.id !== q.id) }))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9f1f47]/50 hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <Input value={q.text} onChange={v => patchQuestion(q.id, x => ({ ...x, text: v }))} placeholder="Текст питання" />

                <div className="grid gap-3 md:grid-cols-2">
                  <MediaField label="Картинка (опційно)" value={q.imageUrl ?? ""}
                    onChange={v => patchQuestion(q.id, x => ({ ...x, imageUrl: v || undefined }))}
                    accept="image/*" isVideo={false} />
                  <MediaField label="Відео (опційно)" value={q.videoUrl ?? ""}
                    onChange={v => patchQuestion(q.id, x => ({ ...x, videoUrl: v || undefined }))}
                    accept="video/*" isVideo={true} />
                </div>

                <label className="flex w-fit cursor-pointer items-center gap-2 text-[13px] text-[#002f5e]/70">
                  <input type="checkbox" checked={Boolean(q.multiple)}
                    onChange={e => patchQuestion(q.id, x => ({ ...x, multiple: e.target.checked || undefined }))}
                    className="h-4 w-4 rounded" />
                  Кілька відповідей
                </label>

                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <span className="w-6 shrink-0 text-center text-[12px] text-[#002f5e]/70">{oi + 1}.</span>
                      <Input value={opt.text}
                        onChange={v => patchQuestion(q.id, x => ({ ...x, options: x.options.map(o => o.id === opt.id ? { ...o, text: v } : o) }))}
                        placeholder={`Варіант ${oi + 1}`} className="flex-1" />
                      <button type="button"
                        onClick={() => patchQuestion(q.id, x => ({ ...x, options: x.options.filter(o => o.id !== opt.id) }))}
                        disabled={q.options.length <= 2}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9f1f47]/50 hover:bg-[#9f1f47]/8 disabled:opacity-25">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => patchQuestion(q.id, x => ({ ...x, options: [...x.options, { id: uid(), text: "" }] }))}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[#002f5e]/70 hover:bg-[#002f5e]/6">
                    <Plus className="h-3.5 w-3.5" /> Додати варіант
                  </button>
                </div>
              </div>
            ))}

            <button type="button"
              onClick={() => setForm(f => f && ({ ...f, questions: [...f.questions, emptyQuestion()] }))}
              className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#002f5e]/25 py-3 text-[14px] font-medium text-[#002f5e]/70 transition hover:border-[#002f5e]/50 hover:text-[#002f5e]">
              <Plus className="h-4 w-4" /> Додати питання
            </button>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full rounded-xl bg-[#002f5e] py-3 text-[14px] font-medium text-[#fff2e8] transition hover:opacity-85 disabled:opacity-50">
            {saving ? "Збереження..." : "Зберегти опитування"}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {polls.map(poll => (
          <div key={poll.id} className="rounded-[16px] border border-[#002f5e]/8 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#002f5e]/8">
                <ListChecks className="h-5 w-5 text-[#002f5e]/70" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-[#002f5e]">{poll.title}</p>
                <p className="text-[12px] text-[#002f5e]/70">{poll.questions.length} питань</p>
              </div>
              <button onClick={() => toggleActive(poll)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  poll.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
                {poll.active ? "Активне" : "Вимкнене"}
              </button>
              <button onClick={() => setResultsFor(resultsFor === poll.id ? null : poll.id)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  resultsFor === poll.id ? "bg-[#df9b3b]/20 text-[#b9892f]" : "text-[#002f5e]/70 hover:bg-[#002f5e]/8 hover:text-[#002f5e]"
                }`}
                title="Результати">
                <BarChart3 className="h-4 w-4" />
              </button>
              <button onClick={() => { setForm(poll); setResultsFor(null); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#002f5e]/70 hover:bg-[#002f5e]/8 hover:text-[#002f5e]">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(poll.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9f1f47]/40 hover:bg-[#9f1f47]/8 hover:text-[#9f1f47]">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {resultsFor === poll.id && <ResultsPanel poll={poll} />}
          </div>
        ))}
        {polls.length === 0 && !form && (
          <p className="py-12 text-center text-[14px] text-[#002f5e]/70">Опитувань ще немає</p>
        )}
      </div>
    </div>
  );
};
