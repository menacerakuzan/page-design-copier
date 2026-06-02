import { useEffect, useMemo, useState } from "react";
import { PageConfig, PageEntityType, makeDefaultConfig } from "@/types/pages";
import { getPageConfigForDisplay } from "@/lib/pageConfigRepository";

/**
 * Load page configuration for a given entity.
 * Falls back to the "default" template, then hardcoded defaults.
 * Never writes to the database — read-only display hook.
 */
export const usePageConfig = (
  entityType: PageEntityType,
  entityId: string | null | undefined,
) => {
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getPageConfigForDisplay(entityType, entityId)
      .then((cfg) => {
        if (!cancelled) {
          setConfig(cfg);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityType, entityId]);

  /** Config with fallback to hardcoded defaults while loading */
  const displayConfig = useMemo(
    () => config ?? (entityId ? makeDefaultConfig(entityType, entityId) : null),
    [config, entityType, entityId],
  );

  return { config: displayConfig, loading };
};
