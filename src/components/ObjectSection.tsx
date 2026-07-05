import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Moon } from "lucide-react";
import { Img } from "@/components/Img";
import { useLang } from "@/lib/langContext";
import { objectDetailPath, objectTypeLabel, objectTypeColor } from "@/lib/entityLinks";
import type { TourismObject, TourismObjectType } from "@/types/hierarchy";

const GOLD = "#df9b3b";

/** Фон секції за замовчуванням, якщо адмін не задав свій bgColor. */
export const DEFAULT_BG: Record<TourismObjectType, string> = {
  attraction: "#001a3d",
  event: "#3d0820",
  hotel: "#062820",
  restaurant: "#2a1200",
};

/**
 * Стиль відображення секції за типом об'єкта — кожен тип має свій, непохожий
 * на інші, вигляд замість однієї універсальної каруселі:
 *  - attraction → велика фото-карусель (як і було)
 *  - event      → карусель «квитків» із перфорацією й датою
 *  - hotel      → вертикальний список окремих карток (як лістинг)
 *  - restaurant → компактний список-довідник в одній панелі
 */
export const SECTION_VARIANT: Record<TourismObjectType, "carousel" | "tickets" | "stackedList" | "compactList"> = {
  attraction: "carousel",
  event: "tickets",
  hotel: "stackedList",
  restaurant: "compactList",
};

/** Свій фоновий патерн для кожного типу (секції тут темні — заливка кремова). */
const SECTION_PATTERN: Record<TourismObjectType, string> = {
  attraction: "/attractionpattern.svg",
  event: "/eventpattern.svg",
  hotel: "/hotelpattern.svg",
  restaurant: "/restaurantpattern.svg",
};

type ObjectSectionProps = {
  sectionId: string;
  title: string;
  subtitle?: string;
  items: TourismObject[];
  bg: string;
  setRef: (id: string) => (el: HTMLElement | null) => void;
  scroll: (key: string, dir: 1 | -1) => void;
  scrollRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
};

/**
 * Заголовок секції — по центру й індивідуально оформлений для кожного типу
 * (замість однакового зліва малого «eyebrow» напису над назвою).
 */
const SectionTitle = ({ variant, title, subtitle }: {
  variant: "carousel" | "tickets" | "stackedList" | "compactList";
  title: string; subtitle?: string;
}) => {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.6 }}
      className="mb-8 flex flex-col items-center text-center">
      {variant === "carousel" && (
        <>
          <div className="mb-3 h-[3px] w-14 rounded-full" style={{ backgroundColor: `${GOLD}80` }} />
          <h2 className="flex items-center gap-3 font-odesa-bold text-[28px] leading-none text-[#fff2e8] md:text-[48px]">
            <span className="text-[14px] md:text-[22px]" style={{ color: GOLD }}>✦</span>
            {title}
            <span className="text-[14px] md:text-[22px]" style={{ color: GOLD }}>✦</span>
          </h2>
        </>
      )}
      {variant === "tickets" && (
        <>
          <h2 className="flex items-center gap-3 font-odesa-bold text-[28px] leading-none text-[#fff2e8] md:text-[48px]">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `${GOLD}90` }} />
            {title}
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `${GOLD}90` }} />
          </h2>
          <div className="mt-3 w-20 border-t-2 border-dashed" style={{ borderColor: `${GOLD}70` }} />
        </>
      )}
      {variant === "stackedList" && (
        <>
          <Moon className="mb-2 h-5 w-5" style={{ color: GOLD }} strokeWidth={1.75} />
          <h2 className="font-odesa-bold text-[28px] leading-none text-[#fff2e8] md:text-[48px]">{title}</h2>
        </>
      )}
      {variant === "compactList" && (
        <h2 className="flex items-center gap-3 font-odesa-bold text-[28px] leading-none text-[#fff2e8] md:text-[48px]">
          <span className="text-[12px]" style={{ color: GOLD }}>◆</span>
          {title}
          <span className="text-[12px]" style={{ color: GOLD }}>◆</span>
        </h2>
      )}
      {subtitle && <p className="mt-2 max-w-[440px] text-[14px] font-odesa-regular text-[#fff2e8]/55">{subtitle}</p>}
    </motion.div>
  );
};

