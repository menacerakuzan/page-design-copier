import { describe, it, beforeEach, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderRoute } from "@/test/render";
import { tableData } from "@/test/msw/handlers";
import { regionRow, districtRow, cityRow, objectRow, contentCardRow } from "@/test/fixtures";
import Admin from "./Admin";

/**
 * Safety net for the Admin god-component before it is split into per-section
 * modules: with a logged-in session and MSW-backed data, the admin shell must
 * mount and render its section navigation without throwing.
 */
beforeEach(() => {
  sessionStorage.setItem("tourism_admin_session", "1");
  tableData.regions = [regionRow];
  tableData.districts = [districtRow];
  tableData.cities = [cityRow];
  tableData.tourism_objects = [objectRow];
  tableData.content_cards = [contentCardRow];
  tableData.routes = [];
  tableData.page_configs = [];
});

describe("Admin shell smoke", () => {
  it("mounts past the login gate and shows the section nav", async () => {
    renderRoute("/admin", "/admin", <Admin />);
    expect((await screen.findAllByText(/Райони/, undefined, { timeout: 5000 })).length).toBeGreaterThan(0);
  });
});
