import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { loadDetails, loadHierarchySnapshot, loadPublicSnapshot, loadPublishedContentCards, upsertTourismObject, upsertDistrict } from "@/lib/adminRepository";
import { server } from "@/test/msw/server";
import { tableData, capturedRequests } from "@/test/msw/handlers";
import { regionRow, districtRow, cityRow, objectRow, contentCardRow } from "@/test/fixtures";
import type { TourismObject, District } from "@/types/hierarchy";

/**
 * Characterization tests for the read path. They pin the current snake_case →
 * camelCase mapping and the outgoing PostgREST request shape, so the planned
 * rewrite of the data layer (and the supabase-js → fetch swap) can be verified
 * against unchanged expectations.
 */
describe("loadHierarchySnapshot", () => {
  it("maps every table from DB rows into domain objects", async () => {
    tableData.regions = [regionRow];
    tableData.districts = [districtRow];
    tableData.cities = [cityRow];
    tableData.tourism_objects = [objectRow];
    tableData.content_cards = [contentCardRow];

    const snap = await loadHierarchySnapshot();

    expect(snap.regions).toEqual([{ id: "reg-1", name: "Одеська область", slug: "odeska" }]);

    expect(snap.districts[0]).toMatchObject({
      id: "dist-1",
      regionId: "reg-1",
      name: "Одеський район",
      nameEn: "Odesa district",
      slug: "odeskyi",
      sortOrder: 2,
      imageUrl: "https://img/dist.jpg",
    });

    expect(snap.cities[0]).toMatchObject({
      id: "city-1",
      districtId: "dist-1",
      name: "Біляївка",
      settlementType: "місто",
      weatherCityName: "Bilyaivka",
      sortOrder: 1,
    });

    expect(snap.objects[0]).toMatchObject({
      id: "obj-1",
      districtId: "dist-1",
      cityId: "city-1",
      type: "attraction",
      name: "Музей",
      nameEn: "Museum",
      published: true,
      tourismTypes: ["culture"],
      venueId: "venue-1",
      heroFontSize: "48px",
    });

    expect(snap.contentCards[0]).toMatchObject({
      id: "card-1",
      pageKey: "index",
      sectionKey: "directions",
      cardType: "destination",
      title: "Напрямок",
      districtId: "dist-1",
      cityId: null,
      sortOrder: 3,
      published: true,
      payload: { badge: "new" },
    });
  });

  it("requests the expected tables with ordering", async () => {
    await loadHierarchySnapshot();
    const tables = capturedRequests.filter((r) => r.method === "GET").map((r) => r.table);
    expect(tables).toEqual(
      expect.arrayContaining(["regions", "districts", "cities", "tourism_objects", "content_cards"]),
    );
    const districts = capturedRequests.find((r) => r.table === "districts");
    expect(districts?.search).toContain("order=sort_order");
  });
});

