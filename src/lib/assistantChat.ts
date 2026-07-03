// Стан і збереження чатів асистента. Без авторизації → розмови зберігаються у
// localStorage (за зразком basketContext). Запит до сервера — звичайний JSON
// (без стрімінгу): додаємо повідомлення користувача, показуємо «обдумування»,
// отримуємо готову відповідь.

import { useCallback, useEffect, useRef, useState } from "react";
import { requestAssistant, AssistantError, type AssistantWireMessage } from "@/lib/assistantClient";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  pending?: boolean; // асистент ще формує відповідь
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

const STORAGE_KEY = "assistant-chats-v1";

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c) => c && typeof c.id === "string" && Array.isArray(c.messages));
  } catch {
    return [];
  }
}

function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 42 ? `${clean.slice(0, 42)}…` : clean || "Новий чат";
}

export function useAssistantChats() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(() => {
    const list = loadConversations();
    return list.length ? list[0].id : null;
  });
  const [isStreaming, setIsStreaming] = useState(false); // запит у процесі

  const abortRef = useRef<AbortController | null>(null);
  const stateRef = useRef({ conversations, activeId });
  stateRef.current = { conversations, activeId };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      /* сховище недоступне — ігноруємо */
    }
  }, [conversations]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const patchConversation = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setActiveId(null); // порожній стан; розмова створиться при першому повідомленні
  }, []);

  const selectChat = useCallback((id: string) => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setActiveId(id);
  }, []);

  const deleteChat = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (text: string, lang: "uk" | "en") => {
      const content = text.trim();
      if (!content || isStreaming) return;

      // 1) Забезпечити активну розмову.
      let convId = stateRef.current.activeId;
      const existing = convId ? stateRef.current.conversations.find((c) => c.id === convId) : null;

      const userMsg: ChatMessage = { id: newId(), role: "user", content };
      const assistantMsg: ChatMessage = { id: newId(), role: "assistant", content: "", pending: true };

      if (!existing) {
        convId = newId();
        setConversations((prev) => [
          { id: convId, title: titleFrom(content), messages: [userMsg, assistantMsg], updatedAt: Date.now() },
          ...prev,
        ]);
        setActiveId(convId);
      } else {
        const nextTitle = existing.messages.some((m) => m.role === "user") ? existing.title : titleFrom(content);
        patchConversation(convId, (c) => ({
          ...c,
          title: nextTitle,
          messages: [...c.messages, userMsg, assistantMsg],
          updatedAt: Date.now(),
        }));
      }

      const id = convId;
      const updateAssistant = (fn: (m: ChatMessage) => ChatMessage) =>
        patchConversation(id, (c) => ({
          ...c,
          updatedAt: Date.now(),
          messages: c.messages.map((m) => (m.id === assistantMsg.id ? fn(m) : m)),
        }));

      // 2) Історія для сервера (без порожнього плейсхолдера).
      const wire: AssistantWireMessage[] = [
        ...(existing ? existing.messages : [])
          .filter((m) => m.content && !m.error)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content },
      ];

      // 3) Запит.
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      try {
        const reply = await requestAssistant({ messages: wire, lang }, controller.signal);
        updateAssistant((m) => ({ ...m, content: reply, pending: false }));
      } catch (err) {
        if (controller.signal.aborted) {
          // Користувач зупинив — просто прибираємо «друкує».
          updateAssistant((m) => ({ ...m, pending: false }));
        } else {
          const code = err instanceof AssistantError ? err.code : "request_failed";
          const message =
            code === "rate_limited"
              ? lang === "en"
                ? "Too many requests — please try again in a minute. 🙏"
                : "Забагато запитів — спробуйте за хвилину. 🙏"
              : lang === "en"
                ? "Couldn't reach the assistant. Make sure the assistant service is running. 😔"
                : "Не вдалося звʼязатися з асистентом. Переконайтеся, що сервіс асистента запущено. 😔";
          updateAssistant((m) => ({ ...m, pending: false, error: true, content: message }));
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, patchConversation],
  );

  return {
    conversations,
    active,
    activeId,
    // status лишаємо для сумісності з UI (без стрімінгу статусів немає)
    status: null as string | null,
    isStreaming,
    newChat,
    selectChat,
    deleteChat,
    sendMessage,
    stop,
  };
}
