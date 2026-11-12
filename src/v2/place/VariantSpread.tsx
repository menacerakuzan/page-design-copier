import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Images } from "lucide-react";
import { Img } from "@/components/Img";
import { HeroBackgroundVideo } from "@/components/HeroBackgroundVideo";
import { useV2 } from "@/v2/i18n";
import { EASE, Reveal } from "@/v2/components/ui";
import { BlockHead, RichText, useSectionTitle } from "@/v2/district/parts";
import {
  Actions, DistrictPin, EventStrip, VenueCard, useEventParts, MapBlock, Nearby, PassportList, PlaceAudio, PlaceCrumbs, PlaceExtras, PlaceReel, PlaceRoutes, PlaceText,
  Repertoire, TypePills, VenueLine, useKicker, useLightbox, usePassport, useShown,
} from "./parts";
import type { PlacePageData } from "./usePlacePage";

/**
 * Розмір назви за її довжиною: короткі — великі, довгі («Одеський академічний
 * український музично-драматичний театр ім. В. Василька») — менші й ширші,
 * щоб назва займала не більше 2–3 рядків і не закривала пів фото.
 */
function titleSize(name: string) {
  const n = name.length;
  if (n <= 28) return "max-w-[980px] text-[40px] sm:text-[64px] lg:text-[76px]";
  if (n <= 48) return "max-w-[1000px] text-[34px] sm:text-[54px] lg:text-[62px]";
  return "max-w-[1100px] text-[28px] sm:text-[42px] lg:text-[50px]";
}

/**
 * Перший екран: фото (або відео) на весь екран із повільним наближенням —
 * як у району й пункту. Унизу лише крихти, назва й дії («В мій маршрут»,
 * «Як дістатися», поділитися, QR) — вид туризму й «що це» перенесено нижче,
 * щоб на фото не було забагато тексту.
 */
function SpreadHero({ data }: { data: PlacePageData }) {
  const reduce = useReducedMotion();
  const o = data.o!;
  return (
    <section className="relative h-[100svh] min-h-[560px] overflow-hidden bg-o-deep text-o-sand">
      <motion.div className="absolute inset-0" initial={reduce ? false : { scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 14, ease: "easeOut" }}>
        {o.videoUrl ? (
          <HeroBackgroundVideo src={o.videoUrl} poster={o.imageUrl} />
        ) : (
          <Img src={o.imageUrl} w={2200} priority alt="" className="h-full w-full object-cover" />
        )}
      </motion.div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(14,10,14,0.42) 0%, rgba(14,10,14,0) 24%, rgba(14,10,14,0) 38%, rgba(14,10,14,0.6) 70%, rgba(14,10,14,0.88) 100%)" }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex h-full max-w-[1280px] flex-col justify-end px-5 pb-[calc(104px+env(safe-area-inset-bottom))] sm:px-10 lg:pb-12">
        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2, ease: EASE }}>
          <PlaceCrumbs data={data} light className="[text-shadow:0_1px_8px_rgba(0,0,0,0.45)]" />
          <h1 className={`mt-5 font-semibold leading-[1.02] tracking-[-0.025em] [text-wrap:balance] ${titleSize(data.name)}`}>{data.name}</h1>
          {/* Рядок дій; для події праворуч — позначка «Подія» й найближчий показ
              (у тому ж рядку, щоб не піднімати назву вище, ніж у місць) */}
          <Actions data={data} light className="mt-7 border-t border-o-sand/25 pt-5" extra={<EventStrip data={data} className="ml-auto pl-2" />} />
        </motion.div>
      </div>
    </section>
  );
}

/** Мало практичних даних (1–2 рядки) — тоді не картка, а рядок з іконками під «що це». */
function FactsInline({ rows }: { rows: ReturnType<typeof usePassport> }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
      {rows.map((r) => (
        <li key={r.key} className="flex items-center gap-2 text-[15px] text-o-sea/80">
          <span className="text-o-wine">{r.icon}</span>
          <span className="sr-only">{r.label}: </span>
          {r.value}
        </li>
      ))}
    </ul>
  );
}

