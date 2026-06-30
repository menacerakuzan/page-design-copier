# Tourism Site — Refactor Plan & Audit

> Branch: `refactor/cleanup`. Method agreed with owner: **build a test safety net first, then refactor aggressively** (architecture, UX, data layer — all fair game). TypeScript currently passes (`tsc --noEmit` = 0); there are effectively **no tests** (one placeholder).

---

## 1. Audit — what's wrong today

### 1.1 God-components (single functions with huge bodies)

| File | Lines | Biggest inner symbol | Problem |
|------|------:|----------------------|---------|
| `pages/Admin.tsx` | 2488 | `Admin` (1074), `RoutesAdmin` (470), `ArticlesAdmin` (246) | Shell + 4 separate admin apps + 10 reinvented UI primitives + chunked upload, all in one file |
| `pages/AdminPageEditor.tsx` | 1428 | `GalleryEditor` (268), `SectionEditor` (164), `ObjectOrderEditor` (164) | Page-layout editor with many inline sub-editors |
| `pages/EntityDetail.tsx` | 1194 | `EntityDetail` (967) | One component renders 4 entity types via `type` prop |
| `pages/Index.tsx` | 1079 | `Index` (1024) | Entire landing page in a single function |
| `pages/AdminConstructor.tsx` | 974 | `InterestingSection` (293), `AdminConstructor` (233) | Card constructor, inline sub-sections |
| `pages/DistrictPage.tsx` | 610 | `DistrictPage` (412) | ~Duplicate of CityPage |
| `pages/CityPage.tsx` | 559 | `CityPage` (394) | ~Duplicate of DistrictPage |
| `pages/NearbyPage.tsx` | 518 | `NearbyPage` (451) | MapLibre + Overpass geo logic |
| `components/RoutesOverlay.tsx` | 613 | — | |

### 1.2 Cross-cutting structural problems

1. **Bilingual fields duplicated by hand.** Every entity type (`Region`, `District`, `City`, `TourismObject`, `Route`, `ContentCardEntity`) and every admin form type carries parallel `name`/`nameEn`, `subtitle`/`subtitleEn`, `description`/`descriptionEn`, … There is a `langContext` + `i18n.ts` (static UI strings) + `translate.ts` (auto-translate API) but no shared model for "localized content field". Adding a language = editing dozens of types and forms.

2. **Three competing data sources** — confusing and now mostly obsolete:
   - PostgREST via `supabase-js` (the real backend).
   - `localStorage` fallback (`pageConfigRepository.readLocal/writeLocal`).
   - Hardcoded seed/fallback data (`data/hierarchyMockData.ts`, `data/contentCardsFallback.ts` 676 lines) returned when `isTableMissingError(...)` fires.
   Now that the DB is canonical, the table-missing/fallback branches are legacy resilience that hides bugs.

3. **`any` everywhere in the data layer.** `mapDbObject(row: any)`, `toDbObject`, `mapRow(row: any)`, `normalizePayload(payload: any)`, `payload: Record<string, any>`. No typed DB-row interfaces, so the PostgREST boundary is unchecked.

4. **Inconsistent repository style.** `adminRepository.ts` uses `export async function`; `pageConfigRepository.ts` and `routesRepository.ts` use `const = async () =>`. Mapping + CRUD + change-log + rollback are all flat in one 671-line file with three near-identical `insert/upsert/delete` blocks per entity.

5. **Overloaded `page_configs` table.** Stores both page-layout configs *and* route tag order (`saveRouteTagOrder` shoehorns into it). Two unrelated concerns on one table via magic `entity_type` values.

6. **State is prop-drilled, not stored.** `Admin` loads the hierarchy snapshot + content cards into local state and passes `contentCards/places/districts/cities` + `onCardsChange` callbacks down into `AdminConstructor` and `AdminPageEditor`. No store/context for admin data; public side uses React Query, admin side mutates local arrays imperatively — two different data paradigms.

7. **Module-level side effects.** `App.tsx` fires `queryClient.prefetchQuery(...)` at import time (lines 36–48), so importing the module hits the network. Belongs in an effect/loader.

### 1.3 Duplication catalog (delete-on-sight during refactor)

- `uid()` defined in **4 places**: `Admin.tsx`, `AdminConstructor.tsx`, `AdminPageEditor.tsx`, `types/pages.ts`.
- `applyFilter<T>()` copied in **3 pages**: `EntityDetail.tsx`, `DistrictPage.tsx`, `CityPage.tsx`.
- `ObjectSection` (~85 lines) duplicated in `DistrictPage.tsx` and `CityPage.tsx` — these two pages are ~the same component.
- `slugify()` in `Admin.tsx` (and validation in `adminValidation.ts`).
- Reinvented form primitives in `Admin.tsx` (`Input`, `Textarea`, `FormSelect`, `Label`, `SaveBtn`, `FieldGroup`) that **shadow the existing shadcn kit** in `components/ui/`.
- Duplicate/overlapping type taxonomies: `CardType` (8) vs `TourismObjectType` (4) vs `ContentThemeType` (4, == TourismObjectType) vs `PageType`/`PlacePageType`/`ConstructorTab`.
- Duplicate domain types: `Route` (`routesRepository.ts`) vs `RouteForm` (`Admin.tsx`); `Article`/`ArticleVideo` (`InfoPage.tsx`) vs `ArticleForm`/`ArticleVideo` (`Admin.tsx`).

