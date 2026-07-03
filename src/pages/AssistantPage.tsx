import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Sparkles, Plus, History, Send, Square, Trash2, MessageSquareText } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLang } from "@/lib/langContext";
import { useAssistantChats } from "@/lib/assistantChat";
import { MessageContent } from "@/components/assistant/MessageContent";
import { QuickReplies } from "@/components/assistant/QuickReplies";
import { ThinkingIndicator } from "@/components/assistant/ThinkingIndicator";

const GOLD = "#df9b3b";

const AssistantAvatar = ({ size = 40 }: { size?: number }) => (
  <span
    className="flex shrink-0 items-center justify-center rounded-full text-[#fff2e8]"
    style={{ width: size, height: size, background: "#002f5e" }}
  >
    <Sparkles style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.1} />
  </span>
);

export default function AssistantPage() {
  const { t, lang } = useLang();
  const {
    conversations,
    active,
    status,
    isStreaming,
    newChat,
    selectChat,
    deleteChat,
    sendMessage,
    stop,
  } = useAssistantChats();

  const [input, setInput] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const messages = active?.messages ?? [];
  const isEmpty = messages.length === 0;
  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  // html/body мають глобально темний фон (#001a3d) — Safari бере його для
  // кольору системних панелей/овербаунсу (див. коментар в index.css). Ця
  // сторінка кремова, тож на час її показу підміняємо колір. useLayoutEffect
  // (не useEffect) — щоб застосувати ДО першого пофарбування кадру: це SPA-
  // навігація без перезавантаження сторінки, і Safari фіксує колір панелей
  // рано, тож пізня зміна може не встигнути.
  useLayoutEffect(() => {
    const html = document.documentElement;
    const prevHtmlBg = html.style.backgroundColor;
    const prevBodyBg = document.body.style.backgroundColor;
    html.style.backgroundColor = "#fff2e8";
    document.body.style.backgroundColor = "#fff2e8";
    return () => {
      html.style.backgroundColor = prevHtmlBg;
      document.body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  // Автоскрол донизу під час стріму / нових повідомлень.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && typeof el.scrollTo === "function") el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

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

  // iOS: при фокусі на полі Safari прокручує всю сторінку вгору, щоб підняти
  // поле над клавіатурою, і після закриття клавіатури часто НЕ повертає
  // прокрутку — поле «зависає» вгорі. На blur (надсилання / тап убік)
  // примусово повертаємо сторінку на місце. Мінімальний фікс без зміни макета.
  const resetScroll = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const examples = [t("assistantEx1"), t("assistantEx2"), t("assistantEx3")];

  return (
    <div className="relative flex h-[100dvh] flex-col bg-[#fff2e8]">
      {/* Явні «заливки» безпечних зон — гарантують, що смужка під нотчем/home
          indicator завжди кремова, незалежно від того, чи Safari встиг
          підхопити зміну html/body фону після SPA-навігації. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-20 bg-[#fff2e8]"
        style={{ height: "env(safe-area-inset-top)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-[#fff2e8]"
        style={{ height: "env(safe-area-inset-bottom)" }}
      />

      {/* фоновий патерн */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ backgroundImage: "url(/beigepattern.svg)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.1 }}
      />

      {/* ── Хедер ─────────────────────────────────────────────── */}
      <header className="relative z-10 flex shrink-0 items-center gap-3 border-b border-[#002f5e]/10 bg-[#fff2e8]/85 px-3 pb-3 backdrop-blur-md" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <Link
          to="/"
          aria-label={t("backHome")}
          className="tap flex h-9 w-9 items-center justify-center rounded-full text-[#002f5e] transition-colors hover:bg-[#002f5e]/5"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>

        <AssistantAvatar size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] leading-tight text-[#002f5e] font-odesa-bold">{t("assistantName")}</p>
          <p className="truncate text-[12px] leading-tight text-[#002f5e]/55 font-odesa-regular">{t("assistantTagline")}</p>
        </div>

        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label={t("assistantHistory")}
              className="tap flex h-9 w-9 items-center justify-center rounded-full text-[#002f5e] transition-colors hover:bg-[#002f5e]/5"
            >
              <History className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[86vw] max-w-[360px] border-[#002f5e]/10 bg-[#fff2e8] p-0 text-[#002f5e]">
            <SheetHeader className="px-5 pb-2 pt-5 text-left">
              <SheetTitle className="text-[20px] text-[#002f5e] font-odesa-bold">{t("assistantHistory")}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => {
                  newChat();
                  setHistoryOpen(false);
                }}
                className="tap mb-3 flex w-full items-center gap-2 rounded-2xl bg-[#002f5e] px-4 py-3 text-[15px] text-[#fff2e8] font-odesa-medium"
              >
                <Plus className="h-4 w-4" /> {t("assistantNewChat")}
              </button>

              {conversations.length === 0 ? (
                <p className="px-1 py-6 text-center text-[14px] text-[#002f5e]/45 font-odesa-regular">
                  {t("assistantNoHistory")}
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {conversations.map((c) => (
                    <li key={c.id} className="group flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          selectChat(c.id);
                          setHistoryOpen(false);
                        }}
                        className={`tap flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-left text-[14px] font-odesa-medium transition-colors ${
                          c.id === active?.id ? "bg-[#002f5e] text-[#fff2e8]" : "bg-[#002f5e]/5 hover:bg-[#002f5e]/10"
                        }`}
                      >
                        <MessageSquareText className="h-4 w-4 shrink-0 opacity-60" />
                        <span className="truncate">{c.title}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={t("assistantDelete")}
                        onClick={() => deleteChat(c.id)}
                        className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#9f1f47]/70 transition-colors hover:bg-[#9f1f47]/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <button
          type="button"
          aria-label={t("assistantNewChat")}
          onClick={newChat}
          className="tap flex h-9 w-9 items-center justify-center rounded-full bg-[#002f5e]/5 text-[#002f5e] transition-colors hover:bg-[#002f5e]/10"
        >
          <Plus className="h-5 w-5" />
        </button>
      </header>

      {/* ── Стрічка повідомлень ───────────────────────────────── */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
        {isEmpty ? (
          <div className="mx-auto flex h-full max-w-[520px] flex-col items-center justify-center text-center">
            <AssistantAvatar size={72} />
            <h1 className="mt-5 text-[24px] leading-tight text-[#002f5e] font-odesa-bold">{t("assistantGreeting")}</h1>
            <p className="mt-2 max-w-[420px] text-[15px] leading-[1.5] text-[#002f5e]/60 font-odesa-regular">
              {t("assistantGreetingDesc")}
            </p>
            <div className="mt-6 w-full">
              <QuickReplies options={examples} onPick={submit} disabled={isStreaming} />
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-[640px] flex-col gap-3">
            {messages.map((m) => {
              if (m.role === "user") {
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-[85%] self-end rounded-[18px] rounded-tr-md bg-[#002f5e] px-4 py-2.5 text-[15px] leading-[1.4] text-[#fff2e8] font-odesa-regular"
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </motion.div>
                );
              }
              // асистент
              const thinking = m.pending && !m.content;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex max-w-[92%] items-start gap-2 self-start"
                >
                  <AssistantAvatar size={30} />
                  <div className="min-w-0 flex-1">
                    {thinking ? (
                      <ThinkingIndicator label={status} />
                    ) : (
                      <div className="rounded-[18px] rounded-tl-md bg-white px-4 py-3 shadow-[0_10px_26px_-22px_rgba(0,47,94,0.45)]">
                        <MessageContent
                          content={m.content}
                          onQuickReply={submit}
                          interactive={m.id === lastAssistantId && !isStreaming}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Поле вводу ────────────────────────────────────────── */}
      <div
        className="relative z-10 shrink-0 border-t border-[#002f5e]/10 bg-[#fff2e8]/90 px-3 pt-2.5 backdrop-blur-md"
        style={{ paddingBottom: "calc(84px + env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-[640px] items-end gap-2 rounded-[24px] border border-[#002f5e]/12 bg-white p-1.5 pl-4 shadow-[0_10px_26px_-20px_rgba(0,47,94,0.4)]">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoGrow();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            onBlur={resetScroll}
            rows={1}
            placeholder={t("assistantInput")}
            className="max-h-[140px] flex-1 resize-none bg-transparent py-2 text-[16px] text-[#002f5e] outline-none font-odesa-regular placeholder:text-[#002f5e]/40"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={stop}
              aria-label={t("assistantStop")}
              className="tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9f1f47] text-[#fff2e8]"
            >
              <Square className="h-4 w-4" fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => submit(input)}
              disabled={!input.trim()}
              aria-label={t("assistantSend")}
              className="tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#002f5e] transition-colors disabled:opacity-35"
              style={{ background: GOLD }}
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
