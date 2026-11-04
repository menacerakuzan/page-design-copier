import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHierarchySnapshot } from "@/hooks/useHierarchySnapshot";
import { loadRoutes, ROUTE_TAG_OPTIONS, type Route } from "@/lib/routesRepository";
import { objectDetailPath } from "@/lib/entityLinks";
import { useV2 } from "@/v2/i18n";

/** Зупинка маршруту — туристичний об'єкт із фото й координатами. */
export type Stop = { id: string; name: string; image?: string; href: string; place: string; lat?: number; lng?: number };

/** Маршрути + їхні зупинки (об'єкти зі знімка) + підписи. */
export function useRoutesData() {
  const { t, tl, lang } = useV2();
  const { data: routes } = useQuery({ queryKey: ["routes-published"], queryFn: () => loadRoutes(true) });
  const { data: snap } = useHierarchySnapshot();

  const stopsOf = useMemo(() => {
    const byId = new Map((snap?.objects ?? []).map((o) => [o.id, o]));
    const cache = new Map<string, Stop[]>();
    return (r: Route): Stop[] => {
      if (cache.has(r.id)) return cache.get(r.id)!;
      const list = (r.objectIds ?? [])
        .map((id) => byId.get(id))
        .filter((o): o is NonNullable<typeof o> => !!o)
        .map((o) => ({
          id: o.id,
          name: tl(o.name, o.nameEn),
          image: o.imageUrl,
          href: objectDetailPath(o.type, o.slug),
          // Адреса коротко: перші дві частини («м. Білгород-Дністровський, вул. …»).
          place: (tl(o.address, o.addressEn) ?? "").split(",").slice(0, 2).join(",").trim(),
          lat: o.latitude ?? undefined,
          lng: o.longitude ?? undefined,
        }));
      cache.set(r.id, list);
      return list;
    };
  }, [snap, tl]);

  const tagLabel = (id: string) => {
    const o = ROUTE_TAG_OPTIONS.find((x) => x.id === id);
    return o ? (lang === "en" ? o.labelEn : o.label) : id;
  };

  /** 1 зупинка · 2 зупинки · 5 зупинок. */
  const stopsWord = (n: number) => {
    if (lang === "en") return n === 1 ? "stop" : "stops";
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return "зупинка";
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "зупинки";
    return "зупинок";
  };

  return { routes: routes ?? [], ready: !!routes && !!snap, stopsOf, tagLabel, stopsWord, t, tl, lang };
}

export type RoutesData = ReturnType<typeof useRoutesData>;