### 1.4 Dead / legacy code (safe to remove early)

- `data/adminMockData.ts` — **imported by nobody**. Delete.
- `adminRepository.syncContentCardsFromFallback` — **called by nobody**. Delete.
- `data/hierarchyMockData.ts` — only feeds the `isTableMissingError` fallback in `adminRepository` + `Admin.tsx` seed. Remove with the fallback path.
- `data/contentCardsFallback.ts` (676 lines) — feeds the same fallback **and** is read directly by `SiteFooter.tsx` (footer renders hardcoded cards instead of querying). Untangle footer, then delete.
- Minimal litter otherwise: 1 `console.*` (`routesRepository.ts`), 2 TODO/HACK markers. The rot is architectural, not stray debug.

---

## 2. Target architecture

```
src/
  app/                 # App shell, router, providers (no module-level side effects)
  domain/              # Pure types + helpers (hierarchy, cms, pages, routes, article)
    types.ts
    localized.ts       # one model for bilingual fields (uk/en) + helpers
  data/                # repository layer only (typed DB rows -> domain)
    client.ts          # supabase client
    rows.ts            # typed PostgREST row interfaces (kills `any`)
    hierarchyRepo.ts  cardsRepo.ts  objectsRepo.ts  routesRepo.ts  pageConfigRepo.ts
    changeLog.ts
  features/
    admin/             # admin shell + one folder per section
      hierarchy/  cards/  articles/  routes/  pageEditor/  constructor/
      ui/              # admin-only shared widgets (MediaField, EntityCard, forms)
      adminStore.ts    # one source of truth for admin data (replaces prop-drilling)
    public/
      home/  district/  city/  entityDetail/  routes/  nearby/  info/  types/
      components/      # shared: ObjectSection, ObjectCard, applyFilter, gallery...
  components/ui/        # shadcn kit (leave as-is)
  hooks/  lib/          # cn, geo, i18n, translate, weather...
```

Principles: one component = one job; shared UI from `components/ui`; the data layer is the only place that talks to PostgREST and the only place that knows DB column names; bilingual handled by a single `Localized<T>` model, not parallel fields.

---

## 3. Phased plan (priority order)

### Phase 0 — Safety net (do first)
- Wire Vitest + Testing Library (already present) and add a `typecheck` script.
- Tests that pin **current behavior** before we change it:
  - Data layer: mappers `mapDbObject/toDbObject`, `mapDbCard/toDbCard`, `mapRow/toRow` round-trip; `applyFilter`, `slugify`, `geo` (`extractCoordsFromUrl`, `haversineKm`), `parseRepertoire`.
  - Repos against a mocked supabase client (query shape + fallback behavior).
  - Smoke render: `Index`, `EntityDetail`, `DistrictPage`, `CityPage` mount with mocked data without throwing.
  - One e2e-ish admin flow (optional, Playwright): login → edit a place → save.
- Add CI-style local gate: `npm run typecheck && npm test`.

### Phase 1 — Quick wins / dead code (low risk)
- Delete `data/adminMockData.ts`, `syncContentCardsFromFallback`, the stray `console.*`.
- De-duplicate trivially: single `uid()` and `slugify()` in `lib/`; single `applyFilter` in `features/public/components`.
- Merge `DistrictPage` + `CityPage` shared `ObjectSection`/`applyFilter` into one shared module.

### Phase 2 — Data layer (foundation for everything)
- Add typed PostgREST row interfaces (`data/rows.ts`); remove `any` from mappers.
- Split `adminRepository.ts` into per-entity repos with a shared generic `insert/upsert/delete`.
- Decide fallback policy: drop `isTableMissingError` + seed/fallback data now that the DB is canonical (or gate behind an explicit dev flag). Make `SiteFooter` query real data.
- Unify repo style (`export async function`); move route tag order off `page_configs` or document it.

### Phase 3 — Shared model + extraction
- Introduce `Localized<T>` bilingual model; collapse `*En` parallel fields; update mappers + forms.
- Unify overlapping enums (`CardType`/`TourismObjectType`/`ContentThemeType`).
- De-duplicate `Route`/`RouteForm` and `Article`/`ArticleForm` into single domain types.

### Phase 4 — Admin split (highest LOC win)
- Break `Admin.tsx` into shell + section feature folders; reuse shadcn UI; extract `MediaField`/chunked upload into one module.
- Introduce `adminStore` (context or zustand) to replace prop-drilling into `AdminConstructor`/`AdminPageEditor`.

### Phase 5 — Public pages
- Decompose `Index` (1024) and `EntityDetail` (967) into section components; move section logic into per-section files.
- Move `App.tsx` prefetch into a loader/effect.

### Phase 6 — Polish
- Tighten ESLint, remove remaining `any`, consistent file/feature naming, dead-export sweep.

---

## 4. Risks & guardrails
- **No behavior change without a test that captured the old behavior** (Phase 0 gates the rest).
- Keep `tsc --noEmit` green after every step; run the app (`scripts/start-local-backend.sh` + `npm run dev`) to eyeball admin save + public render.
- Land each phase as its own set of commits on `refactor/cleanup`; the app must boot at every commit.
- Media uploads need the external storage-server (not local) — don't treat upload failures as regressions locally.
