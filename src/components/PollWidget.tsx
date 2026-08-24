import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, Heart, ListChecks, X } from "lucide-react";
import { Img } from "@/components/Img";
import { CompassRose, WaveLines } from "@/components/decor";
import { useLang } from "@/lib/langContext";
import {
  loadActivePoll, submitPollResponse,
  type Poll, type PollAnswers, type PollQuestion,
} from "@/lib/pollsRepository";

const GOLD = "#df9b3b";
const WINE = "#9f1f47";

// Бордо → глибокий винний → navy: фірмовий градієнт віджета
const CARD_BG = "linear-gradient(150deg, #9f1f47 0%, #5e1030 48%, #002f5e 100%)";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const rise = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

// Праворуч по центру, але нижче за стрілки прокрутки на головній
// (fixed right-8 top-1/2 z-50 у Index.tsx) — фіксований відступ у px, а не
// відсоток, тримає віджет під стрілками на будь-якій висоті екрана.
const WIDGET_POS = { top: "calc(50% + 96px)" };

/**
 * Віджет опитування на головній.
 *
 * Постійний елемент — «медальйон»: кругла кнопка з пульсуючими кільцями
 * праворуч по центру екрана. Кнопка лишається на сайті завжди, навіть після
 * проходження опитування (клік по ній тоді просто показує картку подяки) —
 * інакше немає способу побачити/відкрити опитування вдруге.
 * Стани в localStorage: poll-done-{id} (вже відповів — форма більше не
 * відкривається, лише подяка), poll-teaser-{id} (тизер уже показували раз
 * автоматично — далі тільки медальйон, без нав'язливості).
 */