/**
 * «Про об'єкт» однією композицією, яка складається з того, що є:
 * — угорі на всю ширину: кікер, «що це» великим шрифтом ss02 (підзаголовок, а
 *   якщо його немає — перший вид туризму; тоді в чипах лише решта видів) і
 *   види туризму чипами; для події — місце проведення;
 * — далі історія: рілс (якщо є) поруч із текстом, перед текстом — аудіогід
 *   (якщо є): «послухай або прочитай»;
 * — практичне: якщо даних 3+ — вертикальна картка-паспорт праворуч (разом із
 *   рілсом прилипає при прокрутці, лише коли опис розгорнуто), район у ній — компактним рядком «силует · назва», щоб картка
 *   не була набагато довша за текст; якщо 1–2 — рядок з іконками під «що це»,
 *   а район із точкою стоїть праворуч від тексту.
 * Чого немає — блоку немає, без порожніх місць за будь-якої довжини тексту.
 */
function SpreadAbout({ data }: { data: PlacePageData }) {
  const { t, tl } = useV2();
  const titleOf = useSectionTitle();
  const kicker = useKicker(data);
  const rows = usePassport(data);
  const s = data.sections.find((x) => x.kind === "description");
  const title = s ? titleOf(s) : "";
  const hasSub = !!data.subtitle && data.subtitle !== data.name;
  const what = hasSub ? data.subtitle : kicker;
  const reel = !!data.o?.reelUrl;
  const audio = !!tl(data.o?.audioUrl, data.o?.audioUrlEn);
  const rich = rows.length >= 3;
  // Рілс і паспорт «прилипають» при прокрутці лише тоді, коли опис розгорнуто
  const [expanded, setExpanded] = useState(false);
  const cols = reel
    ? rich ? "lg:grid-cols-[220px_minmax(0,1fr)_330px]" : "lg:grid-cols-[220px_minmax(0,1fr)_220px]"
    : rich ? "lg:grid-cols-[minmax(0,1fr)_350px]" : "lg:grid-cols-[minmax(0,1fr)_240px]";
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-10 sm:py-16">
      <Reveal>
        {title && (
          <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
            <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
            {title}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
          <p className="ital text-[26px] leading-none text-o-wine sm:text-[32px]">{what}</p>
          <TypePills data={data} skipFirst={!hasSub} />
        </div>
        <VenueLine data={data} className="mt-3" />
        {!rich && rows.length > 0 && <FactsInline rows={rows} />}
      </Reveal>

      <div className={`mt-8 grid items-start gap-8 sm:mt-10 lg:gap-12 ${cols}`}>
        {reel && (
          // Рілс «прилипає» разом із паспортом — лише коли опис розгорнуто
          <Reveal className={`order-2 lg:order-none lg:self-start ${expanded ? "lg:sticky lg:top-28" : ""}`} y={20}>
            <PlaceReel data={data} className="mx-auto w-[220px] lg:w-full" />
          </Reveal>
        )}
        <Reveal className="order-1 min-w-0 lg:order-none" delay={0.04} y={20}>
          {/* Аудіогід — перед текстом: «послухай або прочитай», щоб він був на видноті */}
          {audio && <PlaceAudio data={data} className="mb-8" />}
          {/* Короткий і детальний опис — одним потоком (а не лише короткий), згорнуто
              ≈ до висоти сусідніх колонок (рілса / паспорта); решта — за «Читати більше» */}
          <PlaceText
            data={data}
            flow
            onOpenChange={setExpanded}
            clamp={audio ? 8 : 12}
            textClass="text-[17px] leading-[1.7] sm:text-[18.5px]"
          />
        </Reveal>
        {rich ? (
          <Reveal delay={0.08} y={20} className={`order-3 lg:order-none lg:self-start ${expanded ? "lg:sticky lg:top-28" : ""}`}>
            <aside className="rounded-[20px] bg-[#fffaf5] p-6 shadow-[0_24px_44px_-30px_rgba(0,10,30,0.5)] ring-1 ring-o-sea/[0.06]">
              <p className="mb-4 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
                <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
                {t("practical")}
              </p>
              <PassportList data={data} />
              <div className="mt-4 border-t border-o-sea/10 pt-4">
                <DistrictPin data={data} compact />
              </div>
            </aside>
          </Reveal>
        ) : (
          <Reveal delay={0.08} y={20} className="order-3 lg:order-none lg:self-center">
            <DistrictPin data={data} className="mx-auto w-[200px]" />
          </Reveal>
        )}
      </div>
    </section>
  );
}

/**
 * «Про подію»: угорі — кікер, назва програми шрифтом ss02 («Репертуар
 * листопада 2026»; далі справжній текст
 * опису (якщо він є — без шаблонних повторів і сирих посилань) і велика картка
 * місця проведення. Репертуар — окремою винною панеллю нижче.
 */
function EventAbout({ data }: { data: PlacePageData }) {
  const titleOf = useSectionTitle();
  const { text } = useEventParts(data);
  const s = data.sections.find((x) => x.kind === "description");
  const title = s ? titleOf(s) : "";
  const what = (data.subtitle || data.name).replace(/\s+року$/, "").replace(/\s+/g, " ");
  const head = (
    <>
      {title && (
        <p className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
          <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
          {title}
        </p>
      )}
      <p className="ital mt-3 text-[30px] leading-[1.05] text-o-wine sm:text-[40px]">{what}</p>
      <TypePills data={data} className="mt-4" />
    </>
  );
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-10 sm:py-16">
      {text ? (
        // Є опис — ліворуч заголовок і текст, праворуч від самого верху — вертикальна картка
        // місця проведення: колонки однієї висоти навіть за короткого тексту.
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
          <Reveal y={18}>
            {head}
            <RichText html={text} className="mt-7 text-[17px] leading-[1.7] text-o-sea/85 sm:text-[18.5px]" />
          </Reveal>
          {data.venue && (
            <Reveal delay={0.06} y={20}>
              <VenueCard data={data} vertical />
            </Reveal>
          )}
        </div>
      ) : (
        <>
          <Reveal>{head}</Reveal>
          {data.venue && (
            <Reveal className="mt-8" y={20}>
              <VenueCard data={data} />
            </Reveal>
          )}
        </>
      )}
    </section>
  );
}

