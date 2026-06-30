import type { PageSection } from "@/types/pages";

/**
 * Apply a section's entity filter to a list: when `entityIds` is set, return
 * exactly those items **in the configured order** (dropping any that no longer
 * exist), then cap by `limit`. Shared by the district / city / entity-detail
 * pages so list ordering is consistent everywhere it's editable in the CMS.
 */
export function applyFilter<T extends { id: string }>(
  items: T[],
  filter?: PageSection["filter"],
): T[] {
  let result = items;
  if (filter?.entityIds?.length) {
    const byId = new Map(items.map((i) => [i.id, i]));
    result = filter.entityIds.map((id) => byId.get(id)).filter(Boolean) as T[];
  }
  if (filter?.limit) result = result.slice(0, filter.limit);
  return result;
}
