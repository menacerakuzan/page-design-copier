import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowDown, ArrowUpRight, Calendar, Check, ChevronRight, Clock, Globe, Heart, Link2, MapPin, Navigation, Phone, QrCode, Share2, Sparkles,
} from "lucide-react";
import { Img } from "@/components/Img";
import { PlaceTile, usePlaceSnippet } from "@/v2/components/PlaceTile";
import { AudioGuidePlayer } from "@/components/AudioGuidePlayer";
import { ReelVideo } from "@/components/ReelVideo";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { useBasket } from "@/lib/basketContext";
import { objectDetailPath } from "@/lib/entityLinks";
import { parseRepertoire } from "@/lib/repertoire";
import { kyivToday } from "@/lib/eventArchive";
import { plain, useV2 } from "@/v2/i18n";
import { EASE, Reveal } from "@/v2/components/ui";
import { DISTRICT_SHAPES, shapeBox } from "@/v2/lib/districtShapes";
import { upcomingShows } from "@/v2/lib/afisha";
import { BlockHead, ExtraSection, RichText, RoutesCompact, typeName, useSectionTitle } from "@/v2/district/parts";
import type { NearPlace, Photo, PlacePageData } from "./usePlacePage";

/* ── Підписи ───────────────────────────────────────────────────────────── */

const KIND_INDEX = { attraction: 0, event: 1, restaurant: 2, hotel: 3 } as const;

/** Підпис над назвою: перший вид туризму («Історико-культурний») або вид об'єкта («Подія»). */
export function useKicker(data: PlacePageData) {
  const { list, lang } = useV2();
  const first = data.o?.tourismTypes?.[0];
  return first ? typeName(first, lang) : list("placeKinds")[KIND_INDEX[data.type]];
}

/** Одещина › Райони › Район › Пункт › Місце */
export function PlaceCrumbs({ data, light = false, className = "" }: { data: PlacePageData; light?: boolean; className?: string }) {
  const { t } = useV2();
  const base = light ? "text-o-sand/80" : "text-o-sea/55";
  const hover = light ? "hover:text-o-sand" : "hover:text-o-wine";
  const sep = <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />;
  return (
    <nav aria-label="breadcrumb" className={`flex flex-wrap items-center gap-1 text-[13px] ${base} ${className}`}>
      <Link to="/" className={`transition-colors ${hover}`}>Одещина</Link>
      {sep}
      <Link to="/districts" className={`hidden transition-colors sm:inline ${hover}`}>{t("navDistricts")}</Link>
      <span className="hidden sm:contents">{sep}</span>
      {data.district && (
        <>
          <Link to={`/raion/${data.district.slug}`} className={`transition-colors ${hover}`}>{data.district.short}</Link>
          {sep}
        </>
      )}
      {data.city && (
        <>
          <Link to={`/napryamky/${data.city.slug}`} className={`transition-colors ${hover}`}>{data.cityName}</Link>
          {sep}
        </>
      )}
      <span className={`max-w-[60vw] truncate ${light ? "text-o-sand/90" : "text-o-sea/80"}`} aria-current="page">{data.name}</span>
    </nav>
  );
}