/** Галерея — стрічка фото 4:3, гортається вбік; клік — перегляд на весь екран. */
function GalleryStrip({ data, open }: { data: PlacePageData; open: (i: number) => void }) {
  const { t } = useV2();
  if (data.photos.length < 2) return null;
  return (
    <section aria-labelledby="place-photos" className="py-10 sm:py-14">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-10">
        <BlockHead
          id="place-photos"
          kicker={data.name}
          title={t("photosWord").replace(/^./, (c) => c.toUpperCase())}
          count={data.photos.length}
          className="[&_h2]:!text-[24px] sm:[&_h2]:!text-[30px]"
          aside={
            <button type="button" onClick={() => open(0)} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-o-wine underline decoration-o-wine/30 underline-offset-4 hover:decoration-o-wine">
              <Images className="h-4 w-4" aria-hidden="true" />
              {t("allPhotos")}
            </button>
          }
        />
      </div>
      {/* scroll-padding = відступу: інакше «прилипання» прокрутки зсуває стрічку до самого краю екрана */}
      <ul className="no-scrollbar mt-6 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 sm:scroll-px-10 sm:gap-4 sm:px-10 xl:scroll-px-[max(40px,calc((100vw-1200px)/2))] xl:px-[max(40px,calc((100vw-1200px)/2))]">
        {data.photos.map((p, i) => (
          <li key={p.url} className="w-[78vw] shrink-0 snap-start sm:w-[440px]">
            <button type="button" onClick={() => open(i)} className="group block w-full overflow-hidden rounded-[18px] bg-o-sea/10" aria-label={`${t("allPhotos")}: ${i + 1}`}>
              <Img src={p.url} w={900} alt={p.title ?? ""} className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Варіант 1 «Розворот»: продовження сторінок району й пункту. Фото на весь
 * екран → опис + липкий паспорт → галерея → (репертуар) → карта →
 * маршрути → поруч.
 */
export function PlaceSpread({ data }: { data: PlacePageData }) {
  const shown = useShown(data);
  const lb = useLightbox(data.photos);
  return (
    <>
      <SpreadHero data={data} />
      {data.type === "event" && data.venue ? <EventAbout data={data} /> : <SpreadAbout data={data} />}
      {shown("gallery") && <GalleryStrip data={data} open={lb.open} />}
      <Repertoire data={data} />
      {/* Район із точкою вже є в паспорті — тут лише карта */}
      {shown("map") && <MapBlock data={data} pin={false} />}
      <PlaceExtras data={data} />
      <PlaceRoutes data={data} />
      {(shown("related_attractions") || shown("related_restaurants") || shown("related_hotels") || shown("related_events")) && <Nearby data={data} />}
      {lb.node}
    </>
  );
}
