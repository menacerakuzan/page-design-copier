import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronRight, ChevronUp, Heart } from "lucide-react";
import type { PageSection } from "@/types/pages";
import type { TourismObjectType } from "@/types/hierarchy";
import { Img } from "@/components/Img";
import { useBasket } from "@/lib/basketContext";
import { sectionTitle, tourismTypeLabel } from "@/lib/sectionTitles";
import { useV2 } from "@/v2/i18n";
import { EASE, Reveal } from "@/v2/components/ui";
import { DISTRICT_SHAPES, shapeBox } from "@/v2/lib/districtShapes";
import { metaLine } from "@/v2/home/routes/shared";
import type { DistrictItem } from "@/v2/districts/useDistricts";
import type { DistrictPageData, Place } from "./useDistrictPage";

/* ── Дрібниці ──────────────────────────────────────────────────────────── */

/** Заголовок блоку з конструктора («Міста» → «Населені пункти»), перекладений. */
export function useSectionTitle() {
  const { lang } = useV2();
  return (s: PageSection) => sectionTitle(s.title === "Міста" ? "Населені пункти" : s.title, lang);
}

/** Заголовок розділу: короткий кікер із рискою і великий h2. */
export function BlockHead({ kicker, title, id, className = "", aside, count }: {
  kicker?: string;
  title: string;
  id?: string;
  className?: string;
  aside?: React.ReactNode;
  /** Скільки елементів у блоці — невеликою винною цифрою поруч із заголовком. */
  count?: number;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-3 ${className}`}>
      <div>
        {kicker && (
          <p className="mb-2.5 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-wine">
            <span className="h-px w-8 bg-o-wine" aria-hidden="true" />
            {kicker}
          </p>
        )}
        <h2 id={id} className="text-[28px] font-bold leading-[1.02] tracking-[-0.02em] sm:text-[36px] lg:text-[42px]">
          {title}
          {count ? (
            <span className="ml-3 inline-flex -translate-y-[0.35em] items-center rounded-full bg-o-wine px-2.5 py-0.5 align-middle text-[14px] font-bold leading-[1.4] tracking-normal text-o-sand sm:text-[15px]">
              {count}
            </span>
          ) : null}
        </h2>
      </div>
      {aside}
    </div>
  );
}

/**
 * Розділювач — коротка хвиляста винна риска. Прямі лінії зливались із фоновою
 * сіткою (вона теж із прямих ліній), тому розділяємо хвилею.
 */
export function Squiggle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={`h-3 w-[96px] text-o-wine/45 ${className}`} fill="none" aria-hidden="true">
      <path d="M2 6 Q 9.5 0, 17 6 T 32 6 T 47 6 T 62 6 T 77 6 T 92 6 T 107 6 T 118 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Одещина › Райони › Район */
export function Crumbs({ name, className = "", light = false }: { name: string; className?: string; light?: boolean }) {
  const { t } = useV2();
  const base = light ? "text-o-sand/80" : "text-o-sea/55";
  const hover = light ? "hover:text-o-sand" : "hover:text-o-wine";
  return (
    <nav aria-label="breadcrumb" className={`flex flex-wrap items-center gap-1 text-[13px] ${base} ${className}`}>
      <Link to="/" className={`transition-colors ${hover}`}>Одещина</Link>
      <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      <Link to="/districts" className={`transition-colors ${hover}`}>{t("navDistricts")}</Link>
      <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
      <span className={light ? "text-o-sand/90" : "text-o-sea/80"} aria-current="page">{name}</span>
    </nav>
  );
}

const pluralOf = (n: number, forms: string) => {
  const [one, few, many] = forms.split("|");
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

/** «1 місце / 3 місця / 5 місць» */
export function usePlacesWord() {
  const { t } = useV2();
  return (n: number) => `${n} ${pluralOf(n, t("placeForms"))}`;
}

/** HTML з адмінки (TipTap) — як на старій сторінці, з розекрануванням. */
const unescape = (html: string) => (html.includes("&lt;") ? html.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&") : html);

export function RichText({ html, className = "", style }: { html?: string; className?: string; style?: React.CSSProperties }) {
  if (!html) return null;
  // Без старого .article-content (він жорстко задає абзацам 18px) — розмір і колір беруться з className.
  return (
    <div
      className={`[&_a]:text-o-wine [&_a]:underline [&_a]:underline-offset-2 [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: unescape(html) }}
    />
  );
}

