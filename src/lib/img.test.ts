import { describe, it, expect } from "vitest";
import { resizedImageUrl } from "./img";

describe("resizedImageUrl", () => {
  it("rewrites a relative storage object URL to the render endpoint", () => {
    expect(resizedImageUrl("/storage/v1/object/public/media/a.jpg", 400)).toBe(
      "/storage/v1/render/image/public/media/a.jpg?width=400&quality=70",
    );
  });

  it("rewrites an absolute storage object URL, preserving the origin", () => {
    expect(
      resizedImageUrl("https://cdn.example.com/storage/v1/object/public/media/a.png", 800, 75),
    ).toBe("https://cdn.example.com/storage/v1/render/image/public/media/a.png?width=800&quality=75");
  });

  it("passes external (non-storage) URLs through unchanged", () => {
    const ext = "https://images.unsplash.com/photo-123.jpg";
    expect(resizedImageUrl(ext, 400)).toBe(ext);
  });

  it("returns empty string for nullish input", () => {
    expect(resizedImageUrl(null, 400)).toBe("");
    expect(resizedImageUrl(undefined, 400)).toBe("");
  });
});
