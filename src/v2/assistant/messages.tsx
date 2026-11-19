import { Fragment, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, CircleAlert, MapPin, Route as RouteIcon } from "lucide-react";
import { Img } from "@/components/Img";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { useBasket } from "@/lib/basketContext";
import { objectDetailPath, objectTypeLabel } from "@/lib/entityLinks";
import { parseAssistantMessage, type AssistantSegment } from "@/lib/assistantDirectives";
import type { TourismObject } from "@/types/hierarchy";
import { useV2 } from "@/v2/i18n";
import { TripButton, typeName } from "@/v2/district/parts";
import { plural } from "@/v2/districts/parts";

/**
 * Відповідь AI-гіда в новому дизайні. Директиви з тексту ([[obj]], [[route]],
 * [[chips]] — див. assistantDirectives) стають справжніми картками з даних
 * сайту; текст — безпечна підмножина markdown (без dangerouslySetInnerHTML).
 */

// ── Inline: **жирне**, *курсив*, [текст](url) ────────────────────────────
const INLINE_RE = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;

function renderInline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  INLINE_RE.lastIndex = 0;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyBase}-i${i++}`;
    if (m[2] !== undefined) {
      nodes.push(<strong key={key} className="font-bold">{m[2]}</strong>);
    } else if (m[4] !== undefined || m[6] !== undefined) {
      nodes.push(<em key={key}>{m[4] ?? m[6]}</em>);
    } else if (m[8] !== undefined && m[9] !== undefined) {
      nodes.push(
        <a
          key={key}
          href={m[9]}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-o-wine underline decoration-o-wine/30 underline-offset-4 hover:decoration-o-wine"
        >
          {m[8]}
        </a>,
      );
    }
    last = INLINE_RE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// ── Блоки: абзаци + списки ────────────────────────────────────────────────
// Лічильник нумерованого списку — наскрізний для всього повідомлення: картки
// місць розривають текст на сегменти, і без цього кожен сегмент починав би з «1.».
function renderMarkdown(text: string, keyBase: string, olCounter: { n: number }): ReactNode {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  let b = 0;

  const flushPara = () => {
    if (!para.length) return;
    const joined = para.join("\n").trim();
    if (joined) {
      const k = `${keyBase}-p${b++}`;
      blocks.push(
        <p key={k} className="whitespace-pre-wrap">
          {renderInline(joined, k)}
        </p>,
      );
    }
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const k = `${keyBase}-l${b++}`;
    const items = list.items.map((it, idx) => (
      <li key={`${k}-${idx}`} className="pl-1">
        {renderInline(it, `${k}-${idx}`)}
      </li>
    ));
    if (list.ordered) {
      blocks.push(
        <ol key={k} start={olCounter.n} className="ml-5 list-decimal space-y-1.5 marker:font-bold marker:text-o-wine">
          {items}
        </ol>,
      );
      olCounter.n += list.items.length;
    } else {
      blocks.push(
        <ul key={k} className="ml-5 list-disc space-y-1.5 marker:text-o-wine">
          {items}
        </ul>,
      );
    }
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ol[1]);
    } else if (ul) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(ul[1]);
    } else if (!line.trim()) {
      // Порожній рядок між пунктами не рве список (модель часто так розділяє).
      flushPara();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushList();
  flushPara();

  return <div className="flex flex-col gap-2.5">{blocks}</div>;
}

/** Сусідні картки місць збираємо в одну групу — їх показуємо сіткою. */
type Block = AssistantSegment | { kind: "objs"; slugs: string[] };
function group(segments: AssistantSegment[]): Block[] {
  const out: Block[] = [];
  for (const seg of segments) {
    if (seg.kind === "text" && !seg.text.trim()) continue;
    const prev = out[out.length - 1];
    if (seg.kind === "obj") {
      if (prev?.kind === "objs") prev.slugs.push(seg.slug);
      else out.push({ kind: "objs", slugs: [seg.slug] });
    } else out.push(seg);
  }
  return out;
}

export function Answer({
  content,
  onPick,
  interactive = true,
}: {
  content: string;
  onPick: (text: string) => void;
  interactive?: boolean;
}) {
  const blocks = group(parseAssistantMessage(content));
  const olCounter = { n: 1 };
  return (
    <div className="flex flex-col gap-3.5 text-[15.5px] leading-[1.55]">
      {blocks.map((bl, i) => {
        switch (bl.kind) {
          case "text":
            return <Fragment key={i}>{renderMarkdown(bl.text, `s${i}`, olCounter)}</Fragment>;
          case "objs":
            return <PlaceCards key={i} slugs={bl.slugs} />;
          case "route":
            return <RouteSuggest key={i} slugs={bl.slugs} title={bl.title} />;
          case "chips":
            return <Chips key={i} options={bl.options} onPick={onPick} disabled={!interactive} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

/** Повідомлення про помилку (немає зв'язку, забагато запитів). */
export function AnswerError({ content }: { content: string }) {
  return (
    <p className="flex items-start gap-2.5 rounded-[16px] bg-o-wine/[0.06] px-4 py-3 text-[14.5px] leading-snug text-o-wine ring-1 ring-o-wine/15">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {content}
    </p>
  );
}

/* ── Картки місць ─────────────────────────────────────────────────────── */

function useWhere() {
  const { tl } = useV2();
  const { data } = useHierarchySnapshot();
  return (o: TourismObject) => {
    const city = o.cityId ? data?.cities.find((c) => c.id === o.cityId) : undefined;
    const d = data?.districts.find((x) => x.id === o.districtId);
    // Пункт, а якщо його немає — район (обидва разом часто повторюються: «Білгород-Дністровський · Білгород-Дністровський район»).
    return city ? tl(city.name, city.nameEn) : d ? tl(d.name, d.nameEn) : "";
  };
}

function PlaceCards({ slugs }: { slugs: string[] }) {
  const { data } = useHierarchySnapshot();
  const list = slugs.map((s) => data?.objects.find((o) => o.slug === s && o.published)).filter((o): o is TourismObject => Boolean(o));
  if (!list.length) return null;
  return (
    <ul className={`grid gap-2.5 ${list.length > 1 ? "sm:grid-cols-2" : "max-w-[440px]"}`}>
      {list.map((o) => (
        <li key={o.id}>
          <PlaceCard o={o} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Невелика картка місця: фото, вид (винним), назва, де це. Уся картка — посилання,
 * а ♡ поверх неї додає місце в «Мій маршрут».
 */
function PlaceCard({ o }: { o: TourismObject }) {
  const { tl, lang } = useV2();
  const where = useWhere();
  const name = tl(o.name, o.nameEn);
  const kind = o.tourismTypes?.[0] ? typeName(o.tourismTypes[0], lang) : objectTypeLabel(o.type, lang);
  const place = where(o);
  return (
    <article className="group relative flex h-full items-center gap-3 rounded-[16px] bg-[#fffaf5] p-2 pr-11 text-o-sea shadow-[0_14px_28px_-24px_rgba(0,10,30,0.6)] ring-1 ring-o-sea/[0.07] transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_34px_-24px_rgba(0,10,30,0.6)]">
      <span className="h-[76px] w-[84px] shrink-0 overflow-hidden rounded-[12px] bg-o-sea/10">
        <Img src={o.imageUrl} w={200} alt="" className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" />
      </span>
      <span className="min-w-0 flex-1 py-0.5">
        <span className="block truncate text-[10.5px] font-semibold uppercase tracking-[0.12em] text-o-wine/80">{kind}</span>
        <Link to={objectDetailPath(o.type, o.slug)} className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug transition-colors after:absolute after:inset-0 after:rounded-[16px] group-hover:text-o-wine">
          {name}
        </Link>
        {place && (
          <span className="mt-0.5 flex items-center gap-1 text-[12px] leading-tight text-o-sea/55">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{place}</span>
          </span>
        )}
      </span>
      <TripButton id={o.id} size="sm" className="absolute right-2.5 top-2.5" />
      <ArrowUpRight className="absolute bottom-3 right-3.5 h-4 w-4 text-o-wine opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
    </article>
  );
}

/* ── Запропонований маршрут ───────────────────────────────────────────── */

/**
 * Маршрут ([[route: slug1, slug2 | Назва]]): зупинки кружечками-фото на
 * пунктирі з номерами, «Скласти маршрут» додає всі в «Мій маршрут» і веде на
 * карту маршруту (/marshrut).
 */
function RouteSuggest({ slugs, title }: { slugs: string[]; title: string }) {
  const { t, tl } = useV2();
  const { add } = useBasket();
  const navigate = useNavigate();
  const where = useWhere();
  const { data } = useHierarchySnapshot();
  const list = slugs.map((s) => data?.objects.find((o) => o.slug === s && o.published)).filter((o): o is TourismObject => Boolean(o));
  if (list.length < 2) return null;

  const build = () => {
    list.forEach((o) => add(o.id));
    navigate("/marshrut");
  };

  return (
    <section className="max-w-[560px] rounded-[20px] bg-[#fffaf5] p-4 text-o-sea shadow-[0_18px_34px_-26px_rgba(0,10,30,0.6)] ring-1 ring-o-sea/[0.07] sm:p-5">
      <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-o-wine">
        <RouteIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {t("asRoute")}
        <span className="text-o-sea/40">· {list.length} {plural(list.length, t("asStopsN"))}</span>
      </p>
      {title && <p className="mt-1.5 text-[19px] font-bold leading-tight tracking-[-0.01em]">{title}</p>}

      <ol className="relative mt-4">
        {list.map((o, i) => (
          <li key={o.id} className="relative flex items-center gap-3 pb-4 last:pb-0">
            {/* Пунктир між зупинками — через центри кружечків */}
            {i < list.length - 1 && <span className="absolute bottom-0 left-[21px] top-[44px] border-l-2 border-dotted border-o-wine/45" aria-hidden="true" />}
            <span className="relative shrink-0">
              <span className="block h-11 w-11 overflow-hidden rounded-full bg-o-sea/10 ring-2 ring-[#fffaf5]">
                <Img src={o.imageUrl} w={120} alt="" className="h-full w-full object-cover" />
              </span>
              <span className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-o-wine text-[10.5px] font-bold text-o-sand ring-2 ring-[#fffaf5]">{i + 1}</span>
            </span>
            <span className="min-w-0">
              <Link to={objectDetailPath(o.type, o.slug)} className="line-clamp-1 text-[14.5px] font-bold leading-tight hover:text-o-wine">
                {tl(o.name, o.nameEn)}
              </Link>
              {where(o) && <span className="mt-0.5 block truncate text-[12px] text-o-sea/55">{where(o)}</span>}
            </span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={build}
        className="group mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-o-wine pl-5 pr-2 text-[14.5px] font-semibold text-o-sand transition-colors hover:bg-o-winedeep"
      >
        {t("asBuild")}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-o-sand/15 transition-transform group-hover:translate-x-0.5">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>
    </section>
  );
}

/* ── Підказки-відповіді ───────────────────────────────────────────────── */

function Chips({ options, onPick, disabled }: { options: string[]; onPick: (text: string) => void; disabled?: boolean }) {
  if (!options.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onPick(opt)}
          className="rounded-full bg-[#fffaf5] px-3.5 py-1.5 text-[13.5px] font-medium text-o-sea ring-1 ring-o-sea/15 transition-colors hover:text-o-wine hover:ring-o-wine/45 disabled:pointer-events-none disabled:opacity-45"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/** «Друкує…»: три крапки, що блимають (.typing у v2.css), і тихий підпис. */
export function Typing({ label }: { label: string }) {
  const dot = "bg-o-wine";
  return (
    <span className="inline-flex items-center gap-3" role="status">
      <span className="typing flex gap-1.5" aria-hidden="true">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className={`h-2 w-2 rounded-full ${dot}`} />
      </span>
      <span className="text-[13.5px] text-o-sea/55">{label}…</span>
    </span>
  );
}
