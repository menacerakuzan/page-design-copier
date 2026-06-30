import { describe, it, expect } from "vitest";
import { applyFilter } from "@/lib/pageSections";

const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("applyFilter", () => {
  it("returns all items unchanged without a filter", () => {
    expect(applyFilter(items)).toEqual(items);
  });

  it("selects entityIds in the configured order", () => {
    expect(applyFilter(items, { entityIds: ["c", "a"] })).toEqual([{ id: "c" }, { id: "a" }]);
  });

  it("drops ids that no longer exist", () => {
    expect(applyFilter(items, { entityIds: ["c", "zzz", "a"] })).toEqual([{ id: "c" }, { id: "a" }]);
  });

  it("applies limit after selection", () => {
    expect(applyFilter(items, { limit: 2 })).toEqual([{ id: "a" }, { id: "b" }]);
  });
});