/** Велика фото-карусель — тур. об'єкти. */
const CarouselItems = ({ items, bg, sectionId, scrollRefs }: Pick<ObjectSectionProps, "items" | "bg" | "sectionId" | "scrollRefs">) => {
  const { t, lang } = useLang();
  return (
    <div ref={(el) => { scrollRefs.current[sectionId] = el; }}
      className="snap-x snap-mandatory scroll-px-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-4 pb-2 pt-1 md:gap-5" style={{ width: "max-content" }}>
        {items.map((obj, idx) => (
          <motion.div key={obj.id} className="snap-start"
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.55, delay: idx * 0.08 }}>
            <Link to={objectDetailPath(obj.type, obj.slug)}
              className="group block w-[270px] overflow-hidden rounded-[26px] transition-all duration-300 hover:-translate-y-2 md:w-[310px]"
              style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.05), 0 12px 32px -10px rgba(0,47,94,0.22)" }}>
              <div className="relative h-[340px] w-full overflow-hidden rounded-[26px]">
                <Img w={500} src={obj.imageUrl ?? "https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=80"}
                  alt={obj.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 30%, ${bg}f5 100%)` }} />
                <div className="absolute left-4 top-4">
                  <span className="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest font-odesa-medium text-[#fff2e8] backdrop-blur-md"
                    style={{ backgroundColor: `${objectTypeColor[obj.type]}cc`, boxShadow: `0 0 12px ${objectTypeColor[obj.type]}55` }}>
                    {objectTypeLabel(obj.type, lang)}
                  </span>
                </div>
                <span className="absolute right-4 top-4 rounded-full bg-black/25 px-2.5 py-1 text-[12px] leading-none font-odesa-medium text-[#fff2e8]/85 backdrop-blur-md">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="h-[3px] w-9 rounded-full transition-all duration-500 group-hover:w-[72px]" style={{ backgroundColor: GOLD }} />
                  <p className="mt-3 font-odesa-medium text-[21px] leading-[1.08] text-[#fff2e8] drop-shadow-md">{obj.name}</p>
                  {obj.subtitle && <p className="mt-1 text-[12px] font-odesa-regular text-[#fff2e8]/65 line-clamp-1">{obj.subtitle}</p>}
                  <div className="mt-2.5 space-y-2.5">
                    {obj.address && (
                      <p className="flex items-center gap-1.5 text-[11px] font-odesa-regular text-[#fff2e8]/55">
                        <MapPin className="h-3 w-3 shrink-0" /> {obj.address}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-odesa-medium text-[#001022]"
                      style={{ backgroundColor: objectTypeColor[obj.type] }}>
                      {t("details")} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/** Карусель «квитків» — події: перфорація й дата-стаб, як на квитках на головній. */
const TicketItems = ({ items, sectionId, scrollRefs }: Pick<ObjectSectionProps, "items" | "sectionId" | "scrollRefs">) => {
  const color = objectTypeColor.event;
  return (
    <div ref={(el) => { scrollRefs.current[sectionId] = el; }}
      className="snap-x snap-mandatory scroll-px-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-4 pb-2 pt-1 md:gap-5" style={{ width: "max-content" }}>
        {items.map((obj, idx) => (
          <motion.div key={obj.id} className="snap-start"
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: idx * 0.07 }}>
            <Link to={objectDetailPath(obj.type, obj.slug)}
              className="group block w-[220px] overflow-hidden rounded-[22px] bg-white/95 transition-all duration-300 hover:-translate-y-2"
              style={{ boxShadow: "0 16px 34px -20px rgba(0,0,0,0.55)" }}>
              <div className="relative h-[140px] w-full overflow-hidden">
                <Img w={440} src={obj.imageUrl ?? "https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=800&q=80"}
                  alt={obj.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#002f5e]/30 to-transparent" />
                {obj.eventDates && (
                  <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[11px] font-odesa-medium text-[#fff2e8]"
                    style={{ backgroundColor: color }}>
                    <Calendar className="h-3 w-3" /> {obj.eventDates}
                  </span>
                )}
              </div>
              {/* перфорація */}
              <div className="relative px-4" aria-hidden="true">
                <div className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full" style={{ backgroundColor: DEFAULT_BG.event }} />
                <div className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full" style={{ backgroundColor: DEFAULT_BG.event }} />
                <div className="border-t-2 border-dashed border-[#002f5e]/15" />
              </div>
              <div className="flex min-h-[128px] flex-col p-4">
                <p className="font-odesa-medium text-[16px] leading-[1.15] text-[#002f5e] line-clamp-2">{obj.name}</p>
                {obj.address && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-odesa-regular text-[#002f5e]/55 line-clamp-1">
                    <MapPin className="h-3 w-3 shrink-0" style={{ color }} /> {obj.address}
                  </p>
                )}
                <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[12px] font-odesa-medium" style={{ color }}>
                  Детальніше <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

/** Вертикальний список — готелі: окремі картки-рядки з фото ліворуч. */
const StackedListItems = ({ items }: Pick<ObjectSectionProps, "items">) => {
  const { t, lang } = useLang();
  const color = objectTypeColor.hotel;
  return (
    <div className="space-y-3">
      {items.map((obj, idx) => (
        <motion.div key={obj.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45, delay: idx * 0.05 }}>
          <Link to={objectDetailPath(obj.type, obj.slug)}
            className="group flex items-stretch gap-4 overflow-hidden rounded-[22px] bg-white p-2.5 transition-transform duration-300 hover:-translate-y-1"
            style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.05), 0 12px 28px -18px rgba(0,47,94,0.3)" }}>
            <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[16px]">
              <Img w={220} src={obj.imageUrl ?? "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"}
                alt={obj.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
              <span className="text-[10px] uppercase tracking-widest font-odesa-semi" style={{ color }}>{objectTypeLabel(obj.type, lang)}</span>
              <p className="mt-0.5 line-clamp-1 font-odesa-medium text-[17px] leading-tight text-[#002f5e]">{obj.name}</p>
              {obj.subtitle && <p className="mt-0.5 line-clamp-1 text-[13px] font-odesa-regular text-[#002f5e]/55">{obj.subtitle}</p>}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                {obj.address && (
                  <span className="flex items-center gap-1 text-[12px] font-odesa-regular text-[#002f5e]/50">
                    <MapPin className="h-3 w-3 shrink-0" style={{ color }} /> <span className="line-clamp-1">{obj.address}</span>
                  </span>
                )}
                {obj.amenities && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-odesa-medium" style={{ backgroundColor: `${color}18`, color }}>
                    {obj.amenities.split(",")[0].trim()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center pr-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5" style={{ backgroundColor: `${color}18`, color }}>
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
      <p className="sr-only">{t("details")}</p>
    </div>
  );
};

/** Компактний список-довідник — ресторани: одна панель, тонкі розділювачі. */
const CompactListItems = ({ items }: Pick<ObjectSectionProps, "items">) => {
  const { lang } = useLang();
  const color = objectTypeColor.restaurant;
  return (
    <div className="overflow-hidden rounded-[22px] bg-white" style={{ boxShadow: "0 0 0 1px rgba(0,47,94,0.05), 0 12px 28px -18px rgba(0,47,94,0.3)" }}>
      {items.map((obj, idx) => (
        <motion.div key={obj.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.35, delay: idx * 0.04 }}>
          <Link to={objectDetailPath(obj.type, obj.slug)}
            className={`group flex items-center gap-3 p-3 transition-colors hover:bg-[#002f5e]/[0.03] ${idx > 0 ? "border-t border-[#002f5e]/8" : ""}`}>
            <div className="h-[56px] w-[56px] shrink-0 overflow-hidden rounded-[14px] bg-[#002f5e]/5">
              {obj.imageUrl && <Img w={140} src={obj.imageUrl} alt={obj.name} className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 font-odesa-medium text-[15px] leading-tight text-[#002f5e]">{obj.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[11px] font-odesa-regular text-[#002f5e]/50">
                {obj.address && <span className="line-clamp-1 flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" style={{ color }} />{obj.address}</span>}
                {obj.hours && <span className="flex shrink-0 items-center gap-1"><Clock className="h-3 w-3 shrink-0" style={{ color }} />{obj.hours}</span>}
              </div>
            </div>
            <span className="shrink-0 text-[10px] uppercase tracking-widest font-odesa-semi" style={{ color }}>{objectTypeLabel(obj.type, lang)}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-[#002f5e]/25 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * Секція тур. об'єктів одного типу — спільна для DistrictPage і CityPage
 * (раніше була продубльована в обох файлах). Кожен тип має свій, непохожий
 * на інші вигляд (SECTION_VARIANT), а не одну універсальну карусель.
 * Адреса й кнопка «Детальніше» тепер завжди видимі (раніше ховались за
 * group-hover — на телефоні їх узагалі не можна було відкрити).
 */
export const ObjectSection = ({
  sectionId, title, subtitle, items, bg,
  setRef, scroll, scrollRefs,
}: ObjectSectionProps) => {
  const type = items[0]?.type;
  const variant = SECTION_VARIANT[type] ?? "carousel";
  const isScroll = variant === "carousel" || variant === "tickets";

  return (
    <section ref={setRef(sectionId)} className="relative scroll-mt-[52px] overflow-hidden px-4 py-14 md:px-10" style={{ backgroundColor: bg }}>
      {type && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{ backgroundImage: `url(${SECTION_PATTERN[type]})`, backgroundSize: "200px 200px", backgroundRepeat: "repeat", opacity: 0.08 }}
        />
      )}
      {isScroll && (
        <div className="absolute right-6 top-10 z-10 hidden items-center gap-2 md:flex md:right-10">
          <button type="button" onClick={() => scroll(sectionId, -1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-all hover:bg-white/20" aria-label="Назад">
            <ChevronLeft className="h-4 w-4 text-[#fff2e8]" /></button>
          <button type="button" onClick={() => scroll(sectionId, 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-all hover:bg-white/20" aria-label="Вперед">
            <ChevronRight className="h-4 w-4 text-[#fff2e8]" /></button>
        </div>
      )}
      <div className="relative z-10 mx-auto w-full max-w-[1400px]">
        <SectionTitle variant={variant} title={title} subtitle={subtitle} />
        {variant === "carousel" && <CarouselItems items={items} bg={bg} sectionId={sectionId} scrollRefs={scrollRefs} />}
        {variant === "tickets" && <TicketItems items={items} sectionId={sectionId} scrollRefs={scrollRefs} />}
        {variant === "stackedList" && <StackedListItems items={items} />}
        {variant === "compactList" && <CompactListItems items={items} />}
      </div>
    </section>
  );
};

export default ObjectSection;