describe("loadPublicSnapshot (легкий знімок)", () => {
  const selectOf = (table: string) =>
    decodeURIComponent(new URLSearchParams(capturedRequests.find((r) => r.table === table && r.method === "GET")?.search).get("select") ?? "");

  it("не запитує повні описи й картки, але бере всі інші колонки, які читає маппер", async () => {
    tableData.regions = [regionRow];
    tableData.districts = [districtRow];
    tableData.cities = [cityRow];
    tableData.tourism_objects = [objectRow];

    const snap = await loadPublicSnapshot();

    const tables = capturedRequests.filter((r) => r.method === "GET").map((r) => r.table);
    expect(tables).not.toContain("content_cards");
    for (const t of ["districts", "cities", "tourism_objects"]) {
      const cols = selectOf(t).split(",");
      expect(cols).not.toContain("detailed_info");
      expect(cols).not.toContain("detailed_info_en");
      expect(cols).not.toContain("*");
    }
    // Ключові для сторінок поля — на місці
    expect(selectOf("tourism_objects").split(",")).toEqual(
      expect.arrayContaining(["id", "slug", "type", "name", "description", "description_en", "image_url", "latitude", "longitude", "map_url", "event_dates", "repertoire", "tourism_types", "venue_id"]),
    );
    expect(selectOf("cities").split(",")).toEqual(expect.arrayContaining(["id", "district_id", "slug", "description", "weather_city_name", "settlement_type"]));
    expect(selectOf("districts").split(",")).toEqual(expect.arrayContaining(["id", "region_id", "slug", "description", "sort_order"]));

    // Мапінг той самий, що й у повного знімка, — мінус повні описи
    const full = await loadHierarchySnapshot();
    const { detailedInfo: _o1, detailedInfoEn: _o2, ...objectLight } = full.objects[0];
    expect(snap.objects[0]).toEqual(objectLight);
    const { detailedInfo: _c1, ...cityLight } = full.cities[0];
    expect(snap.cities[0]).toEqual(cityLight);
    const { detailedInfo: _d1, ...districtLight } = full.districts[0];
    expect(snap.districts[0]).toEqual(districtLight);
    expect("detailedInfo" in snap.objects[0]).toBe(false);
  });

  it("якщо легкий запит падає (немає колонки на старій базі) — повторює select=* і все одно працює", async () => {
    tableData.regions = [regionRow];
    tableData.districts = [districtRow];
    tableData.cities = [cityRow];
    tableData.tourism_objects = [objectRow];
    server.use(
      http.get("*/rest/v1/tourism_objects", ({ request }) => {
        const sel = new URL(request.url).searchParams.get("select");
        if (sel !== "*") return HttpResponse.json({ message: "column does not exist" }, { status: 400 });
        return HttpResponse.json([objectRow]);
      }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const snap = await loadPublicSnapshot();

    expect(snap.objects[0]).toMatchObject({ id: "obj-1", name: "Музей" });
    // навіть із select=* повні описи в легкий знімок не потрапляють
    expect("detailedInfo" in snap.objects[0]).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("loadDetails", () => {
  it("бере повний опис місця за slug і типом", async () => {
    tableData.tourism_objects = [objectRow];
    const d = await loadDetails("object", "muzei", "attraction");
    expect(d).toEqual({ id: "obj-1", detailedInfo: "детально", detailedInfoEn: "details" });
    const req = capturedRequests.find((r) => r.table === "tourism_objects");
    expect(req?.search).toContain("slug=eq.muzei");
    expect(req?.search).toContain("type=eq.attraction");
    expect(decodeURIComponent(req?.search ?? "")).toContain("select=id,detailed_info,detailed_info_en");
  });

  it("місто й район — лише detailed_info; немає запису — null", async () => {
    tableData.cities = [cityRow];
    expect(await loadDetails("city", "bilyaivka")).toEqual({ id: "city-1", detailedInfo: "детально про місто", detailedInfoEn: undefined });
    tableData.districts = [];
    expect(await loadDetails("district", "nema")).toBeNull();
  });
});

describe("loadPublishedContentCards", () => {
  it("filters by page_key + published and maps the rows", async () => {
    tableData.content_cards = [contentCardRow];

    const cards = await loadPublishedContentCards("index");

    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ id: "card-1", pageKey: "index", published: true });

    const req = capturedRequests.find((r) => r.table === "content_cards");
    expect(req?.search).toContain("page_key=eq.index");
    expect(req?.search).toContain("published=eq.true");
  });
});

describe("write path", () => {
  it("upsertTourismObject posts snake_case columns and writes a change log", async () => {
    tableData.tourism_objects = []; // nothing existing -> action "create"
    tableData.admin_change_logs = [];
    const obj = {
      id: "obj-9", districtId: "dist-1", cityId: "city-1", type: "attraction",
      name: "Новий", nameEn: "New", slug: "novyi", published: true, tourismTypes: [],
    } as TourismObject;

    await upsertTourismObject(obj);

    const post = capturedRequests.find((r) => r.table === "tourism_objects" && r.method === "POST");
    expect(post?.body).toMatchObject({
      id: "obj-9", name: "Новий", name_en: "New",
      district_id: "dist-1", city_id: "city-1", published: true,
    });
    const log = capturedRequests.find((r) => r.table === "admin_change_logs" && r.method === "POST");
    expect(log?.body).toMatchObject({ entity_type: "tourism_object", entity_id: "obj-9", action: "create" });
  });

  it("upsertDistrict posts snake_case columns", async () => {
    tableData.districts = [];
    tableData.admin_change_logs = [];
    const d = { id: "dist-9", regionId: "reg-1", name: "Район", nameEn: "District", slug: "raion" } as District;

    await upsertDistrict(d);

    const post = capturedRequests.find((r) => r.table === "districts" && r.method === "POST");
    expect(post?.body).toMatchObject({
      id: "dist-9", region_id: "reg-1", name: "Район", name_en: "District", slug: "raion",
    });
  });
});