/**
 * Опис району. clamp — скільки рядків короткого опису видно спершу (решта
 * схована); «Читати більше» розкриває весь короткий і детальний опис.
 */
export function AboutText({ it, clamp, className = "", textClass = "text-[15.5px] leading-[1.7] sm:text-[16.5px]" }: {
  it: DistrictItem;
  clamp?: number;
  className?: string;
  textClass?: string;
}) {
  const { t, tl } = useV2();
  const [open, setOpen] = useState(false);
  const more = it.d.detailedInfo;
  const clamped: React.CSSProperties | undefined =
    clamp && !open ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: clamp, overflow: "hidden" } : undefined;
  return (
    <div className={className}>
      <RichText html={tl(it.d.description, it.d.descriptionEn)} className={`${textClass} text-o-sea/80`} style={clamped} />
      {more && (
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="overflow-hidden"
        >
          <RichText html={more} className={`mt-3 ${textClass} text-o-sea/70`} />
        </motion.div>
      )}
      {(more || clamp) && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-o-wine underline decoration-o-wine/30 underline-offset-4 transition-colors hover:decoration-o-wine"
        >
          {open ? t("readLess") : t("readMore")}
        </button>
      )}
    </div>
  );
}

/* ── Місця ─────────────────────────────────────────────────────────────── */

/** Коротка назва виду: «Історико-культурний туризм» → «Історико-культурний». */
export const typeName = (type: string, lang: "uk" | "en") => tourismTypeLabel(type, lang).replace(/\s*(туризм|tourism)$/i, "");

/** Кругла кнопка «у мій маршрут» — серце, заповнене, коли місце вже в маршруті. */
export function TripButton({ id, className = "relative", size = "md" }: { id: string; className?: string; size?: "sm" | "md" }) {
  const { t } = useV2();
  const { has, toggle } = useBasket();
  const on = has(id);
  const box = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      aria-pressed={on}
      aria-label={on ? t("inTrip") : t("addTrip")}
      title={on ? t("inTrip") : t("addTrip")}
      className={`z-[2] flex ${box} shrink-0 items-center justify-center rounded-full transition-colors ${on ? "bg-o-wine text-o-sand" : "bg-o-sand/95 text-o-sea shadow-[0_6px_16px_-8px_rgba(0,20,50,0.6)] hover:text-o-wine"} ${className}`}
    >
      <Heart className={`${size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} ${on ? "fill-current" : ""}`} aria-hidden="true" />
    </button>
  );
}

/** Фільтр за видами туризму — лише ті види, що є серед місць, від найчастішого. */
export function useTypeFilter(places: Place[]) {
  const [type, setType] = useState<string | null>(null);
  const types = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of places) for (const t of p.o.tourismTypes ?? []) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [places]);
  const list = type ? places.filter((p) => p.o.tourismTypes?.includes(type)) : places;
  return { type, setType, types, list };
}

