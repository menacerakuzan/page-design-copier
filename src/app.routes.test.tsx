import { describe, it, beforeEach, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "@/App";
import { tableData } from "@/test/msw/handlers";
import { regionRow, districtRow, cityRow, objectRow, contentCardRow } from "@/test/fixtures";
import { loginTestAdmin } from "@/test/adminSession";

// Regression: drive the REAL lazy /admin route through <App/> to reproduce the
// browser "blue screen" (a runtime crash in the lazily-loaded Admin chunk).
beforeEach(() => {
  loginTestAdmin();
  window.history.pushState({}, "", "/admin");
  tableData.regions = [regionRow];
  tableData.districts = [districtRow];
  tableData.cities = [cityRow];
  tableData.tourism_objects = [objectRow];
  tableData.content_cards = [contentCardRow];
  tableData.routes = [];
  tableData.page_configs = [];
});

describe("App /admin lazy route", () => {
  it("renders the admin shell via the lazy route without throwing", async () => {
    render(<App />);
    await waitFor(
      () => expect(screen.getAllByText(/Райони|База даних/).length).toBeGreaterThan(0),
      { timeout: 8000 },
    );
  });
});
