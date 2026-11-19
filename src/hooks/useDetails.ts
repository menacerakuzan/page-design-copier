import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadDetails, type DetailsKind } from "@/lib/adminRepository";
import type { Details } from "@/types/hierarchy";

/**
 * Повний опис місця / міста / району — окремим маленьким запитом за slug
 * (у публічному знімку його немає). Іде паралельно зі знімком.
 */
export function useDetails(kind: DetailsKind, slug: string | undefined, type?: string) {
  return useQuery({
    queryKey: ["details", kind, slug, type ?? null],
    queryFn: () => loadDetails(kind, slug!, type),
    enabled: !!slug,
  });
}

/**
 * Додає до запису зі знімка його повний опис (коли він уже прийшов і це саме
 * той запис). Посилання стабільне, поки не змінились вхідні дані.
 */
export function useWithDetails<T extends { id: string }>(base: T | undefined, kind: DetailsKind, slug: string | undefined, type?: string): (T & Details) | undefined {
  const { data } = useDetails(kind, slug, type);
  return useMemo(() => {
    if (!base) return undefined;
    if (!data || data.id !== base.id) return base;
    return { ...base, detailedInfo: data.detailedInfo, detailedInfoEn: data.detailedInfoEn };
  }, [base, data]);
}