/** Фільтр-пігулки за видами туризму. */
export function TypeChips({ types, value, onChange, total }: {
  types: [string, number][];
  value: string | null;
  onChange: (v: string | null) => void;
  total: number;
}) {
  const { t, lang } = useV2();
  if (types.length < 2) return null;
  const cls = (on: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${on ? "bg-o-wine text-o-sand" : "bg-o-sea/[0.06] text-o-sea hover:bg-o-wine/10"}`;
  return (
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group">
      <button type="button" onClick={() => onChange(null)} aria-pressed={!value} className={cls(!value)}>
        {t("allTypes")} <span className="opacity-60">{total}</span>
      </button>
      {types.map(([type, n]) => (
        <button key={type} type="button" onClick={() => onChange(value === type ? null : type)} aria-pressed={value === type} className={cls(value === type)}>
          {typeName(type, lang)} <span className="opacity-60">{n}</span>
        </button>
      ))}
    </div>
  );
}

/** «Показати ще» / «Згорнути»: спершу limit карток, далі — усі (і назад). */
export function useMore<T>(list: T[], limit: number) {
  const [all, setAll] = useState(false);
  const hidden = Math.max(0, list.length - limit);
  return {
    shown: all ? list : list.slice(0, limit),
    rest: all ? 0 : hidden,
    /** Розгорнуто й є що згортати. */
    expanded: all && hidden > 0,
    showAll: () => setAll(true),
    collapse: () => setAll(false),
  };
}

/**
 * Кнопка під списком: «Показати ще +N» або, коли все розгорнуто, «Згорнути».
 * Після згортання, якщо початок розділу (anchor) вже вище екрана, — плавно до нього,
 * щоб людина не опинилась посеред наступного блоку.
 */
export function MoreButton({ more, anchor }: { more: { rest: number; expanded: boolean; showAll: () => void; collapse: () => void }; anchor?: string }) {
  const { t } = useV2();
  const reduce = useReducedMotion();
  if (!more.rest && !more.expanded) return null;
  const cls = "inline-flex items-center gap-1.5 rounded-full border border-o-sea/20 px-6 py-2.5 text-[14px] font-semibold transition-colors hover:border-o-wine hover:text-o-wine";
  const collapse = () => {
    more.collapse();
    const el = anchor ? document.getElementById(anchor) : null;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };
  return (
    <div className="mt-10 flex justify-center">
      {more.expanded ? (
        <button type="button" onClick={collapse} className={cls}>
          {t("readLess")}
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        <button type="button" onClick={more.showAll} className={cls}>
          {t("showMore")} <span className="opacity-60">+{more.rest}</span>
        </button>
      )}
    </div>
  );
}

/* ── Маршрути (компактно), сусіди, інші блоки ───────────────────────────── */

/** Зупинки маршруту одним рядком: перша ─ ─ ─ остання (як пунктир маршрутів на головній). */
function StopChain({ names }: { names: string[] }) {
  if (!names.length) return null;
  const first = names[0];
  const last = names.length > 1 ? names[names.length - 1] : undefined;
  return (
    <span className="flex items-center gap-2 text-[11.5px] font-medium text-o-sea/65">
      <span className="h-2 w-2 shrink-0 rounded-full bg-o-wine" aria-hidden="true" />
      <span className="max-w-[42%] truncate">{first}</span>
      {last && (
        <>
          <span className="min-w-[20px] flex-1 border-t-[1.5px] border-dashed border-o-wine/40" aria-hidden="true" />
          <span className="max-w-[42%] truncate">{last}</span>
          <span className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-o-wine" aria-hidden="true" />
        </>
      )}
    </span>
  );
}

/**
 * Маршрути, що проходять районом. Той самий заголовок і ті самі кремові рамки,
 * що й у місць, — щоб блок не випадав зі сторінки. Унизу картки — перша й
 * остання зупинки, з'єднані пунктиром.
 */
export function RoutesCompact({ data, title, id = "routes" }: { data: Pick<DistrictPageData, "routes" | "routesData">; title?: string; id?: string }) {
  const { t, tl } = useV2();
  const d = data.routesData;
  const more = useMore(data.routes, 3);
  const list = more.shown;
  if (!list.length) return null;
  return (
    <section id={id} aria-labelledby="routes-through" className="mx-auto max-w-[1280px] scroll-mt-24 px-5 py-10 sm:px-10 sm:py-14">
      <BlockHead
        className="[&_h2]:!text-[24px] sm:[&_h2]:!text-[30px]"
        id="routes-through"
        kicker={t("navRoutes")}
        title={title ?? t("routesThrough")}
        count={data.routes.length}
        aside={
          <Link to="/marshruty" className="inline-flex items-center gap-1 text-[14px] font-semibold text-o-wine underline decoration-o-wine/30 underline-offset-4 hover:decoration-o-wine">
            {t("allRoutes")}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((r, i) => {
          const stops = d.stopsOf(r);
          return (
            <Reveal as="li" key={r.id} delay={(i % 3) * 0.05} y={14}>
              <Link
                to={`/marshruty/${r.id}`}
                className="group flex h-full gap-3 rounded-[14px] bg-[#fffaf5]/80 p-1.5 pr-3 ring-1 ring-o-sea/[0.07] transition-colors hover:bg-[#fffaf5] hover:ring-o-wine/25"
              >
                <span className="block w-[84px] shrink-0 overflow-hidden rounded-[10px] bg-o-sea/10">
                  <Img src={r.imageUrl || stops[0]?.image} w={220} alt="" className="h-full min-h-[84px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col py-1">
                  <span className="line-clamp-2 text-[14px] font-bold leading-snug transition-colors group-hover:text-o-wine">{tl(r.name, r.nameEn)}</span>
                  <span className="mt-0.5 block truncate text-[12px] text-o-sea/55">{metaLine(d, r)}</span>
                  <span className="mt-auto block pt-2">
                    <StopChain names={stops.map((st) => st.name)} />
                  </span>
                </span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
      <MoreButton more={more} anchor={id} />
    </section>
  );
}

/** Попередній / наступний район — щоб гортати далі, не повертаючись до списку. */
export function Neighbours({ data }: { data: DistrictPageData }) {
  const { t } = useV2();
  const items = [
    { it: data.prev, label: t("prevDistrict"), Icon: ArrowLeft, right: false },
    { it: data.next, label: t("nextDistrict"), Icon: ArrowRight, right: true },
  ].filter((x) => x.it && x.it.slug !== data.it?.slug);
  if (!items.length) return null;
  return (
    <nav aria-label={t("otherDistricts")} className="mx-auto max-w-[1280px] px-5 pb-16 pt-6 sm:px-10 sm:pb-24">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(({ it, label, Icon, right }) => (
          <Link key={it!.slug} to={`/raion/${it!.slug}`} className={`group flex items-center gap-5 rounded-[18px] p-3 transition-colors hover:bg-o-sea/[0.04] ${right ? "sm:flex-row-reverse sm:text-right" : ""}`}>
            <SilhouetteThumb it={it!} className="h-20 w-20 shrink-0 sm:h-24 sm:w-24" />
            <div className="min-w-0">
              <p className={`flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-o-wine ${right ? "sm:justify-end" : ""}`}>
                {!right && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                {label}
                {right && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
              </p>
              <p className="mt-1 text-[20px] font-bold leading-tight transition-colors group-hover:text-o-wine sm:text-[24px]">{it!.name}</p>
              <p className="mt-0.5 text-[13.5px] text-o-sea/60">{it!.tagline}</p>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Маленький силует району з фото всередині (як на сторінці «Райони»). */
export function SilhouetteThumb({ it, className = "" }: { it: DistrictItem; className?: string }) {
  const box = shapeBox(it.slug);
  const shape = DISTRICT_SHAPES[it.slug];
  if (!box || !shape) return null;
  const side = Math.max(box.w, box.h) * 1.08;
  const vx = box.x + box.w / 2 - side / 2;
  const vy = box.y + box.h / 2 - side / 2;
  const id = `thumb-${it.slug}`;
  return (
    <svg viewBox={`${vx} ${vy} ${side} ${side}`} className={className} aria-hidden="true">
      <defs>
        <clipPath id={id}><path d={shape.d} /></clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#002f5e" />
        {it.image && <image href={it.image} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio="xMidYMid slice" />}
      </g>
      <path d={shape.d} fill="none" stroke="#fff2e8" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Рідкісні блоки конструктора (факти, цитата, вільний текст, відео, вбудована
 * карта, галерея, розділювач) — простим оформленням нового дизайну.
 */
export function ExtraSection({ s, data, title }: { s: PageSection; data: Pick<DistrictPageData, "cards">; title: string }) {
  const reduce = useReducedMotion();
  const wrap = (children: React.ReactNode) => (
    <section className="mx-auto max-w-[1280px] px-5 py-12 sm:px-10 sm:py-16">
      <Reveal>{children}</Reveal>
    </section>
  );
  switch (s.kind) {
    case "stat_strip": {
      const stats = (s.payload?.stats ?? "").split("\n").filter(Boolean).map((l) => l.split("|").map((x) => x.trim()));
      if (!stats.length) return null;
      return wrap(
        <>
          {title && <BlockHead title={title} className="mb-8" />}
          <dl className="grid grid-cols-2 gap-6 py-4 sm:grid-cols-4">
            {stats.map(([val, lbl], i) => (
              <div key={i}>
                <dt className="sr-only">{lbl}</dt>
                <dd className="text-[34px] font-extrabold leading-none text-o-wine">{val}</dd>
                <dd className="mt-2 text-[14px] text-o-sea/65">{lbl}</dd>
              </div>
            ))}
          </dl>
        </>,
      );
    }
    case "quote": {
      const quote = s.payload?.quote ?? "";
      if (!quote) return null;
      return wrap(
        <figure className="mx-auto max-w-[860px] text-center">
          <blockquote className="ital text-[26px] leading-snug text-o-wine sm:text-[34px]">«{quote}»</blockquote>
          {s.payload?.author && <figcaption className="mt-4 text-[14px] text-o-sea/60">— {s.payload.author}</figcaption>}
        </figure>,
      );
    }
    case "custom_text": {
      const text = s.payload?.text ?? "";
      if (!text) return null;
      return wrap(
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          {title && <BlockHead title={title} />}
          <RichText html={text} className="text-[16px] leading-[1.7] text-o-sea/75" />
        </div>,
      );
    }
    case "video": {
      const url = s.payload?.videoUrl ?? "";
      if (!url) return null;
      return wrap(
        <>
          {title && <BlockHead title={title} className="mb-8" />}
          <div className="aspect-video overflow-hidden rounded-[22px] bg-o-deep">
            <iframe src={url} title={title || "Відео"} allow="autoplay; encrypted-media" allowFullScreen className="h-full w-full border-0" />
          </div>
        </>,
      );
    }
    case "map": {
      const url = s.payload?.embedUrl ?? "";
      if (!url) return null;
      return wrap(
        <>
          {title && <BlockHead title={title} className="mb-8" />}
          <div className="aspect-[16/9] overflow-hidden rounded-[22px] bg-o-sea/10">
            <iframe src={url} title={title || "Карта"} loading="lazy" className="h-full w-full border-0" />
          </div>
        </>,
      );
    }
    case "gallery": {
      const items = data.cards
        .filter((c) => c.sectionKey === `gallery-${s.id}` && c.imageUrl && !c.payload?.videoUrl)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      if (!items.length) return null;
      return wrap(
        <>
          {title && <BlockHead title={title} className="mb-8" />}
          <ul className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            {items.map((c) => (
              <li key={c.id} className="w-[70vw] shrink-0 sm:w-[360px]">
                <Img src={c.imageUrl} w={720} alt={c.title ?? ""} className="aspect-[4/3] w-full rounded-[18px] object-cover" />
                {c.title && <p className="mt-2 text-[14px] text-o-sea/70">{c.title}</p>}
              </li>
            ))}
          </ul>
        </>,
      );
    }
    case "divider":
      return (
        <div className="mx-auto max-w-[1280px] px-5 sm:px-10" aria-hidden="true">
          <motion.div initial={reduce ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE }}>
            <Squiggle />
          </motion.div>
        </div>
      );
    default:
      return null;
  }
}

/** Список місць потрібного виду для блоку конструктора (з фільтром адмінки). */
export function placesFor(data: DistrictPageData, kind: TourismObjectType, s: PageSection): Place[] {
  let list = data.placesByType[kind] ?? [];
  if (s.filter?.entityIds?.length) {
    const byId = new Map(list.map((p) => [p.o.id, p]));
    list = s.filter.entityIds.map((id) => byId.get(id)).filter((p): p is Place => !!p);
  }
  if (s.filter?.limit) list = list.slice(0, s.filter.limit);
  return list;
}

/** Назва району: перше слово — звичайне, «район» — шрифтом ss02 (колір — accent). */
export function DistrictTitle({ name, className = "", accent = "text-o-wine" }: { name: string; className?: string; accent?: string }) {
  const m = name.match(/^(.*?)\s+(район|district)$/i);
  return (
    <h1 className={`font-bold leading-[0.98] tracking-[-0.025em] ${className}`}>
      {m ? (
        <>
          {m[1]} <span className={`ital ${accent}`}>{m[2]}</span>
        </>
      ) : (
        name
      )}
    </h1>
  );
}
