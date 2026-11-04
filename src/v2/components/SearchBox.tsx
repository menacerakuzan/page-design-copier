import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Landmark, MapPin, Map, Route as RouteIcon, Search, Sparkles, Ticket } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { loadRoutes } from "@/lib/routesRepository";
import { isEventArchived, kyivToday } from "@/lib/eventArchive";
import { objectDetailPath } from "@/lib/entityLinks";
import { useV2 } from "@/v2/i18n";

type Item = { label: string; sub: string; href: string; kind: "district" | "city" | "place" | "event" | "route" };

const ICONS = { district: Map, city: MapPin, place: Landmark, event: Ticket, route: RouteIcon };

/**
 * Розумний пошук: миттєві підказки з каталогу (райони, міста, місця, події,
 * маршрути), а якщо збігів немає чи питання «людське» — передаємо його AI-гіду.
 */
export function SearchBox({ variant = "hero", autoFocus = false, onNavigate, onClose }: {
  /** compact — маленьке поле внизу екрана: підказки відкриваються вгору. */
  variant?: "hero" | "overlay" | "compact";
  autoFocus?: boolean;
  onNavigate?: () => void;
  /** Escape у порожньому/закритому списку — згорнути поле (для compact). */
  onClose?: () => void;
}) {
  const { t, list, lang, tl } = useV2();
  const navigate = useNavigate();
  const { data: snap } = useHierarchySnapshot();
  const { data: routes } = useQuery({ queryKey: ["routes-published"], queryFn: () => loadRoutes(true) });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // У діалозі фокус спершу ставиться на контейнер (useDialogA11y) — переводимо його в поле.
  useEffect(() => {
    if (!autoFocus) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [autoFocus]);

  const items = useMemo<Item[]>(() => {
    if (!snap) return [];
    const today = kyivToday();
    const district = (id: string) => snap.districts.find((d) => d.id === id);
    const city = (id: string | null) => (id ? snap.cities.find((c) => c.id === id) : undefined);
    return [
      ...snap.districts.map((d) => ({ label: tl(d.name, d.nameEn), sub: lang === "en" ? "District" : "Район", href: `/raion/${d.slug}`, kind: "district" as const })),
      ...snap.cities.map((c) => ({ label: tl(c.name, c.nameEn), sub: tl(district(c.districtId)?.name, district(c.districtId)?.nameEn), href: `/napryamky/${c.slug}`, kind: "city" as const })),
      ...snap.objects
        .filter((o) => o.published && (o.type !== "event" || !isEventArchived(o, today)))
        .map((o) => ({
          label: tl(o.name, o.nameEn),
          sub: tl(city(o.cityId)?.name, city(o.cityId)?.nameEn) || tl(district(o.districtId)?.name, district(o.districtId)?.nameEn),
          href: objectDetailPath(o.type, o.slug),
          kind: o.type === "event" ? ("event" as const) : ("place" as const),
        })),
      ...(routes ?? []).map((r) => ({ label: tl(r.name, r.nameEn), sub: lang === "en" ? "Route" : "Маршрут", href: `/marshruty/${r.id}`, kind: "route" as const })),
    ];
  }, [snap, routes, lang, tl]);

  const query = q.trim().toLowerCase();
  const matches = useMemo(() => {
    if (query.length < 2) return [];
    const seen = new Set<string>();
    return items
      .filter((i) => i.label.toLowerCase().includes(query))
      .sort((a, b) => Number(!a.label.toLowerCase().startsWith(query)) - Number(!b.label.toLowerCase().startsWith(query)))
      .filter((i) => (seen.has(i.label) ? false : (seen.add(i.label), true)))
      .slice(0, 6);
  }, [items, query]);

  const ask = (text: string) => {
    const v = text.trim();
    if (!v) return inputRef.current?.focus();
    onNavigate?.();
    navigate(`/asystent?q=${encodeURIComponent(v)}`);
  };
  const go = (href: string) => {
    onNavigate?.();
    navigate(href);
  };

  // Останній пункт списку — завжди «Запитати AI-гіда».
  const total = matches.length + (query ? 1 : 0);
  const showList = open && query.length > 0;

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % Math.max(total, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? total - 1 : a - 1)); }
    else if (e.key === "Escape") {
      if (showList) { setOpen(false); setActive(-1); } else onClose?.();
    }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && active < matches.length) go(matches[active].href);
      else ask(q);
    }
  };

  const hero = variant === "hero";
  const compact = variant === "compact";

  return (
    <div className="w-full">
      <div className="relative">
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); ask(q); }}
        className={`flex items-center gap-2 rounded-full transition-shadow duration-300 ${compact ? "p-1" : "p-1.5"} ${
          compact
            ? "bg-o-sand shadow-[0_10px_24px_-8px_rgba(0,10,30,0.5)]"
            : hero
            ? "bg-o-sand/95 shadow-[0_20px_60px_-20px_rgba(0,10,30,0.6)] backdrop-blur-md focus-within:shadow-[0_0_0_4px_rgba(223,155,59,0.55),0_20px_60px_-20px_rgba(0,10,30,0.6)]"
            : "bg-o-shell ring-1 ring-o-sea/10 focus-within:ring-2 focus-within:ring-o-sun"
        }`}
      >
        {compact && onClose ? (
          // Лупа на тому ж місці, де була кнопка, — повторний клік згортає поле.
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-o-sea transition-colors hover:bg-o-sea/[0.08]"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <Search className="ml-4 h-5 w-5 shrink-0 text-o-sea/50" aria-hidden="true" />
        )}
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKey}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchHint")}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className={`min-w-0 flex-1 bg-transparent text-o-sea placeholder:text-o-sea/45 focus:outline-none ${compact ? "py-2 text-[15px]" : "py-3 text-[16px]"}`}
          style={{ outline: "none" }}
        />
        {compact ? (
          <button type="submit" aria-label={t("searchGo")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-o-wine text-o-sand transition-colors hover:bg-o-sea">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-o-wine px-4 py-3 text-[15px] font-semibold text-o-sand transition-colors hover:bg-o-sea sm:px-6"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("searchGo")}</span>
          </button>
        )}
      </form>

      <AnimatePresence>
        {showList && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: compact ? 6 : -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: compact ? 6 : -6 }}
            transition={{ duration: 0.18 }}
            className={`absolute inset-x-0 z-40 ${compact ? "bottom-[calc(100%+10px)]" : "top-[calc(100%+10px)]"} overflow-hidden rounded-[26px] bg-o-shell p-2 text-left text-o-sea shadow-[0_30px_70px_-25px_rgba(0,20,50,0.55)] ring-1 ring-o-sea/10`}
          >
            {matches.map((m, i) => {
              const Icon = ICONS[m.kind];
              return (
                <li
                  key={m.href}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={active === i}
                  onMouseDown={(e) => { e.preventDefault(); go(m.href); }}
                  onMouseEnter={() => setActive(i)}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 ${active === i ? "bg-o-sand2" : ""}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-o-sand2 text-o-wine"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{m.label}</span>
                    {m.sub && <span className="block truncate text-[13px] text-o-sea/55">{m.sub}</span>}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-o-sea/35" aria-hidden="true" />
                </li>
              );
            })}
            {query && (
              <li
                id={`${listId}-${matches.length}`}
                role="option"
                aria-selected={active === matches.length}
                onMouseDown={(e) => { e.preventDefault(); ask(q); }}
                onMouseEnter={() => setActive(matches.length)}
                className={`mt-1 flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 ${active === matches.length ? "bg-o-sea text-o-sand" : "bg-o-sea/[0.06]"}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-o-wine text-o-sand"><Sparkles className="h-4 w-4" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] opacity-70">{matches.length ? t("searchAsk") : t("searchEmpty")}</span>
                  <span className="block truncate text-[15px] font-semibold">«{q.trim()}»</span>
                </span>
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
      </div>

      {hero && (
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          {list("chips").map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => ask(c)}
              className="shrink-0 rounded-full border border-o-sand/35 bg-o-deep/20 px-4 py-2 text-[14px] text-o-sand backdrop-blur-sm transition-colors hover:border-o-sun hover:bg-o-sun hover:text-o-deep"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
