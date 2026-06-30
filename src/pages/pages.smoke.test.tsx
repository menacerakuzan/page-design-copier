import { describe, it, beforeEach, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderRoute } from "@/test/render";
import { tableData } from "@/test/msw/handlers";
import { regionRow, districtRow, cityRow, objectRow, contentCardRow } from "@/test/fixtures";
import DistrictsPage from "./DistrictsPage";
import DistrictPage from "./DistrictPage";
import CityPage from "./CityPage";
import EntityDetail from "./EntityDetail";

/**
 * Smoke tests: each heavy public page must mount with real (MSW-backed) data and
 * render its primary entity without throwing. These guard the big decompositions
 * planned for Index/EntityDetail/District/City.
 */
beforeEach(() => {
  tableData.regions = [regionRow];
  tableData.districts = [districtRow];
  tableData.cities = [cityRow];
  tableData.tourism_objects = [objectRow];
  tableData.content_cards = [contentCardRow];
  tableData.page_configs = [];
});

const opts = { timeout: 4000 };

describe("public pages smoke", () => {
  it("DistrictsPage lists districts", async () => {
    renderRoute("/districts", "/districts", <DistrictsPage />);
    expect((await screen.findAllByText(/Одеський район/, undefined, opts)).length).toBeGreaterThan(0);
  });

  it("DistrictPage renders its district", async () => {
    renderRoute("/raion/:districtSlug", "/raion/odeskyi", <DistrictPage />);
    expect((await screen.findAllByText(/Одеський район/, undefined, opts)).length).toBeGreaterThan(0);
  });

  it("CityPage renders its city", async () => {
    renderRoute("/napryamky/:citySlug", "/napryamky/bilyaivka", <CityPage />);
    expect((await screen.findAllByText(/Біляївка/, undefined, opts)).length).toBeGreaterThan(0);
  });

  it("EntityDetail renders the attraction", async () => {
    renderRoute("/mistse/:slug", "/mistse/muzei", <EntityDetail type="attraction" />);
    expect((await screen.findAllByText(/Музей/, undefined, opts)).length).toBeGreaterThan(0);
  });
});
