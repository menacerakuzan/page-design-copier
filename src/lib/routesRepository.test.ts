import { describe, it, expect } from "vitest";
import { loadRoutes, saveRouteTagOrder } from "@/lib/routesRepository";
import { tableData, capturedRequests } from "@/test/msw/handlers";

const routeRow = {
  id: "route-1",
  name: "Винний шлях",
  name_en: "Wine route",
  description: "опис",
  image_url: "https://img/route.jpg",
  map_url: "https://maps/1",
  map_url_2: "https://maps/2",
  object_ids: ["obj-1", "obj-2"],
  waypoint_object_ids: ["obj-1", null],
  tags: ["wine", "gastro"],
  published: true,
  sort_order: 5,
};

describe("loadRoutes", () => {
  it("maps DB rows to Route domain objects", async () => {
    tableData.routes = [routeRow];
    const routes = await loadRoutes();
    expect(routes[0]).toMatchObject({
      id: "route-1",
      name: "Винний шлях",
      nameEn: "Wine route",
      mapUrl2: "https://maps/2",
      objectIds: ["obj-1", "obj-2"],
      waypointObjectIds: ["obj-1", null],
      tags: ["wine", "gastro"],
      published: true,
      sortOrder: 5,
    });
  });

  it("adds published filter only when publishedOnly is set", async () => {
    tableData.routes = [];
    await loadRoutes(true);
    const req = capturedRequests.find((r) => r.table === "routes");
    expect(req?.search).toContain("published=eq.true");
    expect(req?.search).toContain("order=sort_order");
  });
});

describe("saveRouteTagOrder", () => {
  it("upserts the order into content_cards under the settings id", async () => {
    tableData.content_cards = [];
    await saveRouteTagOrder(["wine", "gastro", "beach"]);
    const req = capturedRequests.find((r) => r.table === "content_cards" && r.method === "POST");
    expect(req).toBeTruthy();
    expect(req?.body).toMatchObject({
      id: "route-tag-order-settings",
      page_key: "settings",
      payload: { order: ["wine", "gastro", "beach"] },
    });
  });
});
