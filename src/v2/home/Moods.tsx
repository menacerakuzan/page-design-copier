import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Img } from "@/components/Img";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { tourismTypeLabel } from "@/lib/sectionTitles";
import { useV2 } from "@/v2/i18n";
import { Reveal, SectionHead } from "@/v2/components/ui";
import { MoodArt } from "./moods/art";
import { COLOR_STYLE, MOOD_COLOR, PHOTO_BRIGHTNESS } from "./moods/colors";
import { DoodlesBackdrop } from "./moods/DoodlesBackdrop";

/**
 * Види туризму: 8 квадратних фото — 2 ряди по 4 (на телефоні 4 ряди по 2).
 * Кожна плитка — колір палітри, фото лише тлом і лінійний малюнок виду.
 * Колонки трохи зсунуті «хвилею». Кожна плитка веде на свій вид туризму.
 */
export function Moods() {
  const { t, lang } = useV2();
  const { data: cards } = usePageContentCards("tourism-types");

  const items = useMemo(() => {
    return (cards ?? [])
      .filter((c) => c.sectionKey === "type")
      .map((c) => {
        const label = tourismTypeLabel(c.title, lang);
        // «Гастрономічний туризм» → «Гастрономічний» + «туризм» (ss02).
        const words = label.split(" ");
        return {
          id: c.id,
          type: c.title,
          head: words.length > 1 ? words.slice(0, -1).join(" ") : label,
          tail: words.length > 1 ? words[words.length - 1] : "",
          image: c.imageUrl ?? "",
        };
      });
  }, [cards, lang]);

  if (!items.length) return null;

  return (
    <section
      aria-labelledby="mood-title"
      className="relative isolate overflow-hidden bg-o-sand py-16 sm:py-20"
    >
      <DoodlesBackdrop />
      <div className="mx-auto max-w-[1280px] px-5 sm:px-10">
        <SectionHead
          id="mood-title"
          kicker={t("moodKicker")}
          line1={t("moodTitle1")}
          line2={t("moodTitle2")}
          inline
          action={{ to: "/types", label: t("navTypes") }}
        />

        <ul className="mx-auto mt-8 grid max-w-[1040px] grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-4 lg:pb-5">
          {items.map((it, i) => {
            const c = COLOR_STYLE[MOOD_COLOR[it.type] ?? "wine"];
            return (
              <Reveal as="li" key={it.id} delay={(i % 4) * 0.06}>
                {/* Легка «хвиля»: парні колонки трохи нижче. */}
                <div
                  className={
                    i % 2 === 1 ? "translate-y-3 lg:translate-y-5" : ""
                  }
                >
                  {/* Зовнішній шар — підйом і тінь; внутрішній — обрізає фото по заокругленню
                      (clip-path тримає кути навіть під час руху й зі змішуванням фото). */}
                  <Link
                    to={`/types?type=${encodeURIComponent(it.type)}`}
                    className="group relative block aspect-square rounded-[22px] shadow-[0_22px_40px_-26px_rgba(0,30,70,0.55)] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_34px_50px_-26px_rgba(0,30,70,0.6)] focus-visible:-translate-y-2 sm:rounded-[24px]"
                    style={{ color: c.ink }}
                  >
                    <span
                      className="absolute inset-0 isolate overflow-hidden rounded-[22px] [clip-path:inset(0_round_22px)] sm:rounded-[24px] sm:[clip-path:inset(0_round_24px)]"
                      style={{ backgroundColor: c.bg }}
                    >
                      {/* Фото — лише тлом: знебарвлене й пофарбоване в колір плитки.
                        При наведенні проступає трохи сильніше. */}
                      <Img
                        src={it.image}
                        w={480}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-[0.75] mix-blend-soft-light transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.05] group-hover:opacity-100"
                        style={{
                          filter: `grayscale(1) contrast(${c.photo.contrast}) brightness(${c.photo.brightness * (PHOTO_BRIGHTNESS[it.type] ?? 1)})`,
                        }}
                      />

                      {/* Малюнок виду туризму */}
                      <MoodArt
                        type={it.type}
                        className="absolute left-1/2 top-[44%] h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                      />

                      {/* Стрілка — з'являється при наведенні */}
                      <span
                        className="absolute right-3 top-3 flex h-9 w-9 scale-75 items-center justify-center rounded-full opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 sm:right-4 sm:top-4"
                        style={{ backgroundColor: c.ink, color: c.bg }}
                        aria-hidden="true"
                      >
                        <ArrowUpRight className="h-5 w-5" />
                      </span>

                      {/* Підпис */}
                      <span className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4">
                        <span className="block text-[14px] font-bold leading-tight sm:text-[17px]">
                          {it.head}
                        </span>
                        {it.tail && (
                          <span
                            className="ital hidden text-[15px] leading-tight sm:block"
                            style={{ color: c.accent }}
                          >
                            {it.tail}
                          </span>
                        )}
                      </span>
                    </span>
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