export function PollWidget() {
  const { lang, tl } = useLang();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [done, setDone] = useState(false);
  const [stage, setStage] = useState<"hidden" | "fab" | "teaser" | "open" | "thanks">("hidden");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PollAnswers>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    void loadActivePoll().then((p) => {
      if (cancelled || !p || p.questions.length === 0) return;
      let isDone = false;
      let teaserSeen = false;
      try {
        isDone = Boolean(localStorage.getItem(`poll-done-${p.id}`));
        teaserSeen = Boolean(localStorage.getItem(`poll-teaser-${p.id}`));
      } catch { /* сховище недоступне */ }
      setPoll(p);
      setDone(isDone);
      timers.push(window.setTimeout(() => setStage((s) => (s === "hidden" ? "fab" : s)), 1500));
      if (!isDone && !teaserSeen) {
        timers.push(window.setTimeout(() => setStage((s) => (s === "fab" ? "teaser" : s)), 5500));
      }
    });
    return () => { cancelled = true; timers.forEach(window.clearTimeout); };
  }, []);

  // Блокуємо скрол сторінки, поки відкрита форма; Escape — згорнути
  useEffect(() => {
    if (stage !== "open") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") collapse(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  if (!poll) return null;

  const remember = (key: string) => {
    try { localStorage.setItem(key, "1"); } catch { /* ignore */ }
  };

  /** Тизер/форма → назад у медальйон (НЕ ховаємо: кнопка лишається). */
  const collapse = () => {
    remember(`poll-teaser-${poll.id}`);
    setStage("fab");
  };

  const question: PollQuestion | undefined = poll.questions[step];
  const isLast = step === poll.questions.length - 1;
  const selected = question ? answers[question.id] : undefined;
  const hasSelection = Array.isArray(selected) ? selected.length > 0 : Boolean(selected);

  const pick = (optionId: string) => {
    if (!question) return;
    if (question.multiple) {
      setAnswers((prev) => {
        const cur = Array.isArray(prev[question.id]) ? (prev[question.id] as string[]) : [];
        const next = cur.includes(optionId) ? cur.filter((x) => x !== optionId) : [...cur, optionId];
        return { ...prev, [question.id]: next };
      });
    } else {
      setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
    }
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitPollResponse(poll.id, answers);
    } catch { /* не блокуємо подяку через збій мережі */ }
    remember(`poll-done-${poll.id}`);
    setDone(true);
    setStage("thanks");
    window.setTimeout(() => setStage("fab"), 3800);
  };

  /** Клік по медальйону: вже відповідав → просто подяка, інакше — тизер. */
  const openFromFab = () => setStage(done ? "thanks" : "teaser");

  const isPicked = (optionId: string) =>
    Array.isArray(selected) ? selected.includes(optionId) : selected === optionId;

  return (
    <>
      {/* ── Медальйон: постійна кнопка праворуч по центру ────────────── */}
      <AnimatePresence>
        {stage === "fab" && (
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: -120 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            style={WIDGET_POS}
            className="fixed right-3 z-40 -translate-y-1/2 md:right-5"
          >
            {/* пульсуючі кільця-«хвилі» */}
            {[0, 1].map((i) => (
              <motion.span
                key={i}
                aria-hidden
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: `${GOLD}55` }}
                animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, delay: i * 1.2, ease: "easeOut" }}
              />
            ))}
            <motion.button
              type="button"
              onClick={openFromFab}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              aria-label={lang === "en" ? "Open poll" : "Відкрити опитування"}
              className="tap relative flex h-14 w-14 items-center justify-center rounded-full border text-[#fff2e8]"
              style={{
                background: CARD_BG,
                borderColor: `${GOLD}66`,
                boxShadow: `0 14px 34px -10px ${WINE}bb, 0 0 0 4px rgba(255,242,232,0.06)`,
              }}
            >
              <ListChecks className="h-6 w-6" style={{ color: GOLD }} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Тизер: розгортається з медальйона ────────────────────────── */}
      <AnimatePresence>
        {stage === "teaser" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.45, x: 46 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.5, x: 46, transition: { duration: 0.22 } }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            style={{ ...WIDGET_POS, transformOrigin: "right center" }}
            className="fixed right-3 z-40 -translate-y-1/2 md:right-5"
          >
            <div
              className="relative w-[264px] overflow-hidden rounded-tl-[44px] rounded-tr-[16px] rounded-br-[44px] rounded-bl-[20px] border p-6 text-[#fff2e8]"
              style={{
                background: CARD_BG,
                borderColor: `${GOLD}4d`,
                boxShadow: `0 30px 70px -18px ${WINE}b3, 0 0 0 1px rgba(255,242,232,0.05)`,
              }}
            >
              {/* фірмовий патерн + роза вітрів + сяйва */}
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{ backgroundImage: "url(/assistantpattern.svg)", backgroundSize: "150px 150px", backgroundRepeat: "repeat" }} />
              <CompassRose className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 text-[#fff2e8]/8" />
              <div aria-hidden className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-[#df9b3b]/25 blur-3xl" />

              <button
                type="button"
                onClick={collapse}
                aria-label={lang === "en" ? "Minimise" : "Згорнути"}
                className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[#fff2e8]/70 transition hover:bg-white/20 hover:text-[#fff2e8]"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <motion.div variants={stagger} initial="hidden" animate="show" className="relative">
                <motion.span
                  variants={rise}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: GOLD, boxShadow: `0 10px 24px -8px ${GOLD}cc` }}
                >
                  <ListChecks className="h-5 w-5 text-[#002f5e]" />
                </motion.span>

                <motion.p variants={rise} className="mt-3.5 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-odesa-medium" style={{ color: GOLD }}>
                  <span aria-hidden>✦</span> {lang === "en" ? "Quick poll" : "Опитування"}
                </motion.p>

                <motion.p variants={rise} className="mt-2 break-words pr-2 text-[19px] leading-[1.18] font-odesa-bold">
                  {tl(poll.title, poll.titleEn ?? null)}
                </motion.p>

                <motion.div variants={rise}>
                  <WaveLines className="mt-3 h-4 w-16 text-[#df9b3b]/60" />
                </motion.div>

                <motion.button
                  variants={rise}
                  type="button"
                  onClick={() => setStage("open")}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="tap mt-4 w-full rounded-full py-3 text-[14px] font-odesa-semi text-[#002f5e]"
                  style={{ backgroundColor: GOLD, boxShadow: "0 12px 30px -10px rgba(223,155,59,0.85)" }}
                >
                  {lang === "en" ? "Take part" : "Пройти"} · {poll.questions.length} {lang === "en" ? "q." : "пит."}
                </motion.button>

                <motion.p variants={rise} className="mt-2.5 text-center text-[11px] text-[#fff2e8]/60 font-odesa-regular">
                  {lang === "en" ? "Under a minute" : "Менше хвилини"}
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Форма опитування ─────────────────────────────────────────── */}
      <AnimatePresence>
        {stage === "open" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#001a3d]/70 p-4 backdrop-blur-sm"
            onClick={collapse}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 26, rotate: -1.5 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[86vh] w-full max-w-[520px] overflow-y-auto overflow-x-hidden rounded-tl-[44px] rounded-tr-[18px] rounded-br-[44px] rounded-bl-[22px] border p-6 text-[#fff2e8] md:p-8"
              style={{
                background: CARD_BG,
                borderColor: `${GOLD}40`,
                boxShadow: `0 40px 90px -24px rgba(0,0,0,0.75), 0 0 60px -20px ${WINE}88`,
              }}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{ backgroundImage: "url(/assistantpattern.svg)", backgroundSize: "180px 180px", backgroundRepeat: "repeat" }} />
              <CompassRose className="pointer-events-none absolute -bottom-10 -right-10 h-44 w-44 text-[#fff2e8]/6" />
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#df9b3b]/18 blur-3xl" />

              <button
                type="button"
                onClick={collapse}
                aria-label={lang === "en" ? "Close" : "Закрити"}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#fff2e8]/70 transition hover:bg-white/20 hover:text-[#fff2e8]"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative">
                <p className="flex items-center gap-2 pr-10 text-[11px] uppercase tracking-[0.22em] font-odesa-medium" style={{ color: GOLD }}>
                  <span aria-hidden>✦</span> {tl(poll.title, poll.titleEn ?? null)}
                </p>

                {/* прогрес */}
                <div className="mt-3.5 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/12">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${GOLD}, #f4c878)` }}
                      animate={{ width: `${((step + 1) / poll.questions.length) * 100}%` }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="shrink-0 text-[12px] text-[#fff2e8]/55 font-odesa-medium">
                    {step + 1} / {poll.questions.length}
                  </span>
                </div>

                {question && (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-5"
                    >
                      <h3 className="break-words text-[22px] leading-[1.15] font-odesa-bold md:text-[26px]">{question.text}</h3>

                      {question.imageUrl && (
                        <div className="mt-4 overflow-hidden rounded-tl-[26px] rounded-tr-[12px] rounded-br-[26px] rounded-bl-[12px]">
                          <Img w={900} src={question.imageUrl} alt="" className="max-h-[220px] w-full object-cover" />
                        </div>
                      )}
                      {question.videoUrl && (
                        <div className="mt-4 overflow-hidden rounded-tl-[26px] rounded-tr-[12px] rounded-br-[26px] rounded-bl-[12px]">
                          <video src={question.videoUrl} controls playsInline preload="metadata" className="max-h-[260px] w-full bg-black/40 object-contain" />
                        </div>
                      )}

                      {question.multiple && (
                        <p className="mt-3 text-[12px] text-[#fff2e8]/60 font-odesa-regular">
                          {lang === "en" ? "Choose one or more" : "Можна обрати кілька варіантів"}
                        </p>
                      )}

                      <motion.div variants={stagger} initial="hidden" animate="show" className="mt-4 flex flex-col gap-2.5">
                        {question.options.map((opt) => {
                          const picked = isPicked(opt.id);
                          return (
                            <motion.button
                              key={opt.id}
                              variants={rise}
                              type="button"
                              onClick={() => pick(opt.id)}
                              whileHover={{ x: picked ? 0 : 5 }}
                              whileTap={{ scale: 0.98 }}
                              className="tap flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-[15px] font-odesa-medium transition-colors duration-200"
                              style={picked
                                ? { backgroundColor: GOLD, borderColor: GOLD, color: "#002f5e", boxShadow: "0 12px 28px -12px rgba(223,155,59,0.85)" }
                                : { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,242,232,0.18)", color: "#fff2e8" }}
                            >
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                                style={{ borderColor: picked ? "#002f5e" : "rgba(255,242,232,0.35)" }}
                              >
                                {picked && <Check className="h-3 w-3" strokeWidth={3} />}
                              </span>
                              <span className="break-words">{opt.text}</span>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* навігація */}
                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="tap flex items-center gap-1 rounded-full px-4 py-2 text-[13px] text-[#fff2e8]/60 transition hover:bg-white/8 hover:text-[#fff2e8] disabled:invisible font-odesa-medium"
                  >
                    <ChevronLeft className="h-4 w-4" /> {lang === "en" ? "Back" : "Назад"}
                  </button>
                  {isLast ? (
                    <motion.button
                      type="button"
                      onClick={submit}
                      disabled={!hasSelection || submitting}
                      whileHover={{ scale: hasSelection ? 1.04 : 1 }}
                      whileTap={{ scale: 0.96 }}
                      className="tap rounded-full px-7 py-2.5 text-[14px] font-odesa-semi text-[#002f5e] disabled:opacity-35"
                      style={{ backgroundColor: GOLD, boxShadow: "0 12px 28px -12px rgba(223,155,59,0.8)" }}
                    >
                      {submitting ? "…" : lang === "en" ? "Submit" : "Надіслати"}
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={() => setStep((s) => s + 1)}
                      disabled={!hasSelection}
                      whileHover={{ scale: hasSelection ? 1.04 : 1 }}
                      whileTap={{ scale: 0.96 }}
                      className="tap rounded-full px-7 py-2.5 text-[14px] font-odesa-semi text-[#002f5e] disabled:opacity-35"
                      style={{ backgroundColor: GOLD, boxShadow: "0 12px 28px -12px rgba(223,155,59,0.8)" }}
                    >
                      {lang === "en" ? "Next" : "Далі"}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Подяка ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {stage === "thanks" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-[#001a3d]/70 p-4 backdrop-blur-sm"
            onClick={() => setStage("fab")}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[380px] overflow-hidden rounded-tl-[44px] rounded-tr-[18px] rounded-br-[44px] rounded-bl-[22px] border px-8 py-9 text-center text-[#fff2e8]"
              style={{
                background: CARD_BG,
                borderColor: `${GOLD}4d`,
                boxShadow: "0 30px 70px -20px rgba(0,0,0,0.6)",
              }}
            >
              <button
                type="button"
                onClick={() => setStage("fab")}
                aria-label={lang === "en" ? "Close" : "Закрити"}
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#fff2e8]/70 transition hover:bg-white/20 hover:text-[#fff2e8]"
              >
                <X className="h-4 w-4" />
              </button>
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#df9b3b]/18 blur-3xl" />
              <CompassRose className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 text-[#fff2e8]/6" />
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 14 }}
                className="relative z-10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: GOLD }}
              >
                <Heart className="h-6 w-6 text-[#002f5e]" fill="#002f5e" />
              </motion.span>
              <h2 className="relative z-10 text-[24px] leading-tight font-odesa-bold">
                {lang === "en" ? "Thank you!" : "Дякуємо!"}
              </h2>
              <p className="relative z-10 mt-2 text-[14px] text-[#fff2e8]/60 font-odesa-regular">
                {lang === "en"
                  ? "Your answers help us make Odesa region better for travellers."
                  : "Ваші відповіді допомагають робити Одещину кращою для мандрівників."}
              </p>
              <div className="relative z-10 mt-5 flex justify-center">
                <WaveLines className="h-5 w-24 text-[#df9b3b]/70" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PollWidget;
