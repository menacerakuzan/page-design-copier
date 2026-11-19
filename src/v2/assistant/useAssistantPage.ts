import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAssistantChats } from "@/lib/assistantChat";
import { useV2 } from "@/v2/i18n";

/**
 * Усе, що потрібно сторінці AI-гіда незалежно від вигляду: розмови (зберігаються
 * в localStorage — див. useAssistantChats), поле вводу, прокрутка стрічки,
 * питання з головної (/asystent?q=…). Вигляди лише малюють.
 */
export function useAssistantPage() {
  const { lang } = useV2();
  const chats = useAssistantChats();
  const { active, isStreaming, sendMessage, newChat } = chats;
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const messages = active?.messages ?? [];
  const isEmpty = messages.length === 0;
  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  // Прокрутка: поки чекаємо відповідь — донизу (видно «друкує…»); коли відповідь
  // прийшла — до її ПОЧАТКУ, щоб довгу відповідь читати згори, а не з кінця.
  const lastId = messages[messages.length - 1]?.id;
  const lastPending = messages[messages.length - 1]?.pending;
  useEffect(() => {
    const box = scrollRef.current;
    if (!box || typeof box.scrollTo !== "function") return;
    const last = messages[messages.length - 1];
    // Порожня розмова — нічого не гортаємо (інакше привітання відкривалось би прокрученим донизу).
    if (!last) return;
    if (last.role === "assistant" && !last.pending) {
      const el = box.querySelector<HTMLElement>(`[data-msg="${last.id}"]`);
      if (el && el.offsetHeight > box.clientHeight * 0.6) {
        box.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
        return;
      }
    }
    box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastId, lastPending, active?.id]);

  const autoGrow = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const submit = (text: string) => {
    const value = text.trim();
    if (!value || isStreaming) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    void sendMessage(value, lang);
  };

  // Питання з головної (/asystent?q=...): новий чат і одразу надсилаємо.
  // Спершу newChat(), а надсилання — на наступному рендері, коли активної
  // розмови вже немає (інакше питання дописалось би в попередній чат).
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  useEffect(() => {
    const q = searchParams.get("q")?.trim();
    if (!q) return;
    const p = new URLSearchParams(searchParams);
    p.delete("q");
    setSearchParams(p, { replace: true });
    newChat();
    setPendingQuery(q);
  }, [searchParams, setSearchParams, newChat]);
  useEffect(() => {
    if (pendingQuery && !active) {
      setPendingQuery(null);
      submit(pendingQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuery, active]);

  return { ...chats, input, setInput, autoGrow, submit, scrollRef, taRef, messages, isEmpty, lastAssistantId };
}

export type AssistantPageData = ReturnType<typeof useAssistantPage>;

/**
 * iOS: при фокусі на полі Safari прокручує всю сторінку вгору, щоб підняти поле
 * над клавіатурою, і після закриття клавіатури часто НЕ повертає прокрутку —
 * поле «зависає» вгорі. На blur повертаємо сторінку на місце.
 */
export function resetScroll() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
