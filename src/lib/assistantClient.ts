// Клієнт до /api/assistant: звичайний JSON запит/відповідь (без стрімінгу —
// надійно, без проблем із буферизацією SSE у dev-проксі/фаєрволах).

export type AssistantRole = "user" | "assistant";

export interface AssistantWireMessage {
  role: AssistantRole;
  content: string;
}

export type AssistantErrorCode = "rate_limited" | "request_failed" | "bad_response";

export class AssistantError extends Error {
  code: AssistantErrorCode;
  constructor(code: AssistantErrorCode) {
    super(code);
    this.name = "AssistantError";
    this.code = code;
  }
}

/**
 * Надсилає історію діалогу й повертає готовий текст відповіді асистента.
 * Кидає AssistantError із кодом при проблемах.
 */
export async function requestAssistant(
  body: { messages: AssistantWireMessage[]; lang: "uk" | "en" },
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (res.status === 429) throw new AssistantError("rate_limited");
  if (!res.ok) throw new AssistantError("request_failed");

  const data = (await res.json().catch(() => null)) as { reply?: unknown } | null;
  if (!data || typeof data.reply !== "string") throw new AssistantError("bad_response");
  return data.reply;
}
