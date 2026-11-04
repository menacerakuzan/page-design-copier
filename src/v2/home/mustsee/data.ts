import { useMemo } from "react";
import { usePageContentCards } from "@/hooks/usePageContentCards";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { plain, useV2 } from "@/v2/i18n";

export type SeeItem = { id: string; title: string; place: string; text: string; image: string; href?: string; objectId?: string };

/** Порядок у каруселі (за адресою сторінки): ці — першими, ці — в кінці, решта — між ними. */
const FIRST = ["/mistse/plyazh-zolotyy-bereh", "/mistse/natsionalnyy-pryrodnyy-park-tuzlovski-lymany", "/mistse/zolota-nyva", "/mistse/frumushyka-nova"];
const LAST = ["/mistse/lanzheron"];
const rank = (href?: string) => {
  const f = FIRST.findIndex((h) => href?.startsWith(h));
  if (f >= 0) return f - FIRST.length;
  return LAST.some((h) => href?.startsWith(h)) ? 1 : 0;
};

/** «Цікаве» + «Пам'ятки» з конструктора головної — без дублів. */
export function useSeeItems(): SeeItem[] {
  const { tl } = useV2();
  const { data: cards } = usePageContentCards("index");
  const { data: snap } = useHierarchySnapshot();
  return useMemo(() => {
    // Якщо в картці не вказано, де місце, — беремо адресу самого місця
    // (район і населений пункт, без вулиці).
    const objAddress = (id: unknown) => {
      const o = typeof id === "string" ? snap?.objects.find((x) => x.id === id) : undefined;
      const a = tl(o?.address, o?.addressEn) ?? "";
      return a.split(",").slice(0, 2).map((x) => x.trim().replace(/\s+-\s+/g, "-")).filter(Boolean).join(", ");
    };
    const seen = new Set<string>();
    return (cards ?? [])
      .filter((c) => ["interesting-featured", "interesting", "attractions"].includes(c.sectionKey) && c.cardType !== "text" && c.imageUrl)
      .filter((c) => { const k = c.href ?? c.id; if (seen.has(k)) return false; seen.add(k); return true; })
      .map((c) => ({
        id: c.id,
        title: tl(c.title, c.titleEn),
        place: (tl(c.subtitle, c.subtitleEn) ?? "").split(",").slice(-2).join(",").trim() || objAddress(c.payload?.placeId),
        text: plain(String(c.payload?.description ?? "")),
        image: c.imageUrl ?? "",
        href: c.href ?? undefined,
        objectId: typeof c.payload?.placeId === "string" ? c.payload.placeId : undefined,
      }))
      .sort((a, b) => rank(a.href) - rank(b.href));
  }, [cards, snap, tl]);
}