/** Види туризму пігулками — ведуть на сторінку виду. */
export function TypePills({ data, light = false, className = "", skipFirst = false }: { data: PlacePageData; light?: boolean; className?: string; skipFirst?: boolean }) {
  const { lang } = useV2();
  // skipFirst — перший вид уже написано великим поруч (коли немає підзаголовка), не повторюємо
  const types = (data.o?.tourismTypes ?? []).slice(skipFirst ? 1 : 0);
  if (!types.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {types.map((tt) => (
        <li key={tt}>
          <Link
            to={`/types?type=${encodeURIComponent(tt)}`}
            className={`inline-flex rounded-full px-3 py-1 text-[12.5px] font-semibold transition-colors ${light ? "bg-o-sand/15 text-o-sand hover:bg-o-sand/25" : "bg-o-wine/[0.08] text-o-wine hover:bg-o-wine/15"}`}
          >
            {typeName(tt, lang)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/* ── Дії ───────────────────────────────────────────────────────────────── */

/** Посилання «Як дістатися»: навігація до координат, інакше — посилання на карту з адмінки. */
export function directionsUrl(data: PlacePageData) {
  if (data.coords) return `https://www.google.com/maps/dir/?api=1&destination=${data.coords.lat},${data.coords.lng}`;
  return data.o?.mapUrl || "";
}

/** Велика кнопка «В мій маршрут» / «У маршруті ✓». */
export function TripPill({ id, light = false, className = "" }: { id: string; light?: boolean; className?: string }) {
  const { t } = useV2();
  const { has, toggle } = useBasket();
  const on = has(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={on}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-semibold transition-colors ${
        on ? "bg-o-wine text-o-sand" : light ? "bg-o-sand text-o-sea hover:bg-o-sunsoft" : "bg-o-wine text-o-sand hover:bg-o-winedeep"
      } ${className}`}
    >
      {on ? <Check className="h-[18px] w-[18px]" aria-hidden="true" /> : <Heart className="h-[18px] w-[18px]" aria-hidden="true" />}
      {on ? t("tripIn") : t("tripAdd")}
    </button>
  );
}

/** Поділитися: системне меню (телефон) або копіювання посилання. */
export function useShare(title: string) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* скасовано */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* буфер недоступний */
    }
  };
  return { share, copied };
}

/** QR-постер місця (той самий, що в адмінці): генератор вантажиться лише після кліку. */
function useQr(data: PlacePageData) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (busy || !data.o) return;
    setBusy(true);
    try {
      const [{ posterItemFromObject }, { downloadPosterPng }] = await Promise.all([import("@/lib/qrPoster/item"), import("@/lib/qrPoster/export")]);
      await downloadPosterPng(posterItemFromObject(data.o, data.snap?.cities, data.snap?.districts));
    } catch {
      /* без canvas — кнопка просто повернеться */
    } finally {
      setBusy(false);
    }
  };
  return { run, busy };
}

/**
 * Ряд дій: «В мій маршрут» (головна), «Як дістатися» і круглі «Поділитися» / QR.
 * light — над фото (світлі кнопки), інакше — на пісочному.
 */
export function Actions({ data, light = false, className = "", stretch = false, extra }: { data: PlacePageData; light?: boolean; className?: string; stretch?: boolean; extra?: React.ReactNode }) {
  const { t } = useV2();
  const { share, copied } = useShare(data.name);
  const qr = useQr(data);
  const dir = directionsUrl(data);
  const round = `relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
    light ? "bg-o-sand/15 text-o-sand ring-1 ring-o-sand/30 hover:bg-o-sand/25" : "bg-o-sea/[0.06] text-o-sea hover:bg-o-wine/10 hover:text-o-wine"
  }`;
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <TripPill id={data.o!.id} light={light} className={stretch ? "flex-1" : ""} />
      {dir && (
        <a
          href={dir}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex h-12 items-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-colors ${
            light ? "text-o-sand ring-1 ring-o-sand/40 hover:bg-o-sand/15" : "text-o-sea ring-1 ring-o-sea/20 hover:text-o-wine hover:ring-o-wine/40"
          } ${stretch ? "flex-1 justify-center" : ""}`}
        >
          <Navigation className="h-[17px] w-[17px]" aria-hidden="true" />
          {t("directions")}
        </a>
      )}
      <button type="button" onClick={share} className={round} aria-label={t("share")} title={t("share")}>
        {copied ? <Link2 className="h-[18px] w-[18px]" aria-hidden="true" /> : <Share2 className="h-[18px] w-[18px]" aria-hidden="true" />}
        <span className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-o-sea px-3 py-1 text-[12px] font-semibold text-o-sand transition-opacity ${copied ? "opacity-100" : "opacity-0"}`} role="status">
          {copied ? t("copied") : ""}
        </span>
      </button>
      <button type="button" onClick={qr.run} disabled={qr.busy} className={`${round} disabled:opacity-50`} aria-label={t("qrPoster")} title={t("qrPoster")}>
        <QrCode className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
      {extra}
    </div>
  );
}

/* ── Паспорт місця ─────────────────────────────────────────────────────── */

/** Години роботи з бази — довільний текст; розбиваємо на рядки за «/», «;» чи кількома пробілами. */
export const hoursLines = (h: string) =>
  h.split(/\s*[/;\n]\s*|\s{3,}/).map((x) => x.trim()).filter(Boolean);

/** Рядки паспорта — лише заповнені. */
export function usePassport(data: PlacePageData) {
  const { t, tl } = useV2();
  const o = data.o!;
  const rows: { key: string; icon: React.ReactNode; label: string; value: React.ReactNode }[] = [];
  const icon = (I: typeof MapPin) => <I className="h-[18px] w-[18px]" aria-hidden="true" />;
  const address = tl(o.address, o.addressEn);
  if (o.type === "event" && o.eventDates) rows.push({ key: "dates", icon: icon(Calendar), label: t("pDates"), value: o.eventDates });
  if (address || data.cityName)
    rows.push({
      key: "addr",
      icon: icon(MapPin),
      label: t("pAddress"),
      value: address || data.cityName,
    });
  const hours = tl(o.hours, o.hoursEn);
  if (hours)
    rows.push({
      key: "hours",
      icon: icon(Clock),
      label: t("pHours"),
      value: (
        <span className="flex flex-col">
          {hoursLines(hours).map((l) => (
            <span key={l}>{l}</span>
          ))}
        </span>
      ),
    });
  if (o.phone)
    rows.push({
      key: "phone",
      icon: icon(Phone),
      label: t("pPhone"),
      value: (
        <span className="flex flex-col">
          {o.phone.split(/[,;]\s*/).map((p) => (
            <a key={p} href={`tel:${p.replace(/[^\d+]/g, "")}`} className="transition-colors hover:text-o-wine">{p}</a>
          ))}
        </span>
      ),
    });
  // У частини записів у БД перед посиланням зайві пробіли (виходило «%20https»)
  const website = (o.website || "").trim().replace(/^%20+/, "");
  if (website) {
    let host = website;
    try {
      host = new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace(/^www\./, "");
    } catch {
      /* лишаємо як є */
    }
    rows.push({
      key: "site",
      icon: icon(Globe),
      label: t("pSite"),
      value: (
        <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline decoration-o-wine/30 underline-offset-4 transition-colors hover:text-o-wine">
          {host}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      ),
    });
  }
  const amen = tl(o.amenities, o.amenitiesEn);
  if (amen) rows.push({ key: "amen", icon: icon(Sparkles), label: t("pAmenities"), value: amen });
  if (data.km !== null && data.km > 1) rows.push({ key: "km", icon: icon(Navigation), label: t("pDistance"), value: `≈ ${data.km} ${t("kmUnit")}` });
  return rows;
}

/** Паспорт списком: іконка · підпис · значення; рядки розділені тонкою лінією. */
export function PassportList({ data, className = "" }: { data: PlacePageData; className?: string }) {
  const rows = usePassport(data);
  if (!rows.length) return null;
  return (
    <dl className={`divide-y divide-o-sea/10 ${className}`}>
      {rows.map((r) => (
        <div key={r.key} className="flex gap-3.5 py-3.5 first:pt-0 last:pb-0">
          <span className="mt-0.5 text-o-wine">{r.icon}</span>
          <div className="min-w-0 flex-1">
            <dt className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-o-sea/50">{r.label}</dt>
            <dd className="mt-0.5 break-words text-[15px] leading-snug text-o-sea">{r.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

/* ── Опис і медіа ──────────────────────────────────────────────────────── */

const unescape = (h: string) => (h.includes("&lt;") ? h.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"') : h);

/** Короткий і детальний опис (HTML з адмінки), розекрановані. */
export function usePlaceHtml(data: PlacePageData) {
  const { tl } = useV2();
  const o = data.o!;
  return {
    short: unescape(tl(o.description, o.descriptionEn) ?? ""),
    more: unescape(tl(o.detailedInfo, o.detailedInfoEn) ?? ""),
  };
}

/** Опис: короткий видно (clamp рядків), «Читати більше» відкриває решту й детальний. */
export function PlaceText({ data, clamp, className = "", textClass = "text-[17px] leading-[1.7] sm:text-[18.5px]", flow = false, onOpenChange }: {
  data: PlacePageData;
  clamp?: number;
  className?: string;
  textClass?: string;
  /**
   * flow — короткий і детальний опис одним потоком: згорнутий текст показує
   * перші clamp рядків разом із початком детального (а не лише короткий опис).
   */
  flow?: boolean;
  /** Повідомити сторінку, що текст розгорнуто/згорнуто (напр. щоб увімкнути «прилипання» колонок). */
  onOpenChange?: (open: boolean) => void;
}) {
  const { t } = useV2();
  const { short, more } = usePlaceHtml(data);
  const [open, setOpenState] = useState(false);
  const setOpen = (f: (v: boolean) => boolean) =>
    setOpenState((v) => {
      const next = f(v);
      onOpenChange?.(next);
      return next;
    });
  const clamped: React.CSSProperties | undefined =
    clamp && !open ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: clamp, overflow: "hidden" } : undefined;
  if (!short && !more) return null;
  const button = (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-o-wine underline decoration-o-wine/30 underline-offset-4 transition-colors hover:decoration-o-wine"
    >
      {open ? t("readLess") : t("readMore")}
    </button>
  );
  if (flow) {
    const all = [short, more].filter(Boolean).join("");
    return (
      <div className={className}>
        <RichText html={all} className={`${textClass} text-o-sea/85`} style={clamped} />
        {(more || (clamp && plain(all).length > 520)) && button}
      </div>
    );
  }
  return (
    <div className={className}>
      <RichText html={short || more} className={`${textClass} text-o-sea/85`} style={clamped} />
      {short && more && (
        <motion.div initial={false} animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.5, ease: EASE }} className="overflow-hidden">
          <RichText html={more} className={`mt-4 ${textClass} text-o-sea/75`} />
        </motion.div>
      )}
      {((short && more) || (clamp && plain(short).length > 420)) && button}
    </div>
  );
}

export function PlaceAudio({ data, className = "" }: { data: PlacePageData; className?: string }) {
  const { tl } = useV2();
  const src = tl(data.o?.audioUrl, data.o?.audioUrlEn);
  if (!src) return null;
  return (
    <div className={`max-w-[560px] ${className}`}>
      <AudioGuidePlayer src={src} accent="#9f1f47" />
    </div>
  );
}

export function PlaceReel({ data, className = "w-[220px]" }: { data: PlacePageData; className?: string }) {
  const [muted, setMuted] = useState(true);
  if (!data.o?.reelUrl) return null;
  return (
    <div className={`relative aspect-[9/16] shrink-0 overflow-hidden rounded-[20px] bg-o-deep shadow-[0_24px_40px_-24px_rgba(0,10,30,0.7)] ${className}`}>
      <ReelVideo src={data.o.reelUrl} muted={muted} onToggleMute={() => setMuted((m) => !m)} emblemSize={120} />
    </div>
  );
}

/* ── Галерея ───────────────────────────────────────────────────────────── */

/** Перегляд фото на весь екран: open(i) відкриває, node — сам переглядач. */
export function useLightbox(photos: Photo[]) {
  const [index, setIndex] = useState<number | null>(null);
  const images = useMemo(() => photos.map((p) => ({ url: p.url, title: p.title })), [photos]);
  return {
    open: (i: number) => setIndex(i),
    node: <GalleryLightbox images={images} index={index} onClose={() => setIndex(null)} onNavigate={setIndex} />,
  };
}

/* ── Район із точкою місця ─────────────────────────────────────────────── */

/** Чи лежить точка (одиниці карти) всередині контуру району. */
function inShape(slug: string, xy: [number, number]) {
  if (typeof document === "undefined") return true;
  const ctx = document.createElement("canvas").getContext("2d");
  return !ctx || ctx.isPointInPath(new Path2D(DISTRICT_SHAPES[slug].d), xy[0], xy[1]);
}

/** Контур району тонкою винною лінією, місце — винна точка з хвилею. Веде на сторінку району. */
export function DistrictPin({ data, className = "w-[180px]", compact = false }: { data: PlacePageData; className?: string; compact?: boolean }) {
  const { lang } = useV2();
  const slug = data.district?.slug;
  const box = slug ? shapeBox(slug) : undefined;
  if (!slug || !box) return null;
  const fw = Math.max(box.w, box.h * 0.8) * 1.1;
  const fh = Math.max(box.h, fw / 2.2 / 1.1) * 1.1;
  const vx = box.x + box.w / 2 - fw / 2;
  const vy = box.y + box.h / 2 - fh / 2;
  const dot = data.xy && inShape(slug, data.xy);
  const shape = (
    <span className={`relative block ${compact ? "h-14 w-14 shrink-0" : ""}`} style={compact ? undefined : { aspectRatio: `${fw} / ${fh}` }}>
      <svg viewBox={`${vx} ${vy} ${fw} ${fh}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <path d={DISTRICT_SHAPES[slug].d} fill="rgba(159,31,71,0.06)" stroke="#9f1f47" strokeOpacity={0.7} strokeWidth={compact ? 1.2 : 1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="transition-[fill] group-hover:fill-[rgba(159,31,71,0.12)]" />
        {/* У компактному вигляді точка — всередині SVG (кадр не квадратний, відсотки не збігаються) */}
        {compact && dot && <circle cx={data.xy![0]} cy={data.xy![1]} r={Math.max(fw, fh) * 0.045} fill="#9f1f47" stroke="#fff2e8" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />}
      </svg>
      {!compact && dot && (
        <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${((data.xy![0] - vx) / fw) * 100}%`, top: `${((data.xy![1] - vy) / fh) * 100}%` }}>
          <span className="ping-soft absolute inset-0 rounded-full bg-o-wine" aria-hidden="true" />
          <span className="relative block h-3.5 w-3.5 rounded-full border-2 border-o-sand bg-o-wine" />
        </span>
      )}
    </span>
  );
  // Компактно: рядок «силует з точкою · Район / Назва ›» — для бокового паспорта.
  if (compact) {
    return (
      <Link to={`/raion/${slug}`} className={`group flex items-center gap-3.5 ${className}`}>
        {shape}
        <span className="min-w-0">
          <span className="block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-o-sea/50">{lang === "en" ? "District" : "Район"}</span>
          <span className="block text-[15px] leading-snug text-o-sea transition-colors group-hover:text-o-wine">
            {/* Останнє слово разом зі стрілкою — щоб стрілка не переносилась сама */}
            {data.district!.name.split(" ").slice(0, -1).join(" ")}{" "}
            <span className="whitespace-nowrap">
              {data.district!.name.split(" ").slice(-1)[0]}
              <ChevronRight className="ml-0.5 inline h-3.5 w-3.5 -translate-y-px" aria-hidden="true" />
            </span>
          </span>
        </span>
      </Link>
    );
  }
  return (
    <Link to={`/raion/${slug}`} className={`group block ${className}`} aria-label={data.district!.name}>
      <span className="relative block" style={{ aspectRatio: `${fw} / ${fh}` }}>
        <svg viewBox={`${vx} ${vy} ${fw} ${fh}`} className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
          <path d={DISTRICT_SHAPES[slug].d} fill="rgba(159,31,71,0.06)" stroke="#9f1f47" strokeOpacity={0.7} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" className="transition-[fill] group-hover:fill-[rgba(159,31,71,0.12)]" />
        </svg>
        {/* Точка — лише якщо координати справді в межах контуру району (у частини місць у БД вони хибні) */}
        {data.xy && inShape(slug, data.xy) && (
          <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${((data.xy[0] - vx) / fw) * 100}%`, top: `${((data.xy[1] - vy) / fh) * 100}%` }}>
            <span className="ping-soft absolute inset-0 rounded-full bg-o-wine" aria-hidden="true" />
            <span className="relative block h-3.5 w-3.5 rounded-full border-2 border-o-sand bg-o-wine" />
          </span>
        )}
      </span>
      <span className="mt-2 flex items-center justify-center gap-1 text-[12.5px] font-semibold text-o-sea/60 transition-colors group-hover:text-o-wine">
        {data.district!.name}
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    </Link>
  );
}

/**
 * Карта OpenStreetMap навколо місця (лише якщо є координати), притишена під
 * кремову палітру фільтром. Поверх — «Як дістатися».
 */
export function PlaceMap({ data, className = "" }: { data: PlacePageData; className?: string }) {
  const { t } = useV2();
  if (!data.coords) return null;
  const { lat, lng } = data.coords;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.018},${lat - 0.01},${lng + 0.018},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div className={`relative overflow-hidden rounded-[22px] bg-o-sea/10 ring-1 ring-o-sea/10 ${className}`}>
      <iframe
        src={src}
        title={`${t("onMap")}: ${data.name}`}
        loading="lazy"
        className="h-full w-full border-0 [filter:grayscale(0.55)_sepia(0.22)_saturate(1.1)_contrast(0.96)]"
      />
      <a
        href={directionsUrl(data)}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-o-sand px-4 py-2.5 text-[14px] font-semibold text-o-sea shadow-[0_10px_24px_-12px_rgba(0,20,50,0.6)] transition-colors hover:bg-o-wine hover:text-o-sand"
      >
        <Navigation className="h-4 w-4" aria-hidden="true" />
        {t("directions")}
      </a>
    </div>
  );
}

