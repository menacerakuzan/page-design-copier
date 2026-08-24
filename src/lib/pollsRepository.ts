import { db } from "@/lib/apiClient";

export type PollOption = { id: string; text: string };

export type PollQuestion = {
  id: string;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  /** Дозволити кілька відповідей на це питання. */
  multiple?: boolean;
  options: PollOption[];
};

export type Poll = {
  id: string;
  title: string;
  titleEn?: string;
  active: boolean;
  questions: PollQuestion[];
  createdAt?: string;
};

/** { questionId: optionId | optionId[] } */
export type PollAnswers = Record<string, string | string[]>;

const mapRow = (row: any): Poll => ({
  id: row.id,
  title: row.title,
  titleEn: row.title_en ?? undefined,
  active: Boolean(row.active),
  questions: Array.isArray(row.questions) ? row.questions : [],
  createdAt: row.created_at ?? undefined,
});

const toRow = (poll: Poll) => ({
  id: poll.id,
  title: poll.title,
  title_en: poll.titleEn ?? null,
  active: poll.active,
  questions: poll.questions,
});

/** Активне опитування для віджета на головній (найновіше, якщо кілька). */
export async function loadActivePoll(): Promise<Poll | null> {
  const { data, error } = await db.from("polls").select("*")
    .eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

export async function loadPolls(): Promise<Poll[]> {
  const { data, error } = await db.from("polls").select("*").order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return (data ?? []).map(mapRow);
}

export async function upsertPoll(poll: Poll): Promise<void> {
  const { error } = await db.from("polls").upsert(toRow(poll));
  if (error) throw error;
}

export async function deletePoll(id: string): Promise<void> {
  const { error } = await db.from("polls").delete().eq("id", id);
  if (error) throw error;
}

export async function submitPollResponse(pollId: string, answers: PollAnswers): Promise<void> {
  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  const { error } = await db.from("poll_responses").insert({ id, poll_id: pollId, answers });
  if (error) throw error;
}

/** Всі відповіді опитування — для підрахунку результатів в адмінці. */
export async function loadPollResponses(pollId: string): Promise<PollAnswers[]> {
  const { data, error } = await db.from("poll_responses").select("answers").eq("poll_id", pollId);
  if (error) { console.error(error); return []; }
  return (data ?? []).map((r: any) => (r.answers && typeof r.answers === "object" ? r.answers : {}));
}
