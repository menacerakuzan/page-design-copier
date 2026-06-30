/**
 * Repository for PageConfig — section-layout configurations for entity pages,
 * persisted in the `page_configs` table via PostgREST.
 */

import { supabase } from "@/lib/supabaseClient";
import { PageConfig, PageEntityType, makeDefaultConfig } from "@/types/pages";

// ─── Load all configs ─────────────────────────────────────────────────────────

export const loadPageConfigs = async (): Promise<PageConfig[]> => {
  const { data, error } = await supabase
    .from("page_configs")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToConfig);
};

// ─── Get or create config ─────────────────────────────────────────────────────

export const getOrCreatePageConfig = async (
  entityType: PageEntityType,
  entityId: string,
): Promise<PageConfig> => {
  const all = await loadPageConfigs();
  const existing = all.find(c => c.entityType === entityType && c.entityId === entityId);
  if (existing) return existing;
  const fresh = makeDefaultConfig(entityType, entityId);
  await upsertPageConfig(fresh);
  return fresh;
};

// ─── Upsert config ────────────────────────────────────────────────────────────

export const upsertPageConfig = async (config: PageConfig): Promise<void> => {
  const updated: PageConfig = { ...config, updatedAt: new Date().toISOString() };
  const { error } = await supabase
    .from("page_configs")
    .upsert(configToRow(updated), { onConflict: "entity_type,entity_id" });
  if (error) throw error;
};

// ─── Get config for frontend display (no auto-create) ────────────────────────

/**
 * Get page config for displaying on the frontend. Falls back to the "default"
 * template for that entity type, then to the hardcoded defaults — does NOT write.
 */
export const getPageConfigForDisplay = async (
  entityType: PageEntityType,
  entityId: string,
): Promise<PageConfig> => {
  const all = await loadPageConfigs();
  const specific = all.find(c => c.entityType === entityType && c.entityId === entityId);
  if (specific) return specific;
  const def = all.find(c => c.entityType === entityType && c.entityId === "default");
  if (def) return def;
  return makeDefaultConfig(entityType, entityId);
};

// ─── Delete config ────────────────────────────────────────────────────────────

export const deletePageConfig = async (entityType: PageEntityType, entityId: string): Promise<void> => {
  const { error } = await supabase
    .from("page_configs")
    .delete()
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);
  if (error) throw error;
};

// ─── Row ↔ Config mappers ─────────────────────────────────────────────────────

const rowToConfig = (row: Record<string, unknown>): PageConfig => ({
  id: row.id as string,
  entityType: row.entity_type as PageEntityType,
  entityId: row.entity_id as string,
  sections: JSON.parse((row.sections_json as string) ?? "[]"),
  updatedAt: row.updated_at as string,
});

const configToRow = (c: PageConfig) => ({
  id: c.id,
  entity_type: c.entityType,
  entity_id: c.entityId,
  sections_json: JSON.stringify(c.sections),
  updated_at: c.updatedAt,
});
