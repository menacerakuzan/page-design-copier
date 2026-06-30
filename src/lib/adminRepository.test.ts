import { describe, it, expect } from "vitest";
import { loadHierarchySnapshot, loadPublishedContentCards, upsertTourismObject, upsertDistrict } from "@/lib/adminRepository";
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
