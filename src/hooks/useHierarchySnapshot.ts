import { useQuery } from "@tanstack/react-query";
import { loadHierarchySnapshot, loadPublicSnapshot } from "@/lib/adminRepository";

/**
 * Знімок для публічних сторінок — легкий: без повних описів (їх дає useDetails)
 * і без карток сторінок (їх дає usePageContentCards).
 */
export function useHierarchySnapshot() {
  return useQuery({
    queryKey: ["hierarchy-snapshot"],
    queryFn: () => loadPublicSnapshot(),
    staleTime: 30_000,
  });
}

/**
 * Повний знімок — ЛИШЕ для адмінки: з повними описами й картками всіх сторінок.
 * Адмінка редагує й зберігає об'єкти цілком, тож легкий знімок там призвів би
 * до затирання описів. Ключ — під "hierarchy-snapshot", тож
 * invalidateQueries(["hierarchy-snapshot"]) оновлює обидва.
 */
export function useFullHierarchySnapshot() {
  return useQuery({
    queryKey: ["hierarchy-snapshot", "full"],
    queryFn: () => loadHierarchySnapshot(),
    staleTime: 30_000,
  });
}
