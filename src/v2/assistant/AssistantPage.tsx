import "@/v2/v2.css";
import { ArrowUpRight } from "lucide-react";
import { useSeo } from "@/hooks/useSeo";
import { MAIN_CONTENT_ID } from "@/components/SkipLink";
import { useV2 } from "@/v2/i18n";
import { Header } from "@/v2/components/Header";
import { useAssistantPage } from "./useAssistantPage";
import { ChatTools, Composer, ConstellationBackdrop, Kicker, Messages, Note, usePrompts } from "./parts";

/**
 * Сторінка AI-гіда (/asystent), вигляд «Розмова» (обраний власником
 * 2026-11-20): світла сторінка зі звичайною шапкою сайту. Порожній стан —
 * заголовок як у розділах сайту («Спитайте *про Одещину*») і п'ять
 * плиток-питань зі значками. У розмові відповіді без бульбашок (як текст
 * статті), поруч — сонячна зірочка AI-гіда; питання — винні бульбашки праворуч.
 * «Панель» і «Винна» — у useful/v2/assistant/.
 *
 * Сторінка на всю висоту екрана без підвалу: прокручується лише стрічка
 * повідомлень, поле вводу завжди внизу (на телефоні — над доком).
 */
export default function AssistantPage() {
  const { t, lang } = useV2();
  const data = useAssistantPage();
  const prompts = usePrompts();
  useSeo({ title: t("aiTitle"), description: t("asLead"), lang });

  return (
    <div className="v2 relative flex h-[100dvh] flex-col overflow-hidden">
      <Header />
      <ConstellationBackdrop />

      {/* Рядок інструментів чату: кікер ліворуч, розмови праворуч */}
      <div className="relative z-10 mx-auto flex w-full max-w-[800px] shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-1 sm:px-6">
        <Kicker className={data.isEmpty ? "invisible" : ""}>{t("asKicker")}</Kicker>
        <ChatTools data={data} />
      </div>

      <main id={MAIN_CONTENT_ID} tabIndex={-1} ref={data.scrollRef} className="relative z-[1] min-h-0 flex-1 overflow-y-auto outline-none">
        {data.isEmpty ? (
          <div className="mx-auto flex min-h-full max-w-[800px] flex-col justify-center px-5 py-8 sm:px-6">
            <Kicker>{t("asKicker")}</Kicker>
            <h1 className="mt-3 text-[40px] font-bold leading-[1] tracking-[-0.025em] sm:text-[56px]">
              {t("asTitle1")} <span className="ital text-o-wine">{t("asTitle2")}</span>
            </h1>
            <p className="mt-4 max-w-[560px] text-[15.5px] leading-relaxed text-o-sea/70 sm:text-[16.5px]">{t("asLead")}</p>

            <ul className="mt-7 grid grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-5 sm:gap-3">
              {prompts.map(({ q, Icon }, i) => (
                <li key={q} className={i === prompts.length - 1 ? "col-span-2 sm:col-span-1" : ""}>
                  <button
                    type="button"
                    onClick={() => data.submit(q)}
                    className="group flex h-full w-full items-center gap-3 rounded-[18px] bg-[#fffaf5] p-2.5 text-left sm:flex-col sm:items-start sm:p-4 shadow-[0_16px_30px_-26px_rgba(0,10,30,0.55)] ring-1 ring-o-sea/[0.07] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_22px_38px_-24px_rgba(0,10,30,0.6)]"
                  >
                    <span className="flex shrink-0 items-center justify-between sm:w-full">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-o-wine/[0.08] sm:h-10 sm:w-10 text-o-wine transition-colors duration-300 group-hover:bg-o-wine group-hover:text-o-sand">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <ArrowUpRight className="hidden h-4 w-4 text-o-wine opacity-0 sm:block transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                    </span>
                    <span className="text-[14px] font-bold leading-snug sm:text-[15px]">{q}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mx-auto max-w-[800px] px-5 pb-6 pt-4 sm:px-6">
            <Messages data={data} />
          </div>
        )}
      </main>

      {/* Поле вводу; знизу на телефоні й планшеті — місце під док */}
      <div className="relative z-10 shrink-0 px-5 pb-[calc(92px+env(safe-area-inset-bottom))] pt-3 sm:px-6 lg:pb-[calc(18px+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-[800px]">
          <Composer data={data} />
          <Note className="mt-2" />
        </div>
      </div>

      {/* Заливки безпечних зон: смужка під «чубчиком» і над home indicator завжди
          кремова, навіть якщо Safari не встиг підхопити фон html після переходу. */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-20 bg-o-sand" style={{ height: "env(safe-area-inset-top)" }} />
      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-o-sand" style={{ height: "env(safe-area-inset-bottom)" }} />
    </div>
  );
}