/** Блок «На карті»: велика карта + район із точкою поруч. */
export function MapBlock({ data, pin = true }: { data: PlacePageData; pin?: boolean }) {
  const { t } = useV2();
  if (!data.coords) return null;
  if (!pin) {
    return (
      <section aria-labelledby="place-map" className="mx-auto max-w-[1280px] px-5 py-10 sm:px-10 sm:py-14">
        <BlockHead id="place-map" kicker={data.cityName || data.district?.short} title={t("onMap")} className="[&_h2]:!text-[24px] sm:[&_h2]:!text-[30px]" />
        <Reveal className="mt-6" y={16}>
          <PlaceMap data={data} className="h-[300px] sm:h-[420px]" />
        </Reveal>
      </section>
    );
  }
  return (
    <section aria-labelledby="place-map" className="mx-auto max-w-[1280px] px-5 py-10 sm:px-10 sm:py-14">
      <BlockHead id="place-map" kicker={data.cityName || data.district?.short} title={t("onMap")} className="[&_h2]:!text-[24px] sm:[&_h2]:!text-[30px]" />
      <Reveal className="mt-6 grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_220px]" y={16}>
        <PlaceMap data={data} className="h-[300px] sm:h-[400px]" />
        <DistrictPin data={data} className="mx-auto w-[180px] md:w-full" />
      </Reveal>
    </section>
  );
}

