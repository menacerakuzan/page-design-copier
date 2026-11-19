import { useState, type ReactNode } from "react";
import { ArrowUp, Baby, Bird, Castle, History, MessageCircle, Plus, Sparkles, Square, Trash2, Umbrella, Wine, type LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useV2 } from "@/v2/i18n";
import { resetScroll, type AssistantPageData } from "./useAssistantPage";
import { Answer, AnswerError, Typing } from "./messages";

/* ── Значок AI-гіда ───────────────────────────────────────────────────── */

/** Кружок із зірочкою — як на картці AI-гіда на головній (сонячний з винною зіркою). */
export function Spark({ className = "h-8 w-8", icon = "h-4 w-4" }: { className?: string; icon?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-o-sun text-o-winedeep ${className}`} aria-hidden="true">
      <Sparkles className={icon} />
    </span>
  );
}

/* ── Стартові питання ─────────────────────────────────────────────────── */

/** Ті самі підказки, що й на головній (chips), — зі значками за темою. */
const PROMPT_ICONS: LucideIcon[] = [Umbrella, Wine, Castle, Baby, Bird];
export function usePrompts() {
  const { list } = useV2();
  return list("chips").map((q, i) => ({ q, Icon: PROMPT_ICONS[i % PROMPT_ICONS.length] }));
}

/* ── Поле вводу ───────────────────────────────────────────────────────── */

export function Composer({ data, className = "" }: { data: AssistantPageData; className?: string }) {
  const { t } = useV2();
  const { input, setInput, autoGrow, submit, taRef, isStreaming, stop } = data;
  return (
    <div className={`flex items-end gap-2 rounded-[26px] bg-[#fffaf5] p-1.5 pl-5 text-o-sea shadow-[0_16px_36px_-24px_rgba(0,10,30,0.55)] ring-1 ring-o-sea/[0.12] transition-shadow focus-within:ring-2 focus-within:ring-o-wine/40 ${className}`}>
      {/* Мітка лише для читачів екрана — видимий підпис дублював би плейсхолдер. */}
      <label htmlFor="assistant-input" className="sr-only">
        {t("asInput")}
      </label>
      <textarea
        id="assistant-input"
        ref={taRef}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          autoGrow();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit(input);
          }
        }}
        onBlur={resetScroll}
        rows={1}
        placeholder={t("asInput")}
        className="max-h-[140px] min-h-[44px] flex-1 resize-none bg-transparent py-[11px] text-[16px] leading-[22px] outline-none placeholder:text-o-sea/45 focus-visible:outline-none"
      />
      {isStreaming ? (
        <button
          type="button"
          // preventDefault на mousedown — щоб тап не «крав» фокус у поля (інакше перший тап лише ховає клавіатуру).
          onMouseDown={(e) => e.preventDefault()}
          onClick={stop}
          aria-label={t("asStop")}
          title={t("asStop")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-o-sea text-o-sand transition-colors hover:bg-o-deep"
        >
          <Square className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => submit(input)}
          disabled={!input.trim()}
          aria-label={t("asSend")}
          title={t("asSend")}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-o-wine text-o-sand transition-[background-color,opacity] hover:bg-o-winedeep disabled:opacity-35"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Дрібний підпис під полем: AI може помилятися. */
export function Note({ className = "" }: { className?: string }) {
  const { t } = useV2();
  return <p className={`text-center text-[11.5px] leading-snug text-o-sea/45 ${className}`}>{t("asNote")}</p>;
}

/* ── Стрічка повідомлень ──────────────────────────────────────────────── */

/**
 * Питання — винні бульбашки праворуч; відповіді — без бульбашки, як текст,
 * поруч сонячна зірочка AI-гіда. data-msg — щоб прокрутити до початку відповіді.
 */
export function Messages({ data }: { data: AssistantPageData }) {
  const { t } = useV2();
  const { messages, lastAssistantId, isStreaming, submit } = data;
  return (
    <ol className="flex flex-col gap-7">
      {messages.map((m) => {
        if (m.role === "user") {
          return (
            <li key={m.id} data-msg={m.id} className="max-w-[85%] self-end whitespace-pre-wrap rounded-[22px] rounded-br-md bg-o-wine px-4 py-2.5 text-[15.5px] leading-[1.45] text-o-sand">
              {m.content}
            </li>
          );
        }
        return (
          <li key={m.id} data-msg={m.id} className="flex max-w-full items-start gap-3 self-start">
            <Spark className="h-8 w-8" />
            <div className="min-w-0 flex-1 pt-1">
              {m.pending && !m.content ? (
                <Typing label={t("asThinking")} />
              ) : m.error ? (
                <AnswerError content={m.content} />
              ) : (
                <Answer content={m.content} onPick={submit} interactive={m.id === lastAssistantId && !isStreaming} />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Історія розмов ───────────────────────────────────────────────────── */

function useWhen() {
  const { lang } = useV2();
  const loc = lang === "en" ? "en-GB" : "uk-UA";
  return (ts: number) => {
    const d = new Date(ts);
    const today = new Date().toDateString() === d.toDateString();
    return today
      ? d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString(loc, { day: "numeric", month: "short" });
  };
}

/** Список розмов: назва (перше питання) і коли; кошик — видалити. */
function HistoryList({ data, onPicked }: { data: AssistantPageData; onPicked?: () => void }) {
  const { t } = useV2();
  const when = useWhen();
  const { conversations, active, selectChat, deleteChat } = data;
  if (!conversations.length) {
    return (
      <p className="flex flex-col items-center gap-3 px-4 py-10 text-center text-[14px] leading-snug text-o-sea/55">
        <MessageCircle className="h-6 w-6 text-o-wine/50" aria-hidden="true" />
        {t("asNoHistory")}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1">
      {conversations.map((c) => {
        const on = c.id === active?.id;
        return (
          <li key={c.id} className="group relative">
            <button
              type="button"
              onClick={() => {
                selectChat(c.id);
                onPicked?.();
              }}
              aria-current={on || undefined}
              className={`flex w-full flex-col rounded-[14px] py-2.5 pl-3.5 pr-11 text-left transition-colors ${on ? "bg-o-wine text-o-sand" : "hover:bg-o-sea/[0.05]"}`}
            >
              <span className="truncate text-[14.5px] font-semibold leading-tight">{c.title}</span>
              <span className={`mt-0.5 text-[12px] ${on ? "text-o-sand/65" : "text-o-sea/45"}`}>{when(c.updatedAt)}</span>
            </button>
            <button
              type="button"
              onClick={() => deleteChat(c.id)}
              aria-label={`${t("asDelete")}: ${c.title}`}
              title={t("asDelete")}
              className={`absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition-[opacity,background-color] [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100 ${on ? "text-o-sand/80 hover:bg-o-sand/15" : "text-o-sea/45 hover:bg-o-wine/10 hover:text-o-wine"}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Висувна панель з розмовами. */
function HistoryDrawer({ data, open, onOpenChange }: { data: AssistantPageData; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useV2();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="v2 flex w-[86vw] max-w-[360px] flex-col gap-0 border-o-sea/10 bg-o-sand p-0 text-o-sea [&>button:last-child]:right-5 [&>button:last-child]:top-6">
        <div className="px-5 pb-3 pt-5">
          <Kicker className="text-[11.5px]">{t("asKicker")}</Kicker>
          <SheetTitle className="mt-1.5 text-[26px] font-bold leading-none tracking-[-0.02em] text-o-sea">{t("asHistory")}</SheetTitle>
          <SheetDescription className="sr-only">{t("asNoHistory")}</SheetDescription>
          <button
            type="button"
            onClick={() => {
              data.newChat();
              onOpenChange(false);
            }}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-o-wine px-5 text-[14.5px] font-semibold text-o-sand transition-colors hover:bg-o-winedeep"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("asNew")}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(24px+env(safe-area-inset-bottom))]">
          <HistoryList data={data} onPicked={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Кнопки «Розмови» (висувна панель) і «Нова розмова» над стрічкою. */
export function ChatTools({ data, className = "" }: { data: AssistantPageData; className?: string }) {
  const { t } = useV2();
  const [open, setOpen] = useState(false);
  const btn = "text-o-sea ring-o-sea/15 hover:text-o-wine hover:ring-o-wine/40";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button type="button" onClick={() => setOpen(true)} className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-semibold ring-1 transition-colors ${btn}`}>
        <History className="h-4 w-4" aria-hidden="true" />
        {t("asHistory")}
        {data.conversations.length > 0 && <span className="text-[12px] opacity-55">{data.conversations.length}</span>}
      </button>
      {!data.isEmpty && (
        <button type="button" onClick={data.newChat} aria-label={t("asNew")} title={t("asNew")} className={`flex h-9 w-9 items-center justify-center rounded-full ring-1 transition-colors ${btn}`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      <HistoryDrawer data={data} open={open} onOpenChange={setOpen} />
    </div>
  );
}

/* ── Фон «Сузір'я» ────────────────────────────────────────────────────── */

const STAR = "M0-10c.6 5.4 4 8.8 10 10-6 1.2-9.4 4.6-10 10-.6-5.4-4-8.8-10-10 6-1.2 9.4-4.6 10-10z";

/** Одне сузір'я: зірочки-«іскри» AI-гіда, з'єднані пунктиром, і дрібні крапки. */
function Constellation({ pts, dots, className }: { pts: [number, number, number][]; dots: [number, number][]; className: string }) {
  return (
    <svg viewBox="0 0 240 420" className={className} aria-hidden="true">
      <polyline points={pts.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke="rgba(159,31,71,0.35)" strokeWidth="1.4" strokeDasharray="1 7" strokeLinecap="round" />
      {pts.map(([x, y, s], i) => (
        <path key={i} d={STAR} transform={`translate(${x} ${y}) scale(${s})`} fill={i === 1 ? "#df9b3b" : "rgba(0,47,94,0.22)"} />
      ))}
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill="rgba(0,47,94,0.22)" />
      ))}
    </svg>
  );
}

/**
 * Фон сторінки AI-гіда: два ледь помітні сузір'я з іскор у полях ліворуч і
 * праворуч від розмови (тема — «зірочка» AI-гіда). Лише від lg, де поля є.
 */
export function ConstellationBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block" aria-hidden="true">
      <Constellation
        className="float-soft absolute left-[3%] top-[22%] w-[200px] opacity-70 xl:left-[6%]"
        pts={[[40, 40, 0.9], [130, 110, 1.5], [90, 220, 0.8], [180, 300, 1.1], [70, 380, 0.7]]}
        dots={[[200, 60], [20, 160], [150, 200], [30, 300], [200, 400]]}
      />
      <Constellation
        className="float-soft absolute right-[3%] top-[34%] w-[190px] opacity-70 [animation-delay:-3s] xl:right-[6%]"
        pts={[[190, 30, 0.8], [110, 120, 1.2], [160, 240, 1.6], [60, 290, 0.8], [120, 390, 1]]}
        dots={[[40, 50], [210, 150], [30, 200], [200, 340], [40, 380]]}
      />
    </div>
  );
}

/** Невеликий надпис над заголовком: риска + КІКЕР (як SectionHead). */
export function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine ${className}`}>
      <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
      {children}
    </p>
  );
}