/* ── Репертуар (події) ─────────────────────────────────────────────────── */

/**
 * Репертуар закладу — винна панель, як афіша на головній: найближчі вистави
 * рядками «дата · назва · час». Якщо найближчих немає (репертуар минулого
 * місяця) — увесь репертуар, приглушено.
 */
export function Repertoire({ data }: { data: PlacePageData }) {
  const { t, lang } = useV2();
  const o = data.o!;
  const today = kyivToday();
  const locale = lang === "en" ? "en-GB" : "uk-UA";
  const fmt = (iso: string, opt: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...opt, timeZone: "Europe/Kyiv" }).format(new Date(`${iso}T12:00:00Z`));
  const upcoming = useMemo(() => upcomingShows([o], 62).flatMap((d) => d.shows), [o]);
  const all = useMemo(() => (o.repertoire ? parseRepertoire(o.repertoire) : []), [o.repertoire]);
  if (!o.repertoire?.trim() || (!upcoming.length && !all.length)) return null;
  const past = !upcoming.length;
  const rows = past
    ? all.map((r, i) => ({ key: `${i}`, day: r.date, wd: "", title: r.title, time: r.time }))
    : upcoming.map((s) => ({
        key: s.key,
        day: fmt(s.iso, { day: "numeric" }),
        wd: `${fmt(s.iso, { month: "short" }).replace(".", "")} · ${s.iso === today ? t("today") : fmt(s.iso, { weekday: "short" })}`,
        title: s.title,
        time: s.time,
      }));
  return (
    <section id="repertoire" aria-labelledby="repertoire-t" className="scroll-mt-24 px-3 py-8 sm:px-6 sm:py-12">
      <div className="grain relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] bg-o-winedeep px-5 py-10 text-o-sand sm:rounded-[36px] sm:px-10 sm:py-12 lg:px-14">
        <div className="pointer-events-none absolute -top-48 left-1/2 h-[540px] w-[1120px] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(223,155,59,0.26),rgba(223,155,59,0.08)_55%,transparent)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1280px]">
          <p className="mb-2.5 flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-o-sun">
            <span className="h-px w-8 bg-o-sun" aria-hidden="true" />
            {t("repertoire")}
          </p>
          <h2 id="repertoire-t" className="flex items-center text-[28px] font-bold leading-[1.02] tracking-[-0.02em] sm:text-[36px] lg:text-[42px]">
            {past ? t("pastShows") : t("upcomingShows")}
            <span className="ml-3 inline-flex items-center rounded-full bg-o-sun px-2.5 py-0.5 text-[14px] font-bold leading-[1.4] tracking-normal text-o-winedeep sm:text-[15px]">{rows.length}</span>
          </h2>
          <ul className={`mt-7 grid gap-x-12 border-t border-o-sand/15 md:grid-cols-2 ${past ? "opacity-60" : ""}`}>
            {rows.map((r) => (
              <li key={r.key} className="grid grid-cols-[76px_1fr_auto] items-center gap-4 border-b border-o-sand/15 py-3.5">
                <span className="flex flex-col leading-tight">
                  <span className="text-[24px] font-extrabold leading-none tabular-nums text-o-sun">{r.day}</span>
                  {r.wd && <span className="mt-1 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-o-sand/55">{r.wd}</span>}
                </span>
                <span className="text-[15.5px] font-bold leading-snug sm:text-[16.5px]">{r.title}</span>
                <span className="text-[15px] font-semibold tabular-nums text-o-sand/80">{r.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ── Подія: позначка на першому екрані ─────────────────────────────────── */

/**
 * Для події — рядок унизу фото: позначка «Подія» і що там найближчим часом
 * («Найближча: пн, 16 лист · 18:00 · Магія чотирьох струн» → «Уся програма ↓»).
 * Без репертуару — дати події з бази. Для місць нічого не показує.
 */
export function EventStrip({ data, className = "" }: { data: PlacePageData; className?: string }) {
  const { t, lang } = useV2();
  const o = data.o!;
  const today = kyivToday();
  const shows = useMemo(() => (o.type === "event" && o.repertoire ? upcomingShows([o], 62).flatMap((d) => d.shows) : []), [o]);
  if (o.type !== "event") return null;
  const next = shows[0];
  const fmt = (iso: string) =>
    iso === today ? t("today") : new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "uk-UA", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Kyiv" }).format(new Date(`${iso}T12:00:00Z`)).replace(".", "");
  const when = next ? [fmt(next.iso), next.time].filter(Boolean).join(" · ") : o.eventDates;
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${className}`}>
      <a
        href={shows.length ? "#repertoire" : undefined}
        className="inline-flex items-center gap-1.5 rounded-full bg-o-sun px-3 py-1 text-[12.5px] font-bold uppercase tracking-[0.1em] text-o-winedeep"
      >
        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
        {t("eventBadge")}
      </a>
      {/* Найближчий показ — від планшета; на телефоні лише позначка (веде до програми) */}
      {(next || when) && (
        <p className="hidden min-w-0 text-[14.5px] sm:block text-o-sand/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.45)] sm:text-[15px]">
          {next && <span className="text-o-sand/65">{t("nextShow")}: </span>}
          <span className="font-semibold text-o-sunsoft">{when}</span>
          {next && <span className="font-semibold"> · {next.title}</span>}
        </p>
      )}
      {shows.length > 1 && (
        <a href="#repertoire" className="hidden items-center gap-1 text-[14px] font-semibold sm:inline-flex text-o-sand underline decoration-o-sun underline-offset-4 hover:text-o-sunsoft" aria-label={`${t("allShows")} · ${shows.length}`}>
          +{shows.length - 1}
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

/* ── Подія: «Про подію» ────────────────────────────────────────────────── */

const norm = (x: string) => x.toLowerCase().replace(/[^a-zа-яіїєґ0-9]+/gi, " ").replace(/\b(року|рік|на)\b/g, "").replace(/\s+/g, " ").trim();

/**
 * Опис події з адмінки — здебільшого шаблон «Репертуар листопада 2026 року» +
 * «Придбати квитки: <посилання>». Розбираємо: посилання на квитки — окремо
 * (кнопкою), абзаци, що повторюють підзаголовок, порожні й «квиткові» — геть;
 * лишається справжній текст (якщо він є).
 */
export function useEventParts(data: PlacePageData) {
  const { short, more } = usePlaceHtml(data);
  return useMemo(() => {
    const html = [short, more].filter(Boolean).join("");
    const doc = typeof DOMParser !== "undefined" ? new DOMParser().parseFromString(`<div>${html}</div>`, "text/html") : null;
    let tickets = data.o?.website || "";
    const keep: string[] = [];
    const sub = norm(data.subtitle || "");
    doc?.querySelectorAll("div > p, div > ul, div > ol").forEach((el) => {
      const text = (el.textContent || "").trim();
      const link = el.querySelector("a[href]")?.getAttribute("href") || "";
      if (/квитк|ticket/i.test(text) && link) {
        tickets ||= link;
        return;
      }
      if (!text || (sub && norm(text) === sub) || (sub && sub.startsWith(norm(text)) && norm(text).length > 8)) return;
      keep.push(el.outerHTML);
    });
    return { tickets, text: keep.join("") };
  }, [short, more, data.o?.website, data.subtitle]);
}

/**
 * Місце проведення події — горизонтальна картка: фото місця ліворуч, праворуч
 * «Місце проведення», назва, адреса, коротко про місце й посилання на його сторінку.
 */
export function VenueCard({ data, vertical = false }: { data: PlacePageData; vertical?: boolean }) {
  const { t, tl } = useV2();
  const v = data.venue;
  const snippet = usePlaceSnippet();
  if (!v) return null;
  const name = tl(v.name, v.nameEn);
  const address = tl(v.address, v.addressEn);
  return (
    // vertical — поруч із текстом опису (фото згори, як картка «Практично» у місць); інакше — горизонтально
    <article className={`group relative grid overflow-hidden rounded-[18px] bg-[#fffaf5] shadow-[0_20px_40px_-30px_rgba(0,10,30,0.5)] ring-1 ring-o-sea/[0.06] ${vertical ? "" : "max-w-[760px] sm:grid-cols-[240px_minmax(0,1fr)]"}`}>
      <div className="relative overflow-hidden bg-o-sea/10">
        <Img src={v.imageUrl} w={560} alt="" className={`h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04] ${vertical ? "aspect-[2/1]" : "aspect-[16/9] sm:aspect-auto sm:min-h-[170px]"}`} />
      </div>
      <div className="flex flex-col p-5 sm:px-6 sm:py-5">
        <p className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-o-wine">
          <span className="h-px w-6 bg-o-wine" aria-hidden="true" />
          {t("venue")}
        </p>
        <h3 className="mt-2 text-[17px] font-bold leading-snug [text-wrap:balance] sm:text-[19px]">
          <Link to={objectDetailPath(v.type, v.slug)} className="transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-o-wine">
            {name}
          </Link>
        </h3>
        {address && (
          <p className="mt-1.5 flex items-start gap-1.5 text-[12.5px] font-semibold text-o-wine/85">
            <MapPin className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {address}
          </p>
        )}
        <p className="mt-2 line-clamp-2 text-[13px] leading-[1.5] text-o-sea/60">{snippet(v, name)}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[13px] font-semibold text-o-wine">
          <span className="underline decoration-o-wine/30 underline-offset-4 transition-colors group-hover:decoration-o-wine">{t("aboutVenue")}</span>
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

/* ── Поруч, маршрути, інші блоки ───────────────────────────────────────── */

/** «1,2 км» / «350 м». */
export function useDistance() {
  const { t, lang } = useV2();
  return (km?: number) => {
    if (km === undefined) return "";
    if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} ${lang === "en" ? "m" : "м"}`;
    return `${km < 10 ? km.toFixed(1).replace(".", lang === "en" ? "." : ",") : Math.round(km)} ${t("kmUnit")}`;
  };
}

/** Місце поруч — спільна «Картка» (src/v2/components/PlaceTile.tsx): під назвою — відстань і пункт. */
function NearCard({ p }: { p: NearPlace }) {
  const dist = useDistance();
  return <PlaceTile o={p.o} name={p.name} meta={[p.km !== undefined ? dist(p.km) : "", p.town].filter(Boolean).join(" · ")} icon={p.km !== undefined ? Navigation : MapPin} />;
}

/** «Поруч»: до 8 місць у радіусі 30 км, від найближчого (без координат — з того ж пункту). */
export function Nearby({ data, className = "" }: { data: PlacePageData; className?: string }) {
  const { t } = useV2();
  if (!data.nearby.length) return null;
  const withKm = data.nearby[0].km !== undefined;
  return (
    <section aria-labelledby="place-near" className={`mx-auto max-w-[1280px] px-5 py-10 sm:px-10 sm:py-14 ${className}`}>
      <BlockHead id="place-near" kicker={withKm ? t("nearbyKicker") : data.cityName} title={t("nearby")} count={data.nearby.length} />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {data.nearby.map((p, i) => (
          <Reveal as="li" key={p.o.id} delay={(i % 4) * 0.05} y={18}>
            <NearCard p={p} />
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function PlaceRoutes({ data }: { data: PlacePageData }) {
  const { t } = useV2();
  return <RoutesCompact data={data} title={t("routesThroughPlace")} />;
}

/** Місце проведення події: «Місце проведення: Філармонія →». */
export function VenueLine({ data, className = "", light = false }: { data: PlacePageData; className?: string; light?: boolean }) {
  const { t, tl } = useV2();
  const v = data.venue;
  if (!v) return null;
  return (
    <p className={`flex flex-wrap items-center gap-1.5 text-[14.5px] ${light ? "text-o-sand/80" : "text-o-sea/65"} ${className}`}>
      <MapPin className={`h-4 w-4 ${light ? "text-o-sunsoft" : "text-o-wine"}`} aria-hidden="true" />
      {t("venue")}:
      <Link to={objectDetailPath(v.type, v.slug)} className={`font-semibold underline underline-offset-4 ${light ? "text-o-sand decoration-o-sun" : "text-o-wine decoration-o-wine/30 hover:decoration-o-wine"}`}>
        {tl(v.name, v.nameEn)}
      </Link>
    </p>
  );
}

/** Рідкісні блоки конструктора (факти, цитата, вільний текст, відео, розділювач) — у порядку конструктора. */
export function PlaceExtras({ data }: { data: PlacePageData }) {
  const titleOf = useSectionTitle();
  const EXTRA = ["stat_strip", "quote", "custom_text", "video", "divider"];
  return (
    <>
      {data.sections
        .filter((s) => EXTRA.includes(s.kind))
        .map((s) => (
          <ExtraSection key={s.id} s={s} data={data} title={titleOf(s)} />
        ))}
    </>
  );
}

/** Чи показувати блок, якщо адмін його вимкнув у конструкторі (за замовчуванням — так). */
export function useShown(data: PlacePageData) {
  return (kind: string) => data.sections.some((s) => s.kind === kind) || !data.sections.length;
}
